// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "remix_tests.sol"; // Remix testing framework
import "../contracts/MezonTreasury.sol"; // Path to the MezonTreasury contract
import "../contracts/MockERC20.sol"; // Path to the MockERC20 contract
import "hardhat/console.sol";

contract MezonTreasuryTest {
    MezonTreasury treasury;
    MockERC20 token;
    address user;
    address recipient;
    uint256 initialUserBalance;

    function beforeAll() public {
        // Deploy MockERC20 with an initial supply of 1,000,000 tokens
        token = new MockERC20(1000000 * 10**18);
        
        // Deploy MezonTreasury with the MockERC20 address
        treasury = new MezonTreasury(token);

        user = address(0x123);
        recipient = address(0x456);
        
        initialUserBalance = 1000 * 10**18;
    }

    function beforeEach() public {
        // Transfer some tokens to the user for testing
        token.transfer(user, initialUserBalance);
    }

    /// #sender: account-1
    function testDeposit() public {
        uint256 depositAmount = 500 * 10**18;

        // Approve the treasury to spend user's tokens
        token.approve(address(treasury), depositAmount);

        // Deposit tokens from user to treasury
        treasury.deposit(depositAmount);
        
        // Check treasury balance
        Assert.equal(token.balanceOf(address(treasury)), depositAmount, "Treasury balance should be 500 tokens");
    }

    function testWithdrawWithValdSignature() public {
        uint256 withdrawAmount = 100 * 10**18;
        uint256 nonce = treasury.nonces(user);

        // Mock an EIP-712 signature for withdraw
        bytes32 hash = keccak256(abi.encodePacked(user, withdrawAmount, recipient, nonce));
        (uint8 v, bytes32 r, bytes32 s) = _signWithdraw(hash);
        // Grant WITHDRAWER_ROLE to the user to enable withdrawal
        treasury.grantWithdrawerRole(user);

        // Withdraw tokens from treasury to recipient
        treasury.withdraw(withdrawAmount, recipient, v, r, s);

        // Check treasury balance
        Assert.equal(token.balanceOf(address(treasury)), initialUserBalance - withdrawAmount, "Treasury balance should be 900 tokens");
    }

    function testDepositWithInvalidAmount() public {
        uint256 depositAmount = 0;

        try treasury.deposit(depositAmount) {
            Assert.ok(false, "Deposit should fail with zero amount");
        } catch Error(string memory reason) {
            Assert.equal(reason, "Amount must be greater than zero", "Failed with expected reason");
        }
    }

    // function testWithdrawWithInsufficientBalance() public {
    //     uint256 withdrawAmount = 1000 * 10**18; // Requesting more than the treasury's balance
    //     uint256 nonce = treasury.nonces(user);

    //     // Mock an EIP-712 signature for withdraw
    //     bytes32 hash = keccak256(abi.encodePacked(user, withdrawAmount, recipient, nonce));
    //     (uint8 v, bytes32 r, bytes32 s) = _signWithdraw(hash);

    //     // Grant WITHDRAWER_ROLE to the user to enable withdrawal
    //     treasury.grantWithdrawerRole(user);

    //     // Expect the withdrawal to fail due to insufficient balance in the treasury
    //     try treasury.withdraw(withdrawAmount, recipient, v, r, s) {
    //         Assert.ok(false, "Withdraw should have failed due to insufficient balance");
    //     } catch Error(string memory reason) {
    //         Assert.equal(reason, "Insufficient balance", "Failed with expected reason");
    //     }
    // }

    // function testWithdrawWithInvalidSignature() public {
    //     uint256 withdrawAmount = 100 * 10**18;
    //     uint256 nonce = treasury.nonces(user);

    //     // Create an incorrect hash to simulate an invalid signature
    //     bytes32 incorrectHash = keccak256(abi.encodePacked(user, withdrawAmount + 1, recipient, nonce));
    //     (uint8 v, bytes32 r, bytes32 s) = _signWithdraw(incorrectHash);

    //     // Grant WITHDRAWER_ROLE to the user
    //     treasury.grantWithdrawerRole(user);

    //     // Expect the withdrawal to fail due to an invalid signature
    //     try treasury.withdraw(withdrawAmount, recipient, v, r, s) {
    //         Assert.ok(false, "Withdraw should have failed due to invalid signature");
    //     } catch Error(string memory reason) {
    //         Assert.equal(reason, "Invalid signature", "Failed with expected reason");
    //     }
    // }

    // function testWithdrawWithoutWithdrawerRole() public {
    //     uint256 withdrawAmount = 100 * 10**18;
    //     uint256 nonce = treasury.nonces(user);

    //     // Mock an EIP-712 signature for withdraw
    //     bytes32 hash = keccak256(abi.encodePacked(user, withdrawAmount, recipient, nonce));
    //     (uint8 v, bytes32 r, bytes32 s) = _signWithdraw(hash);

    //     // User does not have WITHDRAWER_ROLE
    //     try treasury.withdraw(withdrawAmount, recipient, v, r, s) {
    //         Assert.ok(false, "Withdraw should have failed due to missing WITHDRAWER_ROLE");
    //     } catch Error(string memory reason) {
    //         Assert.equal(reason, "Invalid signature", "Failed with expected reason");
    //     }
    // }

    function testRoleManagement() public {
        // Grant WITHDRAWER_ROLE to the user
        treasury.grantWithdrawerRole(user);
        Assert.ok(treasury.hasRole(treasury.WITHDRAWER_ROLE(), user), "User should have WITHDRAWER_ROLE");

        // Revoke WITHDRAWER_ROLE
        treasury.revokeWithdrawerRole(user);
        Assert.ok(!treasury.hasRole(treasury.WITHDRAWER_ROLE(), user), "User should no longer have WITHDRAWER_ROLE");
    }

    // Helper function to simulate signing withdrawal requests
    function _signWithdraw(bytes32 hash) internal pure returns (uint8, bytes32, bytes32) {
        // Here we return dummy values since signature verification would typically require
        // external signing tools. Adjust as needed for actual verification.
        // Return dummy values for simplicity in Remix testing
        return (27, hash, hash); 
    }
}
