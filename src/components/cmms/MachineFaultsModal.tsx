import React from 'react';
import {
  X,
  Wrench,
  Play,
  CheckCircle2,
  UserPlus,
  UserMinus,
  AlertCircle,
  Clock,
  FileText
} from 'lucide-react';
import { Fault, Operator } from '../../types';
import { getFaultTypeConfig } from '../../utils/faultColors';

interface MachineFaultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  machineName: string;
  faults: Fault[];
  currentOperator: Operator;
  onStartIntervention: (fault: Fault) => void;
  onOpenInterventionModal: (fault: Fault) => void;
  onJoinHelper: (fault: Fault) => void;
  onLeaveHelper: (fault: Fault) => void;
}

export const MachineFaultsModal: React.FC<MachineFaultsModalProps> = ({
  isOpen,
  onClose,
  machineName,
  faults,
  currentOperator,
  onStartIntervention,
  onOpenInterventionModal,
  onJoinHelper,
  onLeaveHelper
}) => {
  if (!isOpen) return null;

  // Filter faults matching this machine (excluding closed ones)
  const machineFaults = faults.filter(
    (f) =>
      f.status !== 'Kapalı' &&
      (f.machine.toLowerCase().includes(machineName.toLowerCase()) ||
        machineName.toLowerCase().includes(f.machine.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white truncate max-w-xs">
                {machineName}
              </h3>
              <p className="text-[11px] text-cyan-400 font-medium">
                Bu Makineye Ait Açık Arızalar ({machineFaults.length})
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

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {machineFaults.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-slate-950/60 border border-slate-800">
              <AlertCircle className="w-8 h-8 text-amber-400/80 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-300">
                Bu makinede açık arıza kaydı bulunamadı.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Karekod başarıyla okutuldu ancak sistemde bu makineye ait bekleyen bir iş yok.
              </p>
            </div>
          ) : (
            machineFaults.map((f, fIdx) => {
              const isAssignedToMe = f.assignedTo === currentOperator.name;
              const isHelper =
                f.helpers && f.helpers.includes(currentOperator.name);

              const typeCfg = getFaultTypeConfig(f.faultType);
              return (
                <div
                  key={`mach-fault-${f.id || 'flt'}-${fIdx}`}
                  className="p-3.5 rounded-2xl bg-slate-950 border transition-all space-y-2.5"
                  style={{
                    borderLeft: `4px solid ${typeCfg.color}`,
                    borderColor: 'rgba(51, 65, 85, 0.6)'
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase inline-flex items-center gap-1.5"
                        style={{
                          backgroundColor: `${typeCfg.color}25`,
                          color: typeCfg.color,
                          border: `1px solid ${typeCfg.color}60`
                        }}
                      >
                        <span>{typeCfg.sheetName || f.faultType}</span>
                        <span className="font-mono opacity-80 text-[9px]">{typeCfg.color}</span>
                      </span>
                      <p className="text-xs font-semibold text-white mt-1">
                        {f.description}
                      </p>
                    </div>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {f.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <span>Bildiren: {f.reportedBy}</span>
                    {f.assignedTo && (
                      <span className="text-emerald-400 font-semibold">
                        Sorumlu: {f.assignedTo}
                      </span>
                    )}
                  </div>

                  {/* Actions for this fault */}
                  <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
                    {f.status === 'Müdahale Ediliyor' ? (
                      isAssignedToMe ? (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenInterventionModal(f);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Müdahaleyi Bitir</span>
                        </button>
                      ) : isHelper ? (
                        <button
                          onClick={() => {
                            onClose();
                            onLeaveHelper(f);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>Bakımdan Ayrıl</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onClose();
                            onJoinHelper(f);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Yardımcı Olarak Katıl</span>
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => {
                          onClose();
                          onStartIntervention(f);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs text-white flex items-center gap-1.5 shadow-md transition-all active:scale-95 ${
                          f.status === 'Dış Servis Bekliyor'
                            ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30 ring-1 ring-amber-500/50'
                            : f.status === 'Parça Bekliyor'
                            ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                            : f.status === 'Devredildi'
                            ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                            : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>
                          {f.status === 'Dış Servis Bekliyor'
                            ? 'Servis Geldi / Devam Et'
                            : f.status === 'Parça Bekliyor'
                            ? 'Parça Geldi / Devral'
                            : f.status === 'Devredildi'
                            ? 'Devral / Başla'
                            : 'Çalışmaya Başla'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
