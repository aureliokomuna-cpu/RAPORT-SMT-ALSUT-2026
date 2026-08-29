import Papa from 'papaparse';
import { GradeLevel, MonthConfig, MonthKey, MonthlyMetric, SmtRecord, ZoneSummary } from '../types';

export const MONTH_CONFIGS: MonthConfig[] = [
  { key: 'jan', name: 'Januari', short: 'JAN', salesIdx: 3, fpIdx: 4, ccIdx: 5 },
  { key: 'feb', name: 'Februari', short: 'FEB', salesIdx: 7, fpIdx: 8, ccIdx: 9 },
  { key: 'mar', name: 'Maret', short: 'MAR', salesIdx: 11, fpIdx: 12, ccIdx: 13 },
  { key: 'apr', name: 'April', short: 'APR', salesIdx: 15, fpIdx: 16, ccIdx: 17 },
  { key: 'may', name: 'Mei', short: 'MAY', salesIdx: 19, fpIdx: 20, ccIdx: 21 },
  { key: 'jun', name: 'Juni', short: 'JUN', salesIdx: 23, fpIdx: 24, ccIdx: 25 },
  { key: 'jul', name: 'Juli', short: 'JUL', salesIdx: 27, fpIdx: 28, ccIdx: 29 },
];

export function parsePercentage(str?: string | null): number {
  if (!str) return 0;
  const clean = str.replace('%', '').replace(',', '.').trim();
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : Number(val.toFixed(2));
}

export function parseCount(str?: string | null): number {
  if (!str) return 0;
  const clean = str.replace(/[^\d.-]/g, '').trim();
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : Math.round(val);
}

export function parseRupiah(str?: string | null): number {
  if (!str) return 0;
  const clean = str.replace(/[^\d]/g, '').trim();
  const val = parseInt(clean, 10);
  return isNaN(val) ? 0 : val;
}

export function formatRupiah(val: number): string {
  return 'Rp ' + (val || 0).toLocaleString('id-ID');
}

export function formatCompactRupiah(val: number): string {
  if (!val || val === 0) return 'Rp 0';
  if (val >= 1_000_000_000) {
    return 'Rp ' + (val / 1_000_000_000).toFixed(1) + ' M';
  }
  if (val >= 1_000_000) {
    return 'Rp ' + (val / 1_000_000).toFixed(1) + ' Jt';
  }
  if (val >= 1_000) {
    return 'Rp ' + (val / 1_000).toFixed(0) + ' Rb';
  }
  return 'Rp ' + val.toLocaleString('id-ID');
}

export function formatPct(val: number): string {
  return (val || 0).toFixed(1) + '%';
}

export function calculateMonthlyGrade(salesPct: number, fpCount: number, ccVal: number): {
  grade: GradeLevel;
  vibe: string;
  badge: string;
  color: string;
  comment: string;
} {
  if (salesPct >= 150) {
    return {
      grade: 'S+',
      vibe: 'Aura God 🔥',
      badge: 'Insane Carry',
      color: '#10B981',
      comment: 'Sales melesat jauh di atas target! Slaying the target floor dengan aura tak tertandingi.',
    };
  }
  if (salesPct >= 120) {
    return {
      grade: 'S',
      vibe: 'Peak Form ⚡',
      badge: 'Top Performer',
      color: '#06D6A0',
      comment: 'Performa sangat solid & konsisten melampaui KPI dengan margin tinggi.',
    };
  }
  if (salesPct >= 100) {
    return {
      grade: 'A',
      vibe: 'Solid W ✅',
      badge: 'Achieved 100%+',
      color: '#3B82F6',
      comment: 'Target bulanan sukses tercapai! Eksekusi rapi dan stabil.',
    };
  }
  if (salesPct >= 80) {
    return {
      grade: 'B',
      vibe: 'Hampir Tembus ⏳',
      badge: 'Keep Grinding',
      color: '#F59E0B',
      comment: 'Sedikit lagi tembus 100%! Perlu dorongan closing di week terakhir.',
    };
  }
  if (salesPct >= 50) {
    return {
      grade: 'C',
      vibe: 'Low Pace 📉',
      badge: 'Needs Push',
      color: '#FB923C',
      comment: 'Masih di bawah target standar. Perlu strategi bundling dan follow-up prospek.',
    };
  }
  if (salesPct > 0) {
    return {
      grade: 'D',
      vibe: 'Under Target ⚠️',
      badge: 'Needs Comeback',
      color: '#EF4444',
      comment: 'Pencapaian sangat rendah, butuh evaluasi harian dan pendampingan SPV.',
    };
  }
  return {
    grade: 'F',
    vibe: 'AFK / 0% 💤',
    badge: 'Critical Alarm',
    color: '#6B7280',
    comment: 'Tidak ada sales tercatat / data kosong di bulan ini.',
  };
}

export function parseSmtCsv(csvText: string): SmtRecord[] {
  const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: false });
  const rawRows = parsed.data;
  if (!rawRows || rawRows.length < 3) return [];

  // Skip header rows (0 and 1)
  const dataRows = rawRows.slice(2);
  const smtList: SmtRecord[] = [];

  dataRows.forEach((r, idx) => {
    const nip = (r[1] || '').trim();
    const nama = (r[2] || '').trim();
    if (!nip || !nama) return;

    const zone = (r[0] || 'GENERAL').trim();

    const monthly = {} as Record<MonthKey, MonthlyMetric>;
    MONTH_CONFIGS.forEach((m) => {
      const rawSales = (r[m.salesIdx] || '').trim();
      const rawFp = (r[m.fpIdx] || '').trim();
      const rawCc = (r[m.ccIdx] || '').trim();

      const salesPct = parsePercentage(rawSales);
      const fpCount = parseCount(rawFp);
      const ccVal = parseRupiah(rawCc);

      const evaluation = calculateMonthlyGrade(salesPct, fpCount, ccVal);

      monthly[m.key] = {
        monthKey: m.key,
        monthName: m.name,
        monthShort: m.short,
        rawSales: rawSales || '0%',
        salesPct,
        rawFp: rawFp || '0',
        fpCount,
        rawCc: rawCc || 'Rp0',
        ccVal,
        grade: evaluation.grade,
        vibe: evaluation.vibe,
        badge: evaluation.badge,
        color: evaluation.color,
        isAchieved: salesPct >= 100,
        comment: evaluation.comment,
      };
    });

    const rawYtdSales = (r[31] || '').trim();
    const rawYtdPolis = (r[32] || '').trim();
    const rawYtdComser = (r[33] || '').trim();

    const ytdSalesPct = parsePercentage(rawYtdSales);
    const ytdPolisCount = parseCount(rawYtdPolis);
    const ytdComserVal = parseRupiah(rawYtdComser);

    const salesAchCount = parseCount(r[34]);
    const furniproAchCount = parseCount(r[35]);
    const commserAchCount = parseCount(r[36]);
    const evaluationResult = (r[37] || 'SMT DALAM PANTAUAN').trim();

    // Determine overall grade
    let overallGrade: GradeLevel = 'C';
    if (ytdSalesPct >= 150) overallGrade = 'S+';
    else if (ytdSalesPct >= 120) overallGrade = 'S';
    else if (ytdSalesPct >= 100) overallGrade = 'A';
    else if (ytdSalesPct >= 80) overallGrade = 'B';
    else if (ytdSalesPct >= 50) overallGrade = 'C';
    else if (ytdSalesPct > 0) overallGrade = 'D';
    else overallGrade = 'F';

    // Gen-Z Vibe Tag & Aura Score
    const auraScore = Math.min(
      99999,
      Math.max(
        100,
        Math.round(ytdSalesPct * 350 + ytdPolisCount * 120 + ytdComserVal / 100000)
      )
    );

    let genzTag = 'Main Character';
    let genzTagline = 'Slaying the Alsut floor';

    if (evaluationResult.includes('Best Performer')) {
      genzTag = '👑 THE FINAL BOSS / S-TIER GOAT';
      genzTagline = 'Aura +999999 • Absolute Legend Alsuters';
    } else if (evaluationResult.includes('Safe')) {
      genzTag = '✨ CERTIFIED PRO / A-TIER';
      genzTagline = 'Consistent W • Safe & Secure Performance';
    } else if (evaluationResult.includes('Warning Comser')) {
      genzTag = '⚡ SALES ON FIRE (Need Comser Boost)';
      genzTagline = 'Sales udah cakep, push Clean & Care yuk!';
    } else if (evaluationResult.includes('Warning FP')) {
      genzTag = '🛡️ POLIS DEFENDER (Need FP Focus)';
      genzTagline = 'Tingkatkan Furnipro biar makin GG!';
    } else if (evaluationResult.includes('Warning All Derivative')) {
      genzTag = '⚠️ ALL-ROUNDER ALERT (Derivative Check)';
      genzTagline = 'Sales mantap tapi turunan FP & Comser perlu di-gas!';
    } else {
      genzTag = '🚨 PANTAUAN KHUSUS (Needs Comeback)';
      genzTagline = 'Saatnya gaspol bounce back di bulan berikutnya!';
    }

    smtList.push({
      id: `${nip}-${idx}`,
      nip,
      nama,
      zone,
      monthly,
      ytd: {
        rawSales: rawYtdSales || `${ytdSalesPct}%`,
        salesPct: ytdSalesPct,
        rawPolis: rawYtdPolis || `${ytdPolisCount}`,
        polisCount: ytdPolisCount,
        rawComser: rawYtdComser || formatRupiah(ytdComserVal),
        comserVal: ytdComserVal,
        salesAchCount,
        furniproAchCount,
        commserAchCount,
        evaluationResult,
        auraScore,
        genzTag,
        genzTagline,
        overallGrade,
        rank: 0,
      },
    });
  });

  // Calculate Overall YTD Ranks
  smtList.sort((a, b) => b.ytd.salesPct - a.ytd.salesPct);
  smtList.forEach((smt, index) => {
    smt.ytd.rank = index + 1;
  });

  // Calculate Month-by-Month Ranks
  MONTH_CONFIGS.forEach((m) => {
    const sortedByMonth = [...smtList].sort(
      (a, b) => b.monthly[m.key].salesPct - a.monthly[m.key].salesPct
    );
    sortedByMonth.forEach((smt, rIdx) => {
      // update reference
      const original = smtList.find((s) => s.id === smt.id);
      if (original) {
        original.monthly[m.key].rankInMonth = rIdx + 1;
      }
    });
  });

  return smtList;
}

export function computeZoneSummaries(smtList: SmtRecord[]): ZoneSummary[] {
  const zonesMap = new Map<string, SmtRecord[]>();

  smtList.forEach((smt) => {
    const list = zonesMap.get(smt.zone) || [];
    list.push(smt);
    zonesMap.set(smt.zone, list);
  });

  const summaries: ZoneSummary[] = [];

  zonesMap.forEach((members, zoneName) => {
    const memberCount = members.length;
    const totalSalesSum = members.reduce((sum, m) => sum + m.ytd.salesPct, 0);
    const avgSalesPct = Number((totalSalesSum / (memberCount || 1)).toFixed(2));
    const totalPolis = members.reduce((sum, m) => sum + m.ytd.polisCount, 0);
    const totalComser = members.reduce((sum, m) => sum + m.ytd.comserVal, 0);

    const bestPerformerCount = members.filter((m) =>
      m.ytd.evaluationResult.includes('Best Performer')
    ).length;
    const safeCount = members.filter((m) =>
      m.ytd.evaluationResult.includes('Safe')
    ).length;
    const warningCount = members.filter((m) =>
      m.ytd.evaluationResult.includes('Warning')
    ).length;
    const pantauanCount = members.filter((m) =>
      m.ytd.evaluationResult.includes('PANTAUAN')
    ).length;

    const topMember = [...members].sort((a, b) => b.ytd.salesPct - a.ytd.salesPct)[0];

    summaries.push({
      zoneName,
      memberCount,
      avgSalesPct,
      totalPolis,
      totalComser,
      bestPerformerCount,
      safeCount,
      warningCount,
      pantauanCount,
      topSmt: topMember ? `${topMember.nama} (${topMember.ytd.salesPct}%)` : '-',
    });
  });

  return summaries.sort((a, b) => b.avgSalesPct - a.avgSalesPct);
}
