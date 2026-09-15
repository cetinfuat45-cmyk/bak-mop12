import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Header } from './components/Header';
import { FlowchartCanvas } from './components/FlowchartCanvas';
import { NodeInspector } from './components/NodeInspector';
import { ProcessSimulator } from './components/ProcessSimulator';
import { ArchitectureView } from './components/ArchitectureView';
import { MermaidModal } from './components/MermaidModal';
import { FLOW_DIAGRAMS } from './data/flowData';
import {
  Fault,
  FlowCategory,
  FlowNode,
  Operator,
  SystemConfig,
  SystemMessage,
  ViewSettings,
  WeeklyStats
} from './types';
import { cmmsService } from './services/firebaseService';
import { soundEffects } from './services/soundEffects';

// CMMS Components
import { LoginScreen } from './components/cmms/LoginScreen';
import { CmmsHeader } from './components/cmms/CmmsHeader';
import { FaultsList } from './components/cmms/FaultsList';
import { MessageBanner } from './components/cmms/MessageBanner';
import { QrScannerModal } from './components/cmms/QrScannerModal';
import { MachineFaultsModal } from './components/cmms/MachineFaultsModal';
import { InterventionModal } from './components/cmms/InterventionModal';
import { ClosedTodayModal } from './components/cmms/ClosedTodayModal';
import { WeeklyReportModal } from './components/cmms/WeeklyReportModal';
import { MessageModal } from './components/cmms/MessageModal';
import { AdminMessageMonitorModal } from './components/cmms/AdminMessageMonitorModal';
import { OperatorSettingsModal } from './components/cmms/OperatorSettingsModal';
import { ViewSettingsModal } from './components/cmms/ViewSettingsModal';
import { ThemeSettingsModal } from './components/cmms/ThemeSettingsModal';

const DEFAULT_VIEW_SETTINGS: ViewSettings = {
  displayMode: 'card',
  groupBy: 'faultType',
  showShift: true,
  showReporter: true,
  showAssignee: true,
  showDescription: true,
  soundEnabled: true,
  themeColor: 'cyan',
  fontSize: 15
};

export default function App() {
  // Main application mode: 'cmms' (Operational app) or 'flowchart' (Diagrams & Architecture)
  const [appMode, setAppMode] = useState<'cmms' | 'flowchart'>('cmms');

  // Flowchart View States
  const [activeCategory, setActiveCategory] = useState<FlowCategory>('master');
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [activeSimNodeId, setActiveSimNodeId] = useState<string | null>(null);
  const [isMermaidModalOpen, setIsMermaidModalOpen] = useState(false);

  // Operational CMMS States
  const [currentOperator, setCurrentOperator] = useState<Operator | null>(() =>
    cmmsService.getSavedOperator()
  );
  const [faults, setFaults] = useState<Fault[]>([]);
  const [closedArchive, setClosedArchive] = useState<Fault[]>(() =>
    cmmsService.getClosedArchive()
  );
  const [config, setConfig] = useState<SystemConfig>(() =>
    cmmsService.getConfig()
  );
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({});
  const [activeBannerMessage, setActiveBannerMessage] =
    useState<SystemMessage | null>(null);

  // View preferences
  const [viewSettings, setViewSettings] = useState<ViewSettings>(() => {
    try {
      const saved = localStorage.getItem('akg_cmms_view_settings');
      return saved ? JSON.parse(saved) : DEFAULT_VIEW_SETTINGS;
    } catch {
      return DEFAULT_VIEW_SETTINGS;
    }
  });

  // CMMS Modals
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [targetScanFault, setTargetScanFault] = useState<Fault | null>(null);
  const [scannedMachineName, setScannedMachineName] = useState<string | null>(
    null
  );
  const [isMachineFaultsOpen, setIsMachineFaultsOpen] = useState(false);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [selectedFaultForIntervention, setSelectedFaultForIntervention] =
    useState<Fault | null>(null);
  const [isClosedTodayOpen, setIsClosedTodayOpen] = useState(false);
  const [isWeeklyReportOpen, setIsWeeklyReportOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageReplyTarget, setMessageReplyTarget] = useState<string>('ALL');
  const [isMessageMonitorOpen, setIsMessageMonitorOpen] = useState(false);
  const [isOperatorSettingsOpen, setIsOperatorSettingsOpen] = useState(false);
  const [isViewSettingsOpen, setIsViewSettingsOpen] = useState(false);
  const [isThemeSettingsOpen, setIsThemeSettingsOpen] = useState(false);

  // Sync sound setting
  useEffect(() => {
    soundEffects.setEnabled(viewSettings.soundEnabled);
  }, [viewSettings.soundEnabled]);

  // Persist view preferences
  const handleUpdateViewSettings = (updated: ViewSettings) => {
    setViewSettings(updated);
    try {
      localStorage.setItem(
        'akg_cmms_view_settings',
        JSON.stringify(updated)
      );
    } catch {
      // Ignore
    }
  };

  // Subscriptions to CMMS services
  useEffect(() => {
    // Auto-sync operators and parameters from Google Sheets on load
    cmmsService.syncFromExcel().catch((err) => {
      console.warn('Initial Google Sheet sync error', err);
    });

    const unsubFaults = cmmsService.subscribeToFaults(setFaults);
    const unsubArchive = cmmsService.subscribeToClosedArchive(setClosedArchive);
    const unsubConfig = cmmsService.subscribeToConfig(setConfig);
    const unsubWeekly = cmmsService.subscribeToWeeklyStats(setWeeklyStats);
    const unsubMessages = cmmsService.subscribeToMessages((allMsgs) => {
      setMessages(allMsgs);
      if (allMsgs.length > 0 && currentOperator) {
        const latest = allMsgs[0];
        const msgTime =
          typeof latest.timestamp === 'number'
            ? latest.timestamp
            : new Date(latest.timestamp).getTime();

        const isFieldAlert =
          latest.isFieldNotification ||
          latest.sender.toLowerCase().includes('saha') ||
          latest.sender === 'Sahadan Bildirim';

        const isTarget =
          latest.target === 'ALL' ||
          isFieldAlert ||
          latest.target === currentOperator.name ||
          (latest.target && latest.target.toLocaleLowerCase('tr-TR').includes(currentOperator.name.toLocaleLowerCase('tr-TR'))) ||
          (latest.targetUsers && latest.targetUsers.some(u => u.trim().toLocaleLowerCase('tr-TR') === currentOperator.name.trim().toLocaleLowerCase('tr-TR')));

        const isRecent = !isNaN(msgTime) && Date.now() - msgTime < 24 * 3600000;
        if (isTarget && isRecent && latest.sender !== currentOperator.name) {
          setActiveBannerMessage(latest);
          if (isFieldAlert) {
            soundEffects.playAlarm();
            Swal.fire({
              title: '🚨 SAHADAN BİLDİRİM',
              text: `${latest.sender}: ${latest.text}`,
              icon: 'warning',
              background: '#facc15',
              color: '#020617',
              iconColor: '#020617',
              toast: true,
              position: 'top-end',
              timer: 6000,
              showConfirmButton: false,
              customClass: {
                popup: 'border-2 border-yellow-600 font-bold shadow-2xl'
              }
            });
          } else {
            soundEffects.playMessageChime();
          }
        }
      }
    });

    return () => {
      unsubFaults();
      unsubArchive();
      unsubConfig();
      unsubWeekly();
      unsubMessages();
    };
  }, [currentOperator]);

  // Calculate daily stats for logged in operator
  const getDailyStatsText = (): string => {
    if (!currentOperator) return '';
    const todayStr = new Date().toLocaleDateString('tr-TR');
    const allRelevant = [...faults, ...closedArchive];
    const closedToday = allRelevant.filter(
      (f) =>
        f.status === 'Kapalı' &&
        (f.date === todayStr || !f.date) &&
        (f.closedBy === currentOperator.name ||
          (f.interventions &&
            f.interventions.some(
              (i) => i.operator === currentOperator.name
            )))
    );

    const totalMins = closedToday.reduce((acc, f) => {
      const myLog = f.interventions?.find(
        (i) => i.operator === currentOperator.name
      );
      return acc + (myLog ? myLog.minutes : f.totalDowntimeMinutes || 0);
    }, 0);

    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `(Bugün ${closedToday.length} iş • ${h}s ${m}d)`;
  };

  // Count recent messages addressed to current operator (within last 24 hours)
  const unreadMessageCount = currentOperator
    ? messages.filter((m) => {
        const msgTime =
          typeof m.timestamp === 'number'
            ? m.timestamp
            : new Date(m.timestamp).getTime();
        const isRecent = !isNaN(msgTime) && Date.now() - msgTime < 24 * 3600000;
        const isFieldAlert =
          m.isFieldNotification ||
          m.sender.toLowerCase().includes('saha') ||
          m.sender === 'Sahadan Bildirim';
        const isForMe =
          m.target === 'ALL' ||
          isFieldAlert ||
          m.target === currentOperator.name ||
          (m.target && m.target.toLocaleLowerCase('tr-TR').includes(currentOperator.name.toLocaleLowerCase('tr-TR'))) ||
          (m.targetUsers && m.targetUsers.some(u => u.trim().toLocaleLowerCase('tr-TR') === currentOperator.name.trim().toLocaleLowerCase('tr-TR')));
        return isForMe && isRecent && m.sender !== currentOperator.name;
      }).length
    : 0;

  // Login Handler
  const handleLogin = async (pin: string): Promise<boolean> => {
    const op = await cmmsService.loginWithPin(pin);
    if (op) {
      setCurrentOperator(op);
      return true;
    }
    return false;
  };

  // Logout Handler
  const handleLogout = () => {
    cmmsService.logout();
    setCurrentOperator(null);
  };

  // Check QR Code Exemption for an operator
  const isOperatorQrExempt = (op: Operator): boolean => {
    if (op.role === 'admin') return true;
    if (op.qrExemptUntil === -1) return true;
    if (op.qrExemptUntil && op.qrExemptUntil > Date.now()) return true;
    return false;
  };

  // Start intervention on a fault
  const handleStartIntervention = async (fault: Fault) => {
    if (!currentOperator) return;

    // Check QR Exemption
    if (isOperatorQrExempt(currentOperator)) {
      await cmmsService.startIntervention(fault.id, currentOperator.name);
      soundEffects.playSuccessBeep();
      Swal.fire({
        icon: 'success',
        title: 'Müdahale Başlatıldı',
        text: `${fault.machine} arızasına başladınız. Kronometre aktif.`,
        timer: 1800,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#f8fafc'
      });
    } else {
      // Must scan QR code of the machine
      setTargetScanFault(fault);
      setIsQrModalOpen(true);
    }
  };

  // QR Scanner success callback
  const handleQrScanSuccess = async (scannedMachine: string) => {
    if (!currentOperator) return;

    // Case 1: Was verifying specific fault
    if (targetScanFault) {
      await cmmsService.startIntervention(
        targetScanFault.id,
        currentOperator.name
      );
      soundEffects.playSuccessBeep();
      Swal.fire({
        icon: 'success',
        title: 'Karekod Doğrulandı!',
        text: `${targetScanFault.machine} arızası başlatıldı.`,
        timer: 1800,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#f8fafc'
      });
      setTargetScanFault(null);
      setIsQrModalOpen(false);
      return;
    }

    // Case 2: General scan from top menu
    setScannedMachineName(scannedMachine);
    setIsQrModalOpen(false);
    setIsMachineFaultsOpen(true);
  };

  // Join as Helper
  const handleJoinHelper = async (fault: Fault) => {
    if (!currentOperator) return;
    await cmmsService.joinAsHelper(fault.id, currentOperator.name);
    soundEffects.playSuccessBeep();
    Swal.fire({
      icon: 'success',
      title: 'Yardımcı Olarak Katıldınız',
      text: `${fault.machine} arızasında ${fault.assignedTo} ile birliktesiniz.`,
      timer: 1800,
      showConfirmButton: false,
      background: '#0f172a',
      color: '#f8fafc'
    });
  };

  // Leave as Helper
  const handleLeaveHelper = async (fault: Fault) => {
    if (!currentOperator) return;

    // Automatically calculate elapsed minutes for this helper from their join time
    let autoMins = 5;
    let joinedTimeStr = '';
    const opUpper = currentOperator.name.trim().toLocaleUpperCase('tr-TR');

    let joinIso: string | undefined = undefined;
    if (fault.helperJoinedAt) {
      const matchedKey = Object.keys(fault.helperJoinedAt).find(
        (k) => k.trim().toLocaleUpperCase('tr-TR') === opUpper
      );
      if (matchedKey) {
        joinIso = fault.helperJoinedAt[matchedKey];
      }
    }

    if (joinIso) {
      const joinMs = new Date(joinIso).getTime();
      if (!isNaN(joinMs)) {
        autoMins = Math.max(1, Math.round((Date.now() - joinMs) / 60000));
        joinedTimeStr = new Date(joinMs).toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } else if (fault.startedAt) {
      autoMins = Math.max(
        1,
        Math.round((Date.now() - new Date(fault.startedAt).getTime()) / 60000)
      );
    }

    const result = await Swal.fire({
      title: 'Bakımdan Ayrıl',
      html: `
        <div class="text-left text-xs space-y-2 text-slate-300">
          <p><b class="text-white">${fault.machine}</b> arızasındaki yardımınızı sonlandırıyorsunuz.</p>
          <div class="p-3 bg-cyan-950/40 border border-cyan-700/50 rounded-xl">
            <span class="text-cyan-400 font-bold block mb-1">⏱️ Sistem Otomatik Hesapladı:</span>
            <span class="text-white text-base font-black">${autoMins} dakika</span>
            ${joinedTimeStr ? `<span class="text-slate-400 text-xs block mt-1">(Katılım Saati: ${joinedTimeStr})</span>` : ''}
          </div>
          <p class="text-[11px] text-emerald-400 font-semibold">✓ Süre otomatik olarak performans loguna işlenecektir.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Ayrıl & Loga Kaydet',
      cancelButtonText: 'Vazgeç',
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#0284c7'
    });

    if (result.isConfirmed) {
      await cmmsService.leaveHelper(
        fault.id,
        currentOperator.name,
        autoMins
      );
      soundEffects.playSuccessBeep();
      Swal.fire({
        icon: 'success',
        title: 'Performans Loguna İşlendi',
        text: `${autoMins} dakikalık yardım süreniz başarıyla kaydedildi.`,
        timer: 1800,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#f8fafc'
      });
    }
  };

  // Reassign fault (Admin)
  const handleReassign = async (fault: Fault, newOpName: string) => {
    if (!newOpName) return;
    await cmmsService.reassignFault(fault.id, newOpName);
    soundEffects.playSuccessBeep();
  };

  // Open intervention form modal
  const handleOpenInterventionModal = (fault: Fault) => {
    setSelectedFaultForIntervention(fault);
    setIsInterventionModalOpen(true);
  };

  // Close fault submit handler
  const handleSubmitCloseFault = async (params: {
    actionTaken: string;
    partsChanged: string;
    faultReason: string;
    stoppageReason: string;
    operatorName: string;
    minutes: number;
    helperMinutes?: Record<string, number>;
  }) => {
    if (!selectedFaultForIntervention) return;
    const res = await cmmsService.closeFault(selectedFaultForIntervention.id, params);
    Swal.fire({
      icon: 'success',
      title: '🎉 Arıza Kapatıldı & E-Tabloya Aktarıldı!',
      text: res?.sheetsSynced
        ? `${selectedFaultForIntervention.machine} arızası Google E-Tablo'ya aktarıldı ve veri tabanından silindi.`
        : `${selectedFaultForIntervention.machine} arızası kapatıldı ve veri tabanından silindi.`,
      timer: 2800,
      showConfirmButton: false,
      background: '#0f172a',
      color: '#f8fafc'
    });
  };

  // Update status without closing (Parça Bekliyor, Devredildi, Arızadan Çıkma vb.)
  const handleSubmitStatusUpdate = async (
    status: Fault['status'],
    note?: string,
    minutes?: number
  ) => {
    if (!selectedFaultForIntervention) return;
    await cmmsService.updateFaultStatus(
      selectedFaultForIntervention.id,
      status,
      note,
      currentOperator?.name,
      minutes
    );
    const label =
      status === 'Devredildi'
        ? 'Vardiyaya Devredildi'
        : status === 'Parça Bekliyor'
        ? 'Parça Beklemeye Alındı'
        : status === 'Açık'
        ? 'Arızadan Çıkıldı (Açık)'
        : status;
    Swal.fire({
      icon: 'success',
      title: 'Müdahale Kaydı İşlendi',
      text: `${selectedFaultForIntervention.machine}: [${label}] olarak güncellendi ve ${minutes || 0} dakikalık çalışma süreniz loglandı.`,
      timer: 2200,
      showConfirmButton: false,
      background: '#0f172a',
      color: '#f8fafc'
    });
  };

  // Google Sheets Export (Sadece Kaydet, Ekranda Tut)
  const handleExportOnlyToSheets = async () => {
    const allRelevant = [...faults, ...closedArchive];
    const closedCount = allRelevant.filter((f) => f.status === 'Kapalı').length;
    if (closedCount === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Kayıt Bulunamadı',
        text: 'Google E-Tabloya aktarılacak kapatılmış arıza kaydı bulunmuyor.',
        background: '#0f172a',
        color: '#f8fafc'
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'Google E-Tablolara Kaydet',
      text: `Kapatılmış ${closedCount} adet arıza kaydı Google E-Tabloya (16 sütun) aktarılacak. Devam edilsin mi?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Evet, E-Tabloya Kaydet',
      cancelButtonText: 'İptal',
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#059669'
    });

    if (confirm.isConfirmed) {
      Swal.fire({
        title: 'Kaydediliyor...',
        text: 'Google Apps Script ve E-Tablo bağlantısı kuruluyor.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        background: '#0f172a',
        color: '#f8fafc'
      });

      const res = await cmmsService.exportClosedFaultsToGoogleSheets({
        onlyPreviousDays: false,
        deleteAfter: false
      });

      Swal.fire({
        icon: res.success ? 'success' : 'error',
        title: res.success ? 'Kayıt Başarılı' : 'Aktarım Başarısız',
        text: res.message,
        background: '#0f172a',
        color: '#f8fafc'
      });
    }
  };

  // Google Sheets 16-Column Export (Şimdi Aktar ve Sil)
  const handleExportAndClear = async () => {
    const confirm = await Swal.fire({
      title: 'Google E-Tablolar Aktarımı & Arşiv',
      text: "Kapatılmış arızalar Google E-Tabloya 16 sütun olarak aktarılacak ve başarıyla yazıldıktan sonra ekrandan temizlenecektir. Devam edilsin mi?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Evet, Aktar ve Arşivle',
      cancelButtonText: 'İptal',
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#d97706'
    });

    if (confirm.isConfirmed) {
      Swal.fire({
        title: 'Aktarılıyor...',
        text: 'Google Apps Script bağlantısı kuruluyor.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        background: '#0f172a',
        color: '#f8fafc'
      });

      const res = await cmmsService.exportClosedFaultsToGoogleSheets({
        onlyPreviousDays: false,
        deleteAfter: true
      });

      Swal.fire({
        icon: res.success ? 'success' : 'error',
        title: res.success ? 'Arşivleme Tamamlandı' : 'Hata Oluştu',
        text: res.message,
        background: '#0f172a',
        color: '#f8fafc'
      });
    }
  };

  // Sync from Excel
  const handleSyncFromExcel = async () => {
    Swal.fire({
      title: 'Senkronize Ediliyor...',
      text: 'Excel ve Google Sheets üzerinden veriler alınıyor.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      background: '#0f172a',
      color: '#f8fafc'
    });

    const res = await cmmsService.syncFromExcel();
    Swal.fire({
      icon: 'success',
      title: 'Senkronizasyon Başarılı',
      text: res.message,
      background: '#0f172a',
      color: '#f8fafc'
    });
  };

  // P2P Messaging Handlers
  const handleSendMessage = async (target: string, text: string) => {
    if (!currentOperator) return;
    await cmmsService.sendMessage(currentOperator.name, target, text);
    Swal.fire({
      icon: 'success',
      title: 'Mesaj İletildi',
      text: `${target === 'ALL' ? 'Tüm teknisyenlere' : target} iletildi.`,
      timer: 1600,
      showConfirmButton: false,
      background: '#0f172a',
      color: '#f8fafc'
    });
  };

  const handleReplyMessage = (sender: string) => {
    setMessageReplyTarget(sender);
    setIsMessageModalOpen(true);
  };

  // Clear caches
  const handleClearCache = async () => {
    const confirm = await Swal.fire({
      title: 'Ön Belleği Temizle',
      text: 'Yerel veriler ve önbellek temizlenecek, sayfa yenilenecektir. Onaylıyor musunuz?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Temizle ve Yenile',
      cancelButtonText: 'Vazgeç',
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#e11d48'
    });

    if (confirm.isConfirmed) {
      cmmsService.clearAllCache();
    }
  };

  // Active diagram for flowchart views
  const currentDiagram =
    FLOW_DIAGRAMS.find((d) => d.id === activeCategory) || FLOW_DIAGRAMS[0];

  // -------------------------------------------------------------
  // RENDER: If not logged in and in CMMS mode -> Show Login Screen
  // -------------------------------------------------------------
  if (!currentOperator && appMode === 'cmms') {
    return (
      <LoginScreen
        operators={config.operators}
        onLogin={handleLogin}
        onViewFlowchart={() => setAppMode('flowchart')}
        onSyncFromExcel={handleSyncFromExcel}
      />
    );
  }

  // -------------------------------------------------------------
  // RENDER: Main Layout
  // -------------------------------------------------------------
  return (
    <div
      className="flex flex-col h-[100dvh] w-full max-w-full bg-slate-950 text-slate-100 antialiased overflow-hidden font-sans"
      style={{ fontSize: `${viewSettings.fontSize}px` }}
    >
      {/* 1. OPERATIONAL CMMS VIEW */}
      {appMode === 'cmms' && currentOperator && (
        <>
          {/* CMMS Top Header */}
          <CmmsHeader
            currentOperator={currentOperator}
            dailyStatsText={getDailyStatsText()}
            unreadMessageCount={unreadMessageCount}
            onLogout={handleLogout}
            onOpenQrScanner={() => {
              setTargetScanFault(null);
              setIsQrModalOpen(true);
            }}
            onOpenClosedToday={() => setIsClosedTodayOpen(true)}
            onOpenMessageModal={() => {
              setMessageReplyTarget('ALL');
              setIsMessageModalOpen(true);
            }}
            onOpenOperatorSettings={() => setIsOperatorSettingsOpen(true)}
            onOpenWeeklyReport={() => setIsWeeklyReportOpen(true)}
            onExportAndClear={handleExportAndClear}
            onExportOnlyToSheets={handleExportOnlyToSheets}
            onSyncFromExcel={handleSyncFromExcel}
            onOpenMessageMonitor={() => setIsMessageMonitorOpen(true)}
            onOpenViewSettings={() => setIsViewSettingsOpen(true)}
            onOpenThemeSettings={() => setIsThemeSettingsOpen(true)}
            soundEnabled={viewSettings.soundEnabled}
            onToggleSound={() =>
              handleUpdateViewSettings({
                ...viewSettings,
                soundEnabled: !viewSettings.soundEnabled
              })
            }
            onClearCache={handleClearCache}
            onSwitchToFlowchart={() => setAppMode('flowchart')}
          />

          {/* Floating Live P2P Message Banner */}
          <MessageBanner
            message={activeBannerMessage}
            onDismiss={() => setActiveBannerMessage(null)}
            onReply={handleReplyMessage}
          />

          {/* Main Faults Feed */}
          <main className="flex-1 overflow-hidden flex flex-col bg-slate-950">
            <FaultsList
              faults={faults}
              currentOperator={currentOperator}
              viewSettings={viewSettings}
              onStartIntervention={handleStartIntervention}
              onOpenInterventionModal={handleOpenInterventionModal}
              onJoinHelper={handleJoinHelper}
              onLeaveHelper={handleLeaveHelper}
              onReassign={handleReassign}
              allOperators={config.operators}
              onUpdateViewSettings={handleUpdateViewSettings}
            />
          </main>

          {/* CMMS Modals */}
          <QrScannerModal
            isOpen={isQrModalOpen}
            onClose={() => {
              setIsQrModalOpen(false);
              setTargetScanFault(null);
            }}
            expectedMachine={targetScanFault?.machine}
            expectedMachineCode={targetScanFault?.machineCode}
            onScanSuccess={handleQrScanSuccess}
          />

          <MachineFaultsModal
            isOpen={isMachineFaultsOpen}
            onClose={() => setIsMachineFaultsOpen(false)}
            machineName={scannedMachineName || ''}
            faults={faults}
            currentOperator={currentOperator}
            onStartIntervention={handleStartIntervention}
            onOpenInterventionModal={handleOpenInterventionModal}
            onJoinHelper={handleJoinHelper}
            onLeaveHelper={handleLeaveHelper}
          />

          <InterventionModal
            isOpen={isInterventionModalOpen}
            onClose={() => {
              setIsInterventionModalOpen(false);
              setSelectedFaultForIntervention(null);
            }}
            fault={selectedFaultForIntervention}
            currentOperator={currentOperator}
            config={config}
            onSubmitClose={handleSubmitCloseFault}
            onSubmitStatusUpdate={handleSubmitStatusUpdate}
          />

          <ClosedTodayModal
            isOpen={isClosedTodayOpen}
            onClose={() => setIsClosedTodayOpen(false)}
            faults={[...faults, ...closedArchive]}
            currentOperator={currentOperator}
            onExportToSheets={handleExportOnlyToSheets}
          />

          <WeeklyReportModal
            isOpen={isWeeklyReportOpen}
            onClose={() => setIsWeeklyReportOpen(false)}
            weeklyStats={weeklyStats}
            operators={config.operators}
            faults={[...faults, ...closedArchive]}
            onSyncTodayData={() => {
              Swal.fire({
                icon: 'success',
                title: 'Bugün Eşitlendi',
                text: 'Bugünkü müdahale dakikaları haftalık matrise işlendi.',
                timer: 1500,
                showConfirmButton: false,
                background: '#0f172a',
                color: '#f8fafc'
              });
            }}
          />

          <MessageModal
            isOpen={isMessageModalOpen}
            onClose={() => setIsMessageModalOpen(false)}
            currentOperator={currentOperator}
            operators={config.operators}
            messages={messages}
            onSendMessage={handleSendMessage}
            onDeleteMessage={async (id) => {
              await cmmsService.deleteMessage(id);
            }}
            onClearAllMessages={async () => {
              await cmmsService.clearAllMessages();
            }}
            defaultTarget={messageReplyTarget}
          />

          <AdminMessageMonitorModal
            isOpen={isMessageMonitorOpen}
            onClose={() => setIsMessageMonitorOpen(false)}
            messages={messages}
            onDeleteMessage={async (id) => {
              await cmmsService.deleteMessage(id);
            }}
            onClearAllMessages={async () => {
              await cmmsService.clearAllMessages();
            }}
          />

          <OperatorSettingsModal
            isOpen={isOperatorSettingsOpen}
            onClose={() => setIsOperatorSettingsOpen(false)}
            operators={config.operators}
            onUpdateOperator={async (op) => {
              await cmmsService.updateOperator(op);
            }}
            onSetQrExemption={async (opName, hours) => {
              await cmmsService.setQrExemption(opName, hours);
              Swal.fire({
                icon: 'success',
                title: 'QR Muafiyeti Ayarlandı',
                text: `${opName} için muafiyet: ${
                  hours === -1
                    ? 'Sınırsız'
                    : hours === 0
                    ? 'Zorunlu QR'
                    : `${hours} Saat`
                }`,
                timer: 1800,
                showConfirmButton: false,
                background: '#0f172a',
                color: '#f8fafc'
              });
            }}
          />

          <ViewSettingsModal
            isOpen={isViewSettingsOpen}
            onClose={() => setIsViewSettingsOpen(false)}
            settings={viewSettings}
            onUpdateSettings={handleUpdateViewSettings}
          />

          <ThemeSettingsModal
            isOpen={isThemeSettingsOpen}
            onClose={() => setIsThemeSettingsOpen(false)}
            settings={viewSettings}
            onUpdateSettings={handleUpdateViewSettings}
          />
        </>
      )}

      {/* 2. PRESERVED INTERACTIVE FLOWCHART & ARCHITECTURE VIEW */}
      {appMode === 'flowchart' && (
        <>
          <Header
            activeCategory={activeCategory}
            onSelectCategory={(cat) => {
              setActiveCategory(cat);
              setSelectedNode(null);
            }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenSimulator={() => setIsSimulatorOpen((prev) => !prev)}
            onOpenMermaid={() => setIsMermaidModalOpen(true)}
            onPrint={() => window.print()}
            isSimulatorActive={isSimulatorOpen}
            onSwitchToCmms={() => setAppMode('cmms')}
          />

          <main className="flex-1 flex overflow-hidden relative">
            {activeCategory === 'architecture' ? (
              <ArchitectureView />
            ) : (
              <FlowchartCanvas
                diagram={currentDiagram}
                selectedNodeId={selectedNode ? selectedNode.id : null}
                onSelectNode={(node) => setSelectedNode(node)}
                activeSimNodeId={activeSimNodeId}
                searchQuery={searchQuery}
              />
            )}

            <NodeInspector
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          </main>

          <ProcessSimulator
            isOpen={isSimulatorOpen}
            onClose={() => setIsSimulatorOpen(false)}
            onStepChange={(nodeId) => setActiveSimNodeId(nodeId)}
          />

          <MermaidModal
            isOpen={isMermaidModalOpen}
            onClose={() => setIsMermaidModalOpen(false)}
            activeCategory={activeCategory}
          />
        </>
      )}
    </div>
  );
}
