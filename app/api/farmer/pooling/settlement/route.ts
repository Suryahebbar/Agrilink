import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmPool } from '@/lib/models/FarmPool';
import { PoolContributionLog } from '@/lib/models/PoolContributionLog';
import { PoolSettlement } from '@/lib/models/PoolSettlement';
import { 
  PoolingFinanceService, 
  ParticipantContributionSummary, 
  ModelCalculationInput 
} from '@/lib/services/pooling-finance.service';
import User from '@/models/User';
import { auditLog } from '@/lib/auditLogger';
import { ActivityAction, LogModule, ResourceType } from '@/lib/auditTypes';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const poolId = url.searchParams.get('poolId');
    const userId = url.searchParams.get('userId');

    let query: any = {};
    if (poolId) {
      query.poolId = poolId;
    } else if (userId) {
      const pool = await FarmPool.findOne({ 'participants.userId': userId });
      if (pool) {
        query.poolId = pool._id;
      } else {
        return NextResponse.json({ success: true, settlements: [] });
      }
    } else {
      return NextResponse.json({ success: false, error: 'Missing poolId or userId' }, { status: 400 });
    }

    const settlements = await PoolSettlement.find(query).sort({ settledAt: -1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      poolId: query.poolId,
      settlements
    });
  } catch (error: any) {
    console.error('GET /api/farmer/pooling/settlement error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      poolId,
      season,
      harvestYield,
      yieldUnit,
      sellingPricePerUnit,
      buyerName,
      settledById,
      customParameters,
      notes
    } = body;

    if (!poolId || !harvestYield || !sellingPricePerUnit) {
      return NextResponse.json(
        { success: false, error: 'Missing poolId, harvestYield or sellingPricePerUnit' },
        { status: 400 }
      );
    }

    const pool = await FarmPool.findById(poolId);
    if (!pool) {
      return NextResponse.json({ success: false, error: 'Pool not found' }, { status: 404 });
    }

    // 1. Calculate Total Input Expenses
    let totalInputExpenses = 0;
    if (Array.isArray(pool.expensesList)) {
      totalInputExpenses = pool.expensesList.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
    }

    // 2. Fetch Verified Contributions per Participant
    const verifiedLogs = await PoolContributionLog.find({
      poolId,
      status: 'verified'
    });

    const participantSummaries: ParticipantContributionSummary[] = (pool.participants || []).map((p: any) => {
      const uid = p.userId.toString();
      const memberLogs = verifiedLogs.filter((l: any) => l.userId.toString() === uid);

      const labourHours = memberLogs
        .filter((l: any) => l.type === 'labour')
        .reduce((sum: number, l: any) => sum + (Number(l.quantity) || 0), 0);

      const labourValue = memberLogs
        .filter((l: any) => l.type === 'labour')
        .reduce((sum: number, l: any) => sum + (Number(l.totalValue) || 0), 0);

      const machHours = memberLogs
        .filter((l: any) => l.type === 'machinery')
        .reduce((sum: number, l: any) => sum + (Number(l.quantity) || 0), 0);

      const machValue = memberLogs
        .filter((l: any) => l.type === 'machinery')
        .reduce((sum: number, l: any) => sum + (Number(l.totalValue) || 0), 0);

      const extraCap = memberLogs
        .filter((l: any) => l.type === 'capital')
        .reduce((sum: number, l: any) => sum + (Number(l.totalValue) || 0), 0);

      return {
        userId: uid,
        fullName: p.fullName,
        landAcres: Number(p.landSize || p.landContribution) || 1,
        initialInvestment: Number(p.investmentContribution) || 0,
        totalLabourHours: labourHours,
        labourValue,
        totalMachineryHours: machHours,
        machineryValue: machValue,
        extraCapitalInjected: extraCap
      };
    });

    // 3. Compute Gross Revenue
    const grossHarvestRevenue = Number(harvestYield) * Number(sellingPricePerUnit);

    // 4. Run Financial Calculation Engine
    const calculationInput: ModelCalculationInput = {
      modelNumber: (pool.collaborationModel as 1 | 2 | 3 | 4 | 5) || 5,
      participants: participantSummaries,
      totalHarvestRevenue: grossHarvestRevenue,
      totalInputExpenses,
      customParameters
    };

    const statement = PoolingFinanceService.calculateSettlement(calculationInput);

    // 5. Generate Settler Info
    let settlerName = 'Field Counseling Officer';
    if (settledById) {
      const settler = await User.findById(settledById);
      if (settler) settlerName = settler.name;
    }

    // Generate cryptographic proof hash
    const blockHashData = `${poolId}-${grossHarvestRevenue}-${statement.netDistributableMargin}-${Date.now()}`;
    const blockchainTxHash = '0x' + crypto.createHash('sha256').update(blockHashData).digest('hex');

    // 6. Save Immutable Settlement
    const newSettlement = await PoolSettlement.create({
      poolId,
      poolName: pool.name,
      season: season || 'Kharif 2026',
      collaborationModel: calculationInput.modelNumber,
      modelName: statement.modelName,
      harvestYield: Number(harvestYield),
      yieldUnit: yieldUnit || 'Quintals',
      sellingPricePerUnit: Number(sellingPricePerUnit),
      buyerName: buyerName || 'AgriLink Direct Procurement / APMC Bulk Buyer',
      grossHarvestRevenue,
      totalInputExpenses,
      agriLinkCommissionOrFee: statement.agriLinkCommissionOrFee,
      netDistributableMargin: statement.netDistributableMargin,
      memberSettlements: statement.memberPayouts.map((mp) => ({
        userId: mp.userId,
        fullName: mp.fullName,
        landAcres: mp.landAcres,
        equityPercentage: mp.equityPercentage,
        grossAllocation: mp.grossAllocation,
        expenseDeduction: mp.expenseDeduction,
        labourReimbursement: mp.labourReimbursement,
        machineryReimbursement: mp.machineryReimbursement,
        netPayout: mp.netPayout,
        payoutStatus: 'credited',
        breakdownNotes: mp.breakdownNotes
      })),
      settledBy: settledById || pool.participants[0]?.userId,
      settlerName,
      settledAt: new Date(),
      status: 'finalized',
      blockchainTxHash,
      notes
    });

    // Audit Log
    void auditLog({
      action: ActivityAction.PROFIT_SHARE_CALCULATED,
      module: LogModule.FINANCIAL,
      resourceType: ResourceType.FARM_POOL,
      resourceId: poolId,
      resourceName: `${pool.name} Settlement`,
      userId: settledById,
      userName: settlerName,
      metadata: {
        grossRevenue: grossHarvestRevenue,
        netMargin: statement.netDistributableMargin,
        model: calculationInput.modelNumber,
        txHash: blockchainTxHash
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Harvest recorded and pool settlement finalized successfully!',
      settlement: newSettlement,
      financialStatement: statement
    });
  } catch (error: any) {
    console.error('POST /api/farmer/pooling/settlement error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
