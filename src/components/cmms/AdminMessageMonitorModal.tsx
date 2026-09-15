import React from 'react';
import { X, Eye, Trash2, Clock, User, ShieldAlert } from 'lucide-react';
import { SystemMessage } from '../../types';

interface AdminMessageMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: SystemMessage[];
  onDeleteMessage: (id: string) => Promise<void>;
}

export const AdminMessageMonitorModal: React.FC<AdminMessageMonitorModalProps> = ({
  isOpen,
  onClose,
  messages,
  onDeleteMessage
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                🕵️ Canlı Mesaj İzleme ve Denetim (Admin)
              </h3>
              <p className="text-[11px] text-slate-400">
                Sistem genelinde iletilen tüm mesaj kayıtları
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

        {/* Message logs */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 text-xs">
          {messages.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Kayıtlı mesaj bulunmuyor.
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-300">{m.sender}</span>
                    <span className="text-slate-500">➔</span>
                    <span className="font-bold text-amber-300">{m.target}</span>
                    <span className="text-[10px] text-slate-500">
                      {typeof m.timestamp === 'number'
                        ? new Date(m.timestamp).toLocaleString('tr-TR')
                        : ''}
                    </span>
                  </div>
                  <p className="text-slate-200">{m.text}</p>
                </div>

                <button
                  onClick={() => onDeleteMessage(m.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                  title="Mesajı Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
