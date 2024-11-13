require('dotenv').config()
const hre = require("hardhat");
const { ethers } = hre;

// Replace this with your MetaMask address

async function main() {

    // Fetch the chainId
    const network = await ethers.provider.getNetwork();
    console.log("Connected to network:", network.name);
    console.log("Chain ID:", network.chainId);
    // Deploy the MezonTreasury contract
    const MezonTreasury = await ethers.getContractFactory("MezonTreasury");
    const mezonTreasury = await MezonTreasury.deploy();
    await mezonTreasury.waitForDeployment();
    console.log("MezonTreasury deployed to:", await mezonTreasury.getAddress());
}

main()
   .then(() => process.exit(0))
   .catch((error) => {
       console.error(error);
       process.exit(1);
   });
