import path from "path";
import fs from "fs";
import { NextRequest, NextResponse } from 'next/server';

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
    // special: if header has words implying max/min we handled above
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
    const farmerInputRaw = await req.json();
    // normalize farmer input keys too (map to underscore style)
    const farmerInput: Record<string, any> = {};
    for (const k of Object.keys(farmerInputRaw)) {
      const nk = normalizeKey(k);
      farmerInput[nk] = farmerInputRaw[k];
    }

    const filePath = path.resolve(process.cwd(), "Government_Scheme_Applicability_Dataset.xlsx");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Excel file not found at project root." }, { status: 500 });
    }

    // Read file as buffer
    const fileBuffer = fs.readFileSync(filePath);
    
    // Import xlsx dynamically
    const xlsx = await import('xlsx');
    const wb = xlsx.read(fileBuffer);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" }); // array of objects by header labels

    // Precompute header keys map
    const headers = Object.keys((rows as any)[0] || {});
    const headerKeys = headers.map(h => ({ label: h, key: normalizeKey(h) }));

    const eligible: any[] = [];

    (rows as any[]).forEach((row: any) => {
      // For each scheme row, check all header columns
      let ok = true;

      for (const { label, key } of headerKeys) {
        // skip scheme name and link from eligibility checks by specific heuristics
        if (/scheme name/i.test(label) || /scheme link/i.test(label)) {
          continue;
        }

        const cellRaw = (row as any)[label];
        const inputVal = farmerInput[key];

        // If the cell is blank -> no restriction
        if (cellRaw === "" || cellRaw === null || cellRaw === undefined) continue;

        const matched = matchCellAgainstInput(cellRaw, inputVal, label);

        if (!matched) {
          ok = false;
          break;
        }
      }

      if (ok) {
        // Build compact scheme response (name + link + raw row)
        const nameLabel = headers.find(h => /scheme name/i.test(h)) || headers[0];
        const linkLabel = headers.find(h => /scheme link/i.test(h)) || null;

        eligible.push({
          name: (row as any)[nameLabel] || "Unnamed Scheme",
          link: linkLabel ? (row as any)[linkLabel] : undefined,
          raw: row
        });
      }
    });

    return NextResponse.json({ eligible, count: eligible.length });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "search failed" }, { status: 500 });
  }
}
