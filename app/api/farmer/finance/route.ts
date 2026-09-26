import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmerExpense } from '@/lib/models/FarmerExpense';
import { FarmerCapitalInvestment } from '@/lib/models/FarmerCapitalInvestment';
import { CropSale } from '@/lib/models/CropSale';
import { PoolSettlement } from '@/lib/models/PoolSettlement';
import { FarmFinanceEngine } from '@/lib/services/farm-finance.service';
import User from '@/models/User';
import { auditLog } from '@/lib/auditLogger';
import { ActivityAction, LogModule, ResourceType } from '@/lib/auditTypes';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const season = url.searchParams.get('season') || 'All Seasons';

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId parameter' }, { status: 400 });
    }

    const expenseQuery: any = { farmerId: userId };
    const investmentQuery: any = { farmerId: userId };
    if (season !== 'All Seasons') {
      expenseQuery.season = season;
      investmentQuery.season = season;
    }

    const [expenses, investments, sales, settlements] = await Promise.all([
      FarmerExpense.find(expenseQuery).sort({ expenseDate: -1 }),
      FarmerCapitalInvestment.find(investmentQuery).sort({ investmentDate: -1 }),
      CropSale.find({ recordedBy: userId }).sort({ saleDate: -1 }),
      PoolSettlement.find({ 'memberSettlements.userId': userId }).sort({ settledAt: -1 })
    ]);

    const financialSummary = FarmFinanceEngine.computeStatements(
      userId,
      season,
      expenses,
      investments,
      sales,
      settlements
    );

    return NextResponse.json({
      success: true,
      summary: financialSummary,
      expenses,
      investments,
      sales,
      settlements
    });
  } catch (error: any) {
    console.error('GET /api/farmer/finance error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { action } = body;

    // Action: log_expense
    if (action === 'log_expense' || !action) {
      const {
        userId,
        cropName,
        season,
        plotSurveyNo,
        plotAreaAcres,
        category,
        title,
        amount,
        quantity,
        unit,
        unitPrice,
        expenseDate,
        paymentMode,
        vendorName,
        receiptNumber,
        notes
      } = body;

      if (!userId || !cropName || !category || !title || amount === undefined) {
        return NextResponse.json(
          { success: false, error: 'Missing required expense fields (userId, cropName, category, title, amount)' },
          { status: 400 }
        );
      }

      const user = await User.findById(userId);
      const farmerName = user?.name || 'Farmer';

      const newExpense = await FarmerExpense.create({
        farmerId: userId,
        farmerName,
        cropName,
        season: season || 'Kharif 2026',
        plotSurveyNo,
        plotAreaAcres: Number(plotAreaAcres) || 1,
        category,
        title,
        amount: Number(amount),
        quantity: Number(quantity) || 1,
        unit: unit || 'Units',
        unitPrice: Number(unitPrice) || 0,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        paymentMode: paymentMode || 'cash',
        vendorName,
        receiptNumber,
        notes
      });

      void auditLog({
        action: ActivityAction.CREATE,
        module: LogModule.FINANCIAL,
        resourceType: ResourceType.FARM_EXPENSE,
        resourceId: newExpense._id.toString(),
        resourceName: `${cropName} - ${title}`,
        userId,
        userName: farmerName,
        metadata: { category, amount, paymentMode }
      });

      return NextResponse.json({
        success: true,
        message: 'Farm expense logged successfully',
        expense: newExpense
      });
    }

    // Action: log_investment
    if (action === 'log_investment') {
      const {
        userId,
        cropName,
        season,
        plotAreaAcres,
        investmentType,
        title,
        capitalAmount,
        investmentDate,
        tenureYears,
        interestRateAnnual,
        expectedRevenue,
        fundingSource,
        notes
      } = body;

      if (!userId || !cropName || !title || capitalAmount === undefined) {
        return NextResponse.json(
          { success: false, error: 'Missing required investment fields (userId, cropName, title, capitalAmount)' },
          { status: 400 }
        );
      }

      const user = await User.findById(userId);
      const farmerName = user?.name || 'Farmer';

      const newInvestment = await FarmerCapitalInvestment.create({
        farmerId: userId,
        farmerName,
        cropName,
        season: season || 'Annual 2026',
        plotAreaAcres: Number(plotAreaAcres) || 1,
        investmentType: investmentType || 'self_equity',
        title,
        capitalAmount: Number(capitalAmount),
        investmentDate: investmentDate ? new Date(investmentDate) : new Date(),
        tenureYears: Number(tenureYears) || 1,
        interestRateAnnual: Number(interestRateAnnual) || 0,
        expectedRevenue: Number(expectedRevenue) || 0,
        fundingSource,
        notes
      });

      void auditLog({
        action: ActivityAction.CREATE,
        module: LogModule.FINANCIAL,
        resourceType: ResourceType.FARM_INVESTMENT,
        resourceId: newInvestment._id.toString(),
        resourceName: `${cropName} - ${title}`,
        userId,
        userName: farmerName,
        metadata: { capitalAmount, investmentType, fundingSource }
      });

      return NextResponse.json({
        success: true,
        message: 'Capital investment recorded successfully',
        investment: newInvestment
      });
    }

    return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });

  } catch (error: any) {
    console.error('POST /api/farmer/finance error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type') || 'expense';

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id parameter' }, { status: 400 });
    }

    if (type === 'expense') {
      await FarmerExpense.findByIdAndDelete(id);
    } else if (type === 'investment') {
      await FarmerCapitalInvestment.findByIdAndDelete(id);
    }

    return NextResponse.json({ success: true, message: 'Record deleted successfully' });
  } catch (error: any) {
    console.error('DELETE /api/farmer/finance error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
