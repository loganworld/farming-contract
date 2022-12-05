// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// @title 2AM Minting SC
/// @author Neo - 2AM
/// @notice You can use this contract for minting NFTs by Allowlist and Public sale
contract Club2AM is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    /// @dev Local variables
    bool public saleIsActive = false;
    bool public isAllowListActive = false;

    string private _baseURIextended;

    uint256 public constant MAX_SUPPLY = 32;
    uint256 public constant MAX_PUBLIC_MINT = 5;
    uint256 public constant PRICE_PER_TOKEN = 0.0123 ether;

    /// @dev Allowlist declaration.
    mapping(address => uint8) private _allowList;

    Counters.Counter private _tokenIdCounter;

    event NewNFTMinted(address sender, uint256 tokenId);

    constructor() ERC721("2AM", "2AM") {}

    /// @notice Owner can activate and deactivate the Allowlist.
    /// @dev Boolean value to the AllowList activation. Which value is initialized as "false".
    function setIsAllowListActive(bool _isAllowListActive) external onlyOwner {
        isAllowListActive = _isAllowListActive;
    }

    /// @notice Owner can Add addresses to the allow list and how many NFTs can be minted by that addres.
    /// @dev Owner sets the Address and the unit8 value for the amount of NFTs allowed to be minted.
    function setAllowList(address[] calldata addresses, uint8 numAllowedToMint)
        external
        onlyOwner
    {
        for (uint256 i = 0; i < addresses.length; i++) {
            _allowList[addresses[i]] = numAllowedToMint;
        }
    }

    /// @notice Anyone can read the amount of NFTs that an Address has avaible to mint.
    /// @dev It will return the amount of NFTs allowed to mint for an specific address.
    function numAvailableToMint(address addr) external view returns (uint8) {
        return _allowList[addr];
    }

    /// @notice Allowlist minting process.
    /// @dev The addresses from the AllowList can mint the tokens that they have avaible.
    function mintAllowList(uint8 numberOfTokens) external payable {
        uint256 ts = totalSupply();
        require(isAllowListActive, "Allow list is not active");
        require(
            numberOfTokens <= _allowList[msg.sender],
            "Exceeded max available to purchase"
        );
        require(
            ts + numberOfTokens <= MAX_SUPPLY,
            "Purchase would exceed max tokens"
        );
        require(
            PRICE_PER_TOKEN * numberOfTokens <= msg.value,
            "Ether value sent is not correct"
        );

        _allowList[msg.sender] -= numberOfTokens;
        for (uint256 i = 0; i < numberOfTokens; i++) {
            _safeMint(msg.sender, ts + i);
            emit NewNFTMinted(msg.sender, ts + i);
        }
    }

    /// @notice The owner can set/modify the Base URI.
    /// @dev The owner can set/modify the IPFS URI.
    function setBaseURI(string memory baseURI_) external onlyOwner {
        _baseURIextended = baseURI_;
    }

    /// @notice The public can "read" the Base URI.
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseURIextended;
    }

    /// @notice Owner can activate and deactivate the Public sale.
    /// @dev Boolean value to the Public sale activation. Which value is initialized as "false".
    function setSaleState(bool newState) public onlyOwner {
        saleIsActive = newState;
    }

    /// @notice Public minting, maximum of 5 NFTs per transaction.
    /// @dev The public minting process that allows anyone to mint a maximum of 5 NFTs per tx.
    function mint(uint numberOfTokens) public payable {
        uint256 ts = totalSupply();
        require(saleIsActive, "Sale must be active to mint tokens");
        require(
            numberOfTokens <= MAX_PUBLIC_MINT,
            "Exceeded max token purchase"
        );
        require(
            ts + numberOfTokens <= MAX_SUPPLY,
            "Purchase would exceed max tokens"
        );
        require(
            PRICE_PER_TOKEN * numberOfTokens <= msg.value,
            "Ether value sent is not correct"
        );

        for (uint256 i = 0; i < numberOfTokens; i++) {
            _safeMint(msg.sender, ts + i);
            emit NewNFTMinted(msg.sender, ts + i);
        }
    }

    /// @notice The owner can withdraw the funds to the owner address.
    /// @dev Only the owner can withdraw the funds.
    function withdraw() public onlyOwner {
        uint balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
