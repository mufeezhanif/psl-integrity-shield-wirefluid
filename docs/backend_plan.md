# Backend Implementation Plan — Group A

> **Owner:** Mufeez + Abdul Rehman
> **Deadline:** April 15, 2026 at 12:00 PM (Noon)
> **Network:** WireFluid Testnet (Chain 92533)

---

## 1. Project Setup

### 1.1 Initialize Hardhat inside `backend/`

```bash
cd backend
npm init -y
npx hardhat init          # JavaScript project
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts dotenv
mkdir -p contracts scripts test
echo 'PRIVATE_KEY=your_wallet_private_key_here' > .env
```

### 1.2 hardhat.config.js

```js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    wirefluid: {
      url: "https://evm.wirefluid.com",
      chainId: 92533,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
```

### 1.3 .env.example

```
PRIVATE_KEY=your_wallet_private_key_here
```

### 1.4 .gitignore

```
node_modules/
.env
artifacts/
cache/
```

---

## 2. Smart Contracts — Build Order

Contracts must be built in dependency order since PredictionEngine and AnomalyTracker both depend on MatchOracle.

### Build Sequence:
1. **MatchOracle.sol** — foundation, no dependencies
2. **PredictionEngine.sol** — depends on MatchOracle (reads match state)
3. **AnomalyTracker.sol** — depends on MatchOracle (reads match state)

---

## 3. Contract #1: MatchOracle.sol (~150–180 lines)

**Purpose:** Immutable event ledger for PSL matches. Reporters stake WIRE to participate, submit ball-by-ball event hashes during live matches, and can be slashed for misconduct.

### State Variables
```solidity
enum MatchState { Upcoming, Live, Completed }

struct Match {
    string team1;
    string team2;
    MatchState state;
    uint256 eventCount;
    uint256 createdAt;
}

uint256 public reporterStake = 0.01 ether;  // 0.01 WIRE
uint256 public matchCount;

mapping(uint256 => Match) public matches;
mapping(address => bool) public registeredReporters;
mapping(address => uint256) public reporterStakes;
mapping(uint256 => mapping(uint256 => bytes32)) public matchEvents;  // matchId => eventIndex => hash
```

### Functions
| Function | Access | Description |
|----------|--------|-------------|
| `createMatch(uint256 matchId, string team1, string team2)` | onlyOwner | Creates a new match in Upcoming state |
| `registerReporter()` | payable, public | Stakes 0.01 WIRE to become a reporter |
| `submitEvent(uint256 matchId, bytes32 eventHash)` | onlyReporter | Submit event hash during Live match |
| `startMatch(uint256 matchId)` | onlyOwner | Transition: Upcoming → Live |
| `endMatch(uint256 matchId)` | onlyOwner | Transition: Live → Completed |
| `slashReporter(address reporter)` | onlyOwner | Slash reporter's stake |
| `getMatchState(uint256 matchId)` | view | Returns current match state |

### Events
```
MatchCreated(uint256 indexed matchId, string team1, string team2)
ReporterRegistered(address indexed reporter, uint256 stake)
EventSubmitted(uint256 indexed matchId, address indexed reporter, bytes32 eventHash, uint256 eventIndex)
MatchStarted(uint256 indexed matchId)
MatchEnded(uint256 indexed matchId)
ReporterSlashed(address indexed reporter, uint256 amount)
```

### OpenZeppelin Imports
- `Ownable` — admin-only functions (createMatch, startMatch, endMatch, slashReporter)
- `ReentrancyGuard` — protect registerReporter() and slashReporter() from reentrancy

### Security Checks
- `registerReporter()`: require `msg.value >= reporterStake`, reject if already registered
- `submitEvent()`: require caller is registered reporter AND match state is Live
- `startMatch()`: require match exists AND state is Upcoming
- `endMatch()`: require match exists AND state is Live
- `slashReporter()`: require reporter is registered, transfer stake to contract, set registered to false

---

## 4. Contract #2: PredictionEngine.sol (~140–170 lines)

**Purpose:** Commit-reveal prediction system. Fans commit hashed predictions before a match, then reveal after completion. The contract validates reveals cryptographically and aggregates crowd consensus.

### State Variables
```solidity
struct Prediction {
    bytes32 commitHash;
    bool revealed;
    string predictedWinner;
    uint256 predictedRuns;
}

struct MatchAggregation {
    uint256 totalReveals;
    mapping(string => uint256) winnerVotes;
    uint256 totalPredictedRuns;
}

IMatchOracle public matchOracle;

mapping(uint256 => mapping(address => Prediction)) public predictions;  // matchId => user => prediction
mapping(uint256 => MatchAggregation) public aggregations;               // matchId => aggregation
```

### Functions
| Function | Access | Description |
|----------|--------|-------------|
| `constructor(address _matchOracle)` | — | Wire to MatchOracle |
| `commitPrediction(uint256 matchId, bytes32 hash)` | public | Commit hash while match is Upcoming |
| `revealPrediction(uint256 matchId, string winner, uint256 runs, bytes32 salt)` | public | Reveal after match is Completed |
| `getAggregatedResults(uint256 matchId)` | view | Return total reveals, predicted runs sum |

### Commit-Reveal Flow
```
COMMIT PHASE (match state == Upcoming):
  Frontend: salt = random bytes32
  Frontend: hash = keccak256(abi.encodePacked(winner, totalRuns, salt))
  User calls: commitPrediction(matchId, hash)

REVEAL PHASE (match state == Completed):
  User calls: revealPrediction(matchId, winner, totalRuns, salt)
  Contract: recompute = keccak256(abi.encodePacked(winner, totalRuns, salt))
  Contract: require(recompute == stored commitHash)
  Contract: update aggregation counters
```

### Events
```
PredictionCommitted(uint256 indexed matchId, address indexed predictor)
PredictionRevealed(uint256 indexed matchId, address indexed predictor, string winner, uint256 runs)
```

### Security Checks
- `commitPrediction()`: require match state == Upcoming, require user hasn't already committed
- `revealPrediction()`: require match state == Completed, require user has committed, require not already revealed, require hash matches

---

## 5. Contract #3: AnomalyTracker.sol (~160–200 lines)

**Purpose:** Community-governed anomaly flagging. Anyone can flag a completed match by staking WIRE. Community votes (stake-weighted). Upheld flags reduce the match's integrity score; rejected flags lose the flagger's stake.

### State Variables
```solidity
struct Flag {
    uint256 matchId;
    address flagger;
    string reason;
    uint256 stake;
    uint256 votesFor;
    uint256 votesAgainst;
    uint256 voterCount;
    bool resolved;
    bool upheld;
}

uint256 public flagCount;
uint256 public minFlagStake = 0.01 ether;  // 0.01 WIRE
uint256 public quorum = 3;

IMatchOracle public matchOracle;

mapping(uint256 => Flag) public flags;                              // flagId => Flag
mapping(uint256 => uint256) public integrityScores;                 // matchId => score (default 100)
mapping(uint256 => bool) public integrityInitialized;               // matchId => initialized
mapping(uint256 => mapping(address => bool)) public hasVoted;       // flagId => voter => voted
```

### Functions
| Function | Access | Description |
|----------|--------|-------------|
| `constructor(address _matchOracle)` | — | Wire to MatchOracle |
| `raiseFlag(uint256 matchId, string reason)` | payable | Flag a completed match, stake WIRE |
| `voteOnFlag(uint256 flagId, bool support)` | payable | Vote for/against a flag, stake-weighted |
| `resolveFlag(uint256 flagId)` | public | Resolve if quorum met |
| `getIntegrityScore(uint256 matchId)` | view | Returns score (100 minus deductions) |

### Resolution Logic
```
IF voterCount >= quorum:
  IF votesFor > votesAgainst:
    → Flag UPHELD
    → Return flagger's stake
    → Integrity score drops by 10
  ELSE:
    → Flag REJECTED
    → Slash flagger's stake (stays in contract)
```

### Events
```
FlagRaised(uint256 indexed flagId, uint256 indexed matchId, address indexed flagger, string reason)
VoteCast(uint256 indexed flagId, address indexed voter, bool support, uint256 weight)
FlagResolved(uint256 indexed flagId, bool upheld)
IntegrityScoreUpdated(uint256 indexed matchId, uint256 newScore)
```

### Security Checks
- `raiseFlag()`: require match state == Completed, require `msg.value >= minFlagStake`
- `voteOnFlag()`: require flag exists, not resolved, voter hasn't voted, `msg.value > 0`
- `resolveFlag()`: require not already resolved, require `voterCount >= quorum`

---

## 6. Deploy Script — `scripts/deploy.js`

```
1. Deploy MatchOracle
2. Deploy PredictionEngine(matchOracle.address)
3. Deploy AnomalyTracker(matchOracle.address)
4. Create 2 sample PSL matches:
   - Match 1: "Lahore Qalandars" vs "Islamabad United"
   - Match 2: "Karachi Kings" vs "Peshawar Zalmi"
5. Register deployer as reporter
6. Start Match 1, submit sample events, end Match 1
7. Print all contract addresses and tx hashes
```

---

## 7. Test Suite — `test/IntegrityShield.test.js`

### MatchOracle Tests
- should create a match
- should register reporter with correct stake
- should reject insufficient stake
- should submit events only during Live
- should enforce state transitions (Upcoming → Live → Completed)
- should slash reporter

### PredictionEngine Tests
- should accept commit before match (Upcoming state)
- should reject commit after match starts (Live/Completed)
- should validate reveal hash correctly
- should reject wrong salt
- should reject double commit
- should reject reveal before match completed

### AnomalyTracker Tests
- should raise flag with stake on completed match
- should reject flag on non-completed match
- should accept votes with stake
- should resolve upheld flag correctly (votesFor > votesAgainst)
- should slash rejected flag stake (votesAgainst >= votesFor)
- should update integrity score on upheld flag

---

## 8. Handoff Checklist (to Group B + Uzair)

After contracts compile:
- [ ] Share ABI JSON files from `artifacts/contracts/*.json`

After testnet deploy:
- [ ] Share 3 contract addresses
- [ ] Share all deployment tx hashes
- [ ] Share all sample interaction tx hashes
- [ ] Share gas report (`REPORT_GAS=true npx hardhat test`)

---

## 9. Commands Quick Reference

```bash
npx hardhat compile                                    # Compile
npx hardhat test                                       # Test
REPORT_GAS=true npx hardhat test                       # Gas report
npx hardhat run scripts/deploy.js --network wirefluid  # Deploy
npx hardhat verify --network wirefluid <ADDR> <ARGS>   # Verify
npx hardhat clean                                      # Clean
```
