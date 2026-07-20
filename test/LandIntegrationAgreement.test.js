const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandIntegrationAgreement", function () {
  let landIntegrationAgreement;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const LandIntegrationAgreement = await ethers.getContractFactory("LandIntegrationAgreement");
    landIntegrationAgreement = await LandIntegrationAgreement.deploy();
    await landIntegrationAgreement.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      expect(await landIntegrationAgreement.admin()).to.equal(owner.address);
    });

    it("Should start with zero agreements", async function () {
      expect(await landIntegrationAgreement.agreementCounter()).to.equal(0);
      const allAgreements = await landIntegrationAgreement.getAllAgreements();
      expect(allAgreements.length).to.equal(0);
    });
  });

  describe("Agreement Creation", function () {
    it("Should create a new agreement", async function () {
      const agreementData = {
        farmer1Name: "Farmer One",
        farmer1Aadhaar: "123456789012",
        farmer1SurveyNo: "123/456",
        farmer1LandSize: ethers.utils.parseEther("2.5"),
        farmer2Name: "Farmer Two",
        farmer2Aadhaar: "987654321098",
        farmer2SurveyNo: "789/012",
        farmer2LandSize: ethers.utils.parseEther("3.0"),
        totalLandSize: ethers.utils.parseEther("5.5"),
        integrationPeriodMonths: 12,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        farmer1ProfitShare: 45,
        farmer2ProfitShare: 55,
        agreementContent: "This is a test agreement content..."
      };

      const agreementId = await landIntegrationAgreement.createAgreement(agreementData);
      
      expect(await landIntegrationAgreement.agreementCounter()).to.equal(1);
      
      const allAgreements = await landIntegrationAgreement.getAllAgreements();
      expect(allAgreements.length).to.equal(1);
      
      const agreement = await landIntegrationAgreement.getAgreement(allAgreements[0]);
      expect(agreement.farmer1Name).to.equal("Farmer One");
      expect(agreement.farmer2Name).to.equal("Farmer Two");
      expect(agreement.isActive).to.equal(true);
    });

    it("Should fail if non-admin tries to create agreement", async function () {
      const agreementData = {
        farmer1Name: "Farmer One",
        farmer1Aadhaar: "123456789012",
        farmer1SurveyNo: "123/456",
        farmer1LandSize: ethers.utils.parseEther("2.5"),
        farmer2Name: "Farmer Two",
        farmer2Aadhaar: "987654321098",
        farmer2SurveyNo: "789/012",
        farmer2LandSize: ethers.utils.parseEther("3.0"),
        totalLandSize: ethers.utils.parseEther("5.5"),
        integrationPeriodMonths: 12,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        farmer1ProfitShare: 45,
        farmer2ProfitShare: 55,
        agreementContent: "This is a test agreement content..."
      };

      await expect(
        landIntegrationAgreement.connect(addr1).createAgreement(agreementData)
      ).to.be.revertedWith("Only admin can perform this action");
    });
  });

  describe("Agreement Signing", function () {
    beforeEach(async function () {
      const agreementData = {
        farmer1Name: "Farmer One",
        farmer1Aadhaar: "123456789012",
        farmer1SurveyNo: "123/456",
        farmer1LandSize: ethers.utils.parseEther("2.5"),
        farmer2Name: "Farmer Two",
        farmer2Aadhaar: "987654321098",
        farmer2SurveyNo: "789/012",
        farmer2LandSize: ethers.utils.parseEther("3.0"),
        totalLandSize: ethers.utils.parseEther("5.5"),
        integrationPeriodMonths: 12,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        farmer1ProfitShare: 45,
        farmer2ProfitShare: 55,
        agreementContent: "This is a test agreement content..."
      };

      await landIntegrationAgreement.createAgreement(agreementData);
    });

    it("Should allow farmers to sign agreement", async function () {
      const allAgreements = await landIntegrationAgreement.getAllAgreements();
      const agreementId = allAgreements[0];

      await landIntegrationAgreement.connect(addr1).signAgreement(
        agreementId,
        "Farmer One",
        "signature_hash_1"
      );

      await landIntegrationAgreement.connect(addr2).signAgreement(
        agreementId,
        "Farmer Two", 
        "signature_hash_2"
      );

      const signatures = await landIntegrationAgreement.getAgreementSignatures(agreementId);
      expect(signatures.length).to.equal(2);
      expect(signatures[0].signer).to.equal(addr1.address);
      expect(signatures[1].signer).to.equal(addr2.address);
    });

    it("Should prevent double signing", async function () {
      const allAgreements = await landIntegrationAgreement.getAllAgreements();
      const agreementId = allAgreements[0];

      await landIntegrationAgreement.connect(addr1).signAgreement(
        agreementId,
        "Farmer One",
        "signature_hash_1"
      );

      await expect(
        landIntegrationAgreement.connect(addr1).signAgreement(
          agreementId,
          "Farmer One",
          "signature_hash_1"
        )
      ).to.be.revertedWith("Already signed");
    });
  });

  describe("Agreement Verification", function () {
    beforeEach(async function () {
      const agreementData = {
        farmer1Name: "Farmer One",
        farmer1Aadhaar: "123456789012",
        farmer1SurveyNo: "123/456",
        farmer1LandSize: ethers.utils.parseEther("2.5"),
        farmer2Name: "Farmer Two",
        farmer2Aadhaar: "987654321098",
        farmer2SurveyNo: "789/012",
        farmer2LandSize: ethers.utils.parseEther("3.0"),
        totalLandSize: ethers.utils.parseEther("5.5"),
        integrationPeriodMonths: 12,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        farmer1ProfitShare: 45,
        farmer2ProfitShare: 55,
        agreementContent: "This is a test agreement content..."
      };

      await landIntegrationAgreement.createAgreement(agreementData);
    });

    it("Should verify agreement integrity", async function () {
      const allAgreements = await landIntegrationAgreement.getAllAgreements();
      const agreementId = allAgreements[0];

      expect(await landIntegrationAgreement.verifyAgreementIntegrity(agreementId)).to.equal(true);
    });

    it("Should return false for non-existent agreement", async function () {
      expect(await landIntegrationAgreement.verifyAgreementIntegrity("NON_EXISTENT")).to.equal(false);
    });
  });
});
