import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  User,
  Wrench,
  Delete,
  Download,
  RefreshCw,
  LogIn,
  Search,
  CheckCircle2
} from 'lucide-react';
import { Operator } from '../../types';
import { soundEffects } from '../../services/soundEffects';
import { downloadProjectZip } from '../../services/zipDownloadService';
import { PWAInstallButton } from './PWAInstallButton';

interface LoginScreenProps {
  operators: Operator[];
  onLogin: (pin: string) => Promise<boolean>;
  onViewFlowchart: () => void;
  onSyncFromExcel?: () => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  operators,
  onLogin,
  onViewFlowchart,
  onSyncFromExcel
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingZip, setDownloadingZip] = useState(false);

  const handleDownloadZip = async () => {
    if (downloadingZip) return;
    setDownloadingZip(true);
    try {
      await downloadProjectZip();
    } finally {
      setTimeout(() => setDownloadingZip(false), 1500);
    }
  };

  // Match operator preview dynamically if PIN matches
  const matchedOp = operators.find((o) => {
    const clean = pin.trim();
    if (!clean) return false;
    const opPin = String(o.pin).trim();
    if (opPin === clean) return true;
    if (clean.length <= 4 && opPin.padStart(4, '0') === clean.padStart(4, '0')) return true;
    if ((o.name.toUpperCase().includes('FUAT') || o.role === 'admin') && (clean === '9' || clean === '123')) {
      return true;
    }
    return false;
  });

  const handleDigit = (digit: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);
    soundEffects.playSuccessBeep();

    // Auto-submit if exact 4-digit PIN is entered
    if (newPin.length === 4) {
      submitPin(newPin);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  const submitPin = async (codeToSubmit?: string) => {
    const code = (codeToSubmit !== undefined ? codeToSubmit : pin).trim();
    if (!code) return;

    setLoading(true);
    const success = await onLogin(code);
    setLoading(false);

    if (!success) {
      setError(true);
      soundEffects.playErrorBuzz();
      setTimeout(() => {
        setPin('');
        setError(false);
      }, 1200);
    } else {
      soundEffects.playCompleteFanfare();
    }
  };

  const handleQuickSelect = (op: Operator) => {
    setPin(op.pin);
    submitPin(op.pin);
  };

  const handleSyncClick = async () => {
    if (!onSyncFromExcel || syncing) return;
    setSyncing(true);
    try {
      await onSyncFromExcel();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } finally {
      setSyncing(false);
    }
  };

  // Keyboard shortcut listener for numeric keypad & Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading) return;
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        if (pin.length > 0) {
          submitPin(pin);
        }
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, loading]);

  // Filtered operators for quick selection
  const filteredOperators = operators.filter((op) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      op.name.toLowerCase().includes(term) ||
      (op.shortName && op.shortName.toLowerCase().includes(term)) ||
      op.pin.includes(term) ||
      op.role.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 relative overflow-y-auto">
      {/* Background industrial glow accents */}
      <div className="absolute top-1/6 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Floating Action Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4 px-2 z-20">
        <div className="flex items-center gap-2">
          {onSyncFromExcel && (
            <button
              onClick={handleSyncClick}
              disabled={syncing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shadow-md ${
                syncSuccess
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                  : 'bg-slate-900 border-slate-700 text-cyan-400 hover:bg-slate-800 hover:border-cyan-500'
              }`}
              title="Google E-Tablolar'dan teknisyen ve arıza listesini güncelle"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>
                {syncing
                  ? 'E-Tablodan Alınıyor...'
                  : syncSuccess
                  ? 'Güncellendi!'
                  : 'E-Tabloyu Yenile'}
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* PWA Mobile Install button */}
          <PWAInstallButton variant="header" />

          <button
            onClick={handleDownloadZip}
            disabled={downloadingZip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-emerald-800/80 text-emerald-400 hover:bg-emerald-950/50 hover:border-emerald-500 transition-all shadow-md active:scale-95 disabled:opacity-70"
            title="Tüm proje kaynak kodlarını ve dosyalarını GitHub'da dağıtılacak şekilde ZIP olarak indir"
          >
            <Download className={`w-3.5 h-3.5 ${downloadingZip ? 'animate-bounce text-emerald-300' : ''}`} />
            <span className="hidden sm:inline">
              {downloadingZip ? 'Hazırlanıyor...' : 'GitHub Paketi (.ZIP)'}
            </span>
          </button>
          <button
            onClick={onViewFlowchart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 text-cyan-400 hover:bg-slate-800 hover:border-cyan-500 transition-all shadow-md"
          >
            <span>📊 Akış Şemaları</span>
          </button>
        </div>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 items-start">
        {/* LEFT / CENTER: Keypad & Direct PIN Login */}
        <div className="lg:col-span-5 flex flex-col items-center bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          {/* Brand Header */}
          <div className="flex flex-col items-center mb-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-0.5 shadow-xl shadow-blue-500/20 mb-2 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Wrench className="w-7 h-7 text-cyan-400" />
              </div>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              AKG BAKIM SİSTEMİ
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Saha Arıza & Operatör Giriş Paneli
            </p>
          </div>

          {/* Matched Operator Preview Card */}
          <div className="w-full mb-4 h-16 flex items-center justify-center">
            {matchedOp ? (
              <button
                type="button"
                onClick={() => submitPin(pin)}
                className="w-full flex items-center justify-between bg-cyan-950/40 border border-cyan-500/60 hover:bg-cyan-900/50 p-2.5 rounded-2xl shadow-lg transition-all group"
                title="Giriş yapmak için tıklayın"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={matchedOp.photo}
                    alt={matchedOp.name}
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        matchedOp.name
                      )}&background=0284c7&color=fff&bold=true`;
                    }}
                    className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400 shadow-md"
                  />
                  <div className="text-left">
                    <div className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
                      {matchedOp.name}
                      {matchedOp.role === 'admin' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-cyan-400 font-semibold flex items-center gap-1">
                      <span>PIN: {matchedOp.pin}</span>
                      <span className="text-slate-400 font-normal">• {matchedOp.shortName}</span>
                    </div>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm group-hover:scale-105 transition-transform">
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Giriş</span>
                </div>
              </button>
            ) : (
              <div className="text-xs text-slate-400 flex items-center gap-2 bg-slate-950/60 px-4 py-2.5 rounded-2xl border border-slate-800">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                <span>PIN Kodunuzu Tuşlayınız veya Listeden Seçiniz</span>
              </div>
            )}
          </div>

          {/* PIN Indicators / Entered Code Display */}
          <div className="flex flex-col items-center mb-4">
            <div className="flex items-center justify-center gap-3 mb-1">
              {[0, 1, 2, 3].map((idx) => {
                const hasValue = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      error
                        ? 'bg-rose-500 scale-110 shadow-lg shadow-rose-500/50'
                        : hasValue
                        ? 'bg-cyan-400 scale-125 shadow-lg shadow-cyan-400/50'
                        : 'bg-slate-800 border border-slate-700'
                    }`}
                  />
                );
              })}
            </div>
            {pin.length > 0 && (
              <span className="text-xs font-mono font-bold text-cyan-400 tracking-widest mt-1">
                Girilen: {pin}
              </span>
            )}
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px] mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleDigit(num)}
                disabled={loading}
                className="h-12 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500 hover:bg-slate-900 active:scale-95 text-lg font-bold text-white transition-all shadow-md flex items-center justify-center select-none"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClear}
              disabled={loading || pin.length === 0}
              className="h-12 rounded-2xl bg-slate-950/60 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center select-none"
            >
              Temizle
            </button>
            <button
              onClick={() => handleDigit('0')}
              disabled={loading}
              className="h-12 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500 hover:bg-slate-900 active:scale-95 text-lg font-bold text-white transition-all shadow-md flex items-center justify-center select-none"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || pin.length === 0}
              className="h-12 rounded-2xl bg-slate-950/60 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-all flex items-center justify-center select-none"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Explicit "GİRİŞ YAP" Button */}
          <button
            onClick={() => submitPin(pin)}
            disabled={loading || pin.length === 0}
            className={`w-full max-w-[260px] h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              pin.length > 0
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-cyan-500/25 active:scale-98'
                : 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Giriş Yapılıyor...' : 'GİRİŞ YAP'}</span>
          </button>
        </div>

        {/* RIGHT: All Active Technicians & 1-Tap Quick Login */}
        <div className="lg:col-span-7 flex flex-col bg-slate-900/90 border border-slate-800/90 rounded-3xl p-5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                <span>Kayıtlı Bakım Teknisyenleri</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono font-bold">
                  {operators.length} Kişi
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Google E-Tablo ile senkronize gerçek operatör listesi
              </p>
            </div>

            {/* Quick Search */}
            <div className="relative w-40 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Teknisyen Ara..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Grid of Technicians */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
            {filteredOperators.map((op) => {
              const isSelected = matchedOp?.id === op.id || pin === op.pin;
              return (
                <button
                  key={op.id || op.pin}
                  onClick={() => handleQuickSelect(op)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border text-left transition-all group ${
                    isSelected
                      ? 'bg-cyan-950/70 border-cyan-400 shadow-md shadow-cyan-950'
                      : 'bg-slate-950/80 border-slate-800/90 hover:border-cyan-500/60 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <img
                      src={op.photo}
                      alt={op.name}
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          op.name
                        )}&background=0284c7&color=fff&bold=true`;
                      }}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700 group-hover:border-cyan-400 flex-shrink-0"
                    />
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                        {op.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-cyan-400 font-bold">
                          PIN: {op.pin}
                        </span>
                        {op.role === 'admin' ? (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5" /> Admin
                          </span>
                        ) : (
                          <span className="text-slate-400">Teknisyen</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:border-cyan-400 text-slate-400 transition-all flex-shrink-0 ml-2">
                    <LogIn className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>PIN kodunuzla veya isminize tıklayarak doğrudan giriş yapabilirsiniz.</span>
            </span>
            <span className="font-mono text-slate-500">v3.5 - Google Sheets Entegre</span>
          </div>
        </div>
      </div>
    </div>
  );
};
