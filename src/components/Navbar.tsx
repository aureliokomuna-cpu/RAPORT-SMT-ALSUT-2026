import React from 'react';
import { 
  Sparkles, 
  Search, 
  RefreshCw, 
  FileSpreadsheet, 
  Grid, 
  Table as TableIcon, 
  Trophy, 
  Calendar, 
  Layers,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { FilterState } from '../types';

interface NavbarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onRefresh: () => void;
  isLoading: boolean;
  lastUpdated: Date | null;
  totalCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  filters,
  onFilterChange,
  onRefresh,
  isLoading,
  lastUpdated,
  totalCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#F4F5F8]/90 backdrop-blur-md border-b-3 border-black px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col gap-3.5">
        {/* Top bar: Brand + Search + Action */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FFE600] border-3 border-black flex items-center justify-center font-black text-xl shadow-[3px_3px_0px_0px_#000] rotate-[-3deg] shrink-0">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase leading-none font-display">
                  Raport SMT <span className="bg-[#FF3E83] text-white px-2 py-0.5 rounded-lg border-2 border-black text-lg">2026</span>
                </h1>
                <span className="bg-[#06D6A0] text-black font-extrabold text-[11px] px-2 py-0.5 rounded-full border-2 border-black uppercase tracking-wider">
                  Alsuters YTD
                </span>
              </div>
              <p className="text-xs font-bold text-gray-600 mt-1 flex items-center gap-1.5">
                <span>Semester Performance Report</span>
                <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                <span className="text-black font-extrabold">{totalCount} SMT Registered</span>
                {lastUpdated && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-gray-500 font-medium ml-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Synced
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Search bar & Live Refresh */}
          <div className="flex items-center gap-2 flex-1 max-w-xl justify-end">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                id="smt-search-input"
                type="text"
                value={filters.searchQuery}
                onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
                placeholder="Cari Nama SMT atau NIP... (misal: Rahmat, Bagas, 176137)"
                className="w-full pl-9 pr-4 py-2 bg-white border-2 border-black rounded-xl text-sm font-semibold placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFE600] shadow-[2px_2px_0px_0px_#000]"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => onFilterChange({ searchQuery: '' })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black bg-gray-200 hover:bg-gray-300 w-5 h-5 rounded-full flex items-center justify-center border border-black"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              id="refresh-data-button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Sync data terbaru dari Google Sheets"
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-yellow-50 active:bg-yellow-100 border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider bento-shadow-hover shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#FF3E83]' : ''}`} />
              <span className="hidden sm:inline">{isLoading ? 'Syncing...' : 'Sync Sheet'}</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs (Bento, Table, Leaderboard, Monthly Drill, Zones) */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              id="view-bento-button"
              onClick={() => onFilterChange({ activeView: 'bento' })}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border-2 border-black text-xs font-black transition-all cursor-pointer ${
                filters.activeView === 'bento'
                  ? 'bg-black text-white shadow-[2px_2px_0px_0px_#FFE600]'
                  : 'bg-white text-gray-800 hover:bg-gray-100 shadow-[2px_2px_0px_0px_#000]'
              }`}
            >
              <Grid className="w-3.5 h-3.5 text-[#FFE600]" />
              <span>Bento Cards</span>
            </button>

            <button
              id="view-monthly-drill-button"
              onClick={() => onFilterChange({ activeView: 'monthly_drill' })}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border-2 border-black text-xs font-black transition-all cursor-pointer ${
                filters.activeView === 'monthly_drill'
                  ? 'bg-black text-white shadow-[2px_2px_0px_0px_#06D6A0]'
                  : 'bg-white text-gray-800 hover:bg-gray-100 shadow-[2px_2px_0px_0px_#000]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-[#06D6A0]" />
              <span>Penilaian Bulanan</span>
              <span className="bg-[#FF3E83] text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">7 SMT</span>
            </button>

            <button
              id="view-leaderboard-button"
              onClick={() => onFilterChange({ activeView: 'leaderboard' })}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border-2 border-black text-xs font-black transition-all cursor-pointer ${
                filters.activeView === 'leaderboard'
                  ? 'bg-black text-white shadow-[2px_2px_0px_0px_#FF3E83]'
                  : 'bg-white text-gray-800 hover:bg-gray-100 shadow-[2px_2px_0px_0px_#000]'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-[#FFD166]" />
              <span>Leaderboard</span>
            </button>

            <button
              id="view-table-button"
              onClick={() => onFilterChange({ activeView: 'table' })}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border-2 border-black text-xs font-black transition-all cursor-pointer ${
                filters.activeView === 'table'
                  ? 'bg-black text-white shadow-[2px_2px_0px_0px_#A78BFA]'
                  : 'bg-white text-gray-800 hover:bg-gray-100 shadow-[2px_2px_0px_0px_#000]'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>Tabel Raport</span>
            </button>

            <button
              id="view-zones-button"
              onClick={() => onFilterChange({ activeView: 'zones' })}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border-2 border-black text-xs font-black transition-all cursor-pointer ${
                filters.activeView === 'zones'
                  ? 'bg-black text-white shadow-[2px_2px_0px_0px_#38BDF8]'
                  : 'bg-white text-gray-800 hover:bg-gray-100 shadow-[2px_2px_0px_0px_#000]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Zona Battle</span>
            </button>

            <button
              id="view-sp-history-button"
              onClick={() => onFilterChange({ activeView: 'sp_history' })}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border-2 border-black text-xs font-black transition-all cursor-pointer ${
                filters.activeView === 'sp_history'
                  ? 'bg-black text-white shadow-[2px_2px_0px_0px_#FF3E83]'
                  : 'bg-white text-gray-800 hover:bg-gray-100 shadow-[2px_2px_0px_0px_#000]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#FF3E83]" />
              <span>Historical SP</span>
              <span className="bg-[#FF3E83] text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">SPV</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-white border-2 border-black px-3 py-1 rounded-xl shadow-[2px_2px_0px_0px_#000]">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Gen-Z Performance Engine</span>
          </div>
        </div>
      </div>
    </header>
  );
};
