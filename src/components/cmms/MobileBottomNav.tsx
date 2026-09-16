import React from 'react';
import {
  Wrench,
  QrCode,
  MessageSquare,
  UserCheck,
  MoreHorizontal
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab?: 'all' | 'mine';
  onSelectTab: (tab: 'all' | 'mine') => void;
  onOpenQrScanner: () => void;
  onOpenMessageModal: () => void;
  onOpenMenu: () => void;
  openFaultsCount: number;
  myFaultsCount: number;
  unreadMessageCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab = 'all',
  onSelectTab,
  onOpenQrScanner,
  onOpenMessageModal,
  onOpenMenu,
  openFaultsCount,
  myFaultsCount,
  unreadMessageCount
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/90 px-3 py-1.5 flex items-center justify-around sm:hidden select-none pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
      {/* 1. Tüm Arızalar */}
      <button
        onClick={() => onSelectTab('all')}
        className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-all active:scale-90 ${
          activeTab === 'all' ? 'text-cyan-400 font-bold' : 'text-slate-400 font-medium'
        }`}
      >
        <div className="relative">
          <Wrench className="w-5 h-5" />
          {openFaultsCount > 0 && (
            <span className="absolute -top-1.5 -right-2 px-1 min-w-[15px] h-[15px] rounded-full bg-cyan-500 text-slate-950 font-black text-[9px] flex items-center justify-center">
              {openFaultsCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">Arızalar</span>
      </button>

      {/* 2. Üzerimdekiler */}
      <button
        onClick={() => onSelectTab('mine')}
        className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-all active:scale-90 ${
          activeTab === 'mine' ? 'text-emerald-400 font-bold' : 'text-slate-400 font-medium'
        }`}
      >
        <div className="relative">
          <UserCheck className="w-5 h-5" />
          {myFaultsCount > 0 && (
            <span className="absolute -top-1.5 -right-2 px-1 min-w-[15px] h-[15px] rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] flex items-center justify-center">
              {myFaultsCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">Üzerimde</span>
      </button>

      {/* 3. CENTER: Elevated QR Scanner (App Action Button) */}
      <div className="-mt-5 flex items-center justify-center">
        <button
          onClick={onOpenQrScanner}
          className="w-13 h-13 rounded-full bg-gradient-to-tr from-cyan-600 via-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/40 border-2 border-slate-950 active:scale-95 transition-transform"
          aria-label="Karekod Okut"
        >
          <QrCode className="w-6 h-6 stroke-[2.2]" />
        </button>
      </div>

      {/* 4. Canlı Mesajlar */}
      <button
        onClick={onOpenMessageModal}
        className="flex flex-col items-center justify-center min-w-[56px] py-1 text-slate-400 font-medium transition-all active:scale-90 hover:text-slate-200"
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5" />
          {unreadMessageCount > 0 && (
            <span className="absolute -top-1.5 -right-2 px-1 min-w-[15px] h-[15px] rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center animate-pulse">
              {unreadMessageCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">Mesajlar</span>
      </button>

      {/* 5. Menü */}
      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center min-w-[56px] py-1 text-slate-400 font-medium transition-all active:scale-90 hover:text-slate-200"
      >
        <MoreHorizontal className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 tracking-tight">Menü</span>
      </button>
    </nav>
  );
};
