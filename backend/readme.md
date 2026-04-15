# PSL Integrity Shield — Smart Contracts

Solidity smart contracts powering the on-chain anti-match-fixing protocol for PSL.

## Contracts

| Contract | Description | Address |
|----------|-------------|---------|
| **MatchOracle** | Immutable event ledger with staked reporters, state machine (Upcoming→Live→Completed), trust scores | [`0x787f...dbcE`](https://wirefluidscan.com/address/0x787fbf712fc3BAEa7Bc2eC7cd9b7486A3332dbcE) |
| **PredictionEngine** | Commit-reveal crowd predictions, winner tracking, divergence detection (>70% threshold) | [`0x0150...1e47`](https://wirefluidscan.com/address/0x015055E95c55de974576B2118848771a210F1e47) |
| **AnomalyTracker** | Stake-weighted anomaly flagging, quorum voting, integrity scores, clean match certification | [`0x841D...00c6`](https://wirefluidscan.com/address/0x841D668719338F3292Cd4DB7911C9E704bCc00c6) |

## Security

- **OpenZeppelin v5.6.1**: `Ownable`, `ReentrancyGuard`, `Pausable`
- **No locked funds**: `withdrawSlashedFunds()` and `withdrawVoteStake()` for fund recovery
- **Emergency stop**: Owner can `pause()` / `unpause()` all state-changing operations
- **Commit-reveal**: keccak256 hash validation prevents prediction tampering

## Setup

```bash
npm install
cp .env.example .env   # Add PRIVATE_KEY
npx hardhat compile
```

## Testing

```bash
npx hardhat test
# 38/38 tests passing
```

Tests cover: match lifecycle, reporter staking/slashing, commit-reveal validation, flag raising, quorum voting, integrity scores, pause/unpause, fund withdrawals.

## Deploy

```bash
npx hardhat run scripts/deploy.js --network wirefluid
```

The deploy script creates 3 sample PSL matches, registers a reporter, submits events, and completes Match 1 — seeding the frontend with live data.

## Network

- **Chain:** WireFluid Testnet (92533)
- **RPC:** `https://evm.wirefluid.com`
- **Explorer:** [wirefluidscan.com](https://wirefluidscan.com)

## Structure

```
contracts/
├── MatchOracle.sol        # Event ledger + reporter management
├── PredictionEngine.sol   # Commit-reveal predictions
└── AnomalyTracker.sol     # Community flagging + governance
scripts/
└── deploy.js              # Deploy + seed sample data
test/
└── IntegrityShield.test.js  # 38 tests
```
