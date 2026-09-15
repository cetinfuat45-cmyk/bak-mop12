import React, { useState } from 'react';
import { X, Send, MessageSquare, Users, User } from 'lucide-react';
import { Operator } from '../../types';
import { soundEffects } from '../../services/soundEffects';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOperator: Operator;
  operators: Operator[];
  onSendMessage: (target: string, text: string) => Promise<void>;
  defaultTarget?: string;
}

export const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  currentOperator,
  operators,
  onSendMessage,
  defaultTarget
}) => {
  const [target, setTarget] = useState(defaultTarget || 'ALL');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSending(true);
    try {
      await onSendMessage(target, text.trim());
      soundEffects.playMessageChime();
      setText('');
      onClose();
    } catch {
      // Error
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-950 border border-sky-800 text-sky-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Operatörler Arası Mesaj Gönder
              </h3>
              <p className="text-[11px] text-slate-400">
                Saha teknisyenlerine anlık bildirim iletisi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {/* Target Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Alıcı Seçimi:
            </label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-cyan-500 font-semibold"
            >
              <option value="ALL">📢 TÜM TEKNİSYENLERE (Genel Duyuru)</option>
              {operators
                .filter((o) => o.name !== currentOperator.name)
                .map((op, opIdx) => (
                  <option key={`msg-op-${op.name}-${opIdx}`} value={op.name}>
                    👤 {op.name} ({op.role})
                  </option>
                ))}
            </select>
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Mesajınız:
            </label>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Örn: Pres 04 için anahtar takımı kimde? / 2. vardiye devir notu..."
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-cyan-500 text-xs"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-750 font-semibold"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'İletiliyor...' : 'Gönder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
