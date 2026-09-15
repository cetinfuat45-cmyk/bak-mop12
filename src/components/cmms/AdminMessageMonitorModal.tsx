import React from 'react';
import Swal from 'sweetalert2';
import { X, Eye, Trash2, Clock, User, ShieldAlert } from 'lucide-react';
import { SystemMessage } from '../../types';

interface AdminMessageMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: SystemMessage[];
  onDeleteMessage: (id: string) => Promise<void>;
  onClearAllMessages?: () => Promise<void>;
}

export const AdminMessageMonitorModal: React.FC<AdminMessageMonitorModalProps> = ({
  isOpen,
  onClose,
  messages,
  onDeleteMessage,
  onClearAllMessages
}) => {
  if (!isOpen) return null;

  const handleDeleteSingle = async (id: string, text: string) => {
    const confirm = await Swal.fire({
      title: 'Mesaj Silinsin mi?',
      text: `"${text.substring(0, 45)}..." mesajı kalıcı olarak silinsin mi?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Evet, Sil',
      cancelButtonText: 'Vazgeç',
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#e11d48'
    });
    if (confirm.isConfirmed) {
      await onDeleteMessage(id);
    }
  };

  const handleClearAll = async () => {
    if (!onClearAllMessages) return;
    const confirm = await Swal.fire({
      title: 'Tüm Mesajları Temizle?',
      text: 'Sistem genelindeki ve sahadan gelen tüm mesaj kayıtları kalıcı olarak silinecektir. Bu işlem geri alınamaz!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Evet, Tümünü Sil',
      cancelButtonText: 'İptal',
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#e11d48'
    });
    if (confirm.isConfirmed) {
      await onClearAllMessages();
      Swal.fire({
        icon: 'success',
        title: 'Tüm Mesajlar Silindi',
        text: 'Mesaj geçmişi sıfırlandı.',
        background: '#0f172a',
        color: '#f8fafc',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

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
                Sistem genelinde iletilen tüm mesaj kayıtları ({messages.length})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && onClearAllMessages && (
              <button
                onClick={handleClearAll}
                className="text-xs font-bold text-rose-300 hover:text-white bg-rose-950/70 hover:bg-rose-900 border border-rose-700/80 px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                title="Tüm mesaj kayıtlarını kalıcı olarak sil"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Tüm Mesajları Temizle</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message logs */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 text-xs">
          {messages.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Kayıtlı mesaj bulunmuyor.
            </div>
          ) : (
            messages.map((m) => {
              const isFieldAlert =
                m.isFieldNotification ||
                m.sender.toLowerCase().includes('saha') ||
                m.sender === 'Sahadan Bildirim';

              return (
                <div
                  key={m.id}
                  className={`p-3 rounded-2xl border flex items-start justify-between gap-3 ${
                    isFieldAlert
                      ? 'bg-yellow-400 border-2 border-yellow-500 text-slate-950'
                      : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-bold ${isFieldAlert ? 'text-slate-950 font-black' : 'text-cyan-300'}`}>
                        {m.sender}
                      </span>
                      <span className={isFieldAlert ? 'text-slate-900 font-bold' : 'text-slate-500'}>➔</span>
                      <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        isFieldAlert ? 'bg-slate-950 text-yellow-300' : 'bg-slate-900 text-amber-300 border border-slate-700'
                      }`}>
                        {m.target}
                      </span>
                      {isFieldAlert && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-950 text-yellow-300">
                          🚨 SAHADAN BİLDİRİM
                        </span>
                      )}
                      <span className={`text-[10px] ${isFieldAlert ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                        {typeof m.timestamp === 'number'
                          ? new Date(m.timestamp).toLocaleString('tr-TR')
                          : ''}
                      </span>
                    </div>
                    <p className={`whitespace-pre-wrap ${isFieldAlert ? 'text-slate-950 font-black' : 'text-slate-200'}`}>
                      {m.text}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteSingle(m.id, m.text)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isFieldAlert
                        ? 'text-slate-950 hover:bg-yellow-500'
                        : 'text-slate-500 hover:text-rose-400 hover:bg-slate-900'
                    }`}
                    title="Mesajı Kalıcı Olarak Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
