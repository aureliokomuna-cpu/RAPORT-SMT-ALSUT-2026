import React from 'react';
import { 
  Trophy, 
  Flame, 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  TrendingUp, 
  Award,
  CircleDollarSign,
  FileCheck,
  BarChart3,
  CalendarCheck
} from 'lucide-react';
import { SmtRecord, ZoneSummary } from '../types';
import { formatCompactRupiah, formatPct, MONTH_CONFIGS } from '../utils/parser';

interface OverviewBentoProps {
  smtList: SmtRecord[];
  zoneSummaries: ZoneSummary[];
  onSelectSmt: (smt: SmtRecord) => void;
}

export const OverviewBento: React.FC<OverviewBentoProps> = ({
  smtList,
  zoneSummaries,
  onSelectSmt,
}) => {
  if (!smtList.length) return null;

  const totalSmt = smtList.length;
  const bestPerformers = smtList.filter((s) =>
    s.ytd.evaluationResult.includes('Best Performer')
  );
  const safeSmts = smtList.filter((s) => s.ytd.evaluationResult.includes('Safe'));
  const warningSmts = smtList.filter((s) =>
    s.ytd.evaluationResult.includes('Warning')
  );
  const pantauanSmts = smtList.filter((s) =>
    s.ytd.evaluationResult.includes('PANTAUAN')
  );

  const avgSales =
    smtList.reduce((sum, s) => sum + s.ytd.salesPct, 0) / (totalSmt || 1);
  const totalPolis = smtList.reduce((sum, s) => sum + s.ytd.polisCount, 0);
  const totalComser = smtList.reduce((sum, s) => sum + s.ytd.comserVal, 0);

  // Compute Store-wide Monthly Average Sales Productivity
  const monthlyAverages = MONTH_CONFIGS.map((m) => {
    const validSmts = smtList.filter((s) => s.monthly[m.key] && s.monthly[m.key].salesPct > 0);
    const avgSalesPct = validSmts.length > 0 
      ? validSmts.reduce((acc, s) => acc + s.monthly[m.key].salesPct, 0) / validSmts.length
      : 0;
    const totalFp = smtList.reduce((acc, s) => acc + (s.monthly[m.key]?.fpCount || 0), 0);
    const avgFpPerSmt = totalSmt > 0 ? totalFp / totalSmt : 0;
    const totalCc = smtList.reduce((acc, s) => acc + (s.monthly[m.key]?.ccVal || 0), 0);
    const avgCcPerSmt = totalSmt > 0 ? totalCc / totalSmt : 0;
    const achievedCount = smtList.filter((s) => s.monthly[m.key]?.isAchieved).length;

    return {
      ...m,
      avgSalesPct,
      totalFp,
      avgFpPerSmt,
      totalCc,
      avgCcPerSmt,
      achievedCount,
      achievedPct: totalSmt > 0 ? (achievedCount / totalSmt) * 100 : 0,
    };
  });

  const monthsCount = monthlyAverages.length || 1;
  const overallMonthlyAvgSales =
    monthlyAverages.reduce((sum, m) => sum + m.avgSalesPct, 0) / monthsCount;
  const overallMonthlyAvgFpPerSmt =
    monthlyAverages.reduce((sum, m) => sum + m.avgFpPerSmt, 0) / monthsCount;
  const overallMonthlyAvgCcPerSmt =
    monthlyAverages.reduce((sum, m) => sum + m.avgCcPerSmt, 0) / monthsCount;
  const overallMonthlyTotalFp =
    monthlyAverages.reduce((sum, m) => sum + m.totalFp, 0) / monthsCount;
  const overallMonthlyTotalCc =
    monthlyAverages.reduce((sum, m) => sum + m.totalCc, 0) / monthsCount;

  const highestMonth = [...monthlyAverages].sort((a, b) => b.avgSalesPct - a.avgSalesPct)[0];

  const topZone = zoneSummaries[0];

  return (
    <section className="mb-6">
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 sm:gap-4">
        
        {/* Card 1: Total SMT & Store Overview (Span 4) */}
        <div className="lg:col-span-4 bg-[#FFE600] border-3 border-black rounded-3xl p-5 bento-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="inline-block bg-black text-white px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider mb-2">
                Alsut Squad 2026
              </span>
              <h2 className="text-4xl sm:text-5xl font-black font-display tracking-tight text-black">
                {totalSmt} <span className="text-xl sm:text-2xl font-bold">SMT</span>
              </h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white border-2 border-black flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#000]">
              👥
            </div>
          </div>

          <div className="mt-4 pt-3 border-t-2 border-black/20 flex items-center justify-between text-xs font-black">
            <span className="flex items-center gap-1 text-black/80">
              <Zap className="w-3.5 h-3.5 text-black" /> Store Avg YTD:
            </span>
            <span className="bg-black text-[#FFE600] px-2.5 py-1 rounded-lg font-black text-sm">
              {formatPct(avgSales)}
            </span>
          </div>
          <div className="absolute -right-6 -bottom-6 opacity-10 text-9xl pointer-events-none select-none font-black">
            ⚡
          </div>
        </div>

        {/* Card 2: 📈 Overall SMT Productivity (Clean Overall Value & % Overview) (Span 4) */}
        <div className="lg:col-span-4 bg-white border-3 border-black rounded-3xl p-5 bento-shadow relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="bg-[#FF3E83] text-white px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider border border-black shadow-[1px_1px_0px_0px_#000] flex items-center gap-1">
                <BarChart3 className="w-3 h-3" /> Produktifitas Rata-Rata SMT
              </span>
              <span className="text-[10px] font-black bg-black text-[#FFE600] px-2 py-0.5 rounded-md">
                Overall {MONTH_CONFIGS.length} Bulan
              </span>
            </div>

            {/* Clean Overall Average 3-Metric Display */}
            <div className="grid grid-cols-3 gap-2 mt-3 bg-[#F8F9FA] border-2 border-black rounded-2xl p-3 shadow-[2px_2px_0px_0px_#000]">
              <div>
                <p className="text-[10px] font-black uppercase text-gray-500">Rata Sales</p>
                <h4 className="text-xl sm:text-2xl font-black font-display text-black mt-0.5 leading-tight">
                  {formatPct(overallMonthlyAvgSales)}
                </h4>
                <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded-md inline-block mt-1">
                  Target 100%
                </span>
              </div>

              <div className="border-x-2 border-gray-200 px-2 text-center">
                <p className="text-[10px] font-black uppercase text-gray-500">Rata Polis FP</p>
                <h4 className="text-xl sm:text-2xl font-black font-display text-indigo-700 mt-0.5 leading-tight">
                  {overallMonthlyAvgFpPerSmt.toFixed(1)}
                </h4>
                <span className="text-[9px] font-black text-indigo-900 bg-indigo-100 border border-indigo-300 px-1.5 py-0.2 rounded-md inline-block mt-1">
                  Polis / SMT / bln
                </span>
              </div>

              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-gray-500">Rata Clean&Care</p>
                <h4 className="text-lg sm:text-xl font-black font-display text-emerald-700 mt-0.5 leading-tight truncate">
                  {formatCompactRupiah(overallMonthlyAvgCcPerSmt)}
                </h4>
                <span className="text-[9px] font-black text-emerald-900 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded-md inline-block mt-1">
                  Rp / SMT / bln
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t-2 border-gray-200 flex items-center justify-between text-xs font-bold text-gray-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Store Avg: <strong className="text-indigo-900">{Math.round(overallMonthlyTotalFp)} Polis FP</strong> • <strong className="text-emerald-900">{formatCompactRupiah(overallMonthlyTotalCc)} C&C</strong> / bln
            </span>
            <span className="text-[11px] font-black text-black bg-yellow-200 border border-black px-2 py-0.5 rounded-lg">
              {totalSmt} SMT
            </span>
          </div>
        </div>

        {/* Card 3: Health Breakdown Status (Span 4) */}
        <div className="lg:col-span-4 bg-[#118AB2] text-white border-3 border-black rounded-3xl p-5 bento-shadow flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-black uppercase tracking-wider opacity-90">
              Evaluation Pulse
            </span>
            <span className="text-lg">🎯</span>
          </div>

          <div className="grid grid-cols-2 gap-2 my-1">
            <div className="bg-white/10 backdrop-blur-sm border-2 border-black/40 rounded-xl p-2.5 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#06D6A0] text-black border border-black flex items-center justify-center font-black text-sm shrink-0">
                🏆
              </div>
              <div>
                <p className="text-xs font-bold opacity-80 leading-none">Best Perform</p>
                <p className="text-lg font-black leading-tight mt-0.5">{bestPerformers.length}</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border-2 border-black/40 rounded-xl p-2.5 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FFE600] text-black border border-black flex items-center justify-center font-black text-sm shrink-0">
                ✅
              </div>
              <div>
                <p className="text-xs font-bold opacity-80 leading-none">Safe Zone</p>
                <p className="text-lg font-black leading-tight mt-0.5">{safeSmts.length}</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border-2 border-black/40 rounded-xl p-2.5 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FFD166] text-black border border-black flex items-center justify-center font-black text-sm shrink-0">
                ⚠️
              </div>
              <div>
                <p className="text-xs font-bold opacity-80 leading-none">Warnings</p>
                <p className="text-lg font-black leading-tight mt-0.5">{warningSmts.length}</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border-2 border-black/40 rounded-xl p-2.5 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#EF476F] text-white border border-black flex items-center justify-center font-black text-sm shrink-0">
                🚨
              </div>
              <div>
                <p className="text-xs font-bold opacity-80 leading-none">Pantauan</p>
                <p className="text-lg font-black leading-tight mt-0.5">{pantauanSmts.length}</p>
              </div>
            </div>
          </div>

          <p className="text-[10px] font-bold opacity-75 mt-1 text-center">
            {(( (bestPerformers.length + safeSmts.length) / totalSmt ) * 100).toFixed(0)}% SMT berstatus Hijau / Aman
          </p>
        </div>

        {/* Card 4: Furnipro & Clean Care Derivative Total (Span 6) */}
        <div className="sm:col-span-2 lg:col-span-6 bg-white border-3 border-black rounded-3xl p-5 bento-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#A78BFA] border-2 border-black flex items-center justify-center text-3xl shadow-[3px_3px_0px_0px_#000] shrink-0">
              🛡️
            </div>
            <div>
              <span className="bg-purple-100 text-purple-900 border border-purple-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                Furnipro Protection
              </span>
              <h4 className="text-2xl sm:text-3xl font-black font-display text-black mt-0.5">
                {totalPolis} <span className="text-sm font-bold text-gray-500">Polis YTD</span>
              </h4>
              <p className="text-xs font-semibold text-gray-600">Total perlindungan furnitur tercatat</p>
            </div>
          </div>

          <div className="w-full sm:w-auto sm:border-l-2 sm:border-black/20 sm:pl-6 flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#06D6A0] border-2 border-black flex items-center justify-center text-3xl shadow-[3px_3px_0px_0px_#000] shrink-0">
              🫧
            </div>
            <div>
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                Clean & Care (Comser)
              </span>
              <h4 className="text-xl sm:text-2xl font-black font-display text-black mt-0.5">
                {formatCompactRupiah(totalComser)}
              </h4>
              <p className="text-xs font-semibold text-gray-600">Total omset layanan jasa</p>
            </div>
          </div>
        </div>

        {/* Card 5: Top Performing Zone (Span 6) */}
        {topZone && (
          <div className="sm:col-span-2 lg:col-span-6 bg-[#06D6A0] border-3 border-black rounded-3xl p-5 bento-shadow flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="bg-black text-white px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider">
                👑 Leading Zone SMT
              </span>
              <span className="text-xs font-black bg-white px-2.5 py-1 rounded-lg border-2 border-black shadow-[1px_1px_0px_0px_#000]">
                {topZone.memberCount} SMT Member
              </span>
            </div>

            <div className="my-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <h4 className="text-2xl sm:text-3xl font-black font-display text-black uppercase">
                {topZone.zoneName}
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-black/70">Avg Achievement:</span>
                <span className="text-2xl font-black bg-black text-[#06D6A0] px-3 py-0.5 rounded-xl font-display">
                  {formatPct(topZone.avgSalesPct)}
                </span>
              </div>
            </div>

            <div className="text-xs font-bold text-black/90 pt-2 border-t-2 border-black/20 flex items-center justify-between">
              <span>MVP: {topZone.topSmt}</span>
              <span className="bg-white/80 border border-black px-2 py-0.5 rounded text-[11px]">
                {topZone.bestPerformerCount} Best • {topZone.safeCount} Safe
              </span>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
