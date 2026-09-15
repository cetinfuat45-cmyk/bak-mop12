import React from 'react';
import { 
  Workflow, 
  Search, 
  Play, 
  Code2, 
  Layers, 
  Printer, 
  Sparkles,
  ShieldCheck,
  QrCode,
  Sliders,
  FileCheck2,
  Database,
  MessageSquare,
  Download
} from 'lucide-react';
import { FlowCategory } from '../types';
import { downloadProjectZip } from '../services/zipDownloadService';

interface HeaderProps {
  activeCategory: FlowCategory;
  onSelectCategory: (cat: FlowCategory) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenSimulator: () => void;
  onOpenMermaid: () => void;
  onPrint: () => void;
  isSimulatorActive: boolean;
  onSwitchToCmms: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onOpenSimulator,
  onOpenMermaid,
  onPrint,
  isSimulatorActive,
  onSwitchToCmms
}) => {
  const tabs: { id: FlowCategory; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'master', label: 'Ana Akış', icon: <Workflow className="w-4 h-4" /> },
    { id: 'auth', label: '1. Giriş & Yetki', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'qr', label: '2. QR & Saha', icon: <QrCode className="w-4 h-4" /> },
    { id: 'intervention', label: '3. Durum Makinesi', icon: <Sliders className="w-4 h-4" /> },
    { id: 'closure', label: '4. Kök Neden & Kapanış', icon: <FileCheck2 className="w-4 h-4" /> },
    { id: 'archive', label: '5. Excel Arşiv', icon: <Database className="w-4 h-4" /> },
    { id: 'messaging', label: '6. Mesaj & Rapor', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'architecture', label: 'Mimari & Şema', icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-xl">
      {/* Top Branding & Action Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo & Project Title */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            {/* AKG Industrial Flame/Shield Emblem */}
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
              <span className="font-black text-white text-xs tracking-tighter uppercase px-1">AKG</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-100 text-base sm:text-lg tracking-tight">
                  AKG Bakım & Arıza Paneli
                </h1>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  Sistem Akış Şeması
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Saha Operatörü, QR Doğrulama, Durum Makinesi ve Google Sheets Entegrasyonu
              </p>
            </div>
          </div>
        </div>

        {/* Global Search & Action Tools */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Search box */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Adım, fonksiyon veya koleksiyon ara..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-800/90 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Simulator Trigger */}
          <button
            onClick={onOpenSimulator}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md ${
              isSimulatorActive
                ? 'bg-emerald-600 text-white shadow-emerald-500/25 ring-2 ring-emerald-400'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30'
            }`}
            title="Süreçleri adım adım simüle et"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isSimulatorActive ? 'Simülatör Açık' : 'Simülatör'}</span>
          </button>

          {/* Mermaid Code Export */}
          <button
            onClick={onOpenMermaid}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Mermaid.js akış şeması kodunu görüntüle"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Mermaid</span>
          </button>

          {/* Print / PDF Export */}
          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Şemayı yazdır veya PDF olarak kaydet"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Download Project ZIP */}
          <button
            onClick={() => downloadProjectZip()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-emerald-950/60 text-emerald-400 border border-slate-700 hover:border-emerald-600 transition-all active:scale-95"
            title="Tüm sistemi ZIP olarak indir (Windows uyumlu)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ZIP İndir</span>
          </button>

          {/* Switch to CMMS Operational App */}
          <button
            onClick={onSwitchToCmms}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 transition-all active:scale-95"
            title="Canlı Saha Bakım ve Arıza Paneline Dön"
          >
            <span>📱 Saha Paneli</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-t border-slate-800/80 bg-slate-950/60 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 py-1.5 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectCategory(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
