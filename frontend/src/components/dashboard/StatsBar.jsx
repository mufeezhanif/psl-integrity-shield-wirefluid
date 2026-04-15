import React from 'react';
import { Activity, AlertTriangle, Trophy, Flame, ShieldCheck } from 'lucide-react';

const STAT_CONFIGS = [
  { key: 'live',   icon: Activity,     label: 'Live Rn',        gradient: 'linear-gradient(135deg, #00e676, #00b4d8)', glow: '#00e676' },
  { key: 'flags',  icon: AlertTriangle, label: 'Total Flags',    gradient: 'linear-gradient(135deg, #ff3860, #ff6b6b)', glow: '#ff3860' },
  { key: 'preds',  icon: Flame,        label: 'Predictions',     gradient: 'linear-gradient(135deg, #ffd60a, #ff9500)', glow: '#ffd60a' },
  { key: 'cert',   icon: ShieldCheck,  label: 'Certified Clean', gradient: 'linear-gradient(135deg, #00e676, #00b4d8)', glow: '#00e676' },
  { key: 'done',   icon: Trophy,       label: 'Wrapped Up',      gradient: 'linear-gradient(135deg, #c084fc, #818cf8)', glow: '#c084fc' },
];

export default function StatsBar({ matches, flags, seasonStats }) {
  const values = {
    live:  matches.filter((m) => m.status === 'Live').length,
    flags: seasonStats?.flags ?? flags.length,
    preds: seasonStats?.predictions ?? 0,
    cert:  seasonStats?.certified ?? 0,
    done:  matches.filter((m) => m.status === 'Completed').length,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
      {STAT_CONFIGS.map(({ key, icon: Icon, label, gradient, glow }) => (
        <div key={key} className="rounded-2xl p-4 flex items-center gap-3 group transition-all duration-300"
          style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)', boxShadow: `0 0 24px -10px ${glow}40` }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
        >
          <div className="p-2.5 rounded-xl shrink-0" style={{ background: gradient }}>
            <Icon className="w-4 h-4 text-[#07071a]" />
          </div>
          <div>
            <p className="text-3xl font-black leading-none">{values[key]}</p>
            <p className="text-[11px] text-[#8892b0] mt-0.5 font-semibold tracking-wide">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
