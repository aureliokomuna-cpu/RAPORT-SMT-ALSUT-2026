import React from 'react';
import { 
  Trophy, 
  Crown, 
  Sparkles, 
  Flame, 
  Medal, 
  TrendingUp, 
  ArrowRight,
  Shield,
  Star
} from 'lucide-react';
import { SmtRecord } from '../types';
import { formatCompactRupiah, formatPct } from '../utils/parser';

interface LeaderboardPodiumProps {
  smtList: SmtRecord[];
  onSelectSmt: (smt: SmtRecord) => void;
}

export const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({
  smtList,
  onSelectSmt,
}) => {
  const topSmts = [...smtList].sort((a, b) => b.ytd.salesPct - a.ytd.salesPct);
  const first = topSmts[0];
  const second = topSmts[1];
  const third = topSmts[2];
  const restOfTop10 = topSmts.slice(3, 15);

  return (
    <section className="space-y-6">
      
      {/* Title Bento */}
      <div className="bg-black text-white border-3 border-black rounded-3xl p-5 sm:p-6 bento-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#FFE600] text-black text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Top SMT Podium
            </span>
            <span className="text-xs font-bold text-gray-400">Semester 1 YTD 2026</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black font-display text-white uppercase mt-2">
            Alsuters <span className="text-[#FFE600]">Hall of Fame</span> 🏆
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 font-medium mt-1">
            Daftar SMT dengan capaian sales dan kontribusi produk turunan tertinggi se-Store Alsut.
          </p>
        </div>

        <div className="bg-white/10 border-2 border-white/30 rounded-2xl p-3 text-center sm:min-w-[140px]">
          <span className="text-[10px] font-bold uppercase text-gray-300">Total Contenders</span>
          <p className="text-2xl sm:text-3xl font-black font-display text-[#FFE600]">
            {smtList.length} SMT
          </p>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-end pt-4">
        
        {/* 2nd Place (Silver) */}
        {second && (
          <div
            onClick={() => onSelectSmt(second)}
            className="order-2 md:order-1 bg-white border-3 border-black rounded-3xl p-5 bento-shadow bento-shadow-hover cursor-pointer relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="w-10 h-10 rounded-2xl bg-slate-200 border-2 border-black flex items-center justify-center font-black text-lg shadow-[2px_2px_0px_0px_#000]">
                🥈
              </span>
              <span className="text-xs font-black bg-slate-200 text-black px-2.5 py-1 rounded-lg border border-black">
                Runner-Up #2
              </span>
            </div>

            <div>
              <span className="text-xs font-black text-gray-500 uppercase">{second.zone}</span>
              <h3 className="text-xl font-black font-display text-black truncate mt-0.5">
                {second.nama}
              </h3>
              <p className="text-xs font-mono text-gray-500">NIP: {second.nip}</p>
            </div>

            <div className="mt-4 bg-[#F4F5F8] border-2 border-black rounded-2xl p-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase">YTD Sales Ach:</span>
              <p className="text-3xl font-black font-display text-emerald-600 leading-none mt-0.5">
                {second.ytd.rawSales}
              </p>
              <div className="mt-2 text-xs font-bold text-gray-700 flex justify-between border-t border-gray-300 pt-1.5">
                <span>🛡️ {second.ytd.polisCount} Polis</span>
                <span>🫧 {formatCompactRupiah(second.ytd.comserVal)}</span>
              </div>
            </div>
            
            <div className="mt-3 text-xs font-black text-center text-indigo-700">
              Lihat Raport Lengkap →
            </div>
          </div>
        )}

        {/* 1st Place (Gold Champion) */}
        {first && (
          <div
            onClick={() => onSelectSmt(first)}
            className="order-1 md:order-2 bg-[#FFE600] border-4 border-black rounded-3xl p-6 bento-shadow-lg bento-shadow-hover cursor-pointer relative overflow-hidden flex flex-col justify-between md:-translate-y-4"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-12 h-12 rounded-2xl bg-black text-[#FFE600] border-2 border-black flex items-center justify-center font-black text-2xl shadow-[3px_3px_0px_0px_#000]">
                  👑
                </span>
                <span className="bg-black text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  Juara 1 MVP
                </span>
              </div>
              <span className="text-xs font-black bg-white text-black px-3 py-1 rounded-xl border-2 border-black">
                Grade {first.ytd.overallGrade}
              </span>
            </div>

            <div>
              <span className="text-xs font-black text-black/70 uppercase tracking-wider">{first.zone}</span>
              <h3 className="text-2xl sm:text-3xl font-black font-display text-black uppercase truncate mt-0.5">
                {first.nama}
              </h3>
              <p className="text-xs font-bold text-black/70 mt-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                <span>{first.ytd.genzTag}</span>
              </p>
            </div>

            <div className="mt-4 bg-white border-3 border-black rounded-2xl p-4 shadow-[2px_2px_0px_0px_#000]">
              <span className="text-[10px] font-black uppercase text-gray-500">Peak Performance Sales</span>
              <p className="text-4xl font-black font-display text-emerald-600 leading-tight">
                {first.ytd.rawSales}
              </p>
              <div className="mt-2 text-xs font-black text-black flex justify-between border-t-2 border-black/10 pt-2">
                <span>🛡️ {first.ytd.polisCount} Polis FP</span>
                <span>🫧 {first.ytd.rawComser}</span>
              </div>
            </div>

            <div className="mt-3 py-2 bg-black text-white text-center rounded-xl font-black text-xs uppercase tracking-wider">
              Buka Raport Sang Juara 🏆
            </div>
          </div>
        )}

        {/* 3rd Place (Bronze) */}
        {third && (
          <div
            onClick={() => onSelectSmt(third)}
            className="order-3 bg-white border-3 border-black rounded-3xl p-5 bento-shadow bento-shadow-hover cursor-pointer relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-100 border-2 border-black flex items-center justify-center font-black text-lg shadow-[2px_2px_0px_0px_#000]">
                🥉
              </span>
              <span className="text-xs font-black bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg border border-black">
                Top #3 SMT
              </span>
            </div>

            <div>
              <span className="text-xs font-black text-gray-500 uppercase">{third.zone}</span>
              <h3 className="text-xl font-black font-display text-black truncate mt-0.5">
                {third.nama}
              </h3>
              <p className="text-xs font-mono text-gray-500">NIP: {third.nip}</p>
            </div>

            <div className="mt-4 bg-[#F4F5F8] border-2 border-black rounded-2xl p-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase">YTD Sales Ach:</span>
              <p className="text-3xl font-black font-display text-emerald-600 leading-none mt-0.5">
                {third.ytd.rawSales}
              </p>
              <div className="mt-2 text-xs font-bold text-gray-700 flex justify-between border-t border-gray-300 pt-1.5">
                <span>🛡️ {third.ytd.polisCount} Polis</span>
                <span>🫧 {formatCompactRupiah(third.ytd.comserVal)}</span>
              </div>
            </div>

            <div className="mt-3 text-xs font-black text-center text-indigo-700">
              Lihat Raport Lengkap →
            </div>
          </div>
        )}

      </div>

      {/* Ranks 4 to 15 Leaderboard Table */}
      <div className="bg-white border-3 border-black rounded-3xl p-5 bento-shadow">
        <h3 className="text-lg sm:text-xl font-black font-display text-black uppercase mb-4">
          Top 4 - 15 SMT Rank List
        </h3>

        <div className="divide-y-2 divide-gray-200">
          {restOfTop10.map((s) => (
            <div
              key={s.id}
              onClick={() => onSelectSmt(s)}
              className="py-3 px-3 hover:bg-yellow-50 rounded-2xl transition-colors cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-black text-white font-black text-xs flex items-center justify-center">
                  #{s.ytd.rank}
                </span>
                <div>
                  <h4 className="text-sm sm:text-base font-black font-display text-black">
                    {s.nama}
                  </h4>
                  <span className="text-[11px] font-semibold text-gray-500">
                    {s.zone} • NIP: {s.nip}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-base sm:text-lg font-black font-display text-emerald-600 block leading-none">
                    {s.ytd.rawSales}
                  </span>
                  <span className="text-[11px] font-bold text-gray-600">
                    {s.ytd.polisCount} FP • {formatCompactRupiah(s.ytd.comserVal)}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
};
