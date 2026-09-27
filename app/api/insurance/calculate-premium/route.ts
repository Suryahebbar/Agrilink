import { NextResponse } from 'next/server';
import { calculateInsurancePremium, INSURANCE_CATALOG } from '@/lib/data/insurance-catalog';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cropName, season, acres, estimatedCost, expectedRevenue, policyId, participantShares } = body;

    if (!cropName || !acres || Number(acres) <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please provide valid cropName and acreage (>0).' 
      }, { status: 400 });
    }

    const quotes = calculateInsurancePremium({
      cropName,
      season: season || 'Kharif',
      acres: Number(acres),
      estimatedCost: Number(estimatedCost) || (Number(acres) * 35000),
      expectedRevenue: Number(expectedRevenue) || 0,
      policyId
    });

    // If participant shares are provided (from FCO pooling), compute individual premium contribution
    let participantSplits: any[] = [];
    if (participantShares && Array.isArray(participantShares) && quotes.length > 0) {
      const topQuote = quotes[0];
      const totalPct = participantShares.reduce((sum: number, p: any) => sum + (Number(p.sharePercentage) || 0), 0) || 100;

      participantSplits = participantShares.map((p: any) => {
        const pct = (Number(p.sharePercentage) || 0) / totalPct;
        const individualPremium = Math.round(topQuote.farmerNetPremium * pct);
        const individualSumInsured = Math.round(topQuote.totalSumInsured * pct);
        return {
          userId: p.userId,
          fullName: p.fullName,
          sharePercentage: p.sharePercentage,
          individualPremium,
          individualSumInsured
        };
      });
    }

    return NextResponse.json({
      success: true,
      quotes,
      participantSplits
    });
  } catch (error: any) {
    console.error('POST /api/insurance/calculate-premium error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
