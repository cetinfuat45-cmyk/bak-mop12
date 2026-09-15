import React from 'react';
import { MessageSquare, X, CornerDownLeft, AlertTriangle } from 'lucide-react';
import { SystemMessage } from '../../types';

interface MessageBannerProps {
  message: SystemMessage | null;
  onDismiss: () => void;
  onReply: (targetSender: string) => void;
}

export const MessageBanner: React.FC<MessageBannerProps> = ({
  message,
  onDismiss,
  onReply
}) => {
  if (!message) return null;

  const isFieldAlert =
    message.isFieldNotification ||
    message.sender.toLowerCase().includes('saha') ||
    message.sender === 'Sahadan Bildirim';

  const timeStr =
    typeof message.timestamp === 'number'
      ? new Date(message.timestamp).toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit'
        })
      : '';

  if (isFieldAlert) {
    // ⚠️ Sahadan Gelen Önemli Bildirimler: Sarı Arka Plan, Siyah Kalın Yazılar
    return (
      <div className="bg-yellow-400 border-b-4 border-yellow-600 text-slate-950 px-4 py-3 flex items-center justify-between shadow-2xl shadow-yellow-500/30 animate-bounceOnce relative z-30">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 rounded-xl bg-slate-950 text-yellow-400 shrink-0 animate-pulse shadow-md">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-xs truncate">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-slate-950 text-yellow-300 font-black text-[11px] uppercase tracking-wide">
                🚨 SAHADAN BİLDİRİM
              </span>
              <span className="font-extrabold text-slate-950 text-sm">
                {message.sender}
              </span>
              <span className="text-[11px] font-bold text-slate-800">
                {timeStr}
              </span>
            </div>
            <p className="text-slate-950 font-black text-sm md:text-base truncate mt-1 tracking-tight">
              {message.text}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          <button
            onClick={() => onReply(message.sender)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-yellow-400 font-black text-xs transition-all shadow-md active:scale-95"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
            <span>Cevapla</span>
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-xl bg-yellow-500/80 hover:bg-slate-950 text-slate-950 hover:text-white transition-colors"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Standart P2P Mesaj Bannerı
  return (
    <div className="bg-gradient-to-r from-blue-900/90 via-cyan-900/90 to-slate-900/90 border-b border-cyan-500/40 text-white px-4 py-2.5 flex items-center justify-between shadow-lg shadow-cyan-950/40 animate-slideDown relative z-30">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 shrink-0 animate-pulse">
          <MessageSquare className="w-4 h-4" />
        </div>
        <div className="text-xs truncate">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-cyan-300">
              {message.sender}:
            </span>
            <span className="text-[11px] text-slate-400">
              {timeStr}
            </span>
            {message.target === 'ALL' && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-950 border border-blue-700 text-blue-300">
                HERKESE
              </span>
            )}
          </div>
          <p className="text-slate-200 font-medium truncate mt-0.5 max-w-xl">
            {message.text}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-3">
        <button
          onClick={() => onReply(message.sender)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all shadow-sm"
        >
          <CornerDownLeft className="w-3 h-3" />
          <span>Cevapla</span>
        </button>
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Kapat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
