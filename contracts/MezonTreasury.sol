// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract MezonTreasury is ERC20, ERC20Burnable, Ownable, AccessControl, EIP712 {
    using ECDSA for bytes32;

    // Define roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");

    // Events
    event Withdrawn(
        address indexed user,
        uint256 amount,
        address to,
        string requestId
    );
    // Withdrawal struct for EIP712 signing
    struct WithdrawRequest {
        address user;
        uint256 amount;
        address to;
        bytes32 requestId;
    }

    // Define the type hash for the withdrawal struct
    bytes32 private constant _WITHDRAW_REQUEST_TYPEHASH =
        keccak256(
            "WithdrawRequest(address user,uint256 amount,address to,bytes32 requestId)"
        );

    constructor()
        ERC20("MezonTreasury", "MZT")
        Ownable(msg.sender)
        EIP712("MezonTreasury", "1")
    {
        // Mint initial supply of 100 million tokens to deployer
        _mint(msg.sender, 100000000 * 10 ** decimals());
        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(WITHDRAWER_ROLE, msg.sender);
    }

    // Modifier for admin-restricted functions
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Permission denied");
        _;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Grant withdrawer role to a specific address (admin only)
    function grantWithdrawerRole(address account) external onlyAdmin {
        grantRole(WITHDRAWER_ROLE, account);
    }

    // Revoke withdrawer role from a specific address (admin only)
    function revokeWithdrawerRole(address account) external onlyAdmin {
        revokeRole(WITHDRAWER_ROLE, account);
    }

    // Withdraw function with EIP712 signature authorization
    function withdraw(
        string memory requestId,
        uint256 amount,
        address to,
        bytes memory signature
    ) public {
        require(amount > 0, "Amount must be greater than zero");
        require(balanceOf(owner()) >= amount, "Insufficient balance");
        require(to != address(0), "Invalid address");
        // Create the withdrawal request
        WithdrawRequest memory request = WithdrawRequest({
            user: msg.sender,
            amount: amount,
            to: to,
            requestId: keccak256(abi.encode(requestId))
        });

        // Generate the EIP712 hash of the request
        bytes32 structHash = keccak256(
            abi.encode(
                _WITHDRAW_REQUEST_TYPEHASH,
                request.user,
                request.amount,
                request.to,
                request.requestId
            )
        );
        // Verify the signature
        /*
            @Signature that signed by the user has role WITHDRAWER_ROLE in Backend server
        */
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        // Verify the signer and roles
        require(signer == request.user, "Invalid signature");
        require(hasRole(WITHDRAWER_ROLE, signer), "Permission denied");

        transfer(to, amount);
        emit Withdrawn(msg.sender, amount, to, requestId);
    }
}
