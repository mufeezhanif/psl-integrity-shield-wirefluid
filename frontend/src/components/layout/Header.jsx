import React from 'react';
import { ShieldCheck, Wallet, Copy, ExternalLink, CheckCircle2, Radio } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { NETWORK } from '../../config/constants.js';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'season', label: 'Season Report' },
  { key: 'predictions', label: 'Predictions' },
  { key: 'reporters', label: 'Reporters' },
  { key: 'leaderboard', label: 'Leaderboard' },
  { key: 'audit', label: 'Audit Trail' },
];

export default function Header({ wallet, onConnect, onNavigate, activeView, copied, onCopy }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06]"
      style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex justify-between items-center">

        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('dashboard')}>
          <div className="p-2 rounded-xl group-hover:scale-105 transition-transform" style={{ background: 'linear-gradient(135deg, #00e676, #00b4d8)' }}>
            <ShieldCheck className="w-5 h-5 text-[#07071a]" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none">
              <span className="gradient-text">PSL Shield</span>
            </h1>
            <span className="text-[9px] uppercase tracking-[0.15em] text-[#8892b0] font-semibold">
              Entangled Hackathon '26
            </span>
          </div>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-0.5">
          {NAV_ITEMS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeView === key
                  ? 'text-[#00e676] bg-[#00e676]/10'
                  : 'text-[#8892b0] hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#94a3b8]" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.09)' }}>
            <Radio className="w-3 h-3 text-[#00e676]" />
            {NETWORK.name}
          </div>

          {wallet ? (
            <div className="flex items-center gap-2">
              <a href={`${NETWORK.explorer}/address/${wallet}`} target="_blank" rel="noreferrer" className="hidden md:flex items-center gap-1 text-xs text-[#8892b0] hover:text-white transition-colors">
                <ExternalLink className="w-3 h-3" />
              </a>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors"
                style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.09)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
              >
                <div className="w-5 h-5 rounded-full" style={{ background: `hsl(${parseInt(wallet.slice(2, 6), 16) % 360}, 70%, 60%)` }} />
                <span className="text-sm font-mono text-[#ccd6f6] hidden sm:block">{wallet.slice(0, 6)}...{wallet.slice(-4)}</span>
                <button onClick={onCopy} className="text-[#8892b0] hover:text-white transition-colors" title="Copy address">
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-[#00e676]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ) : (
            <Button icon={Wallet} onClick={onConnect} className="text-xs px-4 py-2">
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
