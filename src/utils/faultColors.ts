import React from 'react';
import { Wrench, Zap, ShieldAlert, CalendarClock, RefreshCw, HelpCircle } from 'lucide-react';

export interface FaultTypeColorConfig {
  id: string;
  name: string;
  shortName: string;
  sheetName: string; // Exact match to Google Sheets 'veri' tab Column G (İŞ İSTEK TÜRÜ)
  color: string; // Exact hex code
  bgColor: string; // Translucent background
  borderColor: string;
  textColor: string;
  badgeBg: string;
  badgeBorder: string;
  icon: React.ElementType;
}

export const FAULT_COLOR_CODES = {
  MEKANIK: '#00FFFF',      // #00FFFF Mekanik Arıza (Cyan)
  ELEKTRIK: '#FFFF00',     // #FFFF00 Elektrik Arıza (Yellow)
  ISG: '#FF0000',          // #FF0000 İş Güvenliği (Red)
  PLANLI_BAKIM: '#FFA500', // #FFA500 Planlı Bakım (Orange)
  TEKRAR_EDEN: '#E879F9',  // Mor / Magenta
  DIGER: '#94A3B8'
} as const;

/**
 * Exact definitions from the 'veri' Google Sheet tab - Column G (İŞ İSTEK TÜRÜ)
 * Row 2: MEKANİK ARIZA
 * Row 3: ELEKTRİK ARIZA
 * Row 4: İŞ GÜVENLİĞİ !!!
 * Row 5: PLANLI BAKIM KODU
 * Row 6: TEKRAR EDEN ARIZA  !!!!
 */
export const VERI_SHEET_COLUMN_G_GROUPS = [
  'MEKANİK ARIZA',
  'ELEKTRİK ARIZA',
  'İŞ GÜVENLİĞİ !!!',
  'PLANLI BAKIM KODU',
  'TEKRAR EDEN ARIZA  !!!!'
] as const;

export type VeriSheetGroup = (typeof VERI_SHEET_COLUMN_G_GROUPS)[number];

const DEF_MEKANIK: FaultTypeColorConfig = {
  id: 'MEKANİK ARIZA',
  name: 'MEKANİK ARIZA',
  shortName: 'Mekanik',
  sheetName: 'MEKANİK ARIZA',
  color: FAULT_COLOR_CODES.MEKANIK,
  bgColor: 'rgba(0, 255, 255, 0.08)',
  borderColor: 'rgba(0, 255, 255, 0.45)',
  textColor: '#00FFFF',
  badgeBg: 'rgba(0, 255, 255, 0.15)',
  badgeBorder: 'rgba(0, 255, 255, 0.5)',
  icon: Wrench
};

const DEF_ELEKTRIK: FaultTypeColorConfig = {
  id: 'ELEKTRİK ARIZA',
  name: 'ELEKTRİK ARIZA',
  shortName: 'Elektrik',
  sheetName: 'ELEKTRİK ARIZA',
  color: FAULT_COLOR_CODES.ELEKTRIK,
  bgColor: 'rgba(255, 255, 0, 0.08)',
  borderColor: 'rgba(255, 255, 0, 0.45)',
  textColor: '#FFFF00',
  badgeBg: 'rgba(255, 255, 0, 0.15)',
  badgeBorder: 'rgba(255, 255, 0, 0.5)',
  icon: Zap
};

const DEF_ISG: FaultTypeColorConfig = {
  id: 'İŞ GÜVENLİĞİ !!!',
  name: 'İŞ GÜVENLİĞİ !!!',
  shortName: 'İSG',
  sheetName: 'İŞ GÜVENLİĞİ !!!',
  color: FAULT_COLOR_CODES.ISG,
  bgColor: 'rgba(255, 0, 0, 0.08)',
  borderColor: 'rgba(255, 0, 0, 0.45)',
  textColor: '#FF0000',
  badgeBg: 'rgba(255, 0, 0, 0.15)',
  badgeBorder: 'rgba(255, 0, 0, 0.5)',
  icon: ShieldAlert
};

const DEF_PLANLI_BAKIM: FaultTypeColorConfig = {
  id: 'PLANLI BAKIM KODU',
  name: 'PLANLI BAKIM KODU',
  shortName: 'Planlı Bakım',
  sheetName: 'PLANLI BAKIM KODU',
  color: FAULT_COLOR_CODES.PLANLI_BAKIM,
  bgColor: 'rgba(255, 165, 0, 0.08)',
  borderColor: 'rgba(255, 165, 0, 0.45)',
  textColor: '#FFA500',
  badgeBg: 'rgba(255, 165, 0, 0.15)',
  badgeBorder: 'rgba(255, 165, 0, 0.5)',
  icon: CalendarClock
};

const DEF_TEKRAR_EDEN: FaultTypeColorConfig = {
  id: 'TEKRAR EDEN ARIZA  !!!!',
  name: 'TEKRAR EDEN ARIZA  !!!!',
  shortName: 'Tekrar Eden',
  sheetName: 'TEKRAR EDEN ARIZA  !!!!',
  color: FAULT_COLOR_CODES.TEKRAR_EDEN,
  bgColor: 'rgba(232, 121, 249, 0.08)',
  borderColor: 'rgba(232, 121, 249, 0.45)',
  textColor: '#E879F9',
  badgeBg: 'rgba(232, 121, 249, 0.15)',
  badgeBorder: 'rgba(232, 121, 249, 0.5)',
  icon: RefreshCw
};

export const FAULT_TYPE_DEFINITIONS: Record<string, FaultTypeColorConfig> = {
  // Canonical names from Google Sheets 'veri' tab Column G (İŞ İSTEK TÜRÜ)
  'MEKANİK ARIZA': DEF_MEKANIK,
  'ELEKTRİK ARIZA': DEF_ELEKTRIK,
  'İŞ GÜVENLİĞİ !!!': DEF_ISG,
  'PLANLI BAKIM KODU': DEF_PLANLI_BAKIM,
  'TEKRAR EDEN ARIZA  !!!!': DEF_TEKRAR_EDEN,

  // Aliases for user-friendly compatibility
  Mekanik: DEF_MEKANIK,
  'Mekanik Arıza': DEF_MEKANIK,
  Elektrik: DEF_ELEKTRIK,
  'Elektrik Arıza': DEF_ELEKTRIK,
  'İş Güvenliği': DEF_ISG,
  'İş Güvenliği (İSG)': DEF_ISG,
  'İŞ GÜVENLİĞİ': DEF_ISG,
  'İŞ GÜVENLİĞİ ARIZA': DEF_ISG,
  İSG: DEF_ISG,
  'Planlı Bakım': DEF_PLANLI_BAKIM,
  'PLANLI BAKIM': DEF_PLANLI_BAKIM,
  'Tekrar Eden': DEF_TEKRAR_EDEN,
  'Tekrar Eden Arıza': DEF_TEKRAR_EDEN,
  'TEKRAR EDEN ARIZA': DEF_TEKRAR_EDEN
};

/**
 * Ordered list of fault types for consistent grouping display
 * Directly matches Google Sheets 'veri' tab Column G
 */
export const ORDERED_FAULT_TYPES: string[] = [
  'MEKANİK ARIZA',
  'ELEKTRİK ARIZA',
  'İŞ GÜVENLİĞİ !!!',
  'PLANLI BAKIM KODU',
  'TEKRAR EDEN ARIZA  !!!!'
];

/**
 * Compares an input string against Google Sheets 'veri' tab Column G fault groups
 * and returns the exact Column G value.
 */
export function matchVeriSheetFaultGroup(type?: string | null): VeriSheetGroup {
  if (!type) return 'MEKANİK ARIZA';
  const t = String(type).trim();

  // Exact match with Column G
  if (VERI_SHEET_COLUMN_G_GROUPS.includes(t as VeriSheetGroup)) {
    return t as VeriSheetGroup;
  }

  // Turkish-aware lowercasing
  const lower = t
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase();

  // 1. İş Güvenliği check
  if (
    lower.includes('güvenlik') ||
    lower.includes('guvenlik') ||
    lower.includes('isg') ||
    lower.includes('i̇sg') ||
    lower.includes('kaza') ||
    lower.includes('iş sağlığı') ||
    lower.includes('is sagligi')
  ) {
    return 'İŞ GÜVENLİĞİ !!!';
  }

  // 2. Tekrar Eden Arıza check
  if (
    lower.includes('tekrar') ||
    lower.includes('kronik') ||
    lower.includes('yinelenen')
  ) {
    return 'TEKRAR EDEN ARIZA  !!!!';
  }

  // 3. Planlı Bakım Kodu check
  if (
    lower.includes('planlı') ||
    lower.includes('planli') ||
    lower.includes('periyodik') ||
    lower.includes('plan') ||
    lower.includes('bakim kodu') ||
    lower.includes('bakım kodu')
  ) {
    return 'PLANLI BAKIM KODU';
  }

  // 4. Elektrik Arıza check
  if (
    lower.includes('elektrik') ||
    lower.includes('elektronik') ||
    lower.includes('elk') ||
    lower.includes('elek') ||
    lower.includes('pano') ||
    lower.includes('otomasyon') ||
    lower.includes('sensör') ||
    lower.includes('sensor') ||
    lower.includes('motor') ||
    lower.includes('sürücü') ||
    lower.includes('surucu')
  ) {
    return 'ELEKTRİK ARIZA';
  }

  // 5. Mekanik Arıza check
  if (
    lower.includes('mekanik') ||
    lower.includes('mek') ||
    lower.includes('hidrolik') ||
    lower.includes('pnömatik') ||
    lower.includes('pnomatik')
  ) {
    return 'MEKANİK ARIZA';
  }

  return 'MEKANİK ARIZA';
}

/**
 * Returns the color configuration for a given fault type
 * comparing with Google Sheets 'veri' tab Column G (İŞ İSTEK TÜRÜ).
 */
export function getFaultTypeConfig(type?: string): FaultTypeColorConfig {
  if (!type) return DEF_MEKANIK;
  const t = String(type).trim();

  // Direct map match
  if (FAULT_TYPE_DEFINITIONS[t]) {
    return FAULT_TYPE_DEFINITIONS[t];
  }

  // Compare against Column G groups
  const matchedGroup = matchVeriSheetFaultGroup(t);
  if (FAULT_TYPE_DEFINITIONS[matchedGroup]) {
    return FAULT_TYPE_DEFINITIONS[matchedGroup];
  }

  // Fallback generic but preserve type info
  return {
    id: t,
    name: t,
    shortName: t,
    sheetName: t,
    color: FAULT_COLOR_CODES.DIGER,
    bgColor: 'rgba(148, 163, 184, 0.08)',
    borderColor: 'rgba(148, 163, 184, 0.45)',
    textColor: '#CBD5E1',
    badgeBg: 'rgba(148, 163, 184, 0.15)',
    badgeBorder: 'rgba(148, 163, 184, 0.5)',
    icon: HelpCircle
  };
}

/**
 * Checks if two fault types belong to the same category / Column G group
 */
export function isMatchingFaultGroup(typeA?: string, typeB?: string): boolean {
  if (!typeA || !typeB) return false;
  if (typeA === 'ALL' || typeB === 'ALL') return true;
  const cfgA = getFaultTypeConfig(typeA);
  const cfgB = getFaultTypeConfig(typeB);
  return cfgA.sheetName === cfgB.sheetName || cfgA.id === cfgB.id;
}
