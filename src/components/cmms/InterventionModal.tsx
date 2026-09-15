import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Wrench,
  Sparkles,
  Users,
  Trash2,
  Plus,
  Info,
  RotateCw,
  Zap,
  Award
} from 'lucide-react';
import { Fault, Operator, SystemConfig } from '../../types';
import { soundEffects } from '../../services/soundEffects';

interface InterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  fault: Fault | null;
  currentOperator: Operator;
  config: SystemConfig;
  onSubmitClose: (params: {
    actionTaken: string;
    partsChanged: string;
    faultReason: string;
    stoppageReason: string;
    operatorName: string;
    minutes: number;
    helperMinutes?: Record<string, number>;
  }) => Promise<void>;
  onSubmitStatusUpdate: (
    status: Fault['status'],
    note?: string
  ) => Promise<void>;
}

export const InterventionModal: React.FC<InterventionModalProps> = ({
  isOpen,
  onClose,
  fault,
  currentOperator,
  config,
  onSubmitClose,
  onSubmitStatusUpdate
}) => {
  const [targetStatus, setTargetStatus] = useState<Fault['status']>('Kapalı');
  const [actionTaken, setActionTaken] = useState('');
  const [partsChanged, setPartsChanged] = useState('');
  const [faultReason, setFaultReason] = useState(config.faultReasons[0] || '');
  const [stoppageReason, setStoppageReason] = useState(
    config.stoppageReasons[0] || ''
  );
  const [minutes, setMinutes] = useState<number>(30);
  const [activeHelpers, setActiveHelpers] = useState<string[]>([]);
  const [helperMinutes, setHelperMinutes] = useState<Record<string, number>>({});
  const [selectedNewHelper, setSelectedNewHelper] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const calculateAutoTimes = useCallback(() => {
    if (!fault) return;

    let initMins = 1;
    const startTime = fault.startedAt || fault.createdAt;
    if (startTime) {
      initMins = Math.max(
        1,
        Math.round((Date.now() - new Date(startTime).getTime()) / 60000)
      );
    }
    setMinutes(initMins);

    const helpersObj: Record<string, number> = {};
    activeHelpers.forEach((h, idx) => {
      if (fault.helperJoinedAt && fault.helperJoinedAt[h]) {
        const joinedMs = new Date(fault.helperJoinedAt[h]).getTime();
        const elapsed = Math.max(1, Math.round((Date.now() - joinedMs) / 60000));
        helpersObj[h] = Math.min(elapsed, initMins);
      } else {
        // Fallback for legacy faults where helperJoinedAt wasn't recorded
        const elapsed = Math.max(1, Math.min(initMins, Math.round(initMins * (1 / (idx + 1.5)))));
        helpersObj[h] = Math.min(elapsed, initMins);
      }
    });
    setHelperMinutes(helpersObj);
  }, [fault, activeHelpers]);

  useEffect(() => {
    if (fault) {
      setTargetStatus('Kapalı');
      setActionTaken(fault.actionTaken || '');
      setPartsChanged(fault.partsChanged || '');
      setFaultReason(fault.faultReason || config.faultReasons[0] || '');
      setStoppageReason(
        fault.stoppageReason || config.stoppageReasons[0] || ''
      );
      setValidationError(null);

      // Calculate initial minutes automatically from startedAt / createdAt
      let initMins = 1;
      const startTime = fault.startedAt || fault.createdAt;
      if (startTime) {
        initMins = Math.max(
          1,
          Math.round((Date.now() - new Date(startTime).getTime()) / 60000)
        );
      }
      setMinutes(initMins);

      // Initialize helpers & auto-calculated durations
      const currentHelpers =
        fault.helpers && fault.helpers.length > 0 ? [...fault.helpers] : [];
      setActiveHelpers(currentHelpers);

      const helpersObj: Record<string, number> = {};
      currentHelpers.forEach((h, idx) => {
        if (fault.helperJoinedAt && fault.helperJoinedAt[h]) {
          // Join timestamp exists: calculate actual elapsed time since joining
          const joinedMs = new Date(fault.helperJoinedAt[h]).getTime();
          const elapsed = Math.max(1, Math.round((Date.now() - joinedMs) / 60000));
          helpersObj[h] = Math.min(elapsed, initMins);
        } else {
          // Fallback for legacy faults
          const elapsed = Math.max(1, Math.min(initMins, Math.round(initMins * (1 / (idx + 1.5)))));
          helpersObj[h] = Math.min(elapsed, initMins);
        }
      });
      setHelperMinutes(helpersObj);
    }
  }, [fault, config]);

  const handleRemoveHelper = (helperName: string) => {
    setActiveHelpers((prev) => prev.filter((h) => h !== helperName));
    setHelperMinutes((prev) => {
      const next = { ...prev };
      delete next[helperName];
      return next;
    });
  };

  const handleAddHelper = (helperName: string) => {
    if (!helperName || activeHelpers.includes(helperName)) return;
    setActiveHelpers((prev) => [...prev, helperName]);
    const autoDuration = Math.max(1, Math.min(10, Math.floor(minutes / (activeHelpers.length + 2)) || 1));
    setHelperMinutes((prev) => ({
      ...prev,
      [helperName]: autoDuration
    }));
    setSelectedNewHelper('');
  };

  if (!isOpen || !fault) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (targetStatus === 'Kapalı') {
      if (!actionTaken.trim()) {
        setValidationError('Lütfen yapılan işlemi detaylıca açıklayınız.');
        return;
      }
      if (!faultReason) {
        setValidationError('Lütfen arıza nedenini seçiniz.');
        return;
      }
      if (!stoppageReason) {
        setValidationError('Lütfen duruş nedenini seçiniz.');
        return;
      }

      setSubmitting(true);
      try {
        // Collect only active helpers with positive minutes
        const finalHelperMinutes: Record<string, number> = {};
        activeHelpers.forEach((h) => {
          const val = Number(helperMinutes[h]) || 0;
          if (val > 0) {
            finalHelperMinutes[h] = Math.min(val, Number(minutes) || 1);
          }
        });

        await onSubmitClose({
          actionTaken: actionTaken.trim(),
          partsChanged: partsChanged.trim(),
          faultReason,
          stoppageReason,
          operatorName: currentOperator.name,
          minutes: Number(minutes) || 1,
          helperMinutes: finalHelperMinutes
        });
        soundEffects.playCompleteFanfare();
        onClose();
      } catch (err) {
        setValidationError('Kayıt esnasında bir hata oluştu.');
      } finally {
        setSubmitting(false);
      }
    } else {
      // Changing status without closing (Parça Bekliyor, Devredildi vb.)
      setSubmitting(true);
      try {
        await onSubmitStatusUpdate(targetStatus, note);
        soundEffects.playSuccessBeep();
        onClose();
      } catch {
        setValidationError('Durum güncellenirken bir hata oluştu.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white truncate max-w-xs">
                Müdahale Tamamlama / Durum Güncelleme
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-xs">
                {fault.machine} ({fault.faultType})
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

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-4 overflow-y-auto space-y-4 flex-1 text-xs"
        >
          {validationError && (
            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Status Selector Pills */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Yeni Durum Seçimi:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'Kapalı', label: '✅ Kapalı (Çözüldü)' },
                { id: 'Parça Bekliyor', label: '⏳ Parça Bekliyor' },
                { id: 'Devredildi', label: '🔄 Vardiyaya Devir' },
                { id: 'Dış Servis Bekliyor', label: '🚚 Dış Servis' },
                { id: 'Geçici Çözüm', label: '⚠️ Geçici Çözüm' }
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setTargetStatus(st.id as Fault['status'])}
                  className={`p-2 rounded-xl font-bold text-xs border text-left transition-all ${
                    targetStatus === st.id
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* If KAPALI: Root Cause, Stoppage Reason, Action Taken */}
          {targetStatus === 'Kapalı' ? (
            <>
              {/* Duration and Operator */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Toplam Müdahale Süresi:
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-slate-900 border border-cyan-500/40 rounded-xl text-cyan-300 font-black text-sm flex items-center gap-1.5 shadow-inner">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span>{minutes}</span>
                      <span className="text-slate-400 font-semibold text-xs">dakika</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 text-[10px] font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      Otomatik
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Kapatan Teknisyen:
                  </label>
                  <div className="py-1.5 text-xs font-bold text-emerald-400 truncate">
                    {currentOperator.name}
                  </div>
                </div>
              </div>

              {/* Helper technicians time allocation */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                      Yardımcı Teknisyen Süreleri:
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">
                      {activeHelpers.length} Yardımcı
                    </span>
                    <button
                      type="button"
                      onClick={calculateAutoTimes}
                      className="px-2 py-0.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 hover:text-white hover:bg-cyan-900 text-[10px] font-bold flex items-center gap-1 transition-all"
                      title="Şu anki zamana göre süreleri yeniden otomatik hesapla"
                    >
                      <RotateCw className="w-3 h-3 text-cyan-400" />
                      <span>Oto Hesapla</span>
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-800/40 text-[10px] text-cyan-200 leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                    <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Otomatik Süre & Performans Kaydı:</span>
                  </div>
                  <p className="text-slate-300 pl-5">
                    Süreler sistem tarafından katılım anından itibaren <b>otomatik hesaplanır (elle giriş yapılamaz)</b>. Arıza kapatıldığında Bakım Loguna (Google E-Tablo Sütun I: <i>"OPERATÖR YARDIMCI OLDU (X dk)"</i>) ve teknisyen performans değerlendirmesine otomatik işlenir.
                  </p>
                </div>

                {activeHelpers.length > 0 ? (
                  <div className="space-y-2">
                    {activeHelpers.map((h, hIdx) => {
                      const joinedAt = fault.helperJoinedAt?.[h];
                      let joinedText = '';
                      if (joinedAt) {
                        try {
                          const jDate = new Date(joinedAt);
                          const jTime = jDate.toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                          joinedText = `${jTime}'de katıldı`;
                        } catch {
                          // ignore date format error
                        }
                      }

                      const currentVal = helperMinutes[h] !== undefined ? helperMinutes[h] : 0;

                      return (
                        <div
                          key={`${h}-${hIdx}`}
                          className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-200 font-bold text-xs truncate">
                                {h}
                              </span>
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 flex items-center gap-0.5">
                                <Zap className="w-2.5 h-2.5 text-amber-400" />
                                Otomatik Süre
                              </span>
                            </div>
                            <span className="text-[10px] text-cyan-400/90 font-medium block mt-0.5">
                              {joinedText ? `${joinedText} • Sistem süresi: ${currentVal} dk` : `Sistem tarafından hesaplanan süre: ${currentVal} dk`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="px-3 py-1.5 bg-slate-950 border border-cyan-500/40 rounded-xl text-cyan-300 font-black text-sm flex items-center gap-1.5 shadow-inner">
                              <Clock className="w-3.5 h-3.5 text-cyan-400" />
                              <span>{currentVal}</span>
                              <span className="text-slate-400 text-xs font-semibold">dk</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveHelper(h)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                              title="Bu yardımcıyı listeden çıkar (arıza sürecinde bulunmadı)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-2 text-xs text-slate-500 italic">
                    Kayıtlı yardımcı teknisyen bulunmuyor.
                  </div>
                )}

                {/* Add another helper technician */}
                <div className="pt-1 border-t border-slate-800/80 flex items-center gap-2">
                  <select
                    value={selectedNewHelper}
                    onChange={(e) => setSelectedNewHelper(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                  >
                    <option value="">+ Yardımcı Teknisyen Ekle...</option>
                    {config.operators
                      .filter(
                        (op) =>
                          op.name !== currentOperator.name &&
                          !activeHelpers.includes(op.name)
                      )
                      .map((op) => (
                        <option key={`add-helper-${op.name}`} value={op.name}>
                          {op.name}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedNewHelper}
                    onClick={() => handleAddHelper(selectedNewHelper)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ekle</span>
                  </button>
                </div>
              </div>

              {/* Arıza Nedeni */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Arıza Nedeni (Kök Neden) *
                </label>
                <select
                  value={faultReason}
                  onChange={(e) => setFaultReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                >
                  {config.faultReasons.map((r, rIdx) => (
                    <option key={`fr-${r}-${rIdx}`} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duruş Nedeni */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Duruş Nedeni *
                </label>
                <select
                  value={stoppageReason}
                  onChange={(e) => setStoppageReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                >
                  {config.stoppageReasons.map((s, sIdx) => (
                    <option key={`sr-${s}-${sIdx}`} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Yapılan İşlem */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Yapılan İşlem / Müdahale Açıklaması *
                </label>
                <textarea
                  rows={3}
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="Arıza nasıl giderildi? Hangi ayarlar yapıldı? Detaylıca yazınız..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                />
              </div>

              {/* Değişen Parça */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Değişen Parça / Malzeme (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={partsChanged}
                  onChange={(e) => setPartsChanged(e.target.value)}
                  placeholder="Değişen rulman, sensör, conta, filtre kodu veya adı..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                />
              </div>
            </>
          ) : (
            /* If Parça Bekliyor / Devredildi: note box */
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Durum Açıklaması / Devir Notu:
              </label>
              <textarea
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Beklenen parça veya sonraki vardiyaya aktarılacak detaylı not..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
              />
            </div>
          )}

          {/* Submit Footer */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-750 font-semibold"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Kaydediliyor...'
                  : targetStatus === 'Kapalı'
                  ? 'Arızayı Kapat & Kaydet'
                  : 'Durumu Güncelle'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
