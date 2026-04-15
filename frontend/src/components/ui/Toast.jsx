import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: { bg: 'rgba(0,230,118,0.12)', border: 'rgba(0,230,118,0.3)', text: '#00e676' },
  error: { bg: 'rgba(255,56,96,0.12)', border: 'rgba(255,56,96,0.3)', text: '#ff3860' },
  warning: { bg: 'rgba(255,214,10,0.12)', border: 'rgba(255,214,10,0.3)', text: '#ffd60a' },
  info: { bg: 'rgba(0,180,216,0.12)', border: 'rgba(0,180,216,0.3)', text: '#00b4d8' },
};

function ToastItem({ toast, onDismiss }) {
  const Icon = ICONS[toast.type] || ICONS.info;
  const color = COLORS[toast.type] || COLORS.info;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration || 5000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl backdrop-blur-xl shadow-2xl animate-fade-up max-w-sm"
      style={{ background: color.bg, border: `1px solid ${color.border}` }}
    >
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: color.text }} />
      <div className="flex-1 min-w-0">
        {toast.title && <p className="text-sm font-bold text-[#e6f1ff]">{toast.title}</p>}
        <p className="text-xs text-[#8892b0] break-words">{toast.message}</p>
        {toast.txHash && (
          <a
            href={`https://wirefluidscan.com/tx/${toast.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono hover:underline mt-1 inline-block"
            style={{ color: color.text }}
          >
            View on Explorer →
          </a>
        )}
      </div>
      <button onClick={() => onDismiss(toast.id)} className="text-[#8892b0] hover:text-white flex-shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  );
}
