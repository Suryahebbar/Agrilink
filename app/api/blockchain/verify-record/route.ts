import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmPool } from '@/lib/models/FarmPool';
import { PoolContributionLog } from '@/lib/models/PoolContributionLog';
import { PoolSettlement } from '@/lib/models/PoolSettlement';
import { CropSale } from '@/lib/models/CropSale';
import { PoolInvestment } from '@/lib/models/PoolInvestment';
import { 
  hashContractNode, 
  hashContributionNode, 
  hashProfitDistributionNode, 
  hashCropSaleNode, 
  hashInvestmentNode 
} from '@/lib/hashContract';
import { auditLog } from '@/lib/auditLogger';
import { ActivityAction, LogModule, ResourceType } from '@/lib/auditTypes';

export const dynamic = 'force-dynamic';

/**
 * GET /api/blockchain/verify-record?type=...&id=...
 *
 * Universal public verifier for all 5 AgriLink Blockchain scopes:
 * 1. agreement (poolId)
 * 2. contribution (contributionId)
 * 3. settlement (settlementId)
 * 4. crop_sale (saleId)
 * 5. investment (investmentId)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'agreement';
    const id = searchParams.get('id') || searchParams.get('poolId');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id or poolId parameter' }, { status: 400 });
    }

    await connectDB();

    if (type === 'agreement') {
      const pool = await FarmPool.findById(id).lean();
      if (!pool) {
        return NextResponse.json({ success: false, error: 'Farm agreement not found' }, { status: 404 });
      }

      if (!pool.blockchain?.contractHash) {
        return NextResponse.json({
          success: true,
          verified: null,
          scope: 'agreement',
          status: 'not_sealed',
          message: 'Agreement has not yet been sealed on blockchain.',
          data: pool
        });
      }

      const sealedAt = pool.blockchain.sealedAt ?? pool.blockchain.timestamp?.toISOString() ?? '';
      const recomputedHash = hashContractNode(pool, sealedAt);
      const storedHash = pool.blockchain.contractHash;
      const verified = recomputedHash === storedHash;

      return NextResponse.json({
        success: true,
        scope: 'agreement',
        recordId: id,
        title: pool.name,
        verified,
        status: verified ? 'intact' : 'tampered',
        storedHash,
        recomputedHash,
        blockchainMetadata: pool.blockchain,
        details: {
          participantCount: pool.participants?.length || 0,
          crop: pool.farmPlan?.selectedCrop,
          status: pool.status
        }
      });
    }

    if (type === 'contribution') {
      const log = await PoolContributionLog.findById(id).lean();
      if (!log) {
        return NextResponse.json({ success: false, error: 'Contribution record not found' }, { status: 404 });
      }

      const storedHash = log.blockchain?.proofHash;
      if (!storedHash) {
        return NextResponse.json({
          success: true,
          verified: null,
          scope: 'contribution',
          status: 'not_anchored',
          message: 'Contribution record not yet anchored on blockchain ledger.',
          data: log
        });
      }

      const recomputedHash = hashContributionNode(log);
      const verified = recomputedHash === storedHash;

      return NextResponse.json({
        success: true,
        scope: 'contribution',
        recordId: id,
        title: `${log.farmerName} - ${log.activityName}`,
        verified,
        status: verified ? 'intact' : 'tampered',
        storedHash,
        recomputedHash,
        blockchainMetadata: log.blockchain,
        details: {
          contributor: log.farmerName,
          type: log.type,
          quantity: log.quantity,
          unit: log.unit,
          totalValue: log.totalValue,
          date: log.date
        }
      });
    }

    if (type === 'settlement') {
      const settlement = await PoolSettlement.findById(id).lean();
      if (!settlement) {
        return NextResponse.json({ success: false, error: 'Profit distribution settlement not found' }, { status: 404 });
      }

      const storedHash = settlement.blockchain?.distributionHash;
      if (!storedHash) {
        return NextResponse.json({
          success: true,
          verified: null,
          scope: 'settlement',
          status: 'not_anchored',
          message: 'Settlement record not yet anchored on blockchain ledger.',
          data: settlement
        });
      }

      const recomputedHash = hashProfitDistributionNode(settlement);
      const verified = recomputedHash === storedHash;

      return NextResponse.json({
        success: true,
        scope: 'settlement',
        recordId: id,
        title: `${settlement.poolName} (${settlement.season})`,
        verified,
        status: verified ? 'intact' : 'tampered',
        storedHash,
        recomputedHash,
        blockchainMetadata: settlement.blockchain,
        details: {
          season: settlement.season,
          grossRevenue: settlement.grossHarvestRevenue,
          netMargin: settlement.netDistributableMargin,
          memberCount: settlement.memberSettlements?.length || 0,
          settledAt: settlement.settledAt
        }
      });
    }

    if (type === 'crop_sale') {
      const sale = await CropSale.findById(id).lean();
      if (!sale) {
        return NextResponse.json({ success: false, error: 'Crop sale record not found' }, { status: 404 });
      }

      const storedHash = sale.blockchain?.receiptHash;
      if (!storedHash) {
        return NextResponse.json({
          success: true,
          verified: null,
          scope: 'crop_sale',
          status: 'not_anchored',
          message: 'Crop sale receipt not yet anchored on blockchain ledger.',
          data: sale
        });
      }

      const recomputedHash = hashCropSaleNode(sale);
      const verified = recomputedHash === storedHash;

      return NextResponse.json({
        success: true,
        scope: 'crop_sale',
        recordId: id,
        title: `${sale.cropName} Sale (${sale.buyerName})`,
        verified,
        status: verified ? 'intact' : 'tampered',
        storedHash,
        recomputedHash,
        blockchainMetadata: sale.blockchain,
        details: {
          cropName: sale.cropName,
          quantity: sale.quantity,
          unit: sale.unit,
          pricePerUnit: sale.pricePerUnit,
          totalAmount: sale.totalAmount,
          buyerName: sale.buyerName,
          paymentMode: sale.paymentMode,
          saleDate: sale.saleDate
        }
      });
    }

    if (type === 'investment') {
      const inv = await PoolInvestment.findById(id).lean();
      if (!inv) {
        return NextResponse.json({ success: false, error: 'Investment record not found' }, { status: 404 });
      }

      const storedHash = inv.blockchain?.investmentHash;
      if (!storedHash) {
        return NextResponse.json({
          success: true,
          verified: null,
          scope: 'investment',
          status: 'not_anchored',
          message: 'Investment record not yet anchored on blockchain ledger.',
          data: inv
        });
      }

      const recomputedHash = hashInvestmentNode(inv);
      const verified = recomputedHash === storedHash;

      return NextResponse.json({
        success: true,
        scope: 'investment',
        recordId: id,
        title: `${inv.investorName} - ₹${inv.amount.toLocaleString('en-IN')}`,
        verified,
        status: verified ? 'intact' : 'tampered',
        storedHash,
        recomputedHash,
        blockchainMetadata: inv.blockchain,
        details: {
          investorName: inv.investorName,
          investorType: inv.investorType,
          amount: inv.amount,
          terms: inv.terms,
          tenureMonths: inv.tenureMonths,
          expectedReturnRate: inv.expectedReturnRate,
          investmentDate: inv.investmentDate
        }
      });
    }

    return NextResponse.json({ success: false, error: `Invalid scope type: ${type}` }, { status: 400 });

  } catch (error: any) {
    console.error('GET /api/blockchain/verify-record error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
