import React, { useState } from 'react';
import { AlertTriangle, ThumbsUp, ThumbsDown, Lock, Flame } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';

function VoteBar({ upvotes, downvotes }) {
  const total = upvotes + downvotes;
  const pct = total === 0 ? 50 : Math.round((upvotes / total) * 100);
  return (
    <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden mt-1.5">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          background: pct >= 60
            ? 'linear-gradient(90deg, #00e676, #00b4d8)'
            : pct >= 40
            ? 'linear-gradient(90deg, #ffd60a, #ff9500)'
            : 'linear-gradient(90deg, #ff3860, #ff6b6b)',
        }}
      />
    </div>
  );
}

export default function FlagForm({ matchId, matchFlags, wallet, onRaiseFlag, onVote, matchStatus }) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const STAKE = '0.05';

  async function handleSubmit() {
    if (!description.trim()) return;
    setLoading(true);
    try {
      await onRaiseFlag({ matchId, description, stakeWire: STAKE });
    } finally {
      setDescription('');
      setLoading(false);
    }
  }

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-extrabold text-[#ccd6f6] flex items-center gap-2 text-sm uppercase tracking-wider">
          <Flame className="w-4 h-4 text-[#ff3860]" />
          Ratio Board
        </h2>
        {matchFlags.length > 0 && (
          <Badge variant="red">{matchFlags.length} flag{matchFlags.length !== 1 ? 's' : ''}</Badge>
        )}
      </div>

      {/* Existing flags */}
      {matchFlags.length > 0 ? (
        <div className="space-y-3 mb-5 max-h-56 overflow-y-auto pr-1">
          {matchFlags.map((flag) => {
            const total = flag.upvotes + flag.downvotes;
            const pct = total === 0 ? 50 : Math.round((flag.upvotes / total) * 100);
            return (
              <div
                key={flag.id}
                className="rounded-xl p-3 text-sm animate-fade-up"
                style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.09)' }}
              >
                <p className="text-[#ccd6f6] mb-2 leading-relaxed text-xs">{flag.description}</p>

                <VoteBar upvotes={flag.upvotes} downvotes={flag.downvotes} />

                <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      className="flex items-center gap-1 text-[#8892b0] hover:text-[#00e676] transition-colors text-xs font-semibold"
                      onClick={() => onVote(flag.id, 'up')}
                      title="W — supports the flag"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      {flag.voterCount > 0 ? `${flag.upvotes.toFixed(3)}` : '0'}
                    </button>
                    <button
                      className="flex items-center gap-1 text-[#8892b0] hover:text-[#ff3860] transition-colors text-xs font-semibold"
                      onClick={() => onVote(flag.id, 'down')}
                      title="L — disputes the flag"
                    >
                      <ThumbsDown className="w-3 h-3" />
                      {flag.voterCount > 0 ? `${flag.downvotes.toFixed(3)}` : '0'}
                    </button>
                    <span className="text-[10px] text-[#8892b0]">{pct}% backing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={flag.status === 'Open' ? 'yellow' : flag.status === 'Upheld' ? 'green' : 'red'}>
                      {flag.status}
                    </Badge>
                    <span className="text-[10px] text-[#8892b0] font-mono">{flag.reporter}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 mb-4">
          <p className="text-2xl mb-1">✌️</p>
          <p className="text-xs text-[#8892b0]">No flags yet. Match looking clean fr.</p>
        </div>
      )}

      {/* Divider */}
      <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {wallet ? (
          matchStatus === 'Completed' ? (
            <>
              <p className="text-xs font-bold text-[#ccd6f6] uppercase tracking-wider mb-2">
                🚩 Call it out
              </p>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Spill the tea ☕ — what's sus about this match?"
                className="w-full rounded-xl p-3 text-xs text-[#e2e8f0] placeholder-[#4a5568] outline-none resize-none mb-3 transition-colors"
                style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.09)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(255,56,96,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
              />
              <div className="flex gap-3 items-center">
                <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <span className="text-xs font-mono text-[#ccd6f6] font-bold">{STAKE}</span>
                  <span className="text-[10px] text-[#8892b0] font-bold">WIRE</span>
                </div>
                <Button
                  variant="danger"
                  className="flex-1 text-xs"
                  loading={loading}
                  onClick={handleSubmit}
                  disabled={!description.trim()}
                >
                  {loading ? 'Submitting…' : 'Drop the Flag 🚩'}
                </Button>
              </div>
              <p className="text-[10px] text-[#8892b0] mt-2">
                Stake refunded if community backs your flag. No cap.
              </p>
            </>
          ) : (
            <div className="flex items-center gap-2 text-[#8892b0] text-xs">
              <Lock className="w-3.5 h-3.5" />
              Flags can only be raised on completed matches.
            </div>
          )
        ) : (
          <div className="flex items-center gap-2 text-[#8892b0] text-xs">
            <Lock className="w-3.5 h-3.5" />
            Connect wallet to drop a flag.
          </div>
        )}
      </div>
    </Card>
  );
}
