require('dotenv').config()
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
  networks: {
    sepolia: {
      url: `${process.env.SEPOLIA_RPC_URL}/${process.env.SEPOLIA_RPC_API_KEY}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      etherscan: {
        apiKey: process.env.SEPOLIA_ETHERSCAN_API_KEY
      }
    },
    localhost: {
      url: process.env.LOCAL_PROVIDER_URL,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    }
  },
  etherscan: {
    apiKey: process.env.SEPOLIA_ETHERSCAN_API_KEY
  },
  sourcify: {
    enabled: true
  }
};
