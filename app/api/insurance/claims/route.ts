import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { InsuranceClaim } from '@/lib/models/InsuranceClaim';
import { FarmPool } from '@/lib/models/FarmPool';
import User from '@/models/User';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const farmerId = url.searchParams.get('farmerId');
    const poolId = url.searchParams.get('poolId');
    const status = url.searchParams.get('status');
    const isFCO = url.searchParams.get('isFCO') === 'true';

    let query: any = {};
    if (farmerId && !isFCO) {
      query.farmerId = farmerId;
    }
    if (poolId) {
      query.poolId = poolId;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const claims = await InsuranceClaim.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: claims.length,
      claims
    });
  } catch (error: any) {
    console.error('GET /api/insurance/claims error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { action } = body;

    if (action === 'create_claim') {
      const {
        farmerId,
        farmerName,
        farmerPhone,
        poolId,
        policyId,
        policyName,
        policyType,
        providerName,
        cropName,
        affectedAcres,
        totalFarmAcres,
        calamityType,
        incidentDate,
        estimatedLossPercentage,
        estimatedLossAmount,
        description,
        damageMedia
      } = body;

      if (!farmerId || !cropName || !calamityType || !estimatedLossAmount) {
        return NextResponse.json({ 
          success: false, 
          error: 'Missing required claim details (farmerId, cropName, calamityType, loss estimate).' 
        }, { status: 400 });
      }

      // Generate unique human-readable claim number: e.g. CLM-2026-X8F2
      const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const claimNumber = `CLM-${new Date().getFullYear()}-${randomSuffix}`;

      const newClaim = await InsuranceClaim.create({
        claimNumber,
        farmerId,
        farmerName,
        farmerPhone,
        poolId: poolId || undefined,
        policyId: policyId || 'pmfby-govt',
        policyName: policyName || 'PMFBY / Private Crop Insurance',
        policyType: policyType || 'government',
        providerName: providerName || 'AIC of India',
        cropName,
        affectedAcres: Number(affectedAcres) || 1,
        totalFarmAcres: Number(totalFarmAcres) || Number(affectedAcres) || 1,
        calamityType,
        incidentDate: incidentDate ? new Date(incidentDate) : new Date(),
        estimatedLossPercentage: Number(estimatedLossPercentage) || 50,
        estimatedLossAmount: Number(estimatedLossAmount),
        description: description || 'Crop damage due to adverse climate / pest condition',
        damageMedia: damageMedia || [],
        status: 'submitted'
      });

      return NextResponse.json({
        success: true,
        message: 'Insurance claim filed successfully and queued for FCO field inspection.',
        claim: newClaim
      });
    }

    else if (action === 'fco_inspection') {
      const { 
        claimId, 
        fcoId, 
        fcoName, 
        verifiedDamagePercent, 
        assessedLossAmount, 
        recommendation, 
        inspectionNotes,
        fieldPhotos 
      } = body;

      if (!claimId || !fcoId) {
        return NextResponse.json({ success: false, error: 'Missing claimId or fcoId' }, { status: 400 });
      }

      const claim = await InsuranceClaim.findById(claimId);
      if (!claim) {
        return NextResponse.json({ success: false, error: 'Insurance claim not found' }, { status: 404 });
      }

      // Digital sign inspection hash
      const inspectionHash = '0x' + crypto.createHash('sha256').update(
        JSON.stringify({
          claimNumber: claim.claimNumber,
          fcoId,
          verifiedDamagePercent,
          assessedLossAmount,
          recommendation,
          date: new Date().toISOString()
        })
      ).digest('hex');

      claim.fcoInspection = {
        inspectedBy: fcoId,
        inspectorName: fcoName || 'FCO Field Officer',
        inspectedAt: new Date(),
        verifiedDamagePercent: Number(verifiedDamagePercent),
        assessedLossAmount: Number(assessedLossAmount),
        recommendation: recommendation || 'approve',
        inspectionNotes: inspectionNotes || '',
        fieldPhotos: fieldPhotos || [],
        reportSignedHash: inspectionHash
      };

      if (recommendation === 'reject') {
        claim.status = 'rejected';
        claim.rejectionReason = inspectionNotes || 'Damage assessed does not meet threshold criteria.';
      } else {
        claim.status = 'inspected';
        // Auto approve provisional payout amount based on assessed loss
        claim.approvedPayoutAmount = Number(assessedLossAmount);
      }

      await claim.save();

      return NextResponse.json({
        success: true,
        message: 'FCO on-site inspection recorded successfully.',
        claim
      });
    }

    else if (action === 'settle_claim') {
      const { claimId, approvedPayoutAmount, settlementReference, payoutNotes } = body;

      const claim = await InsuranceClaim.findById(claimId);
      if (!claim) {
        return NextResponse.json({ success: false, error: 'Insurance claim not found' }, { status: 404 });
      }

      claim.status = 'settled';
      claim.approvedPayoutAmount = Number(approvedPayoutAmount) || claim.approvedPayoutAmount || 0;
      claim.settlementDate = new Date();
      claim.settlementReference = settlementReference || `PAY-NEFT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      claim.payoutDistributionNotes = payoutNotes || 'Payout processed directly to registered bank account / Pool Escrow.';

      await claim.save();

      return NextResponse.json({
        success: true,
        message: 'Claim settled and disbursement finalized.',
        claim
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action provided' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/insurance/claims error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
