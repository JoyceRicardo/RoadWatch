// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title RoadWatch Badge (optional)
/// @notice Mintable only by the RoadWatchManager contract
contract RoadWatchBadge is ERC721, Ownable {
    address public manager;
    uint256 public nextTokenId = 1;
    string private _baseTokenURI;

    error NotManager();

    constructor(address initialOwner, string memory baseUri) ERC721("RoadWatch Observer Badge", "RWB") Ownable(initialOwner) {
        _baseTokenURI = baseUri;
    }

    function setManager(address m) external onlyOwner {
        manager = m;
    }

    function setBaseURI(string calldata u) external onlyOwner {
        _baseTokenURI = u;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function mintBadge(address to, uint256 /*recordId*/ ) external {
        if (msg.sender != manager) revert NotManager();
        _safeMint(to, nextTokenId++);
    }
}


