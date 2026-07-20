import BlockchainService from '../lib/services/blockchain.service';

async function testBlockchainIntegration() {
  console.log('🧪 Testing Blockchain Integration...\n');
  
  try {
    const blockchainService = new BlockchainService();
    
    // Test 1: Check if contract is deployed
    console.log('1️⃣ Checking contract deployment status...');
    const isDeployed = blockchainService.isContractDeployed();
    console.log(`   Contract deployed: ${isDeployed}`);
    
    if (!isDeployed) {
      console.log('❌ Contract not deployed. Please run: ./scripts/deploy-blockchain.sh');
      return;
    }
    
    console.log(`   Contract address: ${blockchainService.getContractAddress()}\n`);
    
    // Test 2: Create a test agreement
    console.log('2️⃣ Creating test agreement...');
    const agreementId = await blockchainService.createAgreement(
      'Test Farmer 1',
      'Test Farmer 2', 
      2.5,
      3.0,
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    );
    console.log(`   ✅ Agreement created with ID: ${agreementId}\n`);
    
    // Test 3: Sign the agreement
    console.log('3️⃣ Signing agreement...');
    await blockchainService.signAgreement(
      agreementId,
      'Test Farmer 1',
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    );
    console.log('   ✅ Agreement signed by Farmer 1\n');
    
    await blockchainService.signAgreement(
      agreementId,
      'Test Farmer 2',
      '0x59c6995e998f97a5a0044966f09453809dc85e2ddcc279a13f6192a0a3bc11e4'
    );
    console.log('   ✅ Agreement signed by Farmer 2\n');
    
    // Test 4: Get agreement details
    console.log('4️⃣ Retrieving agreement details...');
    const agreement = await blockchainService.getAgreement(agreementId);
    console.log(`   Agreement ID: ${agreement.agreementId}`);
    console.log(`   Farmer 1: ${agreement.farmer1Name} (${agreement.farmer1LandSize} acres)`);
    console.log(`   Farmer 2: ${agreement.farmer2Name} (${agreement.farmer2LandSize} acres)`);
    console.log(`   Created: ${new Date(agreement.timestamp * 1000).toLocaleString()}`);
    console.log(`   Active: ${agreement.isActive}\n`);
    
    // Test 5: Get signatures
    console.log('5️⃣ Retrieving signatures...');
    const signatures = await blockchainService.getAgreementSignatures(agreementId);
    signatures.forEach((sig, index) => {
      console.log(`   Signature ${index + 1}: ${sig.signerName} at ${new Date(sig.timestamp * 1000).toLocaleString()}`);
    });
    console.log();
    
    // Test 6: Verify integrity
    console.log('6️⃣ Verifying agreement integrity...');
    const isVerified = await blockchainService.verifyAgreementIntegrity(agreementId);
    console.log(`   ✅ Agreement integrity verified: ${isVerified}\n`);
    
    console.log('🎉 All blockchain tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Blockchain test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure Hardhat node is running: pgrep -f "hardhat node"');
    console.log('   2. Check contract is deployed: curl http://localhost:3000/api/blockchain/deploy');
    console.log('   3. Review Hardhat node logs: tail -f hardhat-node.log');
  }
}

// Run the test
testBlockchainIntegration();
