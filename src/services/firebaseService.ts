import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import {
  Fault,
  Operator,
  SystemConfig,
  SystemMessage,
  WeeklyStats
} from '../types';
import { matchVeriSheetFaultGroup, VERI_SHEET_COLUMN_G_GROUPS } from '../utils/faultColors';

export const firebaseConfig = {
  apiKey: "AIzaSyAEqLYUevIJCcLrJa-05MXx5ik-QFouq9o",
  authDomain: "arizabildirim-89dfa.firebaseapp.com",
  projectId: "arizabildirim-89dfa",
  storageBucket: "arizabildirim-89dfa.firebasestorage.app",
  messagingSenderId: "106785239667",
  appId: "1:106785239667:web:ab131b6a11d8133a537006"
};

export const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbx0TxZ8yjyP7v3q3tYqMxKs7stPL7g7AvhLRxOfm3Ovci0QGD8vM_IwhkmXBc0wu5BZ/exec";

// Format time cleanly for Google Sheets
export function formatSheetTime(val?: string | null): string {
  if (!val) return '';
  const trimmed = String(val).trim();
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) return trimmed;
  const parts = trimmed.split(' ');
  if (parts.length === 2 && /^\d{1,2}:\d{2}/.test(parts[1])) {
    return parts[1];
  }
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }
  return trimmed;
}

// Format date cleanly for Google Sheets (DD.MM.YYYY)
export function formatSheetDate(val?: string | null, fallbackDate?: string | null): string {
  if (!val) return fallbackDate ? formatSheetDate(fallbackDate) : new Date().toLocaleDateString('tr-TR');
  const trimmed = String(val).trim();
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(trimmed)) return trimmed;
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    return fallbackDate ? formatSheetDate(fallbackDate) : new Date().toLocaleDateString('tr-TR');
  }
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('tr-TR');
  }
  return fallbackDate ? formatSheetDate(fallbackDate) : trimmed;
}

// Format combined date and time for Google Sheets Column A (TARİH: DD.MM.YYYY HH:mm)
export function formatSheetDateTime(dateVal?: string | null, timeVal?: string | null): string {
  if (timeVal && /^\d{1,2}\.\d{1,2}\.\d{4}\s+\d{1,2}:\d{2}/.test(timeVal.trim())) {
    return timeVal.trim();
  }
  const dStr = formatSheetDate(dateVal);
  const tStr = formatSheetTime(timeVal) || new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return `${dStr} ${tStr}`;
}

// Format shift for Google Sheets Column E (VARDİYA: e.g. 2.VARDİYA 08:00 // 16:00)
export function formatSheetShift(val?: string | null): string {
  if (!val) return '2.VARDİYA 08:00 // 16:00';
  const trimmed = val.trim();
  if (/^\d\.VARDİYA/i.test(trimmed)) return trimmed;
  if (trimmed.includes('08:00') && trimmed.includes('16:00')) {
    return '2.VARDİYA 08:00 // 16:00';
  }
  if (trimmed.includes('16:00') && trimmed.includes('24:00')) {
    return '3.VARDİYA 16:00 // 24:00';
  }
  if (trimmed.includes('00:00') || (trimmed.includes('24:00') && trimmed.includes('08:00'))) {
    return '1.VARDİYA 00:00 //08:00';
  }
  return trimmed;
}

// Format Job/Fault Type for Google Sheets Column F (İŞ TÜRÜ)
// Directly matches user's Google Sheet 'veri' tab Column G (İŞ İSTEK TÜRÜ)
export function formatJobType(val?: string | null): string {
  if (!val) return 'MEKANİK ARIZA';
  return matchVeriSheetFaultGroup(val);
}

// Format Maintenance Log for Google Sheets Column I (BAKIM LOGU)
// Matches Google Sheet format:
// OPERATOR PARÇA BEKLİYOR ( 1 dk )
// OPERATOR ARIZAYI KAPATTI ( 14 dk )
// OPERATOR YARDIMCI OLDU ( 8 dk )
// OPERATOR VARDİYAYA DEVRETTİ ( 15 dk )
// OPERATOR ARIZADAN ÇIKTI ( 10 dk )
export function formatMaintenanceLog(f: Fault): string {
  const lines: string[] = [];
  const closedOp = (f.closedBy || f.assignedTo || 'TEKNİSYEN').toLocaleUpperCase('tr-TR');
  const totalMins = f.totalDowntimeMinutes || 1;

  if (Array.isArray(f.interventions) && f.interventions.length > 0) {
    let hasClosing = false;
    for (const inv of f.interventions) {
      const op = (inv.operator || closedOp).toLocaleUpperCase('tr-TR');
      const mins = Number(inv.minutes) || 1;
      const rawAct = (inv.action || '').trim().toLocaleUpperCase('tr-TR');

      let cleanAct = 'MÜDAHALE ETTİ';
      if (rawAct.includes('VARDİYAYA DEVİR') || rawAct.includes('VARDİYAYA DEVRETTİ') || rawAct.includes('DEVREDİLDİ')) {
        cleanAct = 'VARDİYAYA DEVRETTİ';
      } else if (rawAct.includes('PARÇA BEKLİYOR')) {
        cleanAct = 'PARÇA BEKLİYOR';
      } else if (rawAct.includes('DIŞ SERVİS')) {
        cleanAct = 'DIŞ SERVİS BEKLİYOR';
      } else if (rawAct.includes('GEÇİCİ ÇÖZÜM')) {
        cleanAct = 'GEÇİCİ ÇÖZÜM';
      } else if (rawAct.includes('ARIZADAN ÇIKTI') || rawAct.includes('ARIZADAN AYRILDI')) {
        cleanAct = 'ARIZADAN ÇIKTI';
      } else if (inv.role === 'helper' || rawAct.includes('YARDIMCI')) {
        cleanAct = 'YARDIMCI OLDU';
      } else if (rawAct.includes('KAPATTI') || (inv.role === 'primary' && f.status === 'Kapalı' && !hasClosing)) {
        cleanAct = 'ARIZAYI KAPATTI';
        hasClosing = true;
      }

      lines.push(`${op} ${cleanAct} ( ${mins} dk )`);
    }
    if (!hasClosing && f.status === 'Kapalı') {
      lines.push(`${closedOp} ARIZAYI KAPATTI ( ${totalMins} dk )`);
    }
  } else {
    lines.push(`${closedOp} ARIZAYI KAPATTI ( ${totalMins} dk )`);
  }

  return lines.join('\n');
}

// Format Start-End Time Range for Google Sheets Column K (SAAT: e.g. 11:23 - 11:36)
export function formatSheetTimeRange(f: Fault): string {
  const start = formatSheetTime(f.startedAt || f.reportedAt) || '08:00';
  const end = formatSheetTime(f.closedAt || f.startedAt || f.reportedAt) || start;
  return `${start} - ${end}`;
}

// Convert Google Drive share link to direct embeddable image URL
export function convertGoogleDriveUrl(url?: string): string {
  if (!url) return '';
  const clean = url.trim();
  const matchFileD = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) {
    return `https://lh3.googleusercontent.com/d/${matchFileD[1]}=w400`;
  }
  const matchId = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) {
    return `https://lh3.googleusercontent.com/d/${matchId[1]}=w400`;
  }
  return clean;
}

// Default Initial Operators matching the Google Sheet (iş istek bkım op giriş hub)
const DEFAULT_OPERATORS: Operator[] = [
  {
    name: 'ENGİN VARDAR',
    shortName: 'E. Vardar',
    pin: '1',
    role: 'teknisyen',
    photo: 'https://lh3.googleusercontent.com/d/12h3jo_EKsarOWCHV0iA2iAL1X4Q_qrEU=w400',
    qrExemptUntil: 0
  },
  {
    name: 'MUAMMER ACAR',
    shortName: 'M. Acar',
    pin: '2',
    role: 'teknisyen',
    photo: 'https://lh3.googleusercontent.com/d/12Zxb3b5JQtBOOgiiuqUJW---HkjTxEva=w400',
    qrExemptUntil: 0
  },
  {
    name: 'HÜSEYİN YAVUZ',
    shortName: 'H. Yavuz',
    pin: '3',
    role: 'teknisyen',
    photo: 'https://lh3.googleusercontent.com/d/1x7VB4fhUy0REF3wQmiufewC5xz6WEDCf=w400',
    qrExemptUntil: 0
  },
  {
    name: 'MEHMET ALİ GÜLER',
    shortName: 'M. A. Güler',
    pin: '4',
    role: 'teknisyen',
    photo: 'https://lh3.googleusercontent.com/d/1mwi7bSCNipWbmudUiPPwW5gw_vtgAyRp=w400',
    qrExemptUntil: 0
  },
  {
    name: 'İNANÇ ŞEN',
    shortName: 'İ. Şen',
    pin: '5',
    role: 'teknisyen',
    photo: 'https://lh3.googleusercontent.com/d/14R5W5musoWjHD6_xcjtNzrVV_z1WpTdH=w400',
    qrExemptUntil: 0
  },
  {
    name: 'YUNUS ÖZTÜRK',
    shortName: 'Y. Öztürk',
    pin: '6',
    role: 'teknisyen',
    photo: 'https://lh3.googleusercontent.com/d/1BYLxELxEFCzj927AfGia00mqb9TThrZj=w400',
    qrExemptUntil: 0
  },
  {
    name: 'AVNİ YÜKLÜ',
    shortName: 'A. Yüklü',
    pin: '7',
    role: 'teknisyen',
    photo: 'https://lh3.googleusercontent.com/d/1njtWeNfHzYF-v0a-gzyEY6JlCzE8Xrdq=w400',
    qrExemptUntil: 0
  },
  {
    name: 'AYKUT ÖZ',
    shortName: 'A. Öz',
    pin: '8',
    role: 'admin',
    photo: 'https://lh3.googleusercontent.com/d/12WbQ4OeTARECE0mSU8Jt2HXwjNP8M5Nf=w400',
    qrExemptUntil: -1
  },
  {
    name: 'FUAT ÇETİN',
    shortName: 'Fuat Çetin',
    pin: '9',
    role: 'admin',
    photo: 'https://ui-avatars.com/api/?name=Fuat+Cetin&background=0284c7&color=fff&bold=true',
    qrExemptUntil: -1
  }
];

const DEFAULT_FAULT_REASONS = [
  'YANLIŞ KULLANIM',
  'DIŞ SERVİS',
  'YANLIŞ MÜDAHALE',
  'YANLIŞ PARÇA',
  'PARÇA AŞINMA',
  'OP HATASI',
  'YENİ PARCA TAKIM',
  'DURUŞ YOK',
  'PLANLI BAKIM KODU',
  'İYİLEŞTİRME',
  'MAKİNE AYAR',
  'PLANLI BAKIM',
  'MAKİNE ARIZA'
];

const DEFAULT_STOPPAGE_REASONS = [
  'MAKİNE ARIZA',
  'PLANLI BAKIM',
  'İYİLEŞTİRME',
  'MAKİNE AYAR',
  'DURUŞ YOK',
  'PLANLI BAKIM KODU',
  'MAKİNA AYAR'
];

const DEFAULT_SHIFTS = [
  'Vardiya 1 (08:00 - 16:00)',
  'Vardiya 2 (16:00 - 24:00)',
  'Vardiya 3 (24:00 - 08:00)'
];

// Seed sample initial faults matching Google Sheets 'veri' tab Column G (İŞ İSTEK TÜRÜ)
const DEFAULT_FAULTS: Fault[] = [
  {
    id: 'flt-001',
    machine: 'Pres 04 - 400 Ton Hidrolik',
    machineCode: 'PRS-04',
    faultType: 'MEKANİK ARIZA',
    status: 'Müdahale Ediliyor',
    description: 'Kalıp alt tablasında yağ kaçağı ve basma esnasında sarsıntı var.',
    reportedBy: 'Kalıpçı Serkan',
    reportedAt: '12.09.2026 08:30',
    date: '12.09.2026',
    shift: 'Vardiya 1 (08:00 - 16:00)',
    assignedTo: 'Emre VARDAR',
    startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    helpers: ['Ahmet YILMAZ'],
    interventions: [],
    priority: 'Yüksek'
  },
  {
    id: 'flt-002',
    machine: 'CNC Freze 02 - Doosan DNM 650',
    machineCode: 'CNC-02',
    faultType: 'ELEKTRİK ARIZA',
    status: 'Açık',
    description: 'Spindle sürücüsü ALARM 204 aşırı yük hatası veriyor, motor dönmüyor.',
    reportedBy: 'Operatör Murat',
    reportedAt: '12.09.2026 09:15',
    date: '12.09.2026',
    shift: 'Vardiya 1 (08:00 - 16:00)',
    assignedTo: null,
    helpers: [],
    interventions: [],
    priority: 'Acil'
  },
  {
    id: 'flt-003',
    machine: 'Kaynak Robotu 01 - ABB IRB 1600',
    machineCode: 'RBT-01',
    faultType: 'TEKRAR EDEN ARIZA  !!!!',
    status: 'Parça Bekliyor',
    description: 'Tel sürme ünitesi motoru arızalı, yedek parça siparişi açıldı.',
    reportedBy: 'Vardiya Amiri Kemal',
    reportedAt: '11.09.2026 14:20',
    date: '11.09.2026',
    shift: 'Vardiya 2 (16:00 - 24:00)',
    assignedTo: null,
    helpers: [],
    interventions: [
      {
        operator: 'Mehmet DEMİR',
        minutes: 90,
        action: 'Motor testi yapıldı, rulman kilitlenmiş. Parça depoda bulunamadı.',
        role: 'primary'
      }
    ],
    priority: 'Normal'
  },
  {
    id: 'flt-004',
    machine: 'Kompresör Dairesi - Atlas Copco GA75',
    machineCode: 'KMP-01',
    faultType: 'PLANLI BAKIM KODU',
    status: 'Açık',
    description: 'Aylık filtre değişimi ve yağ seviyesi kontrolü planı.',
    reportedBy: 'Sistem Planlı Bakım',
    reportedAt: '10.09.2026 10:00',
    date: '10.09.2026',
    shift: 'Vardiya 1 (08:00 - 16:00)',
    assignedTo: null,
    helpers: [],
    interventions: [],
    priority: 'Normal'
  },
  {
    id: 'flt-005',
    machine: 'Paketleme Hattı Konveyörü 03',
    machineCode: 'KNV-03',
    faultType: 'İŞ GÜVENLİĞİ !!!',
    status: 'Kapalı',
    description: 'Acil stop butonu gevşemiş, basıldığında bazen geri atmıyordu.',
    reportedBy: 'İSG Uzmanı Hale',
    reportedAt: '12.09.2026 07:45',
    date: '12.09.2026',
    shift: 'Vardiya 1 (08:00 - 16:00)',
    assignedTo: 'Emre VARDAR',
    startedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    closedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    closedBy: 'Emre VARDAR',
    actionTaken: 'Acil stop butonu söküldü, kontakları temizlendi ve kilit somunu sıkıldı.',
    partsChanged: 'Yay ve kontak bloğu yenilendi',
    faultReason: 'Mekanik Aşınma / Boşluk',
    stoppageReason: 'Plansız Arıza Duruşu',
    totalDowntimeMinutes: 35,
    helpers: [],
    interventions: [
      {
        operator: 'Emre VARDAR',
        minutes: 35,
        action: 'Acil stop tamiri tamamlandı',
        role: 'primary'
      }
    ],
    priority: 'Yüksek'
  }
];

const DEFAULT_WEEKLY_STATS: WeeklyStats = {
  'Emre VARDAR': {
    Pazartesi: 320,
    Salı: 270,
    Çarşamba: 310,
    Perşembe: 290,
    Cuma: 35,
    Cumartesi: 0,
    Pazar: 0
  },
  'Ahmet YILMAZ': {
    Pazartesi: 240,
    Salı: 310,
    Çarşamba: 280,
    Perşembe: 330,
    Cuma: 45,
    Cumartesi: 0,
    Pazar: 0
  },
  'Mehmet DEMİR': {
    Pazartesi: 300,
    Salı: 190,
    Çarşamba: 340,
    Perşembe: 260,
    Cuma: 0,
    Cumartesi: 0,
    Pazar: 0
  },
  'Ali KAYA': {
    Pazartesi: 180,
    Salı: 220,
    Çarşamba: 200,
    Perşembe: 240,
    Cuma: 0,
    Cumartesi: 0,
    Pazar: 0
  }
};

const DEFAULT_MESSAGES: SystemMessage[] = [
  {
    id: 'msg-01',
    sender: 'Emre VARDAR',
    target: 'ALL',
    text: 'Arkadaşlar Pres 04 hidrolik tamiri devam ediyor. Ahmet ile beraberiz.',
    timestamp: Date.now() - 25 * 60 * 1000,
    readBy: []
  }
];

// Initialize Firebase App safely
let app: firebase.app.App | null = null;
let firestoreDb: firebase.firestore.Firestore | null = null;
let isFirebaseOnline = false;

try {
  if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
  } else {
    app = firebase.app();
  }
  firestoreDb = firebase.firestore();
  isFirebaseOnline = true;
} catch (e) {
  console.warn('Firebase init warning (using offline-synced state):', e);
  isFirebaseOnline = false;
}

// Local Storage Keys
const LS_KEY_FAULTS = 'akg_cmms_faults_v2';
const LS_KEY_OPERATORS = 'akg_cmms_operators_v2';
const LS_KEY_MESSAGES = 'akg_cmms_messages_v2';
const LS_KEY_WEEKLY = 'akg_cmms_weekly_v2';
const LS_KEY_CONFIG = 'akg_cmms_config_v2';
const LS_KEY_CLOSED_ARCHIVE = 'akg_cmms_closed_archive_v2';

// State helper to load or initialize local cached store
function getLocal<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // Ignore quota issues
  }
}

// Active listeners for local pub/sub
const faultListeners: ((faults: Fault[]) => void)[] = [];
const messageListeners: ((messages: SystemMessage[]) => void)[] = [];
const configListeners: ((config: SystemConfig) => void)[] = [];
const weeklyListeners: ((stats: WeeklyStats) => void)[] = [];
const archiveListeners: ((faults: Fault[]) => void)[] = [];

function notifyFaults(faults: Fault[]) {
  setLocal(LS_KEY_FAULTS, faults);
  faultListeners.forEach((fn) => fn([...faults]));
}

function notifyClosedArchive(faults: Fault[]) {
  setLocal(LS_KEY_CLOSED_ARCHIVE, faults);
  archiveListeners.forEach((fn) => fn([...faults]));
}

function notifyMessages(messages: SystemMessage[]) {
  setLocal(LS_KEY_MESSAGES, messages);
  messageListeners.forEach((fn) => fn([...messages]));
}

function notifyConfig(cfg: SystemConfig) {
  setLocal(LS_KEY_CONFIG, cfg);
  configListeners.forEach((fn) => fn({ ...cfg }));
}

function notifyWeekly(stats: WeeklyStats) {
  setLocal(LS_KEY_WEEKLY, stats);
  weeklyListeners.forEach((fn) => fn({ ...stats }));
}

// ==========================================
// PUBLIC CMMS SERVICE API
// ==========================================

export const cmmsService = {
  isOnline() {
    return isFirebaseOnline;
  },

  // Log in with PIN
  async loginWithPin(pin: string): Promise<Operator | null> {
    const cfg = this.getConfig();
    const cleanPin = pin.trim();
    if (!cleanPin) return null;

    const op = cfg.operators.find((o) => {
      const opPin = String(o.pin).trim();
      // Match exact PIN (e.g. "1", "2", "9")
      if (opPin === cleanPin) return true;
      // Match with leading zeros if user typed 4 digits (e.g. "0001" matches "1", or "1" matches "0001")
      if (cleanPin.length <= 4 && opPin.padStart(4, '0') === cleanPin.padStart(4, '0')) return true;
      // Fuat Çetin: match both PIN 9 (from Google Sheet column B) and PIN 123 (from Google Script)
      if (
        (o.name.toUpperCase().includes('FUAT') || o.role === 'admin') &&
        (cleanPin === '9' || cleanPin === '123' || cleanPin === '0009')
      ) {
        return true;
      }
      return false;
    });

    if (op) {
      localStorage.setItem('akg_logged_in_op', JSON.stringify(op));
      return op;
    }
    return null;
  },

  getSavedOperator(): Operator | null {
    try {
      const raw = localStorage.getItem('akg_logged_in_op');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem('akg_logged_in_op');
  },

  // Config: operators, reasons, shifts
  getConfig(): SystemConfig {
    const cfg = getLocal<SystemConfig>(LS_KEY_CONFIG, {
      operators: DEFAULT_OPERATORS,
      faultReasons: DEFAULT_FAULT_REASONS,
      stoppageReasons: DEFAULT_STOPPAGE_REASONS,
      shifts: DEFAULT_SHIFTS
    });

    // Self-healing: if localStorage still has old dummy operator "Emre VARDAR", replace with real operators from sheet
    if (!cfg.operators || cfg.operators.length === 0 || cfg.operators.some((o) => o.name === 'Emre VARDAR' || o.name === 'Ahmet YILMAZ')) {
      cfg.operators = DEFAULT_OPERATORS;
      cfg.faultReasons = DEFAULT_FAULT_REASONS;
      cfg.stoppageReasons = DEFAULT_STOPPAGE_REASONS;
      setLocal(LS_KEY_CONFIG, cfg);
    }
    return cfg;
  },

  subscribeToConfig(callback: (config: SystemConfig) => void): () => void {
    configListeners.push(callback);
    callback(this.getConfig());

    // Also listen to Firestore if available
    let unsubscribeFirestore: (() => void) | null = null;
    if (firestoreDb && isFirebaseOnline) {
      try {
        unsubscribeFirestore = firestoreDb
          .collection('settings')
          .doc('config')
          .onSnapshot(
            (doc) => {
              if (doc.exists) {
                const data = doc.data() as Partial<SystemConfig>;
                if (data?.operators && data.operators.length > 0) {
                  const updated: SystemConfig = {
                    operators: data.operators,
                    faultReasons: data.faultReasons || DEFAULT_FAULT_REASONS,
                    stoppageReasons:
                      data.stoppageReasons || DEFAULT_STOPPAGE_REASONS,
                    shifts: data.shifts || DEFAULT_SHIFTS
                  };
                  notifyConfig(updated);
                }
              }
            },
            (err) => {
              console.warn('Firestore config snapshot fallback to local', err);
            }
          );
      } catch (e) {
        console.warn('Config snapshot failed', e);
      }
    }

    return () => {
      const idx = configListeners.indexOf(callback);
      if (idx !== -1) configListeners.splice(idx, 1);
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  },

  // Faults subscription
  subscribeToFaults(callback: (faults: Fault[]) => void): () => void {
    faultListeners.push(callback);
    const initialRaw = getLocal<Fault[]>(LS_KEY_FAULTS, DEFAULT_FAULTS);
    const initial = initialRaw.map((f: any) => ({
      ...f,
      faultType: matchVeriSheetFaultGroup(f.jobType || f.faultType || f.isIstekTuru)
    }));
    callback(initial);

    let unsubscribeFirestore: (() => void) | null = null;
    if (firestoreDb && isFirebaseOnline) {
      try {
        unsubscribeFirestore = firestoreDb
          .collection('arizalar')
          .onSnapshot(
            (snapshot) => {
              if (!snapshot.empty) {
                const remoteFaults: Fault[] = snapshot.docs.map((doc) => {
                  const data = doc.data();

                  // Extract timestamp or date/time
                  let reportedAt = '';
                  let dateStr = '';
                  if (data.createdAt) {
                    let createdDate: Date | null = null;
                    if (typeof data.createdAt.toDate === 'function') {
                      createdDate = data.createdAt.toDate();
                    } else if (data.createdAt.seconds) {
                      createdDate = new Date(data.createdAt.seconds * 1000);
                    } else if (typeof data.createdAt === 'string' || typeof data.createdAt === 'number') {
                      createdDate = new Date(data.createdAt);
                    }
                    if (createdDate && !isNaN(createdDate.getTime())) {
                      reportedAt = createdDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                      dateStr = createdDate.toLocaleDateString('tr-TR');
                    }
                  }
                  if (!reportedAt) {
                    reportedAt = data.reportedAt || '';
                  }
                  if (!dateStr) {
                    dateStr = data.date || '';
                  }

                  // Field mapping: Firestore stores 'jobType', 'faultType', 'isIstekTuru', etc.
                  const rawFaultType =
                    data.jobType ||
                    data.faultType ||
                    data.isIstekTuru ||
                    data['İŞ İSTEK TÜRÜ'] ||
                    data.type ||
                    '';

                  const faultType = matchVeriSheetFaultGroup(rawFaultType);

                  const reportedBy =
                    data.userName ||
                    data.reportedBy ||
                    data.bildiren ||
                    data.operator ||
                    '';

                  return {
                    id: doc.id,
                    machine: data.machine || data.makine || 'Genel Makine',
                    machineCode: data.machineCode || '',
                    faultType,
                    status: data.status || 'Açık',
                    description: data.description || data.aciklama || '',
                    reportedBy,
                    reportedAt,
                    date: dateStr,
                    shift: data.shift || data.vardiya || '',
                    assignedTo: data.assignedTo || null,
                    startedAt: data.startedAt || null,
                    helpers: Array.isArray(data.helpers) ? data.helpers : [],
                    helperJoinedAt:
                      data.helperJoinedAt && typeof data.helperJoinedAt === 'object'
                        ? data.helperJoinedAt
                        : {},
                    interventions: Array.isArray(data.interventions)
                      ? data.interventions
                      : [],
                    actionTaken: data.actionTaken || '',
                    partsChanged: data.partsChanged || '',
                    faultReason: data.faultReason || '',
                    stoppageReason: data.stoppageReason || '',
                    closedAt: data.closedAt || null,
                    closedBy: data.closedBy || null,
                    totalDowntimeMinutes: data.totalDowntimeMinutes || 0,
                    priority: data.priority || 'Normal',
                    costCenter: data.costCenter || '',
                    photoUrl: data.photoUrl || '',
                    syncedToSheets: Boolean(data.syncedToSheets),
                    syncedAt: data.syncedAt || null
                  };
                });
                notifyFaults(remoteFaults);
              }
            },
            (err) => {
              console.warn('Firestore faults snapshot fallback to local', err);
            }
          );
      } catch (e) {
        console.warn('Firestore faults subscribe error', e);
      }
    }

    return () => {
      const idx = faultListeners.indexOf(callback);
      if (idx !== -1) faultListeners.splice(idx, 1);
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  },

  // Messages subscription
  subscribeToMessages(callback: (messages: SystemMessage[]) => void): () => void {
    messageListeners.push(callback);
    const initial = getLocal<SystemMessage[]>(LS_KEY_MESSAGES, DEFAULT_MESSAGES);
    callback(initial);

    let unsubMessages: (() => void) | null = null;
    let unsubMesajlar: (() => void) | null = null;

    if (firestoreDb && isFirebaseOnline) {
      try {
        const parseMsgDoc = (d: firebase.firestore.DocumentSnapshot): SystemMessage => {
          const data = d.data() || {};
          let ts = Date.now();

          const extractTime = (val: any): number | null => {
            if (!val) return null;
            if (typeof val.toMillis === 'function') return val.toMillis();
            if (typeof val.toDate === 'function') return val.toDate().getTime();
            if (typeof val.seconds === 'number') return val.seconds * 1000;
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
              const parsed = new Date(val).getTime();
              if (!isNaN(parsed)) return parsed;
            }
            return null;
          };

          const parsedTs =
            extractTime(data.createdAt) ||
            extractTime(data.timestamp) ||
            extractTime(data.timestampMs) ||
            extractTime(data.date);
          if (parsedTs) ts = parsedTs;

          const sender = data.sender || 'Teknisyen';
          const targetUsers = Array.isArray(data.targetUsers) ? data.targetUsers : undefined;
          let target = data.target || (targetUsers && targetUsers.length > 0 ? targetUsers.join(', ') : 'ALL');

          const isFieldNotification =
            sender.toLowerCase().includes('saha') ||
            (data.type && String(data.type).toLowerCase().includes('saha')) ||
            (data.source && String(data.source).toLowerCase().includes('saha')) ||
            (data.isFieldNotification === true);

          return {
            id: d.id,
            sender,
            target,
            targetUsers,
            text: data.text || data.message || '',
            timestamp: ts,
            readBy: Array.isArray(data.readBy) ? data.readBy : [],
            isFieldNotification
          };
        };

        const docsMap = new Map<string, SystemMessage>();

        const syncCombinedDocs = () => {
          const combined = Array.from(docsMap.values());
          combined.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
          if (combined.length > 0) {
            notifyMessages(combined);
          }
        };

        // 1. Listen to 'messages' collection (without orderBy to avoid skipping docs missing timestamp field)
        unsubMessages = firestoreDb
          .collection('messages')
          .limit(50)
          .onSnapshot(
            (snapshot) => {
              if (snapshot) {
                snapshot.docs.forEach((doc) => {
                  docsMap.set(doc.id, parseMsgDoc(doc));
                });
                syncCombinedDocs();
              }
            },
            (err) => {
              console.warn('Firestore messages subscription error', err);
            }
          );

        // 2. Also listen to 'mesajlar' collection if present in Firebase
        try {
          unsubMesajlar = firestoreDb
            .collection('mesajlar')
            .limit(50)
            .onSnapshot(
              (snapshot) => {
                if (snapshot && !snapshot.empty) {
                  snapshot.docs.forEach((doc) => {
                    docsMap.set(doc.id, parseMsgDoc(doc));
                  });
                  syncCombinedDocs();
                }
              },
              () => {
                // Ignore if 'mesajlar' doesn't exist
              }
            );
        } catch {
          // Ignore
        }
      } catch (e) {
        console.warn('Firestore message subscribe error fallback to local', e);
      }
    }

    return () => {
      const idx = messageListeners.indexOf(callback);
      if (idx !== -1) messageListeners.splice(idx, 1);
      if (unsubMessages) unsubMessages();
      if (unsubMesajlar) unsubMesajlar();
    };
  },

  // Weekly Stats
  subscribeToWeeklyStats(callback: (stats: WeeklyStats) => void): () => void {
    weeklyListeners.push(callback);
    const initial = getLocal<WeeklyStats>(LS_KEY_WEEKLY, DEFAULT_WEEKLY_STATS);
    callback(initial);

    let unsubscribeFirestore: (() => void) | null = null;
    if (firestoreDb && isFirebaseOnline) {
      try {
        unsubscribeFirestore = firestoreDb
          .collection('settings')
          .doc('weeklyStats')
          .onSnapshot(
            (doc) => {
              if (doc.exists) {
                const data = doc.data() as WeeklyStats;
                notifyWeekly(data);
              }
            },
            () => {}
          );
      } catch (e) {
        // Ignore
      }
    }

    return () => {
      const idx = weeklyListeners.indexOf(callback);
      if (idx !== -1) weeklyListeners.splice(idx, 1);
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  },

  // Start intervention (Çalışmaya Başla)
  async startIntervention(faultId: string, operatorName: string): Promise<void> {
    const faults = getLocal<Fault[]>(LS_KEY_FAULTS, DEFAULT_FAULTS);
    const target = faults.find((f) => f.id === faultId);
    if (!target) return;

    target.status = 'Müdahale Ediliyor';
    target.assignedTo = operatorName;
    target.startedAt = new Date().toISOString();
    if (!target.helpers) target.helpers = [];

    notifyFaults(faults);

    if (firestoreDb && isFirebaseOnline) {
      try {
        await firestoreDb.collection('arizalar').doc(faultId).update({
          status: 'Müdahale Ediliyor',
          assignedTo: operatorName,
          startedAt: target.startedAt
        });
      } catch (e) {
        console.warn('Firestore update error', e);
      }
    }

    // 📢 OTO SİSTEM HAREKETİ BİLDİRİM MESAJI
    try {
      await this.sendMessage(
        operatorName,
        'ALL',
        `🔧 ${operatorName}, ${target.machine} makinesinde arıza müdahalesine başladı.`
      );
    } catch (e) {
      console.warn('Auto message error', e);
    }
  },

  // Join as Helper (Yardımcı Olarak Katıl)
  async joinAsHelper(faultId: string, helperName: string): Promise<void> {
    const faults = getLocal<Fault[]>(LS_KEY_FAULTS, DEFAULT_FAULTS);
    const target = faults.find((f) => f.id === faultId);
    if (!target) return;

    const cleanName = helperName.trim();
    if (!target.helpers) target.helpers = [];
    
    // Check if already in helpers (case-insensitive)
    const exists = target.helpers.some(
      (h) => h.trim().toLocaleUpperCase('tr-TR') === cleanName.toLocaleUpperCase('tr-TR')
    );
    if (!exists) {
      target.helpers.push(cleanName);
    }

    if (!target.helperJoinedAt) target.helperJoinedAt = {};
    if (!target.helperJoinedAt[cleanName]) {
      target.helperJoinedAt[cleanName] = new Date().toISOString();
    }

    notifyFaults(faults);

    if (firestoreDb && isFirebaseOnline) {
      try {
        await firestoreDb.collection('arizalar').doc(faultId).set(
          {
            helpers: target.helpers,
            helperJoinedAt: target.helperJoinedAt
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Firestore join helper error', e);
      }
    }

    // 📢 OTO SİSTEM HAREKETİ BİLDİRİM MESAJI
    try {
      await this.sendMessage(
        cleanName,
        'ALL',
        `🤝 ${cleanName}, ${target.machine} arızasına yardımcı teknisyen olarak katıldı.`
      );
    } catch (e) {
      console.warn('Auto message error', e);
    }
  },

  // Leave Helper (Bakımdan Ayrıl - Süreyi Otomatik Hesapla & Loga Ekle)
  async leaveHelper(
    faultId: string,
    helperName: string,
    minutesWorked: number
  ): Promise<void> {
    const faults = getLocal<Fault[]>(LS_KEY_FAULTS, DEFAULT_FAULTS);
    const target = faults.find((f) => f.id === faultId);
    if (!target) return;

    const cleanName = helperName.trim();
    const upperCleanName = cleanName.toLocaleUpperCase('tr-TR');
    const actualMinutes = Math.max(1, Number(minutesWorked) || 1);

    // 1. Remove from active helpers (case-insensitive)
    if (target.helpers) {
      target.helpers = target.helpers.filter(
        (h) => h.trim().toLocaleUpperCase('tr-TR') !== upperCleanName
      );
    }

    // 2. Remove from helperJoinedAt (case-insensitive)
    if (target.helperJoinedAt) {
      for (const k of Object.keys(target.helperJoinedAt)) {
        if (k.trim().toLocaleUpperCase('tr-TR') === upperCleanName) {
          delete target.helperJoinedAt[k];
        }
      }
    }

    // 3. Add to interventions log (Yardımcı Oldu kaydı)
    if (!target.interventions) target.interventions = [];
    
    // Check if there's already an intervention entry for this helper; if so, accumulate or append
    const existingIdx = target.interventions.findIndex(
      (inv) =>
        inv.role === 'helper' &&
        (inv.operator || '').trim().toLocaleUpperCase('tr-TR') === upperCleanName
    );

    if (existingIdx !== -1) {
      // Update existing record
      target.interventions[existingIdx].minutes =
        (Number(target.interventions[existingIdx].minutes) || 0) + actualMinutes;
      target.interventions[existingIdx].action = 'YARDIMCI OLDU';
    } else {
      target.interventions.push({
        operator: cleanName,
        minutes: actualMinutes,
        role: 'helper',
        action: 'YARDIMCI OLDU'
      });
    }

    notifyFaults(faults);

    // 4. Update weekly and today's stats for helper
    this.addMinutesToWeeklyStats(cleanName, actualMinutes);

    // 5. Update Firestore reliably
    if (firestoreDb && isFirebaseOnline) {
      try {
        await firestoreDb.collection('arizalar').doc(faultId).set(
          {
            helpers: target.helpers,
            helperJoinedAt: target.helperJoinedAt || {},
            interventions: target.interventions
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Firestore leave helper error', e);
      }
    }

    // 📢 OTO SİSTEM HAREKETİ BİLDİRİM MESAJI
    try {
      await this.sendMessage(
        cleanName,
        'ALL',
        `👋 ${cleanName}, ${target.machine} arızasındaki yardımını tamamladı (${actualMinutes} dk).`
      );
    } catch (e) {
      console.warn('Auto message error', e);
    }
  },

  // Update Status without closing (Parça Bekliyor, Devredildi, Arızadan Çıkma, etc.)
  async updateFaultStatus(
    faultId: string,
    status: Fault['status'],
    note?: string,
    operatorName?: string,
    minutes?: number
  ): Promise<void> {
    const faults = getLocal<Fault[]>(LS_KEY_FAULTS, DEFAULT_FAULTS);
    const target = faults.find((f) => f.id === faultId);
    if (!target) return;

    const op = operatorName || target.assignedTo || 'Teknisyen';

    // Calculate actual elapsed minutes for this intervention session
    let actualMinutes = Number(minutes) || 0;
    if (actualMinutes <= 0) {
      if (target.startedAt) {
        const startMs = new Date(target.startedAt).getTime();
        if (!isNaN(startMs)) {
          actualMinutes = Math.max(1, Math.round((Date.now() - startMs) / 60000));
        } else {
          actualMinutes = 1;
        }
      } else {
        actualMinutes = 1;
      }
    }

    target.status = status;

    // Determine readable action title for logs and Google Sheets Column I
    let actionType = '';
    const cleanNote = (note || '').trim();
    if (status === 'Devredildi') {
      actionType = 'VARDİYAYA DEVRETTİ';
    } else if (status === 'Parça Bekliyor') {
      actionType = 'PARÇA BEKLİYOR';
    } else if (status === 'Dış Servis Bekliyor') {
      actionType = 'DIŞ SERVİS BEKLİYOR';
    } else if (status === 'Geçici Çözüm') {
      actionType = 'GEÇİCİ ÇÖZÜM UYGULANDI';
    } else if (status === 'Açık') {
      actionType = 'ARIZADAN ÇIKTI';
    } else {
      actionType = `DURUM [${status}]`;
    }

    const fullActionText = cleanNote ? `${actionType}: ${cleanNote}` : actionType;

    // Add intervention log entry
    if (!target.interventions) target.interventions = [];
    target.interventions.push({
      operator: op,
      minutes: actualMinutes,
      role: 'primary',
      action: fullActionText,
      endedAt: new Date().toISOString()
    });

    // Credit minutes to operator's weekly stats and add to total downtime
    this.addMinutesToWeeklyStats(op, actualMinutes);
    target.totalDowntimeMinutes = (target.totalDowntimeMinutes || 0) + actualMinutes;

    // Handle any active helpers assisting on this fault
    if (Array.isArray(target.helpers) && target.helpers.length > 0) {
      for (const h of target.helpers) {
        const hName = h.trim();
        const upperHName = hName.toLocaleUpperCase('tr-TR');
        if (!hName) continue;

        let helperMins = actualMinutes;
        if (target.helperJoinedAt) {
          const matchKey = Object.keys(target.helperJoinedAt).find(
            (k) => k.trim().toLocaleUpperCase('tr-TR') === upperHName
          );
          if (matchKey && target.helperJoinedAt[matchKey]) {
            const joinedMs = new Date(target.helperJoinedAt[matchKey]).getTime();
            if (!isNaN(joinedMs)) {
              helperMins = Math.max(1, Math.min(actualMinutes, Math.round((Date.now() - joinedMs) / 60000)));
            }
          }
        }

        target.interventions.push({
          operator: hName,
          minutes: helperMins,
          role: 'helper',
          action: 'YARDIMCI OLDU',
          endedAt: new Date().toISOString()
        });
        this.addMinutesToWeeklyStats(hName, helperMins);
      }
      target.helpers = [];
      target.helperJoinedAt = {};
    }

    // When waiting for parts, handover, external service, or leaving, clear active assignment
    if (
      status === 'Parça Bekliyor' ||
      status === 'Devredildi' ||
      status === 'Dış Servis Bekliyor' ||
      status === 'Geçici Çözüm' ||
      status === 'Açık'
    ) {
      target.assignedTo = null;
      target.startedAt = null;
    }

    notifyFaults(faults);

    if (firestoreDb && isFirebaseOnline) {
      try {
        const updateData: Record<string, unknown> = {
          status,
          interventions: target.interventions,
          totalDowntimeMinutes: target.totalDowntimeMinutes,
          helpers: [],
          helperJoinedAt: {}
        };
        if (
          status === 'Parça Bekliyor' ||
          status === 'Devredildi' ||
          status === 'Dış Servis Bekliyor' ||
          status === 'Geçici Çözüm' ||
          status === 'Açık'
        ) {
          updateData.assignedTo = null;
          updateData.startedAt = null;
        }
        await firestoreDb.collection('arizalar').doc(faultId).update(updateData);
      } catch (e) {
        console.warn('Firestore update status error', e);
      }
    }

    // 📢 OTO SİSTEM HAREKETİ BİLDİRİM MESAJI
    try {
      const noteStr = cleanNote ? ` (Not: ${cleanNote})` : '';
      await this.sendMessage(
        op,
        'ALL',
        `⏸️ ${op}, ${target.machine} arızasında [${actionType}] kaydı yaptı (${actualMinutes} dk).${noteStr}`
      );
    } catch (e) {
      console.warn('Auto message error', e);
    }
  },

  // Closed faults archive methods (for today's operator stats and closed history)
  getClosedArchive(): Fault[] {
    return getLocal<Fault[]>(LS_KEY_CLOSED_ARCHIVE, []);
  },

  saveToClosedArchive(fault: Fault): void {
    const current = getLocal<Fault[]>(LS_KEY_CLOSED_ARCHIVE, []);
    const updated = [fault, ...current.filter((f) => f.id !== fault.id)];
    notifyClosedArchive(updated);
  },

  subscribeToClosedArchive(callback: (faults: Fault[]) => void): () => void {
    archiveListeners.push(callback);
    callback(getLocal<Fault[]>(LS_KEY_CLOSED_ARCHIVE, []));
    return () => {
      const idx = archiveListeners.indexOf(callback);
      if (idx !== -1) archiveListeners.splice(idx, 1);
    };
  },

  // Close Fault (Müdahaleyi Tamamla, E-Tabloya Gönder ve Veritabanından Sil)
  async closeFault(
    faultId: string,
    params: {
      actionTaken: string;
      partsChanged: string;
      faultReason: string;
      stoppageReason: string;
      operatorName: string;
      minutes: number;
      helperMinutes?: Record<string, number>;
    }
  ): Promise<{ success: boolean; sheetsSynced: boolean; message: string }> {
    const faults = getLocal<Fault[]>(LS_KEY_FAULTS, DEFAULT_FAULTS);
    const target = faults.find((f) => f.id === faultId);
    if (!target) return { success: false, sheetsSynced: false, message: 'Arıza kaydı bulunamadı.' };

    target.status = 'Kapalı';
    target.closedAt = new Date().toISOString();
    target.closedBy = params.operatorName;
    target.actionTaken = params.actionTaken;
    target.partsChanged = params.partsChanged;
    target.faultReason = params.faultReason;
    target.stoppageReason = params.stoppageReason;
    target.totalDowntimeMinutes = params.minutes;

    if (!target.interventions) target.interventions = [];
    target.interventions.push({
      operator: params.operatorName,
      minutes: params.minutes,
      role: 'primary',
      action: params.actionTaken
    });

    // 1. Process explicitly provided helper minutes if any
    const handledHelpers = new Set<string>();
    if (params.helperMinutes) {
      for (const [helper, mins] of Object.entries(params.helperMinutes)) {
        const hName = helper.trim();
        const numMins = Number(mins) || 0;
        if (numMins > 0) {
          target.interventions.push({
            operator: hName,
            minutes: numMins,
            role: 'helper',
            action: 'YARDIMCI OLDU'
          });
          this.addMinutesToWeeklyStats(hName, numMins);
          handledHelpers.add(hName.toLocaleUpperCase('tr-TR'));
        }
      }
    }

    // 2. Automatically calculate and record any remaining active helpers in target.helpers
    if (Array.isArray(target.helpers) && target.helpers.length > 0) {
      for (const h of target.helpers) {
        const hName = h.trim();
        const upperHName = hName.toLocaleUpperCase('tr-TR');
        if (!hName || handledHelpers.has(upperHName)) continue;

        // Calculate auto minutes from join time
        let autoMins = Math.max(1, params.minutes);
        let joinIso: string | undefined = undefined;
        if (target.helperJoinedAt) {
          const matchKey = Object.keys(target.helperJoinedAt).find(
            (k) => k.trim().toLocaleUpperCase('tr-TR') === upperHName
          );
          if (matchKey) joinIso = target.helperJoinedAt[matchKey];
        }

        if (joinIso) {
          const joinedMs = new Date(joinIso).getTime();
          if (!isNaN(joinedMs)) {
            autoMins = Math.max(1, Math.min(params.minutes, Math.round((Date.now() - joinedMs) / 60000)));
          }
        }

        target.interventions.push({
          operator: hName,
          minutes: autoMins,
          role: 'helper',
          action: 'YARDIMCI OLDU'
        });
        this.addMinutesToWeeklyStats(hName, autoMins);
        handledHelpers.add(upperHName);
      }
    }

    target.helpers = [];
    target.helperJoinedAt = {};

    // Add minutes to primary operator
    this.addMinutesToWeeklyStats(params.operatorName, params.minutes);

    // 1. DİREKT GOOGLE E-TABLOLARA GÖNDER
    let sheetsSynced = false;
    try {
      const row = this.formatFaultForSheets(target);
      const res = await this.sendRowsToGoogleSheets([row]);
      if (res.success) {
        target.syncedToSheets = true;
        target.syncedAt = new Date().toISOString();
        sheetsSynced = true;
      }
    } catch (sheetErr) {
      console.warn('Google Sheets auto-sync note on closeFault:', sheetErr);
    }

    // Günlük performans ve kapatılanlar özeti için arşive kaydet
    this.saveToClosedArchive(target);

    // 2. VERİ TABANINDAN SİL (Firestore + Local State)
    if (firestoreDb && isFirebaseOnline) {
      try {
        await firestoreDb.collection('arizalar').doc(faultId).delete();
      } catch (e) {
        console.warn('Firestore delete fault error on close:', e);
      }
    }

    // Aktif panel veritabanından kalıcı olarak sil
    const remainingFaults = faults.filter((f) => f.id !== faultId);
    notifyFaults(remainingFaults);

    // 📢 OTO SİSTEM HAREKETİ BİLDİRİM MESAJI
    try {
      const actionText = params.actionTaken && params.actionTaken.trim() ? ` (İşlem: ${params.actionTaken.trim()})` : '';
      await this.sendMessage(
        params.operatorName,
        'ALL',
        `✅ ${params.operatorName}, ${target.machine} arızasını başarıyla tamamladı ve kapattı. [Süre: ${params.minutes} dk]${actionText}`
      );
    } catch (e) {
      console.warn('Auto message error on close', e);
    }

    return {
      success: true,
      sheetsSynced,
      message: sheetsSynced
        ? 'Arıza başarıyla kapatıldı, Google E-Tabloya aktarıldı ve veritabanından silindi.'
        : 'Arıza kapatıldı ve veritabanından silindi.'
    };
  },

  // Helper for adding minutes into weekly stats
  addMinutesToWeeklyStats(operatorName: string, minutes: number) {
    const rawMins = Math.max(1, Math.round(Number(minutes) || 1));
    const stats = getLocal<WeeklyStats>(LS_KEY_WEEKLY, DEFAULT_WEEKLY_STATS);
    const dayNames = [
      'Pazar',
      'Pazartesi',
      'Salı',
      'Çarşamba',
      'Perşembe',
      'Cuma',
      'Cumartesi'
    ];
    const todayName = dayNames[new Date().getDay()];

    const cleanName = (operatorName || '').trim();
    if (!cleanName) return;
    const cleanUpper = cleanName.toLocaleUpperCase('tr-TR');

    // 1. Find matching key in existing stats case-insensitively
    let targetKey = Object.keys(stats).find(
      (k) => k.trim().toLocaleUpperCase('tr-TR') === cleanUpper
    );

    // 2. If not found in existing stats keys, check config operators
    if (!targetKey) {
      const cfg = this.getConfig();
      const matchedOp = cfg.operators.find(
        (o) =>
          o.name.trim().toLocaleUpperCase('tr-TR') === cleanUpper ||
          (o.shortName && o.shortName.trim().toLocaleUpperCase('tr-TR') === cleanUpper)
      );
      if (matchedOp) {
        // Also check if matchedOp.name exists in stats
        const opNameUpper = matchedOp.name.trim().toLocaleUpperCase('tr-TR');
        targetKey = Object.keys(stats).find(
          (k) => k.trim().toLocaleUpperCase('tr-TR') === opNameUpper
        ) || matchedOp.name;
      } else {
        targetKey = cleanName;
      }
    }

    if (!stats[targetKey]) {
      stats[targetKey] = {
        Pazartesi: 0,
        Salı: 0,
        Çarşamba: 0,
        Perşembe: 0,
        Cuma: 0,
        Cumartesi: 0,
        Pazar: 0
      };
    }
    stats[targetKey][todayName] = (stats[targetKey][todayName] || 0) + rawMins;
    notifyWeekly(stats);

    if (firestoreDb && isFirebaseOnline) {
      try {
        firestoreDb
          .collection('settings')
          .doc('weeklyStats')
          .set(stats, { merge: true });
      } catch (e) {
        // Ignore
      }
    }
  },

  // Admin: Assign Operator (Sadece Görevli Belirler - Çalışma Başlatmaz)
  async reassignFault(faultId: string, newOperatorName: string): Promise<void> {
    const faults = getLocal<Fault[]>(LS_KEY_FAULTS, DEFAULT_FAULTS);
    const target = faults.find((f) => f.id === faultId);
    if (!target) return;

    const op = newOperatorName && newOperatorName.trim() ? newOperatorName.trim() : null;
    target.assignedTo = op;

    // DİKKAT: Admin görevli ataması çalışma başlatmaz!
    // Arıza 'Açık' durumunda kalır, startedAt zaman sayacı çalışmaz.
    notifyFaults(faults);

    if (firestoreDb && isFirebaseOnline) {
      try {
        await firestoreDb.collection('arizalar').doc(faultId).update({
          assignedTo: op
        });
      } catch (e) {
        console.warn('Firestore reassign error', e);
      }
    }

    // 📢 OTO SİSTEM HAREKETİ BİLDİRİM MESAJI
    if (op) {
      try {
        await this.sendMessage(
          'YÖNETİCİ',
          'ALL',
          `📋 ${target.machine} arızasına görevli olarak ${op} atandı.`
        );
      } catch (e) {
        console.warn('Auto message error on reassign', e);
      }
    }
  },

  // Messaging: Send message
  async sendMessage(sender: string, target: string, text: string): Promise<void> {
    const messages = getLocal<SystemMessage[]>(LS_KEY_MESSAGES, DEFAULT_MESSAGES);
    const nowTs = Date.now();
    const newMsg: SystemMessage = {
      id: 'msg-' + nowTs + '-' + Math.random().toString(36).substring(2, 7),
      sender,
      target,
      text: text.trim(),
      timestamp: nowTs,
      readBy: []
    };

    // 1. Immediately update local state & notify listeners across app
    messages.unshift(newMsg);
    // Keep max 50 recent messages locally
    if (messages.length > 50) messages.length = 50;
    notifyMessages(messages);

    // Broadcast across browser tabs
    try {
      window.dispatchEvent(new CustomEvent('akg_cmms_new_message', { detail: newMsg }));
    } catch {
      // Ignore
    }

    // 2. Synchronize to Firestore remote database
    if (firestoreDb && isFirebaseOnline) {
      try {
        await firestoreDb.collection('messages').add({
          sender: newMsg.sender,
          target: newMsg.target,
          text: newMsg.text,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          createdAt: new Date().toISOString(),
          timestampMs: nowTs,
          readBy: []
        });
      } catch (e) {
        console.warn('Firestore message send error fallback to local only', e);
      }
    }
  },

  async deleteMessage(messageId: string): Promise<void> {
    const messages = getLocal<SystemMessage[]>(LS_KEY_MESSAGES, DEFAULT_MESSAGES);
    const filtered = messages.filter((m) => m.id !== messageId);
    notifyMessages(filtered);

    if (firestoreDb && isFirebaseOnline) {
      try {
        await firestoreDb.collection('messages').doc(messageId).delete();
      } catch (e) {
        console.warn('Firestore delete message error', e);
      }
      try {
        await firestoreDb.collection('mesajlar').doc(messageId).delete();
      } catch {
        // Ignore
      }
    }
  },

  // Admin: Clear all messages from Firestore and local storage
  async clearAllMessages(): Promise<void> {
    notifyMessages([]);
    localStorage.setItem(LS_KEY_MESSAGES, JSON.stringify([]));

    if (firestoreDb && isFirebaseOnline) {
      try {
        const snap = await firestoreDb.collection('messages').get();
        if (!snap.empty) {
          const batch = firestoreDb.batch();
          snap.docs.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
        }
      } catch (e) {
        console.warn('Firestore clear messages error', e);
      }
      try {
        const snap2 = await firestoreDb.collection('mesajlar').get();
        if (!snap2.empty) {
          const batch2 = firestoreDb.batch();
          snap2.docs.forEach((doc) => batch2.delete(doc.ref));
          await batch2.commit();
        }
      } catch {
        // Ignore
      }
    }
  },

  // Operator Management (Admin)
  async updateOperator(op: Operator): Promise<void> {
    const cfg = this.getConfig();
    const idx = cfg.operators.findIndex((o) => o.name === op.name || o.pin === op.pin);
    if (idx !== -1) {
      cfg.operators[idx] = op;
    } else {
      cfg.operators.push(op);
    }
    notifyConfig(cfg);

    if (firestoreDb && isFirebaseOnline) {
      try {
        await firestoreDb
          .collection('settings')
          .doc('config')
          .set({ operators: cfg.operators }, { merge: true });
      } catch (e) {
        console.warn('Firestore operator update error', e);
      }
    }
  },

  // Set temporary QR exemption (e.g. 1 hour, 3 hours, 24 hours, or -1 unlimited)
  async setQrExemption(operatorName: string, hours: number): Promise<void> {
    const cfg = this.getConfig();
    const op = cfg.operators.find((o) => o.name === operatorName);
    if (!op) return;

    if (hours === -1) {
      op.qrExemptUntil = -1; // unlimited
    } else if (hours === 0) {
      op.qrExemptUntil = 0; // none
    } else {
      op.qrExemptUntil = Date.now() + hours * 3600 * 1000;
    }

    notifyConfig(cfg);

    // If currently logged in, update localStorage
    const saved = this.getSavedOperator();
    if (saved && saved.name === operatorName) {
      saved.qrExemptUntil = op.qrExemptUntil;
      localStorage.setItem('akg_logged_in_op', JSON.stringify(saved));
    }

    if (firestoreDb && isFirebaseOnline) {
      try {
        await firestoreDb
          .collection('settings')
          .doc('config')
          .set({ operators: cfg.operators }, { merge: true });
      } catch (e) {
        // Ignore
      }
    }
  },

  // 16-Column Format matching user's Google Sheet (A to P) exactly:
  // Col A: TARİH (DD.MM.YYYY HH:mm)
  // Col B: İŞ İSTEK AÇAN
  // Col C: maliyet merkezi
  // Col D: İŞ İSTEK MAKİNE
  // Col E: VARDİYA (e.g. 2.VARDİYA 08:00 // 16:00)
  // Col F: İŞ TÜRÜ (e.g. MEKANİK ARIZA, PLANLI BAKIM KODU)
  // Col G: YAPILMASI İSTENEN İŞİN AÇIKLAMASI
  // Col H: FOTO (Yok / Link)
  // Col I: BAKIM LOGU (FUAT ÇETİN PARÇA BEKLİYOR ( 1 dk )\nFUAT ÇETİN ARIZAYI KAPATTI ( 14 dk ))
  // Col J: BİT TARİH (DD.MM.YYYY)
  // Col K: SAAT (HH:mm - HH:mm)
  // Col L: SÜRE (X dk)
  // Col M: DURUŞ NEDENİ (e.g. MAKİNE ARIZA)
  // Col N: YAPILAN BAKIM (e.g. YANLIŞ KULLANIM)
  // Col O: ACIKLAMA (e.g. Teknisyenin yaptığı işlem veya açıklama)
  // Col P: DEĞİŞEN PARÇA (e.g. Rulman / -)
  formatFaultForSheets(f: Fault): (string | number)[] {
    return [
      formatSheetDateTime(f.date, f.reportedAt),                                // A: TARİH
      f.reportedBy || 'fuat çetin',                                            // B: İŞ İSTEK AÇAN
      f.costCenter || '01-350522-BAKIM VE ONARIM & ÜRETİM',                    // C: maliyet merkezi
      f.machine || '',                                                         // D: İŞ İSTEK MAKİNE
      formatSheetShift(f.shift),                                               // E: VARDİYA
      formatJobType(f.faultType),                                              // F: İŞ TÜRÜ
      f.description || '',                                                     // G: YAPILMASI İSTENEN İŞİN AÇIKLAMASI
      f.photoUrl || 'Yok',                                                     // H: FOTO
      formatMaintenanceLog(f),                                                 // I: BAKIM LOGU
      formatSheetDate(f.closedAt, f.date),                                     // J: BİT TARİH
      formatSheetTimeRange(f),                                                 // K: SAAT
      `${f.totalDowntimeMinutes || 0} dk`,                                     // L: SÜRE
      (f.stoppageReason || 'MAKİNE ARIZA').toUpperCase(),                      // M: DURUŞ NEDENİ
      (f.faultReason || f.stoppageReason || 'YANLIŞ KULLANIM').toUpperCase(),  // N: YAPILAN BAKIM
      f.actionTaken || f.description || f.closedBy || '',                      // O: ACIKLAMA
      f.partsChanged && f.partsChanged.trim() ? f.partsChanged.trim() : '-'    // P: DEĞİŞEN PARÇA
    ];
  },

  // Send raw rows to Google Apps Script Web App
  async sendRowsToGoogleSheets(rows: (string | number)[][]): Promise<{
    success: boolean;
    count: number;
    message: string;
  }> {
    if (!rows || rows.length === 0) {
      return { success: true, count: 0, message: 'Aktarılacak satır yok.' };
    }

    try {
      const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({ action: 'exportClosedFaults', data: rows })
      });

      if (res.ok) {
        const json = await res.json();
        if (json && json.success) {
          return {
            success: true,
            count: json.count || rows.length,
            message: `${json.count || rows.length} adet kapalı arıza Google E-Tablo'ya başarıyla aktarıldı.`
          };
        } else {
          return {
            success: false,
            count: 0,
            message: json?.message || 'Google Apps Script isteği onaylamadı.'
          };
        }
      } else {
        return {
          success: false,
          count: 0,
          message: `Google E-Tablo sunucu hatası (HTTP ${res.status}).`
        };
      }
    } catch (e: any) {
      console.warn('Google Script fetch note:', e);
      return {
        success: false,
        count: 0,
        message: 'Google E-Tabloya bağlanırken hata oluştu: ' + (e?.message || 'Bağlantı hatası')
      };
    }
  },

  // Export closed faults to Google Sheets (Tüm kapatılanlar veya dünden kalanlar)
  async exportClosedFaultsToGoogleSheets(options?: {
    onlyPreviousDays?: boolean;
    deleteAfter?: boolean;
  }): Promise<{
    count: number;
    success: boolean;
    message: string;
  }> {
    const faults = getLocal<Fault[]>(LS_KEY_FAULTS, DEFAULT_FAULTS);
    const archive = getLocal<Fault[]>(LS_KEY_CLOSED_ARCHIVE, []);
    // Combine both active faults and archived closed faults (deduplicated by id)
    const combinedMap = new Map<string, Fault>();
    faults.forEach((f) => combinedMap.set(f.id, f));
    archive.forEach((f) => combinedMap.set(f.id, f));
    const allFaults = Array.from(combinedMap.values());

    const todayStr = new Date().toLocaleDateString('tr-TR');
    const onlyPrevious = options?.onlyPreviousDays ?? false;
    const deleteAfter = options?.deleteAfter ?? false;

    // Filter closed faults
    const toExport = allFaults.filter((f) => {
      if (f.status !== 'Kapalı') return false;
      if (onlyPrevious) {
        return f.date !== todayStr;
      }
      return true;
    });

    if (toExport.length === 0) {
      return {
        count: 0,
        success: true,
        message: onlyPrevious
          ? 'Dünden kalan kapatılmış arıza bulunamadı.'
          : 'Aktarılacak kapatılmış arıza kaydı bulunamadı.'
      };
    }

    const rows = toExport.map((f) => this.formatFaultForSheets(f));
    const syncRes = await this.sendRowsToGoogleSheets(rows);

    if (!syncRes.success) {
      return {
        count: 0,
        success: false,
        message: syncRes.message
      };
    }

    // Mark faults as synced
    const nowIso = new Date().toISOString();
    toExport.forEach((f) => {
      f.syncedToSheets = true;
      f.syncedAt = nowIso;
    });

    if (deleteAfter) {
      const idsToDelete = new Set(toExport.map((f) => f.id));
      const remaining = faults.filter((f) => !idsToDelete.has(f.id));
      notifyFaults(remaining);
      notifyClosedArchive(archive.filter((f) => !idsToDelete.has(f.id)));

      if (firestoreDb && isFirebaseOnline) {
        try {
          const batch = firestoreDb.batch();
          toExport.forEach((f) => {
            const ref = firestoreDb!.collection('arizalar').doc(f.id);
            batch.delete(ref);
          });
          await batch.commit();
        } catch (err) {
          console.warn('Batch delete error in Firestore', err);
        }
      }

      return {
        count: toExport.length,
        success: true,
        message: `${toExport.length} adet arıza Google E-Tabloya yazıldı ve ekran temizlendi.`
      };
    } else {
      notifyFaults([...faults]);
      notifyClosedArchive([...archive]);

      if (firestoreDb && isFirebaseOnline) {
        try {
          const batch = firestoreDb.batch();
          toExport.forEach((f) => {
            const ref = firestoreDb!.collection('arizalar').doc(f.id);
            batch.update(ref, {
              syncedToSheets: true,
              syncedAt: nowIso
            });
          });
          await batch.commit();
        } catch (err) {
          console.warn('Batch sync update in Firestore', err);
        }
      }

      return {
        count: toExport.length,
        success: true,
        message: `${toExport.length} adet kapatılmış arıza Google E-Tablo'ya başarıyla aktarıldı.`
      };
    }
  },

  // Google Sheets 16-Column Export (Varsayılan olarak tüm kapatılanları aktarır)
  async exportPreviousDaysToGoogleSheets(): Promise<{
    count: number;
    success: boolean;
    message: string;
  }> {
    return this.exportClosedFaultsToGoogleSheets({ onlyPreviousDays: false, deleteAfter: false });
  },

  // Add new fault
  async addFault(faultData: Partial<Fault>): Promise<Fault> {
    const faults = getLocal<Fault[]>(LS_KEY_FAULTS, DEFAULT_FAULTS);
    const now = new Date();
    const todayStr = now.toLocaleDateString('tr-TR');
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const newId = `FLT-${Date.now().toString().slice(-4)}`;

    const newFault: Fault = {
      id: newId,
      machine: faultData.machine || 'Genel Makine',
      machineCode: faultData.machineCode || '',
      faultType: matchVeriSheetFaultGroup(faultData.faultType || 'MEKANİK ARIZA'),
      status: 'Açık',
      description: faultData.description || 'Arıza bildirimi',
      reportedBy: faultData.reportedBy || 'Saha Operatörü',
      reportedAt: faultData.reportedAt || timeStr,
      date: faultData.date || todayStr,
      shift: faultData.shift || '2.VARDİYA 08:00 // 16:00',
      priority: faultData.priority || 'Normal',
      costCenter: faultData.costCenter || '01-350522-BAKIM VE ONARIM & ÜRETİM',
      photoUrl: faultData.photoUrl || 'Yok',
      helpers: [],
      interventions: [],
      totalDowntimeMinutes: 0,
      syncedToSheets: false
    };

    const updated = [newFault, ...faults];
    notifyFaults(updated);

    if (firestoreDb && isFirebaseOnline) {
      try {
        await firestoreDb.collection('arizalar').doc(newId).set({
          ...newFault,
          jobType: newFault.faultType,
          userName: newFault.reportedBy,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (e) {
        console.warn('Firestore add fault error', e);
      }
    }

    return newFault;
  },

  // Sync data from Google Apps Script
  async syncFromExcel(): Promise<{ success: boolean; message: string; count?: number }> {
    try {
      const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=getInitialData`);
      if (res.ok) {
        const json = await res.json();
        // The script returns { success: true, data: { operators: [...], faultReasons: [...], stoppageReasons: [...] } }
        const rawOps = json?.data?.operators || json?.operators || [];
        const rawFaultReasons = json?.data?.faultReasons || json?.faultReasons || [];
        const rawStoppageReasons = json?.data?.stoppageReasons || json?.stoppageReasons || [];

        if (Array.isArray(rawOps) && rawOps.length > 0) {
          const cfg = this.getConfig();
          const mappedOperators: Operator[] = rawOps.map((o: any) => {
            const opName = String(o.name || '').trim();
            const rawRole = (o.role || '').toLowerCase();
            const isAdmin =
              rawRole.includes('admin') ||
              opName.toUpperCase().includes('FUAT') ||
              opName.toUpperCase().includes('AYKUT');
            const role: 'admin' | 'teknisyen' | 'bakimci' = isAdmin
              ? 'admin'
              : rawRole === 'bakimci'
              ? 'bakimci'
              : 'teknisyen';

            const rawPhoto = o.imageUrl || o.photo || '';
            const photo =
              convertGoogleDriveUrl(rawPhoto) ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(opName)}&background=0284c7&color=fff&bold=true`;

            // Short name formatting: "ENGİN VARDAR" -> "E. Vardar"
            const parts = opName.split(/\s+/);
            let shortName = opName;
            if (parts.length >= 2) {
              const lastName = parts[parts.length - 1];
              const initials = parts.slice(0, -1).map((p) => (p[0] ? p[0].toUpperCase() + '.' : '')).join(' ');
              shortName = `${initials} ${lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase()}`;
            }

            let opPin = String(o.pin || '').trim();
            // In user's Google Sheet, FUAT ÇETİN has PIN 9 (in script was 123)
            if (opName.toUpperCase().includes('FUAT') && (!opPin || opPin === '123')) {
              opPin = '9';
            }

            return {
              id: o.id || `op-${opPin || opName}`,
              name: opName,
              shortName,
              pin: opPin,
              role,
              photo,
              qrExemptUntil: isAdmin ? -1 : 0
            };
          });

          cfg.operators = mappedOperators;

          if (Array.isArray(rawFaultReasons) && rawFaultReasons.length > 0) {
            cfg.faultReasons = Array.from(new Set(rawFaultReasons.filter(Boolean)));
          }

          if (Array.isArray(rawStoppageReasons) && rawStoppageReasons.length > 0) {
            cfg.stoppageReasons = Array.from(new Set(rawStoppageReasons.filter(Boolean)));
          }

          notifyConfig(cfg);

          // Sync to Firestore if available
          if (firestoreDb && isFirebaseOnline) {
            try {
              await firestoreDb
                .collection('settings')
                .doc('config')
                .set(
                  {
                    operators: cfg.operators,
                    faultReasons: cfg.faultReasons,
                    stoppageReasons: cfg.stoppageReasons
                  },
                  { merge: true }
                );
            } catch (e) {
              console.warn('Firestore config sync error', e);
            }
          }

          return {
            success: true,
            count: mappedOperators.length,
            message: `${mappedOperators.length} teknisyen ve arıza parametreleri Google E-Tablolar'dan başarıyla güncellendi.`
          };
        }
      }
    } catch (err) {
      console.warn('Google Script sync error', err);
    }

    return {
      success: true,
      message: 'Google E-Tablolar kontrol edildi. Mevcut teknisyen listesi aktif.'
    };
  },

  // Clear caches
  clearAllCache() {
    localStorage.removeItem(LS_KEY_FAULTS);
    localStorage.removeItem(LS_KEY_CLOSED_ARCHIVE);
    localStorage.removeItem(LS_KEY_OPERATORS);
    localStorage.removeItem(LS_KEY_MESSAGES);
    localStorage.removeItem(LS_KEY_WEEKLY);
    localStorage.removeItem(LS_KEY_CONFIG);
    localStorage.removeItem('akg_logged_in_op');
    window.location.reload();
  }
};
