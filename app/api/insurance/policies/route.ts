import { NextResponse } from 'next/server';
import { INSURANCE_CATALOG, calculateInsurancePremium } from '@/lib/data/insurance-catalog';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'government' | 'private' | 'all'
    const cropName = url.searchParams.get('crop') || '';
    const season = (url.searchParams.get('season') as any) || 'Kharif';
    const acres = Number(url.searchParams.get('acres')) || 5;
    const estimatedCost = Number(url.searchParams.get('cost')) || (acres * 35000);

    let policies = INSURANCE_CATALOG;
    if (type && type !== 'all') {
      policies = policies.filter(p => p.type === type);
    }

    const premiumQuotes = calculateInsurancePremium({
      cropName,
      season,
      acres,
      estimatedCost
    });

    return NextResponse.json({
      success: true,
      count: policies.length,
      policies,
      quotes: premiumQuotes
    });
  } catch (error: any) {
    console.error('GET /api/insurance/policies error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
