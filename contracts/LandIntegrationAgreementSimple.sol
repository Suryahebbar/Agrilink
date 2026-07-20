// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract LandIntegrationAgreement {
    struct Agreement {
        string agreementId;
        string farmer1Name;
        string farmer2Name;
        uint256 farmer1LandSize;
        uint256 farmer2LandSize;
        uint256 timestamp;
        bool isActive;
        address createdBy;
        string documentCid; // IPFS document hash
    }

    struct Signature {
        string agreementId;
        address signer;
        string signerName;
        uint256 timestamp;
    }

    mapping(string => Agreement) public agreements;
    mapping(string => Signature[]) public signatures;
    mapping(address => string[]) public userAgreements;
    
    string[] public allAgreementIds;
    
    address public admin;
    uint256 public agreementCounter;
    
    event AgreementCreated(
        string indexed agreementId,
        string farmer1Name,
        string farmer2Name,
        uint256 timestamp,
        string documentCid
    );
    
    event AgreementSigned(
        string indexed agreementId,
        address indexed signer,
        string signerName,
        uint256 timestamp
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier agreementExists(string memory _agreementId) {
        require(agreements[_agreementId].timestamp > 0, "Agreement does not exist");
        _;
    }

    constructor() {
        admin = msg.sender;
        agreementCounter = 0;
    }

    function createAgreement(
        string memory _farmer1Name,
        string memory _farmer2Name,
        uint256 _farmer1LandSize,
        uint256 _farmer2LandSize,
        string memory _documentCid
    ) public onlyAdmin returns (string memory) {
        agreementCounter++;
        string memory agreementId = string(abi.encodePacked("AGR", _uint2str(agreementCounter)));
        
        agreements[agreementId] = Agreement({
            agreementId: agreementId,
            farmer1Name: _farmer1Name,
            farmer2Name: _farmer2Name,
            farmer1LandSize: _farmer1LandSize,
            farmer2LandSize: _farmer2LandSize,
            timestamp: block.timestamp,
            isActive: true,
            createdBy: msg.sender,
            documentCid: _documentCid
        });
        
        allAgreementIds.push(agreementId);
        
        emit AgreementCreated(
            agreementId,
            _farmer1Name,
            _farmer2Name,
            block.timestamp,
            _documentCid
        );
        
        return agreementId;
    }
    
    function signAgreement(
        string memory _agreementId,
        string memory _signerName
    ) public agreementExists(_agreementId) {
        require(agreements[_agreementId].isActive, "Agreement is not active");
        
        // Check if already signed
        for (uint i = 0; i < signatures[_agreementId].length; i++) {
            require(signatures[_agreementId][i].signer != msg.sender, "Already signed");
        }
        
        signatures[_agreementId].push(Signature({
            agreementId: _agreementId,
            signer: msg.sender,
            signerName: _signerName,
            timestamp: block.timestamp
        }));
        
        userAgreements[msg.sender].push(_agreementId);
        
        emit AgreementSigned(_agreementId, msg.sender, _signerName, block.timestamp);
    }
    
    function getAgreement(string memory _agreementId) public view agreementExists(_agreementId) returns (Agreement memory) {
        return agreements[_agreementId];
    }
    
    function getAgreementSignatures(string memory _agreementId) public view agreementExists(_agreementId) returns (Signature[] memory) {
        return signatures[_agreementId];
    }
    
    function getUserAgreements(address _user) public view returns (string[] memory) {
        return userAgreements[_user];
    }
    
    function getAllAgreements() public view returns (string[] memory) {
        return allAgreementIds;
    }
    
    function verifyAgreementIntegrity(string memory _agreementId) public view agreementExists(_agreementId) returns (bool) {
        Agreement memory agreement = agreements[_agreementId];
        return agreement.timestamp > 0 && agreement.isActive;
    }
    
    function revokeAgreement(string memory _agreementId) public onlyAdmin agreementExists(_agreementId) {
        agreements[_agreementId].isActive = false;
    }
    
    function updateAdmin(address _newAdmin) public onlyAdmin {
        require(_newAdmin != address(0), "Invalid admin address");
        admin = _newAdmin;
    }
    
    // Helper function to convert uint to string
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}
