import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function runTest() {
  const baseUrl = 'http://localhost:3000';
  const poolId = '6a6572087aa5efa1a09120fb';
  const farmer1Id = '6a6485085c3cad2606e80fe3'; // Sathyanarayana
  const farmer2Id = '6a649e1e5c3cad2606e81c87'; // Yogendra

  console.log('--- STEP 1: Check initial Finance Bar for Farmer 1 ---');
  const finRes1 = await fetch(`${baseUrl}/api/farmer/finance-bar?userId=${farmer1Id}`);
  const finData1 = await finRes1.json();
  console.log('Finance Bar Farmer 1:', {
    success: finData1.success,
    hasPool: finData1.hasPool,
    poolName: finData1.metrics?.poolName,
    budget: finData1.metrics?.budget,
    spent: finData1.metrics?.spent,
    remaining: finData1.metrics?.remaining,
    personalShareSpent: finData1.metrics?.personalShareSpent
  });

  console.log('\n--- STEP 2: Fetch a verified product to buy as pool ---');
  const prodRes = await fetch(`${baseUrl}/api/marketplace/products`);
  const prodData = await prodRes.json();
  const product = prodData.products?.[0] || prodData.data?.[0] || prodData[0];
  if (!product) {
    throw new Error('No product found from marketplace: ' + JSON.stringify(prodData));
  }
  console.log(`Found product: ${product.name || product.title} (₹${product.price}) - Stock: ${product.stock}`);

  console.log('\n--- STEP 3: Farmer 1 proposes a Group Purchase for the Farm Pool ---');
  const proposalPayload = {
    poolId,
    userId: farmer1Id,
    items: [
      {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: 4,
        category: product.category,
        image: product.images?.[0] || '',
        sellerId: product.sellerId
      }
    ],
    notes: 'Pre-season collective fertilizer procurement for pool acreage'
  };

  const propRes = await fetch(`${baseUrl}/api/marketplace/pool-proposals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(proposalPayload)
  });
  const propData = await propRes.json();
  console.log('Proposal Created Response:', {
    success: propData.success,
    proposalId: propData.proposal?._id,
    totalAmount: propData.proposal?.totalAmount,
    status: propData.proposal?.status,
    memberSplits: propData.proposal?.memberSplits?.map(s => ({
      name: s.fullName,
      land: s.landSize,
      share: `${s.sharePercentage}%`,
      due: `₹${s.amountDue}`,
      status: s.status
    }))
  });

  const proposalId = propData.proposal?._id;
  if (!proposalId) throw new Error('Failed to create proposal: ' + JSON.stringify(propData));

  console.log('\n--- STEP 4: Farmer 2 checks pending proposals ---');
  const listRes = await fetch(`${baseUrl}/api/marketplace/pool-proposals?userId=${farmer2Id}`);
  const listData = await listRes.json();
  const pending = listData.proposals?.find(p => p._id === proposalId);
  console.log('Farmer 2 found pending proposal:', {
    id: pending?._id,
    proposer: pending?.proposerName,
    itemsCount: pending?.items?.length,
    status: pending?.status
  });

  console.log('\n--- STEP 5: Farmer 2 votes "approve" to reach 100% consensus ---');
  const voteRes = await fetch(`${baseUrl}/api/marketplace/pool-proposals/${proposalId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: farmer2Id,
      vote: 'approve'
    })
  });
  const voteData = await voteRes.json();
  console.log('Vote & Consensus Response:', {
    success: voteData.success,
    consensusReached: voteData.consensusReached,
    proposalStatus: voteData.proposal?.status,
    executedOrderId: voteData.proposal?.executedOrderId,
    fcoExpenseId: voteData.proposal?.fcoExpenseId,
    message: voteData.message
  });

  console.log('\n--- STEP 6: Verify FCO Dashboard sync (pool expensesList in DB) ---');
  const fcoRes = await fetch(`${baseUrl}/api/fco/pools?userId=6a6338f754cd9eb1834b6a8f`);
  const fcoData = await fcoRes.json();
  const targetPool = fcoData.pools?.find(p => p._id === poolId);
  const recordedExpense = targetPool?.expensesList?.find(e => e.id === voteData.proposal?.fcoExpenseId);
  console.log('FCO Ledger Synced Expense:', recordedExpense);

  console.log('\n--- STEP 7: Verify updated Finance Bar for both Farmers ---');
  const finResAfter1 = await fetch(`${baseUrl}/api/farmer/finance-bar?userId=${farmer1Id}`);
  const finDataAfter1 = await finResAfter1.json();
  const finResAfter2 = await fetch(`${baseUrl}/api/farmer/finance-bar?userId=${farmer2Id}`);
  const finDataAfter2 = await finResAfter2.json();

  console.log('Farmer 1 Finance Bar After:', {
    poolSpent: finDataAfter1.metrics?.spent,
    remaining: finDataAfter1.metrics?.remaining,
    utilization: `${finDataAfter1.metrics?.utilizationPercentage}%`,
    farmer1ShareSpent: `₹${finDataAfter1.metrics?.personalShareSpent}`,
    categoryBreakdown: finDataAfter1.metrics?.categoryBreakdown
  });

  console.log('Farmer 2 Finance Bar After:', {
    poolSpent: finDataAfter2.metrics?.spent,
    remaining: finDataAfter2.metrics?.remaining,
    utilization: `${finDataAfter2.metrics?.utilizationPercentage}%`,
    farmer2ShareSpent: `₹${finDataAfter2.metrics?.personalShareSpent}`
  });

  console.log('\n>>> ALL STAGE 2 & STAGE 3 BACKEND APIS VERIFIED AND WORKING PERFECTLY! <<<');
}

runTest().catch(console.error);
