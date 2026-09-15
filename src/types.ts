export type FlowCategory =
  | 'master'
  | 'auth'
  | 'qr'
  | 'intervention'
  | 'closure'
  | 'archive'
  | 'messaging'
  | 'architecture';

export type NodeType =
  | 'start'
  | 'end'
  | 'process'
  | 'decision'
  | 'database'
  | 'integration'
  | 'alert';

export interface FlowNode {
  id: string;
  label: string;
  sublabel?: string;
  type: NodeType;
  actor: 'operator' | 'admin' | 'firebase' | 'google' | 'system';
  x: number;
  y: number;
  width?: number;
  height?: number;
  codeFunction?: string;
  firestoreCollection?: string;
  description: string;
  details?: string[];
  codeSnippet?: string;
  inputs?: string[];
  outputs?: string[];
  edgeCases?: string[];
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple';
}

export interface FlowDiagram {
  id: FlowCategory;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface SimulationScenario {
  id: string;
  title: string;
  description: string;
  role: string;
  steps: {
    nodeId: string;
    actionTitle: string;
    stateChange: string;
    systemLog: string;
  }[];
}

// ==========================================
// AKG CMMS OPERATIONAL TYPES
// ==========================================

export interface Operator {
  id?: string;
  name: string;
  shortName?: string;
  pin: string;
  role: 'admin' | 'teknisyen' | 'bakimci';
  photo?: string;
  qrExemptUntil?: number; // timestamp in ms
}

export interface InterventionLog {
  operator: string;
  minutes: number;
  action?: string;
  role?: 'primary' | 'helper';
  startedAt?: string;
  endedAt?: string;
}

export type FaultStatus =
  | 'Açık'
  | 'Müdahale Ediliyor'
  | 'Parça Bekliyor'
  | 'Devredildi'
  | 'Dış Servis Bekliyor'
  | 'Geçici Çözüm'
  | 'Kapalı';

export type FaultType =
  | 'Mekanik'
  | 'Elektrik'
  | 'İş Güvenliği'
  | 'Planlı Bakım'
  | 'Tekrar Eden'
  | string;

export interface Fault {
  id: string;
  machine: string;
  machineCode?: string;
  faultType: FaultType;
  status: FaultStatus;
  description: string;
  reportedBy: string;
  reportedAt: string;
  date: string; // YYYY-MM-DD or DD.MM.YYYY
  shift?: string;
  assignedTo?: string | null;
  startedAt?: string | null;
  helpers?: string[];
  helperJoinedAt?: Record<string, string>;
  interventions?: InterventionLog[];
  actionTaken?: string;
  partsChanged?: string;
  faultReason?: string;
  stoppageReason?: string;
  closedAt?: string | null;
  closedBy?: string | null;
  totalDowntimeMinutes?: number;
  priority?: 'Normal' | 'Yüksek' | 'Acil';
  costCenter?: string;
  photoUrl?: string;
  syncedToSheets?: boolean;
  syncedAt?: string;
}

export interface SystemMessage {
  id: string;
  sender: string;
  target: string; // 'ALL' or operator name
  text: string;
  timestamp: string | number;
  readBy?: string[];
}

export interface SystemConfig {
  operators: Operator[];
  faultReasons: string[];
  stoppageReasons: string[];
  shifts: string[];
}

export interface WeeklyStats {
  [operatorName: string]: {
    [dayName: string]: number; // minutes worked
  };
}

export interface ViewSettings {
  displayMode: 'card' | 'compact' | 'row';
  groupBy: 'none' | 'date' | 'faultType';
  showShift: boolean;
  showReporter: boolean;
  showAssignee: boolean;
  showDescription: boolean;
  soundEnabled: boolean;
  themeColor: string; // e.g. 'blue', 'slate', 'emerald', 'cyan', 'amber'
  fontSize: number; // in pixels (14 - 18)
}

