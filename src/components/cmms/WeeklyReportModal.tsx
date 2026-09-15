import React, { useState } from 'react';
import {
  X,
  Calendar,
  Download,
  Share2,
  Copy,
  Check,
  RefreshCw,
  Printer
} from 'lucide-react';
import { Fault, Operator, WeeklyStats } from '../../types';

interface WeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  weeklyStats: WeeklyStats;
  operators: Operator[];
  faults: Fault[];
  onSyncTodayData: () => void;
}

const DAYS = [
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
  'Pazar'
];

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({
  isOpen,
  onClose,
  weeklyStats,
  operators,
  faults,
  onSyncTodayData
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const formatMins = (totalMins: number) => {
    if (!totalMins || totalMins <= 0) return '-';
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h === 0) return `${m}d`;
    if (m === 0) return `${h}s`;
    return `${h}s ${m}d`;
  };

  // Generate WhatsApp Shift Report
  const handleGenerateWhatsApp = () => {
    const todayStr = new Date().toLocaleDateString('tr-TR');
    const closedToday = faults.filter(
      (f) => f.status === 'Kapalı' && (f.date === todayStr || !f.date)
    );
    const activeFaults = faults.filter(
      (f) => f.status === 'Müdahale Ediliyor' || f.status === 'Açık'
    );
    const waitingFaults = faults.filter(
      (f) =>
        f.status === 'Parça Bekliyor' ||
        f.status === 'Devredildi' ||
        f.status === 'Dış Servis Bekliyor' ||
        f.status === 'Geçici Çözüm'
    );

    let text = `*AKG BAKIM VE ARIZA VARDİYA DEVİR RAPORU*\n`;
    text += `📅 *Tarih:* ${todayStr}\n\n`;

    text += `✅ *BUGÜN TAMAMLANAN ARIZALAR (${closedToday.length}):*\n`;
    if (closedToday.length === 0) {
      text += `- Bugün kapatılan arıza kaydı yok.\n`;
    } else {
      closedToday.forEach((f, i) => {
        const helpersStr =
          f.interventions &&
          f.interventions.filter((inv) => inv.role === 'helper' && inv.operator).length > 0
            ? ` + [Yardımcı: ${f.interventions
                .filter((inv) => inv.role === 'helper' && inv.operator)
                .map((inv) => `${inv.operator} (${inv.minutes} dk)`)
                .join(', ')}]`
            : '';
        text += `${i + 1}. *${f.machine}* [${f.faultType}]\n   - İşlem: ${
          f.actionTaken || f.description
        }\n   - Sorumlu: ${f.closedBy || f.assignedTo} (${
          f.totalDowntimeMinutes || 0
        } dk)${helpersStr}\n`;
      });
    }

    text += `\n⚠️ *MÜDAHALE EDİLEN / AÇIK ARIZALAR (${activeFaults.length}):*\n`;
    if (activeFaults.length === 0) {
      text += `- Açık arıza bulunmuyor.\n`;
    } else {
      activeFaults.forEach((f, i) => {
        text += `${i + 1}. *${f.machine}* - ${f.description} (Sorumlu: ${
          f.assignedTo || 'Atanmadı'
        })\n`;
      });
    }

    if (waitingFaults.length > 0) {
      text += `\n⏳ *PARÇA / DIŞ SERVİS / DEVİR BEKLEYENLER (${waitingFaults.length}):*\n`;
      waitingFaults.forEach((f, i) => {
        text += `${i + 1}. *${f.machine}* [${f.status}] - ${f.description}\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-950 border border-amber-800 text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Haftalık Teknisyen Çalışma Matrisi
              </h3>
              <p className="text-[11px] text-slate-400">
                Pazartesi - Pazar Arası Müdahale Süreleri (Saat & Dakika)
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

        {/* Matrix Table */}
        <div className="p-4 overflow-auto flex-1">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-400">
                <th className="p-2.5 font-bold uppercase tracking-wider">
                  Teknisyen
                </th>
                {DAYS.map((d, dIdx) => (
                  <th
                    key={`d-th-${d}-${dIdx}`}
                    className="p-2.5 text-center font-semibold text-slate-400"
                  >
                    {d.slice(0, 3)}
                  </th>
                ))}
                <th className="p-2.5 text-center font-bold text-cyan-400">
                  Toplam
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {operators.map((op, opIdx) => {
                const opUpper = (op.name || '').trim().toLocaleUpperCase('tr-TR');
                const matchedKey = Object.keys(weeklyStats).find(
                  (k) => k.trim().toLocaleUpperCase('tr-TR') === opUpper
                );
                const opStats = matchedKey ? weeklyStats[matchedKey] : (weeklyStats[op.name] || {});
                let opTotal = 0;
                DAYS.forEach((d) => {
                  opTotal += opStats[d] || 0;
                });

                return (
                  <tr key={`weekly-row-${op.name}-${opIdx}`} className="hover:bg-slate-850/60 transition-colors">
                    <td className="p-2.5 font-sans font-bold text-white flex items-center gap-2">
                      <img
                        src={
                          op.photo ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                        }
                        alt=""
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="truncate">{op.shortName || op.name}</span>
                    </td>
                    {DAYS.map((d, cellIdx) => {
                      const val = opStats[d] || 0;
                      return (
                        <td
                          key={`cell-${op.name}-${d}-${cellIdx}`}
                          className={`p-2.5 text-center ${
                            val > 0
                              ? 'text-emerald-400 font-bold bg-emerald-950/20'
                              : 'text-slate-600'
                          }`}
                        >
                          {formatMins(val)}
                        </td>
                      );
                    })}
                    <td className="p-2.5 text-center font-bold text-cyan-300 bg-cyan-950/30">
                      {formatMins(opTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer actions */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={onSyncTodayData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Bugünü Eşitle</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Yazdır / PDF</span>
            </button>

            <button
              onClick={handleGenerateWhatsApp}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Kopyalandı!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp Raporunu Kopyala</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
