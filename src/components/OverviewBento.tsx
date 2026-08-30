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

  // Compute Store-wide Monthly Average Sales Productivity (Jan - Jul)
  const monthlyAverages = MONTH_CONFIGS.map((m) => {
    const validSmts = smtList.filter((s) => s.monthly[m.key] && s.monthly[m.key].salesPct > 0);
    const avg = validSmts.length > 0 
      ? validSmts.reduce((acc, s) => acc + s.monthly[m.key].salesPct, 0) / validSmts.length
      : 0;
    const achievedCount = smtList.filter((s) => s.monthly[m.key]?.isAchieved).length;
    return {
      ...m,
      avgSalesPct: avg,
      achievedCount,
      achievedPct: totalSmt > 0 ? (achievedCount / totalSmt) * 100 : 0,
    };
  });

  const overallMonthlyAvg =
    monthlyAverages.reduce((sum, m) => sum + m.avgSalesPct, 0) / (monthlyAverages.length || 1);

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

        {/* Card 2: 📈 Average Jualan SMT per Bulan (Produktifitas SMT) (Span 4) */}
        <div className="lg:col-span-4 bg-white border-3 border-black rounded-3xl p-5 bento-shadow relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="bg-[#FF3E83] text-white px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider border border-black shadow-[1px_1px_0px_0px_#000] flex items-center gap-1">
                <BarChart3 className="w-3 h-3" /> Produktifitas SMT
              </span>
              <span className="text-[10px] font-black bg-black text-[#FFE600] px-2 py-0.5 rounded-md">
                7 Bulan S1
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-2 mt-1">
              <div>
                <p className="text-[10px] font-bold uppercase text-gray-500">Rata-rata Sales / Bulan</p>
                <h3 className="text-3xl sm:text-4xl font-black font-display text-black tracking-tight leading-none mt-0.5">
                  {formatPct(overallMonthlyAvg)}
                </h3>
              </div>
              <div className="text-right">
                <span className="inline-block text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-400 px-2 py-0.5 rounded-lg">
                  Peak: {highestMonth ? `${highestMonth.short} (${formatPct(highestMonth.avgSalesPct)})` : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Mini Bar Indicators (JAN - JUL) */}
          <div className="mt-3 pt-2.5 border-t-2 border-gray-200">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 mb-1.5">
              <span>Trend Produktifitas SMT:</span>
              <span className="text-black font-black">Store Avg/Bulan</span>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {monthlyAverages.map((m) => {
                const isOver100 = m.avgSalesPct >= 100;
                return (
                  <div
                    key={m.key}
                    title={`${m.name}: Rata-rata SMT ${formatPct(m.avgSalesPct)} (${m.achievedCount}/${totalSmt} SMT Lolos Target)`}
                    className="flex flex-col items-center bg-gray-50 border border-black/40 rounded-xl p-1 text-center hover:bg-yellow-50 transition-colors"
                  >
                    <span className="text-[9px] font-black text-gray-500 leading-none">
                      {m.short}
                    </span>
                    <span className={`text-[10px] font-black leading-tight my-0.5 ${
                      m.avgSalesPct >= 120 ? 'text-emerald-700' : isOver100 ? 'text-blue-700' : 'text-amber-700'
                    }`}>
                      {Math.round(m.avgSalesPct)}%
                    </span>
                    <span className={`text-[8px] font-black px-1 py-0.2 rounded leading-none ${
                      isOver100 ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                    }`}>
                      {m.achievedCount}👥
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-2 text-[10px] font-extrabold text-gray-500 flex items-center justify-between">
            <span>Standar Target: 100%</span>
            <span className="text-black font-black">7 Bulan Terhitung ✨</span>
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
