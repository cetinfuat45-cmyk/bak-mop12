import React from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Calendar,
  User,
  Wrench,
  FileSpreadsheet,
  Check,
  UploadCloud
} from 'lucide-react';
import { Fault, Operator } from '../../types';
import { getFaultTypeConfig } from '../../utils/faultColors';

interface ClosedTodayModalProps {
  isOpen: boolean;
  onClose: () => void;
  faults: Fault[];
  currentOperator: Operator;
  onExportToSheets?: () => void;
}

export const ClosedTodayModal: React.FC<ClosedTodayModalProps> = ({
  isOpen,
  onClose,
  faults,
  currentOperator,
  onExportToSheets
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString('tr-TR');

  // Filter closed today
  const closedToday = faults.filter(
    (f) => f.status === 'Kapalı' && (f.date === todayStr || !f.date)
  );

  const unsyncedCount = closedToday.filter((f) => !f.syncedToSheets).length;

  // Filter operator's own contribution today (both as primary and as helper)
  const currentOpUpper = (currentOperator?.name || '').trim().toLocaleUpperCase('tr-TR');

  const myClosed = closedToday.filter((f) => {
    const isPrimary = (f.closedBy || '').trim().toLocaleUpperCase('tr-TR') === currentOpUpper;
    const isHelper =
      Array.isArray(f.interventions) &&
      f.interventions.some(
        (i) => (i.operator || '').trim().toLocaleUpperCase('tr-TR') === currentOpUpper
      );
    return isPrimary || isHelper;
  });

  const myTotalMinutes = myClosed.reduce((sum, f) => {
    const myLog = f.interventions?.find(
      (i) => (i.operator || '').trim().toLocaleUpperCase('tr-TR') === currentOpUpper
    );
    return sum + (myLog ? Number(myLog.minutes) || 0 : Number(f.totalDowntimeMinutes) || 0);
  }, 0);

  const hours = Math.floor(myTotalMinutes / 60);
  const mins = myTotalMinutes % 60;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Bugün Kapatılan Arızalar
              </h3>
              <p className="text-[11px] text-slate-400">
                Tarih: {todayStr} • Toplam {closedToday.length} Arıza Çözüldü
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onExportToSheets && closedToday.length > 0 && (
              <button
                onClick={onExportToSheets}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all active:scale-95"
                title="Tüm Kapatılan Arızaları Google E-Tablo'ya Gönder"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>E-Tabloya Aktar</span>
                {unsyncedCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-800 text-emerald-100">
                    {unsyncedCount}
                  </span>
                )}
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

        {/* Operator Daily Summary Card */}
        <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-cyan-950/40 to-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-slate-300">
              {currentOperator.name} Günlük Performans:
            </div>
            <div className="text-sm font-black text-emerald-400 mt-0.5">
              {myClosed.length} İş Çözümü • {hours} saat {mins} dakika
            </div>
          </div>
          <div className="text-right flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 border border-slate-700 text-cyan-300">
              Aktif Vardiya
            </span>
          </div>
        </div>

        {/* List of Closed Faults */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
          {closedToday.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Bugün henüz kapatılan bir arıza bulunmuyor.
            </div>
          ) : (
            closedToday.map((f, fIdx) => (
              <div
                key={`closed-fault-${f.id || 'flt'}-${fIdx}`}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-xs">
                        {f.machine}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold border"
                        style={{
                          borderColor: getFaultTypeConfig(f.faultType).badgeBorder,
                          color: getFaultTypeConfig(f.faultType).color,
                          backgroundColor: getFaultTypeConfig(f.faultType).badgeBg
                        }}
                      >
                        {getFaultTypeConfig(f.faultType).shortName || f.faultType}
                      </span>
                      {f.syncedToSheets ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/90 text-emerald-400 border border-emerald-800/80 flex items-center gap-1">
                          <Check className="w-3 h-3" /> E-Tabloya Aktarıldı
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-950/90 text-amber-300 border border-amber-800/80 flex items-center gap-1">
                          ⏳ E-Tablo Bekliyor
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {f.description}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {f.totalDowntimeMinutes || 0} dk
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px] space-y-1">
                  <div>
                    <span className="text-slate-500 font-semibold">
                      Yapılan İşlem:
                    </span>{' '}
                    <span className="text-slate-200">
                      {f.actionTaken || 'Belirtilmedi'}
                    </span>
                  </div>
                  {f.partsChanged && (
                    <div>
                      <span className="text-slate-500 font-semibold">
                        Değişen Parça:
                      </span>{' '}
                      <span className="text-cyan-300">{f.partsChanged}</span>
                    </div>
                  )}
                  {f.interventions &&
                    f.interventions.some((i) => i.role === 'helper' && i.operator) && (
                      <div className="text-[11px]">
                        <span className="text-slate-500 font-semibold">
                          Yardımcı Teknisyenler:
                        </span>{' '}
                        <span className="text-emerald-300 font-medium">
                          {f.interventions
                            .filter((i) => i.role === 'helper' && i.operator)
                            .map((i) => `${i.operator} (${i.minutes} dk)`)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800">
                    <span>Kapatan: {f.closedBy || f.assignedTo}</span>
                    <span>
                      {f.closedAt
                        ? new Date(f.closedAt).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
