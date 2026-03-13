// =============================================
// ВЕТАИ Platform — Centralized Type Definitions
// =============================================

// ---- Core entities ----

export type CowStatus = 'Дойная' | 'Сухостойная' | 'Нетель' | 'Выбракована' | 'Транзитная';
export type CowBreed = 'Голштинская' | 'Симментальская' | 'Джерсейская';
export type GynStatus = 'Открыта' | 'Осеменена' | 'Стельная' | 'Охота' | 'Сервис-период';
export type GroupType = 'feeding_group' | 'production_group' | 'section' | 'maternity';
export type EventSeverity = 'info' | 'warning' | 'critical';
export type AlertCategory = 'mastitis' | 'ketosis' | 'digestion' | 'lameness' | 'abortion' | 'health';

// ---- Afimilk list item (universal cow row) ----

export interface AfimilkListItem {
  cow: string;
  registrationNumber?: string;
  group: number;
  status?: string;
  gynStatus?: string;
  lactationNumber: number;
  dim: number;
  ageInMonths?: number;
  age?: number;
  dailyAverageYield?: number | null;

  // Health-specific
  yieldLast24H?: number | null;
  yieldLast24HPercent?: number | null;
  productionRateDeviationS1?: number | null;
  restTimeDeviationS3?: number | null;

  // Reproduction-specific
  heatIndicatorS1?: number | null;
  heatIndicatorS3?: number | null;
  daysAfterHeat?: number | null;
  daysAfterInsemination?: number | null;
  inseminationNumber?: number | null;
  inHeatStarted?: string | null;
}

export interface AfimilkListReport {
  title: string;
  items: AfimilkListItem[];
}

export interface AfimilkData {
  healthIssues: AfimilkListReport | null;
  heatSuspects: AfimilkListReport | null;
  animalsToBreed: AfimilkListReport | null;
  calvingAnimals: AfimilkListReport | null;
  freshCows: AfimilkListReport | null;
  mastitisSuspects: AfimilkListReport | null;
  ketosisSuspects: AfimilkListReport | null;
  digestionProblems: AfimilkListReport | null;
  abortionSuspects: AfimilkListReport | null;
  lamenessSuspects: AfimilkListReport | null;
}

export interface AfimilkSummary {
  totalAlerts: number;
  totalHealthIssues: number;
  totalHeatSuspects: number;
  totalToBreed: number;
  totalCalving: number;
  totalFreshCows: number;
  totalMastitisSuspects: number;
  totalKetosisSuspects: number;
  totalAbortionSuspects: number;
  totalDigestionProblems: number;
  lastUpdate: string;
}

// ---- Milking ----

export interface MilkingRecord {
  cowNumber: string;
  stall: string;
  milkingNumber: number;
  date: string;
  time: string;
  yield: number;         // кг
  duration: number;      // мин
  completeness: number;  // %
  conductivity: number;
  scc: number;           // тыс/мл
}

export interface MilkingSummary {
  totalYield: number;
  averageYield: number;
  totalCows: number;
  date: string;
  bySCC: {
    normal: number;   // <200
    elevated: number; // 200-400
    high: number;     // >400
  };
}

// ---- Farm KPI ----

export interface FarmKPI {
  totalMilkToday: number;
  averageMilkPerCow: number;
  milkingCows: number;
  milkDate: string;
  herdAlerts: number;
  healthIssues: number;
  heatSuspects: number;
  toBreed: number;
  calving: number;
  freshCows: number;
  mastitisSuspects: number;
  ketosisSuspects: number;
  abortionSuspects: number;
  digestionProblems: number;
  lastUpdate: string;
}

// ---- /api/farm response ----

export interface FarmDataResponse {
  kpi: FarmKPI;
  afimilk: AfimilkData;
  afimilkSummary: AfimilkSummary;
  milkingRecords: MilkingRecord[];
  milkingSummary: MilkingSummary;
  totalAnimals: number;
  allCowNumbers: string[];
}

// ---- /api/dashboard response ----

export interface DashboardFeedGroup {
  name: string;
  planned: number;
  actual: number;
  remainder: number;
  headCount: number;
  iofc: number | null;
  feedCost: number | null;
  groupType: string;
  efficiency: number;
  count: number;
}

export interface DashboardDaily {
  date: string;
  planned: number;
  actual: number;
  remainder: number;
}

export interface DashboardEvent {
  id: string;
  title: string;
  description: string;
  severity: string;
  timestamp: string;
}

export interface DashboardResponse {
  feeding: {
    totalPlanned: number;
    totalActual: number;
    totalRemainder: number;
    totalDryMatter: number;
    efficiency: number;
    avgIOFC: number | null;
    totalFeedCost: number;
    totalHeadCount: number;
    recordCount: number;
    groupCount: number;
  };
  milking: {
    totalYield: number;
    avgYield: number;
    cowCount: number;
    recordCount: number;
  };
  groups: DashboardFeedGroup[];
  daily: DashboardDaily[];
  mixBatches: number;
  ingredients: number;
  events: DashboardEvent[];
}
