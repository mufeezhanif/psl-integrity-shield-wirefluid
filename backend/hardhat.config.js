require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

function getAccounts() {
  const key = process.env.PRIVATE_KEY;
  if (!key) return [];
  const prefixed = key.startsWith("0x") ? key : `0x${key}`;
  if (prefixed.length !== 66) return [];
  return [prefixed];
}

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    wirefluid: {
      url: "https://evm.wirefluid.com",
      chainId: 92533,
      accounts: getAccounts(),
    },
  },
};
