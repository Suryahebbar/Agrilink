#!/bin/bash

echo "🚀 Starting Hardhat node and deploying Land Integration Agreement contract..."

# Check if Hardhat node is already running
if pgrep -f "hardhat node" > /dev/null; then
    echo "⚠️  Hardhat node is already running. Stopping it first..."
    pkill -f "hardhat node"
    sleep 2
fi

# Start Hardhat node in background
echo "📡 Starting Hardhat node on localhost:8545..."
npx hardhat node > hardhat-node.log 2>&1 &
HARDHAT_PID=$!

# Wait for node to start
echo "⏳ Waiting for Hardhat node to start..."
sleep 15

# Check if node started successfully
if ! pgrep -f "hardhat node" > /dev/null; then
    echo "❌ Failed to start Hardhat node. Check hardhat-node.log for details."
    exit 1
fi

echo "✅ Hardhat node started successfully!"

# Deploy the contract
echo "🔨 Deploying LandIntegrationAgreement contract..."
curl -X POST http://localhost:3000/api/blockchain/deploy \
  -H "Content-Type: application/json" \
  -d '{}' > deploy-result.json 2>&1

# Check deployment result
if [ $? -eq 0 ]; then
    echo "✅ Contract deployment initiated!"
    echo "📄 Check deploy-result.json for deployment details"
    echo "🌐 Contract will be available at: http://localhost:8545"
    echo "📝 Hardhat node logs: hardhat-node.log"
    echo ""
    echo "🔧 To stop the node later, run: pkill -f 'hardhat node'"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Check that contract is deployed: curl http://localhost:3000/api/blockchain/deploy"
    echo "   2. Test blockchain storage: POST to /api/blockchain/store-agreement"
    echo "   3. Verify agreement integrity: GET /api/blockchain/store-agreement?requestId=<id>"
else
    echo "❌ Contract deployment failed. Check deploy-result.json for details."
    echo "📝 Hardhat node logs: hardhat-node.log"
    # Clean up on failure
    pkill -f "hardhat node"
    exit 1
fi
