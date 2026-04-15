# PSL Integrity Shield

### On-Chain Anti-Match-Fixing Protocol for Pakistan Super League

> **Entangled Hackathon 2026** · Built on WireFluid Network (Chain 92533)
> 
> **Live Demo:** [psl-integrity-shield.vercel.app](https://psl-integrity-shield.vercel.app)

---

## The Problem

Match-fixing threatens cricket's credibility in Pakistan. Current integrity systems are **opaque**, **centralized**, **retroactive**, and **erasable**. None of these problems can be solved by a centralized system — they require a blockchain.

## The Solution

Three interlocking smart contracts that make match integrity **transparent**, **immutable**, and **community-governed**:

| Contract | Purpose |
|----------|---------|
| **MatchOracle** | Immutable event ledger — staked reporters submit ball-by-ball event hashes during live matches |
| **PredictionEngine** | Commit-reveal crowd intelligence — fans lock predictions before matches, reveal after |
| **AnomalyTracker** | Community-governed flagging — stake-weighted voting on suspicious matches |

## Tech Stack

- **Blockchain:** WireFluid Testnet (Chain 92533)
- **Smart Contracts:** Solidity 0.8.20, OpenZeppelin v5 (Ownable, ReentrancyGuard, Pausable)
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Web3:** ethers.js v6 + MetaMask (EIP-1193)
- **Testing:** Hardhat + Chai (38/38 tests passing)
- **Deployment:** Vercel (frontend), WireFluid Testnet (contracts)

## Deployed Contracts

| Contract | Address |
|----------|---------|
| MatchOracle | [`0x787fbf712fc3BAEa7Bc2eC7cd9b7486A3332dbcE`](https://wirefluidscan.com/address/0x787fbf712fc3BAEa7Bc2eC7cd9b7486A3332dbcE) |
| PredictionEngine | [`0x015055E95c55de974576B2118848771a210F1e47`](https://wirefluidscan.com/address/0x015055E95c55de974576B2118848771a210F1e47) |
| AnomalyTracker | [`0x841D668719338F3292Cd4DB7911C9E704bCc00c6`](https://wirefluidscan.com/address/0x841D668719338F3292Cd4DB7911C9E704bCc00c6) |

Deployer: `0x07413b065106518F307d5ea7309514fB31D740cA`

## Evaluation Criteria Coverage

### 1. Smart Contract Evaluation

| Criteria | Implementation |
|----------|---------------|
| **1.1 Security** | ReentrancyGuard on all payable functions, Pausable emergency stops, commit-reveal hash validation, state machine enforcement, quorum-based governance, no locked funds (withdrawal mechanisms for slashed/voted stakes) |
| **1.2 Reusability** | 3-contract modular design — each contract has a single responsibility, configurable parameters (stake amounts, quorum), constructor-injected dependencies |
| **1.3 OpenZeppelin** | `Ownable` (role-based access), `ReentrancyGuard` (reentrancy protection), `Pausable` (emergency stop) — all from OpenZeppelin v5.6.1 |
| **1.4 WireFluid Deployment** | All 3 contracts deployed on Chain 92533 with sample data seeded. Tx hashes below. |

### 2. Web3 / MetaMask Usability

| Criteria | Implementation |
|----------|---------------|
| **2.1 Security** | `eth_requestAccounts` for wallet connection, `wallet_switchEthereumChain` / `wallet_addEthereumChain` for network management, no private key exposure, read-only provider for unauthenticated views |
| **2.2 Gas** | Solidity optimizer (200 runs). createMatch ~122K, commitPrediction ~101K, voteOnFlag ~105K, resolveFlag ~75K. All <200K gas. |

### 3. RPC Usage

| Criteria | Implementation |
|----------|---------------|
| **3.1 Security** | Public RPC for reads (`JsonRpcProvider`), MetaMask signer for writes. No API keys exposed in frontend. |
| **3.2 Request count** | `Promise.all` parallel batching for all on-chain reads. 3-second throttle prevents duplicate fetches. Batch match data + integrity + certification in single parallel call. |
| **3.3 Drop rate** | Multi-stage toast notifications (submitting → confirming → success/error). `parseTxError()` handles: user rejection, insufficient funds, contract reverts. MetaMask manages gas estimation natively. |

### 4. Real World Impact

PSL match-fixing detection with: immutable ball-by-ball audit trails, cryptographic crowd predictions, community-governed anomaly flagging, on-chain clean match certification, reporter trust scores.

### 5. Code Quality

38/38 tests passing. Clean 3-contract architecture. Comprehensive error handling. Modular React components with custom hooks.

### 6. UI/UX Quality

Dark-themed glass-morphism design. 6 views (Dashboard, Season Report, Predictions, Reporters, Leaderboard, Audit Trail). Toast notification system with explorer links. Integrity score rings, vibe labels, team colors. Auto-connect wallet, auto-fill salts.

## Deployment Transaction Hashes

All verifiable on [WireFluidScan](https://wirefluidscan.com).

### Contract Deployments

| Contract | Tx Hash |
|----------|---------|
| MatchOracle | [`0x9eb67dac20fb9c421fbb568dc00219d495e811fbcabea7a2fa887db9177af1f3`](https://wirefluidscan.com/tx/0x9eb67dac20fb9c421fbb568dc00219d495e811fbcabea7a2fa887db9177af1f3) |
| PredictionEngine | [`0xa401a267999a0fec734273ca1dd61cf3eb533216e34bdf3f6a79f30faa6c0896`](https://wirefluidscan.com/tx/0xa401a267999a0fec734273ca1dd61cf3eb533216e34bdf3f6a79f30faa6c0896) |
| AnomalyTracker | [`0xb01eea2e2b4cc1892a5996ffd421fc755b76afbd437bd133f1bd8066c24ec1f2`](https://wirefluidscan.com/tx/0xb01eea2e2b4cc1892a5996ffd421fc755b76afbd437bd133f1bd8066c24ec1f2) |

### Sample Data (On-Chain Proof of Full Lifecycle)

| Action | Tx Hash |
|--------|---------|
| Match 1 created (LQ vs IU) | [`0xbf977102519a21b6bec5c2ef53dcd2a5492e2842fae09758005e80cadf290605`](https://wirefluidscan.com/tx/0xbf977102519a21b6bec5c2ef53dcd2a5492e2842fae09758005e80cadf290605) |
| Match 2 created (KK vs PZ) | [`0x76c0995102fb0204c3a91be77208e9e369d385abf80c32d236c235059a9ce1c9`](https://wirefluidscan.com/tx/0x76c0995102fb0204c3a91be77208e9e369d385abf80c32d236c235059a9ce1c9) |
| Match 3 created (MS vs QG) | [`0x3007032873a7b11d3e379bbb52085a858f981aef6922c7017af9d4e0b5f5fbdc`](https://wirefluidscan.com/tx/0x3007032873a7b11d3e379bbb52085a858f981aef6922c7017af9d4e0b5f5fbdc) |
| Reporter registered (0.01 WIRE staked) | [`0x9dd11456030840677b5a9fc39e3cd1866989eb2a20c3146689baa57f3c9e56d7`](https://wirefluidscan.com/tx/0x9dd11456030840677b5a9fc39e3cd1866989eb2a20c3146689baa57f3c9e56d7) |
| Match 1 started | [`0x6ad2a61919b652f8ae4110a86c463070a9bf601d567d38b05c496de7f91206de`](https://wirefluidscan.com/tx/0x6ad2a61919b652f8ae4110a86c463070a9bf601d567d38b05c496de7f91206de) |
| Event 1 submitted | [`0xa342a464708a082db604ddca35e61be5d0f54139d85dfb5ea977864e720a0d41`](https://wirefluidscan.com/tx/0xa342a464708a082db604ddca35e61be5d0f54139d85dfb5ea977864e720a0d41) |
| Event 2 submitted | [`0x358c2bca9b57108e360712972eedf12c3a6bfa83ad1e8cc3be614c31762a9054`](https://wirefluidscan.com/tx/0x358c2bca9b57108e360712972eedf12c3a6bfa83ad1e8cc3be614c31762a9054) |
| Event 3 submitted | [`0xce4d5914640b52cfa6c761aa520436c93b019e5f4382d267f5a0272eb44579cd`](https://wirefluidscan.com/tx/0xce4d5914640b52cfa6c761aa520436c93b019e5f4382d267f5a0272eb44579cd) |
| Match 1 ended | [`0x41f1e77afe9ce83f31134622c847774c1db0627c3d88eccf9d149e1e126c10b6`](https://wirefluidscan.com/tx/0x41f1e77afe9ce83f31134622c847774c1db0627c3d88eccf9d149e1e126c10b6) |

## Features

- **Commit-Reveal Predictions** — Cryptographically tamper-proof predictions with auto-generated salts
- **Stake-Weighted Governance** — Flag suspicious matches by staking WIRE; community votes to resolve
- **Reporter Trust Scores** — On-chain reputation (0–200) tracking for event reporters
- **Crowd Divergence Detection** — Automatic alerts when outcomes diverge >70% from crowd consensus
- **Clean Match Certification** — On-chain proof that a match passed community integrity review
- **Season Integrity Dashboard** — Aggregated analytics with per-match integrity bar charts
- **Prediction Accuracy Leaderboard** — Ranked predictors with accuracy percentages
- **Emergency Pause** — Owner can pause all operations via OpenZeppelin Pausable
- **Fund Recovery** — Withdrawal mechanisms for slashed/voted stakes (no locked funds)
- **Toast Notifications** — Real-time transaction status with WireFluidScan links

## Quick Start

### Backend (Smart Contracts)

```bash
cd backend
npm install
cp .env.example .env    # Add your private key
npx hardhat compile
npx hardhat test         # 38/38 tests passing
npx hardhat run scripts/deploy.js --network wirefluid
```

### Frontend

```bash
cd frontend
npm install
npm run dev              # Opens at http://localhost:3000
```

Requires MetaMask — the app auto-switches to WireFluid Testnet.

Get test WIRE from the [WireFluid Faucet](https://faucet.wirefluid.com).

## Project Structure

```
wirefluid-hackathon/
├── backend/
│   ├── contracts/          # 3 Solidity contracts (Ownable + ReentrancyGuard + Pausable)
│   ├── scripts/deploy.js   # Deploy + sample data setup
│   ├── test/               # 38 tests (all passing)
│   └── hardhat.config.js
├── frontend/
│   ├── src/
│   │   ├── views/          # Dashboard, Predictions, Reporters, Season, Leaderboard, Audit
│   │   ├── components/     # Reusable UI (Card, Badge, Button, Toast)
│   │   ├── hooks/          # useWallet, useChainData (Promise.all batched)
│   │   └── config/         # Contract ABIs, network constants
│   └── dist/               # Production build
└── docs/                   # Architecture docs, feature specs, demo script
```

## Architecture

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ League Admin │  │   Staked    │  │ Fan / Public │
│              │  │  Reporter   │  │              │
└──────┬───────┘  └──────┬──────┘  └──────┬───────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌─────────────┐
│ MatchOracle  │──│ Prediction   │  │  Anomaly    │
│ Events+Stakes│  │ Engine       │  │  Tracker    │
└──────────────┘  └──────────────┘  └─────────────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         ▼
              ┌─────────────────────┐
              │ WireFluid Testnet   │
              │ Chain 92533 · ~5s   │
              └─────────────────────┘
```

## License

MIT
