import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { PoolContributionLog } from '@/lib/models/PoolContributionLog';
import { FarmPool } from '@/lib/models/FarmPool';
import User from '@/models/User';
import { auditLog } from '@/lib/auditLogger';
import { ActivityAction, LogModule, ResourceType } from '@/lib/auditTypes';
import { agriLedgerService } from '@/lib/services/agri-ledger.service';

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
      // Find the user's active pool
      const pool = await FarmPool.findOne({ 'participants.userId': userId });
      if (pool) {
        query.poolId = pool._id;
      } else {
        return NextResponse.json({ success: true, contributions: [], summary: {} });
      }
    } else {
      return NextResponse.json({ success: false, error: 'Missing poolId or userId' }, { status: 400 });
    }

    const contributions = await PoolContributionLog.find(query).sort({ date: -1, createdAt: -1 });

    // Aggregate summary per participant
    const pool = await FarmPool.findById(query.poolId);
    const memberSummaries: Record<string, any> = {};

    if (pool?.participants) {
      pool.participants.forEach((p: any) => {
        const uid = p.userId.toString();
        memberSummaries[uid] = {
          userId: uid,
          fullName: p.fullName,
          landAcres: p.landSize || p.landContribution || 1,
          initialInvestment: p.investmentContribution || 0,
          totalLabourHours: 0,
          labourValue: 0,
          totalMachineryHours: 0,
          machineryValue: 0,
          extraCapitalInjected: 0,
          verifiedContributionsCount: 0,
          pendingContributionsCount: 0
        };
      });
    }

    contributions.forEach((c: any) => {
      const uid = c.userId.toString();
      if (!memberSummaries[uid]) {
        memberSummaries[uid] = {
          userId: uid,
          fullName: c.farmerName,
          landAcres: 1,
          initialInvestment: 0,
          totalLabourHours: 0,
          labourValue: 0,
          totalMachineryHours: 0,
          machineryValue: 0,
          extraCapitalInjected: 0,
          verifiedContributionsCount: 0,
          pendingContributionsCount: 0
        };
      }

      if (c.status === 'verified') {
        memberSummaries[uid].verifiedContributionsCount += 1;
        if (c.type === 'labour') {
          memberSummaries[uid].totalLabourHours += Number(c.quantity) || 0;
          memberSummaries[uid].labourValue += Number(c.totalValue) || 0;
        } else if (c.type === 'machinery') {
          memberSummaries[uid].totalMachineryHours += Number(c.quantity) || 0;
          memberSummaries[uid].machineryValue += Number(c.totalValue) || 0;
        } else if (c.type === 'capital') {
          memberSummaries[uid].extraCapitalInjected += Number(c.totalValue) || 0;
        }
      } else if (c.status === 'pending') {
        memberSummaries[uid].pendingContributionsCount += 1;
      }
    });

    return NextResponse.json({
      success: true,
      poolId: query.poolId,
      contributions,
      memberSummaries: Object.values(memberSummaries),
      collaborationModel: pool?.collaborationModel || 5
    });
  } catch (error: any) {
    console.error('GET /api/farmer/pooling/contributions error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      poolId,
      userId,
      farmerName,
      type,
      activityName,
      quantity,
      unit,
      unitRate,
      date,
      notes
    } = body;

    if (!poolId || !userId || !type || !activityName || quantity === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required contribution details' },
        { status: 400 }
      );
    }

    // Default rates if not provided
    let calculatedRate = Number(unitRate) || 0;
    if (!calculatedRate) {
      if (type === 'labour') calculatedRate = 100; // ₹100/hr standard agricultural labor rate
      else if (type === 'machinery') calculatedRate = 750; // ₹750/hr tractor/harvester rate
      else if (type === 'capital') calculatedRate = 1;
    }

    const totalValue = type === 'capital' ? Number(quantity) : Number(quantity) * calculatedRate;

    // Get user details if farmerName not supplied
    let resolvedName = farmerName;
    if (!resolvedName) {
      const u = await User.findById(userId);
      resolvedName = u?.name || 'Farmer Member';
    }

    const newLog = await PoolContributionLog.create({
      poolId,
      userId,
      farmerName: resolvedName,
      type,
      activityName,
      quantity: Number(quantity),
      unit: unit || (type === 'capital' ? 'INR' : 'hours'),
      unitRate: calculatedRate,
      totalValue,
      date: date ? new Date(date) : new Date(),
      status: 'pending',
      notes
    });

    // Automatically anchor contribution on-chain
    try {
      const anchorResult = await agriLedgerService.anchorContributionOnChain(newLog);
      newLog.blockchain = {
        isAnchored: true,
        proofHash: anchorResult.proofHash,
        transactionHash: anchorResult.transactionHash,
        blockNumber: anchorResult.blockNumber,
        timestamp: new Date(anchorResult.timestamp)
      };
      await newLog.save();
    } catch (bcErr) {
      console.warn('Blockchain contribution anchoring error:', bcErr);
    }

    // Audit log
    void auditLog({
      action: ActivityAction.CREATE,
      module: LogModule.AGREEMENT,
      resourceType: ResourceType.FARM_POOL,
      resourceId: poolId,
      resourceName: `${resolvedName} - ${activityName}`,
      userId,
      userName: resolvedName,
      metadata: { type, quantity, totalValue, blockchain: newLog.blockchain }
    });

    return NextResponse.json({
      success: true,
      message: 'Contribution log submitted and recorded on blockchain',
      contribution: newLog
    });
  } catch (error: any) {
    console.error('POST /api/farmer/pooling/contributions error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { contributionId, status, verifiedBy, verifiedByName, rejectionReason } = body;

    if (!contributionId || !status || !['verified', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid contributionId or status' },
        { status: 400 }
      );
    }

    const log = await PoolContributionLog.findById(contributionId);
    if (!log) {
      return NextResponse.json({ success: false, error: 'Contribution not found' }, { status: 404 });
    }

    log.status = status;
    if (status === 'verified') {
      log.verifiedBy = verifiedBy;
      log.verifiedByName = verifiedByName || 'Field Officer / Pool Leader';
      log.verifiedAt = new Date();
      log.rejectionReason = undefined;

      // Re-anchor verified state on blockchain
      try {
        const anchorResult = await agriLedgerService.anchorContributionOnChain(log);
        log.blockchain = {
          isAnchored: true,
          proofHash: anchorResult.proofHash,
          transactionHash: anchorResult.transactionHash,
          blockNumber: anchorResult.blockNumber,
          timestamp: new Date(anchorResult.timestamp)
        };
      } catch (e) {
        console.warn('Error re-anchoring verified contribution:', e);
      }
    } else {
      log.rejectionReason = rejectionReason || 'Rejected by reviewer';
    }

    await log.save();

    return NextResponse.json({
      success: true,
      message: `Contribution ${status} successfully`,
      contribution: log
    });
  } catch (error: any) {
    console.error('PATCH /api/farmer/pooling/contributions error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
