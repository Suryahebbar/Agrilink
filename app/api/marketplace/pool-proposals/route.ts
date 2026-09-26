import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { PoolPurchaseProposal } from '@/lib/models/PoolPurchaseProposal';
import { FarmPool } from '@/lib/models/FarmPool';
import User from '@/models/User';
import { ActivityLogger } from '@/lib/utils/activity-helper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    let poolId = searchParams.get('poolId');

    let pool: any = null;

    if (poolId) {
      pool = await FarmPool.findById(poolId).lean();
    } else if (userId) {
      pool = await FarmPool.findOne({
        'participants.userId': userId,
        status: { $in: ['active', 'planning', 'signing', 'Active'] }
      }).sort({ updatedAt: -1 }).lean();
      if (!pool) {
        // Try any pool containing this user
        pool = await FarmPool.findOne({ 'participants.userId': userId }).sort({ updatedAt: -1 }).lean();
      }
      if (pool) {
        poolId = pool._id.toString();
      }
    }

    if (!poolId) {
      return NextResponse.json({
        success: true,
        proposals: [],
        pool: null,
        message: 'No active pool found for this user.'
      });
    }

    const proposals = await PoolPurchaseProposal.find({ poolId }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      pool: {
        _id: pool._id,
        name: pool.name || 'Cooperative Farm Pool',
        status: pool.status,
        participants: pool.participants || [],
        farmPlan: pool.farmPlan || null,
        expensesList: pool.expensesList || []
      },
      proposals
    });
  } catch (error: any) {
    console.error('GET /api/marketplace/pool-proposals error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { poolId, userId, items, notes } = body;

    if (!poolId || !userId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'poolId, userId, and at least one item are required'
      }, { status: 400 });
    }

    const [pool, user] = await Promise.all([
      FarmPool.findById(poolId),
      User.findById(userId).lean()
    ]);

    if (!pool) {
      return NextResponse.json({ success: false, error: 'Farm Pool not found' }, { status: 404 });
    }
    if (!user) {
      return NextResponse.json({ success: false, error: 'Proposer user not found' }, { status: 404 });
    }

    // Verify user is in pool participants
    const isParticipant = pool.participants.some(
      (p: any) => p.userId.toString() === userId.toString()
    );
    if (!isParticipant) {
      return NextResponse.json({
        success: false,
        error: 'You must be a member of this farm pool to propose group purchases'
      }, { status: 403 });
    }

    // Calculate total order amount
    const totalAmount = items.reduce((sum: number, item: any) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);

    if (totalAmount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Total amount must be greater than zero'
      }, { status: 400 });
    }

    // Calculate pro-rata splits based on land extent (landSize or landContribution)
    const totalLand = pool.participants.reduce((sum: number, p: any) => {
      const land = Number(p.landContribution || p.landSize) || 1;
      return sum + land;
    }, 0);

    let allocatedSum = 0;
    const memberSplits = pool.participants.map((p: any, idx: number) => {
      const land = Number(p.landContribution || p.landSize) || 1;
      const sharePercentage = Number(((land / totalLand) * 100).toFixed(2));
      let amountDue = Math.round(totalAmount * (land / totalLand));
      
      // On the last item, adjust for rounding differences
      if (idx === pool.participants.length - 1) {
        amountDue = totalAmount - allocatedSum;
      } else {
        allocatedSum += amountDue;
      }

      const isProposer = p.userId.toString() === userId.toString();

      return {
        userId: p.userId,
        fullName: p.fullName || 'Farmer Partner',
        phone: p.phone || '',
        landSize: land,
        sharePercentage,
        amountDue,
        status: isProposer ? ('approved' as const) : ('pending' as const),
        votedAt: isProposer ? new Date() : undefined,
      };
    });

    const isSingleMember = pool.participants.length <= 1;

    const proposal = await PoolPurchaseProposal.create({
      poolId: pool._id,
      poolName: pool.name || 'Cooperative Farm Pool',
      proposedBy: user._id,
      proposerName: user.fullName || 'Farmer Partner',
      items: items.map((it: any) => {
        const rawImg = it.image || it.images?.[0] || '';
        const imgUrl = typeof rawImg === 'string' ? rawImg : (rawImg?.url || '');
        return {
          productId: it.productId || it.id || it._id,
          name: it.name || it.title,
          price: Number(it.price) || 0,
          quantity: Number(it.quantity) || 1,
          image: imgUrl,
          category: it.category || 'Inputs',
          unit: it.unit || 'unit',
          sellerId: it.sellerId,
          sellerName: it.sellerName
        };
      }),
      totalAmount,
      memberSplits,
      status: isSingleMember ? 'approved' : 'voting',
      notes: notes || 'Marketplace group input procurement'
    });

    // Notify other members
    for (const p of pool.participants) {
      if (p.userId.toString() !== userId.toString()) {
        const split = memberSplits.find((s: any) => s.userId.toString() === p.userId.toString());
        await ActivityLogger.logActivity({
          action: 'CREATE',
          resourceType: 'FARM_POOL',
          resourceId: proposal._id.toString(),
          resourceName: `Group Purchase: ${proposal.items.map((i: any) => i.name).join(', ')}`,
          userId: p.userId.toString(),
          userName: p.fullName,
          metadata: {
            poolId: pool._id.toString(),
            poolName: pool.name,
            totalAmount,
            memberShare: split?.amountDue || 0,
            proposerName: user.fullName,
            type: 'pool_purchase_proposal'
          }
        }).catch(err => console.error('Activity log error:', err));
      }
    }

    return NextResponse.json({
      success: true,
      message: isSingleMember 
        ? 'Group purchase proposal approved!' 
        : 'Group purchase proposed! Notification sent to all pooled farmers for consensus approval.',
      proposal
    });
  } catch (error: any) {
    console.error('POST /api/marketplace/pool-proposals error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
