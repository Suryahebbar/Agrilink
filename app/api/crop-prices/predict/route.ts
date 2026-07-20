import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { crop, months = 3 } = await request.json();
    
    if (!crop) {
      return NextResponse.json({ error: 'Crop name is required' }, { status: 400 });
    }

    // Call Python script for prediction using virtual environment
    const scriptPath = path.join(process.cwd(), 'ml_models', 'predict_prices.py');
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
    console.error('Prediction API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Get available crops
    const scriptPath = path.join(process.cwd(), 'ml_models', 'get_crops.py');
    const excelPath = path.join(process.cwd(), 'AgriLink_Chikkamagaluru_Crop_Prices.xlsx');
    const venvPython = path.join(process.cwd(), 'ml_env', 'bin', 'python3');
    
    const { stdout, stderr } = await execAsync(
      `${venvPython} ${scriptPath} --excel "${excelPath}"`
    );

    if (stderr) {
      console.error('Python script error:', stderr);
    }

    const result = JSON.parse(stdout);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Crops API error:', error);
    return NextResponse.json(
      { error: 'Failed to get crop list' },
      { status: 500 }
    );
  }
}
