import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Deploying LandIntegrationAgreement contract...");
  
  // Get the contract factory
  const LandIntegrationAgreement = await ethers.getContractFactory("LandIntegrationAgreement");
  
  // Deploy the contract
  const landIntegrationAgreement = await LandIntegrationAgreement.deploy();
  
  // Wait for deployment to complete
  await landIntegrationAgreement.deployed();
  
  console.log("LandIntegrationAgreement deployed to:", landIntegrationAgreement.address);
  console.log("Transaction hash:", landIntegrationAgreement.deployTransaction.hash);
  
  // Save contract address and ABI to a JSON file for frontend use
  const contractInfo = {
    address: landIntegrationAgreement.address,
    abi: landIntegrationAgreement.interface.format(ethers.utils.FormatTypes.json),
    network: network.name,
    deployedAt: new Date().toISOString()
  };
  
  // Ensure the artifacts directory exists
  const artifactsDir = path.join(__dirname, "..", "artifacts");
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }
  
  // Write contract info to file
  fs.writeFileSync(
    path.join(artifactsDir, "LandIntegrationAgreement.json"),
    JSON.stringify(contractInfo, null, 2)
  );
  
  console.log("Contract info saved to artifacts/LandIntegrationAgreement.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
