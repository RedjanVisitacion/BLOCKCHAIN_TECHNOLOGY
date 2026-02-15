const SEPOLIA_CHAIN_ID = 11155111;

const CONTRACT_ADDRESS = "0x5622a644969D04aDe7567AEEA7C3E36C58AF67DD";

const ABI = [
  "function electionName() view returns (string)",
  "function candidatesCount() view returns (uint256)",
  "function getCandidate(uint256) view returns (string name, uint256 voteCount)",
  "function hasVoted(address) view returns (bool)",
  "function vote(uint256 candidateIndex)"
];

let provider;
let signer;
let contract;

const elStatus = document.getElementById("status");
const elNetwork = document.getElementById("network");
const elAccount = document.getElementById("account");
const elContract = document.getElementById("contract");
const elElection = document.getElementById("election");
const elCandidates = document.getElementById("candidates");
const elMessage = document.getElementById("message");

function setMessage(msg) {
  elMessage.textContent = msg || "";
}

function shortAddr(a) {
  if (!a) return "-";
  return a.slice(0, 6) + "..." + a.slice(-4);
}

async function requireSepolia() {
  const net = await provider.getNetwork();
  elNetwork.textContent = `${net.name} (chainId=${net.chainId})`;
  if (Number(net.chainId) !== SEPOLIA_CHAIN_ID) {
    throw new Error("WRONG_NETWORK_SWITCH_TO_SEPOLIA");
  }
}

async function requireDeployedContract() {
  const code = await provider.getCode(CONTRACT_ADDRESS);
  if (!code || code === "0x") {
    throw new Error("CONTRACT_NOT_DEPLOYED_AT_ADDRESS");
  }
}

async function connect() {
  if (!window.ethereum) {
    setMessage("MetaMask not detected.");
    return;
  }

  if (CONTRACT_ADDRESS === "REPLACE_WITH_DEPLOYED_ADDRESS") {
    setMessage("Contract address not set. Deploy the contract, then update web/app.js CONTRACT_ADDRESS.");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();

  await requireSepolia();
  await requireDeployedContract();

  const account = await signer.getAddress();
  elAccount.textContent = account;
  elContract.textContent = CONTRACT_ADDRESS;

  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  const electionName = await contract.electionName();
  elElection.textContent = electionName;

  elStatus.textContent = "Connected";
  setMessage("Connected. You can vote now.");

  await refresh();
}

async function refresh() {
  if (!contract) return;

  setMessage("Loading candidates...");
  elCandidates.innerHTML = "";

  const account = await signer.getAddress();
  const alreadyVoted = await contract.hasVoted(account);

  const count = await contract.candidatesCount();
  const items = [];

  for (let i = 0; i < Number(count); i++) {
    const [name, voteCount] = await contract.getCandidate(i);
    items.push({ index: i, name, voteCount: Number(voteCount) });
  }

  for (const it of items) {
    const div = document.createElement("div");
    div.className = "item";

    const left = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = it.name;
    const sub = document.createElement("div");
    sub.className = "count";
    sub.textContent = `Votes: ${it.voteCount}`;
    left.appendChild(title);
    left.appendChild(sub);

    const btn = document.createElement("button");
    btn.textContent = alreadyVoted ? "Voted" : "Vote";
    btn.disabled = Boolean(alreadyVoted);
    btn.addEventListener("click", async () => {
      try {
        setMessage("Sending vote transaction... Confirm in MetaMask.");
        const tx = await contract.vote(it.index);
        setMessage(`Transaction sent: ${tx.hash}. Waiting for confirmation...`);
        await tx.wait();
        setMessage("Vote confirmed on Sepolia.");
        await refresh();
      } catch (e) {
        const msg = (e && e.message) ? e.message : String(e);
        setMessage(msg);
      }
    });

    div.appendChild(left);
    div.appendChild(btn);
    elCandidates.appendChild(div);
  }

  setMessage(alreadyVoted ? "You already voted from this wallet address." : "Pick a candidate.");
}

document.getElementById("btnConnect").addEventListener("click", () => {
  connect().catch((e) => {
    const msg = (e && e.message) ? e.message : String(e);
    if (msg.includes("WRONG_NETWORK_SWITCH_TO_SEPOLIA")) {
      setMessage("Wrong network. Please switch MetaMask to Sepolia and try again.");
      return;
    }
    if (msg.includes("CONTRACT_NOT_DEPLOYED_AT_ADDRESS")) {
      setMessage("No smart contract is deployed at CONTRACT_ADDRESS. Deploy the Voting contract to Sepolia and paste the deployed contract address into web/app.js.");
      return;
    }
    setMessage(msg);
  });
});

document.getElementById("btnRefresh").addEventListener("click", () => {
  refresh().catch((e) => setMessage((e && e.message) ? e.message : String(e)));
});

if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => window.location.reload());
  window.ethereum.on("chainChanged", () => window.location.reload());
}
