const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MezonTreasury", function () {
    let treasury, token, admin, user, recipient;

    beforeEach(async () => {
        [admin, user, recipient] = await ethers.getSigners();

        // Deploy a mock ERC20 token
        const TestToken = await ethers.getContractFactory("MezonToken");
        token = await TestToken.deploy();
        await token.waitForDeployment()

        // Deploy the MezonTreasury contract
        const MezonTreasury = await ethers.getContractFactory("MezonTreasury");
        treasury = await MezonTreasury.deploy(token.getAddress());
        await treasury.waitForDeployment()

        // Transfer tokens to the user and approve the treasury for deposits
        await token.transfer(user.getAddress(), ethers.parseEther("100"));
        await token.connect(user).approve(treasury.getAddress(), ethers.parseEther("100"));
    });

    it("Should allow a user to deposit tokens", async function () {
        await treasury.connect(user).deposit(ethers.parseEther("10"));
        const treasuryBalance = await token.balanceOf(treasury.getAddress());
        expect(treasuryBalance).to.equal(ethers.parseEther("10"));
    });

    it("Should fail if the user does not have enough tokens to deposit", async function () {
        try {
        await expect(treasury.connect(user).deposit(ethers.parseEther("1000"))).to.be.revertedWith("Insufficient balance");
        }
        catch (error) {
            expect(error.message).to.contain("Insufficient balance");
        }
    });

    it("Should fail if the user deposits 0 tokens", async function () {
        await expect(treasury.connect(user).deposit(0)).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should allow withdrawals with a valid signature", async function () {
        const withdrawAmount = ethers.parseEther("50");
        // Grant the WITHDRAWER_ROLE to the user
        await treasury.connect(admin).grantRole(await treasury.WITHDRAWER_ROLE(), user.getAddress());
        // Fund the treasury for withdrawal
        await token.connect(admin).transfer(await treasury.getAddress(), withdrawAmount);
        const network = await ethers.provider.getNetwork();
        const { chainId } = network;
        const AbiCoder = new ethers.AbiCoder();
        const requestId = '123456789'
        // Define the EIP-712 domain and types
        const domain = {
            name: "MezonTreasury",
            version: "1",
            chainId: chainId,
            verifyingContract: await treasury.getAddress(),
        };
        const types = {
            WithdrawRequest: [
                { name: "user", type: "address" },
                { name: "amount", type: "uint256" },
                { name: "requestId", type: "bytes32" }
            ],
        };

        const message = {
            user: await recipient.getAddress(),
            amount: withdrawAmount,
            requestId: ethers.keccak256(AbiCoder.encode(["string"], [requestId]))
        };

        // Generate the signature
        const signature = await user.signTypedData(domain, types, message);

        // const structHash = ethers.TypedDataEncoder.hash(domain, types, message);
        // const signer = await ethers.recoverAddress(structHash, signature);
        // const domainSeparator = ethers.TypedDataEncoder.hashDomain(domain);
        // console.log("NONCE: ", nonce)
        // console.log("DOMAIN: ", domainSeparator)
        // console.log("HASH: ", structHash)
        // console.log("SIGNER: ", signer)
        // Execute the withdrawal
        await expect(treasury.connect(recipient).withdraw(requestId, withdrawAmount, signature));
        await token.connect(recipient).approve(treasury.getAddress(), withdrawAmount);
        expect(await token.balanceOf(await recipient.getAddress())).to.equal(withdrawAmount);
    });
    it("Should fail if user try to withdraw 0 token", async function () {
        try {
            const withdrawAmount = ethers.parseEther("0");
            // Grant the WITHDRAWER_ROLE to the user
            await treasury.connect(admin).grantRole(await treasury.WITHDRAWER_ROLE(), user.getAddress());
            // Fund the treasury for withdrawal
            await token.connect(admin).transfer(await treasury.getAddress(), withdrawAmount);
            const network = await ethers.provider.getNetwork();
            const { chainId } = network;
            const AbiCoder = new ethers.AbiCoder();
            const requestId = '123456789'
            // Define the EIP-712 domain and types
            const domain = {
                name: "MezonTreasury",
                version: "1",
                chainId: chainId,
                verifyingContract: await treasury.getAddress(),
            };
            const types = {
                WithdrawRequest: [
                    { name: "user", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "requestId", type: "bytes32" }
                ],
            };

            const message = {
                user: await recipient.getAddress(),
                amount: withdrawAmount,
                requestId: ethers.keccak256(AbiCoder.encode(["string"], [requestId]))
            };

            // Generate the signature
            const signature = await user.signTypedData(domain, types, message);
            expect(treasury.connect(recipient).withdraw(requestId, withdrawAmount, signature)).to.be.revertedWithoutReason;
        }
        catch (error) {
            expect(error.message).to.contain("Amount must be greater than zero");
        }
    });
    it("Should fail if withdraw amount higher the balance", async function () {
        try {
            const withdrawAmount = ethers.parseEther("1100");
            // Grant the WITHDRAWER_ROLE to the user
            await treasury.connect(admin).grantRole(await treasury.WITHDRAWER_ROLE(), user.getAddress());
            // Fund the treasury for withdrawal
            await token.connect(admin).transfer(await treasury.getAddress(), withdrawAmount);
            const network = await ethers.provider.getNetwork();
            const { chainId } = network;
            const AbiCoder = new ethers.AbiCoder();
            const requestId = '123456789'
            // Define the EIP-712 domain and types
            const domain = {
                name: "MezonTreasury",
                version: "1",
                chainId: chainId,
                verifyingContract: await treasury.getAddress(),
            };
            const types = {
                WithdrawRequest: [
                    { name: "user", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "requestId", type: "bytes32" }
                ],
            };

            const message = {
                user: await recipient.getAddress(),
                amount: withdrawAmount,
                requestId: ethers.keccak256(AbiCoder.encode(["string"], [requestId]))
            };

            // Generate the signature
            const signature = await user.signTypedData(domain, types, message);
            expect(treasury.connect(recipient).withdraw(requestId, withdrawAmount, signature)).to.be.revertedWithoutReason;
        }
        catch (error) {
            expect(error.message).to.contain("Insufficient balance");
        }
    });

    it("Should fail if user miss permission to withdraw", async function () {
        const withdrawAmount = ethers.parseEther("50");
        // Grant the WITHDRAWER_ROLE to the user
        await treasury.connect(admin).grantRole(await treasury.WITHDRAWER_ROLE(), user.getAddress());
        // Fund the treasury for withdrawal
        await token.connect(admin).transfer(await treasury.getAddress(), withdrawAmount);
        const network = await ethers.provider.getNetwork();
        const { chainId } = network;
        const AbiCoder = new ethers.AbiCoder();
        const requestId = '123456789'
        // Define the EIP-712 domain and types
        const domain = {
            name: "MezonTreasury",
            version: "1",
            chainId: chainId,
            verifyingContract: await treasury.getAddress(),
        };
        const types = {
            WithdrawRequest: [
                { name: "user", type: "address" },
                { name: "amount", type: "uint256" },
                { name: "requestId", type: "bytes32" }
            ],
        };

        const message = {
            user: await recipient.getAddress(),
            amount: withdrawAmount,
            requestId: ethers.keccak256(AbiCoder.encode(["string"], [requestId]))
        };

        // Generate the signature
        const signature = await user.signTypedData(domain, types, message);

        // const structHash = ethers.TypedDataEncoder.hash(domain, types, message);
        // const signer = await ethers.recoverAddress(structHash, signature);
        // const domainSeparator = ethers.TypedDataEncoder.hashDomain(domain);
        // console.log("NONCE: ", nonce)
        // console.log("DOMAIN: ", domainSeparator)
        // console.log("HASH: ", structHash)
        // console.log("SIGNER: ", signer)
        // Execute the withdrawal
        await expect(treasury.connect(user).withdraw(requestId, withdrawAmount, signature)).to.be.revertedWith("Permission denied");
    });

    it("Should success when admin grant role to user", async function () {
        await treasury.connect(admin).grantRole(await treasury.WITHDRAWER_ROLE(), user.getAddress());
        expect(await treasury.hasRole(await treasury.WITHDRAWER_ROLE(), user.getAddress())).to.equal(true);
    })
    it("Should success when admin revoke role to user", async function () {
        await treasury.connect(admin).revokeRole(await treasury.WITHDRAWER_ROLE(), user.getAddress());
        expect(await treasury.hasRole(await treasury.WITHDRAWER_ROLE(), user.getAddress())).to.equal(false);
    })
    it("Should fail when user try to grant role", async function () {
        await expect(treasury.connect(user).grantRole(await treasury.WITHDRAWER_ROLE(), user.getAddress())).to.be.revertedWithoutReason;
    })
});
