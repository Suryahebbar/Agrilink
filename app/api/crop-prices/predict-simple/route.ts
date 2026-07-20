import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Mock data for demonstration (in production, this would come from the ML models)
const mockCrops = [
  { value: 'arecanut', label: 'Arecanut' },
  { value: 'blackpepper', label: 'Black Pepper' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'tea', label: 'Tea' },
  { value: 'paddy', label: 'Paddy' },
  { value: 'cardamom', label: 'Cardamom' },
  { value: 'banana', label: 'Banana' },
  { value: 'clove', label: 'Clove' },
  { value: 'ginger', label: 'Ginger' },
  { value: 'coconut', label: 'Coconut' }
];

const generateMockPrediction = (crop: string, months: number) => {
  const basePrices = {
    arecanut: 35000,
    blackpepper: 28000,
    coffee: 15000,
    tea: 12000,
    paddy: 8000,
    cardamom: 45000,
    banana: 6000,
    clove: 32000,
    ginger: 18000,
    coconut: 9000
  };

  const basePrice = basePrices[crop as keyof typeof basePrices] || 10000;
  const predictions = [];
  const dates = [];
  const confidenceIntervals = [];

  const currentDate = new Date();
  
  for (let i = 1; i <= months; i++) {
    const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    dates.push(futureDate.toISOString().split('T')[0]);
    
    // Generate realistic price variations
    const trend = 1 + (Math.random() - 0.3) * 0.1; // Slight upward trend with randomness
    const seasonalFactor = 1 + Math.sin((i / 12) * Math.PI * 2) * 0.15; // Seasonal variation
    const predictedPrice = basePrice * trend * seasonalFactor;
    
    predictions.push(Math.round(predictedPrice));
    
    // Confidence intervals (±20%)
    const margin = predictedPrice * 0.2;
    confidenceIntervals.push({
      lower: Math.round(predictedPrice - margin),
      upper: Math.round(predictedPrice + margin)
    });
  }

  return {
    crop,
    predictions,
    dates,
    confidenceIntervals
  };
};

const generateMockHistorical = (crop: string, months: number) => {
  const basePrices = {
    arecanut: 32000,
    blackpepper: 26000,
    coffee: 14000,
    tea: 11000,
    paddy: 7500,
    cardamom: 42000,
    banana: 5500,
    clove: 30000,
    ginger: 16000,
    coconut: 8500
  };

  const basePrice = basePrices[crop as keyof typeof basePrices] || 10000;
  const dates = [];
  const prices = [];

  const currentDate = new Date();
  
  for (let i = months; i >= 0; i--) {
    const pastDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    dates.push(pastDate.toISOString().split('T')[0]);
    
    // Generate realistic historical prices with trend and seasonality
    const trend = 1 - (i / months) * 0.1; // Historical trend
    const seasonalFactor = 1 + Math.sin((i / 12) * Math.PI * 2) * 0.2;
    const randomFactor = 1 + (Math.random() - 0.5) * 0.3;
    const price = basePrice * trend * seasonalFactor * randomFactor;
    
    prices.push(Math.round(price));
  }

  return {
    crop,
    dates,
    prices,
    data_points: dates.length
  };
};

export async function POST(request: Request) {
  try {
    const { crop, months = 3 } = await request.json();
    
    if (!crop) {
      return NextResponse.json({ error: 'Crop name is required' }, { status: 400 });
    }

    // Generate mock prediction (in production, call Python ML model)
    const result = generateMockPrediction(crop, months);
    
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
    // Return available crops
    return NextResponse.json({
      crops: mockCrops,
      total: mockCrops.length
    });
    
  } catch (error) {
    console.error('Crops API error:', error);
    return NextResponse.json(
      { error: 'Failed to get crop list' },
      { status: 500 }
    );
  }
}
