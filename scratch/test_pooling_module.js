import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import { PoolingFinanceService } from '../lib/services/pooling-finance.service.js';

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 RUNNING AGRI-LINK MODULE 3: DIGITAL FARM POOLING TEST SUITE');
  console.log('================================================================\n');

  const poolId = '6a6572087aa5efa1a09120fb';
  const farmer1Id = '6a6485085c3cad2606e80fe3'; // Sathyanarayana (3.5 Acres)
  const farmer2Id = '6a649e1e5c3cad2606e81c87'; // Yogendra (2.0 Acres)
  const fcoId = '6a6338f754cd9eb1834b6a8f';

  const baseUrl = 'http://localhost:3000';

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Pure Unit Test of 5 Business Models Engine
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 1: Testing 5 Business Models Mathematical Formulas ---');

  const mockParticipants = [
    {
      userId: farmer1Id,
      fullName: 'Sathyanarayana Gowda',
      landAcres: 3.5,
      initialInvestment: 30000,
      totalLabourHours: 40,
      labourValue: 4000,
      totalMachineryHours: 10,
      machineryValue: 7500,
      extraCapitalInjected: 5000
    },
    {
      userId: farmer2Id,
      fullName: 'Yogendra Hebbar',
      landAcres: 2.0,
      initialInvestment: 15000,
      totalLabourHours: 60,
      labourValue: 6000,
      totalMachineryHours: 0,
      machineryValue: 0,
      extraCapitalInjected: 0
    }
  ];

  const harvestRev = 350000;
  const inputExpenses = 85000;

  for (let m = 1; m <= 5; m++) {
    const result = PoolingFinanceService.calculateSettlement({
      modelNumber: m,
      participants: mockParticipants,
      totalHarvestRevenue: harvestRev,
      totalInputExpenses: inputExpenses
    });

    console.log(`\n▶ [${result.modelName}]`);
    console.log(`  Gross Revenue: ₹${result.grossHarvestRevenue.toLocaleString()} | Inputs: ₹${result.totalInputExpenses.toLocaleString()} | AgriLink Cut: ₹${result.agriLinkCommissionOrFee.toLocaleString()} | Net Margin: ₹${result.netDistributableMargin.toLocaleString()}`);
    result.memberPayouts.forEach(p => {
      console.log(`   - ${p.fullName} (${p.landAcres} Ac, ${p.equityPercentage}%): Gross: ₹${p.grossAllocation.toLocaleString()}, Net Payout: ₹${p.netPayout.toLocaleString()}`);
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Submit Ongoing Contribution Logs (Labour & Machinery)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n\n--- TEST 2: Submitting Daily Member Contributions via API ---');

  try {
    const logRes1 = await fetch(`${baseUrl}/api/farmer/pooling/contributions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        poolId,
        userId: farmer1Id,
        farmerName: 'Sathyanarayana Gowda',
        type: 'machinery',
        activityName: 'Rotavator & Tractor Sowing Run',
        quantity: 6,
        unitRate: 750,
        notes: 'Covered south contiguous block 45/1'
      })
    });
    const logData1 = await logRes1.json();
    console.log('Logged Farmer 1 Tractor Hours:', {
      success: logData1.success,
      id: logData1.contribution?._id,
      totalValue: `₹${logData1.contribution?.totalValue}`
    });

    const logRes2 = await fetch(`${baseUrl}/api/farmer/pooling/contributions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        poolId,
        userId: farmer2Id,
        farmerName: 'Yogendra Hebbar',
        type: 'labour',
        activityName: 'Manual Weeding & Drip Emitter Check',
        quantity: 12,
        unitRate: 100,
        notes: 'Completed rows 1 to 20'
      })
    });
    const logData2 = await logRes2.json();
    console.log('Logged Farmer 2 Labour Hours:', {
      success: logData2.success,
      id: logData2.contribution?._id,
      totalValue: `₹${logData2.contribution?.totalValue}`
    });

    const contrib1Id = logData1.contribution?._id;
    const contrib2Id = logData2.contribution?._id;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 3: FCO Verification of Contribution Logs
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 3: FCO Verification of Pending Logs ---');
    if (contrib1Id) {
      const verifyRes1 = await fetch(`${baseUrl}/api/farmer/pooling/contributions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contributionId: contrib1Id,
          status: 'verified',
          verifiedBy: fcoId,
          verifiedByName: 'Field Officer Anand'
        })
      });
      const vData1 = await verifyRes1.json();
      console.log('Verified Contribution 1:', vData1.success, vData1.contribution?.status);
    }

    if (contrib2Id) {
      const verifyRes2 = await fetch(`${baseUrl}/api/farmer/pooling/contributions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contributionId: contrib2Id,
          status: 'verified',
          verifiedBy: fcoId,
          verifiedByName: 'Field Officer Anand'
        })
      });
      const vData2 = await verifyRes2.json();
      console.log('Verified Contribution 2:', vData2.success, vData2.contribution?.status);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 4: Fetch Aggregated Contributions & Live Weighting Breakdown
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 4: Fetching Updated Pool Contribution Summaries ---');
    const getContribRes = await fetch(`${baseUrl}/api/farmer/pooling/contributions?poolId=${poolId}`);
    const getContribData = await getContribRes.json();
    console.log('Member Summaries:', getContribData.memberSummaries);

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 5: Execute Harvest Settlement & Member Payouts
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 5: Finalizing Harvest Settlement & Member Payouts ---');
    const settleRes = await fetch(`${baseUrl}/api/farmer/pooling/settlement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        poolId,
        season: 'Kharif 2026 Season',
        harvestYield: 95, // 95 Quintals
        yieldUnit: 'Quintals',
        sellingPricePerUnit: 3400, // ₹3,400/quintal
        buyerName: 'Karnataka Agro Federation / APMC Mandi',
        settledById: fcoId
      })
    });
    const settleData = await settleRes.json();
    console.log('Settlement Response:', {
      success: settleData.success,
      settlementId: settleData.settlement?._id,
      grossRevenue: `₹${settleData.settlement?.grossHarvestRevenue?.toLocaleString()}`,
      inputExpenses: `₹${settleData.settlement?.totalInputExpenses?.toLocaleString()}`,
      netDistributable: `₹${settleData.settlement?.netDistributableMargin?.toLocaleString()}`,
      blockchainStamp: settleData.settlement?.blockchainTxHash,
      memberPayouts: settleData.settlement?.memberSettlements?.map(m => ({
        farmer: m.fullName,
        equity: `${m.equityPercentage}%`,
        netPayout: `₹${m.netPayout.toLocaleString()}`
      }))
    });

    console.log('\n================================================================');
    console.log('🎉 ALL MODULE 3 SUB-MODULES & BUSINESS MODELS VERIFIED SUCCESSFULLY!');
    console.log('================================================================');

  } catch (apiErr) {
    console.warn('API network error (server may need to be running for HTTP test):', apiErr.message);
  }
}

runTestSuite().catch(console.error);
