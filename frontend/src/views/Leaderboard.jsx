import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';

const MEDALS = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];

export default function Leaderboard({ contracts }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!contracts?.predictionEngine) return;
      setLoading(true);
      try {
        const filter = contracts.predictionEngine.filters.PredictionRevealed();
        const events = await contracts.predictionEngine.queryFilter(filter, 0, 'latest');

        const stats = {};
        for (const ev of events) {
          const addr = ev.args[1];
          if (!stats[addr]) stats[addr] = { total: 0, matches: new Set() };
          stats[addr].total++;
          stats[addr].matches.add(Number(ev.args[0]));
        }

        const sorted = Object.entries(stats)
          .map(([addr, s]) => ({ address: addr, predictions: s.total, matchCount: s.matches.size }))
          .sort((a, b) => b.predictions - a.predictions)
          .slice(0, 10);

        setLeaders(sorted);
      } catch (e) {
        console.error('Error loading leaderboard:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [contracts]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-up">
      <h2 className="text-2xl font-black text-[#e6f1ff] mb-2">
        <span className="gradient-text-gold">Prediction Leaderboard</span>
      </h2>
      <p className="text-sm text-[#8892b0] mb-8">Top predictors ranked by participation across all matches.</p>

      <Card>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#ffd60a] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-12 text-[#8892b0]">
            <Trophy className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No predictions revealed yet. Be the first!</p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div className="grid grid-cols-4 gap-4 px-4 py-2 text-[10px] text-[#8892b0] font-bold uppercase tracking-wider border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <span>Rank</span>
              <span>Address</span>
              <span>Predictions</span>
              <span>Matches</span>
            </div>
            {leaders.map((l, i) => (
              <div key={l.address} className="grid grid-cols-4 gap-4 px-4 py-3 items-center transition-colors hover:bg-white/[0.02]" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-lg">
                  {i < 3 ? MEDALS[i] : <span className="text-sm text-[#8892b0] font-bold">{i + 1}</span>}
                </span>
                <span className="font-mono text-sm text-[#06b6d4]">
                  {l.address.slice(0, 6)}...{l.address.slice(-4)}
                </span>
                <span className="text-sm font-bold text-[#ccd6f6]">{l.predictions}</span>
                <span>
                  <Badge variant="purple">{l.matchCount} match{l.matchCount !== 1 ? 'es' : ''}</Badge>
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
