import React, { useState, useCallback } from 'react';
import { FileText, ExternalLink, Search } from 'lucide-react';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import { NETWORK } from '../config/constants.js';

export default function AuditTrail({ contracts, matches }) {
  const [matchId, setMatchId] = useState('');
  const [events, setEvents] = useState([]);
  const [matchInfo, setMatchInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadTrail = useCallback(async () => {
    if (!contracts?.matchOracle || !matchId) return;
    setLoading(true);
    try {
      const m = await contracts.matchOracle.getMatch(matchId);
      if (Number(m[4]) === 0) { setMatchInfo(null); setEvents([]); setLoading(false); return; }

      const states = ['Upcoming', 'Live', 'Completed'];
      setMatchInfo({ team1: m[0], team2: m[1], state: states[Number(m[2])], eventCount: Number(m[3]) });

      const filter = contracts.matchOracle.filters.EventSubmitted(matchId);
      const evs = await contracts.matchOracle.queryFilter(filter, 0, 'latest');

      const formatted = [];
      for (const ev of evs) {
        const reporter = ev.args[1];
        const score = Number(await contracts.matchOracle.getReporterScore(reporter));
        let blockTime = '';
        try {
          const block = await ev.getBlock();
          blockTime = block ? new Date(block.timestamp * 1000).toLocaleString() : '';
        } catch (e) {}

        formatted.push({
          index: Number(ev.args[3]),
          hash: ev.args[2],
          reporter,
          reporterScore: score,
          txHash: ev.transactionHash,
          blockNumber: ev.blockNumber,
          time: blockTime,
        });
      }
      setEvents(formatted);
    } catch (e) {
      console.error('Error loading audit trail:', e);
    } finally {
      setLoading(false);
    }
  }, [contracts, matchId]);

  const selectClass = 'w-full px-3 py-2.5 rounded-xl text-sm text-[#ccd6f6] outline-none transition-colors appearance-none cursor-pointer';
  const inputStyle = { background: '#161616', border: '1px solid rgba(255,255,255,0.09)' };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-up">
      <h2 className="text-2xl font-black text-[#e6f1ff] mb-2">
        <span className="gradient-text">Audit Trail</span>
      </h2>
      <p className="text-sm text-[#8892b0] mb-8">Immutable on-chain event history. Every ball, every delivery, timestamped forever.</p>

      <div className="flex gap-3 mb-6">
        <select value={matchId} onChange={e => setMatchId(e.target.value)} className={selectClass} style={{ ...inputStyle, maxWidth: 300 }}>
          <option value="">Select a match...</option>
          {matches?.map(m => (
            <option key={m.id} value={m.id}>#{m.id} {m.team1} vs {m.team2}</option>
          ))}
        </select>
        <Button onClick={loadTrail} disabled={!matchId} loading={loading} icon={Search} className="text-xs shrink-0">
          Load Events
        </Button>
      </div>

      {matchInfo && (
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-black text-[#e6f1ff]">{matchInfo.team1} vs {matchInfo.team2}</p>
              <p className="text-xs text-[#8892b0] mt-1">State: {matchInfo.state} | Events on-chain: {matchInfo.eventCount}</p>
            </div>
            <Badge variant={matchInfo.state === 'Completed' ? 'neutral' : matchInfo.state === 'Live' ? 'red' : 'blue'}>
              {matchInfo.state}
            </Badge>
          </div>
        </Card>
      )}

      {events.length > 0 ? (
        <div className="relative ml-4">
          {/* Timeline line */}
          <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: 'rgba(255,255,255,0.07)' }} />

          {events.map((ev, i) => {
            const trustClass = ev.reporterScore >= 80 ? 'green' : ev.reporterScore >= 50 ? 'yellow' : 'red';
            const trustLabel = ev.reporterScore >= 80 ? 'Trusted' : ev.reporterScore >= 50 ? 'Moderate' : 'Low';
            return (
              <div key={i} className="relative pl-8 pb-5">
                {/* Dot */}
                <div className="absolute left-[-5px] top-4 w-3 h-3 rounded-full border-2 border-black" style={{ background: '#00e676' }} />

                <div className="p-4 rounded-xl" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-[#ccd6f6]">Event #{ev.index}</span>
                    <Badge variant={trustClass}>{trustLabel} ({ev.reporterScore})</Badge>
                  </div>
                  <p className="text-xs font-mono text-[#06b6d4] break-all mb-2">{ev.hash}</p>
                  <div className="flex items-center gap-4 text-[10px] text-[#8892b0] flex-wrap">
                    <span>Reporter: <span className="font-mono text-[#06b6d4]">{ev.reporter.slice(0, 6)}...{ev.reporter.slice(-4)}</span></span>
                    <span>Block: {ev.blockNumber}</span>
                    {ev.time && <span>{ev.time}</span>}
                    <a href={`${NETWORK.explorer}/tx/${ev.txHash}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#06b6d4] hover:text-[#00e676] transition-colors">
                      <ExternalLink className="w-3 h-3" /> Explorer
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : matchInfo ? (
        <div className="text-center py-12 text-[#8892b0]">
          <FileText className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No events recorded for this match yet.</p>
        </div>
      ) : null}
    </div>
  );
}
