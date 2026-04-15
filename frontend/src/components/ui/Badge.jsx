import React from 'react';

const VARIANT_STYLES = {
  green:   'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/25',
  red:     'bg-[#ff3860]/10 text-[#ff3860] border-[#ff3860]/25',
  yellow:  'bg-[#ffd60a]/10 text-[#ffd60a] border-[#ffd60a]/25',
  blue:    'bg-[#00b4d8]/10 text-[#00b4d8] border-[#00b4d8]/25',
  purple:  'bg-purple-500/10 text-purple-400 border-purple-500/25',
  neutral: 'bg-white/5 text-[#8892b0] border-white/10',
};

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wide ${
        VARIANT_STYLES[variant] ?? VARIANT_STYLES.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}
