import React, { useState } from 'react';
import {
  X,
  Users,
  Key,
  Shield,
  Clock,
  Check,
  UserPlus,
  QrCode,
  Sparkles
} from 'lucide-react';
import { Operator } from '../../types';

interface OperatorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  operators: Operator[];
  onUpdateOperator: (op: Operator) => Promise<void>;
  onSetQrExemption: (operatorName: string, hours: number) => Promise<void>;
}

export const OperatorSettingsModal: React.FC<OperatorSettingsModalProps> = ({
  isOpen,
  onClose,
  operators,
  onUpdateOperator,
  onSetQrExemption
}) => {
  const [selectedOp, setSelectedOp] = useState<Operator | null>(
    operators[0] || null
  );
  const [pin, setPin] = useState(operators[0]?.pin || '');
  const [role, setRole] = useState(operators[0]?.role || 'teknisyen');
  const [shortName, setShortName] = useState(operators[0]?.shortName || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New Operator Form
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'teknisyen' | 'bakimci'>(
    'teknisyen'
  );

  if (!isOpen) return null;

  const handleSelect = (op: Operator) => {
    setSelectedOp(op);
    setPin(op.pin);
    setRole(op.role);
    setShortName(op.shortName || '');
    setIsAddingNew(false);
    setSavedSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOp) return;

    await onUpdateOperator({
      ...selectedOp,
      pin,
      role: role as Operator['role'],
      shortName
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleAddNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPin.trim()) return;

    await onUpdateOperator({
      name: newName.trim(),
      shortName: newName.trim().slice(0, 10),
      pin: newPin.trim(),
      role: newRole,
      photo:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      qrExemptUntil: 0
    });

    setIsAddingNew(false);
    setNewName('');
    setNewPin('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-950 border border-amber-800 text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Operatör ve Yetki Ayarları (Admin)
              </h3>
              <p className="text-[11px] text-slate-400">
                PIN kodları, unvanlar ve QR muafiyet süreleri
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

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Operator sidebar list */}
          <div className="w-full md:w-56 bg-slate-950/80 border-r border-slate-800 p-3 overflow-y-auto space-y-1.5 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Teknisyenler
              </span>
              <button
                onClick={() => setIsAddingNew(true)}
                className="p-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 hover:bg-cyan-900 text-[11px] font-bold flex items-center gap-1"
                title="Yeni Operatör Ekle"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Ekle</span>
              </button>
            </div>

            {operators.map((op, opIdx) => (
              <button
                key={`op-set-${op.name}-${op.pin}-${opIdx}`}
                onClick={() => handleSelect(op)}
                className={`w-full text-left p-2 rounded-xl text-xs flex items-center gap-2.5 transition-all ${
                  !isAddingNew && selectedOp?.name === op.name
                    ? 'bg-blue-600 text-white font-bold shadow-md'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-850'
                }`}
              >
                <img
                  src={
                    op.photo ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                  }
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                />
                <div className="overflow-hidden">
                  <div className="truncate font-semibold">{op.name}</div>
                  <div className="text-[10px] opacity-80">
                    PIN: {op.pin} • {op.role}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Edit form area */}
          <div className="flex-1 p-4 overflow-y-auto text-xs space-y-4">
            {isAddingNew ? (
              <form onSubmit={handleAddNewSubmit} className="space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Yeni Operatör Kaydı
                </h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Ad Soyad:
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Örn: Caner YILDIZ"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Giriş PIN Kodu (4 Hane):
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Örn: 5566"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Yetki Rolü:
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) =>
                      setNewRole(e.target.value as Operator['role'])
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-cyan-500"
                  >
                    <option value="teknisyen">Teknisyen (Standart)</option>
                    <option value="bakimci">Bakımcı</option>
                    <option value="admin">Yönetici / Admin</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                  >
                    Kaydet
                  </button>
                </div>
              </form>
            ) : selectedOp ? (
              <form onSubmit={handleSave} className="space-y-3.5">
                <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <img
                    src={
                      selectedOp.photo ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                    }
                    alt=""
                    className="w-12 h-12 rounded-full object-cover border-2 border-cyan-500"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {selectedOp.name}
                    </h4>
                    <span className="text-[11px] text-cyan-400 font-semibold uppercase">
                      {selectedOp.role}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Kısa Ad:
                    </label>
                    <input
                      type="text"
                      value={shortName}
                      onChange={(e) => setShortName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Giriş PIN Kodu:
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Yetki Rolü:
                  </label>
                  <select
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value as Operator['role'])
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-cyan-500"
                  >
                    <option value="teknisyen">Teknisyen</option>
                    <option value="bakimci">Bakımcı</option>
                    <option value="admin">Yönetici / Admin</option>
                  </select>
                </div>

                {/* QR Code Exemption Setting */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                    <QrCode className="w-4 h-4" />
                    <span>Saha QR Muafiyet Süresi Tanımla:</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Bu süre boyunca operatör kamera ile QR okutmadan doğrudan arızaya başlayabilir:
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { hours: 0, label: 'Yok (Zorunlu QR)' },
                      { hours: 1, label: '1 Saat' },
                      { hours: 3, label: '3 Saat' },
                      { hours: -1, label: 'Sınırsız (Admin)' }
                    ].map((btn, bIdx) => (
                      <button
                        key={`qr-exempt-${btn.hours}-${bIdx}`}
                        type="button"
                        onClick={() =>
                          onSetQrExemption(selectedOp.name, btn.hours)
                        }
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-[10px] font-bold text-slate-200"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  {savedSuccess ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Güncellendi!
                    </span>
                  ) : (
                    <span />
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md shadow-cyan-600/20"
                  >
                    Değişiklikleri Kaydet
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
