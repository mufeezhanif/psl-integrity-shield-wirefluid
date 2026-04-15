import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

export default function useChainData(contracts) {
  const [matches, setMatches] = useState([]);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seasonStats, setSeasonStats] = useState({ matches: 0, avgScore: 0, flags: 0, predictions: 0, certified: 0 });

  const loadData = useCallback(async () => {
    if (!contracts?.matchOracle) return;
    setLoading(true);
    try {
      const { matchOracle, anomalyTracker, predictionEngine } = contracts;
      const count = Number(await matchOracle.matchCount());
      const flagTotal = Number(await anomalyTracker.flagCount());

      // Load matches
      const matchList = [];
      let totalScore = 0, certCount = 0, totalPred = 0;

      for (let i = 1; i <= count + 5; i++) {
        try {
          const m = await matchOracle.getMatch(i);
          if (Number(m[4]) === 0) continue;
          const score = Number(await anomalyTracker.getIntegrityScore(i));
          const certified = await anomalyTracker.isMatchCertified(i);
          const divChecked = await predictionEngine.divergenceChecked(i);
          const divScore = divChecked ? Number(await predictionEngine.getDivergenceScore(i)) : null;
          const agg = await predictionEngine.getAggregatedResults(i);

          totalScore += score;
          if (certified) certCount++;
          totalPred += Number(agg[0]);

          const stateNum = Number(m[2]);
          const statusNames = ['Upcoming', 'Live', 'Completed'];

          matchList.push({
            id: i,
            team1: m[0],
            team2: m[1],
            status: statusNames[stateNum],
            score,
            events: Number(m[3]),
            time: new Date(Number(m[4]) * 1000).toLocaleDateString(),
            flagCount: 0,
            certified,
            divergenceScore: divScore,
          });
        } catch (e) { /* skip invalid */ }
      }

      // Load flags
      const flagList = [];
      for (let i = 1; i <= flagTotal; i++) {
        try {
          const f = await anomalyTracker.getFlag(i);
          const matchId = Number(f[0]);
          // Count flags per match
          const match = matchList.find(m => m.id === matchId);
          if (match) match.flagCount = (match.flagCount || 0) + 1;

          flagList.push({
            id: i,
            matchId,
            description: f[2],
            stakeWire: ethers.formatEther(f[3]),
            upvotes: Number(f[4]),
            downvotes: Number(f[5]),
            voterCount: Number(f[6]),
            reporter: `${f[1].slice(0, 6)}...${f[1].slice(-4)}`,
            reporterFull: f[1],
            status: f[7] ? (f[8] ? 'Upheld' : 'Rejected') : 'Open',
            resolved: f[7],
            upheld: f[8],
          });
        } catch (e) { /* skip */ }
      }

      setMatches(matchList);
      setFlags(flagList);
      setSeasonStats({
        matches: matchList.length,
        avgScore: matchList.length > 0 ? (totalScore / matchList.length).toFixed(1) : 0,
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
