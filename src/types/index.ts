export type MonthKey = 'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun' | 'jul';

export interface MonthConfig {
  key: MonthKey;
  name: string;
  short: string;
  salesIdx: number;
  fpIdx: number;
  ccIdx: number;
}

export type GradeLevel = 'S+' | 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface MonthlyMetric {
  monthKey: MonthKey;
  monthName: string;
  monthShort: string;
  rawSales: string;
  salesPct: number;
  rawFp: string;
  fpCount: number;
  rawCc: string;
  ccVal: number;
  grade: GradeLevel;
  vibe: string;
  badge: string;
  color: string;
  isAchieved: boolean; // Sales >= 100%
  rankInMonth?: number;
  comment: string;
}

export interface SmtYtd {
  rawSales: string;
  salesPct: number;
  rawPolis: string;
  polisCount: number;
  rawComser: string;
  comserVal: number;
  salesAchCount: number;
  furniproAchCount: number;
  commserAchCount: number;
  evaluationResult: string;
  auraScore: number;
  genzTag: string;
  genzTagline: string;
  overallGrade: GradeLevel;
  rank: number;
}

export interface SmtRecord {
  id: string;
  nip: string;
  nama: string;
  zone: string;
  monthly: Record<MonthKey, MonthlyMetric>;
  ytd: SmtYtd;
}

export interface ZoneSummary {
  zoneName: string;
  memberCount: number;
  avgSalesPct: number;
  totalPolis: number;
  totalComser: number;
  bestPerformerCount: number;
  safeCount: number;
  warningCount: number;
  pantauanCount: number;
  topSmt: string;
}

export type StatusCategory = 
  | 'ALL'
  | 'BEST'
  | 'SAFE'
  | 'WARN_DERIVATIVE'
  | 'WARN_COMSER'
  | 'WARN_FP'
  | 'PANTAUAN';

export interface FilterState {
  searchQuery: string;
  selectedZone: string;
  selectedStatus: StatusCategory;
  selectedMonth: MonthKey | 'ytd';
  sortBy: 'rank' | 'sales' | 'polis' | 'comser' | 'name' | 'achCount';
  sortOrder: 'asc' | 'desc';
  activeView: 'bento' | 'table' | 'leaderboard' | 'zones' | 'monthly_drill';
}
