import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Scheme from '@/lib/models/Scheme';

export const dynamic = 'force-dynamic';

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

  let minAge = "";
  let maxAge = "";

  for (const rawKey of Object.keys(row)) {
    const normKey = rawKey.trim().toLowerCase();
    
    if (normKey === "scheme name") {
      unified.scheme_name = row[rawKey];
    } else if (normKey === "scheme link" || normKey === "official link") {
      unified.scheme_link = row[rawKey];
    } else if (normKey === "land size condition" || normKey === "land size" || normKey === "land size (acres)") {
      unified.land_size = row[rawKey];
    } else if (normKey === "applicable states" || normKey === "location(state)" || normKey === "state") {
      unified.state = row[rawKey];
    } else if (normKey === "applicable districts" || normKey === "location(district)" || normKey === "district") {
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
    } else if (normKey === "min age") {
      minAge = String(row[rawKey] ?? "").trim();
    } else if (normKey === "max age") {
      maxAge = String(row[rawKey] ?? "").trim();
    } else if (normKey === "gender") {
      unified.gender = row[rawKey];
    } else if (normKey === "income category condition" || normKey === "income catogory" || normKey === "category" || normKey === "income category") {
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
    } else if (normKey === "disaster region applicable" || normKey === "disaster-affected region" || normKey === "disaster affected") {
      unified.disaster_affected = row[rawKey];
    } else if (normKey === "soil type") {
      unified.soil_type = row[rawKey];
    } else if (normKey === "farmer category") {
      unified.farmer_category = row[rawKey];
    }
  }

  if (minAge || maxAge) {
    if (minAge && maxAge) {
      unified.farmer_age = `${minAge}-${maxAge}`;
    } else if (minAge) {
      unified.farmer_age = `>= ${minAge}`;
    } else if (maxAge) {
      unified.farmer_age = `<= ${maxAge}`;
    }
  }

  return unified;
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const formData = await req.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const xlsx = await import('xlsx');
    const wb = xlsx.read(fileBuffer);

    const sheetSchemes: any[] = [];

    // Parse all sheets
    wb.SheetNames.forEach((sheetName) => {
      const sheet = wb.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
      const cat = sheetName.toLowerCase().includes('sheet1') ? 'General' : sheetName;
      rows.forEach((row: any) => {
        const unified = getUnifiedRow(row, cat);
        if (unified.scheme_name) {
          sheetSchemes.push({
            name: unified.scheme_name,
            link: unified.scheme_link || undefined,
            category: unified.category,
            raw: unified.raw
          });
        }
      });
    });

    const dbSchemes = await Scheme.find().lean();

    const newSchemes: any[] = [];
    const updatedSchemes: any[] = [];
    const removedSchemes: any[] = [];

    // Map DB schemes by name for quick check
    const dbMap = new Map<string, any>();
    dbSchemes.forEach((s: any) => dbMap.set(s.name.toLowerCase().trim(), s));

    const sheetNamesSet = new Set<string>();

    sheetSchemes.forEach(s => {
      const nameKey = s.name.toLowerCase().trim();
      sheetNamesSet.add(nameKey);

      const dbMatch = dbMap.get(nameKey);
      if (!dbMatch) {
        newSchemes.push(s);
      } else {
        // Compare link, category, and raw constraints to see if updated
        const isLinkChanged = String(s.link || '') !== String(dbMatch.link || '');
        const isCatChanged = s.category !== dbMatch.category;
        
        // Simple stringified comparison of raw constraints
        const sRawStr = JSON.stringify(s.raw || {});
        const dbRawStr = JSON.stringify(dbMatch.raw || {});
        const isRawChanged = sRawStr !== dbRawStr;

        if (isLinkChanged || isCatChanged || isRawChanged || !dbMatch.isActive) {
          updatedSchemes.push({
            id: dbMatch._id,
            old: {
              name: dbMatch.name,
              link: dbMatch.link,
              category: dbMatch.category,
              isActive: dbMatch.isActive,
              raw: dbMatch.raw
            },
            new: s
          });
        }
      }
    });

    // Check for removed schemes (active in DB but missing from the Excel sheet)
    dbSchemes.forEach((s: any) => {
      if (s.isActive && !sheetNamesSet.has(s.name.toLowerCase().trim())) {
        removedSchemes.push(s);
      }
    });

    return NextResponse.json({
      success: true,
      newSchemes,
      updatedSchemes,
      removedSchemes
    });
  } catch (err: any) {
    console.error('Error previewing scheme upload:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
