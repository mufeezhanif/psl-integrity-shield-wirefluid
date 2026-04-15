import React from 'react';
import { ShieldCheck, AlertTriangle, Eye } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import { vibeLabel } from '../../config/constants.js';

function scoreConfig(score) {
  if (score >= 75)
    return {
      color: '#00e676',
      gradientFrom: '#00e676',
      gradientTo: '#00b4d8',
      Icon: ShieldCheck,
      headline: 'All good fam.',
      description: 'No suspicious on-chain activity detected. Clean as a whistle.',
    };
  if (score >= 50)
    return {
      color: '#ffd60a',
      gradientFrom: '#ffd60a',
      gradientTo: '#ff9500',
      Icon: Eye,
      headline: 'Hmm, something\'s off.',
      description: 'Unusual patterns spotted. Community is actively reviewing.',
    };
  return {
    color: '#ff3860',
    gradientFrom: '#ff3860',
    gradientTo: '#ff6b6b',
    Icon: AlertTriangle,
    headline: 'Not looking good ngl.',
    description: 'Multiple anomalies flagged on-chain. Investigation recommended ASAP.',
  };
}

/** SVG circular progress ring */
function ScoreRing({ score, color, gradientFrom, gradientTo, Icon }) {
  const R = 44;
  const circ = 2 * Math.PI * R;
  const offset = circ - (score / 100) * circ;
  const gradId = `ring-grad-${score}`;

  return (
    <div className="relative w-32 h-32 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx="50" cy="50" r={R}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
        />
        {/* Progress */}
        <circle
          cx="50" cy="50" r={R}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Icon className="w-5 h-5 mb-0.5" style={{ color }} />
        <span className="text-xl font-black leading-none" style={{ color }}>{score}</span>
        <span className="text-[9px] text-[#8892b0] font-bold uppercase tracking-wider">%</span>
      </div>
    </div>
  );
}

export default function IntegrityScore({ score, events }) {
  const cfg = scoreConfig(score);
  const vibe = vibeLabel(score);

  return (
    <Card>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-extrabold text-[#ccd6f6] flex items-center gap-2 text-sm uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-[#00e676]" />
          Vibe Check
        </h2>
        <Badge variant={vibe.variant}>{vibe.text}</Badge>
      </div>

      <div className="flex items-center gap-6">
        <ScoreRing
          score={score}
          color={cfg.color}
          gradientFrom={cfg.gradientFrom}
          gradientTo={cfg.gradientTo}
          Icon={cfg.Icon}
        />
        <div className="flex-1">
          <p className="text-lg font-black text-[#e6f1ff] leading-tight mb-1">
            {cfg.headline}
          </p>
          <p className="text-xs text-[#8892b0] leading-relaxed">{cfg.description}</p>
          <div className="mt-3 flex items-center gap-2">
            <div
              className="h-1 rounded-full flex-1"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${score}%`,
                  background: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
                }}
              />
            </div>
            <span className="text-xs font-bold" style={{ color: cfg.color }}>{score}%</span>
          </div>
          <p className="text-[10px] text-[#8892b0] mt-1.5">
            {events} on-chain event{events !== 1 ? 's' : ''} scanned
          </p>
        </div>
      </div>
    </Card>
  );
}
