import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmPool } from '@/lib/models/FarmPool';
import { PoolPurchaseProposal } from '@/lib/models/PoolPurchaseProposal';
import { FarmerOrder } from '@/lib/models/FarmerOrder';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    // Check if farmer is in an active or planning farm pool
    const pool = await FarmPool.findOne({
      'participants.userId': userId,
      status: { $in: ['active', 'Active', 'planning', 'signing'] }
    }).lean() || await FarmPool.findOne({
      'participants.userId': userId
    }).sort({ updatedAt: -1 }).lean();

    if (!pool) {
      // Individual farmer finance fallback
      const personalOrders = await FarmerOrder.find({
        userId,
        status: { $ne: 'cancelled' }
      }).lean();

      const personalSpent = personalOrders.reduce((sum: number, o: any) => sum + (Number(o.totalAmount) || 0), 0);
      const baselineBudget = 50000;

      return NextResponse.json({
        success: true,
        hasPool: false,
        metrics: {
          budget: baselineBudget,
          spent: personalSpent,
          remaining: Math.max(0, baselineBudget - personalSpent),
          utilizationPercentage: Number(((personalSpent / baselineBudget) * 100).toFixed(1)),
          personalShareSpent: personalSpent,
          personalAllocatedBudget: baselineBudget,
          pendingProposalsCount: 0,
          poolName: null,
          categoryBreakdown: {
            seeds: 0,
            fertilizers: 0,
            equipment: 0,
            labor: 0,
            others: personalSpent
          },
          recentExpenses: []
        }
      });
    }

    // Cooperative Pool Finance Calculation
    const poolBudget = Number(pool.farmPlan?.estimatedCost) || 100000;
    const expenses = (pool.expensesList || []).map((e: any) => ({
      id: e.id,
      category: e.category || 'General',
      amount: Number(e.amount) || 0,
      date: e.date,
      farmerName: e.farmerName,
      reason: e.reason
    }));

    const totalSpent = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
    const remaining = Math.max(0, poolBudget - totalSpent);
    const utilizationPercentage = Number(((totalSpent / poolBudget) * 100).toFixed(1));

    // Calculate pro-rata individual farmer share
    const totalLand = (pool.participants || []).reduce(
      (sum: number, p: any) => sum + (Number(p.landContribution || p.landSize) || 1),
      0
    ) || 1;

    const myParticipant = (pool.participants || []).find(
      (p: any) => p.userId.toString() === userId.toString()
    );
    const myLand = Number(myParticipant?.landContribution || myParticipant?.landSize) || 1;
    const myShareRatio = myLand / totalLand;

    const personalAllocatedBudget = Math.round(poolBudget * myShareRatio);
    const personalShareSpent = Math.round(totalSpent * myShareRatio);
    const personalShareRemaining = Math.max(0, personalAllocatedBudget - personalShareSpent);

    // Calculate category breakdown
    const categoryBreakdown = {
      seeds: 0,
      fertilizers: 0,
      equipment: 0,
      labor: 0,
      others: 0
    };

    for (const exp of expenses) {
      const cat = (exp.category || '').toLowerCase();
      if (cat.includes('seed')) {
        categoryBreakdown.seeds += exp.amount;
      } else if (cat.includes('fertilizer') || cat.includes('nutrient') || cat.includes('bio')) {
        categoryBreakdown.fertilizers += exp.amount;
      } else if (cat.includes('tool') || cat.includes('equipment') || cat.includes('machinery')) {
        categoryBreakdown.equipment += exp.amount;
      } else if (cat.includes('labour') || cat.includes('labor')) {
        categoryBreakdown.labor += exp.amount;
      } else {
        categoryBreakdown.others += exp.amount;
      }
    }

    // Count pending proposals requiring attention
    const pendingProposalsCount = await PoolPurchaseProposal.countDocuments({
      poolId: pool._id,
      status: 'voting'
    });

    return NextResponse.json({
      success: true,
      hasPool: true,
      metrics: {
        poolId: pool._id,
        poolName: pool.name || 'Cooperative Farm Pool',
        totalPooledLand: totalLand,
        crop: pool.farmPlan?.selectedCrop || 'Mixed Crops',
        budget: poolBudget,
        spent: totalSpent,
        remaining,
        utilizationPercentage,
        myLand,
        mySharePercentage: Number((myShareRatio * 100).toFixed(1)),
        personalAllocatedBudget,
        personalShareSpent,
        personalShareRemaining,
        pendingProposalsCount,
        categoryBreakdown,
        recentExpenses: expenses.slice(-5).reverse()
      }
    });
  } catch (error: any) {
    console.error('GET /api/farmer/finance-bar error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
