import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Lock, Send, Eye, Hash, Copy, CheckCircle2 } from 'lucide-react';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';

// Salt localStorage helpers
function saveSalt(matchId, salt) {
  const salts = JSON.parse(localStorage.getItem('psl_salts') || '{}');
  salts[matchId] = salt;
  localStorage.setItem('psl_salts', JSON.stringify(salts));
}
function getSalt(matchId) {
  const salts = JSON.parse(localStorage.getItem('psl_salts') || '{}');
  return salts[matchId] || '';
}

export default function Predictions({ contracts, wallet, matches }) {
  const [commitMatchId, setCommitMatchId] = useState('');
  const [commitWinner, setCommitWinner] = useState('');
  const [commitRuns, setCommitRuns] = useState('');
  const [savedSalt, setSavedSalt] = useState('');
  const [commitLoading, setCommitLoading] = useState(false);
  const [saltCopied, setSaltCopied] = useState(false);

  const [revealMatchId, setRevealMatchId] = useState('');
  const [revealWinner, setRevealWinner] = useState('');
  const [revealRuns, setRevealRuns] = useState('');
  const [revealSalt, setRevealSalt] = useState('');
  const [revealLoading, setRevealLoading] = useState(false);

  const [status, setStatus] = useState('');

  // Auto-fill salt from localStorage when reveal matchId changes
  useEffect(() => {
    if (revealMatchId) {
      const stored = getSalt(revealMatchId);
      if (stored) setRevealSalt(stored);
    }
  }, [revealMatchId]);

  // Get teams for selected commit match
  const commitMatch = matches?.find(m => m.id === Number(commitMatchId));
  const revealMatch = matches?.find(m => m.id === Number(revealMatchId));

  // Upcoming matches for commit, completed for reveal
  const upcomingMatches = matches?.filter(m => m.status === 'Upcoming') || [];
  const completedMatches = matches?.filter(m => m.status === 'Completed') || [];

  async function handleCommit() {
    if (!commitMatchId || !commitWinner || !commitRuns) return;
    setCommitLoading(true);
    setStatus('');
    try {
      const salt = ethers.randomBytes(32);
      const saltHex = ethers.hexlify(salt);
      const hash = ethers.keccak256(ethers.solidityPacked(['string', 'uint256', 'bytes32'], [commitWinner, commitRuns, saltHex]));
      const tx = await contracts.predictionEngine.commitPrediction(commitMatchId, hash);
      await tx.wait();
      setSavedSalt(saltHex);
      saveSalt(commitMatchId, saltHex);
      setStatus('Committed! Salt saved to browser storage.');
    } catch (e) {
      setStatus('Error: ' + (e.reason || e.message));
    } finally {
      setCommitLoading(false);
    }
  }

  async function handleReveal() {
    if (!revealMatchId || !revealWinner || !revealRuns || !revealSalt) return;
    setRevealLoading(true);
    setStatus('');
    try {
      const tx = await contracts.predictionEngine.revealPrediction(revealMatchId, revealWinner, revealRuns, revealSalt);
      await tx.wait();
      setStatus('Prediction revealed successfully!');
    } catch (e) {
      setStatus('Error: ' + (e.reason || e.message));
    } finally {
      setRevealLoading(false);
    }
  }

  function copySalt() {
    navigator.clipboard.writeText(savedSalt);
    setSaltCopied(true);
    setTimeout(() => setSaltCopied(false), 2000);
  }

  const inputClass = 'w-full px-3 py-2.5 rounded-xl text-sm text-[#ccd6f6] placeholder-[#8892b0]/50 outline-none transition-colors';
  const inputStyle = { background: '#161616', border: '1px solid rgba(255,255,255,0.09)' };
  const selectClass = 'w-full px-3 py-2.5 rounded-xl text-sm text-[#ccd6f6] outline-none transition-colors appearance-none cursor-pointer';

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-up">
      <h2 className="text-2xl font-black text-[#e6f1ff] mb-2">
        <span className="gradient-text">Crowd Predictions</span>
      </h2>
      <p className="text-sm text-[#8892b0] mb-8">Commit-reveal system. Predict before the match, reveal after. No cap, no backsies.</p>

      {!wallet && (
        <div className="flex items-center gap-2 text-[#8892b0] text-sm mb-6 p-4 rounded-xl" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Lock className="w-4 h-4" /> Connect wallet to make predictions.
        </div>
      )}

      {/* Commit */}
      <Card className="mb-5">
        <h3 className="font-bold text-[#ccd6f6] flex items-center gap-2 text-sm uppercase tracking-wider mb-4">
          <Hash className="w-4 h-4 text-[#00e676]" /> Commit Prediction
        </h3>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-[10px] text-[#8892b0] font-bold uppercase tracking-wider block mb-1">Match</label>
            <select value={commitMatchId} onChange={e => { setCommitMatchId(e.target.value); setCommitWinner(''); }} className={selectClass} style={inputStyle}>
              <option value="">Select match...</option>
              {upcomingMatches.map(m => (
                <option key={m.id} value={m.id}>{m.team1} vs {m.team2}</option>
              ))}
              {/* Also show all matches in case data is stale */}
              {upcomingMatches.length === 0 && matches?.map(m => (
                <option key={m.id} value={m.id}>#{m.id} {m.team1} vs {m.team2}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-[#8892b0] font-bold uppercase tracking-wider block mb-1">Winner</label>
            {commitMatch ? (
              <select value={commitWinner} onChange={e => setCommitWinner(e.target.value)} className={selectClass} style={inputStyle}>
                <option value="">Pick winner...</option>
                <option value={commitMatch.team1}>{commitMatch.team1}</option>
                <option value={commitMatch.team2}>{commitMatch.team2}</option>
              </select>
            ) : (
              <input type="text" value={commitWinner} onChange={e => setCommitWinner(e.target.value)} placeholder="Select match first" className={inputClass} style={inputStyle} />
            )}
          </div>
          <div>
            <label className="text-[10px] text-[#8892b0] font-bold uppercase tracking-wider block mb-1">Total Runs</label>
            <input type="number" value={commitRuns} onChange={e => setCommitRuns(e.target.value)} placeholder="180" className={inputClass} style={inputStyle} />
          </div>
        </div>
        <Button onClick={handleCommit} loading={commitLoading} disabled={!wallet || !commitMatchId || !commitWinner || !commitRuns} icon={Send} className="text-xs">
          Commit Prediction
        </Button>
        <p className="text-[10px] text-[#8892b0] mt-2">Salt is auto-generated and saved to your browser. Keep it safe!</p>

        {savedSalt && (
          <div className="mt-3 p-3 rounded-xl" style={{ background: '#161616', border: '1px solid rgba(0,230,118,0.2)' }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-[#00e676] font-bold uppercase tracking-wider">Your Salt (auto-saved)</p>
              <button onClick={copySalt} className="text-[#8892b0] hover:text-[#00e676] transition-colors">
                {saltCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-[#00e676]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-xs font-mono text-[#00e676] break-all select-all">{savedSalt}</p>
          </div>
        )}
      </Card>

      {/* Reveal */}
      <Card className="mb-5">
        <h3 className="font-bold text-[#ccd6f6] flex items-center gap-2 text-sm uppercase tracking-wider mb-4">
          <Eye className="w-4 h-4 text-[#ffd60a]" /> Reveal Prediction
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[10px] text-[#8892b0] font-bold uppercase tracking-wider block mb-1">Match</label>
            <select value={revealMatchId} onChange={e => { setRevealMatchId(e.target.value); setRevealWinner(''); }} className={selectClass} style={inputStyle}>
              <option value="">Select match...</option>
              {completedMatches.map(m => (
                <option key={m.id} value={m.id}>{m.team1} vs {m.team2}</option>
              ))}
              {completedMatches.length === 0 && matches?.map(m => (
                <option key={m.id} value={m.id}>#{m.id} {m.team1} vs {m.team2}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-[#8892b0] font-bold uppercase tracking-wider block mb-1">Winner</label>
            {revealMatch ? (
              <select value={revealWinner} onChange={e => setRevealWinner(e.target.value)} className={selectClass} style={inputStyle}>
                <option value="">Pick winner...</option>
                <option value={revealMatch.team1}>{revealMatch.team1}</option>
                <option value={revealMatch.team2}>{revealMatch.team2}</option>
              </select>
            ) : (
              <input type="text" value={revealWinner} onChange={e => setRevealWinner(e.target.value)} placeholder="Select match first" className={inputClass} style={inputStyle} />
            )}
          </div>
          <div>
            <label className="text-[10px] text-[#8892b0] font-bold uppercase tracking-wider block mb-1">Runs</label>
            <input type="number" value={revealRuns} onChange={e => setRevealRuns(e.target.value)} placeholder="180" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="text-[10px] text-[#8892b0] font-bold uppercase tracking-wider block mb-1">
              Salt {getSalt(revealMatchId) && <Badge variant="green" className="ml-1">auto-filled</Badge>}
            </label>
            <input type="text" value={revealSalt} onChange={e => setRevealSalt(e.target.value)} placeholder="0x..." className={inputClass} style={inputStyle} />
          </div>
        </div>
        <Button variant="outline" onClick={handleReveal} loading={revealLoading} disabled={!wallet || !revealMatchId || !revealWinner || !revealRuns || !revealSalt} icon={Eye} className="text-xs">
          Reveal Prediction
        </Button>
      </Card>

      {status && (
        <div className={`p-3 rounded-xl text-xs font-semibold ${status.startsWith('Error') ? 'text-[#ff3860] bg-[#ff3860]/10 border border-[#ff3860]/20' : 'text-[#00e676] bg-[#00e676]/10 border border-[#00e676]/20'}`}>
          {status}
        </div>
      )}
    </div>
  );
}
