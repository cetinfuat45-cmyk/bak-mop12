import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { X, Send, MessageSquare, Users, User, Clock, CornerDownLeft, Trash2, CheckCircle2 } from 'lucide-react';
import { Operator, SystemMessage } from '../../types';
import { soundEffects } from '../../services/soundEffects';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOperator: Operator;
  operators: Operator[];
  messages?: SystemMessage[];
  onSendMessage: (target: string, text: string) => Promise<void>;
  onDeleteMessage?: (id: string) => Promise<void>;
  onClearAllMessages?: () => Promise<void>;
  defaultTarget?: string;
}

export const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  currentOperator,
  operators,
  messages = [],
  onSendMessage,
  onDeleteMessage,
  onClearAllMessages,
  defaultTarget
}) => {
  const [target, setTarget] = useState(defaultTarget || 'ALL');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSending(true);
    try {
      await onSendMessage(target, text.trim());
      soundEffects.playMessageChime();
      setText('');
      // Switch to history tab to show the message live
      setActiveTab('history');
    } catch {
      // Error handled
    } finally {
      setSending(false);
    }
  };

  const handleReply = (senderName: string) => {
    setTarget(senderName);
    setActiveTab('send');
  };

  const isAdmin = currentOperator.role === 'admin';

  const handleDeleteSingle = async (id: string, textPreview: string) => {
    if (!onDeleteMessage) return;
    const confirm = await Swal.fire({
      title: 'Mesaj Silinsin mi?',
      text: `"${textPreview.substring(0, 45)}..." mesajı kalıcı olarak silinecek.`,
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
      title: 'Tüm Mesajlar Temizlensin mi?',
      text: 'Sistemdeki ve sahadan gelen tüm mesajlar kalıcı olarak silinecektir. Bu işlem geri alınamaz!',
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
        text: 'Mesaj geçmişi başarıyla temizlendi.',
        background: '#0f172a',
        color: '#f8fafc',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Operatörler Arası Mesajlaşma (P2P)
              </h3>
              <p className="text-[11px] text-slate-400">
                Saha teknisyenleri canlı bildirim ve haberleşme paneli
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

        {/* Tab switcher */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'send'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Yeni Mesaj Yaz</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 relative ${
              activeTab === 'history'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Mesaj Akışı ({messages.length})</span>
          </button>
        </div>

        {/* Tab 1: Send Message Form */}
        {activeTab === 'send' && (
          <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs overflow-y-auto">
            {/* Sender Badge */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px]">
              <span className="text-slate-400">Gönderen Operatör:</span>
              <span className="font-bold text-cyan-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                {currentOperator.name}
              </span>
            </div>

            {/* Target Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Alıcı Seçimi:
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-cyan-500 font-semibold"
              >
                <option value="ALL">📢 TÜM TEKNİSYENLERE (Genel Duyuru)</option>
                {operators.map((op, opIdx) => (
                  <option key={`msg-op-${op.name}-${opIdx}`} value={op.name}>
                    👤 {op.name} {op.name === currentOperator.name ? '(Kendime Test)' : `(${op.role})`}
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
                placeholder="Örn: Pres 04 hidrolik arızası için takviye lazım / 2. vardiya devir notu..."
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-cyan-500 text-xs"
                autoFocus
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-500">
                ⚡ Gönderilen mesaj tüm ekranlarda anında görünür
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-750 font-semibold"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/20 active:scale-95 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sending ? 'İletiliyor...' : 'Mesajı Gönder'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Live Message History */}
        {activeTab === 'history' && (
          <div className="p-4 overflow-y-auto space-y-2.5 flex-1 text-xs max-h-[60vh]">
            <div className="flex items-center justify-between mb-1 pb-1.5 border-b border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400">
                Canlı Mesaj Kayıtları ({messages.length})
              </span>
              <div className="flex items-center gap-2">
                {isAdmin && messages.length > 0 && onClearAllMessages && (
                  <button
                    onClick={handleClearAll}
                    className="text-[10px] font-bold text-rose-300 hover:text-white bg-rose-950/70 hover:bg-rose-900 border border-rose-700/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    title="Tüm mesaj kayıtlarını kalıcı olarak sil"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>Tümünü Sil</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('send')}
                  className="text-[11px] font-bold text-cyan-400 hover:underline flex items-center gap-1"
                >
                  + Yeni Mesaj Yaz
                </button>
              </div>
            </div>

            {messages.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
                <p>Henüz iletilmiş bir mesaj bulunmuyor.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isMine = m.sender === currentOperator.name;
                const isForMe = m.target === 'ALL' || m.target === currentOperator.name;
                const isFieldAlert =
                  m.isFieldNotification ||
                  m.sender.toLowerCase().includes('saha') ||
                  m.sender === 'Sahadan Bildirim';

                const isSystemAction =
                  !isFieldAlert && (
                    m.text.startsWith('🔧') ||
                    m.text.startsWith('🤝') ||
                    m.text.startsWith('✅') ||
                    m.text.startsWith('⏸️') ||
                    m.text.startsWith('👋') ||
                    m.text.startsWith('📋') ||
                    m.text.startsWith('🚨') ||
                    m.sender === 'SİSTEM' ||
                    m.sender === 'YÖNETİCİ'
                  );

                const timeStr = typeof m.timestamp === 'number'
                  ? new Date(m.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                  : typeof m.timestamp === 'string'
                  ? m.timestamp
                  : '';

                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isFieldAlert
                        ? 'bg-yellow-400 border-2 border-yellow-500 text-slate-950 shadow-md shadow-yellow-500/20'
                        : isSystemAction
                        ? 'bg-slate-950/90 border-cyan-800/40 shadow-sm'
                        : isMine
                        ? 'bg-cyan-950/30 border-cyan-800/50'
                        : isForMe
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-slate-950/50 border-slate-900 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold ${isFieldAlert ? 'text-slate-950 font-black' : isMine ? 'text-cyan-300' : 'text-slate-200'}`}>
                          {m.sender}
                        </span>
                        <span className={isFieldAlert ? 'text-slate-900 font-bold' : 'text-slate-500'}>➔</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isFieldAlert
                            ? 'bg-slate-950 text-yellow-300 border border-slate-950'
                            : 'bg-slate-900 border border-slate-700 text-amber-300'
                        }`}>
                          {m.target === 'ALL' ? '📢 HERKESE' : `👤 ${m.target}`}
                        </span>
                        {isFieldAlert && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-950 text-yellow-300 animate-pulse">
                            🚨 SAHADAN BİLDİRİM
                          </span>
                        )}
                        {isSystemAction && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-cyan-950 border border-cyan-700 text-cyan-300">
                            ⚡ Saha Hareketi
                          </span>
                        )}
                        <span className={`text-[10px] flex items-center gap-0.5 ml-1 ${isFieldAlert ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                          <Clock className="w-3 h-3" />
                          {timeStr}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {!isMine && (
                          <button
                            onClick={() => handleReply(m.sender)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 ${
                              isFieldAlert
                                ? 'bg-slate-950 text-yellow-300 hover:bg-slate-900 font-black'
                                : 'bg-slate-800 hover:bg-cyan-700 text-cyan-300 hover:text-white'
                            }`}
                            title="Bu kişiye cevap yaz"
                          >
                            <CornerDownLeft className="w-2.5 h-2.5" />
                            <span>Cevapla</span>
                          </button>
                        )}
                        {(isMine || isAdmin) && onDeleteMessage && (
                          <button
                            onClick={() => handleDeleteSingle(m.id, m.text)}
                            className={`p-1 rounded transition-colors ${
                              isFieldAlert
                                ? 'text-slate-950 hover:bg-yellow-500'
                                : 'text-slate-500 hover:text-rose-400 hover:bg-slate-900'
                            }`}
                            title={isAdmin ? 'Admin: Mesajı Kalıcı Olarak Sil' : 'Mesajı Sil'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className={`text-xs whitespace-pre-wrap ${
                      isFieldAlert ? 'text-slate-950 font-black text-sm' : 'text-slate-200 font-medium'
                    }`}>
                      {m.text}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

