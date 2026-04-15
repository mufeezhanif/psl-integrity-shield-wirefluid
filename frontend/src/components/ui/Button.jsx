import React from 'react';
import { RefreshCw } from 'lucide-react';

const VARIANT_STYLES = {
  primary: 'text-[#07071a] font-extrabold hover:opacity-90 active:scale-95',
  danger:  'bg-[#ff3860]/90 hover:bg-[#ff3860] text-white font-bold active:scale-95',
  outline: 'bg-transparent border border-white/15 hover:bg-white/5 text-white font-bold active:scale-95',
  ghost:   'bg-transparent hover:bg-white/5 text-[#8892b0] hover:text-white font-semibold',
};

export default function Button({
  children,
  variant = 'primary',
  loading = false,
  icon: Icon,
  className = '',
  disabled,
  ...props
}) {
  const isPrimary = variant === 'primary';

  return (
    <button
      className={`relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden ${
        VARIANT_STYLES[variant] ?? VARIANT_STYLES.primary
      } ${className}`}
      style={
        isPrimary
          ? { background: 'linear-gradient(135deg, #00e676, #00b4d8)' }
          : undefined
      }
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        Icon && <Icon className="w-4 h-4" />
      )}
      {children}
    </button>
  );
}
