import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Zap,
  Image as ImageIcon,
  Check,
  SwitchCamera,
  Layers
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { soundEffects } from '../../services/soundEffects';
import { normalizeTurkish, areLooseMatches } from '../../utils/textUtils';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedMachine?: string;
  expectedMachineCode?: string;
  availableMachines?: string[];
  onScanSuccess: (scannedMachine: string) => void;
}

// Built-in machine dictionary for AppSheet code or direct code resolution
const DEFAULT_MACHINE_DIRECTORY: Record<string, string> = {
  'PRS-04': 'Pres 04 - 400 Ton Hidrolik',
  'CNC-02': 'CNC Freze 02 - Doosan DNM 650',
  'RBT-01': 'Kaynak Robotu 01 - ABB IRB 1600',
  'KMP-01': 'Kompresör Dairesi - Atlas Copco GA75',
  'KNV-03': 'Paketleme Hattı Konveyörü 03',
  'FRN-01': 'Isıl İşlem Fırını 01',
  'TLL-05': 'Tel Çekme Hattı 05',
  'BKM-GENEL': 'BAKIM ONARIM GENEL',
  'KOMP-KAISER': 'KOMPRESÖR KAİSER'
};

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  expectedMachine,
  expectedMachineCode,
  availableMachines = [],
  onScanSuccess
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [mismatchedScannedMachine, setMismatchedScannedMachine] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isStartingRef = useRef(false);
  const hasMountedRef = useRef(false);
  const readerElementId = 'html5-qr-reader-container';

  // Build combined machine lookup table
  const machineLookup = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    const map = new Map<string, string>();
    Object.entries(DEFAULT_MACHINE_DIRECTORY).forEach(([code, name]) => {
      map.set(code, name);
      map.set(name, name);
    });
    availableMachines.forEach((m) => {
      if (m) {
        const code = m.split(' ')[0] || m;
        map.set(code, m);
        map.set(m, m);
      }
    });
    machineLookup.current = map;
  }, [availableMachines]);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setCameraError(null);
      setMismatchedScannedMachine(null);
      hasMountedRef.current = true;

      // Small delay to ensure the modal DOM element has rendered in browser layout
      const timer = setTimeout(() => {
        if (hasMountedRef.current) {
          startScanner();
        }
      }, 150);

      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      hasMountedRef.current = false;
      stopScanner();
    }
  }, [isOpen]);

  const stopScanner = async () => {
    if (isStartingRef.current) {
      // Wait a moment if currently in middle of starting
      await new Promise((r) => setTimeout(r, 200));
    }
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Error during scanner cleanup:', e);
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
    setIsInitializing(false);
    setIsTorchOn(false);
    setIsTorchSupported(false);
  };

  const startScanner = async (specificCameraId?: string) => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setIsInitializing(true);
    setCameraError(null);

    try {
      // Stop previous instance if exists
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch {
          // ignore
        }
      }

      // Ensure DOM element is present
      const container = document.getElementById(readerElementId);
      if (!container) {
        console.warn('Scanner container not yet mounted');
        isStartingRef.current = false;
        setIsInitializing(false);
        return;
      }

      // Initialize Html5Qrcode with hardware-accelerated BarcodeDetector
      const html5QrCode = new Html5Qrcode(readerElementId, {
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        },
        verbose: false
      });
      scannerRef.current = html5QrCode;

      // Detect available cameras
      let foundCameras: Array<{ id: string; label: string }> = [];
      try {
        const devs = await Html5Qrcode.getCameras();
        if (devs && devs.length > 0) {
          foundCameras = devs;
          setCameras(devs);
        }
      } catch (camErr) {
        console.warn('Unable to enumerate cameras:', camErr);
      }

      // Select camera: either specified, or rear/environment, or default facingMode
      let cameraConfig: any = { facingMode: 'environment' };

      if (specificCameraId) {
        cameraConfig = specificCameraId;
      } else if (foundCameras.length > 0) {
        // Priority to rear/back camera on Android
        const rearIdx = foundCameras.findIndex((c) =>
          /back|rear|environment|arka|dış|out|main/i.test(c.label)
        );
        const selectedIdx = rearIdx >= 0 ? rearIdx : foundCameras.length - 1;
        setCurrentCameraIndex(selectedIdx);
        cameraConfig = foundCameras[selectedIdx].id;
      }

      // Dynamic qrbox based on actual container dimensions
      const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const edge = Math.max(160, Math.floor(minEdge * 0.72));
        return { width: edge, height: edge };
      };

      const scanConfig = {
        fps: 12,
        qrbox: qrboxFunction
      };

      await html5QrCode.start(
        cameraConfig,
        scanConfig,
        (decodedText) => {
          handleDecodedResult(decodedText);
        },
        () => {
          // Scanning frame error, benign
        }
      );

      setCameraActive(true);
      setIsInitializing(false);

      // Check for torch capability
      try {
        // @ts-ignore
        const capabilities = html5QrCode.getRunningTrackCapabilities?.();
        if (capabilities && 'torch' in capabilities) {
          setIsTorchSupported(true);
        }
      } catch {
        // torch check fallback
      }
    } catch (err: any) {
      console.warn('Camera start failed:', err);
      setCameraActive(false);
      setIsInitializing(false);

      const errString = String(err?.message || err || '');
      if (err?.name === 'NotAllowedError' || /permission|denied|izin/i.test(errString)) {
        setCameraError(
          'Kamera izni engellendi. Android Chrome adres çubuğundaki kilit (🔒) simgesine dokunup kamera iznini "İzin Ver" olarak değiştirin.'
        );
      } else if (err?.name === 'NotFoundError' || /not found|bulunamadı/i.test(errString)) {
        setCameraError('Cihazda uygun kamera tespit edilemedi.');
      } else if (err?.name === 'NotReadableError' || /in use|meşgul/i.test(errString)) {
        setCameraError('Kamera başka bir uygulama tarafından kullanılıyor olabilir.');
      } else {
        setCameraError('Kamera akışı başlatılamadı. "Fotoğraf Çek / Yükle" butonunu kullanabilirsiniz.');
      }
    } finally {
      isStartingRef.current = false;
    }
  };

  // Switch between front/back or multiple cameras on Android
  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    const nextIdx = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIdx);
    startScanner(cameras[nextIdx].id);
  };

  // Toggle flashlight on machine QR sticker
  const handleToggleTorch = async () => {
    if (!scannerRef.current || !isTorchSupported) return;
    try {
      const nextState = !isTorchOn;
      // @ts-ignore
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }]
      });
      setIsTorchOn(nextState);
    } catch (e) {
      console.warn('Torch toggle error:', e);
    }
  };

  // Handle Photo Capture / Gallery file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      setMismatchedScannedMachine(null);

      let qrInstance = scannerRef.current;
      if (!qrInstance) {
        qrInstance = new Html5Qrcode(readerElementId);
        scannerRef.current = qrInstance;
      }

      const decodedResult = await qrInstance.scanFile(file, true);
      handleDecodedResult(decodedResult);
    } catch (err: any) {
      console.warn('Scan file error:', err);
      soundEffects.playErrorBuzz();
      setErrorMessage(
        'Çekilen fotoğrafta karekod okunamadı. Lütfen etikete daha yakın, net ve ışıklı bir fotoğraf çekiniz.'
      );
    } finally {
      e.target.value = '';
    }
  };

  // Smart Machine Resolution (supports JSON, URLs, row IDs, Turkish names)
  const resolveMachineFromText = (text: string): string => {
    const clean = text.trim();

    // 1. JSON payload parsing (e.g. {"machine": "PRS-04", ...})
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const parsed = JSON.parse(clean);
        const val =
          parsed.machine ||
          parsed.makine ||
          parsed.machineCode ||
          parsed.code ||
          parsed.id ||
          parsed.name;
        if (val && typeof val === 'string') {
          return resolveMachineFromText(val);
        }
      } catch {
        // Continue
      }
    }

    // 2. AppSheet or URL row param (e.g. https://...#row=PRS-04)
    if (clean.includes('#row=')) {
      const rowMatch = clean.match(/#row=([^&]+)/);
      if (rowMatch && rowMatch[1]) {
        const rowId = decodeURIComponent(rowMatch[1]);
        if (machineLookup.current.has(rowId)) return machineLookup.current.get(rowId)!;
        for (const [code, name] of machineLookup.current.entries()) {
          if (areLooseMatches(rowId, code) || areLooseMatches(rowId, name)) {
            return name;
          }
        }
        return rowId;
      }
    }

    // 3. Web URL parsing (e.g. http://.../machine/PRS-04 or ?machine=...)
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      try {
        const url = new URL(clean);
        const p =
          url.searchParams.get('machine') ||
          url.searchParams.get('makine') ||
          url.searchParams.get('code') ||
          url.searchParams.get('id');
        if (p) return resolveMachineFromText(decodeURIComponent(p));

        const segments = url.pathname.split('/').filter(Boolean);
        if (segments.length > 0) {
          const last = decodeURIComponent(segments[segments.length - 1]);
          return resolveMachineFromText(last);
        }
      } catch {
        // Continue
      }
    }

    // 4. Match against known machines dictionary with Turkish loose comparison
    for (const [code, name] of machineLookup.current.entries()) {
      if (areLooseMatches(clean, code) || areLooseMatches(clean, name)) {
        return name;
      }
    }

    return clean;
  };

  const handleDecodedResult = (scannedRaw: string) => {
    const resolvedName = resolveMachineFromText(scannedRaw);

    // If verification against an expected machine is required:
    if (expectedMachine) {
      const isMatch =
        areLooseMatches(resolvedName, expectedMachine) ||
        areLooseMatches(scannedRaw, expectedMachine) ||
        (expectedMachineCode && areLooseMatches(scannedRaw, expectedMachineCode));

      if (!isMatch) {
        soundEffects.playErrorBuzz();
        setMismatchedScannedMachine(resolvedName);
        setErrorMessage(
          `❌ YANLIŞ MAKİNE! Okutulan: "${resolvedName}". Beklenen: "${expectedMachine}".`
        );
        return;
      }
    }

    // Match verified!
    soundEffects.playSuccessBeep();
    setErrorMessage(null);
    setMismatchedScannedMachine(null);
    setSuccessMessage(`✅ Doğrulandı: ${resolvedName}`);
    stopScanner();

    setTimeout(() => {
      onScanSuccess(resolvedName);
      onClose();
    }, 500);
  };

  // Manual Override (when operator confirms on shop-floor despite QR discrepancy)
  const handleForceOverride = () => {
    if (!expectedMachine) return;
    soundEffects.playSuccessBeep();
    setSuccessMessage(`✅ Manuel Doğrulandı: ${expectedMachine}`);
    stopScanner();
    setTimeout(() => {
      onScanSuccess(expectedMachine);
      onClose();
    }, 400);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDecodedResult(manualInput);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn">
      {/* Hidden File Input for Native Android Camera / Gallery Pick */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />

      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Saha Karekod Doğrulama</span>
                {cameraActive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                Makine etiketi üzerindeki karekodu okutunuz
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
          <div className="px-4 py-2.5 bg-cyan-950/50 border-b border-cyan-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="text-xs truncate">
                <span className="text-slate-400">Hedef Makine:</span>{' '}
                <span className="font-extrabold text-cyan-300">
                  {expectedMachine}
                </span>
              </div>
            </div>
            {expectedMachineCode && (
              <span className="px-1.5 py-0.5 rounded bg-cyan-900/80 border border-cyan-700 text-[10px] font-mono text-cyan-200">
                {expectedMachineCode}
              </span>
            )}
          </div>
        )}

        {/* Camera Viewfinder Area */}
        <div className="p-3.5 flex flex-col items-center bg-black relative">
          <div
            id={readerElementId}
            className="w-full max-w-[290px] h-[270px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center relative shadow-inner"
          >
            {isInitializing && (
              <div className="text-center p-4">
                <RefreshCw className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-spin" />
                <p className="text-xs text-cyan-300 font-medium">
                  Kamera başlatılıyor...
                </p>
              </div>
            )}

            {!cameraActive && !isInitializing && (
              <div className="text-center p-4 space-y-2">
                <Camera className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-300 font-medium">
                  {cameraError || 'Kamera kapalı veya izin bekleniyor'}
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => startScanner()}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Kamerayı Başlat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Fotoğraf Çek / Seç</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Camera Quick Controls Bar */}
          {cameraActive && (
            <div className="flex items-center gap-2 mt-2.5">
              {cameras.length > 1 && (
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-200 text-[11px] font-medium inline-flex items-center gap-1 hover:bg-slate-700 transition-colors"
                  title="Ön / Arka veya Geniş Açılı Kameraya Geç"
                >
                  <SwitchCamera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Kamera Değiştir ({currentCameraIndex + 1}/{cameras.length})</span>
                </button>
              )}

              {isTorchSupported && (
                <button
                  type="button"
                  onClick={handleToggleTorch}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium inline-flex items-center gap-1 transition-colors ${
                    isTorchOn
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Karanlık paneller için flaş ışığı"
                >
                  <Zap className={`w-3.5 h-3.5 ${isTorchOn ? 'text-amber-400 fill-amber-400' : ''}`} />
                  <span>{isTorchOn ? 'Feneri Kapat' : 'Feneri Aç'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-300 text-[11px] font-medium inline-flex items-center gap-1 hover:bg-slate-700 transition-colors"
                title="Kamerayla net fotoğraf çekerek tara"
              >
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>Fotoğraf Çek</span>
              </button>
            </div>
          )}

          {/* Error Banner with Manual Override Option */}
          {errorMessage && (
            <div className="mt-3 w-full p-2.5 rounded-xl bg-rose-950/95 border border-rose-600 text-rose-200 text-xs flex flex-col gap-2 animate-shake">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>

              {/* Force Override Option for Shop-Floor Technicians */}
              {expectedMachine && mismatchedScannedMachine && (
                <div className="pt-1 border-t border-rose-900/60 flex items-center justify-between">
                  <span className="text-[11px] text-rose-300">
                    Makinede misiniz?
                  </span>
                  <button
                    type="button"
                    onClick={handleForceOverride}
                    className="px-2.5 py-1 rounded-lg bg-rose-800 hover:bg-rose-700 text-white text-[11px] font-bold inline-flex items-center gap-1 transition-all"
                  >
                    <Check className="w-3 h-3" />
                    <span>Yine de Doğrula & Başla</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mt-3 w-full p-2.5 rounded-xl bg-emerald-950/95 border border-emerald-600 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold">{successMessage}</span>
            </div>
          )}
        </div>

        {/* Quick Simulator & Fallback Selection */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 space-y-3 overflow-y-auto">
          {/* Quick Shortcuts */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Saha Hızlı Seçim:</span>
              <span className="text-cyan-400 font-normal">Tek tıkla simüle et</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(DEFAULT_MACHINE_DIRECTORY).slice(0, 4).map(([code, name]) => (
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
              placeholder="Veya makine kodunu yazınız (örn: PRS-04)..."
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
