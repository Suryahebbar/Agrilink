import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { crop, months = 24 } = await request.json();
    
    if (!crop) {
      return NextResponse.json({ error: 'Crop name is required' }, { status: 400 });
    }

    // Call Python script for historical data using virtual environment
    const scriptPath = path.join(process.cwd(), 'ml_models', 'get_historical.py');
    const excelPath = path.join(process.cwd(), 'AgriLink_Chikkamagaluru_Crop_Prices.xlsx');
    const venvPython = path.join(process.cwd(), 'ml_env', 'bin', 'python3');
    
    const { stdout, stderr } = await execAsync(
      `${venvPython} ${scriptPath} --crop "${crop}" --months ${months} --excel "${excelPath}"`
    );

    if (stderr) {
      console.error('Python script error:', stderr);
    }

    const result = JSON.parse(stdout);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Historical data API error:', error);
    return NextResponse.json(
      { error: 'Failed to get historical data' },
      { status: 500 }
    );
  }
}
