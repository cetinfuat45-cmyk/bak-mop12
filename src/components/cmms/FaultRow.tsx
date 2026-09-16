import React, { useState, useEffect } from 'react';
import {
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Play,
  UserPlus,
  UserMinus,
  Calendar,
  Check
} from 'lucide-react';
import { Fault, Operator, ViewSettings } from '../../types';
import { getFaultTypeConfig, formatShortOperatorName, cleanFaultTypeName } from '../../utils/faultColors';

interface FaultRowProps {
  fault: Fault;
  currentOperator: Operator;
  viewSettings: ViewSettings;
  onStartIntervention: (fault: Fault) => void;
  onOpenInterventionModal: (fault: Fault) => void;
  onJoinHelper: (fault: Fault) => void;
  onLeaveHelper: (fault: Fault) => void;
  onReassign: (fault: Fault, newOpName: string) => void;
  allOperators: Operator[];
  hideTypeBadge?: boolean;
}

export const FaultRow: React.FC<FaultRowProps> = ({
  fault,
  currentOperator,
  viewSettings,
  onStartIntervention,
  onOpenInterventionModal,
  onJoinHelper,
  onLeaveHelper,
  onReassign,
  allOperators,
  hideTypeBadge = false
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

  // Status visual badge
  const renderStatusBadge = () => {
    switch (fault.status) {
      case 'Müdahale Ediliyor':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-950 border border-emerald-500 text-emerald-300 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>MÜDAHALE EDİLİYOR</span>
            <span className="ml-1 text-[10px] font-mono text-amber-300 bg-amber-950/80 px-1 rounded border border-amber-700/60">
              {elapsedMinutes} dk
            </span>
          </span>
        );
      case 'Açık':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/90 border border-amber-600/80 text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>MÜDAHALE BEKLİYOR</span>
          </span>
        );
      case 'Parça Bekliyor':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-950 border border-indigo-600 text-indigo-300">
            <span>PARÇA BEKLİYOR</span>
          </span>
        );
      case 'Devredildi':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-950 border border-purple-600 text-purple-300">
            <span>VARDİYAYA DEVREDİLDİ</span>
          </span>
        );
      case 'Dış Servis Bekliyor':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-950 border border-orange-600 text-orange-300">
            <span>DIŞ SERVİS BEKLİYOR</span>
          </span>
        );
      case 'Geçici Çözüm':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-yellow-950 border border-yellow-600 text-yellow-300">
            <span>GEÇİCİ ÇÖZÜM</span>
          </span>
        );
      case 'Kapalı':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>TAMAMLANDI</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
            <span>{fault.status}</span>
          </span>
        );
    }
  };

  return (
    <div
      className={`group relative flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 sm:px-4 sm:py-3 rounded-xl border transition-all duration-150 hover:bg-slate-850/80 ${
        fault.status === 'Müdahale Ediliyor'
          ? isAssignedToMe
            ? 'bg-slate-900/95 border-emerald-500/80 ring-1 ring-emerald-500/30'
            : 'bg-slate-900/90 border-slate-700'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      }`}
      style={{
        borderLeftWidth: '5px',
        borderLeftColor: typeConfig.color
      }}
    >
      {/* Left: Type badge + Machine + Description */}
      <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-2 md:gap-3.5">
        {/* Type & Priority Badge (Hidden when grouped since header already shows fault type) */}
        {(!hideTypeBadge || fault.priority === 'Acil') && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!hideTypeBadge && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold shadow-sm"
                style={{
                  borderColor: typeConfig.color,
                  color: typeConfig.color === '#FF0000' ? '#FFFFFF' : '#0F172A',
                  backgroundColor: typeConfig.color
                }}
              >
                <TypeIcon className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[120px]">
                  {cleanFaultTypeName(typeConfig.shortName || typeConfig.name || fault.faultType)}
                </span>
              </span>
            )}

            {fault.priority === 'Acil' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-950 border border-rose-600 text-rose-300 animate-pulse flex-shrink-0">
                ACİL
              </span>
            )}
          </div>
        )}

        {/* Machine info - Colored in Group Color */}
        <div className="flex items-center gap-2 min-w-[160px] max-w-[260px] flex-shrink-0">
          {fault.machineCode && (
            <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 border border-slate-700 text-cyan-300">
              {fault.machineCode}
            </span>
          )}
          <span
            className="text-xs sm:text-sm font-black tracking-wide truncate drop-shadow-sm"
            style={{ color: typeConfig.color }}
            title={fault.machine}
          >
            {fault.machine}
          </span>
        </div>

        {/* Description (controlled by viewSettings.showDescription) */}
        {viewSettings.showDescription && (
          <div className="flex-1 min-w-0 text-xs text-slate-300">
            <span className="line-clamp-2 md:line-clamp-1 font-medium text-slate-200">
              {fault.description || 'Açıklama belirtilmemiş.'}
            </span>
            {fault.interventions && fault.interventions.length > 0 && (
              <div className="text-[10px] text-amber-300/90 flex items-center gap-1.5 truncate mt-0.5">
                <span className="font-bold text-slate-400 uppercase">Son Durum:</span>
                <span className="font-semibold text-cyan-300">
                  {formatShortOperatorName(fault.interventions[fault.interventions.length - 1].operator)}
                </span>
                <span className="truncate text-slate-300">
                  {fault.interventions[fault.interventions.length - 1].action}
                </span>
                <span className="px-1 rounded bg-slate-900 border border-slate-800 text-amber-300 font-bold shrink-0">
                  {fault.interventions[fault.interventions.length - 1].minutes} dk
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Middle: Reporter, Shift, Date info */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 flex-shrink-0">
        {viewSettings.showReporter && (
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Bildiren:</span>
            <span className="font-semibold text-slate-200 truncate max-w-[110px]" title={fault.reportedBy}>
              {formatShortOperatorName(fault.reportedBy) || fault.reportedBy}
            </span>
          </div>
        )}

        {viewSettings.showShift && fault.shift && (
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Vardiya:</span>
            <span className="font-medium text-slate-300 px-1 py-0.2 rounded bg-slate-800 border border-slate-700 text-[10px]">
              {fault.shift}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1 text-slate-500 hidden sm:flex">
          <Calendar className="w-3 h-3 text-slate-500" />
          <span>{fault.reportedAt || fault.date}</span>
        </div>
      </div>

      {/* Right-Middle: Status & Assigned Tech */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {renderStatusBadge()}

        {/* Assigned Operator (controlled by viewSettings.showAssignee) */}
        {viewSettings.showAssignee && (
          <div className="flex items-center gap-1.5">
            {fault.assignedTo ? (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                  fault.status === 'Müdahale Ediliyor'
                    ? isAssignedToMe
                      ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm'
                      : 'bg-emerald-950/50 border-emerald-600/70 text-emerald-300'
                    : isAssignedToMe
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                    : 'bg-slate-950 border-slate-700 text-slate-200'
                }`}
                title={`Müdahale Eden / Görevli: ${fault.assignedTo}${
                  fault.helpers && fault.helpers.length > 0
                    ? ` | Yardımcılar: ${fault.helpers.join(', ')}`
                    : ''
                }`}
              >
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-extrabold tracking-tight">
                  {formatShortOperatorName(fault.assignedTo)}
                </span>

                {/* Active Helpers with abbreviated names (e.g. +E. Vardar) */}
                {fault.helpers && fault.helpers.length > 0 && (
                  <span
                    className="text-[10px] text-cyan-300 bg-cyan-950/90 border border-cyan-800 px-1 py-0.2 rounded font-semibold ml-0.5"
                    title={`Aktif Yardımcılar: ${fault.helpers.join(', ')}`}
                  >
                    +{fault.helpers.map((h) => formatShortOperatorName(h)).join(', ')}
                  </span>
                )}

                {/* Finished Helper Interventions (e.g. ✓ E. Vardar 15 dk) */}
                {fault.interventions &&
                  fault.interventions.filter((i) => i.role === 'helper' && i.operator).length > 0 && (
                    <span
                      className="text-[10px] text-emerald-300 bg-emerald-950/90 border border-emerald-800/80 px-1 py-0.2 rounded font-semibold ml-0.5"
                      title="Yardım Süresi Kaydedildi"
                    >
                      {fault.interventions
                        .filter((i) => i.role === 'helper' && i.operator)
                        .map((i) => `✓ ${formatShortOperatorName(i.operator)} (${i.minutes} dk)`)
                        .join(' ')}
                    </span>
                  )}
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 italic px-2 py-0.5 rounded bg-slate-950/60 border border-slate-800">
                Boşta
              </span>
            )}
          </div>
        )}
      </div>

      {/* Far-Right: Action buttons */}
      <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto lg:ml-0">
        {/* Admin Reassign dropdown */}
        {isAdmin && (
          <select
            value={fault.assignedTo || ''}
            onChange={(e) => onReassign(fault, e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-300 text-[11px] rounded-lg px-1.5 py-1 outline-none hover:border-slate-500 max-w-[110px]"
            title="Operatör Ata / Değiştir"
          >
            <option value="">Ata...</option>
            {allOperators.map((op, opIdx) => (
              <option key={`row-op-${op.name}-${opIdx}`} value={op.name}>
                {op.shortName || op.name}
              </option>
            ))}
          </select>
        )}

        {/* Admin Quick Intervention trigger */}
        {isAdmin && fault.status !== 'Müdahale Ediliyor' && (
          <button
            onClick={() => onOpenInterventionModal(fault)}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs transition-all"
            title="Yönetici Olarak Durumu Güncelle veya Kapat"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        )}

        {/* Start button */}
        {(fault.status === 'Açık' ||
          fault.status === 'Parça Bekliyor' ||
          fault.status === 'Dış Servis Bekliyor' ||
          fault.status === 'Devredildi' ||
          fault.status === 'Geçici Çözüm') && (
          <button
            onClick={() => onStartIntervention(fault)}
            className="flex items-center gap-1 px-3 py-1 rounded-lg font-bold text-xs text-white bg-cyan-600 hover:bg-cyan-500 shadow-sm transition-all active:scale-95 whitespace-nowrap"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>
              {fault.status === 'Dış Servis Bekliyor'
                ? 'Servis Devam'
                : fault.status === 'Parça Bekliyor'
                ? 'Parça Devral'
                : fault.status === 'Devredildi'
                ? 'Devral'
                : 'Başla'}
            </span>
          </button>
        )}

        {/* Finish button if assigned to me and active */}
        {fault.status === 'Müdahale Ediliyor' && isAssignedToMe && (
          <button
            onClick={() => onOpenInterventionModal(fault)}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all active:scale-95 whitespace-nowrap"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Bitir / Güncelle</span>
          </button>
        )}

        {/* Helper buttons */}
        {fault.status === 'Müdahale Ediliyor' && !isAssignedToMe && (
          <>
            {isHelper ? (
              <button
                onClick={() => onLeaveHelper(fault)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all active:scale-95 whitespace-nowrap"
              >
                <UserMinus className="w-3 h-3" />
                <span>Ayrıl</span>
              </button>
            ) : (
              <button
                onClick={() => onJoinHelper(fault)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-semibold text-xs transition-all active:scale-95 whitespace-nowrap"
              >
                <UserPlus className="w-3 h-3" />
                <span>Yardımcı Ol</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
