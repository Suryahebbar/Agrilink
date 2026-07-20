import path from "path";
import fs from "fs";
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const filePath = path.resolve(process.cwd(), "Government_Scheme_Applicability_Dataset.xlsx");
    console.log('Attempting to read file:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log('File does not exist at path:', filePath);
      return NextResponse.json({ error: "Excel file not found at project root." }, { status: 500 });
    }

    // Check file permissions
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      console.log('File is readable');
    } catch (accessError: any) {
      console.log('File access error:', accessError);
      return NextResponse.json({ error: "File permission denied." }, { status: 500 });
    }

    // Try to read the file
    const fileBuffer = fs.readFileSync(filePath);
    console.log('File read successfully, size:', fileBuffer.length, 'bytes');

    // Import xlsx dynamically to avoid module loading issues
    const xlsx = await import('xlsx');
    console.log('XLSX module loaded');

    const wb = xlsx.read(fileBuffer);
    console.log('Workbook loaded, sheets:', wb.SheetNames);

    if (!wb.Sheets || Object.keys(wb.Sheets).length === 0) {
      return NextResponse.json({ error: "Excel file has no sheets." }, { status: 500 });
    }

    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    console.log('Sheet converted to JSON, rows:', rows.length);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Excel sheet is empty." }, { status: 500 });
    }

    const headers = (rows as any)[0].map((h: any) => String(h).trim());
    // normalize keys for use in the frontend -> keep both forms
    const normalized = headers.map((h: string) => ({
      label: h,
      key: h.trim().toLowerCase().replace(/\s+/g, "_")
    }));

    console.log('Headers processed:', normalized.length);

    return NextResponse.json({ headers: normalized });
  } catch (err: any) {
    console.error('Detailed error:', err);
    return NextResponse.json({ 
      error: err.message || "failed to read file",
      stack: err.stack 
    }, { status: 500 });
  }
}
