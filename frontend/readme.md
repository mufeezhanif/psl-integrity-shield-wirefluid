# PSL Integrity Shield — Frontend

React dashboard for monitoring PSL match integrity on-chain.

**Live:** [psl-integrity-shield.vercel.app](https://psl-integrity-shield.vercel.app)

## Tech Stack

- **React 18** + **Vite 6** + **Tailwind CSS 3.4**
- **ethers.js v6** for Web3 / contract interaction
- **MetaMask** (EIP-1193) with auto network switching
- **Lucide React** icons

## Views

| View | Description |
|------|-------------|
| **Dashboard** | Match cards with integrity score rings, search & filter |
| **Match Detail** | Team banner, integrity score, flag board with voting |
| **Predictions** | Commit-reveal prediction flow with auto-generated salts |
| **Reporters** | Reporter registry, trust scores, staking |
| **Season Report** | Aggregated season stats, per-match integrity bar chart |
| **Leaderboard** | Top predictors ranked by accuracy |
| **Audit Trail** | Immutable event log with block numbers and explorer links |

## Features

- **Toast notifications** with WireFluidScan tx links (success/error/warning/info)
- **Promise.all RPC batching** — parallel on-chain reads with 3s throttle
- **MetaMask listeners** — auto-reconnect on account/chain changes
- **Chain validation** — verifies WireFluid Testnet before proceeding
- **Read-only mode** — public data loads without wallet connection

## Setup

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # Production build in dist/
```

No `.env` needed — uses public RPC for reads, MetaMask signer for writes.

## Structure

```
src/
├── views/              # Dashboard, Predictions, Reporters, Season, Leaderboard, Audit
├── components/
│   ├── dashboard/      # MatchCard, StatsBar
│   ├── layout/         # Header
│   ├── match/          # MatchDetail, FlagForm, IntegrityScore
│   └── ui/             # Badge, Button, Card, Toast
├── hooks/
│   ├── useWallet.js    # MetaMask connection + chain management
│   └── useChainData.js # On-chain data loading with parallel batching
├── config/
│   ├── constants.js    # Network config, team colors
│   └── contracts.js    # ABIs + addresses
├── App.jsx             # Main orchestrator
└── main.jsx            # Entry point
```

## Deployment

Deployed via Vercel CLI:

```bash
npm run build
npx vercel --prod
```
