const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MezonTreasury", function () {
    let MezonTreasury, treasury, owner, admin, withdrawer, otherAccount;
    const initialSupply = ethers.parseUnits("100000000", 18);

    before(async () => {
        [owner, admin, withdrawer, otherAccount] = await ethers.getSigners();

        // Deploy MezonTreasury contract
        MezonTreasury = await ethers.getContractFactory("MezonTreasury");
        treasury = await MezonTreasury.deploy();
        await treasury.waitForDeployment();
    });

    it("Should have initial supply minted to owner", async () => {
        const ownerBalance = await treasury.balanceOf(await owner.getAddress());
        expect(ownerBalance).to.equal(initialSupply);
    });

    it("Should allow admin to grant withdrawer role", async () => {
        await treasury.connect(owner).grantWithdrawerRole(await withdrawer.getAddress());
        expect(await treasury.hasRole(await treasury.WITHDRAWER_ROLE(), await withdrawer.getAddress())).to.be.true;
    });

    it("Should allow admin to revoke withdrawer role", async () => {
        await treasury.connect(owner).revokeWithdrawerRole(await withdrawer.getAddress());
        expect(await treasury.hasRole(await treasury.WITHDRAWER_ROLE(), await withdrawer.getAddress())).to.be.false;
    });

    it("Should allow admin to mint new tokens", async () => {
        const mintAmount = ethers.parseUnits("1000", 18);
        const beforeBalance = await treasury.balanceOf(await owner.getAddress());
        await treasury.connect(owner).mint(await owner.getAddress(), mintAmount);
        const balance = await treasury.balanceOf(await owner.getAddress());
        expect(balance).to.equal(beforeBalance + mintAmount);
    });

    it("Should prevent non-admin from minting new tokens", async () => {
        try {
        const mintAmount = ethers.parseUnits("1000", 18);
        await expect(treasury.connect(otherAccount).mint(await otherAccount.getAddress(), mintAmount)
        ).to.be.revertedWithoutReason;
        }
        catch (error) {
            expect(error.message).to.contain("Permission denied");
        }
    });

    it("Should prevent non-admin from granting or revoking roles", async () => {
        await expect(
            treasury.connect(otherAccount).grantWithdrawerRole(await otherAccount.getAddress())
        ).to.be.revertedWith("Permission denied");

        await expect(
            treasury.connect(otherAccount).revokeWithdrawerRole(await withdrawer.getAddress())
        ).to.be.revertedWith("Permission denied");
    });

    it("Should allow withdrawal with a valid EIP-712 signature", async () => {
        // Set up the domain and types for EIP-712 signing
        const amountToWithdraw = ethers.parseEther("5");
        const requestId = "123456789";
        const AbiCoder = new ethers.AbiCoder()
        const domain = {
            name: "MezonTreasury",
            version: "1",
            chainId: await ethers.provider.getNetwork().then((n) => n.chainId),
            verifyingContract: await treasury.getAddress(),
        };

        const types = {
            WithdrawRequest: [
                { name: "user", type: "address" },
                { name: "amount", type: "uint256" },
                { name: "to", type: "address" },
                { name: "requestId", type: "bytes32" },
            ],
        };

        // Set up the withdrawal request
        const value = {
            user: await owner.getAddress(),
            amount: amountToWithdraw,
            to: await otherAccount.getAddress(),
            requestId: ethers.keccak256(AbiCoder.encode(["string"], [requestId])),
        };

        // Sign the withdrawal request
        const signature = await owner.signTypedData(domain, types, value);
        // const structHash = ethers.TypedDataEncoder.hash(domain, types, value);
        // const signer = await ethers.recoverAddress(structHash, signature);
        // const domainSeparator = ethers.TypedDataEncoder.hashDomain(domain);
        // console.log("DOMAIN: ", domainSeparator)
        // console.log("HASH: ", structHash)
        // console.log("SIGNER: ", signer)
        // console.log("Signature:", signature);

        // Execute the withdrawal
        const beforeOwnerBalance = await treasury.balanceOf(await owner.getAddress());
        const beforeOtherAccountBalance = await treasury.balanceOf(await otherAccount.getAddress());

        await expect(treasury.connect(owner).withdraw(requestId, amountToWithdraw, await otherAccount.getAddress(), signature))
        await treasury.connect(otherAccount).approve(treasury.getAddress(), amountToWithdraw);

        const ownerBalance = await treasury.balanceOf(await owner.getAddress());
        const otherAccountBalance = await treasury.balanceOf(await otherAccount.getAddress());
        expect(otherAccountBalance).to.equal(beforeOtherAccountBalance + amountToWithdraw);
        expect(ownerBalance).to.equal(beforeOwnerBalance - amountToWithdraw);
    });
    it("Should fail withdrawal with a invalid withdraw amount", async () => {
        try {
            // Set up the domain and types for EIP-712 signing
            const amountToWithdraw = ethers.parseEther("500000");
            const requestId = "123456789";
            const AbiCoder = new ethers.AbiCoder()
            const domain = {
                name: "MezonTreasury",
                version: "1",
                chainId: await ethers.provider.getNetwork().then((n) => n.chainId),
                verifyingContract: await treasury.getAddress(),
            };
    
            const types = {
                WithdrawRequest: [
                    { name: "user", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "to", type: "address" },
                    { name: "requestId", type: "bytes32" },
                ],
            };
    
            // Set up the withdrawal request
            const value = {
                user: await owner.getAddress(),
                amount: amountToWithdraw,
                to: await otherAccount.getAddress(),
                requestId: ethers.keccak256(AbiCoder.encode(["string"], [requestId])),
            };
    
            // Sign the withdrawal request
            const signature = await owner.signTypedData(domain, types, value);
            // Execute the withdrawal
            await expect(treasury.connect(owner).withdraw(requestId, amountToWithdraw, await otherAccount.getAddress(), signature))
            .to.be.revertedWith("Insufficient balance");
        }
        catch (error) {
            expect(error.message).to.contain("Insufficient balance");
        }
    });
    
    it("Should fail withdrawal with a invalid EIP-712 signature", async () => {
        try {
        // Set up the domain and types for EIP-712 signing
        const amountToWithdraw = ethers.parseEther("5");
        const requestId = "123456789";
        const AbiCoder = new ethers.AbiCoder()
        const domain = {
            name: "MezonTreasury",
            version: "1",
            chainId: await ethers.provider.getNetwork().then((n) => n.chainId),
            verifyingContract: await treasury.getAddress(),
        };

        const types = {
            WithdrawRequest: [
                { name: "user", type: "address" },
                { name: "amount", type: "uint256" },
                { name: "to", type: "address" },
                { name: "requestId", type: "bytes32" },
            ],
        };

        // Set up the withdrawal request
        const value = {
            user: await otherAccount.getAddress(),
            amount: amountToWithdraw,
            to: await otherAccount.getAddress(),
            requestId: ethers.keccak256(AbiCoder.encode(["string"], [requestId])),
        };

        // Sign the withdrawal request
        const signature = await owner.signTypedData(domain, types, value);
        // Execute the withdrawal
        await expect(treasury.connect(owner).withdraw(requestId, amountToWithdraw, await otherAccount.getAddress(), signature))
        .to.be.revertedWith("Invalid signature");
        }
        catch (error) {
            expect(error.message).to.contain("Invalid signature");
        }
    });
    it("Should fail withdrawal with a user no permission to withdraw", async () => {
        try {
        // Set up the domain and types for EIP-712 signing
        const amountToWithdraw = ethers.parseEther("5");
        const requestId = "123456789";
        const AbiCoder = new ethers.AbiCoder()
        const domain = {
            name: "MezonTreasury",
            version: "1",
            chainId: await ethers.provider.getNetwork().then((n) => n.chainId),
            verifyingContract: await treasury.getAddress(),
        };

        const types = {
            WithdrawRequest: [
                { name: "user", type: "address" },
                { name: "amount", type: "uint256" },
                { name: "to", type: "address" },
                { name: "requestId", type: "bytes32" },
            ],
        };

        // Set up the withdrawal request
        const value = {
            user: await admin.getAddress(),
            amount: amountToWithdraw,
            to: await otherAccount.getAddress(),
            requestId: ethers.keccak256(AbiCoder.encode(["string"], [requestId])),
        };

        // Sign the withdrawal request
        const signature = await admin.signTypedData(domain, types, value);
        // Execute the withdrawal
        await expect(treasury.connect(admin).withdraw(requestId, amountToWithdraw, await otherAccount.getAddress(), signature))
        .to.be.revertedWith("Permission denied");
        }
        catch (error) {
            expect(error.message).to.contain("Permission denied");
        }
    });

});
