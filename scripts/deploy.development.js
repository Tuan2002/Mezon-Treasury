require('dotenv').config()
const hre = require("hardhat");
const { ethers } = hre;

// Replace this with your MetaMask address

async function main() {
    // Fetch the chainId
    const network = await ethers.provider.getNetwork();
    console.log("Connected to network:", network.name);
    console.log("Chain ID:", network.chainId);
    // Deploy the MockERC20 contract
    const MockERC20 = await ethers.getContractFactory("MezonToken");
    const mockERC20 = await MockERC20.deploy();
    await mockERC20.waitForDeployment();
    // Deploy the MezonTreasury contract
    const MezonTreasury = await ethers.getContractFactory("MezonTreasury");
    const mezonTreasury = await MezonTreasury.deploy(mockERC20.getAddress());
    await mezonTreasury.waitForDeployment();
    console.log("MockERC20 deployed to:", await mockERC20.getAddress());
    console.log("MezonTreasury deployed to:", await mezonTreasury.getAddress());
    // Deposit some tokens to the MezonTreasury contract
    const depositAmount = ethers.parseEther("10000");
    await mockERC20.approve(mezonTreasury.getAddress(), depositAmount);
    await mezonTreasury.deposit(depositAmount);
    console.log("Deposited", depositAmount.toString(), "tokens to MezonTreasury");
}

main()
   .then(() => process.exit(0))
   .catch((error) => {
       console.error(error);
       process.exit(1);
   });
