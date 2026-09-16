import React, { useState, useRef, useEffect } from 'react';
import {
  Wrench,
  Settings,
  LogOut,
  Bell,
  BellOff,
  Clock,
  FileSpreadsheet,
  Calendar,
  MessageSquare,
  Users,
  Eye,
  Sliders,
  Palette,
  Trash2,
  ChevronDown,
  ShieldAlert,
  Layers,
  Sparkles,
  Download,
  Smartphone
} from 'lucide-react';
import { Operator } from '../../types';
import { downloadProjectZip } from '../../services/zipDownloadService';

interface CmmsHeaderProps {
  currentOperator: Operator;
  dailyStatsText: string;
  unreadMessageCount?: number;
  isMenuOpen?: boolean;
  setIsMenuOpen?: (open: boolean) => void;
  onLogout: () => void;
  onOpenQrScanner: () => void;
  onOpenClosedToday: () => void;
  onOpenMessageModal: () => void;
  onOpenOperatorSettings: () => void;
  onOpenWeeklyReport: () => void;
  onExportAndClear: () => void;
  onExportOnlyToSheets?: () => void;
  onSyncFromExcel: () => void;
  onOpenMessageMonitor: () => void;
  onOpenViewSettings: () => void;
  onOpenThemeSettings: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onClearCache: () => void;
  onSwitchToFlowchart: () => void;
}

export const CmmsHeader: React.FC<CmmsHeaderProps> = ({
  currentOperator,
  dailyStatsText,
  unreadMessageCount = 0,
  isMenuOpen,
  setIsMenuOpen,
  onLogout,
  onOpenQrScanner,
  onOpenClosedToday,
  onOpenMessageModal,
  onOpenOperatorSettings,
  onOpenWeeklyReport,
  onExportAndClear,
  onExportOnlyToSheets,
  onSyncFromExcel,
  onOpenMessageMonitor,
  onOpenViewSettings,
  onOpenThemeSettings,
  soundEnabled,
  onToggleSound,
  onClearCache,
  onSwitchToFlowchart
}) => {
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const menuOpen = isMenuOpen !== undefined ? isMenuOpen : internalMenuOpen;
  const setMenuOpen = (val: boolean) => {
    if (setIsMenuOpen) {
      setIsMenuOpen(val);
    } else {
      setInternalMenuOpen(val);
    }
  };
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = currentOperator.role === 'admin';

  return (
    <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between shadow-md relative z-40 select-none pt-[calc(0.5rem+env(safe-area-inset-top,0px))]">
      {/* Left: Brand */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20 flex-shrink-0">
            <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              <span>AKG BAKIM</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-cyan-950 border border-cyan-800 text-cyan-400">
                CMMS
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Flowchart Switcher */}
        <button
          onClick={onSwitchToFlowchart}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all active:scale-95 shadow-sm"
          title="Süreç Akış Şeması ve Sistem Mimarisi Görünümüne Geç"
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Akış Şeması</span>
        </button>
      </div>

      {/* Right: Operator Info + Quick Messages + Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Quick Message Button with Notification Badge */}
        <button
          onClick={onOpenMessageModal}
          className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95"
          title="Operatörler Arası Canlı Mesajlaşma (P2P)"
        >
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span className="hidden md:inline">Mesajlar</span>
          {unreadMessageCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center animate-pulse shadow-sm shadow-cyan-500/50">
              {unreadMessageCount}
            </span>
          )}
        </button>

        {/* Operator Profile Card */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-800">
          <img
            src={
              currentOperator.photo ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
            }
            alt={currentOperator.name}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-cyan-500/60 flex-shrink-0"
          />
          <div className="text-left hidden xs:block">
            <div className="text-xs font-bold text-white flex items-center gap-1">
              <span className="truncate max-w-[90px] sm:max-w-none">{currentOperator.shortName || currentOperator.name}</span>
              {isAdmin && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 border border-amber-700 text-amber-300 font-extrabold flex-shrink-0">
                  ADM
                </span>
              )}
            </div>
            <div className="text-[10px] text-cyan-400 font-medium hidden sm:block">
              {dailyStatsText}
            </div>
          </div>
        </div>

        {/* Dropdown Menu Gear Button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shadow-sm flex items-center gap-1"
            title="Sistem Menüsü"
          >
            <Settings className="w-4 h-4" />
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Menu dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 text-xs text-slate-200 animate-fadeIn">
              <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>İşlemler & Raporlar</span>
                <span className="text-[10px] text-cyan-400">
                  {currentOperator.role}
                </span>
              </div>

              {/* Süreç Akış Şeması */}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onSwitchToFlowchart();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2.5 transition-colors text-cyan-400 font-semibold"
              >
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>📊 Süreç Akış Şeması & Mimari</span>
              </button>

              {/* Standard Options */}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenClosedToday();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
              >
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Bugün Kapatılanlar</span>
              </button>

              {onExportOnlyToSheets && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onExportOnlyToSheets();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2.5 transition-colors text-emerald-400 font-semibold"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Google E-Tabloya Kaydet / Aktar</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenMessageModal();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-sky-400" />
                <span>✉️ Mesaj Gönder (P2P)</span>
              </button>

              {/* Admin Special Options */}
              {isAdmin && (
                <>
                  <div className="px-3 py-1.5 mt-1 border-t border-b border-slate-800 text-[10px] font-semibold text-amber-400 uppercase tracking-wider bg-amber-950/20">
                    👑 Yönetici Araçları
                  </div>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenOperatorSettings();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                  >
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Op Ayarları (PIN & QR Muafiyet)</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenWeeklyReport();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>Haftalık Rapor & WhatsApp</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onExportAndClear();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2.5 transition-colors text-amber-300 font-medium"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Şimdi Aktar ve Sil (Excel 16 Kolon)</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onSyncFromExcel();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                    <span>Excel'den Verileri Çek</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenMessageMonitor();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                  >
                    <Eye className="w-4 h-4 text-indigo-400" />
                    <span>🕵️‍♂️ Mesajları Canlı İzle</span>
                  </button>
                </>
              )}

              {/* View & Preferences */}
              <div className="px-3 py-1.5 mt-1 border-t border-b border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Görünüm & Tercihler
              </div>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenViewSettings();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
              >
                <Sliders className="w-4 h-4 text-slate-400" />
                <span>Op Veri Gösterge Ayarı</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenThemeSettings();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
              >
                <Palette className="w-4 h-4 text-purple-400" />
                <span>Tema & Renk Ayarları</span>
              </button>

              <button
                onClick={onToggleSound}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {soundEnabled ? (
                    <Bell className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <BellOff className="w-4 h-4 text-slate-500" />
                  )}
                  <span>Bildirim Sesleri</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    soundEnabled
                      ? 'bg-cyan-950 text-cyan-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {soundEnabled ? 'AÇIK' : 'KAPALI'}
                </span>
              </button>

              <button
                onClick={onClearCache}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2.5 transition-colors text-slate-400 hover:text-rose-400"
              >
                <Trash2 className="w-4 h-4" />
                <span>🧹 Ön Belleği Temizle</span>
              </button>

              {/* Download Project ZIP / GitHub Release */}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  downloadProjectZip('akg-cmms-github-release.zip');
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2.5 transition-colors text-emerald-400 font-semibold"
                title="Tüm sistemi GitHub'da yayınlanacak ve çalıştırılacak şekilde ZIP olarak indir"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>📦 GitHub Dağıtım Paketi (.ZIP)</span>
              </button>

              {/* Logout */}
              <div className="pt-1 mt-1 border-t border-slate-800">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-rose-950/40 text-rose-400 flex items-center gap-2.5 font-semibold transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Çıkış Yap</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
