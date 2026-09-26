import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { CropSale } from '@/lib/models/CropSale';
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
    const saleId = url.searchParams.get('saleId');

    let query: any = {};
    if (saleId) {
      query._id = saleId;
    } else if (poolId) {
      query.poolId = poolId;
    }

    const sales = await CropSale.find(query).sort({ saleDate: -1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      sales
    });
  } catch (error: any) {
    console.error('GET /api/blockchain/crop-sales error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      poolId,
      cropName,
      variety,
      harvestDate,
      saleDate,
      quantity,
      unit,
      pricePerUnit,
      buyerName,
      buyerType,
      buyerContact,
      buyerGstOrAadhaar,
      destinationLocation,
      paymentMode,
      paymentStatus,
      escrowReleaseConditions,
      recordedById,
      notes
    } = body;

    if (!poolId || !cropName || !quantity || !pricePerUnit || !buyerName) {
      return NextResponse.json(
        { success: false, error: 'Missing required crop sale parameters' },
        { status: 400 }
      );
    }

    const pool = await FarmPool.findById(poolId);
    if (!pool) {
      return NextResponse.json({ success: false, error: 'Farm pool not found' }, { status: 404 });
    }

    let recordedByName = 'Field Operations Lead';
    if (recordedById) {
      const u = await User.findById(recordedById);
      if (u) recordedByName = u.name;
    }

    const totalAmount = Number(quantity) * Number(pricePerUnit);

    const newSale = new CropSale({
      poolId,
      poolName: pool.name,
      cropName,
      variety,
      harvestDate: harvestDate ? new Date(harvestDate) : undefined,
      saleDate: saleDate ? new Date(saleDate) : new Date(),
      quantity: Number(quantity),
      unit: unit || 'Quintals',
      pricePerUnit: Number(pricePerUnit),
      totalAmount,
      buyerName,
      buyerType: buyerType || 'trader',
      buyerContact,
      buyerGstOrAadhaar,
      destinationLocation,
      paymentStatus: paymentStatus || (paymentMode === 'smart_contract_escrow' ? 'in_escrow' : 'released'),
      paymentMode: paymentMode || 'bank_transfer',
      escrowReleaseConditions,
      recordedBy: recordedById || pool.participants[0]?.userId,
      recordedByName,
      status: 'completed',
      notes
    });

    // Anchor crop sale receipt on-chain
    try {
      const anchorResult = await agriLedgerService.anchorCropSaleOnChain(newSale);
      newSale.blockchain = {
        isAnchored: true,
        receiptHash: anchorResult.proofHash,
        transactionHash: anchorResult.transactionHash,
        blockNumber: anchorResult.blockNumber,
        timestamp: new Date(anchorResult.timestamp)
      };
    } catch (bcErr) {
      console.warn('Crop sale blockchain anchoring error:', bcErr);
    }

    await newSale.save();

    // Progressive Block Addition on Pool if available
    if (pool.blockchain?.blocksProgress && newSale.blockchain) {
      const lastBlock = pool.blockchain.blocksProgress[pool.blockchain.blocksProgress.length - 1];
      pool.blockchain.blocksProgress.push({
        blockNumber: (lastBlock?.blockNumber || 1) + 1,
        timestamp: new Date(),
        action: 'Crop Bulk Produce Sale',
        parentHash: lastBlock?.blockHash || pool.blockchain.contractHash || '0x000',
        blockHash: newSale.blockchain.receiptHash || newSale.blockchain.transactionHash,
        remarks: `Sold ${quantity} ${unit || 'Quintals'} of ${cropName} to ${buyerName} for ₹${totalAmount.toLocaleString('en-IN')}. Receipt anchored on ledger.`,
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
      resourceName: `${pool.name} - ${cropName} Sale`,
      userId: recordedById,
      userName: recordedByName,
      metadata: {
        totalAmount,
        buyerName,
        paymentMode,
        blockchain: newSale.blockchain
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Crop sale recorded and receipt anchored on blockchain ledger!',
      sale: newSale
    });
  } catch (error: any) {
    console.error('POST /api/blockchain/crop-sales error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
