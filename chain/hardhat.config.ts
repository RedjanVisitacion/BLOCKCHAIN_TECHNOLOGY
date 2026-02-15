import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const networks: HardhatUserConfig["networks"] = {
  sepolia: {
    url: SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
    accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
  },
};

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks,
};

export default config;
