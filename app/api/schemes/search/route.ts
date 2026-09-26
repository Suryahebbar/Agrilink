import path from "path";
import fs from "fs";
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Scheme from '@/lib/models/Scheme';

const normalizeKey = (s: string) => String(s).trim().toLowerCase().replace(/\s+/g, "_");

let cachedUnifiedSchemes: any[] | null = null;
let lastLoadedTime = 0;
const CACHE_TTL = 30000; // Cache for 30 seconds

function parseNumeric(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v;
  const n = Number(String(v).replace(/[,₹\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseOperatorAndValue(str: string): { op: string | null; val: number | null } {
  const clean = str.replace(/[,₹\s]/g, "");
  const match = clean.match(/^(<=|>=|<|>)\s*([0-9.]+)/);
  if (match) {
    return { op: match[1], val: Number(match[2]) };
  }
  // Try matching operators at the beginning of parsed string
  const opMatch = str.trim().match(/^(<=|>=|<|>)/);
  const cleanNum = Number(clean.replace(/^(<=|>=|<|>)/, ""));
  if (opMatch && Number.isFinite(cleanNum)) {
    return { op: opMatch[1], val: cleanNum };
  }
  const num = Number(clean);
  if (Number.isFinite(num)) {
    return { op: null, val: num };
  }
  return { op: null, val: null };
}

function matchCellAgainstInput(cellRaw: any, inputRaw: any, fieldKey: string): boolean {
  if (cellRaw === null || cellRaw === undefined || String(cellRaw).trim() === "") return true;

  const cell = String(cellRaw).trim();
  const cellLower = cell.toLowerCase();
  if (cellLower === "any" || cellLower === "-" || cellLower === "na") return true;

  if (inputRaw === undefined || inputRaw === null || String(inputRaw).trim() === "") return true;

  const input = String(inputRaw).trim();
  const inputLower = input.toLowerCase();

  // 1. Exact string match (case-insensitive)
  if (cellLower === inputLower) return true;

  // 2. Range match (e.g. cell is "10-50" or "2-5 acres")
  const rangeRegex = /^\s*([0-9.]+)\s*([-–—]|to)\s*([0-9.]+)/i;
  const cellRange = cell.replace(/acres|acre/gi, "").match(rangeRegex);
  const inputRange = input.replace(/acres|acre/gi, "").match(rangeRegex);

  const cellParsed = parseOperatorAndValue(cell);
  const inputParsed = parseOperatorAndValue(input);

  // If cell is a range (e.g. "2-5 acres")
  if (cellRange) {
    const cMin = Number(cellRange[1]);
    const cMax = Number(cellRange[3]);

    if (inputRange) {
      const iMin = Number(inputRange[1]);
      const iMax = Number(inputRange[3]);
      return iMin >= cMin && iMax <= cMax;
    }
    if (inputParsed.op && inputParsed.val !== null) {
      if (inputParsed.op === ">=") return inputParsed.val >= cMin;
      if (inputParsed.op === "<=") return inputParsed.val <= cMax;
    }
    if (inputParsed.val !== null && !inputParsed.op) {
      return inputParsed.val >= cMin && inputParsed.val <= cMax;
    }
    return false;
  }

  // If cell has an operator (e.g. "<= 200000" or ">= 2")
  if (cellParsed.op && cellParsed.val !== null) {
    const cOp = cellParsed.op;
    const cVal = cellParsed.val;

    if (inputParsed.op && inputParsed.val !== null) {
      const iOp = inputParsed.op;
      const iVal = inputParsed.val;

      if (cOp === "<" || cOp === "<=") {
        if (iOp === "<" || iOp === "<=") {
          return iVal <= cVal;
        }
      }
      if (cOp === ">" || cOp === ">=") {
        if (iOp === ">" || iOp === ">=") {
          return iVal >= cVal;
        }
      }
      return false;
    }

    if (inputRange) {
      const iMin = Number(inputRange[1]);
      const iMax = Number(inputRange[3]);
      if (cOp === ">" || cOp === ">=") return iMin >= cVal;
      if (cOp === "<" || cOp === "<=") return iMax <= cVal;
      return false;
    }

    if (inputParsed.val !== null) {
      const iVal = inputParsed.val;
      if (cOp === "<=") return iVal <= cVal;
      if (cOp === ">=") return iVal >= cVal;
      if (cOp === "<") return iVal < cVal;
      if (cOp === ">") return iVal > cVal;
    }
    return false;
  }

  // 3. Lists
  if (cell.includes(",") || cell.includes("/")) {
    const options = cell.split(/[,/]/).map(x => x.trim().toLowerCase());
    return options.includes(inputLower) || options.some(opt => opt === "both" || opt === "any" || opt === "all");
  }

  // Boolean match
  if (/^(yes|no|true|false)$/i.test(cell) && /^(yes|no|true|false)$/i.test(input)) {
    return cellLower === inputLower;
  }

  // Partial match fallback
  if (inputLower.includes(cellLower) || cellLower.includes(inputLower)) {
    return true;
  }

  return false;
}

function getUnifiedRow(row: any, category: string): any {
  const unified: Record<string, any> = {
    scheme_name: "",
    scheme_link: "",
    land_size: "",
    state: "",
    district: "",
    taluk: "",
    crop_type: "",
    season: "",
    irrigation_type: "",
    water_source_capacity: "",
    organic_certification: "",
    farmer_age: "",
    gender: "",
    income_category: "",
    pm_kisan: "",
    equipment_ownership: "",
    fpo_membership: "",
    insurance_status: "",
    disaster_affected: "",
    soil_type: "",
    farmer_category: "",
    category: category,
    raw: row
  };

  for (const rawKey of Object.keys(row)) {
    const normKey = rawKey.trim().toLowerCase();

    if (normKey === "scheme name") {
      unified.scheme_name = row[rawKey];
    } else if (normKey === "scheme link" || normKey === "official link") {
      unified.scheme_link = row[rawKey];
    } else if (normKey === "land size condition" || normKey === "land size") {
      unified.land_size = row[rawKey];
    } else if (normKey === "applicable states" || normKey === "location(state)") {
      unified.state = row[rawKey];
    } else if (normKey === "applicable districts" || normKey === "location(district)") {
      unified.district = row[rawKey];
    } else if (normKey === "location(taluk)") {
      unified.taluk = row[rawKey];
    } else if (normKey === "crop type") {
      unified.crop_type = row[rawKey];
    } else if (normKey === "season") {
      unified.season = row[rawKey];
    } else if (normKey === "irrigation type" || normKey === "irrigation") {
      unified.irrigation_type = row[rawKey];
    } else if (normKey === "water source capacity") {
      unified.water_source_capacity = row[rawKey];
    } else if (normKey === "organic certification") {
      unified.organic_certification = row[rawKey];
    } else if (normKey === "farmer age" || normKey === "age" || normKey === "age ") {
      unified.farmer_age = row[rawKey];
    } else if (normKey === "gender") {
      unified.gender = row[rawKey];
    } else if (normKey === "income category condition" || normKey === "income catogory" || normKey === "category") {
      if (normKey !== "category") {
        unified.income_category = row[rawKey];
      }
    } else if (normKey === "pm-kisan registration") {
      unified.pm_kisan = row[rawKey];
    } else if (normKey === "equipment ownership") {
      unified.equipment_ownership = row[rawKey];
    } else if (normKey === "fpo membership") {
      unified.fpo_membership = row[rawKey];
    } else if (normKey === "insurance status(pmfby)" || normKey === "insurance requirement") {
      unified.insurance_status = row[rawKey];
    } else if (normKey === "disaster region applicable" || normKey === "disaster-affected region") {
      unified.disaster_affected = row[rawKey];
    } else if (normKey === "soil type") {
      unified.soil_type = row[rawKey];
    } else if (normKey === "farmer category") {
      unified.farmer_category = row[rawKey];
    }
  }
  return unified;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const farmerInputRaw = await req.json();
    const farmerInput: Record<string, any> = {};
    for (const k of Object.keys(farmerInputRaw)) {
      const nk = normalizeKey(k);
      farmerInput[nk] = farmerInputRaw[k];
    }

    const now = Date.now();
    if (!cachedUnifiedSchemes || (now - lastLoadedTime > CACHE_TTL)) {
      // Self-seeding check
      const dbCount = await Scheme.countDocuments();
      if (dbCount === 0) {
        const xlsx = await import('xlsx');
        const allUnifiedSchemes: any[] = [];

        // Load File 1: Government_Scheme_Applicability_Dataset.xlsx
        const file1Path = path.resolve(process.cwd(), "Government_Scheme_Applicability_Dataset.xlsx");
        if (fs.existsSync(file1Path)) {
          const fileBuffer = fs.readFileSync(file1Path);
          const wb = xlsx.read(fileBuffer);
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
          rows.forEach((row: any) => {
            allUnifiedSchemes.push(getUnifiedRow(row, "General"));
          });
        }

        // Load File 2: GOVT_SCHEMES_LIST1.xlsx
        const file2Path = path.resolve(process.cwd(), "GOVT_SCHEMES_LIST1.xlsx");
        if (fs.existsSync(file2Path)) {
          const fileBuffer = fs.readFileSync(file2Path);
          const wb = xlsx.read(fileBuffer);
          wb.SheetNames.forEach((sheetName) => {
            const sheet = wb.Sheets[sheetName];
            const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
            rows.forEach((row: any) => {
              allUnifiedSchemes.push(getUnifiedRow(row, sheetName));
            });
          });
        }

        const toInsert = allUnifiedSchemes
          .filter(s => s.scheme_name)
          .map(s => ({
            name: s.scheme_name,
            link: s.scheme_link || undefined,
            category: s.category || "General",
            isActive: true,
            raw: s.raw || {}
          }));
        if (toInsert.length > 0) {
          await Scheme.insertMany(toInsert);
        }
      }

      // Fetch active schemes from database
      const dbSchemes = await Scheme.find({ isActive: true }).lean();
      cachedUnifiedSchemes = dbSchemes.map((s: any) => ({
        _id: s._id.toString(),
        scheme_name: s.name,
        scheme_link: s.link,
        category: s.category,
        raw: s.raw,
        ...s.raw // spread constraints for filter key matching
      }));
      lastLoadedTime = now;
    }

    const allUnifiedSchemes = cachedUnifiedSchemes || [];
    const eligible: any[] = [];

    allUnifiedSchemes.forEach((scheme: any) => {
      let ok = true;

      for (const key of Object.keys(farmerInput)) {
        if (key === "scheme_name" || key === "scheme_link" || key === "category") {
          continue;
        }

        const cellRaw = scheme[key];
        const inputVal = farmerInput[key];

        if (cellRaw === "" || cellRaw === null || cellRaw === undefined) continue;

        const matched = matchCellAgainstInput(cellRaw, inputVal, key);
        if (!matched) {
          ok = false;
          break;
        }
      }

      if (ok && scheme.scheme_name) {
        eligible.push({
          name: scheme.scheme_name,
          link: scheme.scheme_link || undefined,
          category: scheme.category,
          raw: {
            ...scheme.raw,
            _id: scheme._id
          }
        });
      }
    });

    return NextResponse.json({ eligible, count: eligible.length });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "search failed" }, { status: 500 });
  }
}

