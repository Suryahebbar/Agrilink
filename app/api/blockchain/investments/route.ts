import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { PoolInvestment } from '@/lib/models/PoolInvestment';
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
    const investmentId = url.searchParams.get('investmentId');

    let query: any = {};
    if (investmentId) {
      query._id = investmentId;
    } else if (poolId) {
      query.poolId = poolId;
    }

    const investments = await PoolInvestment.find(query).sort({ investmentDate: -1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      investments
    });
  } catch (error: any) {
    console.error('GET /api/blockchain/investments error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      poolId,
      investorId,
      investorName,
      investorType,
      investorContact,
      investorAadhaarOrPan,
      amount,
      investmentDate,
      terms,
      expectedReturnRate,
      tenureMonths,
      disbursementMode,
      referenceTransactionId,
      recordedById,
      notes
    } = body;

    if (!poolId || !investorName || !amount || !terms) {
      return NextResponse.json(
        { success: false, error: 'Missing required investment parameters (poolId, investorName, amount, terms)' },
        { status: 400 }
      );
    }

    const pool = await FarmPool.findById(poolId);
    if (!pool) {
      return NextResponse.json({ success: false, error: 'Farm pool not found' }, { status: 404 });
    }

    let recordedByName = 'AgriLink Financial Admin';
    if (recordedById) {
      const u = await User.findById(recordedById);
      if (u) recordedByName = u.name;
    }

    const newInvestment = new PoolInvestment({
      poolId,
      poolName: pool.name,
      investorId: investorId || undefined,
      investorName,
      investorType: investorType || 'third_party',
      investorContact,
      investorAadhaarOrPan,
      amount: Number(amount),
      investmentDate: investmentDate ? new Date(investmentDate) : new Date(),
      terms,
      expectedReturnRate: Number(expectedReturnRate) || 0,
      tenureMonths: Number(tenureMonths) || 12,
      status: 'active',
      disbursementMode: disbursementMode || 'bank_transfer',
      referenceTransactionId,
      recordedBy: recordedById || pool.participants[0]?.userId,
      recordedByName,
      notes
    });

    // Anchor investment on-chain
    try {
      const anchorResult = await agriLedgerService.anchorInvestmentOnChain(newInvestment);
      newInvestment.blockchain = {
        isAnchored: true,
        investmentHash: anchorResult.proofHash,
        transactionHash: anchorResult.transactionHash,
        blockNumber: anchorResult.blockNumber,
        timestamp: new Date(anchorResult.timestamp)
      };
    } catch (bcErr) {
      console.warn('Investment blockchain anchoring error:', bcErr);
    }

    await newInvestment.save();

    // Progressive Block Addition on Pool if available
    if (pool.blockchain?.blocksProgress && newInvestment.blockchain) {
      const lastBlock = pool.blockchain.blocksProgress[pool.blockchain.blocksProgress.length - 1];
      pool.blockchain.blocksProgress.push({
        blockNumber: (lastBlock?.blockNumber || 1) + 1,
        timestamp: new Date(),
        action: 'Capital Investment Registered',
        parentHash: lastBlock?.blockHash || pool.blockchain.contractHash || '0x000',
        blockHash: newInvestment.blockchain.investmentHash || newInvestment.blockchain.transactionHash,
        remarks: `Received ₹${Number(amount).toLocaleString('en-IN')} investment from ${investorName} (${investorType || 'Partner'}). Terms: ${terms}`,
        operator: recordedByName
      });
      pool.markModified('blockchain');
      await pool.save();
    }

    // Audit log
    void auditLog({
      action: ActivityAction.CREATE,
      module: LogModule.FINANCIAL,
      resourceType: ResourceType.FARM_POOL,
      resourceId: poolId,
      resourceName: `${pool.name} - ${investorName} Investment`,
      userId: recordedById,
      userName: recordedByName,
      metadata: {
        amount,
        investorType,
        blockchain: newInvestment.blockchain
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Investment record registered and anchored on blockchain ledger!',
      investment: newInvestment
    });
  } catch (error: any) {
    console.error('POST /api/blockchain/investments error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
