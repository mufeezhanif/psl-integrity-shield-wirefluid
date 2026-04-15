# PSL Integrity Shield

### Anti-Match-Fixing Transparency Protocol for Pakistan Super League

> **Entangled Hackathon 2026** · Built exclusively on WireFluid Network (Chain 92533)

---

## The Problem

Match-fixing is the single biggest threat to cricket's credibility in Pakistan. The 2010 spot-fixing scandal, repeated investigations, and ongoing suspicions have eroded fan trust. Current integrity systems are:

- **Opaque** — investigations happen behind closed doors
- **Centralized** — a single authority decides what's suspicious
- **Retroactive** — problems are only caught after damage is done
- **Erasable** — records can be altered or suppressed

None of these problems can be solved by a centralized system. **They require a blockchain.**

## The Solution

PSL Integrity Shield creates three interlocking on-chain mechanisms:

### 1. MatchOracle — Immutable Event Ledger
Staked reporters submit ball-by-ball event hashes during live matches. Every delivery, every run, every wicket gets a timestamped, cryptographic fingerprint on WireFluid. This creates an audit trail that **no one can alter after the fact** — not reporters, not the league, not us. Reporters stake WIRE to participate and can be slashed for misconduct, creating economic accountability.

### 2. PredictionEngine — Commit-Reveal Crowd Intelligence
Before each match, fans commit hashed predictions (match winner, run totals, milestones). After the match, they reveal. The contract validates every reveal against its original commit — making it **mathematically impossible to change your prediction after seeing the result**. The aggregated crowd consensus becomes a baseline for "what everyone expected."

### 3. AnomalyTracker — Community-Governed Integrity Flags
When outcomes diverge suspiciously from crowd predictions, anyone can raise a flag by staking WIRE. The community votes (also stake-weighted). Upheld flags permanently mark the match on-chain and reduce its integrity score. Frivolous flags lose their stake — economic anti-spam.

## Why Blockchain is Essential

| Feature | Centralized System | Integrity Shield |
|---------|-------------------|-----------------|
| Event records | Editable database | Immutable on-chain hashes |
| Predictions | Can be backdated | Commit-reveal prevents tampering |
| Flagging | Authority decides | Community-governed voting |
| Audit trail | Can be suppressed | Public on WireFluidScan |
| Accountability | Trust the institution | Trust the math |

## Technical Architecture

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ League Admin │  │   Staked    │  │ Fan / Public │
│              │  │  Reporter   │  │              │
└──────┬───────┘  └──────┬──────┘  └──────┬───────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌─────────────┐
│ MatchOracle  │──│ PredictionEng│  │  Anomaly    │
│ Events+Stakes│  │ Commit-Reveal│  │  Tracker    │
└──────────────┘  └──────────────┘  └─────────────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         ▼
              ┌─────────────────────┐
              │ WireFluid Testnet   │
              │ Chain 92533 · ~5s   │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │ WireFluidScan       │
              │ Public verification │
              └─────────────────────┘
```

## Smart Contracts

| Contract | Lines | Key Patterns |
|----------|-------|-------------|
| `MatchOracle.sol` | ~180 | Staking/slashing, role-based access, event sourcing, state machine |
| `PredictionEngine.sol` | ~170 | Commit-reveal, time-gated access, on-chain aggregation |
| `AnomalyTracker.sol` | ~200 | Stake-weighted governance, quorum voting, economic incentives |

All contracts use **OpenZeppelin v5** (Ownable, ReentrancyGuard) and follow security best practices.

## Quick Start

### 1. Install
```bash
npm install
```

### 2. Configure
```bash
cp .env.example .env
# Add your private key (get test WIRE from https://faucet.wirefluid.com)
```

### 3. Compile & Test
```bash
npm run compile
npm run test
```

### 4. Deploy to WireFluid
```bash
npm run deploy
```

### 5. Update frontend
Copy deployed addresses into `frontend/index.html` CONFIG object.

### 6. Open frontend
Open `frontend/index.html` in any browser with MetaMask installed.

## Judging Criteria Coverage

| Criteria | How We Address It |
|----------|------------------|
| **Smart Contract Evaluation** | 3 contracts with OpenZeppelin, ReentrancyGuard, commit-reveal, staking/slashing, state machines |
| **Usability of Web3 (MetaMask)** | Auto network switch, clear tx prompts, stake amounts, salt generation |
| **Usage of RPC** | Single WireFluid RPC, efficient reads, ethers.js v6 |
| **Real World Impact** | Directly addresses Pakistan cricket's biggest credibility problem |
| **Code Quality** | NatSpec documentation, modular architecture, comprehensive tests with time manipulation |
| **UI/UX Quality** | Clean dark UI, integrity score badges, vote progress bars, audit trail viewer |

## Transaction Hashes

> Fill after deployment:

- MatchOracle: `0x...`
- PredictionEngine: `0x...`
- AnomalyTracker: `0x...`
- Sample match: `0x...`
- Reporter registration: `0x...`

## Project Structure

```
psl-integrity-shield/
├── contracts/
│   ├── MatchOracle.sol         # Event ledger + reporter staking
│   ├── PredictionEngine.sol    # Commit-reveal predictions
│   └── AnomalyTracker.sol      # Community anomaly governance
├── scripts/
│   └── deploy.js               # Deploy + wire + sample data
├── test/
│   └── IntegrityShield.test.js # Full test suite
├── frontend/
│   └── index.html              # Single-file dApp
├── hardhat.config.js
├── package.json
└── README.md
```

## License

MIT