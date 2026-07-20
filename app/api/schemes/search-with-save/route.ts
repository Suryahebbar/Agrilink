import path from "path";
import fs from "fs";
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import FarmerSchemeProfile, { IFarmerSchemeProfile } from '../../../../models/FarmerSchemeProfile';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bpfis';

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
}

const normalizeKey = (s: string) => String(s).trim().toLowerCase().replace(/\s+/g, "_");

function parseNumeric(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v;
  const n = Number(String(v).replace(/[,₹\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function matchCellAgainstInput(cellRaw: any, inputRaw: any, header: string): boolean {
  // empty cell -> treat as no condition (pass)
  if (cellRaw === null || cellRaw === undefined || String(cellRaw).trim() === "") return true;

  const cell = String(cellRaw).trim();
  if (cell.toLowerCase() === "any" || cell === "-") return true;

  // if input is empty -> we can't evaluate condition so treat as "no restriction" (pass)
  if (inputRaw === undefined || inputRaw === null || String(inputRaw).trim() === "") return true;

  const input = String(inputRaw).trim();

  // Numeric comparisons
  const cellNum = parseNumeric(cell);
  const inputNum = parseNumeric(input);

  // ranges like "10-50"
  if (/^\s*-?\d+(\.\d+)?\s*-\s*-?\d+(\.\d+)?\s*$/.test(cell)) {
    const [min, max] = cell.split("-").map(x => Number(x.trim()));
    if (inputNum === null) return false;
    return inputNum >= min && inputNum <= max;
  }

  // operators like <=100, >=50, <30, >5
  const opMatch = cell.match(/^(<=|>=|<|>)\s*([0-9,.\s₹]+)$/);
  if (opMatch) {
    const op = opMatch[1];
    const val = parseNumeric(opMatch[2]);
    if (inputNum === null || val === null) return false;
    if (op === "<=") return inputNum <= val;
    if (op === ">=") return inputNum >= val;
    if (op === "<") return inputNum < val;
    if (op === ">") return inputNum > val;
  }

  // if header contains 'max' or 'upper' -> treat cell as upper bound
  if (/\b(max|upper|<=)\b/i.test(header)) {
    if (cellNum !== null && inputNum !== null) return inputNum <= cellNum;
  }
  // if header contains 'min' or 'lower' -> treat cell as lower bound
  if (/\b(min|lower|>=)\b/i.test(header)) {
    if (cellNum !== null && inputNum !== null) return inputNum >= cellNum;
  }

  // if both numeric and cell is a number -> equal check (or use header heuristics)
  if (cellNum !== null && inputNum !== null) {
    return inputNum === cellNum;
  }

  // lists (comma-separated) -> check membership
  if (cell.includes(",")) {
    const options = cell.split(",").map(x => x.trim().toLowerCase());
    return options.includes(input.toLowerCase());
  }

  // boolean-like values (yes/no, true/false)
  if (/^(yes|no|true|false)$/i.test(cell) && /^(yes|no|true|false)$/i.test(input)) {
    return cell.toLowerCase() === input.toLowerCase();
  }

  // partial match (case-insensitive) - for strings like 'small/marginal' or 'bpl' etc.
  if (input.toLowerCase().includes(cell.toLowerCase()) || cell.toLowerCase().includes(input.toLowerCase())) {
    return true;
  }

  // fallback exact case-insensitive match
  return cell.toLowerCase() === input.toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { farmerInput, saveProfile, profileName, userId } = body;

    // Normalize farmer input keys
    const normalizedInput: Record<string, any> = {};
    for (const k of Object.keys(farmerInput)) {
      const nk = normalizeKey(k);
      normalizedInput[nk] = farmerInput[k];
    }

    // Read Excel file
    const filePath = path.resolve(process.cwd(), "Government_Scheme_Applicability_Dataset.xlsx");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Excel file not found at project root." }, { status: 500 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const xlsx = await import('xlsx');
    const wb = xlsx.read(fileBuffer);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    // Precompute header keys map
    const headers = Object.keys((rows as any)[0] || {});
    const headerKeys = headers.map(h => ({ label: h, key: normalizeKey(h) }));

    const eligible: any[] = [];

    // Match schemes against farmer input
    (rows as any[]).forEach((row: any) => {
      let ok = true;

      for (const { label, key } of headerKeys) {
        if (/scheme name/i.test(label) || /scheme link/i.test(label)) {
          continue;
        }

        const cellRaw = (row as any)[label];
        const inputVal = normalizedInput[key];

        if (cellRaw === "" || cellRaw === null || cellRaw === undefined) continue;

        const matched = matchCellAgainstInput(cellRaw, inputVal, label);

        if (!matched) {
          ok = false;
          break;
        }
      }

      if (ok) {
        const nameLabel = headers.find(h => /scheme name/i.test(h)) || headers[0];
        const linkLabel = headers.find(h => /scheme link/i.test(h)) || null;

        eligible.push({
          name: (row as any)[nameLabel] || "Unnamed Scheme",
          link: linkLabel ? (row as any)[linkLabel] : undefined,
          raw: row
        });
      }
    });

    const searchResults = {
      eligibleSchemes: eligible,
      count: eligible.length,
      searchedAt: new Date()
    };

    // Save profile if requested
    let savedProfile = null;
    if (saveProfile && profileName && userId) {
      try {
        // Check if profile already exists
        const existingProfile = await FarmerSchemeProfile.findOne({
          userId,
          profileName: profileName.trim(),
          isActive: true
        });

        if (existingProfile) {
          // Update existing profile
          savedProfile = await FarmerSchemeProfile.findByIdAndUpdate(
            existingProfile._id,
            {
              profileData: farmerInput,
              $push: { searchResults: searchResults },
              updatedAt: new Date()
            },
            { new: true }
          );
        } else {
          // Create new profile
          savedProfile = await FarmerSchemeProfile.create({
            userId,
            profileName: profileName.trim(),
            profileData: farmerInput,
            searchResults: [searchResults],
            isDefault: false,
            isActive: true
          });
        }
      } catch (saveError: any) {
        console.error('Error saving profile:', saveError);
        // Don't fail the search if profile save fails
        return NextResponse.json({
          eligible,
          count: eligible.length,
          searchResults,
          profileSaveError: 'Failed to save profile: ' + saveError.message
        });
      }
    }

    return NextResponse.json({
      eligible,
      count: eligible.length,
      searchResults,
      savedProfile: savedProfile ? {
        _id: savedProfile._id,
        profileName: savedProfile.profileName,
        isDefault: savedProfile.isDefault,
        updatedAt: savedProfile.updatedAt
      } : null
    });

  } catch (err: any) {
    console.error('Error in search with save:', err);
    return NextResponse.json({ 
      error: err.message || "search failed" 
    }, { status: 500 });
  }
}
