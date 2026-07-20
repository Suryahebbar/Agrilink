// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgreementRegistry {
    struct AgreementDocument {
        string cid;                    // IPFS CID for the document
        string agreementId;            // Agreement identifier
        address uploader;              // Who uploaded the document
        uint256 timestamp;             // When uploaded
        string documentType;            // Type of document (PDF, etc.)
        bool isActive;                  // Document status
    }

    struct Agreement {
        string agreementId;
        address creator;
        string farmer1Name;
        string farmer2Name;
        uint256 farmer1LandSize;
        uint256 farmer2LandSize;
        uint256 timestamp;
        bool isActive;
        string documentCid;             // Main document CID
    }

    // Events
    event AgreementCreated(
        address indexed creator,
        string agreementId,
        string farmer1Name,
        string farmer2Name,
        string documentCid
    );

    event DocumentStored(
        address indexed uploader,
        string agreementId,
        string cid,
        string documentType
    );

    event AgreementSigned(
        string agreementId,
        address indexed signer,
        string signerName
    );

    // Storage
    mapping(string => Agreement) public agreements;
    mapping(string => AgreementDocument[]) public agreementDocuments;
    mapping(address => string[]) public userAgreements;
    mapping(string => address[]) public agreementSigners;

    uint256 public totalAgreements;

    // Modifiers
    modifier onlyValidAgreement(string memory agreementId) {
        require(agreements[agreementId].isActive, "Agreement does not exist");
        _;
    }

    modifier onlyAgreementCreator(string memory agreementId) {
        require(
            agreements[agreementId].creator == msg.sender,
            "Only agreement creator can perform this action"
        );
        _;
    }

    // Create a new agreement with document
    function createAgreement(
        string memory _agreementId,
        string memory _farmer1Name,
        string memory _farmer2Name,
        uint256 _farmer1LandSize,
        uint256 _farmer2LandSize,
        string memory _documentCid
    ) public {
        require(agreements[_agreementId].isActive == false, "Agreement already exists");
        require(bytes(_documentCid).length > 0, "Document CID is required");

        agreements[_agreementId] = Agreement({
            agreementId: _agreementId,
            creator: msg.sender,
            farmer1Name: _farmer1Name,
            farmer2Name: _farmer2Name,
            farmer1LandSize: _farmer1LandSize,
            farmer2LandSize: _farmer2LandSize,
            timestamp: block.timestamp,
            isActive: true,
            documentCid: _documentCid
        });

        userAgreements[msg.sender].push(_agreementId);
        totalAgreements++;

        emit AgreementCreated(
            msg.sender,
            _agreementId,
            _farmer1Name,
            _farmer2Name,
            _documentCid
        );
    }

    // Store additional document for an agreement
    function storeDocument(
        string memory _agreementId,
        string memory _cid,
        string memory _documentType
    ) public onlyValidAgreement(_agreementId) {
        agreementDocuments[_agreementId].push(AgreementDocument({
            cid: _cid,
            agreementId: _agreementId,
            uploader: msg.sender,
            timestamp: block.timestamp,
            documentType: _documentType,
            isActive: true
        }));

        emit DocumentStored(msg.sender, _agreementId, _cid, _documentType);
    }

    // Sign an agreement
    function signAgreement(
        string memory _agreementId,
        string memory _signerName
    ) public onlyValidAgreement(_agreementId) {
        agreementSigners[_agreementId].push(msg.sender);
        
        emit AgreementSigned(_agreementId, msg.sender, _signerName);
    }

    // Get agreement details
    function getAgreement(string memory _agreementId) 
        public 
        view 
        returns (Agreement memory) 
    {
        return agreements[_agreementId];
    }

    // Get all documents for an agreement
    function getAgreementDocuments(string memory _agreementId) 
        public 
        view 
        returns (AgreementDocument[] memory) 
    {
        return agreementDocuments[_agreementId];
    }

    // Get user's agreements
    function getUserAgreements(address _user) 
        public 
        view 
        returns (string[] memory) 
    {
        return userAgreements[_user];
    }

    // Get signers for an agreement
    function getAgreementSigners(string memory _agreementId) 
        public 
        view 
        returns (address[] memory) 
    {
        return agreementSigners[_agreementId];
    }

    // Verify document integrity
    function verifyDocument(string memory _agreementId, string memory _cid) 
        public 
        view 
        returns (bool) 
    {
        AgreementDocument[] memory docs = agreementDocuments[_agreementId];
        
        for (uint i = 0; i < docs.length; i++) {
            if (keccak256(bytes(docs[i].cid)) == keccak256(bytes(_cid))) {
                return true;
            }
        }
        
        // Also check main document
        if (keccak256(bytes(agreements[_agreementId].documentCid)) == keccak256(bytes(_cid))) {
            return true;
        }
        
        return false;
    }

    // Get total agreements count
    function getTotalAgreements() public view returns (uint256) {
        return totalAgreements;
    }
}
