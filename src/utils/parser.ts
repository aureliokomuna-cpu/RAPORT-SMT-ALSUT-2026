import Papa from 'papaparse';
import { GradeLevel, MonthConfig, MonthKey, MonthlyMetric, SmtRecord, SpRecord, ZoneSummary } from '../types';
import { cleanNip } from './searchHelper';

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

export function parseDateString(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Format typically: '15-06-2026 00:00:00' or '10-07-2026 0:00:00' or '15-06-2026'
  const parts = dateStr.trim().split(' ')[0].split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  return null;
}

export function parseSpCsv(csvText: string): SpRecord[] {
  const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: false });
  const rawRows = parsed.data;
  if (!rawRows || rawRows.length < 2) return [];

  const spList: SpRecord[] = [];
  const now = new Date(2026, 7, 30); // Ref reference date Aug 30, 2026

  // Find header row or scan rows
  let dataStartIndex = 0;
  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (row.some(cell => cell && cell.includes('VLNEmpID'))) {
      dataStartIndex = i + 1;
      break;
    }
  }

  for (let i = dataStartIndex; i < rawRows.length; i++) {
    const r = rawRows[i];
    if (!r || r.length < 3) continue;

    // Col mapping: row can be offset or empty leading cells
    let nip = '';
    let name = '';
    let spType = '';
    let startDateStr = '';
    let expiredDateStr = '';

    // Search for NIP (numeric string) and name
    const validCells = r.map(c => (c || '').trim()).filter(c => c !== '');
    if (validCells.length >= 3) {
      // Look for cell that matches NIP pattern (digits)
      const nipIdx = r.findIndex(c => c && /^\d{4,7}$/.test(c.trim()));
      if (nipIdx !== -1) {
        nip = (r[nipIdx] || '').trim();
        name = (r[nipIdx + 1] || '').trim();
        spType = (r[nipIdx + 2] || '').trim().toUpperCase();
        startDateStr = (r[nipIdx + 3] || '').trim();
        expiredDateStr = (r[nipIdx + 4] || '').trim();
      } else {
        // Fallback positioning
        nip = validCells[0];
        name = validCells[1] || '';
        spType = (validCells[2] || '').toUpperCase();
        startDateStr = validCells[3] || '';
        expiredDateStr = validCells[4] || '';
      }
    }

    if (!nip || !name || !spType || spType.includes('VLNNUM')) continue;
    nip = cleanNip(nip);
    if (!nip) continue;

    const expDate = parseDateString(expiredDateStr);
    let status: 'AKTIF' | 'EXPIRED' = 'AKTIF';
    let remainingDays = 0;

    if (expDate) {
      const diffTime = expDate.getTime() - now.getTime();
      remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      status = remainingDays >= 0 ? 'AKTIF' : 'EXPIRED';
    }

    let spLabel = 'Surat Peringatan 1 (SP 1)';
    if (spType === 'S2' || spType.includes('2')) spLabel = 'Surat Peringatan 2 (SP 2)';
    else if (spType === 'S3' || spType.includes('3')) spLabel = 'Surat Peringatan 3 (SP 3)';

    spList.push({
      id: `sp-${nip}-${spType}-${i}`,
      nip,
      name,
      spType,
      spLabel,
      startDate: startDateStr ? startDateStr.split(' ')[0] : '-',
      expiredDate: expiredDateStr ? expiredDateStr.split(' ')[0] : '-',
      status,
      remainingDays,
      notes: `Catatan disiplin internal periode ${startDateStr.split(' ')[0]} s/d ${expiredDateStr.split(' ')[0]}`,
    });
  }

  return spList;
}

export function mergeSmtWithSp(smtList: SmtRecord[], spList: SpRecord[]): SmtRecord[] {
  const spMap = new Map<string, SpRecord[]>();

  spList.forEach(sp => {
    const list = spMap.get(sp.nip) || [];
    list.push(sp);
    spMap.set(sp.nip, list);
  });

  return smtList.map(smt => {
    // Find matching SP by NIP or normalized name
    let matchedSps = spMap.get(smt.nip) || [];
    if (matchedSps.length === 0) {
      const normName = smt.nama.toLowerCase().replace(/[^a-z]/g, '');
      const foundBySpName = spList.filter(sp => {
        const normSpName = sp.name.toLowerCase().replace(/[^a-z]/g, '');
        return normSpName.includes(normName) || normName.includes(normSpName);
      });
      if (foundBySpName.length > 0) {
        matchedSps = foundBySpName;
      }
    }

    // Attach zone info to SP record
    matchedSps = matchedSps.map(sp => ({ ...sp, zone: smt.zone }));

    const activeSps = matchedSps.filter(sp => sp.status === 'AKTIF');
    const hasActiveSp = activeSps.length > 0;
    const latestSp = matchedSps.length > 0 ? matchedSps[matchedSps.length - 1] : undefined;

    return {
      ...smt,
      spList: matchedSps,
      hasActiveSp,
      activeSpCount: activeSps.length,
      latestSp,
    };
  });
}

export function parseSmtCsv(csvText: string, spRecords: SpRecord[] = []): SmtRecord[] {
  const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: false });
  const rawRows = parsed.data;
  if (!rawRows || rawRows.length < 3) return [];

  // Skip header rows (0 and 1)
  const dataRows = rawRows.slice(2);
  const smtList: SmtRecord[] = [];

  dataRows.forEach((r, idx) => {
    const nip = cleanNip(r[1]);
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
      spList: [],
      hasActiveSp: false,
      activeSpCount: 0,
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
      const original = smtList.find((s) => s.id === smt.id);
      if (original) {
        original.monthly[m.key].rankInMonth = rIdx + 1;
      }
    });
  });

  if (spRecords.length > 0) {
    return mergeSmtWithSp(smtList, spRecords);
  }

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
    const spCount = members.filter((m) => m.hasActiveSp || (m.spList && m.spList.length > 0)).length;

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
      spCount,
      topSmt: topMember ? `${topMember.nama} (${topMember.ytd.salesPct}%)` : '-',
    });
  });

  return summaries.sort((a, b) => b.avgSalesPct - a.avgSalesPct);
}

