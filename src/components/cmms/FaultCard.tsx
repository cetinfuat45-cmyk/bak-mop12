import React, { useState, useEffect } from 'react';
import {
  Clock,
  User,
  Users,
  AlertTriangle,
  CheckCircle2,
  Play,
  UserPlus,
  UserMinus,
  Check,
  ChevronRight,
  Shield,
  Tag,
  Calendar,
  FileText
} from 'lucide-react';
import { Fault, Operator, ViewSettings } from '../../types';
import { getFaultTypeConfig } from '../../utils/faultColors';

interface FaultCardProps {
  fault: Fault;
  currentOperator: Operator;
  viewSettings: ViewSettings;
  onStartIntervention: (fault: Fault) => void;
  onOpenInterventionModal: (fault: Fault) => void;
  onJoinHelper: (fault: Fault) => void;
  onLeaveHelper: (fault: Fault) => void;
  onReassign: (fault: Fault, newOpName: string) => void;
  allOperators: Operator[];
}

export const FaultCard: React.FC<FaultCardProps> = ({
  fault,
  currentOperator,
  viewSettings,
  onStartIntervention,
  onOpenInterventionModal,
  onJoinHelper,
  onLeaveHelper,
  onReassign,
  allOperators
}) => {
  // Live elapsed minutes counter if in progress
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0);

  useEffect(() => {
    if (fault.status === 'Müdahale Ediliyor' && fault.startedAt) {
      const update = () => {
        const diff = Math.max(
          0,
          Math.round(
            (Date.now() - new Date(fault.startedAt!).getTime()) / 60000
          )
        );
        setElapsedMinutes(diff);
      };
      update();
      const interval = setInterval(update, 30000);
      return () => clearInterval(interval);
    }
  }, [fault.status, fault.startedAt]);

  const isAssignedToMe = fault.assignedTo === currentOperator.name;
  const isHelper = fault.helpers && fault.helpers.includes(currentOperator.name);
  const isAdmin = currentOperator.role === 'admin';

  const typeConfig = getFaultTypeConfig(fault.faultType);
  const TypeIcon = typeConfig.icon;

  // Status visual formatting
  const getStatusBadge = () => {
    switch (fault.status) {
      case 'Müdahale Ediliyor':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 border border-emerald-600 text-emerald-400 shadow-sm shadow-emerald-900/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>MÜDAHALE EDİLİYOR</span>
          </span>
        );
      case 'Açık':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950 border border-amber-600 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>MÜDAHALE BEKLİYOR</span>
          </span>
        );
      case 'Parça Bekliyor':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-950 border border-indigo-600 text-indigo-300">
            <span>PARÇA BEKLİYOR</span>
          </span>
        );
      case 'Devredildi':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-950 border border-purple-600 text-purple-300">
            <span>VARDİYAYA DEVREDİLDİ</span>
          </span>
        );
      case 'Dış Servis Bekliyor':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-950 border border-orange-600 text-orange-300">
            <span>DIŞ SERVİS BEKLİYOR</span>
          </span>
        );
      case 'Geçici Çözüm':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-950 border border-yellow-600 text-yellow-300">
            <span>GEÇİCİ ÇÖZÜM</span>
          </span>
        );
      case 'Kapalı':
        return (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 border border-slate-700 text-slate-400">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>TAMAMLANDI</span>
            </span>
            {fault.syncedToSheets && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-700 text-emerald-400" title="Google E-Tabloya Kaydedildi">
                <span>E-Tablo ✓</span>
              </span>
            )}
          </div>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300">
            <span>{fault.status}</span>
          </span>
        );
    }
  };

  return (
    <div
      style={{
        borderLeft: `6px solid ${typeConfig.color}`,
        backgroundImage: `linear-gradient(135deg, ${typeConfig.color}18 0%, rgba(15, 23, 42, 0.95) 45%, rgba(15, 23, 42, 0.98) 100%)`,
        boxShadow: `0 4px 20px -2px ${typeConfig.color}25, 0 2px 6px -1px rgba(0, 0, 0, 0.4)`
      }}
      className={`rounded-2xl transition-all duration-200 overflow-hidden ${
        fault.status === 'Müdahale Ediliyor'
          ? isAssignedToMe
            ? 'border-r border-t border-b border-emerald-500/80 ring-1 ring-emerald-500/40'
            : 'border-r border-t border-b border-slate-700'
          : fault.status === 'Açık'
          ? 'border-r border-t border-b border-slate-800 hover:border-slate-700'
          : fault.status === 'Dış Servis Bekliyor'
          ? 'border-r border-t border-b border-amber-900/60 hover:border-amber-600/70'
          : fault.status === 'Parça Bekliyor'
          ? 'border-r border-t border-b border-indigo-900/60 hover:border-indigo-600/70'
          : 'border-r border-t border-b border-slate-800/80'
      }`}
    >
      {/* Top Distinct Color Bar */}
      <div
        className="h-1.5 w-full transition-opacity"
        style={{
          backgroundColor: typeConfig.color,
          boxShadow: `0 0 10px ${typeConfig.color}60`
        }}
      />

      {/* Top Card Bar */}
      <div className="p-3.5 pb-2.5 border-b border-slate-800/60 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold border transition-all shadow-md"
              style={{
                borderColor: typeConfig.color,
                color: typeConfig.color === '#FF0000' ? '#FFFFFF' : '#0F172A',
                backgroundColor: typeConfig.color,
                boxShadow: `0 0 12px ${typeConfig.color}50`
              }}
            >
              <TypeIcon className="w-3.5 h-3.5" />
              <span>{typeConfig.sheetName || fault.faultType}</span>
            </span>

            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider"
              style={{
                backgroundColor: `${typeConfig.color}20`,
                color: typeConfig.color,
                border: `1px solid ${typeConfig.color}50`
              }}
            >
              {typeConfig.color}
            </span>

            {fault.machineCode && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-300">
                {fault.machineCode}
              </span>
            )}

            {fault.priority === 'Acil' && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-950 border border-rose-600 text-rose-300 animate-pulse">
                ACİL
              </span>
            )}

            {fault.date && fault.date !== new Date().toLocaleDateString('tr-TR') && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-950/60 border border-amber-800/70 text-amber-300">
                {fault.date}
              </span>
            )}
          </div>

          <h3 className="text-sm font-bold text-white tracking-tight truncate">
            {fault.machine}
          </h3>
        </div>

        <div>{getStatusBadge()}</div>
      </div>

      {/* Description & Details */}
      <div className="p-3.5 text-xs text-slate-300 space-y-2.5">
        {viewSettings.showDescription && (
          <p className="text-slate-200 leading-relaxed font-medium line-clamp-2">
            {fault.description || 'Açıklama belirtilmemiş.'}
          </p>
        )}

        {/* Metadata info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-400 pt-1">
          {viewSettings.showReporter && (
            <span className="flex items-center gap-1">
              <span className="text-slate-500">Bildiren:</span>
              <span className="font-medium text-slate-300">
                {fault.reportedBy}
              </span>
            </span>
          )}

          {viewSettings.showShift && fault.shift && (
            <span className="flex items-center gap-1">
              <span className="text-slate-500">Vardiya:</span>
              <span className="font-medium text-slate-300">{fault.shift}</span>
            </span>
          )}

          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span>{fault.reportedAt || fault.date}</span>
          </span>
        </div>

        {/* Assigned Operator (Sadece Görevli Gözükür - Çalışma Henüz Başlamadı) */}
        {fault.assignedTo && fault.status !== 'Müdahale Ediliyor' && (
          <div className="mt-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold shrink-0 text-[10px]">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 font-medium">Görevli:</div>
                <div className="text-xs font-bold text-cyan-300 truncate">
                  {fault.assignedTo}{' '}
                  {isAssignedToMe && (
                    <span className="text-amber-400 font-semibold">(Size Atandı)</span>
                  )}
                </div>
              </div>
            </div>
            <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-400 font-medium">
              Görevli Belirlendi
            </span>
          </div>
        )}

        {/* Active Assignee & Helper status block (Sadece fiilen çalışma başladığında sayaç çalışır) */}
        {fault.status === 'Müdahale Ediliyor' && (
          <div className="mt-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-600/30 border border-emerald-500 flex items-center justify-center text-emerald-400 font-bold text-[10px]">
                <User className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Ana Sorumlu:</div>
                <div className="text-xs font-bold text-emerald-400">
                  {fault.assignedTo}{' '}
                  {isAssignedToMe && (
                    <span className="text-cyan-400 font-semibold">(Siz)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Live elapsed timer */}
            <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/50 px-2 py-1 rounded-lg border border-amber-800/60">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>{elapsedMinutes} dk</span>
            </div>
          </div>
        )}

        {/* Waiting note / last status note */}
        {(fault.status === 'Dış Servis Bekliyor' ||
          fault.status === 'Parça Bekliyor' ||
          fault.status === 'Devredildi' ||
          fault.status === 'Geçici Çözüm') &&
          fault.interventions &&
          fault.interventions.length > 0 && (
            <div className="mt-1.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 text-[11px] text-amber-300/90 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-slate-400 block text-[10px] uppercase">
                  Son Durum Notu:
                </span>
                <span className="line-clamp-2 text-slate-200">
                  {fault.interventions[fault.interventions.length - 1].action}
                </span>
              </div>
            </div>
          )}

        {/* Helpers chip tags */}
        {fault.helpers && fault.helpers.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-slate-500">Yardımcılar:</span>
            {fault.helpers.map((h, hIdx) => (
              <span
                key={`${h}-${hIdx}`}
                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-950 border border-cyan-800 text-cyan-300"
              >
                +{h}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer Bar */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between gap-2">
        {/* Admin quick reassign */}
        {isAdmin && (
          <div className="flex items-center gap-1.5">
            <select
              value={fault.assignedTo || ''}
              onChange={(e) => onReassign(fault, e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-[11px] rounded-lg px-2 py-1 outline-none hover:border-slate-500"
            >
              <option value="">Ata / Değiştir...</option>
              {allOperators.map((op, opIdx) => (
                <option key={`op-opt-${op.name}-${opIdx}`} value={op.name}>
                  {op.shortName || op.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Admin direct modal trigger for open or waiting faults */}
          {isAdmin && fault.status !== 'Müdahale Ediliyor' && (
            <button
              onClick={() => onOpenInterventionModal(fault)}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs transition-all"
              title="Yönetici Olarak Durumu Güncelle veya Kapat"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </button>
          )}

          {/* Unassigned / Open / Waiting for Parts or External Service state */}
          {(fault.status === 'Açık' ||
            fault.status === 'Parça Bekliyor' ||
            fault.status === 'Dış Servis Bekliyor' ||
            fault.status === 'Devredildi' ||
            fault.status === 'Geçici Çözüm') && (
            <button
              onClick={() => onStartIntervention(fault)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs text-white shadow-md transition-all active:scale-95 ${
                fault.status === 'Dış Servis Bekliyor'
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30 ring-1 ring-amber-500/50'
                  : fault.status === 'Parça Bekliyor'
                  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 ring-1 ring-indigo-500/50'
                  : fault.status === 'Devredildi'
                  ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                  : fault.status === 'Geçici Çözüm'
                  ? 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-600/30'
                  : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {fault.status === 'Dış Servis Bekliyor'
                  ? 'Servis Geldi / Devam Et'
                  : fault.status === 'Parça Bekliyor'
                  ? 'Parça Geldi / Devral'
                  : fault.status === 'Devredildi'
                  ? 'Devral / Başla'
                  : fault.status === 'Geçici Çözüm'
                  ? 'Kalıcı Çözüme Başla'
                  : 'Çalışmaya Başla'}
              </span>
            </button>
          )}

          {/* Active repair state: Primary technician controls */}
          {fault.status === 'Müdahale Ediliyor' && isAssignedToMe && (
            <button
              onClick={() => onOpenInterventionModal(fault)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Müdahaleyi Bitir / Güncelle</span>
            </button>
          )}

          {/* Active repair state: Other technician as Helper controls */}
          {fault.status === 'Müdahale Ediliyor' && !isAssignedToMe && (
            <>
              {isHelper ? (
                <button
                  onClick={() => onLeaveHelper(fault)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  <span>Bakımdan Ayrıl</span>
                </button>
              ) : (
                <button
                  onClick={() => onJoinHelper(fault)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Yardımcı Ol</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
