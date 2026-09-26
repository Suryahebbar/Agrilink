/**
 * hashContract.ts
 *
 * Deterministic cryptographic utilities (SHA-256) for the AgriLink Blockchain Framework:
 *  1. Digital Farm Agreements (Contract Payload)
 *  2. Contribution Ledger (Labour, Machinery hours, Capital injections)
 *  3. Profit Distribution Records (Harvest settlement margin and distribution shares)
 *  4. Crop Sale Transactions (Bulk produce escrow / sale receipts)
 *  5. Investment Records (Partner and institutional capital injections)
 */

export interface ContractPayload {
  poolId: string;
  poolName: string;
  counselorId?: string;
  counselorName?: string;
  collaborationModel?: number;
  participants: Array<{
    userId: string;
    fullName: string;
    surveyNumber: string;
    landSize: number;
    landContribution: number;
    investmentContribution: number;
    labourContribution: number;
    signatureHash?: string;
  }>;
  farmPlan?: {
    selectedCrop?: string;
    estimatedCost?: number;
    profitSharingRatio?: string;
    lossSharingRatio?: string;
    expectedRevenue?: number;
    cultivationPeriod?: string;
  };
  version: string;
  sealedAt: string; // ISO string — locked at signing time
}

/**
 * Builds the canonical JSON string from a FarmPool document.
 * Keys are sorted alphabetically to guarantee deterministic output.
 */
export function buildContractPayload(pool: any, sealedAt: string): ContractPayload {
  return {
    poolId: pool._id?.toString() ?? '',
    poolName: pool.name ?? '',
    counselorId: pool.counselorId?.toString() ?? '',
    counselorName: pool.counselorName ?? '',
    collaborationModel: pool.collaborationModel ?? 0,
    participants: (pool.participants ?? [])
      .slice()
      .sort((a: any, b: any) => (a.userId?.toString() ?? '').localeCompare(b.userId?.toString() ?? ''))
      .map((p: any) => ({
        userId: p.userId?.toString() ?? '',
        fullName: p.fullName ?? '',
        surveyNumber: p.surveyNumber ?? '',
        landSize: p.landSize ?? 0,
        landContribution: p.landContribution ?? 0,
        investmentContribution: p.investmentContribution ?? 0,
        labourContribution: p.labourContribution ?? 0,
        signatureHash: p.signatureHash ?? '',
      })),
    farmPlan: pool.farmPlan
      ? {
          selectedCrop: pool.farmPlan.selectedCrop ?? '',
          estimatedCost: pool.farmPlan.estimatedCost ?? 0,
          profitSharingRatio: pool.farmPlan.profitSharingRatio ?? '',
          lossSharingRatio: pool.farmPlan.lossSharingRatio ?? '',
          expectedRevenue: pool.farmPlan.expectedRevenue ?? 0,
          cultivationPeriod: pool.farmPlan.cultivationPeriod ?? '',
        }
      : undefined,
    version: '1.0.0',
    sealedAt,
  };
}

/** Canonical, sorted JSON string of the payload */
export function serializePayload(payload: any): string {
  return JSON.stringify(payload, Object.keys(payload).sort());
}

// ─── 1. AGREEMENT HASHING ──────────────────────────────────────────────────

export function hashContractNode(pool: any, sealedAt: string): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require('crypto') as typeof import('crypto');
  const payload = buildContractPayload(pool, sealedAt);
  const json = serializePayload(payload);
  return '0x' + crypto.createHash('sha256').update(json, 'utf8').digest('hex');
}

export async function hashContractBrowser(pool: any, sealedAt: string): Promise<string> {
  const payload = buildContractPayload(pool, sealedAt);
  const json = serializePayload(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hex;
}

// ─── 2. CONTRIBUTION LEDGER HASHING ────────────────────────────────────────

export function buildContributionPayload(contribution: any): Record<string, any> {
  return {
    recordId: contribution._id?.toString() ?? contribution.recordId ?? '',
    poolId: contribution.poolId?.toString() ?? '',
    userId: contribution.userId?.toString() ?? '',
    farmerName: contribution.farmerName ?? '',
    type: contribution.type ?? 'labour',
    activityName: contribution.activityName ?? '',
    quantity: contribution.quantity ?? 0,
    unit: contribution.unit ?? 'hours',
    unitRate: contribution.unitRate ?? 0,
    totalValue: contribution.totalValue ?? 0,
    date: contribution.date ? new Date(contribution.date).toISOString().split('T')[0] : '',
    version: '1.0.0'
  };
}

export function hashContributionNode(contribution: any): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require('crypto') as typeof import('crypto');
  const payload = buildContributionPayload(contribution);
  const json = serializePayload(payload);
  return '0x' + crypto.createHash('sha256').update(json, 'utf8').digest('hex');
}

export async function hashContributionBrowser(contribution: any): Promise<string> {
  const payload = buildContributionPayload(contribution);
  const json = serializePayload(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hex;
}

// ─── 3. PROFIT DISTRIBUTION HASHING ────────────────────────────────────────

export function buildProfitDistributionPayload(settlement: any): Record<string, any> {
  return {
    settlementId: settlement._id?.toString() ?? '',
    poolId: settlement.poolId?.toString() ?? '',
    season: settlement.season ?? '',
    collaborationModel: settlement.collaborationModel ?? 1,
    harvestYield: settlement.harvestYield ?? 0,
    sellingPricePerUnit: settlement.sellingPricePerUnit ?? 0,
    grossHarvestRevenue: settlement.grossHarvestRevenue ?? 0,
    totalInputExpenses: settlement.totalInputExpenses ?? 0,
    agriLinkCommissionOrFee: settlement.agriLinkCommissionOrFee ?? 0,
    netDistributableMargin: settlement.netDistributableMargin ?? 0,
    memberSettlements: (settlement.memberSettlements ?? [])
      .map((m: any) => ({
        userId: m.userId?.toString() ?? '',
        fullName: m.fullName ?? '',
        equityPercentage: m.equityPercentage ?? 0,
        grossAllocation: m.grossAllocation ?? 0,
        netPayout: m.netPayout ?? 0,
      }))
      .sort((a: any, b: any) => a.userId.localeCompare(b.userId)),
    version: '1.0.0'
  };
}

export function hashProfitDistributionNode(settlement: any): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require('crypto') as typeof import('crypto');
  const payload = buildProfitDistributionPayload(settlement);
  const json = serializePayload(payload);
  return '0x' + crypto.createHash('sha256').update(json, 'utf8').digest('hex');
}

export async function hashProfitDistributionBrowser(settlement: any): Promise<string> {
  const payload = buildProfitDistributionPayload(settlement);
  const json = serializePayload(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hex;
}

// ─── 4. CROP SALE TRANSACTIONS HASHING ─────────────────────────────────────

export function buildCropSalePayload(sale: any): Record<string, any> {
  return {
    saleId: sale._id?.toString() ?? sale.saleId ?? '',
    poolId: sale.poolId?.toString() ?? '',
    cropName: sale.cropName ?? '',
    variety: sale.variety ?? '',
    saleDate: sale.saleDate ? new Date(sale.saleDate).toISOString().split('T')[0] : '',
    quantity: sale.quantity ?? 0,
    unit: sale.unit ?? 'Quintals',
    pricePerUnit: sale.pricePerUnit ?? 0,
    totalAmount: sale.totalAmount ?? 0,
    buyerName: sale.buyerName ?? '',
    buyerType: sale.buyerType ?? '',
    paymentMode: sale.paymentMode ?? 'bank_transfer',
    paymentStatus: sale.paymentStatus ?? 'released',
    version: '1.0.0'
  };
}

export function hashCropSaleNode(sale: any): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require('crypto') as typeof import('crypto');
  const payload = buildCropSalePayload(sale);
  const json = serializePayload(payload);
  return '0x' + crypto.createHash('sha256').update(json, 'utf8').digest('hex');
}

export async function hashCropSaleBrowser(sale: any): Promise<string> {
  const payload = buildCropSalePayload(sale);
  const json = serializePayload(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hex;
}

// ─── 5. INVESTMENT RECORDS HASHING ────────────────────────────────────────

export function buildInvestmentPayload(inv: any): Record<string, any> {
  return {
    investmentId: inv._id?.toString() ?? inv.investmentId ?? '',
    poolId: inv.poolId?.toString() ?? '',
    investorName: inv.investorName ?? '',
    investorType: inv.investorType ?? 'third_party',
    amount: inv.amount ?? 0,
    investmentDate: inv.investmentDate ? new Date(inv.investmentDate).toISOString().split('T')[0] : '',
    terms: inv.terms ?? '',
    expectedReturnRate: inv.expectedReturnRate ?? 0,
    tenureMonths: inv.tenureMonths ?? 12,
    disbursementMode: inv.disbursementMode ?? 'bank_transfer',
    version: '1.0.0'
  };
}

export function hashInvestmentNode(inv: any): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require('crypto') as typeof import('crypto');
  const payload = buildInvestmentPayload(inv);
  const json = serializePayload(payload);
  return '0x' + crypto.createHash('sha256').update(json, 'utf8').digest('hex');
}

export async function hashInvestmentBrowser(inv: any): Promise<string> {
  const payload = buildInvestmentPayload(inv);
  const json = serializePayload(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hex;
}
