import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { soundEffects } from '../../services/soundEffects';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedMachine?: string;
  expectedMachineCode?: string;
  onScanSuccess: (scannedMachine: string) => void;
}

// Sample machine dictionary for AppSheet code or direct code resolution
const MACHINE_DIRECTORY: Record<string, string> = {
  'PRS-04': 'Pres 04 - 400 Ton Hidrolik',
  'CNC-02': 'CNC Freze 02 - Doosan DNM 650',
  'RBT-01': 'Kaynak Robotu 01 - ABB IRB 1600',
  'KMP-01': 'Kompresör Dairesi - Atlas Copco GA75',
  'KNV-03': 'Paketleme Hattı Konveyörü 03',
  'FRN-01': 'Isıl İşlem Fırını 01',
  'TLL-05': 'Tel Çekme Hattı 05'
};

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  expectedMachine,
  expectedMachineCode,
  onScanSuccess
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'html5-qr-reader-container';

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear();
      } catch {
        // Ignore
      }
      scannerRef.current = null;
      setCameraActive(false);
    }
  };

  const startScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode(readerElementId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleDecodedResult(decodedText);
        },
        () => {
          // Scanning frames, ignore errors
        }
      );
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera start issue (falling back to manual / test buttons):', err);
      setCameraActive(false);
    }
  };

  // Resolve QR code content (handles AppSheet URLs or direct machine codes)
  const resolveMachineFromText = (text: string): string => {
    const clean = text.trim();

    // Check if AppSheet URL with row param
    if (clean.includes('#row=')) {
      const rowMatch = clean.match(/#row=([^&]+)/);
      if (rowMatch && rowMatch[1]) {
        const rowId = rowMatch[1];
        if (MACHINE_DIRECTORY[rowId]) return MACHINE_DIRECTORY[rowId];
      }
    }

    // Check direct machine code
    for (const [code, name] of Object.entries(MACHINE_DIRECTORY)) {
      if (
        clean.toUpperCase().includes(code) ||
        clean.toLowerCase().includes(name.toLowerCase())
      ) {
        return name;
      }
    }

    return clean;
  };

  const handleDecodedResult = (scannedRaw: string) => {
    const resolvedName = resolveMachineFromText(scannedRaw);

    // If expected machine was specified, verify match!
    if (expectedMachine) {
      const expNorm = expectedMachine.toLowerCase().trim();
      const resNorm = resolvedName.toLowerCase().trim();
      const codeNorm = (expectedMachineCode || '').toLowerCase().trim();

      const isMatch =
        resNorm.includes(expNorm) ||
        expNorm.includes(resNorm) ||
        (codeNorm && scannedRaw.toLowerCase().includes(codeNorm));

      if (!isMatch) {
        soundEffects.playErrorBuzz();
        setErrorMessage(
          `❌ YANLIŞ MAKİNE! Okutulan: "${resolvedName}". Beklenen: "${expectedMachine}". Lütfen doğru makinenin karekodunu okutunuz.`
        );
        return;
      }
    }

    // Match verified!
    soundEffects.playSuccessBeep();
    setSuccessMessage(`✅ Doğrulandı: ${resolvedName}`);
    stopScanner();

    setTimeout(() => {
      onScanSuccess(resolvedName);
      onClose();
    }, 600);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDecodedResult(manualInput);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Saha Karekod Doğrulama
              </h3>
              <p className="text-[11px] text-slate-400">
                Makine üzerindeki karekodu kameraya gösteriniz
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

        {/* Expected Machine Target Notice */}
        {expectedMachine && (
          <div className="px-4 py-2.5 bg-cyan-950/40 border-b border-cyan-800/60 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-400">Doğrulanacak Makine:</span>{' '}
              <span className="font-extrabold text-cyan-300">
                {expectedMachine}
              </span>
            </div>
          </div>
        )}

        {/* Camera Viewfinder Area */}
        <div className="p-4 flex flex-col items-center bg-black relative">
          <div
            id={readerElementId}
            className="w-full max-w-[280px] h-[280px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center relative shadow-inner"
          >
            {!cameraActive && (
              <div className="text-center p-4">
                <Camera className="w-10 h-10 text-slate-600 mx-auto mb-2 animate-pulse" />
                <p className="text-xs text-slate-400 font-medium">
                  Kamera başlatılıyor veya izin bekleniyor...
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  (Aşağıdaki test butonlarını da kullanabilirsiniz)
                </p>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mt-3 p-2.5 rounded-xl bg-rose-950/90 border border-rose-600 text-rose-200 text-xs flex items-start gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Quick Simulator Buttons for Testing */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 space-y-3">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Saha Testi Hızlı Seçim:</span>
              <span className="text-cyan-400 font-normal">Tek tıkla simüle et</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(MACHINE_DIRECTORY).slice(0, 4).map(([code, name]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleDecodedResult(code)}
                  className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500 text-left transition-colors group"
                >
                  <div className="text-[10px] font-mono font-bold text-cyan-400 group-hover:text-cyan-300">
                    {code}
                  </div>
                  <div className="text-[11px] text-slate-300 truncate">
                    {name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="flex gap-2 pt-1">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Veya makine kodunu elle yazınız (örn: PRS-04)..."
              className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-sm"
            >
              Doğrula
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
