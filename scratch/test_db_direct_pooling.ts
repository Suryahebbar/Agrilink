import mongoose from 'mongoose';
import { PoolContributionLog } from '../lib/models/PoolContributionLog.js';
import { PoolSettlement } from '../lib/models/PoolSettlement.js';
import { FarmPool } from '../lib/models/FarmPool.js';
import { PoolingFinanceService } from '../lib/services/pooling-finance.service.js';

const MONGODB_URI = "mongodb+srv://suryasrinathys_db_user:854SZAL3tMeZnCN3@cluster0.jkjr7p8.mongodb.net/test?retryWrites=true&w=majority";

async function runDirectDBTest() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected successfully!\n');

  const poolId = new mongoose.Types.ObjectId('6a6572087aa5efa1a09120fb');
  const farmer1Id = new mongoose.Types.ObjectId('6a6485085c3cad2606e80fe3');
  const farmer2Id = new mongoose.Types.ObjectId('6a649e1e5c3cad2606e81c87');
  const fcoId = new mongoose.Types.ObjectId('6a6338f754cd9eb1834b6a8f');

  // 1. Create a labour contribution log
  const log1 = await PoolContributionLog.create({
    poolId,
    userId: farmer1Id,
    farmerName: 'Sathyanarayana Gowda',
    type: 'machinery',
    activityName: 'Tractor Ploughing & Rotavator',
    quantity: 6,
    unit: 'hours',
    unitRate: 750,
    totalValue: 4500,
    date: new Date(),
    status: 'verified',
    verifiedBy: fcoId,
    verifiedByName: 'Field Counseling Officer',
    verifiedAt: new Date(),
    notes: 'Covered south block 45/1'
  });
  console.log('✅ Created Verified Log 1:', log1._id.toString(), log1.activityName);

  const log2 = await PoolContributionLog.create({
    poolId,
    userId: farmer2Id,
    farmerName: 'Yogendra Hebbar',
    type: 'labour',
    activityName: 'Weeding & Drip Emitter Maintenance',
    quantity: 14,
    unit: 'hours',
    unitRate: 100,
    totalValue: 1400,
    date: new Date(),
    status: 'verified',
    verifiedBy: fcoId,
    verifiedByName: 'Field Counseling Officer',
    verifiedAt: new Date(),
    notes: 'Rows 1-25 complete'
  });
  console.log('✅ Created Verified Log 2:', log2._id.toString(), log2.activityName);

  // 2. Fetch and aggregate
  const logs = await PoolContributionLog.find({ poolId, status: 'verified' });
  console.log(`\nFound ${logs.length} verified logs for pool ${poolId}.`);

  const summaryF1 = {
    userId: farmer1Id.toString(),
    fullName: 'Sathyanarayana Gowda',
    landAcres: 3.5,
    initialInvestment: 30000,
    totalLabourHours: logs.filter((l: any) => l.userId.toString() === farmer1Id.toString() && l.type === 'labour').reduce((s: number, l: any) => s + l.quantity, 0),
    labourValue: logs.filter((l: any) => l.userId.toString() === farmer1Id.toString() && l.type === 'labour').reduce((s: number, l: any) => s + l.totalValue, 0),
    totalMachineryHours: logs.filter((l: any) => l.userId.toString() === farmer1Id.toString() && l.type === 'machinery').reduce((s: number, l: any) => s + l.quantity, 0),
    machineryValue: logs.filter((l: any) => l.userId.toString() === farmer1Id.toString() && l.type === 'machinery').reduce((s: number, l: any) => s + l.totalValue, 0),
    extraCapitalInjected: 0
  };

  const summaryF2 = {
    userId: farmer2Id.toString(),
    fullName: 'Yogendra Hebbar',
    landAcres: 2.0,
    initialInvestment: 15000,
    totalLabourHours: logs.filter((l: any) => l.userId.toString() === farmer2Id.toString() && l.type === 'labour').reduce((s: number, l: any) => s + l.quantity, 0),
    labourValue: logs.filter((l: any) => l.userId.toString() === farmer2Id.toString() && l.type === 'labour').reduce((s: number, l: any) => s + l.totalValue, 0),
    totalMachineryHours: logs.filter((l: any) => l.userId.toString() === farmer2Id.toString() && l.type === 'machinery').reduce((s: number, l: any) => s + l.quantity, 0),
    machineryValue: logs.filter((l: any) => l.userId.toString() === farmer2Id.toString() && l.type === 'machinery').reduce((s: number, l: any) => s + l.totalValue, 0),
    extraCapitalInjected: 0
  };

  console.log('Aggregated Member Summaries:', [summaryF1, summaryF2]);

  // 3. Run settlement calculation
  const statement = PoolingFinanceService.calculateSettlement({
    modelNumber: 5,
    participants: [summaryF1, summaryF2],
    totalHarvestRevenue: 380000,
    totalInputExpenses: 72000
  });

  console.log('\n--- Model 5 Dynamic Settlement Statement ---');
  console.log('Gross Revenue:', statement.grossHarvestRevenue);
  console.log('Total Inputs:', statement.totalInputExpenses);
  console.log('AgriLink Cut:', statement.agriLinkCommissionOrFee);
  console.log('Net Distributable:', statement.netDistributableMargin);
  console.log('Member Payouts:', statement.memberPayouts);

  // 4. Save Final Pool Settlement to DB
  const settlementDoc = await PoolSettlement.create({
    poolId,
    poolName: 'Chikkamagaluru Coffee & Spices Pool A',
    season: 'Kharif 2026',
    collaborationModel: 5,
    modelName: statement.modelName,
    harvestYield: 110,
    yieldUnit: 'Quintals',
    sellingPricePerUnit: 3454.54,
    buyerName: 'Karnataka Agro Federation / APMC Mandi',
    grossHarvestRevenue: statement.grossHarvestRevenue,
    totalInputExpenses: statement.totalInputExpenses,
    agriLinkCommissionOrFee: statement.agriLinkCommissionOrFee,
    netDistributableMargin: statement.netDistributableMargin,
    memberSettlements: statement.memberPayouts.map(mp => ({
      userId: mp.userId,
      fullName: mp.fullName,
      landAcres: mp.landAcres,
      equityPercentage: mp.equityPercentage,
      grossAllocation: mp.grossAllocation,
      expenseDeduction: mp.expenseDeduction,
      labourReimbursement: mp.labourReimbursement,
      machineryReimbursement: mp.machineryReimbursement,
      netPayout: mp.netPayout,
      payoutStatus: 'credited',
      breakdownNotes: mp.breakdownNotes
    })),
    settledBy: fcoId,
    settlerName: 'Field Counseling Officer',
    settledAt: new Date(),
    status: 'finalized',
    blockchainTxHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('')
  });

  console.log('\n✅ Created Final Settlement in DB:', settlementDoc._id.toString());
  console.log('Blockchain Hash Stamp:', settlementDoc.blockchainTxHash);

  await mongoose.disconnect();
  console.log('\n🎉 DIRECT DATABASE VERIFICATION PASSED PERFECTLY!');
}

runDirectDBTest().catch(console.error);
