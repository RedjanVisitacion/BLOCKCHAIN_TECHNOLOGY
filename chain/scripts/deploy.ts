import hardhat from "hardhat";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const { ethers } = hardhat;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function main() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL || "";
  const pkRaw = process.env.PRIVATE_KEY || "";

  if (!rpcUrl) {
    throw new Error("Missing SEPOLIA_RPC_URL in chain/.env");
  }
  if (!pkRaw) {
    throw new Error("Missing PRIVATE_KEY in chain/.env");
  }

  const privateKey = pkRaw.startsWith("0x") ? pkRaw : `0x${pkRaw}`;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const deployer = new ethers.Wallet(privateKey, provider);

  const electionName = process.env.ELECTION_NAME || "USTP Oroquieta ECVS";
  const candidates = (process.env.CANDIDATES || "Candidate A,Candidate B,Candidate C")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const Factory = await ethers.getContractFactory("Voting", deployer);
  const contract = await Factory.deploy(electionName, candidates);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(JSON.stringify({ contractAddress: address, deployer: await deployer.getAddress(), electionName, candidates }));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
