// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { RoadWatchBadge } from "./RoadWatchBadge.sol";

/// @title RoadWatch Manager with FHE severity
/// @notice Stores road observation records on-chain. Uses FHEVM to store an encrypted severity value.
contract RoadWatchManagerFHE is ZamaEthereumConfig, Ownable {
    struct Record {
        uint256 id;
        address reporter;
        string description;
        string city;
        string category;        // congestion / accident / weather / construction / block / others
        string imageCID;        // IPFS CID
        uint256 timestamp;
        euint32 severity;       // Encrypted severity (0..100) - FHE encrypted
    }

    event RecordSubmitted(uint256 indexed recordId, address indexed reporter);
    event SeverityUpdated(uint256 indexed recordId);

    uint256 public nextRecordId = 1;
    mapping(uint256 => Record) private _records;
    mapping(address => uint256[]) private _recordsByReporter;
    // Badge integration
    address public badgeContract;
    // Bitmap of claimed badge levels per user. Bit i == 1 means level i already claimed.
    mapping(address => uint8) public claimedBadgeBitmap;
    // View log
    mapping(uint256 => uint256) public viewCount;
    event RecordViewed(uint256 indexed recordId, address indexed viewer, uint256 newCount);

    // Anti-spam
    mapping(address => uint256) public lastSubmitAt;
    uint256 public minIntervalSec = 60;

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Set minimal interval between submissions for a given address.
    function setMinIntervalSec(uint256 v) external onlyOwner {
        require(v <= 1 hours, "too large");
        minIntervalSec = v;
    }

    /// @notice Set the badge ERC721 contract that this manager can mint on.
    function setBadgeContract(address badge) external onlyOwner {
        badgeContract = badge;
    }

    /// @notice Submit a new road observation record with encrypted severity.
    /// @param description Free text (length limited client-side).
    /// @param city City name (public).
    /// @param category Category name (public).
    /// @param imageCID IPFS image CID.
    /// @param severityExt Encrypted severity external handle (0..100).
    /// @param inputProof FHE input proof.
    function submitRecord(
        string calldata description,
        string calldata city,
        string calldata category,
        string calldata imageCID,
        externalEuint32 severityExt,
        bytes calldata inputProof
    ) external returns (uint256 recordId) {
        // basic rate limiting
        unchecked {
            require(block.timestamp >= lastSubmitAt[msg.sender] + minIntervalSec, "rate limited");
            lastSubmitAt[msg.sender] = block.timestamp;
        }

        // Import external encrypted input to euint32
        euint32 sev = FHE.fromExternal(severityExt, inputProof);

        recordId = nextRecordId++;

        // Create new record
        _records[recordId] = Record({
            id: recordId,
            reporter: msg.sender,
            description: description,
            city: city,
            category: category,
            imageCID: imageCID,
            timestamp: block.timestamp,
            severity: sev
        });
        _recordsByReporter[msg.sender].push(recordId);

        // Allow contract and reporter to decrypt severity handle
        FHE.allowThis(sev);
        FHE.allow(sev, msg.sender);

        emit RecordSubmitted(recordId, msg.sender);
    }

    /// @notice Increment or decrement the encrypted severity by an encrypted delta (can be negative).
    /// @dev Example function to demonstrate homomorphic operations on stored data.
    function updateSeverity(
        uint256 recordId,
        externalEuint32 deltaExt,
        bytes calldata inputProof,
        bool add // true: add, false: sub
    ) external {
        Record storage r = _records[recordId];
        require(r.id != 0, "not found");
        require(r.reporter == msg.sender || msg.sender == owner(), "forbidden");

        euint32 delta = FHE.fromExternal(deltaExt, inputProof);
        if (add) {
            r.severity = FHE.add(r.severity, delta);
        } else {
            r.severity = FHE.sub(r.severity, delta);
        }

        FHE.allowThis(r.severity);
        FHE.allow(r.severity, r.reporter);

        emit SeverityUpdated(recordId);
    }

    /// @notice Return a record (except the encrypted severity - returned via getSeverity).
    function getRecord(uint256 recordId) external view returns (
        uint256 id,
        address reporter,
        string memory description,
        string memory city,
        string memory category,
        string memory imageCID,
        uint256 timestamp
    ) {
        Record storage r = _records[recordId];
        require(r.id != 0, "not found");
        return (r.id, r.reporter, r.description, r.city, r.category, r.imageCID, r.timestamp);
    }

    /// @notice Return encrypted severity handle (euint32).
    function getSeverity(uint256 recordId) external view returns (euint32) {
        Record storage r = _records[recordId];
        require(r.id != 0, "not found");
        return r.severity;
    }

    /// @notice Number of records
    function getRecordCount() external view returns (uint256) {
        return nextRecordId - 1;
    }

    /// @notice IDs submitted by a given reporter
    function getRecordsByReporter(address user) external view returns (uint256[] memory) {
        return _recordsByReporter[user];
    }

    /// @notice Request viewing a record details. Increments on-chain counter and emits event.
    function requestView(uint256 recordId) external returns (uint256) {
        Record storage r = _records[recordId];
        require(r.id != 0, "not found");
        uint256 c = ++viewCount[recordId];
        emit RecordViewed(recordId, msg.sender, c);
        return c;
    }

    /// ---------------------------
    /// Badge eligibility utilities
    /// ---------------------------

    /// @notice Returns number of records submitted by user
    function getUserContributionCount(address user) public view returns (uint256) {
        return _recordsByReporter[user].length;
    }

    /// @notice Thresholds for levels: 0->1, 1->5, 2->20, 3->50
    function _thresholdForLevel(uint8 level) internal pure returns (uint256) {
        if (level == 0) return 1;
        if (level == 1) return 5;
        if (level == 2) return 20;
        if (level == 3) return 50;
        revert("invalid level");
    }

    /// @notice Whether user is eligible for given level by contribution count
    function isEligibleForLevel(address user, uint8 level) public view returns (bool) {
        if (level > 3) return false;
        uint256 c = getUserContributionCount(user);
        return c >= _thresholdForLevel(level);
    }

    /// @notice Returns claimed bitmap and maximum eligible level based on contributions
    function getUserBadgeState(address user) external view returns (uint8 claimedBitmap, uint8 maxEligibleLevel, uint256 contributionCount) {
        claimedBitmap = claimedBadgeBitmap[user];
        contributionCount = getUserContributionCount(user);
        uint8 level = 0;
        while (level < 4 && contributionCount >= _thresholdForLevel(level)) {
            level++;
        }
        // maxEligibleLevel is last satisfied level index (0..3) or 0xFF if none
        maxEligibleLevel = level == 0 ? type(uint8).max : uint8(level - 1);
    }

    /// @notice Claim a badge for a specific level (0..3). Can only be claimed once per level.
    function claimBadge(uint8 level) external {
        require(badgeContract != address(0), "badge not set");
        require(level < 4, "invalid level");
        require(isEligibleForLevel(msg.sender, level), "not eligible");
        uint8 mask = uint8(1 << level);
        require((claimedBadgeBitmap[msg.sender] & mask) == 0, "already claimed");
        claimedBadgeBitmap[msg.sender] |= mask;
        RoadWatchBadge(badgeContract).mintBadge(msg.sender, 0);
    }
}


