// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AgriLedgerCore
 * @dev Decentralized, tamper-proof blockchain registry for agricultural pooling:
 *      1. Digital Farm Agreements & Cryptographic Sealing
 *      2. Contribution Ledger (Labour, Machinery Hours, Capital Injections)
 *      3. Profit Distribution Records & Milestone Financial Statements
 *      4. Crop Sale Transactions & Escrow Receipts
 *      5. Investment Records & Capital Partner Tracking
 */
contract AgriLedgerCore {
    // ----------------- STRUCTS -----------------

    struct Agreement {
        string poolId;
        string poolName;
        string documentHash; // SHA-256 canonical hash
        uint256 participantCount;
        uint256 timestamp;
        bool isSealed;
        address sealedBy;
    }

    struct Contribution {
        string recordId;
        string poolId;
        string contributorId;
        string contributorName;
        string contributionType; // "labour", "machinery", "capital"
        string activityName;
        uint256 quantity; // in hours or currency amount
        string unit; // "hours", "days", "INR"
        uint256 totalValueInr; // monetary evaluation in INR
        uint256 timestamp;
        string proofHash; // SHA-256 verification hash
    }

    struct ProfitDistribution {
        string distributionId;
        string poolId;
        string season;
        uint256 grossRevenueInr;
        uint256 totalExpensesInr;
        uint256 netMarginInr;
        uint256 memberCount;
        uint256 timestamp;
        string distributionHash;
    }

    struct CropSaleReceipt {
        string saleId;
        string poolId;
        string cropName;
        uint256 quantity;
        string unit;
        uint256 pricePerUnitInr;
        uint256 totalAmountInr;
        string buyerName;
        string buyerContact;
        uint256 timestamp;
        string receiptHash;
    }

    struct InvestmentRecord {
        string investmentId;
        string poolId;
        string investorId;
        string investorName;
        string investorType; // "farmer", "third_party", "institutional", "partner"
        uint256 amountInr;
        string terms;
        uint256 timestamp;
        string investmentHash;
    }

    // ----------------- STATE STORAGE -----------------

    address public admin;

    // poolId => Agreement
    mapping(string => Agreement) public agreements;
    string[] public allPoolIds;

    // poolId => Contribution[]
    mapping(string => Contribution[]) public poolContributions;
    
    // poolId => ProfitDistribution[]
    mapping(string => ProfitDistribution[]) public poolDistributions;

    // poolId => CropSaleReceipt[]
    mapping(string => CropSaleReceipt[]) public poolSales;

    // poolId => InvestmentRecord[]
    mapping(string => InvestmentRecord[]) public poolInvestments;

    // ----------------- EVENTS -----------------

    event AgreementSealed(
        string indexed poolId,
        string poolName,
        string documentHash,
        uint256 timestamp
    );

    event ContributionRecorded(
        string indexed poolId,
        string indexed recordId,
        string contributorName,
        string contributionType,
        uint256 totalValueInr,
        string proofHash,
        uint256 timestamp
    );

    event ProfitDistributed(
        string indexed poolId,
        string indexed distributionId,
        string season,
        uint256 netMarginInr,
        string distributionHash,
        uint256 timestamp
    );

    event CropSaleRecorded(
        string indexed poolId,
        string indexed saleId,
        string cropName,
        uint256 totalAmountInr,
        string buyerName,
        string receiptHash,
        uint256 timestamp
    );

    event InvestmentRecorded(
        string indexed poolId,
        string indexed investmentId,
        string investorName,
        string investorType,
        uint256 amountInr,
        string investmentHash,
        uint256 timestamp
    );

    // ----------------- MODIFIERS -----------------

    modifier onlyAdmin() {
        require(msg.sender == admin, "AgriLedger: Only authorized admin or oracle can execute");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function updateAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid admin address");
        admin = _newAdmin;
    }

    // ----------------- 1. DIGITAL AGREEMENT SEALING -----------------

    function sealAgreement(
        string calldata _poolId,
        string calldata _poolName,
        string calldata _documentHash,
        uint256 _participantCount
    ) external onlyAdmin {
        require(bytes(_poolId).length > 0, "Invalid poolId");
        require(bytes(_documentHash).length > 0, "Invalid documentHash");

        if (agreements[_poolId].timestamp == 0) {
            allPoolIds.push(_poolId);
        }

        agreements[_poolId] = Agreement({
            poolId: _poolId,
            poolName: _poolName,
            documentHash: _documentHash,
            participantCount: _participantCount,
            timestamp: block.timestamp,
            isSealed: true,
            sealedBy: msg.sender
        });

        emit AgreementSealed(_poolId, _poolName, _documentHash, block.timestamp);
    }

    function getAgreement(string calldata _poolId) external view returns (Agreement memory) {
        return agreements[_poolId];
    }

    // ----------------- 2. CONTRIBUTION LEDGER -----------------

    function recordContribution(
        string calldata _recordId,
        string calldata _poolId,
        string calldata _contributorId,
        string calldata _contributorName,
        string calldata _contributionType,
        string calldata _activityName,
        uint256 _quantity,
        string calldata _unit,
        uint256 _totalValueInr,
        string calldata _proofHash
    ) external onlyAdmin {
        Contribution memory item = Contribution({
            recordId: _recordId,
            poolId: _poolId,
            contributorId: _contributorId,
            contributorName: _contributorName,
            contributionType: _contributionType,
            activityName: _activityName,
            quantity: _quantity,
            unit: _unit,
            totalValueInr: _totalValueInr,
            timestamp: block.timestamp,
            proofHash: _proofHash
        });

        poolContributions[_poolId].push(item);

        emit ContributionRecorded(
            _poolId,
            _recordId,
            _contributorName,
            _contributionType,
            _totalValueInr,
            _proofHash,
            block.timestamp
        );
    }

    function getContributions(string calldata _poolId) external view returns (Contribution[] memory) {
        return poolContributions[_poolId];
    }

    // ----------------- 3. PROFIT DISTRIBUTION RECORDS -----------------

    function recordProfitDistribution(
        string calldata _distributionId,
        string calldata _poolId,
        string calldata _season,
        uint256 _grossRevenueInr,
        uint256 _totalExpensesInr,
        uint256 _netMarginInr,
        uint256 _memberCount,
        string calldata _distributionHash
    ) external onlyAdmin {
        ProfitDistribution memory dist = ProfitDistribution({
            distributionId: _distributionId,
            poolId: _poolId,
            season: _season,
            grossRevenueInr: _grossRevenueInr,
            totalExpensesInr: _totalExpensesInr,
            netMarginInr: _netMarginInr,
            memberCount: _memberCount,
            timestamp: block.timestamp,
            distributionHash: _distributionHash
        });

        poolDistributions[_poolId].push(dist);

        emit ProfitDistributed(
            _poolId,
            _distributionId,
            _season,
            _netMarginInr,
            _distributionHash,
            block.timestamp
        );
    }

    function getProfitDistributions(string calldata _poolId) external view returns (ProfitDistribution[] memory) {
        return poolDistributions[_poolId];
    }

    // ----------------- 4. CROP SALE TRANSACTIONS -----------------

    function recordCropSale(
        string calldata _saleId,
        string calldata _poolId,
        string calldata _cropName,
        uint256 _quantity,
        string calldata _unit,
        uint256 _pricePerUnitInr,
        uint256 _totalAmountInr,
        string calldata _buyerName,
        string calldata _buyerContact,
        string calldata _receiptHash
    ) external onlyAdmin {
        CropSaleReceipt memory sale = CropSaleReceipt({
            saleId: _saleId,
            poolId: _poolId,
            cropName: _cropName,
            quantity: _quantity,
            unit: _unit,
            pricePerUnitInr: _pricePerUnitInr,
            totalAmountInr: _totalAmountInr,
            buyerName: _buyerName,
            buyerContact: _buyerContact,
            timestamp: block.timestamp,
            receiptHash: _receiptHash
        });

        poolSales[_poolId].push(sale);

        emit CropSaleRecorded(
            _poolId,
            _saleId,
            _cropName,
            _totalAmountInr,
            _buyerName,
            _receiptHash,
            block.timestamp
        );
    }

    function getCropSales(string calldata _poolId) external view returns (CropSaleReceipt[] memory) {
        return poolSales[_poolId];
    }

    // ----------------- 5. INVESTMENT RECORDS -----------------

    function recordInvestment(
        string calldata _investmentId,
        string calldata _poolId,
        string calldata _investorId,
        string calldata _investorName,
        string calldata _investorType,
        uint256 _amountInr,
        string calldata _terms,
        string calldata _investmentHash
    ) external onlyAdmin {
        InvestmentRecord memory inv = InvestmentRecord({
            investmentId: _investmentId,
            poolId: _poolId,
            investorId: _investorId,
            investorName: _investorName,
            investorType: _investorType,
            amountInr: _amountInr,
            terms: _terms,
            timestamp: block.timestamp,
            investmentHash: _investmentHash
        });

        poolInvestments[_poolId].push(inv);

        emit InvestmentRecorded(
            _poolId,
            _investmentId,
            _investorName,
            _investorType,
            _amountInr,
            _investmentHash,
            block.timestamp
        );
    }

    function getInvestments(string calldata _poolId) external view returns (InvestmentRecord[] memory) {
        return poolInvestments[_poolId];
    }
}
