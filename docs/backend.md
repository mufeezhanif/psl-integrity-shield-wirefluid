# Backend — PSL Integrity Shield

## Deployed Contracts (WireFluid Testnet · Chain 92533)

| Contract | Address | Deploy Tx |
|----------|---------|-----------|
| MatchOracle | `0x7b457E75Ad7AB2331FCDdeC5f0a80d33a6e34771` | `0xf6414720b37477df823e3a8b234c32d771f69ae87fc86f161a9255651fc35352` |
| PredictionEngine | `0xa97094e559e2570A37045542fed7A1Ff03763E87` | `0xebc4410cb12aad290c8da62b4124b8a3a99190490254a813906fddf87a8bc45d` |
| AnomalyTracker | `0x1570200C79D6245ba77797541e4fab90bCfDAC34` | `0x58364af528e1929e086a1de9a8349d75b650939c7552af783f2f0a61207a6f0a` |

## Architecture

Three interlocking contracts — each serves a distinct role:

```
MatchOracle ──────► PredictionEngine
     │                    (reads match state)
     └──────────────► AnomalyTracker
                          (reads match state)
```

## Contract Summary

### MatchOracle.sol (~170 lines)
Immutable event ledger. Admin creates PSL matches, reporters stake 0.01 WIRE to register, then submit ball-by-ball event hashes during live matches.

**Key functions:** `createMatch()`, `registerReporter()`, `submitEvent()`, `startMatch()`, `endMatch()`, `slashReporter()`

**State machine:** Upcoming → Live → Completed

**Security:** OpenZeppelin Ownable + ReentrancyGuard. Reporters can be slashed for misconduct.

### PredictionEngine.sol (~160 lines)
Commit-reveal crowd intelligence. Fans commit hashed predictions before matches, reveal after completion. Hash validation prevents tampering.

**Key functions:** `commitPrediction()`, `revealPrediction()`, `getAggregatedResults()`, `getWinnerVotes()`

**Crypto:** `keccak256(abi.encodePacked(winner, runs, salt))` — commit-reveal scheme

### AnomalyTracker.sol (~200 lines)
Community-governed flagging. Anyone stakes WIRE to flag a completed match. Community votes (stake-weighted). Upheld flags drop integrity score by 10; rejected flags slash the flagger.

**Key functions:** `raiseFlag()`, `voteOnFlag()`, `resolveFlag()`, `getIntegrityScore()`

**Governance:** Quorum of 3 votes required. Score starts at 100.

## Test Results — 32/32 Passing

```
MatchOracle (11 tests)
  ✔ create match, reject duplicates, reject empty names
  ✔ owner-only access control
  ✔ reporter registration + stake validation
  ✔ event submission only during Live state
  ✔ state machine transitions enforced
  ✔ reporter slashing

PredictionEngine (9 tests)
  ✔ commit before match, reject after start
  ✔ reject double commit, empty hash
  ✔ reveal hash validation + wrong salt rejection
  ✔ reject reveal before completed, double reveal
  ✔ winner vote tracking across users

AnomalyTracker (12 tests)
  ✔ flag with stake, reject non-completed/insufficient/empty
  ✔ vote with stake, prevent double voting + flagger voting
  ✔ upheld flag: stake returned, score drops
  ✔ rejected flag: stake slashed, score unchanged
  ✔ quorum enforcement, cumulative score drops
```

## Gas Usage

| Contract | Method | Avg Gas |
|----------|--------|---------|
| MatchOracle | createMatch | 121,669 |
| MatchOracle | registerReporter | 71,888 |
| MatchOracle | submitEvent | 75,378 |
| MatchOracle | startMatch | 49,404 |
| MatchOracle | endMatch | 32,296 |
| PredictionEngine | commitPrediction | 101,209 |
| PredictionEngine | revealPrediction | 187,115 |
| AnomalyTracker | raiseFlag | 196,968 |
| AnomalyTracker | voteOnFlag | 104,805 |
| AnomalyTracker | resolveFlag | 74,997 |

At WireFluid's ~$0.01/tx, all operations cost fractions of a cent.

## Sample Tx Hashes (on testnet)

| Action | Tx Hash |
|--------|---------|
| Match 1: LQ vs IU | `0xeac2c2e0f4dfa98e112720b6882e179600863aa31d2456d2feb93420b11a1fad` |
| Match 2: KK vs PZ | `0x56b877e8cbe5c08273be1f9d0409a61d62ac62bf0a9e6ad9afb0c5eda4733696` |
| Match 3: MS vs QG | `0xa152486f402b1d65b7983b87ad47ef6bdf57b0cd86871dd1c91dcee9603138fa` |
| Reporter registered | `0x802db02a13a5535a7878eb1ba5f811bcb45016d524afbdc2a99aa4c252d31337` |
| Match 1 started | `0xd4050b5c037cbf54a081bf8077097412835fa96b16d179b0eeaa4e4b478ee05e` |
| Event 1 submitted | `0x0c232939d347d39a47d91b0437909e4117f6fd93b589fe5e61564a365262325e` |
| Event 2 submitted | `0x37a2baef15ebc8629919a6be6eb1932acc7b87850dd26d5b373e08aa741da795` |
| Event 3 submitted | `0xac799ef8cf5f9fc73ad66be0629bf1bf9033c3954d9c5108806ea8adfb1f9474` |
| Match 1 ended | `0xf7faef5bdbf953a8d4700c4e538ee4712173bcceb650fa7fff0cad89c238c53c` |

## Commands

```bash
npx hardhat compile                                    # Compile
npx hardhat test                                       # Test (32/32)
REPORT_GAS=true npx hardhat test                       # Gas report
npx hardhat run scripts/deploy.js --network wirefluid  # Deploy
```
