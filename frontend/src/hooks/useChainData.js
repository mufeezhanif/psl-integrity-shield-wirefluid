import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';

export default function useChainData(contracts) {
  const [matches, setMatches] = useState([]);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seasonStats, setSeasonStats] = useState({ matches: 0, avgScore: 0, flags: 0, predictions: 0, certified: 0 });
  const lastFetchRef = useRef(0);

  const loadData = useCallback(async () => {
    if (!contracts?.matchOracle) return;

    // Throttle: skip if called within 3 seconds
    const now = Date.now();
    if (now - lastFetchRef.current < 3000 && matches.length > 0) return;
    lastFetchRef.current = now;

    setLoading(true);
    try {
      const { matchOracle, anomalyTracker, predictionEngine } = contracts;

      // Batch: fetch counts in parallel
      const [count, flagTotal] = await Promise.all([
        matchOracle.matchCount().then(Number),
        anomalyTracker.flagCount().then(Number),
      ]);

      // Batch: fetch all match data in parallel
      const matchIds = [];
      for (let i = 1; i <= count + 5; i++) matchIds.push(i);

      const matchResults = await Promise.all(
        matchIds.map(async (i) => {
          try {
            const m = await matchOracle.getMatch(i);
            if (Number(m[4]) === 0) return null;
            return { id: i, raw: m };
          } catch { return null; }
        })
      );

      const validMatches = matchResults.filter(Boolean);

      // Batch: fetch integrity/cert/div/agg for all valid matches in parallel
      const enriched = await Promise.all(
        validMatches.map(async ({ id, raw }) => {
          const [score, certified, divChecked, agg] = await Promise.all([
            anomalyTracker.getIntegrityScore(id).then(Number),
            anomalyTracker.isMatchCertified(id),
            predictionEngine.divergenceChecked(id),
            predictionEngine.getAggregatedResults(id),
          ]);
          const divScore = divChecked ? Number(await predictionEngine.getDivergenceScore(id)) : null;
          const stateNum = Number(raw[2]);
          const statusNames = ['Upcoming', 'Live', 'Completed'];
          return {
            id, team1: raw[0], team2: raw[1], status: statusNames[stateNum],
            score, events: Number(raw[3]),
            time: new Date(Number(raw[4]) * 1000).toLocaleDateString(),
            flagCount: 0, certified, divergenceScore: divScore,
            totalCommits: Number(agg[0]),
          };
        })
      );

      // Batch: fetch all flags in parallel
      const flagIds = [];
      for (let i = 1; i <= flagTotal; i++) flagIds.push(i);

      const flagList = (await Promise.all(
        flagIds.map(async (i) => {
          try {
            const f = await anomalyTracker.getFlag(i);
            const matchId = Number(f[0]);
            const match = enriched.find(m => m.id === matchId);
            if (match) match.flagCount = (match.flagCount || 0) + 1;
            return {
              id: i, matchId, description: f[2],
              stakeWire: ethers.formatEther(f[3]),
              upvotes: Number(f[4]), downvotes: Number(f[5]),
              voterCount: Number(f[6]),
              reporter: `${f[1].slice(0, 6)}...${f[1].slice(-4)}`,
              reporterFull: f[1],
              status: f[7] ? (f[8] ? 'Upheld' : 'Rejected') : 'Open',
              resolved: f[7], upheld: f[8],
            };
          } catch { return null; }
        })
      )).filter(Boolean);

      // Compute season stats
      let totalScore = 0, certCount = 0, totalPred = 0;
      for (const m of enriched) {
        totalScore += m.score;
        if (m.certified) certCount++;
        totalPred += m.totalCommits;
      }

      setMatches(enriched);
      setFlags(flagList);
      setSeasonStats({
        matches: enriched.length,
        avgScore: enriched.length > 0 ? (totalScore / enriched.length).toFixed(1) : 0,
        flags: flagTotal,
        predictions: totalPred,
        certified: certCount,
      });
    } catch (e) {
      console.error('Error loading chain data:', e);
    } finally {
      setLoading(false);
    }
  }, [contracts]);

  useEffect(() => { loadData(); }, [loadData]);

  return { matches, flags, loading, seasonStats, refresh: loadData };
}
