# PSL Integrity Shield — Loom Demo Script

> **Target Duration:** 4–5 minutes
> **Format:** Screen recording with voiceover

---

## 1. INTRO (30 seconds)

**Show:** GitHub README page

**Say:**
> "Hey — this is PSL Integrity Shield, an on-chain anti-match-fixing protocol for the Pakistan Super League, built on WireFluid Testnet for the Entangled Hackathon 2026."
>
> "The problem is simple: match-fixing in cricket is real, but current integrity systems are opaque, centralized, and erasable. Our solution uses three interlocking smart contracts to make match integrity transparent, immutable, and community-governed."

---

## 2. SMART CONTRACTS (60 seconds)

**Show:** Open each `.sol` file briefly, then switch to WireFluidScan showing deployed addresses

**Say:**
> "We have three contracts deployed on WireFluid."
>
> "First — MatchOracle. This is the immutable event ledger. Staked reporters submit ball-by-ball event hashes during live matches. It enforces a state machine — Upcoming, Live, Completed — so events can only be submitted during live matches. We use OpenZeppelin Ownable, ReentrancyGuard, and Pausable."
>
> "Second — PredictionEngine. This uses a commit-reveal scheme. Fans hash their prediction with a random salt before the match, then reveal after. The contract validates the hash on-chain so nobody can change their prediction after the fact. It also computes crowd divergence — if 70% of predictors got it wrong, that's a statistical red flag."
>
> "Third — AnomalyTracker. Community members can flag suspicious matches by staking WIRE. Others vote with their own stakes. Once quorum is reached, the flag resolves. If upheld, the flagger gets their stake back and the match integrity score drops. If rejected, the flagger's stake is slashed. Matches with score 90+ can be certified clean on-chain."
>
> "All three use ReentrancyGuard and Pausable for security, and have fund withdrawal mechanisms so nothing gets locked."

**Action:** Click on deployed contract address on WireFluidScan to show it's real

---

## 3. TESTS (30 seconds)

**Show:** Terminal running `npx hardhat test`

**Say:**
> "38 out of 38 tests passing. We test match creation, state transitions, reporter staking and slashing, commit-reveal validation, flag raising, quorum voting, integrity score calculations, pause/unpause, and fund withdrawals."

**Action:** Run `npx hardhat test` — show the green checkmarks

---

## 4. LIVE DEMO — FRONTEND (90 seconds)

**Show:** Open https://psl-integrity-shield.vercel.app

**Say:**
> "Here's the live frontend, deployed on Vercel, connected to the WireFluid contracts."

**Action:** Click "Connect Wallet" — show MetaMask popup, auto-switch to WireFluid Testnet

> "MetaMask auto-switches to WireFluid Testnet. You can see 3 matches already on the dashboard — Lahore Qalandars vs Islamabad United, Karachi Kings vs Peshawar Zalmi, Multan Sultans vs Quetta Gladiators. These were seeded during deployment."

**Action:** Click on the completed match card

> "Each match shows its integrity score as a visual ring, plus the event count and flag count."

**Action:** Navigate to "Predictions" tab

> "The Predictions page lets you commit a prediction before a match starts. Pick a match, select the winner, enter predicted total runs. A random salt is auto-generated and saved to your browser. After the match ends, you reveal using the same values and the salt is auto-filled."

**Action:** Navigate to "Reporters" tab

> "Reporters stake 0.01 WIRE to register. You can see trust scores — starting at 100, going up with each event submitted, dropping by 50 if you get slashed."

**Action:** Navigate to "Season Report" tab

> "The Season Dashboard aggregates all match integrity scores. Total matches monitored, average integrity, total flags, total predictions, certified clean matches. Each match has a color-coded bar — green is clean, yellow is suspicious, red is flagged."

**Action:** Navigate to "Leaderboard" tab

> "The Leaderboard ranks predictors by accuracy — who predicted the most matches correctly."

**Action:** Navigate to "Audit Trail" tab — select Match 1

> "And the Audit Trail shows the immutable event log — every ball-by-ball event hash submitted by reporters, with timestamps and block numbers, all linked to WireFluidScan."

---

## 5. TRANSACTION PROOF (20 seconds)

**Show:** WireFluidScan with one of the deployment tx hashes

**Say:**
> "Everything is verifiable on WireFluidScan. Here's the MatchOracle deployment transaction. And here are the sample match creation and event submission transactions — all on-chain, all permanent."

---

## 6. CLOSE (20 seconds)

**Show:** GitHub repo

**Say:**
> "PSL Integrity Shield — three contracts, 38 tests, six frontend views, deployed on WireFluid, live on Vercel. Real-world impact for cricket integrity, built entirely on-chain. Thanks for watching."

---

## Key Points to Hit

- [ ] Show all 3 contracts deployed on WireFluidScan
- [ ] Show 38/38 tests passing in terminal
- [ ] Show MetaMask wallet connection + network auto-switch
- [ ] Show at least 3 frontend views (Dashboard, Predictions, Season Report)
- [ ] Show a transaction on WireFluidScan explorer
- [ ] Mention: OpenZeppelin (Ownable + ReentrancyGuard + Pausable)
- [ ] Mention: commit-reveal cryptography
- [ ] Mention: stake-weighted governance
- [ ] Mention: no locked funds (withdrawal mechanisms)
- [ ] Mention: Promise.all RPC batching, toast notifications

## Links to Have Open

1. https://psl-integrity-shield.vercel.app
2. https://scan.wirefluid.com/address/0x787fbf712fc3BAEa7Bc2eC7cd9b7486A3332dbcE
3. https://scan.wirefluid.com/tx/0x9eb67dac20fb9c421fbb568dc00219d495e811fbcabea7a2fa887db9177af1f3
4. GitHub repo: https://github.com/mufeezhanif/wirefluid-hackathon
5. Terminal with `cd backend && npx hardhat test` ready to run
