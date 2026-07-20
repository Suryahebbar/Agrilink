import { NextRequest, NextResponse } from 'next/server';

// Mock data for demonstration (in production, this would come from the ML models)
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
    const { crop, months = 24 } = await request.json();
    
    if (!crop) {
      return NextResponse.json({ error: 'Crop name is required' }, { status: 400 });
    }

    // Generate mock historical data (in production, call Python ML model)
    const result = generateMockHistorical(crop, months);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Historical data API error:', error);
    return NextResponse.json(
      { error: 'Failed to get historical data' },
      { status: 500 }
    );
  }
}
