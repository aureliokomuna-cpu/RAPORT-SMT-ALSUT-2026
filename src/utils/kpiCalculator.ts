import { SmtRecord } from '../types';
import { MONTH_CONFIGS } from './parser';

export type KpiTier = 'Istimewa' | 'Sangat Baik' | 'Baik' | 'Kurang' | 'Kurang Sekali';

export interface KpiTierInfo {
  tier: KpiTier;
  rangeLabel: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  borderClass: string;
  bgLight: string;
  icon: string;
  description: string;
}

/**
 * Evaluates KPI percentage against the official 5-tier standard from the company guideline:
 * - Istimewa: > 105%
 * - Sangat Baik: 100% < n <= 105%
 * - Baik: 95% <= n <= 100%
 * - Kurang: 90% <= n < 95%
 * - Kurang Sekali: < 90%
 */
export function getKpiTier(pct: number): KpiTierInfo {
  if (pct > 105) {
    return {
      tier: 'Istimewa',
      rangeLabel: '> 105%',
      color: '#10B981',
      badgeBg: 'bg-emerald-500',
      badgeText: 'text-white',
      borderColor: '#059669',
      borderClass: 'border-emerald-700',
      bgLight: 'bg-emerald-50 text-emerald-950',
      icon: '👑',
      description: 'Pencapaian istimewa melampaui 105% target!',
    };
  }
  if (pct > 100 && pct <= 105) {
    return {
      tier: 'Sangat Baik',
      rangeLabel: '100% < n <= 105%',
      color: '#2563EB',
      badgeBg: 'bg-blue-600',
      badgeText: 'text-white',
      borderColor: '#1D4ED8',
      borderClass: 'border-blue-700',
      bgLight: 'bg-blue-50 text-blue-950',
      icon: '🌟',
      description: 'Pencapaian sangat baik di atas target (100% - 105%).',
    };
  }
  if (pct >= 95 && pct <= 100) {
    return {
      tier: 'Baik',
      rangeLabel: '95% <= n <= 100%',
      color: '#06D6A0',
      badgeBg: 'bg-[#06D6A0]',
      badgeText: 'text-black',
      borderColor: '#059669',
      borderClass: 'border-emerald-600',
      bgLight: 'bg-emerald-50/80 text-emerald-900',
      icon: '✅',
      description: 'Pencapaian baik di rentang 95% - 100% target.',
    };
  }
  if (pct >= 90 && pct < 95) {
    return {
      tier: 'Kurang',
      rangeLabel: '90% <= n < 95%',
      color: '#F59E0B',
      badgeBg: 'bg-amber-400',
      badgeText: 'text-black',
      borderColor: '#D97706',
      borderClass: 'border-amber-600',
      bgLight: 'bg-amber-50 text-amber-950',
      icon: '⚠️',
      description: 'Pencapaian kurang, berada di rentang 90% - 94.9%.',
    };
  }
  return {
    tier: 'Kurang Sekali',
    rangeLabel: '< 90%',
    color: '#EF4444',
    badgeBg: 'bg-red-500',
    badgeText: 'text-white',
    borderColor: '#DC2626',
    borderClass: 'border-red-700',
    bgLight: 'bg-red-50 text-red-950',
    icon: '🚨',
    description: 'Pencapaian di bawah 90%, butuh pendampingan & coaching khusus.',
  };
}

/**
 * Official Store Achievement Data from NEW_PARIRIMBON_J347_2026_50f33ae1
 * Store: Living World Alam Sutera (08)
 */
export const STORE_ACHIEVEMENT = {
  storeCode: 'J347 / 08',
  storeName: 'Living World Alam Sutera',
  // Semester 1 (Bulan 1-6)
  sem1: {
    target: 168_924_800_000,
    targetFormatted: 'Rp 168,92 M',
    achv: 173_945_428_811,
    achvFormatted: 'Rp 173,95 M',
    pct: 103.0,
    pctFormatted: '103.0%',
    growthPct: 5.0,
    tierInfo: getKpiTier(103.0),
  },
  // YTD Through Month 8 (Bulan 1-8 / Jan - Aug)
  ytdAug: {
    target: 224_866_800_000,
    targetFormatted: 'Rp 224,87 M',
    achv: 233_565_171_927,
    achvFormatted: 'Rp 233,57 M',
    pct: 103.9,
    pctFormatted: '103.9%',
    growthPct: -21.6,
    tierInfo: getKpiTier(103.9),
  },
  // Store Derivative Data (AJ, COMSER & FURNIPRO)
  derivativeSem1: {
    target: 1_486_900_000,
    targetFormatted: 'Rp 1,49 M',
    achv: 1_766_422_656,
    achvFormatted: 'Rp 1,77 M',
    pct: 118.8,
    pctFormatted: '118.8%',
    tierInfo: getKpiTier(118.8),
  },
  derivativeYtdAug: {
    target: 2_052_300_000,
    targetFormatted: 'Rp 2,05 M',
    achv: 2_471_468_937,
    achvFormatted: 'Rp 2,47 M',
    pct: 120.4,
    pctFormatted: '120.4%',
    tierInfo: getKpiTier(120.4),
  },
  // Monthly Store Achievement Breakdown
  monthly: [
    { month: 'Januari', pct: 106.3, tier: getKpiTier(106.3) },
    { month: 'Februari', pct: 99.9, tier: getKpiTier(99.9) },
    { month: 'Maret', pct: 101.7, tier: getKpiTier(101.7) },
    { month: 'April', pct: 104.6, tier: getKpiTier(104.6) },
    { month: 'Mei', pct: 116.9, tier: getKpiTier(116.9) },
    { month: 'Juni', pct: 91.0, tier: getKpiTier(91.0) },
    { month: 'Juli', pct: 103.2, tier: getKpiTier(103.2) },
    { month: 'Agustus', pct: 109.9, tier: getKpiTier(109.9) },
  ]
};

export interface SmtKpiEvaluation {
  // 1. Store Achievement
  storePct: number;
  storePctFormatted: string;
  storeTier: KpiTierInfo;
  storeTargetFormatted: string;
  storeAchvFormatted: string;

  // 2. Personal Achievement
  personalPct: number;
  personalPctFormatted: string;
  personalTier: KpiTierInfo;

  // 3. Derivative Achievement
  derivativePct: number;
  derivativePctFormatted: string;
  derivativeTier: KpiTierInfo;
  fpPct: number;
  ccPct: number;
  targetFp: number;
  targetCc: number;

  // 4. Akumulasi 3 Komponen KPI (Store + Personal + Derivatif)
  compositePct: number;
  compositePctFormatted: string;
  compositeTier: KpiTierInfo;
  compositeFormulaText: string;
}

/**
 * Calculates all 3 KPI assessments for an SMT based on standard benchmarks:
 * 1. Store Achievement: from NEW_PARIRIMBON_J347_2026_50f33ae1 (103.0% -> Sangat Baik)
 * 2. Personal Achievement: from smt.ytd.salesPct
 * 3. Derivative Achievement: from smt's Furnipro & Clean Care achievement vs quota
 * 4. Akumulasi 3 KPI: Rata-rata komposit (Store + Personal + Derivatif) / 3
 */
export function evaluateSmtKpi(smt: SmtRecord, activeMonthsCount: number = 8): SmtKpiEvaluation {
  // 1. Store Achievement (Semester 1: 103.0% -> Sangat Baik)
  const store = STORE_ACHIEVEMENT.sem1;

  // 2. Personal Achievement (from SMT's YTD sales percentage)
  const personalPct = Math.round(smt.ytd.salesPct * 10) / 10;
  const personalTier = getKpiTier(personalPct);

  // 3. Derivative Achievement (from SMT's actual Furnipro and Clean & Care data)
  const months = Math.max(1, activeMonthsCount || MONTH_CONFIGS.length || 8);
  const targetFp = months * 10; // Benchmark 10 polis per month
  const targetCc = months * 500_000; // Benchmark Rp 500.000 per month

  const fpPct = Math.round(((smt.ytd.polisCount / targetFp) * 100) * 10) / 10;
  const ccPct = Math.round(((smt.ytd.comserVal / targetCc) * 100) * 10) / 10;
  
  // Combined derivative achievement percentage
  const derivativePct = Math.round(((fpPct + ccPct) / 2) * 10) / 10;
  const derivativeTier = getKpiTier(derivativePct);

  // 4. Akumulasi 3 Komponen KPI (Store + Personal + Derivatif)
  const compositePct = Math.round(((store.pct + personalPct + derivativePct) / 3) * 10) / 10;
  const compositeTier = getKpiTier(compositePct);
  const compositeFormulaText = `(${store.pctFormatted} + ${personalPct.toFixed(1)}% + ${derivativePct.toFixed(1)}%) ÷ 3`;

  return {
    storePct: store.pct,
    storePctFormatted: store.pctFormatted,
    storeTier: store.tierInfo,
    storeTargetFormatted: store.targetFormatted,
    storeAchvFormatted: store.achvFormatted,

    personalPct,
    personalPctFormatted: `${personalPct.toFixed(1)}%`,
    personalTier,

    derivativePct,
    derivativePctFormatted: `${derivativePct.toFixed(1)}%`,
    derivativeTier,
    fpPct,
    ccPct,
    targetFp,
    targetCc,

    compositePct,
    compositePctFormatted: `${compositePct.toFixed(1)}%`,
    compositeTier,
    compositeFormulaText,
  };
}
