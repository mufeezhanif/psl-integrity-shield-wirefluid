# PSL Integrity Shield

### On-Chain Anti-Match-Fixing Protocol for Pakistan Super League

> **Entangled Hackathon 2026** · Built on WireFluid Network (Chain 92533)

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
- **Smart Contracts:** Solidity 0.8.20, OpenZeppelin v5 (Ownable, ReentrancyGuard)
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Web3:** ethers.js v6 + MetaMask (EIP-1193)
- **Testing:** Hardhat + Chai (32/32 tests passing)

## Deployed Contracts

| Contract | Address |
|----------|---------|
| MatchOracle | [`0x7b457E75Ad7AB2331FCDdeC5f0a80d33a6e34771`](https://scan.wirefluid.com/address/0x7b457E75Ad7AB2331FCDdeC5f0a80d33a6e34771) |
| PredictionEngine | [`0xa97094e559e2570A37045542fed7A1Ff03763E87`](https://scan.wirefluid.com/address/0xa97094e559e2570A37045542fed7A1Ff03763E87) |
| AnomalyTracker | [`0x1570200C79D6245ba77797541e4fab90bCfDAC34`](https://scan.wirefluid.com/address/0x1570200C79D6245ba77797541e4fab90bCfDAC34) |

## Features

- **Commit-Reveal Predictions** — Cryptographically tamper-proof predictions with auto-generated salts
- **Stake-Weighted Governance** — Flag suspicious matches by staking WIRE; community votes to resolve
- **Reporter Trust Scores** — On-chain reputation tracking for event reporters
- **Crowd Divergence Detection** — Automatic alerts when outcomes diverge >70% from crowd consensus
- **Clean Match Certification** — On-chain proof that a match passed community integrity review
- **Season Integrity Dashboard** — Aggregated analytics with per-match integrity bar charts
- **Prediction Accuracy Leaderboard** — Ranked predictors with accuracy percentages

## Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env    # Add your private key
npx hardhat compile
npx hardhat test         # 32/32 tests passing
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
│   ├── contracts/          # 3 Solidity contracts
│   ├── scripts/deploy.js   # Deploy + sample data setup
│   ├── test/               # 32 tests (all passing)
│   └── hardhat.config.js
├── frontend/
│   ├── src/
│   │   ├── views/          # Dashboard, Predictions, Reporters, Season, Leaderboard, Audit
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # useWallet, useChainData
│   │   └── config/         # Contract ABIs, network constants
│   └── dist/               # Production build
└── docs/                   # Architecture docs, feature specs
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

## Sample Transaction Hashes

| Action | Tx Hash |
|--------|---------|
| Match 1: LQ vs IU | `0xeac2c2e0f4dfa98e112720b6882e179600863aa31d2456d2feb93420b11a1fad` |
| Match 2: KK vs PZ | `0x56b877e8cbe5c08273be1f9d0409a61d62ac62bf0a9e6ad9afb0c5eda4733696` |
| Match 3: MS vs QG | `0xa152486f402b1d65b7983b87ad47ef6bdf57b0cd86871dd1c91dcee9603138fa` |
| Reporter registered | `0x802db02a13a5535a7878eb1ba5f811bcb45016d524afbdc2a99aa4c252d31337` |
| Event submitted | `0x0c232939d347d39a47d91b0437909e4117f6fd93b589fe5e61564a365262325e` |

All verifiable on [WireFluidScan](https://scan.wirefluid.com).

## License

MIT
