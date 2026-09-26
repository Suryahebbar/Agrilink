import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { PoolPurchaseProposal } from '@/lib/models/PoolPurchaseProposal';
import { FarmPool } from '@/lib/models/FarmPool';
import { FarmerOrder } from '@/lib/models/FarmerOrder';
import { Product, Order, Seller } from '@/lib/models/supplier';
import User from '@/models/User';
import mongoose from 'mongoose';
import { ActivityLogger } from '@/lib/utils/activity-helper';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: proposalId } = await params;
    const body = await req.json();
    const { userId, vote, rejectionReason } = body;

    if (!proposalId || !userId || !vote) {
      return NextResponse.json({
        success: false,
        error: 'proposalId, userId, and vote (approve/reject) are required'
      }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(vote)) {
      return NextResponse.json({
        success: false,
        error: 'Vote must be either "approve" or "reject"'
      }, { status: 400 });
    }

    const proposal = await PoolPurchaseProposal.findById(proposalId);
    if (!proposal) {
      return NextResponse.json({ success: false, error: 'Proposal not found' }, { status: 404 });
    }

    if (proposal.status !== 'voting') {
      return NextResponse.json({
        success: false,
        error: `Proposal is already in "${proposal.status}" status and cannot receive new votes`
      }, { status: 400 });
    }

    // Find the split corresponding to this user
    const splitIndex = proposal.memberSplits.findIndex(
      (s: any) => s.userId.toString() === userId.toString()
    );

    if (splitIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'You are not listed as a participating member of this proposal'
      }, { status: 403 });
    }

    // Process rejection
    if (vote === 'reject') {
      proposal.memberSplits[splitIndex].status = 'rejected';
      proposal.memberSplits[splitIndex].votedAt = new Date();
      proposal.memberSplits[splitIndex].rejectionReason = rejectionReason || 'Declined proposal';
      proposal.status = 'cancelled';
      await proposal.save();

      return NextResponse.json({
        success: true,
        message: 'Proposal was declined and cancelled.',
        proposal
      });
    }

    // Process approval
    proposal.memberSplits[splitIndex].status = 'approved';
    proposal.memberSplits[splitIndex].votedAt = new Date();

    // Check if ALL members have approved (unanimous 100% agreement)
    const allApproved = proposal.memberSplits.every((s: any) => s.status === 'approved');

    if (!allApproved) {
      // Partial consensus recorded
      await proposal.save();
      const approvedCount = proposal.memberSplits.filter((s: any) => s.status === 'approved').length;
      const totalCount = proposal.memberSplits.length;

      return NextResponse.json({
        success: true,
        message: `Vote recorded! Current consensus: ${approvedCount} of ${totalCount} approved.`,
        proposal,
        consensusReached: false
      });
    }

    // --- 100% UNANIMOUS CONSENSUS REACHED -> AUTOMATIC EXECUTION ---
    console.log(`[Consensus] 100% approval reached for proposal ${proposal._id}. Executing order...`);

    const pool = await FarmPool.findById(proposal.poolId);
    const proposerUser = await User.findById(proposal.proposedBy);

    const orderNumber = `AGR-POOL-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const trackingNumber = `TRK-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const shippingInfo = {
      name: proposal.proposerName,
      phone: proposerUser?.phone || '9876543210',
      address: `Farm Cluster Hub: ${proposal.poolName}, Survey Lands`,
      city: 'Hub',
      state: 'Karnataka',
      pincode: '577432'
    };

    // 1. Create FarmerOrder
    const farmerOrder = await FarmerOrder.create({
      orderNumber,
      user: proposal.proposedBy,
      userId: proposal.proposedBy.toString(),
      items: proposal.items.map((it: any) => ({
        productId: it.productId,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        image: it.image,
        sellerId: it.sellerId,
        sellerName: it.sellerName
      })),
      totalAmount: proposal.totalAmount,
      status: 'confirmed',
      paymentStatus: 'paid', // Pre-committed under pool agreement
      paymentDetails: {
        method: 'netbanking',
        transactionId: `TXN-POOL-${Date.now()}`,
        paidAt: new Date()
      },
      shipping: shippingInfo,
      tracking: {
        trackingNumber,
        estimatedDelivery,
        carrier: 'AgroConnect Cooperative Express',
        currentLocation: 'Dispatched from Supplier Hub'
      },
      statusHistory: [
        {
          status: 'confirmed',
          timestamp: new Date(),
          note: `Order automatically executed upon 100% consensus approval by ${proposal.poolName} members.`
        }
      ],
      isPoolOrder: true,
      poolId: proposal.poolId,
      poolName: proposal.poolName
    });

    // 2. Decrement inventory & dispatch supplier orders
    const fallbackSeller = await Seller.findOne({ isActive: true }).lean();
    const defaultSellerId = fallbackSeller ? fallbackSeller._id.toString() : '6a9f5fb9066a7052d69f5bb4';

    // Group items by seller
    const itemsBySeller: Record<string, any[]> = {};
    for (const it of proposal.items) {
      let sellerIdStr = it.sellerId ? it.sellerId.toString() : '';
      if (!sellerIdStr || !mongoose.Types.ObjectId.isValid(sellerIdStr)) {
        try {
          const prod = await Product.findById(it.productId).lean();
          if (prod?.sellerId) sellerIdStr = prod.sellerId.toString();
        } catch (e) {
          // ignore
        }
      }
      if (!sellerIdStr || !mongoose.Types.ObjectId.isValid(sellerIdStr)) {
        sellerIdStr = defaultSellerId;
      }
      if (!itemsBySeller[sellerIdStr]) itemsBySeller[sellerIdStr] = [];
      itemsBySeller[sellerIdStr].push(it);

      // Decrement product inventory
      try {
        if (it.productId && mongoose.Types.ObjectId.isValid(String(it.productId))) {
          await Product.findByIdAndUpdate(it.productId, {
            $inc: { stock: -Math.abs(Number(it.quantity) || 1) }
          });
        }
      } catch (e) {
        console.error('Error decrementing inventory:', e);
      }
    }

    // Create supplier order for each seller
    for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
      try {
        const sellerTotal = sellerItems.reduce((s, i) => s + (Number(i.price) * Number(i.quantity)), 0);
        const platformFeeRate = 0.05;
        const platformFeeAmount = Math.round(sellerTotal * platformFeeRate * 100) / 100;
        const sellerEarnings = Math.round((sellerTotal - platformFeeAmount) * 100) / 100;

        await Order.create({
          orderNumber: `${orderNumber}-${sellerId.slice(-4)}`,
          sellerId: new mongoose.Types.ObjectId(sellerId),
          customer: {
            name: `${proposal.proposerName} (${proposal.poolName})`,
            phone: shippingInfo.phone,
            address: {
              street: shippingInfo.address,
              city: shippingInfo.city,
              state: shippingInfo.state,
              pincode: shippingInfo.pincode,
              country: 'India'
            }
          },
          items: sellerItems.map(i => ({
            productId: new mongoose.Types.ObjectId(String(i.productId)),
            name: i.name,
            sku: 'POOL-INPUT',
            quantity: Number(i.quantity),
            price: Number(i.price),
            total: Number(i.price) * Number(i.quantity)
          })),
          totalAmount: sellerTotal,
          platformFeeRate,
          platformFeeAmount,
          sellerEarnings,
          paymentStatus: 'completed',
          orderStatus: 'new',
          shippingDetails: {
            trackingNumber,
            carrier: 'AgroConnect Cooperative Express',
            estimatedDelivery
          }
        });
      } catch (err) {
        console.error('Error creating supplier order for pool:', err);
      }
    }

    // 3. SYNCHRONIZE TO FCO DASHBOARD (FarmPool.expensesList)
    const expenseId = `exp-pool-${Date.now()}`;
    const primaryCategory = proposal.items[0]?.category || 'Farming Inputs';
    const itemsSummary = proposal.items.map((i: any) => `${i.name} (x${i.quantity})`).join(', ');

    if (pool) {
      if (!pool.expensesList) pool.expensesList = [];
      pool.expensesList.push({
        id: expenseId,
        category: primaryCategory,
        amount: proposal.totalAmount,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        farmerId: proposal.proposedBy.toString(),
        farmerName: `${proposal.proposerName} (Consensus Pool Order)`,
        reason: `Marketplace Input Procurement: ${itemsSummary} (Unanimously approved by all ${proposal.memberSplits.length} farmers)`
      });

      // Update farm plan fulfillment notes if present
      if (pool.farmPlan) {
        if (primaryCategory.toLowerCase().includes('seed')) {
          pool.farmPlan.seeds = (pool.farmPlan.seeds ? pool.farmPlan.seeds + ' | ' : '') + `Procured: ${itemsSummary}`;
        } else if (primaryCategory.toLowerCase().includes('fertilizer')) {
          pool.farmPlan.fertilizers = (pool.farmPlan.fertilizers ? pool.farmPlan.fertilizers + ' | ' : '') + `Procured: ${itemsSummary}`;
        }
      }

      await pool.save();
      console.log(`[FCO Sync] Appended expense ${expenseId} (₹${proposal.totalAmount}) to pool ${pool._id}`);
    }

    // 4. Update proposal record to executed
    proposal.status = 'executed';
    proposal.executedOrderId = farmerOrder._id;
    proposal.fcoExpenseId = expenseId;
    await proposal.save();

    // 5. Notify all participating farmers
    for (const split of proposal.memberSplits) {
      await ActivityLogger.logActivity({
        action: 'UPDATE',
        resourceType: 'FARM_POOL',
        resourceId: proposal._id.toString(),
        resourceName: `Pool Order Executed: ${itemsSummary}`,
        userId: split.userId.toString(),
        userName: split.fullName,
        metadata: {
          orderNumber,
          totalAmount: proposal.totalAmount,
          personalShare: split.amountDue,
          fcoExpenseId: expenseId,
          type: 'pool_order_executed'
        }
      }).catch(e => console.error('Activity log error:', e));
    }

    return NextResponse.json({
      success: true,
      message: '100% Unanimous Consensus Reached! Order executed successfully and synced to FCO & Finance Bar.',
      proposal,
      order: farmerOrder,
      consensusReached: true
    });
  } catch (error: any) {
    console.error('POST /api/marketplace/pool-proposals/[id]/vote error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
