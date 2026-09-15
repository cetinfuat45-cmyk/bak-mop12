import React, { useState, useRef, useEffect } from 'react';
import {
  Wrench,
  QrCode,
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
  GitBranch,
  Layers,
  Sparkles,
  Download,
  Smartphone
} from 'lucide-react';
import { Operator } from '../../types';
import { downloadProjectZip } from '../../services/zipDownloadService';
import { PWAInstallButton } from './PWAInstallButton';

interface CmmsHeaderProps {
  currentOperator: Operator;
  dailyStatsText: string;
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
  const [menuOpen, setMenuOpen] = useState(false);
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
    <header className="bg-slate-900 border-b border-slate-800 text-white px-3 sm:px-5 py-2.5 flex items-center justify-between shadow-md relative z-40">
      {/* Left: Brand + Mode Switcher */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              <span>AKG BAKIM</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950 border border-cyan-800 text-cyan-400">
                CMMS
              </span>
            </div>
            <div className="text-[10px] text-slate-400 hidden sm:block font-medium">
              Saha Arıza & Müdahale Sistemi
            </div>
          </div>
        </div>

        {/* Dedicated Flowchart Mode Switcher */}
        <button
          onClick={onSwitchToFlowchart}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 hover:bg-cyan-900/90 hover:border-cyan-400 transition-all ml-2 shadow-lg shadow-cyan-950/50 active:scale-95"
          title="Süreç ve Mimari Akış Şemasına Geçiş Yap"
        >
          <GitBranch className="w-4 h-4 text-cyan-400" />
          <span>Akış Şeması & Mimari</span>
        </button>
      </div>

      {/* Right: PWA Install + QR Quick Scan + Operator Info + Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* PWA Install Button */}
        <PWAInstallButton variant="header" />

        {/* Quick QR button */}
        <button
          onClick={onOpenQrScanner}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20 active:scale-95"
        >
          <QrCode className="w-4 h-4" />
          <span className="hidden sm:inline">Karekod Okut</span>
        </button>

        {/* Operator Profile Card */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-800">
          <img
            src={
              currentOperator.photo ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
            }
            alt={currentOperator.name}
            className="w-7 h-7 rounded-full object-cover border border-cyan-500/60"
          />
          <div className="text-left hidden xs:block">
            <div className="text-xs font-bold text-white flex items-center gap-1">
              <span>{currentOperator.shortName || currentOperator.name}</span>
              {isAdmin && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 border border-amber-700 text-amber-300 font-extrabold">
                  ADM
                </span>
              )}
            </div>
            <div className="text-[10px] text-cyan-400 font-medium">
              {dailyStatsText}
            </div>
          </div>
        </div>

        {/* Dropdown Menu Gear Button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shadow-sm flex items-center gap-1"
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

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenQrScanner();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
              >
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>Manuel QR Okut</span>
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
                  onSwitchToFlowchart();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2.5 transition-colors text-cyan-400 font-semibold"
              >
                <GitBranch className="w-4 h-4 text-cyan-400" />
                <span>📊 Akış Şeması & Mimari</span>
              </button>

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
