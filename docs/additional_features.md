# Additional Features — Future Enhancements

> These features are designed to be added AFTER the core 3-contract system is working.
> Each is low-effort (10–15 lines in contracts or frontend-only) but creates major differentiation for judges.

---

## Feature 1: Live PSL Data Integration (cricketdata.org)

**Type:** Frontend-only (zero contract changes)
**Effort:** ~30 min
**Impact on Judging:** High (Real-World Impact + UI/UX)

Frontend auto-populates match cards with real PSL 2026 fixtures from cricketdata.org API:
- Real team names (Lahore Qalandars vs Islamabad United)
- Real match schedules and scores
- Real player stats alongside predictions

This proves "real-world utility" isn't cosmetic theming — actual PSL data flows through the dApp. During demo, judges see real ongoing PSL matches, not placeholder "Team A vs Team B."

### Implementation
```js
// In frontend index.html
async function fetchPSLData() {
  const res = await fetch('https://api.cricketdata.org/v1/matches?apikey=YOUR_KEY&type=t20&league=psl');
  const data = await res.json();
  // Populate dashboard match cards with real fixtures
}
```

---

## Feature 2: Crowd Divergence Index (Auto-Anomaly Detection)

**Type:** ~15 lines in PredictionEngine.sol + frontend badge
**Effort:** ~20 min
**Impact on Judging:** High (Smart Contract Evaluation — algorithmic sophistication)

After predictions are revealed, PredictionEngine computes how far the actual result deviated from crowd consensus.

### Contract Addition (PredictionEngine.sol)
```solidity
event HighDivergenceDetected(uint256 indexed matchId, uint256 divergenceScore);

function checkDivergence(uint256 matchId, string memory actualWinner) external {
    MatchAggregation storage agg = aggregations[matchId];
    require(agg.totalReveals > 0, "No reveals");

    uint256 winnerVotes = agg.winnerVotes[actualWinner];
    uint256 divergence = 100 - ((winnerVotes * 100) / agg.totalReveals);

    if (divergence > 70) {
        emit HighDivergenceDetected(matchId, divergence);
    }
}
```

### Frontend Addition
- Show "Statistical Alert" badge (orange warning icon) on match cards when `HighDivergenceDetected` event exists
- Tooltip: "70%+ of the crowd predicted a different winner"

---

## Feature 3: Season-Level Integrity Dashboard

**Type:** Frontend-only (zero contract changes)
**Effort:** ~45 min
**Impact on Judging:** High (UI/UX + Real-World Impact)

Aggregate ALL match integrity scores into a "PSL Season Integrity Report":
- Total matches monitored
- Average integrity score across all matches
- Total flags raised / resolved
- Total predictions committed / revealed
- Total active reporters

### Frontend Implementation
```js
async function loadSeasonDashboard() {
  const matchCount = await matchOracle.matchCount();
  let totalScore = 0, flagged = 0;

  for (let i = 1; i <= matchCount; i++) {
    const score = await anomalyTracker.getIntegrityScore(i);
    totalScore += score;
    if (score < 100) flagged++;
  }

  document.getElementById('avg-score').textContent = (totalScore / matchCount).toFixed(1);
  document.getElementById('flagged-count').textContent = flagged;
  // Render horizontal bar chart with color-coded scores
}
```

Visual: horizontal bar chart of all match integrity scores, color-coded (green ≥80, yellow 50–79, red <50).

---

## Feature 4: Prediction Accuracy Leaderboard

**Type:** Frontend-only (zero contract changes)
**Effort:** ~30 min
**Impact on Judging:** Medium (UI/UX — engagement/gamification)

Track who makes the most accurate predictions across matches:
- Read `PredictionRevealed` events from all matches
- Compare revealed predictions to actual match results (from MatchOracle events)
- Rank users by accuracy percentage
- Display leaderboard: truncated wallet addresses + accuracy % + total predictions

### Frontend Implementation
```js
async function buildLeaderboard() {
  const filter = predictionEngine.filters.PredictionRevealed();
  const events = await predictionEngine.queryFilter(filter);

  const userStats = {};
  for (const event of events) {
    const { predictor, winner, runs } = event.args;
    // Compare against actual result, track correct/total per user
  }
  // Sort by accuracy, render top 10
}
```

---

## Feature 5: Reporter Trust Score

**Type:** ~10 lines added to MatchOracle.sol + frontend badge
**Effort:** ~15 min
**Impact on Judging:** Medium (Smart Contract Evaluation — multi-dimensional staking)

### Contract Addition (MatchOracle.sol)
```solidity
mapping(address => uint256) public reporterScores;  // starts at 100

function _updateReporterScore(address reporter, int256 delta) internal {
    int256 current = int256(reporterScores[reporter]);
    int256 newScore = current + delta;
    if (newScore < 0) newScore = 0;
    if (newScore > 200) newScore = 200;
    reporterScores[reporter] = uint256(newScore);
}
```

- On `registerReporter()`: set `reporterScores[msg.sender] = 100`
- On `submitEvent()`: `_updateReporterScore(msg.sender, 1)` (reward for participation)
- On `slashReporter()`: `_updateReporterScore(reporter, -50)` (heavy penalty)

### Frontend Addition
- Show trust badge next to reporter addresses: green (≥80), yellow (50–79), red (<50)

---

## Feature 6: Clean Match Certificate

**Type:** ~10 lines in AnomalyTracker.sol + frontend stamp
**Effort:** ~15 min
**Impact on Judging:** High (Real-World Impact — positive output, not just catching bad matches)

### Contract Addition (AnomalyTracker.sol)
```solidity
event CleanMatchCertified(uint256 indexed matchId, uint256 finalScore, uint256 predictionCount);

mapping(uint256 => bool) public certifiedClean;

function certifyMatch(uint256 matchId) external {
    require(matchOracle.getMatchState(matchId) == IMatchOracle.MatchState.Completed, "Not completed");
    require(!certifiedClean[matchId], "Already certified");

    uint256 score = getIntegrityScore(matchId);
    require(score >= 90, "Score too low");

    certifiedClean[matchId] = true;
    emit CleanMatchCertified(matchId, score, /* predictionCount from PredictionEngine */);
}
```

### Frontend Addition
- When a match has `CleanMatchCertified` event, show a prominent green "CERTIFIED CLEAN" stamp on the match card
- This on-chain event is verifiable on WireFluidScan — proof that the community certified the match

---

## Priority Order for Implementation

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 1 | Feature 3: Season Dashboard | 45 min | High |
| 2 | Feature 2: Divergence Index | 20 min | High |
| 3 | Feature 6: Clean Certificate | 15 min | High |
| 4 | Feature 1: Live PSL Data | 30 min | High |
| 5 | Feature 5: Reporter Trust Score | 15 min | Medium |
| 6 | Feature 4: Leaderboard | 30 min | Medium |

Features 3, 4, and 1 are frontend-only — zero risk to contracts.
Features 2, 5, and 6 add ~35 total lines to existing contracts — minimal risk.
