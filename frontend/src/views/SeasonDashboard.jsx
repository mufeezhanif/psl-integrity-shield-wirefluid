import React from 'react';
import { BarChart3, ShieldCheck, AlertTriangle, Users, Flame, TrendingUp } from 'lucide-react';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import { vibeLabel } from '../config/constants.js';

function barColor(score) {
  if (score >= 80) return '#00e676';
  if (score >= 50) return '#ffd60a';
  return '#ff3860';
}

function StatCard({ icon: Icon, label, value, gradient, glow }) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3 transition-all duration-300"
      style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)', boxShadow: `0 0 24px -10px ${glow}40` }}
    >
      <div className="p-2.5 rounded-xl shrink-0" style={{ background: gradient }}>
        <Icon className="w-4 h-4 text-[#07071a]" />
      </div>
      <div>
        <p className="text-2xl font-black leading-none">{value}</p>
        <p className="text-[11px] text-[#8892b0] mt-0.5 font-semibold tracking-wide">{label}</p>
      </div>
    </div>
  );
}

export default function SeasonDashboard({ matches, flags, seasonStats }) {
  const completedMatches = matches.filter(m => m.status === 'Completed');
  const avgScore = matches.length > 0
    ? (matches.reduce((sum, m) => sum + m.score, 0) / matches.length).toFixed(1)
    : 0;

  const resolvedFlags = flags.filter(f => f.resolved);
  const upheldFlags = flags.filter(f => f.upheld);

  // Distribution buckets
  const buckets = { high: 0, medium: 0, low: 0 };
  matches.forEach(m => {
    if (m.score >= 80) buckets.high++;
    else if (m.score >= 50) buckets.medium++;
    else buckets.low++;
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-up">
      <div className="flex items-center gap-3 mb-2">
        <BarChart3 className="w-6 h-6 text-[#00e676]" />
        <h2 className="text-2xl font-black text-[#e6f1ff]">
          <span className="gradient-text">Season Integrity Report</span>
        </h2>
      </div>
      <p className="text-sm text-[#8892b0] mb-8">Aggregated integrity analytics across all PSL matches this season.</p>

      {/* Top stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard icon={ShieldCheck} label="Matches Tracked" value={matches.length} gradient="linear-gradient(135deg, #00e676, #00b4d8)" glow="#00e676" />
        <StatCard icon={TrendingUp} label="Avg Integrity" value={`${avgScore}%`} gradient="linear-gradient(135deg, #c084fc, #818cf8)" glow="#c084fc" />
        <StatCard icon={AlertTriangle} label="Flags Raised" value={seasonStats?.flags ?? flags.length} gradient="linear-gradient(135deg, #ff3860, #ff6b6b)" glow="#ff3860" />
        <StatCard icon={Flame} label="Predictions" value={seasonStats?.predictions ?? 0} gradient="linear-gradient(135deg, #ffd60a, #ff9500)" glow="#ffd60a" />
      </div>

      {/* Integrity distribution */}
      <Card className="mb-6">
        <h3 className="font-bold text-[#ccd6f6] text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#00e676]" />
          Integrity Distribution
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)' }}>
            <p className="text-3xl font-black text-[#00e676]">{buckets.high}</p>
            <p className="text-[11px] text-[#8892b0] mt-1 font-semibold">Clean (80+)</p>
          </div>
          <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(255,214,10,0.06)', border: '1px solid rgba(255,214,10,0.15)' }}>
            <p className="text-3xl font-black text-[#ffd60a]">{buckets.medium}</p>
            <p className="text-[11px] text-[#8892b0] mt-1 font-semibold">Suspicious (50-79)</p>
          </div>
          <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(255,56,96,0.06)', border: '1px solid rgba(255,56,96,0.15)' }}>
            <p className="text-3xl font-black text-[#ff3860]">{buckets.low}</p>
            <p className="text-[11px] text-[#8892b0] mt-1 font-semibold">Flagged (&lt;50)</p>
          </div>
        </div>
      </Card>

      {/* Per-match integrity bar chart */}
      <Card className="mb-6">
        <h3 className="font-bold text-[#ccd6f6] text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#c084fc]" />
          Match-by-Match Integrity
        </h3>

        {matches.length === 0 ? (
          <p className="text-sm text-[#8892b0] text-center py-8">No matches tracked yet.</p>
        ) : (
          <div className="space-y-3">
            {matches.map((m) => {
              const color = barColor(m.score);
              const vibe = vibeLabel(m.score);
              return (
                <div key={m.id} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono text-[#8892b0] shrink-0">#{m.id}</span>
                      <span className="text-sm font-bold text-[#ccd6f6] truncate">
                        {m.team1} vs {m.team2}
                      </span>
                      {m.certified && (
                        <Badge variant="green">
                          <ShieldCheck className="inline w-2.5 h-2.5 mr-1" />
                          Certified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={vibe.variant}>{vibe.text}</Badge>
                      <span className="text-sm font-black tabular-nums" style={{ color }}>{m.score}%</span>
                    </div>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${m.score}%`,
                        background: `linear-gradient(90deg, ${color}99, ${color})`,
                        boxShadow: `0 0 12px -2px ${color}60`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-[#8892b0]">{m.events} events · {m.flagCount} flags</span>
                    <span className="text-[10px] text-[#8892b0]">{m.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Flag resolution summary */}
      <Card>
        <h3 className="font-bold text-[#ccd6f6] text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#ff3860]" />
          Flag Resolution Summary
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-black text-[#ccd6f6]">{flags.length}</p>
            <p className="text-[11px] text-[#8892b0] mt-1 font-semibold">Total Raised</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-[#00e676]">{resolvedFlags.length}</p>
            <p className="text-[11px] text-[#8892b0] mt-1 font-semibold">Resolved</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-[#ff3860]">{upheldFlags.length}</p>
            <p className="text-[11px] text-[#8892b0] mt-1 font-semibold">Upheld</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
