import React, { useState } from 'react';
import { Smartphone, Download, Share2, PlusSquare, CheckCircle, X, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'modal';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If running inside standalone native PWA mode already, don't show the install trigger
  if (isInstalled) {
    return (
      <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-xs font-semibold">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>Uygulama Yüklü (PWA)</span>
      </div>
    );
  }

  const handleAction = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleAction}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 ${
          variant === 'banner'
            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
            : 'bg-slate-800/90 hover:bg-slate-700 text-cyan-300 border border-cyan-800/40 hover:border-cyan-500/60'
        } ${className}`}
        title="Uygulamayı Android veya iOS cihazınıza indirin / yükleyin"
      >
        <Smartphone className="w-4 h-4 text-cyan-400" />
        <span>Telefona Yükle</span>
        <Download className="w-3.5 h-3.5 opacity-70" />
      </button>

      {/* Guide Modal for iOS & Android */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4 text-slate-100 relative">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">
                  AKG CMMS'i Telefona Yükleyin
                </h3>
                <p className="text-xs text-slate-400">
                  Android & iOS Tam Uyumlu Progressive Web App (PWA)
                </p>
              </div>
            </div>

            {/* Direct Install prompt button if supported */}
            {isInstallable && (
              <div className="p-3 bg-cyan-950/40 border border-cyan-800/60 rounded-xl space-y-2">
                <p className="text-xs text-cyan-200">
                  Cihazınız tek tıkla doğrudan yüklemeyi destekliyor:
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    await install();
                    setShowModal(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Şimdi Yükle (Android / Chrome)</span>
                </button>
              </div>
            )}

            {/* Tabs / Instructions for both iOS & Android */}
            <div className="space-y-3 pt-1">
              {/* iOS Guide */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>iPhone / iPad (iOS Safari):</span>
                </div>
                <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside pl-1">
                  <li className="leading-relaxed">
                    Safari tarayıcısının altındaki <Share2 className="inline w-3.5 h-3.5 text-cyan-400 mx-1" /> <b>Paylaş</b> butonuna dokunun.
                  </li>
                  <li className="leading-relaxed">
                    Açılan menüyü aşağı kaydırıp <PlusSquare className="inline w-3.5 h-3.5 text-emerald-400 mx-1" /> <b>"Ana Ekrana Ekle"</b> seçeneğini seçin.
                  </li>
                  <li className="leading-relaxed">
                    Sağ üst köşedeki <b>"Ekle"</b> butonuna basarak kurulumu tamamlayın.
                  </li>
                </ol>
              </div>

              {/* Android Guide */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Android (Chrome / Samsung Internet):</span>
                </div>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside pl-1">
                  <li className="leading-relaxed">
                    Chrome sağ üstteki <b>üç nokta (⋮)</b> menüsüne dokunun.
                  </li>
                  <li className="leading-relaxed">
                    <b>"Ana Ekrana Ekle"</b> seçeneğine dokunun. (<i>"Uygulama yüklenemez" uyarısını engeller, anında kurulur</i>).
                  </li>
                  <li className="leading-relaxed">
                    Açılan onay kutusunda <b>"Ekle"</b> butonuna basarak kurulumu bitirin.
                  </li>
                </ol>

                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-[11px] text-emerald-300 leading-snug">
                  💡 <b>İpucu:</b> Eğer Chrome <i>"Bu uygulama yüklenemez"</i> derse, bunun nedeni Chrome'un Play Store WebAPK servisidir. Çözümü: Menüden <b>"Uygulamayı Yükle"</b> yerine <b>"Ana Ekrana Ekle"</b> seçeneğini seçmektir.
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
