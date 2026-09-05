import React, { useState, useMemo } from 'react';
import { 
  TrendingDown, 
  AlertTriangle, 
  ShieldAlert, 
  FileText, 
  Printer, 
  Download, 
  UserCheck, 
  Search, 
  ArrowUpDown, 
  Layers, 
  Calendar, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  HelpCircle,
  BarChart2,
  FileDown,
  LayoutGrid,
  Table as TableIcon,
  ShieldCheck,
  Zap,
  Flame,
  Lightbulb
} from 'lucide-react';
import { SmtRecord } from '../types';
import { formatCompactRupiah, formatPct, MONTH_CONFIGS } from '../utils/parser';
import { matchesSmtSearch } from '../utils/searchHelper';
import { getCoachingRecord, SmtCoachingRecord } from '../utils/coachingStorage';
import { SmtPdfExportModal } from './SmtPdfExportModal';

interface Bottom20ViewProps {
  smtList: SmtRecord[];
  onSelectSmt: (smt: SmtRecord, initialTab?: 'profile' | 'monthly' | 'coaching' | 'sp') => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

type SortBottomBy = 'rank_lowest_first' | 'rank_asc' | 'sales_asc' | 'fp_asc' | 'cc_asc' | 'coaching_needed';

export const Bottom20View: React.FC<Bottom20ViewProps> = ({
  smtList,
  onSelectSmt,
  searchQuery = '',
  onSearchChange,
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortBottomBy>('rank_lowest_first');
  const [displayMode, setDisplayMode] = useState<'card' | 'table'>('card');
  const [selectedPdfSmt, setSelectedPdfSmt] = useState<{ smt: SmtRecord; coaching: SmtCoachingRecord } | null>(null);

  // Get raw 20 lowest rank SMTs based on overall YTD Rank
  // smtList has rank 1 (top) to rank N (bottom)
  const baseBottom20 = useMemo(() => {
    const sorted = [...smtList].sort((a, b) => b.ytd.rank - a.ytd.rank);
    return sorted.slice(0, 20);
  }, [smtList]);

  // Extract zones represented in bottom 20
  const bottomZones = useMemo(() => {
    const set = new Set<string>();
    baseBottom20.forEach(s => {
      if (s.zone) set.add(s.zone);
    });
    return Array.from(set);
  }, [baseBottom20]);

  // Filter & Sort
  const displayedSmts = useMemo(() => {
    let result = [...baseBottom20];

    // Local Search
    const q = localSearch.trim();
    if (q) {
      result = result.filter(s => matchesSmtSearch(s, q));
    }

    // Zone filter
    if (selectedZone !== 'ALL') {
      result = result.filter(s => s.zone === selectedZone);
    }

    // Sorting within Bottom 20
    result.sort((a, b) => {
      const coachingA = getCoachingRecord(a.nip).totalCount;
      const coachingB = getCoachingRecord(b.nip).totalCount;

      switch (sortBy) {
        case 'rank_lowest_first': // e.g. #68, #67, #66...
          return b.ytd.rank - a.ytd.rank;
        case 'rank_asc': // e.g. #49, #50, #51...
          return a.ytd.rank - b.ytd.rank;
        case 'sales_asc': // Lowest sales % first
          return a.ytd.salesPct - b.ytd.salesPct;
        case 'fp_asc': // Lowest Polis Furnipro
          return a.ytd.polisCount - b.ytd.polisCount;
        case 'cc_asc': // Lowest Clean Care
          return a.ytd.comserVal - b.ytd.comserVal;
        case 'coaching_needed': // 0 coaching sessions first
          return coachingA - coachingB;
        default:
          return b.ytd.rank - a.ytd.rank;
      }
    });

    return result;
  }, [baseBottom20, localSearch, selectedZone, sortBy]);

  // Statistics calculation for the 20 Bottom SMTs
  const stats = useMemo(() => {
    const count = baseBottom20.length || 1;
    const avgSales = baseBottom20.reduce((acc, s) => acc + s.ytd.salesPct, 0) / count;
    const totalPolis = baseBottom20.reduce((acc, s) => acc + s.ytd.polisCount, 0);
    const avgPolis = (totalPolis / count).toFixed(1);
    const totalComser = baseBottom20.reduce((acc, s) => acc + s.ytd.comserVal, 0);
    const withActiveSp = baseBottom20.filter(s => s.hasActiveSp).length;
    
    // Check coaching coverage
    let coachedCount = 0;
    baseBottom20.forEach(s => {
      const rec = getCoachingRecord(s.nip);
      if (rec.totalCount > 0 || rec.customLogs.length > 0) {
        coachedCount++;
      }
    });

    const uncoachedCount = baseBottom20.length - coachedCount;

    return {
      avgSales: avgSales.toFixed(1),
      salesGap: (100 - avgSales).toFixed(1),
      totalPolis,
      avgPolis,
      totalComser,
      withActiveSp,
      coachedCount,
      uncoachedCount,
      totalCount: baseBottom20.length,
    };
  }, [baseBottom20]);

  const handleOpenPdfModal = (smt: SmtRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const coaching = getCoachingRecord(smt.nip);
    setSelectedPdfSmt({ smt, coaching });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-black text-white border-3 border-black rounded-3xl p-5 sm:p-6 bento-shadow relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#EF476F] text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider border border-white/20 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5" />
                Daftar Prioritas Supervisi
              </span>
              <span className="bg-[#FFE600] text-black text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                Bottom 20 SMT
              </span>
              <span className="text-xs font-medium text-gray-400">
                Peringkat #{smtList.length - 19} s/d #{smtList.length} dari {smtList.length} SMT Toko
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black font-display text-white uppercase tracking-tight">
              20 SMT <span className="text-[#EF476F]">Rank Terbawah</span> 🔻
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 font-medium max-w-2xl leading-relaxed">
              Daftar 20 SMT dengan peringkat terendah di Living World Alam Sutera (08). Dirancang khusus untuk Store Manager dan Supervisor guna mengidentifikasi kendala transaksi, menyusun jadwal coaching intensif, serta intervensi cepat sebelum tutup buku.
            </p>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
            <div className="bg-white/10 border-2 border-white/20 rounded-2xl p-3 text-center sm:min-w-[150px]">
              <span className="text-[10px] font-black uppercase text-gray-300 tracking-wider">
                Kebutuhan Coaching
              </span>
              <p className="text-2xl sm:text-3xl font-black font-display text-[#FFE600]">
                {stats.uncoachedCount} SMT
              </p>
              <span className="text-[10px] text-gray-400 font-medium">Belum pernah coaching</span>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-white text-black hover:bg-[#FFE600] border-2 border-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#000]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Rekap Supervisi</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Summary Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Metric 1: Avg Sales */}
        <div className="bg-white border-3 border-black rounded-2xl p-4 bento-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
              Rata-rata Sales YTD
            </span>
            <span className="w-7 h-7 rounded-lg bg-red-100 border border-black flex items-center justify-center text-red-600 text-xs">
              📉
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black font-display text-red-600">
              {stats.avgSales}%
            </div>
            <p className="text-[11px] font-bold text-gray-600 mt-0.5">
              Gap ke Target: <span className="text-red-700 font-black">-{stats.salesGap}%</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Furnipro Polis */}
        <div className="bg-white border-3 border-black rounded-2xl p-4 bento-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
              Total Polis FP
            </span>
            <span className="w-7 h-7 rounded-lg bg-blue-100 border border-black flex items-center justify-center text-blue-600 text-xs">
              🛡️
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black font-display text-gray-900">
              {stats.totalPolis} <span className="text-sm font-bold text-gray-500">Polis</span>
            </div>
            <p className="text-[11px] font-bold text-gray-600 mt-0.5">
              Rata-rata: <span className="font-black text-black">{stats.avgPolis} polis / SMT</span>
            </p>
          </div>
        </div>

        {/* Metric 3: Clean & Care */}
        <div className="bg-white border-3 border-black rounded-2xl p-4 bento-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
              Clean & Care (C&C)
            </span>
            <span className="w-7 h-7 rounded-lg bg-amber-100 border border-black flex items-center justify-center text-amber-600 text-xs">
              🧼
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-display text-gray-900 truncate">
              {formatCompactRupiah(stats.totalComser)}
            </div>
            <p className="text-[11px] font-bold text-gray-600 mt-0.5">
              Akumulasi Komersil YTD
            </p>
          </div>
        </div>

        {/* Metric 4: Coaching Status */}
        <div className="bg-white border-3 border-black rounded-2xl p-4 bento-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
              Progres Coaching
            </span>
            <span className="w-7 h-7 rounded-lg bg-emerald-100 border border-black flex items-center justify-center text-emerald-600 text-xs">
              📋
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black font-display text-emerald-600">
              {stats.coachedCount} <span className="text-sm font-bold text-gray-500">/ 20</span>
            </div>
            <p className="text-[11px] font-bold text-gray-600 mt-0.5">
              <span className="text-red-600 font-extrabold">{stats.uncoachedCount} SMT</span> butuh sesi
            </p>
          </div>
        </div>

        {/* Metric 5: Active SP in Bottom 20 */}
        <div className="bg-white border-3 border-black rounded-2xl p-4 bento-shadow flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
              SMT dgn SP Aktif
            </span>
            <span className="w-7 h-7 rounded-lg bg-red-100 border border-black flex items-center justify-center text-red-600 text-xs">
              ⚠️
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black font-display text-[#EF476F]">
              {stats.withActiveSp} <span className="text-sm font-bold text-gray-500">SMT</span>
            </div>
            <p className="text-[11px] font-bold text-gray-600 mt-0.5">
              Memiliki SP1 / SP2 Aktif
            </p>
          </div>
        </div>

      </div>

      {/* 3. Action Guidance Callout for Supervisors */}
      <div className="bg-[#FFFDEB] border-3 border-black rounded-3xl p-5 bento-shadow">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#FFE600] border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#000]">
            <Lightbulb className="w-5 h-5 text-black" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black font-display uppercase tracking-wider text-black">
              Pedoman Supervisi untuk 20 SMT Rank Terbawah
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2 text-xs text-gray-800 font-medium">
              <div className="bg-white border-2 border-black rounded-xl p-3">
                <span className="font-black text-black block mb-0.5">1. Observasi Lantai (Shadowing)</span>
                Dampingi SMT saat menyapa prospek walk-in customer dan amati teknik probing serta negosiasi diskon/promo.
              </div>
              <div className="bg-white border-2 border-black rounded-xl p-3">
                <span className="font-black text-black block mb-0.5">2. Penawaran Derivatif Wajib</span>
                Tekankan setiap penawaran sofa/matras wajib menyertakan garansi Furnipro dan voucher Clean & Care.
              </div>
              <div className="bg-white border-2 border-black rounded-xl p-3">
                <span className="font-black text-black block mb-0.5">3. Dokumentasi Coaching</span>
                Catat komitmen target harian pada log coaching raport agar perkembangan pekanan terpantau transparan.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Controls: Search, Zone Filter, Sorting & Mode */}
      <div className="bg-white border-3 border-black rounded-2xl p-4 bento-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              if (onSearchChange) onSearchChange(e.target.value);
            }}
            placeholder="Cari NIP / Nama dalam Bottom 20..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border-2 border-black rounded-xl text-xs sm:text-sm font-bold placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#EF476F]"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('');
                if (onSearchChange) onSearchChange('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black bg-gray-200 hover:bg-gray-300 w-5 h-5 rounded-full flex items-center justify-center border border-black cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter by Zone & Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Zone Selector */}
          <div className="flex items-center gap-1.5 bg-gray-50 border-2 border-black px-2.5 py-1.5 rounded-xl text-xs font-bold">
            <span className="text-gray-500 text-[11px] font-black uppercase">Zona:</span>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="bg-transparent font-black text-xs uppercase focus:outline-none cursor-pointer"
            >
              <option value="ALL">SEMUA ZONA ({baseBottom20.length})</option>
              {bottomZones.map(z => {
                const countInZone = baseBottom20.filter(s => s.zone === z).length;
                return (
                  <option key={z} value={z}>
                    {z} ({countInZone})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-gray-50 border-2 border-black px-2.5 py-1.5 rounded-xl text-xs font-bold">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBottomBy)}
              className="bg-transparent font-black text-xs uppercase focus:outline-none cursor-pointer"
            >
              <option value="rank_lowest_first">Paling Terbawah Duluan (#{smtList.length} ➔ #{smtList.length - 19})</option>
              <option value="rank_asc">Urutan Rank Menaik (#{smtList.length - 19} ➔ #{smtList.length})</option>
              <option value="sales_asc">Sales % Terendah</option>
              <option value="fp_asc">Polis Furnipro Terendah</option>
              <option value="cc_asc">Clean & Care Terendah</option>
              <option value="coaching_needed">Butuh Coaching Duluan</option>
            </select>
          </div>

          {/* Display Mode: Card vs Table */}
          <div className="flex items-center border-2 border-black rounded-xl overflow-hidden shadow-[2px_2px_0px_0px_#000]">
            <button
              onClick={() => setDisplayMode('card')}
              className={`p-2 transition-colors cursor-pointer ${
                displayMode === 'card' ? 'bg-black text-[#FFE600]' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              title="Mode Grid Card"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDisplayMode('table')}
              className={`p-2 border-l-2 border-black transition-colors cursor-pointer ${
                displayMode === 'table' ? 'bg-black text-[#FFE600]' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              title="Mode Tabel Ringkas"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* 5. Main Content: SMT Cards Grid OR Table */}
      {displayedSmts.length > 0 ? (
        displayMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {displayedSmts.map((smt) => {
              const coaching = getCoachingRecord(smt.nip);
              const hasCoaching = coaching.totalCount > 0 || coaching.customLogs.length > 0;
              const isSevereUnder = smt.ytd.salesPct < 50;

              return (
                <div
                  key={smt.id}
                  onClick={() => onSelectSmt(smt)}
                  className="bg-white border-3 border-black rounded-3xl p-5 bento-shadow bento-shadow-hover cursor-pointer relative flex flex-col justify-between transition-all group"
                >
                  {/* Top Bar: Rank & Badges */}
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {/* Rank Badge */}
                        <span className="w-9 h-9 rounded-2xl bg-black text-[#EF476F] border-2 border-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_0px_#EF476F]">
                          #{smt.ytd.rank}
                        </span>
                        <div>
                          <span className="text-[10px] font-black uppercase text-gray-500 block leading-tight">
                            {smt.zone || 'ZONA TOKO'}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-gray-600">
                            NIP: {smt.nip}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {smt.hasActiveSp && (
                          <span className="bg-[#EF476F] text-white text-[10px] font-black px-2 py-0.5 rounded-lg border border-black animate-pulse flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            {smt.latestSp?.spType || 'SP'}
                          </span>
                        )}
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border border-black ${
                          hasCoaching 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {hasCoaching ? `${coaching.totalCount} Coaching` : 'Perlu Coaching'}
                        </span>
                      </div>
                    </div>

                    {/* SMT Name */}
                    <h3 className="text-lg font-black font-display text-gray-900 group-hover:text-[#EF476F] transition-colors truncate">
                      {smt.nama}
                    </h3>
                    <p className="text-xs font-semibold text-gray-500 italic mt-0.5 line-clamp-1">
                      "{smt.ytd.genzTagline}"
                    </p>
                  </div>

                  {/* Key Metric Blocks */}
                  <div className="mt-4 space-y-2">
                    
                    {/* Sales Ach */}
                    <div className="bg-[#F8F9FA] border-2 border-black rounded-2xl p-2.5 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase text-gray-500 block">Sales YTD</span>
                        <span className="text-xs font-bold text-gray-700">{smt.ytd.rawSales}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xl font-black font-display ${isSevereUnder ? 'text-red-600' : 'text-amber-600'}`}>
                          {formatPct(smt.ytd.salesPct)}
                        </span>
                        <span className="text-[9px] font-bold text-gray-500 block">
                          {smt.ytd.salesAchCount} / {MONTH_CONFIGS.length} Bln Ach
                        </span>
                      </div>
                    </div>

                    {/* Derivative: FP & CC */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#F8F9FA] border-2 border-black rounded-xl p-2">
                        <span className="text-[9px] font-black uppercase text-gray-500 block">Furnipro</span>
                        <span className="text-xs font-black text-blue-700">{smt.ytd.polisCount} Polis</span>
                      </div>
                      <div className="bg-[#F8F9FA] border-2 border-black rounded-xl p-2">
                        <span className="text-[9px] font-black uppercase text-gray-500 block">Clean & Care</span>
                        <span className="text-xs font-black text-amber-700 truncate block">{smt.ytd.rawComser || 'Rp0'}</span>
                      </div>
                    </div>

                  </div>

                  {/* Bottom Action Footer */}
                  <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-300 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSmt(smt, 'coaching');
                      }}
                      className="px-2.5 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-black border border-black rounded-xl text-[11px] font-black uppercase flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <UserCheck className="w-3 h-3 text-amber-700" />
                      <span>Coaching</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleOpenPdfModal(smt, e)}
                        title="Unduh Raport PDF SMT"
                        className="p-1.5 bg-white hover:bg-gray-100 border border-black rounded-xl text-black transition-colors cursor-pointer shadow-[1px_1px_0px_0px_#000]"
                      >
                        <FileDown className="w-3.5 h-3.5 text-blue-600" />
                      </button>

                      <button
                        onClick={() => onSelectSmt(smt)}
                        className="px-3 py-1.5 bg-black hover:bg-[#EF476F] text-white border border-black rounded-xl text-[11px] font-black uppercase flex items-center gap-1 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#FFE600]"
                      >
                        <span>Raport</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          /* Table View Mode */
          <div className="bg-white border-3 border-black rounded-3xl p-4 sm:p-5 bento-shadow overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-black bg-black text-white text-[10px] sm:text-xs font-black uppercase">
                  <th className="p-2.5 text-center rounded-tl-xl">Rank</th>
                  <th className="p-2.5">SMT / NIP</th>
                  <th className="p-2.5">Zona</th>
                  <th className="p-2.5 text-center">Sales % YTD</th>
                  <th className="p-2.5 text-center">Furnipro</th>
                  <th className="p-2.5 text-right">Clean & Care</th>
                  <th className="p-2.5 text-center">Status SP</th>
                  <th className="p-2.5 text-center">Coaching</th>
                  <th className="p-2.5 text-center rounded-tr-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium">
                {displayedSmts.map((smt) => {
                  const coaching = getCoachingRecord(smt.nip);
                  const hasCoaching = coaching.totalCount > 0 || coaching.customLogs.length > 0;

                  return (
                    <tr 
                      key={smt.id}
                      onClick={() => onSelectSmt(smt)}
                      className="hover:bg-yellow-50/60 transition-colors cursor-pointer"
                    >
                      <td className="p-2.5 text-center">
                        <span className="w-7 h-7 inline-flex items-center justify-center rounded-xl bg-black text-[#EF476F] font-black text-xs border border-black shadow-[1px_1px_0px_0px_#EF476F]">
                          #{smt.ytd.rank}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <div className="font-black text-gray-900 text-sm">{smt.nama}</div>
                        <div className="text-[11px] font-mono text-gray-500">NIP: {smt.nip}</div>
                      </td>
                      <td className="p-2.5">
                        <span className="bg-gray-100 text-gray-800 text-[10px] font-black px-2 py-0.5 rounded border border-gray-300 uppercase">
                          {smt.zone}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="text-sm font-black text-red-600">
                          {formatPct(smt.ytd.salesPct)}
                        </span>
                        <div className="text-[10px] text-gray-500">{smt.ytd.rawSales}</div>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="font-black text-blue-700">{smt.ytd.polisCount} Polis</span>
                      </td>
                      <td className="p-2.5 text-right">
                        <span className="font-black text-amber-700">{smt.ytd.rawComser || 'Rp0'}</span>
                      </td>
                      <td className="p-2.5 text-center">
                        {smt.hasActiveSp ? (
                          <span className="bg-[#EF476F] text-white text-[10px] font-black px-2 py-0.5 rounded border border-black">
                            {smt.latestSp?.spType || 'SP Aktif'}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                          hasCoaching 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                            : 'bg-red-50 text-red-700 border-red-300'
                        }`}>
                          {hasCoaching ? `${coaching.totalCount} Sesi` : 'Belum'}
                        </span>
                      </td>
                      <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={(e) => handleOpenPdfModal(smt, e)}
                            title="Unduh PDF Raport"
                            className="p-1.5 bg-white hover:bg-gray-100 border border-black rounded-lg text-black cursor-pointer shadow-[1px_1px_0px_0px_#000]"
                          >
                            <FileDown className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                          <button
                            onClick={() => onSelectSmt(smt)}
                            className="px-2.5 py-1 bg-black text-white hover:bg-[#FFE600] hover:text-black border border-black rounded-lg text-[11px] font-black uppercase cursor-pointer transition-colors"
                          >
                            Raport
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="bg-white border-3 border-black rounded-3xl p-10 bento-shadow text-center">
          <div className="text-5xl mb-3">🔍</div>
          <h3 className="text-xl font-black font-display uppercase">
            Tidak Ada SMT Sesuai Filter
          </h3>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Tidak ada SMT dalam Bottom 20 yang cocok dengan pencarian "{localSearch}" atau zona {selectedZone}.
          </p>
          <button
            onClick={() => {
              setLocalSearch('');
              setSelectedZone('ALL');
              if (onSearchChange) onSearchChange('');
            }}
            className="mt-4 px-4 py-2 bg-black text-white rounded-xl text-xs font-black uppercase cursor-pointer hover:bg-gray-800"
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* Direct PDF Modal */}
      {selectedPdfSmt && (
        <SmtPdfExportModal
          smt={selectedPdfSmt.smt}
          coachingData={selectedPdfSmt.coaching}
          isOpen={true}
          onClose={() => setSelectedPdfSmt(null)}
        />
      )}

    </div>
  );
};
