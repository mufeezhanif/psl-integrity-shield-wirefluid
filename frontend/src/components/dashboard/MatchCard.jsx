import React from 'react';
import { AlertTriangle, Clock, Swords, ShieldCheck } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import { teamColor, vibeLabel } from '../../config/constants.js';

function scoreColor(score) {
  if (score >= 75) return '#00e676';
  if (score >= 50) return '#ffd60a';
  return '#ff3860';
}

function statusBadge(status) {
  if (status === 'Live') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-[#ff3860]/30 bg-[#ff3860]/10 text-[#ff3860] tracking-wide">
        <span className="w-1.5 h-1.5 rounded-full bg-[#ff3860] live-ring inline-block" />
        LIVE
      </span>
    );
  }
  if (status === 'Upcoming') {
    return <Badge variant="blue">Upcoming</Badge>;
  }
  return <Badge variant="neutral">Completed</Badge>;
}

export default function MatchCard({ match, onClick }) {
  const c1 = teamColor(match.team1);
  const c2 = teamColor(match.team2);
  const sc = scoreColor(match.score);
  const vibe = vibeLabel(match.score);

  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl p-5 cursor-pointer group
                 hover:-translate-y-1.5 transition-all duration-300
                 animate-fade-up"
      style={{
        background: '#0d0d0d',
        border: `1px solid ${match.status === 'Live' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: match.status === 'Live'
          ? `0 0 30px -8px ${c1}35, 0 0 30px -8px ${c2}35`
          : '0 2px 12px rgba(0,0,0,0.5)',
      }}
    >
      {/* Team color accent strips */}
      <div
        className="absolute top-0 left-0 w-[3px] h-full rounded-l-2xl opacity-80"
        style={{ background: `linear-gradient(to bottom, ${c1}, ${c1}40)` }}
      />
      <div
        className="absolute top-0 right-0 w-[3px] h-full rounded-r-2xl opacity-80"
        style={{ background: `linear-gradient(to bottom, ${c2}, ${c2}40)` }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between mb-4 gap-2 ml-2">
        <div className="flex items-center gap-2 flex-wrap">
          {statusBadge(match.status)}
          {match.certified && (
            <Badge variant="green">
              <ShieldCheck className="inline w-2.5 h-2.5 mr-1" />
              Certified Clean
            </Badge>
          )}
          {match.divergenceScore !== null && match.divergenceScore > 70 && (
            <Badge variant="yellow">
              Divergence {match.divergenceScore}%
            </Badge>
          )}
          {match.flagCount > 0 && (
            <Badge variant="red">
              <AlertTriangle className="inline w-2.5 h-2.5 mr-1" />
              {match.flagCount} {match.flagCount === 1 ? 'Flag' : 'Flags'}
            </Badge>
          )}
        </div>
        {match.time && (
          <div className="flex items-center gap-1 text-[11px] text-[#8892b0] shrink-0">
            <Clock className="w-3 h-3" />
            {match.time}
          </div>
        )}
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-3 mb-5 ml-2">
        <div className="text-center flex-1">
          <p
            className="text-base font-black leading-tight transition-colors duration-300"
            style={{ color: c1 }}
          >
            {match.team1}
          </p>
          <p className="text-[10px] text-[#8892b0] mt-1 uppercase tracking-widest font-semibold">Home</p>
        </div>

        <div className="flex flex-col items-center px-2 shrink-0">
          <div
            className="p-2 rounded-xl mb-1"
            style={{ background: 'linear-gradient(135deg, rgba(255,214,10,0.15), rgba(255,149,0,0.15))', border: '1px solid rgba(255,214,10,0.2)' }}
          >
            <Swords className="w-4 h-4 text-[#ffd60a]" />
          </div>
          <span className="text-[10px] font-black text-[#8892b0] tracking-widest">VS</span>
        </div>

        <div className="text-center flex-1">
          <p
            className="text-base font-black leading-tight transition-colors duration-300"
            style={{ color: c2 }}
          >
            {match.team2}
          </p>
          <p className="text-[10px] text-[#8892b0] mt-1 uppercase tracking-widest font-semibold">Away</p>
        </div>
      </div>

      {/* Integrity bar */}
      <div className="ml-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-[#8892b0] font-bold uppercase tracking-widest">
            Vibe Check
          </span>
          <Badge variant={vibe.variant}>{vibe.text}</Badge>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${match.score}%`,
              background: `linear-gradient(90deg, ${sc}cc, ${sc})`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <p className="text-[10px] text-[#8892b0]">
            {match.events} events on-chain
          </p>
          <p className="text-[10px] font-bold" style={{ color: sc }}>
            {match.score}%
          </p>
        </div>
      </div>
    </div>
  );
}
