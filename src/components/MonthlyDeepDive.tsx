import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Trophy, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  Filter
} from 'lucide-react';
import { MonthKey, SmtRecord } from '../types';
import { formatCompactRupiah, formatPct, MONTH_CONFIGS } from '../utils/parser';
import { matchesSmtSearch } from '../utils/searchHelper';

interface MonthlyDeepDiveProps {
  smtList: SmtRecord[];
  onSelectSmt: (smt: SmtRecord) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const MonthlyDeepDive: React.FC<MonthlyDeepDiveProps> = ({
  smtList,
  onSelectSmt,
  searchQuery = '',
  onSearchChange,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<MonthKey>('jul');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const effectiveSearch = searchQuery || localSearch;

  const currentMonthConfig = MONTH_CONFIGS.find((m) => m.key === selectedMonth) || MONTH_CONFIGS[6];

  // Filter SMTs
  const filteredSmts = smtList
    .filter((s) => {
      const matchZone = zoneFilter === 'ALL' || s.zone === zoneFilter;
      const matchSearch = matchesSmtSearch(s, effectiveSearch);
      return matchZone && matchSearch;
    })
    .sort((a, b) => b.monthly[selectedMonth].salesPct - a.monthly[selectedMonth].salesPct);

  // Month Statistics
  const totalInCohort = smtList.length;
  const achievedInMonth = smtList.filter((s) => s.monthly[selectedMonth].isAchieved).length;
  const achieveRate = ((achievedInMonth / (totalInCohort || 1)) * 100).toFixed(0);

  const avgSalesInMonth =
    smtList.reduce((sum, s) => sum + s.monthly[selectedMonth].salesPct, 0) / (totalInCohort || 1);
  const totalFpInMonth = smtList.reduce((sum, s) => sum + s.monthly[selectedMonth].fpCount, 0);
  const totalCcInMonth = smtList.reduce((sum, s) => sum + s.monthly[selectedMonth].ccVal, 0);

  // Grade Counts
  const gradeCounts = {
    'S+': smtList.filter((s) => s.monthly[selectedMonth].grade === 'S+').length,
    'S': smtList.filter((s) => s.monthly[selectedMonth].grade === 'S').length,
    'A': smtList.filter((s) => s.monthly[selectedMonth].grade === 'A').length,
    'B': smtList.filter((s) => s.monthly[selectedMonth].grade === 'B').length,
    'C': smtList.filter((s) => s.monthly[selectedMonth].grade === 'C').length,
    'D': smtList.filter((s) => s.monthly[selectedMonth].grade === 'D').length,
    'F': smtList.filter((s) => s.monthly[selectedMonth].grade === 'F').length,
  };

  // Top 3 SMT of this month
  const top3InMonth = [...smtList]
    .sort((a, b) => b.monthly[selectedMonth].salesPct - a.monthly[selectedMonth].salesPct)
    .slice(0, 3);

  const getGradeBg = (grade: string) => {
    switch (grade) {
      case 'S+': return 'bg-emerald-400 text-black border-black';
      case 'S': return 'bg-[#06D6A0] text-black border-black';
      case 'A': return 'bg-[#3B82F6] text-white border-black';
      case 'B': return 'bg-[#FFD166] text-black border-black';
      case 'C': return 'bg-[#FB923C] text-black border-black';
      case 'D': return 'bg-[#EF4444] text-white border-black';
      default: return 'bg-gray-300 text-black border-black';
    }
  };

  const zones = Array.from(new Set(smtList.map((s) => s.zone)));

  return (
    <section className="space-y-6">
      
      {/* Month Tabs Bar Bento */}
      <div className="bg-white border-3 border-black rounded-3xl p-4 sm:p-5 bento-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <span className="bg-[#FF3E83] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-black tracking-wider">
              Semester 1 • Evaluasi Bulanan
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-display text-black uppercase mt-1">
              Penilaian Akhir Tiap Bulan SMT
            </h2>
          </div>
          <span className="text-xs font-bold text-gray-500">
            Pilih bulan untuk melihat rapor detail performa & evaluasi
          </span>
        </div>

        {/* Month Pills */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {MONTH_CONFIGS.map((m) => {
            const isSelected = selectedMonth === m.key;
            return (
              <button
                key={m.key}
                id={`month-tab-${m.key}`}
                onClick={() => setSelectedMonth(m.key)}
                className={`py-3 px-2 rounded-2xl border-2 border-black font-display font-black text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#FFE600] text-black shadow-[3px_3px_0px_0px_#000] scale-105'
                    : 'bg-[#F4F5F8] text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="block text-xs uppercase opacity-60 leading-none">Bulan</span>
                <span className="block text-lg sm:text-xl font-black leading-tight mt-0.5">{m.short}</span>
                <span className="block text-[10px] font-bold text-gray-600 truncate mt-0.5">{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Month Highlight Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 sm:gap-4">
        
        {/* Card 1: Month Achievement & Avg (Span 4) */}
        <div className="lg:col-span-4 bg-[#06D6A0] border-3 border-black rounded-3xl p-5 bento-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="bg-black text-white px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase">
                Performa Bulan {currentMonthConfig.name}
              </span>
              <h3 className="text-4xl font-black font-display text-black mt-2">
                {achievedInMonth} <span className="text-xl font-bold">Achieved</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white border-2 border-black flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#000]">
              🎯
            </div>
          </div>

          <div className="mt-4 pt-3 border-t-2 border-black/20 flex items-center justify-between text-xs font-black">
            <span>Rata-rata Sales SMT:</span>
            <span className="bg-black text-[#06D6A0] px-2.5 py-1 rounded-xl text-sm font-black font-display">
              {formatPct(avgSalesInMonth)}
            </span>
          </div>
          <p className="text-[11px] font-bold text-black/80 mt-1">
            {achieveRate}% dari total SMT berhasil mencapai target 100%+
          </p>
        </div>

        {/* Card 2: Derivative in this Month (Span 4) */}
        <div className="lg:col-span-4 bg-white border-3 border-black rounded-3xl p-5 bento-shadow flex flex-col justify-between">
          <div>
            <span className="bg-purple-100 text-purple-900 border border-purple-300 px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase">
              Turunan Bulan {currentMonthConfig.short}
            </span>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-[#F0F2F5] border-2 border-black rounded-2xl p-3 text-center">
                <span className="text-[10px] font-bold uppercase text-gray-500">Furnipro (FP)</span>
                <p className="text-2xl font-black font-display text-indigo-700 mt-0.5">
                  {totalFpInMonth}
                </p>
                <span className="text-[10px] font-bold text-gray-500">Polis</span>
              </div>

              <div className="bg-[#F0F2F5] border-2 border-black rounded-2xl p-3 text-center">
                <span className="text-[10px] font-bold uppercase text-gray-500">Clean & Care</span>
                <p className="text-xl font-black font-display text-emerald-700 mt-0.5 truncate">
                  {formatCompactRupiah(totalCcInMonth)}
                </p>
                <span className="text-[10px] font-bold text-gray-500">Omset</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] font-bold text-gray-600 pt-2 border-t border-gray-200 mt-2 flex items-center justify-between">
            <span>Kontribusi Tim Alsut</span>
            <span className="text-black font-black">Solid 🔥</span>
          </div>
        </div>

        {/* Card 3: Grade Distribution in Month (Span 4) */}
        <div className="lg:col-span-4 bg-[#118AB2] text-white border-3 border-black rounded-3xl p-5 bento-shadow flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-black uppercase tracking-wider opacity-90">
              Distribusi Grade ({currentMonthConfig.short})
            </span>
            <span className="text-lg">📊</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 my-1">
            <div className="bg-white/15 border border-white/30 rounded-xl p-1.5 text-center">
              <span className="text-[10px] font-black text-emerald-300 block">S+ / S</span>
              <span className="text-lg font-black">{gradeCounts['S+'] + gradeCounts['S']}</span>
            </div>
            <div className="bg-white/15 border border-white/30 rounded-xl p-1.5 text-center">
              <span className="text-[10px] font-black text-blue-300 block">Grade A</span>
              <span className="text-lg font-black">{gradeCounts['A']}</span>
            </div>
            <div className="bg-white/15 border border-white/30 rounded-xl p-1.5 text-center">
              <span className="text-[10px] font-black text-amber-300 block">Grade B</span>
              <span className="text-lg font-black">{gradeCounts['B']}</span>
            </div>
            <div className="bg-white/15 border border-white/30 rounded-xl p-1.5 text-center">
              <span className="text-[10px] font-black text-rose-300 block">C / D / F</span>
              <span className="text-lg font-black">{gradeCounts['C'] + gradeCounts['D'] + gradeCounts['F']}</span>
            </div>
          </div>

          <p className="text-[10px] font-bold opacity-75 text-center mt-1">
            Evaluasi otomatis berdasarkan capaian target & derivatif
          </p>
        </div>

      </div>

      {/* Month Top 3 Podium Cards */}
      <div className="bg-[#FFE600] border-3 border-black rounded-3xl p-5 bento-shadow">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">👑</span>
          <h3 className="text-lg sm:text-xl font-black font-display text-black uppercase">
            Top 3 SMT of the Month ({currentMonthConfig.name})
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {top3InMonth.map((s, idx) => {
            const data = s.monthly[selectedMonth];
            return (
              <div
                key={s.id}
                onClick={() => onSelectSmt(s)}
                className="bg-white border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_0px_#000] bento-shadow-hover cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-black text-white font-black text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                    <span>Juara #{idx + 1}</span>
                  </span>
                  <span className="text-xs font-black bg-[#FFE600] px-2 py-0.5 rounded-md border border-black">
                    Grade {data.grade}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-black font-display text-black truncate">
                    {s.nama}
                  </h4>
                  <p className="text-xs font-bold text-gray-500">{s.zone} • NIP: {s.nip}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Sales Ach:</span>
                    <p className="text-xl font-black font-display text-emerald-600 leading-none">
                      {data.rawSales}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Derivatif:</span>
                    <p className="text-xs font-black text-black">
                      {data.fpCount} FP • {formatCompactRupiah(data.ccVal)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SMT Monthly Evaluation Table / Cards */}
      <div className="bg-white border-3 border-black rounded-3xl p-5 bento-shadow">
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b-2 border-gray-200">
          <div>
            <h3 className="text-lg font-black font-display text-black uppercase">
              Daftar Evaluasi SMT Bulan {currentMonthConfig.name}
            </h3>
            <p className="text-xs font-bold text-gray-500">
              Menampilkan {filteredSmts.length} SMT terurut berdasarkan capaian sales bulan ini
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="bg-white border-2 border-black rounded-xl px-3 py-1.5 text-xs font-black text-black cursor-pointer shadow-[2px_2px_0px_0px_#000]"
            >
              <option value="ALL">Semua Zona</option>
              {zones.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>

            <input
              type="text"
              value={effectiveSearch}
              onChange={(e) => {
                const val = e.target.value;
                setLocalSearch(val);
                if (onSearchChange) onSearchChange(val);
              }}
              placeholder="Cari NIP / Nama SMT..."
              className="bg-white border-2 border-black rounded-xl px-3 py-1.5 text-xs font-semibold placeholder:text-gray-400 focus:outline-none shadow-[2px_2px_0px_0px_#000]"
            />
          </div>
        </div>

        {/* List of SMTs in this Month */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredSmts.map((s, idx) => {
            const data = s.monthly[selectedMonth];
            return (
              <div
                key={s.id}
                onClick={() => onSelectSmt(s)}
                className="bg-[#F8F9FA] border-2 border-black rounded-2xl p-4 shadow-[2px_2px_0px_0px_#000] bento-shadow-hover cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-lg bg-black text-white font-black text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-black text-gray-700 bg-white border border-black/40 px-2 py-0.5 rounded-md truncate max-w-[130px]">
                        {s.zone}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000] ${getGradeBg(
                        data.grade
                      )}`}
                    >
                      Grade {data.grade}
                    </span>
                  </div>

                  <h4 className="text-base font-black font-display text-black truncate">
                    {s.nama}
                  </h4>
                  <span className="text-[11px] font-mono text-gray-500">NIP: {s.nip}</span>

                  <div className="bg-white border border-black rounded-xl p-2.5 my-2.5 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-500">Sales Achievement:</span>
                      <span className="font-black text-sm text-black">
                        {data.rawSales}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-500">Furnipro:</span>
                      <span className="font-black text-indigo-700">
                        {data.fpCount} Polis
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-500">Clean & Care:</span>
                      <span className="font-black text-teal-700">
                        {formatCompactRupiah(data.ccVal)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-purple-700 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded-md">
                      {data.vibe}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-gray-700 italic bg-gray-200/70 p-1.5 rounded-lg">
                    "{data.comment}"
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </section>
  );
};
