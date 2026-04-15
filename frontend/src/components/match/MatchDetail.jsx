import React from 'react';
import { ChevronLeft, ExternalLink, Swords, Info } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import IntegrityScore from './IntegrityScore.jsx';
import FlagForm from './FlagForm.jsx';
import { NETWORK, teamColor } from '../../config/constants.js';

function statusBadge(status) {
  if (status === 'Live') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-[#ff3860]/30 bg-[#ff3860]/10 text-[#ff3860]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#ff3860] live-ring inline-block" />
        LIVE
      </span>
    );
  }
  if (status === 'Upcoming') return <Badge variant="blue">Upcoming</Badge>;
  return <Badge variant="neutral">Completed</Badge>;
}

export default function MatchDetail({ match, flags, wallet, onBack, onRaiseFlag, onVote }) {
  const matchFlags = flags.filter((f) => f.matchId === match.id);
  const c1 = teamColor(match.team1);
  const c2 = teamColor(match.team2);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-up">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[#8892b0] hover:text-[#ccd6f6] text-xs font-bold mb-6 transition-colors uppercase tracking-wider"
      >
        <ChevronLeft className="w-4 h-4" />
        All Matches
      </button>

      {/* Match banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 mb-6"
        style={{
          background: `linear-gradient(135deg, ${c1}12 0%, #0d0d0d 50%, ${c2}12 100%)`,
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: `0 0 60px -20px ${c1}30, 0 0 60px -20px ${c2}30`,
        }}
      >
        {/* Decorative team color bars */}
        <div
          className="absolute top-0 left-0 w-full h-[2px]"
          style={{ background: `linear-gradient(90deg, ${c1}, transparent 40%, transparent 60%, ${c2})` }}
        />

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {statusBadge(match.status)}
          <span className="text-[#8892b0] text-xs">{match.time}</span>
          <a
            href={NETWORK.explorer}
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-1 text-xs text-[#8892b0] hover:text-[#00e676] transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Explorer
          </a>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="text-center flex-1">
            <p className="text-3xl md:text-5xl font-black leading-tight" style={{ color: c1 }}>
              {match.team1}
            </p>
            <p className="text-[10px] text-[#8892b0] mt-2 uppercase tracking-[0.2em] font-semibold">Home</p>
          </div>

          <div className="flex flex-col items-center gap-2 px-4 shrink-0">
            <div
              className="p-3 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,214,10,0.15), rgba(255,149,0,0.1))',
                border: '1px solid rgba(255,214,10,0.2)',
              }}
            >
              <Swords className="w-6 h-6 text-[#ffd60a]" />
            </div>
            <span className="text-[10px] text-[#8892b0] font-black uppercase tracking-widest">vs</span>
          </div>

          <div className="text-center flex-1">
            <p className="text-3xl md:text-5xl font-black leading-tight" style={{ color: c2 }}>
              {match.team2}
            </p>
            <p className="text-[10px] text-[#8892b0] mt-2 uppercase tracking-[0.2em] font-semibold">Away</p>
          </div>
        </div>
      </div>

      {/* Detail grid */}
      <div className="grid md:grid-cols-2 gap-5">
        <IntegrityScore score={match.score} events={match.events} />
        <FlagForm
          matchId={match.id}
          matchFlags={matchFlags}
          wallet={wallet}
          onRaiseFlag={onRaiseFlag}
          onVote={onVote}
          matchStatus={match.status}
        />
      </div>

      {/* Disclaimer */}
      <div className="mt-5 flex items-start gap-3 rounded-2xl p-4 text-xs text-[#00b4d8]"
        style={{ background: 'rgba(0,180,216,0.06)', border: '1px solid rgba(0,180,216,0.15)' }}
      >
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <p className="text-[#8892b0]">
          All flags live on <span className="text-[#00b4d8] font-semibold">WireFluid Testnet</span> — immutable,
          transparent, frfr. Stake is refunded when community reaches consensus. {' '}
          <span className="text-[#ccd6f6]">No match-fixing on our watch. 🏏</span>
        </p>
      </div>
    </div>
  );
}
