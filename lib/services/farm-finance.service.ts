import { ExpenseCategory } from '@/lib/models/FarmerExpense';

export interface FarmFinancialSummary {
  farmerId: string;
  season: string;
  totalExpenses: number;
  totalInvestments: number;
  totalRevenue: number;
  netProfit: number;
  profitMarginPercentage: number;
  roiPercentage: number; // (netProfit / totalCost) * 100
  totalAcreage: number;
  costPerAcre: number;
  revenuePerAcre: number;
  profitPerAcre: number;
  
  // Categorical Expenses Breakdown
  expensesByCategory: Record<ExpenseCategory | string, {
    totalAmount: number;
    percentage: number;
    count: number;
  }>;

  // Crop-wise ROI Breakdown
  cropPerformance: Array<{
    cropName: string;
    acreage: number;
    expenses: number;
    capitalInvested: number;
    revenue: number;
    netProfit: number;
    roiPercentage: number;
    costPerAcre: number;
    revenuePerAcre: number;
  }>;
}

export class FarmFinanceEngine {
  static computeStatements(
    farmerId: string,
    season: string,
    expenses: any[],
    investments: any[],
    sales: any[],
    settlements: any[] = []
  ): FarmFinancialSummary {
    // 1. Calculate Total Expenses
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // 2. Calculate Total Capital Injected
    const totalInvestments = investments.reduce((sum, inv) => sum + (Number(inv.capitalAmount) || 0), 0);

    // 3. Calculate Revenue from Direct Crop Sales + Pool Settlement Payouts
    const directSalesRevenue = sales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
    
    // Member payout from pool settlements
    let poolPayoutRevenue = 0;
    settlements.forEach(st => {
      const myPayout = st.memberSettlements?.find((m: any) => m.userId?.toString() === farmerId?.toString());
      if (myPayout) {
        poolPayoutRevenue += (Number(myPayout.netPayout) || 0);
      }
    });

    const totalRevenue = directSalesRevenue + poolPayoutRevenue;
    const totalCostBasis = totalExpenses + (totalInvestments * 0.2); // amortize 20% capital per season baseline
    const netProfit = totalRevenue - totalExpenses;
    const profitMarginPercentage = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const roiPercentage = totalCostBasis > 0 ? (netProfit / totalCostBasis) * 100 : (netProfit > 0 ? 100 : 0);

    // 4. Expenses by Category
    const categoryTotals: Record<string, { totalAmount: number; percentage: number; count: number }> = {
      seed: { totalAmount: 0, percentage: 0, count: 0 },
      fertilizer: { totalAmount: 0, percentage: 0, count: 0 },
      diesel_fuel: { totalAmount: 0, percentage: 0, count: 0 },
      labour: { totalAmount: 0, percentage: 0, count: 0 },
      irrigation_electricity: { totalAmount: 0, percentage: 0, count: 0 },
      machinery_rent: { totalAmount: 0, percentage: 0, count: 0 },
      pesticides: { totalAmount: 0, percentage: 0, count: 0 },
      transportation: { totalAmount: 0, percentage: 0, count: 0 },
      storage: { totalAmount: 0, percentage: 0, count: 0 },
      miscellaneous: { totalAmount: 0, percentage: 0, count: 0 }
    };

    expenses.forEach(e => {
      const cat = e.category || 'miscellaneous';
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { totalAmount: 0, percentage: 0, count: 0 };
      }
      categoryTotals[cat].totalAmount += (Number(e.amount) || 0);
      categoryTotals[cat].count += 1;
    });

    Object.keys(categoryTotals).forEach(k => {
      categoryTotals[k].percentage = totalExpenses > 0 ? (categoryTotals[k].totalAmount / totalExpenses) * 100 : 0;
    });

    // 5. Crop-wise Performance & ROI
    const cropMap: Record<string, {
      cropName: string;
      acreage: number;
      expenses: number;
      capitalInvested: number;
      revenue: number;
    }> = {};

    // Group expenses by crop
    expenses.forEach(e => {
      const cName = e.cropName || 'General Farm';
      if (!cropMap[cName]) {
        cropMap[cName] = { cropName: cName, acreage: Number(e.plotAreaAcres) || 1, expenses: 0, capitalInvested: 0, revenue: 0 };
      }
      cropMap[cName].expenses += (Number(e.amount) || 0);
      if (e.plotAreaAcres && e.plotAreaAcres > cropMap[cName].acreage) {
        cropMap[cName].acreage = Number(e.plotAreaAcres);
      }
    });

    // Group investments by crop
    investments.forEach(inv => {
      const cName = inv.cropName || 'General Farm';
      if (!cropMap[cName]) {
        cropMap[cName] = { cropName: cName, acreage: Number(inv.plotAreaAcres) || 1, expenses: 0, capitalInvested: 0, revenue: 0 };
      }
      cropMap[cName].capitalInvested += (Number(inv.capitalAmount) || 0);
    });

    // Group sales revenue by crop
    sales.forEach(s => {
      const cName = s.cropName || 'General Farm';
      if (!cropMap[cName]) {
        cropMap[cName] = { cropName: cName, acreage: 1, expenses: 0, capitalInvested: 0, revenue: 0 };
      }
      cropMap[cName].revenue += (Number(s.totalAmount) || 0);
    });

    const cropPerformance = Object.values(cropMap).map(c => {
      const cProfit = c.revenue - c.expenses;
      const cCostBasis = c.expenses + (c.capitalInvested * 0.2);
      const cRoi = cCostBasis > 0 ? (cProfit / cCostBasis) * 100 : 0;
      const acres = c.acreage > 0 ? c.acreage : 1;

      return {
        cropName: c.cropName,
        acreage: acres,
        expenses: c.expenses,
        capitalInvested: c.capitalInvested,
        revenue: c.revenue,
        netProfit: cProfit,
        roiPercentage: cRoi,
        costPerAcre: c.expenses / acres,
        revenuePerAcre: c.revenue / acres,
      };
    });

    // Total Acreage
    const totalAcreage = cropPerformance.reduce((sum, c) => sum + c.acreage, 0) || 1;

    return {
      farmerId,
      season,
      totalExpenses,
      totalInvestments,
      totalRevenue,
      netProfit,
      profitMarginPercentage,
      roiPercentage,
      totalAcreage,
      costPerAcre: totalExpenses / totalAcreage,
      revenuePerAcre: totalRevenue / totalAcreage,
      profitPerAcre: netProfit / totalAcreage,
      expensesByCategory: categoryTotals,
      cropPerformance
    };
  }
}

export default FarmFinanceEngine;
