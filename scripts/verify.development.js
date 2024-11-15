require('dotenv').config()
const hre = require("hardhat");

async function main() {

    const CONTRACT_ADDRESS = process.env.NEW_CONTRACT_ADDRESS;
    const TOKEN_ADDRESS = process.env.NEW_TOKEN_ADDRESS;

    await hre.run("verify:verify", {
        address: TOKEN_ADDRESS,
    });
    
    await hre.run("verify:verify", {
        address: CONTRACT_ADDRESS,
        constructorArguments: [TOKEN_ADDRESS],
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
