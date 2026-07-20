#!/bin/bash

echo "🚀 Starting BPFIS Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Check if contract is compiled
if [ ! -f "artifacts/contracts_LandIntegrationAgreementSimple_sol_LandIntegrationAgreement.bin" ]; then
    echo "🔨 Compiling smart contract..."
    npx solc --bin --abi contracts/LandIntegrationAgreementSimple.sol -o artifacts
fi

echo "✅ Environment ready!"
echo ""
echo "🌐 Starting development server..."
echo "📝 Blockchain will run in development mode (simulation)"
echo "🔗 To use real blockchain, start Hardhat node separately: npx hardhat node"
echo ""
echo "📋 Available endpoints:"
echo "   - POST /api/blockchain/deploy - Deploy contract"
echo "   - POST /api/blockchain/store-agreement - Store agreement"
echo "   - GET /api/blockchain/deploy - Check contract status"
echo ""

# Start the development server
npm run dev
