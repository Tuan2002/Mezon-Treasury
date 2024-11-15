// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "hardhat/console.sol";

contract MezonTreasury is AccessControl, EIP712 {
    using ECDSA for bytes32;
    // Define roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER");

    // Events
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount, string requestId);

    // The ERC20 token used for deposits/withdrawals
    IERC20 public token;

    // EIP712 domain separator and withdrawal struct for signing
    struct WithdrawRequest {
        address user;
        uint256 amount;
        bytes32 requestId;
    }

    mapping(address => uint256) public nonces;

    constructor(IERC20 _token) EIP712("MezonTreasury", "1") {
        token = _token;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    // EIP712 domain separator
    bytes32 private constant _WITHDRAW_REQUEST_TYPEHASH =
        keccak256("WithdrawRequest(address user,uint256 amount,bytes32 requestId)");
    // Deposit tokens into the treasury
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        require(token.balanceOf(msg.sender) >= amount, "Insufficient balance");
        token.transferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, amount);
    }

    // Get signer
    function getSigner (bytes32 hash, uint8 v, bytes32 r, bytes32 s) public pure returns (address) {
        return ecrecover(hash, v, r, s);
    }

    // Withdraw tokens with EIP712 signature authorization

    function withdraw(string memory requestId, uint256 amount, bytes memory signature) public {
        require(amount > 0, "Amount must be greater than zero");
        require(token.balanceOf(address(this)) >= amount, "Insufficient balance");

        WithdrawRequest memory request = WithdrawRequest({
            user: msg.sender,
            amount: amount,
            requestId: keccak256(abi.encode(requestId))
        });

        bytes32 structHash = keccak256(
            abi.encode(
                _WITHDRAW_REQUEST_TYPEHASH,
                request.user,
                request.amount,
                request.requestId
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        require(hasRole(WITHDRAWER_ROLE, signer), "Permission denied");

        token.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount, requestId);
    }

    // Grant withdrawer role to a specific address
    function grantWithdrawerRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(WITHDRAWER_ROLE, account);
    }

    // Revoke withdrawer role from a specific address
    function revokeWithdrawerRole(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(WITHDRAWER_ROLE, account);
    }
}