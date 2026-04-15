import React, { useState } from 'react';
import { Search, Zap } from 'lucide-react';
import MatchCard from '../components/dashboard/MatchCard.jsx';
import StatsBar from '../components/dashboard/StatsBar.jsx';

const FILTER_TABS = ['All', 'Live', 'Upcoming', 'Completed'];

function Hero({ matches }) {
  const liveMatch = matches.find((m) => m.status === 'Live');

  return (
    <div
      className="relative overflow-hidden rounded-3xl mb-8 p-8 md:p-10"
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #0d0d0d 50%, #080808 100%)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 0 80px -20px rgba(0,230,118,0.15)',
      }}
    >
      {/* Decorative gradient blob */}
      <div
        className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle, #00e676, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full pointer-events-none opacity-10"
        style={{ background: 'radial-gradient(circle, #00b4d8, transparent 70%)' }}
      />

      {/* Top line */}
      <div
        className="absolute top-0 left-0 w-full h-[2px]"
        style={{ background: 'linear-gradient(90deg, #00e676, #00b4d8, transparent)' }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🏏</span>
          <span
            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border"
            style={{
              background: 'rgba(0,230,118,0.08)',
              border: '1px solid rgba(0,230,118,0.2)',
              color: '#00e676',
            }}
          >
            On-Chain Cricket Integrity
          </span>
        </div>

        <h2 className="text-3xl md:text-5xl font-black text-[#e6f1ff] leading-tight mb-2">
          No fixing.{' '}
          <span className="gradient-text">No cap.</span>
        </h2>
        <p className="text-[#8892b0] text-sm md:text-base max-w-lg leading-relaxed">
          Community-powered match integrity on{' '}
          <span className="text-[#00e676] font-semibold">WireFluid Testnet</span>.
          Flag sus behaviour, stake WIRE, get rewarded. Frfr.
        </p>

        {liveMatch && (
          <div
            className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-full text-sm font-bold"
            style={{
              background: 'rgba(255,56,96,0.1)',
              border: '1px solid rgba(255,56,96,0.25)',
              color: '#ff3860',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-[#ff3860] live-ring" />
            <Zap className="w-3.5 h-3.5" />
            {liveMatch.team1} vs {liveMatch.team2} — Live now
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard({ matches, flags, seasonStats, onSelectMatch, onRefresh }) {
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');

  const visible = matches.filter((m) => {
    const byFilter = filter === 'All' || m.status === filter;
    const byQuery =
      !query ||
      m.team1.toLowerCase().includes(query.toLowerCase()) ||
      m.team2.toLowerCase().includes(query.toLowerCase());
    return byFilter && byQuery;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Hero matches={matches} />
      <StatsBar matches={matches} flags={flags} seasonStats={seasonStats} />

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8892b0]" />
          <input
            type="text"
            placeholder="Search teams…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-[#ccd6f6] placeholder-[#8892b0]/60 outline-none focus:border-[#00e676]/50 transition-colors"
            style={{
              background: '#111111',
              border: '1px solid rgba(255,255,255,0.09)',
            }}
          />
        </div>
        <div className="flex gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200"
              style={
                filter === tab
                  ? { background: 'linear-gradient(135deg, #00e676, #00b4d8)', color: '#000000'}
                  : {
                      background: '#111111',
                      border: '1px solid rgba(255,255,255,0.09)',
                      color: '#94a3b8',
                    }
              }
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {visible.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {visible.map((match) => (
            <MatchCard key={match.id} match={match} onClick={() => onSelectMatch(match)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-[#8892b0]">
          <p className="text-4xl mb-3">🏏</p>
          <p className="font-bold text-[#ccd6f6] mb-1">No matches found</p>
          <p className="text-sm">Try a different filter bestie.</p>
        </div>
      )}
    </div>
  );
}
