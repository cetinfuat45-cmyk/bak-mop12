import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Wrench,
  ChevronRight,
  ChevronLeft,
  Check,
  Zap,
  HelpCircle,
  Timer,
  Tag,
  UserCheck,
  ChevronDown,
  Package,
  Repeat,
  Truck,
  ShieldAlert,
  LogOut,
  History
} from 'lucide-react';
import { Fault, Operator, SystemConfig } from '../../types';
import { soundEffects } from '../../services/soundEffects';
import { getFaultTypeConfig } from '../../utils/faultColors';

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
    note?: string,
    minutes?: number
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
  // Step state: 1: Durum, 2: Kök Neden & Duruş (Açılır Listeler), 3: Yapılan İş & Parça
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [targetStatus, setTargetStatus] = useState<Fault['status']>('Kapalı');
  const [actionTaken, setActionTaken] = useState('');
  const [partsChanged, setPartsChanged] = useState('');
  const [faultReason, setFaultReason] = useState(config.faultReasons[0] || '');
  const [stoppageReason, setStoppageReason] = useState(
    config.stoppageReasons[0] || ''
  );
  const [minutes, setMinutes] = useState<number>(30);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize and reset on open/fault change
  useEffect(() => {
    if (fault) {
      setCurrentStep(1);
      setTargetStatus('Kapalı');
      setActionTaken(fault.actionTaken || '');
      setPartsChanged(fault.partsChanged || '');
      setFaultReason(fault.faultReason || config.faultReasons[0] || 'Mekanik Aşınma');
      setStoppageReason(
        fault.stoppageReason || config.stoppageReasons[0] || 'Arıza Duruşu'
      );
      setNote('');
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
    }
  }, [fault, config]);

  if (!isOpen || !fault) return null;

  const availableFaultReasons = Array.from(
    new Set([
      ...(fault.faultReason ? [fault.faultReason] : []),
      ...(config.faultReasons || [])
    ])
  ).filter(Boolean);

  const availableStoppageReasons = Array.from(
    new Set([
      ...(fault.stoppageReason ? [fault.stoppageReason] : []),
      ...(config.stoppageReasons || [])
    ])
  ).filter(Boolean);

  // Step transitions & validation
  const goToNextStep = () => {
    setValidationError(null);
    if (currentStep === 1) {
      if (targetStatus === 'Kapalı') {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (!faultReason) {
        setValidationError('Lütfen bir arıza kök nedeni seçiniz.');
        return;
      }
      if (!stoppageReason) {
        setValidationError('Lütfen bir duruş nedeni seçiniz.');
        return;
      }
      setCurrentStep(3);
    }
  };

  const goToPrevStep = () => {
    setValidationError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Quick Action Templates
  const actionTemplates = [
    'Parça temizlendi, ayarları yapıldı ve test edildi.',
    'Mekanik sıkışma giderildi, yağlama yapıldı.',
    'Aşınan parça yenisiyle değiştirildi, kalibrasyon sağlandı.',
    'Elektrik bağlantısı ve sensör kontrolleri yapıldı.',
    'Hava basıncı ayarlandı, kaçak giderildi.'
  ];

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (targetStatus === 'Kapalı') {
      if (!actionTaken.trim()) {
        setValidationError('Lütfen yapılan işlemi kısaca belirtiniz.');
        return;
      }
      if (!faultReason) {
        setValidationError('Lütfen arıza kök nedenini seçiniz.');
        return;
      }
      if (!stoppageReason) {
        setValidationError('Lütfen duruş nedenini seçiniz.');
        return;
      }

      setSubmitting(true);
      try {
        await onSubmitClose({
          actionTaken: actionTaken.trim(),
          partsChanged: partsChanged.trim(),
          faultReason,
          stoppageReason,
          operatorName: currentOperator.name,
          minutes: Number(minutes) || 1
        });
        soundEffects.playCompleteFanfare();
        onClose();
      } catch {
        setValidationError('Kayıt esnasında bir hata oluştu.');
      } finally {
        setSubmitting(false);
      }
    } else {
      // Direct intermediate status update (Parça Bekliyor, Devredildi, Arızadan Çıkma vb.)
      setSubmitting(true);
      try {
        await onSubmitStatusUpdate(
          targetStatus,
          note.trim(),
          Number(minutes) || 1
        );
        soundEffects.playSuccessBeep();
        onClose();
      } catch {
        setValidationError('Durum güncellenirken bir hata oluştu.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const faultTypeConfig = getFaultTypeConfig(fault.faultType);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">
                Müdahale Tamamlama
              </h3>
              <p
                className="text-xs font-extrabold truncate"
                style={{ color: faultTypeConfig.color }}
              >
                {fault.machine} ({faultTypeConfig.shortName || fault.faultType})
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

        {/* Step Indicator (Only active when Kapalı is selected) */}
        {targetStatus === 'Kapalı' && (
          <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { num: 1, label: 'Kapatma' },
                { num: 2, label: 'Kök & Duruş' },
                { num: 3, label: 'İş & Parça' }
              ].map((s) => {
                const isActive = currentStep === s.num;
                const isPassed = currentStep > s.num;
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => {
                      if (isPassed) setCurrentStep(s.num);
                    }}
                    disabled={!isPassed && !isActive}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                      isActive
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/30'
                        : isPassed
                        ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/40'
                        : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950'
                          : isPassed
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isPassed ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : s.num}
                    </span>
                    <span className="truncate">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form
          onSubmit={handleFinalSubmit}
          className="p-4 overflow-y-auto space-y-4 flex-1 text-xs"
        >
          {validationError && (
            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-300 flex items-center gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-semibold">{validationError}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 1: KAPATMA / DURUM SEÇİMİ */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                  1. Adım: Müdahale Sonucu / Durum Seçimi
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      id: 'Kapalı',
                      label: 'Kapalı (Çözüldü)',
                      desc: 'Arıza giderildi, makine üretime hazır',
                      badge: 'Önerilen',
                      icon: CheckCircle2,
                      titleColor: 'text-emerald-300',
                      badgeCls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                      iconCls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
                      activeCls: 'bg-emerald-950 border-emerald-400 text-white ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-950/70',
                      inactiveCls: 'bg-emerald-950/25 border-emerald-800/60 text-emerald-200/90 hover:bg-emerald-950/45 hover:border-emerald-600'
                    },
                    {
                      id: 'Parça Bekliyor',
                      label: 'Parça Bekliyor',
                      desc: 'Yedek parça temini gerekiyor',
                      badge: 'Yedek Parça',
                      icon: Package,
                      titleColor: 'text-amber-300',
                      badgeCls: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                      iconCls: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
                      activeCls: 'bg-amber-950 border-amber-400 text-white ring-2 ring-amber-500/50 shadow-lg shadow-amber-950/70',
                      inactiveCls: 'bg-amber-950/25 border-amber-800/60 text-amber-200/90 hover:bg-amber-950/45 hover:border-amber-600'
                    },
                    {
                      id: 'Devredildi',
                      label: 'Vardiyaya Devir',
                      desc: 'Sonraki vardiya ekibine aktarıldı',
                      badge: 'Devir',
                      icon: Repeat,
                      titleColor: 'text-sky-300',
                      badgeCls: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
                      iconCls: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
                      activeCls: 'bg-sky-950 border-sky-400 text-white ring-2 ring-sky-500/50 shadow-lg shadow-sky-950/70',
                      inactiveCls: 'bg-sky-950/25 border-sky-800/60 text-sky-200/90 hover:bg-sky-950/45 hover:border-sky-600'
                    },
                    {
                      id: 'Açık',
                      label: 'Arızadan Çık (Açık Bırak)',
                      desc: 'Başka acil arıza veya mola için müdahaleyi bırak',
                      badge: 'Arızadan Çık',
                      icon: LogOut,
                      titleColor: 'text-rose-300',
                      badgeCls: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                      iconCls: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
                      activeCls: 'bg-rose-950 border-rose-400 text-white ring-2 ring-rose-500/50 shadow-lg shadow-rose-950/70',
                      inactiveCls: 'bg-rose-950/25 border-rose-800/60 text-rose-200/90 hover:bg-rose-950/45 hover:border-rose-600'
                    },
                    {
                      id: 'Dış Servis Bekliyor',
                      label: 'Dış Servis',
                      desc: 'Yetkili servis müdahalesi gerektirir',
                      badge: 'Yetkili Servis',
                      icon: Truck,
                      titleColor: 'text-purple-300',
                      badgeCls: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
                      iconCls: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
                      activeCls: 'bg-purple-950 border-purple-400 text-white ring-2 ring-purple-500/50 shadow-lg shadow-purple-950/70',
                      inactiveCls: 'bg-purple-950/25 border-purple-800/60 text-purple-200/90 hover:bg-purple-950/45 hover:border-purple-600'
                    },
                    {
                      id: 'Geçici Çözüm',
                      label: 'Geçici Çözüm',
                      desc: 'Geçici çalışma sağlandı, kalıcı bakım gerekli',
                      badge: 'Kalıcı Bakım',
                      icon: ShieldAlert,
                      titleColor: 'text-amber-200',
                      badgeCls: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
                      iconCls: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                      activeCls: 'bg-amber-950 border-amber-400 text-white ring-2 ring-amber-500/50 shadow-lg shadow-amber-950/70',
                      inactiveCls: 'bg-amber-950/25 border-amber-800/60 text-amber-200/90 hover:bg-amber-950/45 hover:border-amber-600'
                    }
                  ].map((st) => {
                    const isSelected = targetStatus === st.id;
                    const StatusIcon = st.icon;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setTargetStatus(st.id as Fault['status']);
                          setValidationError(null);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all relative ${
                          isSelected ? st.activeCls : st.inactiveCls
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center border ${st.iconCls} shrink-0`}
                            >
                              <StatusIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className={`font-bold text-xs ${st.titleColor}`}>
                              {st.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {st.badge && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${st.badgeCls}`}
                              >
                                {st.badge}
                              </span>
                            )}
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-white text-slate-950 flex items-center justify-center shrink-0">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-300 pl-8 leading-snug">
                          {st.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* If NOT Kapalı: Elapsed Minutes + Status note box + Past logs */}
              {targetStatus !== 'Kapalı' && (
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 animate-fadeIn">
                  {/* Elapsed Minutes Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Müdahale Süreniz (Dakika) *</span>
                      </label>
                      <span className="text-[10px] text-cyan-300 font-semibold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                        Otomatik Süre
                      </span>
                    </div>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="number"
                        min={1}
                        value={minutes}
                        onChange={(e) => setMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      💡 Bu süre haftalık bakım performansınıza ve Google E-Tablo arıza loguna (
                      <span className="text-cyan-300 font-semibold">
                        {targetStatus === 'Devredildi'
                          ? 'VARDİYAYA DEVRETTİ'
                          : targetStatus === 'Parça Bekliyor'
                          ? 'PARÇA BEKLİYOR'
                          : targetStatus === 'Açık'
                          ? 'ARIZADAN ÇIKTI'
                          : targetStatus}
                      </span>
                      ) olarak kaydedilir.
                    </p>
                  </div>

                  {/* Note input with contextual placeholder */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                      {targetStatus === 'Devredildi'
                        ? 'Vardiya Devir Notu:'
                        : targetStatus === 'Parça Bekliyor'
                        ? 'Beklenen Parça & Durum Açıklaması:'
                        : targetStatus === 'Açık'
                        ? 'Arızadan Ayrılma Nedeni:'
                        : targetStatus === 'Dış Servis Bekliyor'
                        ? 'Dış Servis Talep Notu:'
                        : 'Geçici Çözüm Detayı:'}
                    </label>
                    <textarea
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={
                        targetStatus === 'Devredildi'
                          ? 'Sonraki vardiyaya aktarılacak detaylı not (Yapılan işlem ve kalan iş)...'
                          : targetStatus === 'Parça Bekliyor'
                          ? 'Hangi parça bekleniyor? (Örn: 6204 rulman ambar talebi açıldı)...'
                          : targetStatus === 'Açık'
                          ? 'Müdahaleden ayrılma sebebi (Örn: Acil başka hatta çağrıldı, mola)...'
                          : targetStatus === 'Dış Servis Bekliyor'
                          ? 'Yetkili servis çağırma nedeni ve arıza özeti...'
                          : 'Uygulanan geçici bypass veya tamir detayı...'
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Previous Intervention Logs if any */}
                  {fault.interventions && fault.interventions.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <History className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Arıza Müdahale & Devir Geçmişi (Önceki Loglar)</span>
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto text-[11px]">
                        {fault.interventions.map((inv, idx) => (
                          <div
                            key={`prior-inv-${idx}`}
                            className="flex items-start justify-between gap-2 p-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-slate-300"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-white">
                                {inv.operator}
                              </span>
                              <span className="text-slate-400 ml-1">
                                {inv.action}
                              </span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold text-[10px] shrink-0">
                              {inv.minutes} dk
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: KÖK NEDEN & DURUŞ NEDENİ (AÇILIR LİSTELER) */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-white uppercase tracking-wider">
                    2. Adım: Kök Neden & Duruş Nedeni
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Arıza kök nedenini ve makine duruş tipini aşağıdaki açılır listelerden seçiniz.
                  </p>
                </div>
                <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1 bg-cyan-950/80 px-2 py-1 rounded-lg border border-cyan-800">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Açılır Listeler
                </span>
              </div>

              {/* Arıza Kök Nedeni - Açılır Liste */}
              <div className="space-y-2 p-3.5 bg-slate-950 rounded-2xl border border-slate-800 focus-within:border-cyan-500 transition-all">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-cyan-400" />
                    <span>Arıza Kök Nedeni</span>
                  </label>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-cyan-950/90 border border-cyan-800 text-cyan-300 max-w-[200px] truncate">
                    {faultReason || 'Seçilmedi'}
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={faultReason}
                    onChange={(e) => {
                      setFaultReason(e.target.value);
                      setValidationError(null);
                    }}
                    className="w-full px-3.5 py-3 bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 rounded-xl text-sm font-bold text-white outline-none cursor-pointer appearance-none pr-10 transition-colors"
                  >
                    {availableFaultReasons.map((r, rIdx) => (
                      <option key={`fr-opt-${r}-${rIdx}`} value={r} className="bg-slate-900 text-white py-1.5">
                        {r}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Duruş Nedeni - Açılır Liste */}
              <div className="space-y-2 p-3.5 bg-slate-950 rounded-2xl border border-slate-800 focus-within:border-amber-500 transition-all">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-amber-400" />
                    <span>Duruş Nedeni</span>
                  </label>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-950/90 border border-amber-800 text-amber-300 max-w-[200px] truncate">
                    {stoppageReason || 'Seçilmedi'}
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={stoppageReason}
                    onChange={(e) => {
                      setStoppageReason(e.target.value);
                      setValidationError(null);
                    }}
                    className="w-full px-3.5 py-3 bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-sm font-bold text-white outline-none cursor-pointer appearance-none pr-10 transition-colors"
                  >
                    {availableStoppageReasons.map((s, sIdx) => (
                      <option key={`sr-opt-${s}-${sIdx}`} value={s} className="bg-slate-900 text-white py-1.5">
                        {s}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Bilgilendirme ve Özet Kutusu */}
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs text-slate-400 gap-2">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-[10px] text-slate-500">Kök:</span>
                  <strong className="text-cyan-300 truncate">{faultReason}</strong>
                </div>
                <div className="h-4 w-px bg-slate-800 shrink-0" />
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-[10px] text-slate-500">Duruş:</span>
                  <strong className="text-amber-300 truncate">{stoppageReason}</strong>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: YAPILAN İŞLEM & KULLANILAN PARÇA */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <div className="space-y-3.5 animate-fadeIn">
              {/* Summary pill banner */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Süre:</span>
                    <span className="text-xs font-black text-cyan-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {minutes} dk
                    </span>
                  </div>
                  <div className="h-6 w-px bg-slate-800" />
                  <div>
                    <span className="text-[10px] text-slate-500 block">Kapatan:</span>
                    <span className="text-xs font-bold text-emerald-400">
                      {currentOperator.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-lg bg-cyan-950 border border-cyan-800 text-[10px] font-semibold text-cyan-300">
                    Kök: {faultReason}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-300">
                    Duruş: {stoppageReason}
                  </span>
                </div>
              </div>

              {/* Helpers Summary Box */}
              {((fault.interventions && fault.interventions.some((i) => i.role === 'helper' && i.operator)) ||
                (fault.helpers && fault.helpers.length > 0)) && (
                <div className="p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-800/60 text-[11px] space-y-1 animate-fadeIn">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Arızaya Katkı Sağlayan Yardımcı Teknisyenler:</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap text-slate-300">
                    {/* Previously finished helpers */}
                    {fault.interventions &&
                      fault.interventions
                        .filter((i) => i.role === 'helper' && i.operator)
                        .map((i, idx) => (
                          <span
                            key={`modal-past-h-${idx}`}
                            className="px-2 py-0.5 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 font-semibold text-[10px]"
                          >
                            ✓ {i.operator} ({i.minutes} dk - Loga eklendi)
                          </span>
                        ))}
                    {/* Still active helpers */}
                    {fault.helpers &&
                      fault.helpers.map((h, idx) => (
                        <span
                          key={`modal-act-h-${idx}`}
                          className="px-2 py-0.5 rounded-lg bg-cyan-950 border border-cyan-700 text-cyan-300 font-semibold text-[10px]"
                        >
                          ⏳ {h} (Kapatılınca süre otomatik hesaplanıp işlenecek)
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Yapılan İşlem */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    3. Adım: Yapılan İşlem / Müdahale Özeti *
                  </label>
                  <span className="text-[10px] text-slate-500">Zorunlu</span>
                </div>
                <textarea
                  rows={3}
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="Arıza nasıl giderildi? Yapılan müdahaleyi yazınız..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                />

                {/* Quick Templates */}
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-medium">Hızlı Şablon:</span>
                  {actionTemplates.slice(0, 3).map((tpl, tIdx) => (
                    <button
                      key={`tpl-${tIdx}`}
                      type="button"
                      onClick={() => setActionTaken(tpl)}
                      className="px-2 py-0.5 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-400 hover:text-cyan-300 transition-colors truncate max-w-[200px]"
                      title={tpl}
                    >
                      {tpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Değişen / Kullanılan Parça */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Değişen / Kullanılan Parça (Opsiyonel)
                </label>
                <div className="relative">
                  <Wrench className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={partsChanged}
                    onChange={(e) => setPartsChanged(e.target.value)}
                    placeholder="Rulman, sensör, conta kodu veya malzeme adı..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP FOOTER NAVIGATION */}
          {/* ======================================================== */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            {/* Left Button: Cancel or Back */}
            {currentStep === 1 ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-750 font-semibold"
              >
                İptal
              </button>
            ) : (
              <button
                type="button"
                onClick={goToPrevStep}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Geri</span>
              </button>
            )}

            {/* Right Button: Next or Submit */}
            {targetStatus !== 'Kapalı' ? (
              <button
                type="submit"
                disabled={submitting}
                className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 text-xs text-white ${
                  targetStatus === 'Devredildi'
                    ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/30'
                    : targetStatus === 'Parça Bekliyor'
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                    : targetStatus === 'Açık'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                    : targetStatus === 'Dış Servis Bekliyor'
                    ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                    : 'bg-amber-700 hover:bg-amber-600 shadow-amber-700/30'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {submitting
                    ? 'Kaydediliyor...'
                    : targetStatus === 'Devredildi'
                    ? 'Vardiyaya Devret & Süreyi Logla'
                    : targetStatus === 'Parça Bekliyor'
                    ? 'Parça Beklemeye Al & Süreyi Logla'
                    : targetStatus === 'Açık'
                    ? 'Arızadan Çık & Süreyi Logla'
                    : targetStatus === 'Dış Servis Bekliyor'
                    ? 'Dış Servise Devret & Logla'
                    : 'Geçici Çözümü Kaydet & Logla'}
                </span>
              </button>
            ) : currentStep < 3 ? (
              <button
                type="button"
                onClick={goToNextStep}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-600/30 transition-all active:scale-95"
              >
                <span>İleri</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-1.5 shadow-xl shadow-emerald-600/40 transition-all active:scale-95 text-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Kapatılıyor...' : 'Arızayı Kapat & Tamamla'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
