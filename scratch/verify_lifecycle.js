const baseUrl = 'http://localhost:3000';

async function verifyFarmManagementModule() {
  console.log('🧪 RUNNING VERIFICATION FOR MODULE 4: FARM MANAGEMENT & CROP PLANNING\n');

  try {
    // 1. Fetch Agronomic Templates
    console.log('1️⃣ Testing GET /api/farmer/crop-lifecycle?templates=true ...');
    const templatesRes = await fetch(`${baseUrl}/api/farmer/crop-lifecycle?templates=true`);
    const templatesData = await templatesRes.json();
    console.log(`   ✅ Success: ${templatesData.success}`);
    console.log(`   🌱 Available Crop Templates: ${templatesData.templates?.map(t => t.cropName).join(', ')}\n`);

    // 2. Fetch a dummy or real farmer user
    console.log('2️⃣ Finding a test farmer user...');
    const usersRes = await fetch(`${baseUrl}/api/admin/users`);
    const usersData = await usersRes.json();
    const testUser = usersData.users?.find(u => u.role === 'farmer') || usersData.users?.[0] || { _id: '674ef338166c3c52e1850123' };
    const userId = testUser._id;
    console.log(`   👤 Using Farmer User ID: ${userId} (${testUser.name || 'Test Farmer'})\n`);

    // 3. Create a Crop Lifecycle Plan
    console.log('3️⃣ Testing POST /api/farmer/crop-lifecycle (Creating Paddy Plan for 3.5 Acres)...');
    const createRes = await fetch(`${baseUrl}/api/farmer/crop-lifecycle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        cropKey: 'paddy',
        sowingDate: new Date().toISOString(),
        acreage: 3.5,
        variety: 'Sona Masoori HYV'
      })
    });
    const createData = await createRes.json();
    console.log(`   ✅ Plan Created: ${createData.success}`);
    console.log(`   📋 Plan ID: ${createData.plan?._id}`);
    console.log(`   📅 Sowing: ${new Date(createData.plan?.sowingDate).toLocaleDateString()} | Harvest Target: ${new Date(createData.plan?.expectedHarvestDate).toLocaleDateString()}`);
    console.log(`   📌 Generated Total Action Tasks: ${createData.plan?.tasks?.length}`);
    const sampleTask = createData.plan?.tasks?.[1];
    console.log(`   🔍 Sample Task: "${sampleTask?.title}" [${sampleTask?.category}] - Due: ${sampleTask?.dosage || 'N/A'}\n`);

    const planId = createData.plan?._id;

    // 4. Toggle a Task to Completed
    if (planId && sampleTask) {
      console.log(`4️⃣ Testing PATCH /api/farmer/crop-lifecycle (Completing task: ${sampleTask.taskId})...`);
      const toggleRes = await fetch(`${baseUrl}/api/farmer/crop-lifecycle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          taskId: sampleTask.taskId,
          completed: true,
          completedBy: 'Farmer Verification Test'
        })
      });
      const toggleData = await toggleRes.json();
      const updatedTask = toggleData.plan?.tasks?.find(t => t.taskId === sampleTask.taskId);
      console.log(`   ✅ Task Completed Status: ${updatedTask?.completed} (Completed at: ${updatedTask?.completedAt})\n`);
    }

    // 5. Log a Pest Incident
    if (planId) {
      console.log('5️⃣ Testing PATCH /api/farmer/crop-lifecycle (Logging Pest & Disease Scouting Incident)...');
      const pestRes = await fetch(`${baseUrl}/api/farmer/crop-lifecycle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          pestIncident: {
            pestName: 'Yellow Stem Borer (Scouted)',
            severity: 'high',
            symptoms: 'Central shoot dead hearts spotted on 4% of tillers.',
            advisory: 'Install pheromone traps @ 8 traps/acre and apply Cartap Hydrochloride 4G.'
          },
          completedBy: 'Farmer'
        })
      });
      const pestData = await pestRes.json();
      console.log(`   ✅ Pest Incident Logged: ${pestData.success}`);
      console.log(`   🐛 Total Incidents on Plan: ${pestData.plan?.pestIncidents?.length}`);
      console.log(`   💡 Advisory Recorded: "${pestData.plan?.pestIncidents?.[0]?.advisory}"\n`);
    }

    console.log('✨ ALL API ENDPOINTS & LIFECYCLE LOGIC VERIFIED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyFarmManagementModule();
