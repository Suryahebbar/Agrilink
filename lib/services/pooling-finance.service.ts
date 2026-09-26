/**
 * Centralized Financial & Business Models Calculation Engine for AgriLink Digital Farm Pooling
 * Handles Models 1 to 5, multi-factor weighting, expense deductions, and net payout splits.
 */

export interface ParticipantContributionSummary {
  userId: string;
  fullName: string;
  landAcres: number;
  initialInvestment: number;
  totalLabourHours: number;
  labourValue: number; // hours * rate
  totalMachineryHours: number;
  machineryValue: number; // hours * rate
  extraCapitalInjected: number;
}

export interface ModelCalculationInput {
  modelNumber: 1 | 2 | 3 | 4 | 5;
  participants: ParticipantContributionSummary[];
  totalHarvestRevenue: number;
  totalInputExpenses: number;
  customParameters?: {
    leaseRatePerAcre?: number; // Model 1
    managementFeePercentage?: number; // Model 2 (e.g. 10%)
    partnerEquityRatio?: { agriLinkShare: number; farmerShare: number }; // Model 3 (e.g. 50, 50)
    marketingCommissionPercentage?: number; // Model 4 (e.g. 5%)
    weights?: {
      land: number; // e.g. 0.35 (35%)
      capital: number; // e.g. 0.25 (25%)
      labour: number; // e.g. 0.20 (20%)
      machinery: number; // e.g. 0.20 (20%)
    };
  };
}

export interface MemberPayoutResult {
  userId: string;
  fullName: string;
  landAcres: number;
  equityPercentage: number;
  grossAllocation: number;
  expenseDeduction: number;
  labourReimbursement: number;
  machineryReimbursement: number;
  netPayout: number;
  breakdownNotes: string;
}

export interface PoolFinancialStatement {
  modelNumber: number;
  modelName: string;
  totalLandAcres: number;
  grossHarvestRevenue: number;
  totalInputExpenses: number;
  agriLinkCommissionOrFee: number;
  netDistributableMargin: number;
  memberPayouts: MemberPayoutResult[];
  status: 'profitable' | 'break_even' | 'loss';
}

export class PoolingFinanceService {
  /**
   * Main Dispatcher for Calculating Pool Settlement based on selected Business Model
   */
  public static calculateSettlement(input: ModelCalculationInput): PoolFinancialStatement {
    switch (input.modelNumber) {
      case 1:
        return this.calculateModel1LandLease(input);
      case 2:
        return this.calculateModel2ManagedFarming(input);
      case 3:
        return this.calculateModel3PartnershipFarming(input);
      case 4:
        return this.calculateModel4MarketingPartner(input);
      case 5:
      default:
        return this.calculateModel5CollaborativePool(input);
    }
  }

  /**
   * MODEL 1: LAND LEASE
   * Farmer leases land to AgriLink for a fixed guaranteed amount.
   * AgriLink absorbs cultivation expenses & takes residual harvest revenue.
   */
  private static calculateModel1LandLease(input: ModelCalculationInput): PoolFinancialStatement {
    const leaseRate = input.customParameters?.leaseRatePerAcre || 25000; // Default ₹25,000/acre/season
    const totalLand = input.participants.reduce((sum, p) => sum + (p.landAcres || 0), 0);
    const totalLeasePayable = totalLand * leaseRate;

    const netMargin = input.totalHarvestRevenue - input.totalInputExpenses - totalLeasePayable;

    const memberPayouts: MemberPayoutResult[] = input.participants.map((p) => {
      const landShare = totalLand > 0 ? (p.landAcres / totalLand) : (1 / input.participants.length);
      const guaranteedPayout = p.landAcres * leaseRate;

      return {
        userId: p.userId,
        fullName: p.fullName,
        landAcres: p.landAcres,
        equityPercentage: parseFloat((landShare * 100).toFixed(2)),
        grossAllocation: guaranteedPayout,
        expenseDeduction: 0, // Expenses absorbed by AgriLink
        labourReimbursement: p.labourValue || 0,
        machineryReimbursement: p.machineryValue || 0,
        netPayout: Math.round(guaranteedPayout + (p.labourValue || 0) + (p.machineryValue || 0)),
        breakdownNotes: `Guaranteed Lease @ ₹${leaseRate.toLocaleString()}/acre for ${p.landAcres} acres`
      };
    });

    return {
      modelNumber: 1,
      modelName: 'Model 1 – Land Lease (Fixed Income)',
      totalLandAcres: totalLand,
      grossHarvestRevenue: input.totalHarvestRevenue,
      totalInputExpenses: input.totalInputExpenses,
      agriLinkCommissionOrFee: Math.max(0, netMargin),
      netDistributableMargin: totalLeasePayable,
      memberPayouts,
      status: netMargin >= 0 ? 'profitable' : 'loss'
    };
  }

  /**
   * MODEL 2: MANAGED FARMING
   * Farmer owns land and provides investment.
   * AgriLink manages operations and charges a fixed management fee (e.g. 10%).
   */
  private static calculateModel2ManagedFarming(input: ModelCalculationInput): PoolFinancialStatement {
    const feePct = input.customParameters?.managementFeePercentage || 10; // 10%
    const totalLand = input.participants.reduce((sum, p) => sum + (p.landAcres || 0), 0);
    const agriLinkFee = (input.totalHarvestRevenue * feePct) / 100;
    const netPoolProfit = input.totalHarvestRevenue - input.totalInputExpenses - agriLinkFee;

    const memberPayouts: MemberPayoutResult[] = input.participants.map((p) => {
      const landRatio = totalLand > 0 ? p.landAcres / totalLand : 1 / input.participants.length;
      const shareOfRevenue = input.totalHarvestRevenue * landRatio;
      const shareOfExpenses = input.totalInputExpenses * landRatio;
      const shareOfFee = agriLinkFee * landRatio;
      const farmerNet = shareOfRevenue - shareOfExpenses - shareOfFee;

      return {
        userId: p.userId,
        fullName: p.fullName,
        landAcres: p.landAcres,
        equityPercentage: parseFloat((landRatio * 100).toFixed(2)),
        grossAllocation: Math.round(shareOfRevenue),
        expenseDeduction: Math.round(shareOfExpenses + shareOfFee),
        labourReimbursement: p.labourValue || 0,
        machineryReimbursement: p.machineryValue || 0,
        netPayout: Math.round(farmerNet + (p.labourValue || 0) + (p.machineryValue || 0)),
        breakdownNotes: `Gross ₹${Math.round(shareOfRevenue).toLocaleString()} minus inputs (₹${Math.round(shareOfExpenses).toLocaleString()}) & AgriLink ${feePct}% fee (₹${Math.round(shareOfFee).toLocaleString()})`
      };
    });

    return {
      modelNumber: 2,
      modelName: 'Model 2 – Managed Farming (Commission/Fee)',
      totalLandAcres: totalLand,
      grossHarvestRevenue: input.totalHarvestRevenue,
      totalInputExpenses: input.totalInputExpenses,
      agriLinkCommissionOrFee: Math.round(agriLinkFee),
      netDistributableMargin: Math.round(netPoolProfit),
      memberPayouts,
      status: netPoolProfit >= 0 ? 'profitable' : 'loss'
    };
  }

  /**
   * MODEL 3: PARTNERSHIP FARMING
   * AgriLink/Partner supplies 100% investment; Farmer contributes Land + Labour.
   * Net profit is split by agreed equity ratio (e.g., 50-50).
   */
  private static calculateModel3PartnershipFarming(input: ModelCalculationInput): PoolFinancialStatement {
    const partnerRatio = input.customParameters?.partnerEquityRatio || { agriLinkShare: 50, farmerShare: 50 };
    const totalLand = input.participants.reduce((sum, p) => sum + (p.landAcres || 0), 0);
    const netOperatingProfit = input.totalHarvestRevenue - input.totalInputExpenses;

    const farmerPoolShareAmount = (netOperatingProfit * partnerRatio.farmerShare) / 100;
    const agriLinkPartnerCut = (netOperatingProfit * partnerRatio.agriLinkShare) / 100;

    const memberPayouts: MemberPayoutResult[] = input.participants.map((p) => {
      const landRatio = totalLand > 0 ? p.landAcres / totalLand : 1 / input.participants.length;
      const farmerShare = farmerPoolShareAmount * landRatio;

      return {
        userId: p.userId,
        fullName: p.fullName,
        landAcres: p.landAcres,
        equityPercentage: parseFloat((landRatio * 100).toFixed(2)),
        grossAllocation: Math.round(input.totalHarvestRevenue * landRatio),
        expenseDeduction: Math.round(input.totalInputExpenses * landRatio),
        labourReimbursement: p.labourValue || 0,
        machineryReimbursement: p.machineryValue || 0,
        netPayout: Math.round(farmerShare + (p.labourValue || 0) + (p.machineryValue || 0)),
        breakdownNotes: `50/50 Partner split on net profit. Farmer pool share: ₹${Math.round(farmerShare).toLocaleString()}`
      };
    });

    return {
      modelNumber: 3,
      modelName: 'Model 3 – Partnership Farming (Equity Split)',
      totalLandAcres: totalLand,
      grossHarvestRevenue: input.totalHarvestRevenue,
      totalInputExpenses: input.totalInputExpenses,
      agriLinkCommissionOrFee: Math.round(agriLinkPartnerCut),
      netDistributableMargin: Math.round(farmerPoolShareAmount),
      memberPayouts,
      status: netOperatingProfit >= 0 ? 'profitable' : 'loss'
    };
  }

  /**
   * MODEL 4: MARKETING PARTNER
   * Farmer manages cultivation independently; AgriLink charges a standard marketing fee (e.g. 5%) on harvest sale.
   */
  private static calculateModel4MarketingPartner(input: ModelCalculationInput): PoolFinancialStatement {
    const commissionPct = input.customParameters?.marketingCommissionPercentage || 5; // 5%
    const totalLand = input.participants.reduce((sum, p) => sum + (p.landAcres || 0), 0);
    const marketingCommission = (input.totalHarvestRevenue * commissionPct) / 100;
    const netDistributable = input.totalHarvestRevenue - marketingCommission;

    const memberPayouts: MemberPayoutResult[] = input.participants.map((p) => {
      const landRatio = totalLand > 0 ? p.landAcres / totalLand : 1 / input.participants.length;
      const memberGross = input.totalHarvestRevenue * landRatio;
      const memberCommission = marketingCommission * landRatio;
      const memberNet = memberGross - memberCommission;

      return {
        userId: p.userId,
        fullName: p.fullName,
        landAcres: p.landAcres,
        equityPercentage: parseFloat((landRatio * 100).toFixed(2)),
        grossAllocation: Math.round(memberGross),
        expenseDeduction: Math.round(memberCommission),
        labourReimbursement: 0,
        machineryReimbursement: 0,
        netPayout: Math.round(memberNet),
        breakdownNotes: `Gross sale ₹${Math.round(memberGross).toLocaleString()} minus ${commissionPct}% AgriLink Marketing Cut (₹${Math.round(memberCommission).toLocaleString()})`
      };
    });

    return {
      modelNumber: 4,
      modelName: 'Model 4 – Marketing Partner (Sales Commission)',
      totalLandAcres: totalLand,
      grossHarvestRevenue: input.totalHarvestRevenue,
      totalInputExpenses: input.totalInputExpenses,
      agriLinkCommissionOrFee: Math.round(marketingCommission),
      netDistributableMargin: Math.round(netDistributable),
      memberPayouts,
      status: 'profitable'
    };
  }

  /**
   * MODEL 5: COLLABORATIVE FARM POOL (MAIN RESEARCH ALGORITHM)
   * Multi-Factor Contribution Weighting:
   * Dynamic Equity % = w1*(Land_i / TotalLand) + w2*(Capital_i / TotalCapital) + w3*(Labour_i / TotalLabour) + w4*(Machinery_i / TotalMachinery)
   */
  private static calculateModel5CollaborativePool(input: ModelCalculationInput): PoolFinancialStatement {
    const weights = input.customParameters?.weights || {
      land: 0.35, // 35%
      capital: 0.25, // 25%
      labour: 0.20, // 20%
      machinery: 0.20 // 20%
    };

    const totalLand = input.participants.reduce((s, p) => s + (p.landAcres || 0), 0);
    const totalCapital = input.participants.reduce((s, p) => s + (p.initialInvestment || 0) + (p.extraCapitalInjected || 0), 0);
    const totalLabourHours = input.participants.reduce((s, p) => s + (p.totalLabourHours || 0), 0);
    const totalMachineryHours = input.participants.reduce((s, p) => s + (p.totalMachineryHours || 0), 0);

    // Platform maintenance/facilitation fee (e.g. 2.5%)
    const platformFee = (input.totalHarvestRevenue * 0.025);
    const netPoolProfitOrLoss = input.totalHarvestRevenue - input.totalInputExpenses - platformFee;

    const memberPayouts: MemberPayoutResult[] = input.participants.map((p) => {
      const landFactor = totalLand > 0 ? (p.landAcres / totalLand) : (1 / input.participants.length);
      const totalMemberCap = (p.initialInvestment || 0) + (p.extraCapitalInjected || 0);
      const capitalFactor = totalCapital > 0 ? (totalMemberCap / totalCapital) : landFactor;
      const labourFactor = totalLabourHours > 0 ? (p.totalLabourHours / totalLabourHours) : 0;
      const machineryFactor = totalMachineryHours > 0 ? (p.totalMachineryHours / totalMachineryHours) : 0;

      // Active weighting calculation
      let activeWeightSum = weights.land + (totalCapital > 0 ? weights.capital : 0) + (totalLabourHours > 0 ? weights.labour : 0) + (totalMachineryHours > 0 ? weights.machinery : 0);
      if (activeWeightSum === 0) activeWeightSum = 1;

      const rawEquityShare = (
        (weights.land * landFactor) +
        (totalCapital > 0 ? weights.capital * capitalFactor : 0) +
        (totalLabourHours > 0 ? weights.labour * labourFactor : 0) +
        (totalMachineryHours > 0 ? weights.machinery * machineryFactor : 0)
      ) / activeWeightSum;

      const equityPercentage = parseFloat((rawEquityShare * 100).toFixed(2));
      const memberProfitShare = netPoolProfitOrLoss * rawEquityShare;
      const netPayout = Math.max(0, Math.round(memberProfitShare + (p.labourValue || 0) + (p.machineryValue || 0)));

      return {
        userId: p.userId,
        fullName: p.fullName,
        landAcres: p.landAcres,
        equityPercentage,
        grossAllocation: Math.round(input.totalHarvestRevenue * rawEquityShare),
        expenseDeduction: Math.round(input.totalInputExpenses * rawEquityShare),
        labourReimbursement: p.labourValue || 0,
        machineryReimbursement: p.machineryValue || 0,
        netPayout,
        breakdownNotes: `Multi-Factor Equity: ${equityPercentage}% (Land: ${(landFactor*100).toFixed(1)}%, Cap: ${(capitalFactor*100).toFixed(1)}%, Labour: ${p.totalLabourHours}h, Mach: ${p.totalMachineryHours}h)`
      };
    });

    return {
      modelNumber: 5,
      modelName: 'Model 5 – Collaborative Farm Pool (Multi-Factor Dynamic Consensus)',
      totalLandAcres: totalLand,
      grossHarvestRevenue: input.totalHarvestRevenue,
      totalInputExpenses: input.totalInputExpenses,
      agriLinkCommissionOrFee: Math.round(platformFee),
      netDistributableMargin: Math.round(netPoolProfitOrLoss),
      memberPayouts,
      status: netPoolProfitOrLoss >= 0 ? 'profitable' : 'loss'
    };
  }
}
