import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  RefreshCw, 
  Grid, 
  Table as TableIcon, 
  Trophy, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  ShieldAlert,
  ArrowRight,
  UserCheck,
  TrendingDown,
  Cloud,
  LayoutGrid,
  BarChart3,
  HelpCircle
} from 'lucide-react';
import { FilterState, SmtRecord } from '../types';
import { matchesSmtSearch, extractDigits } from '../utils/searchHelper';
import {
  getCoachingRecord,
  subscribeToCoachingUpdates,
  subscribeToSyncStatus,
  forceSyncNow,
  getSyncStatus,
  SyncStatus,
} from '../utils/coachingStorage';

interface NavbarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onRefresh: () => void;
  isLoading: boolean;
  lastUpdated: Date | null;
  totalCount: number;
  smtList: SmtRecord[];
  onSelectSmt: (smt: SmtRecord) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  filters,
  onFilterChange,
  onRefresh,
  isLoading,
  lastUpdated,
  totalCount,
  smtList,
  onSelectSmt,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [coachedCount, setCoachedCount] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus());
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // Subscribe to coaching count & cloud sync status
  useEffect(() => {
    const updateCoachedCount = () => {
      let count = 0;
      smtList.forEach((s) => {
        const rec = getCoachingRecord(s.nip);
        if ((rec?.customLogs && rec.customLogs.length > 0) || (rec?.totalCount && rec.totalCount > 0)) {
          count++;
        }
      });
      setCoachedCount(count);
    };

    updateCoachedCount();
    const unsub = subscribeToCoachingUpdates(updateCoachedCount);
    const unsubSync = subscribeToSyncStatus(setSyncStatus);
    return () => {
      unsub();
      unsubSync();
    };
  }, [smtList]);

  const handleCloudSync = async () => {
    setIsSyncingCloud(true);
    try {
      await forceSyncNow();
    } finally {
      setTimeout(() => setIsSyncingCloud(false), 600);
    }
  };

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchHits = React.useMemo(() => {
    if (!filters.searchQuery || !filters.searchQuery.trim()) return [];
    return smtList.filter((s) => matchesSmtSearch(s, filters.searchQuery)).slice(0, 6);
  }, [smtList, filters.searchQuery]);

  const handleSelectFromSearch = (smt: SmtRecord) => {
    onSelectSmt(smt);
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchHits.length > 0) {
        onSelectSmt(searchHits[0]);
        setIsFocused(false);
      }
    }
  };

  // Identify Active Core Hub: 'raport' | 'supervisi' | 'analisis'
  const activeHub: 'raport' | 'supervisi' | 'analisis' = 
    filters.activeView === 'bento' || filters.activeView === 'table'
      ? 'raport'
      : filters.activeView === 'bottom20' || filters.activeView === 'coached_smts'
      ? 'supervisi'
      : 'analisis';

  return (
    <header className="sticky top-0 z-40 bg-[#F4F5F8]/95 backdrop-blur-md border-b-3 border-black px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        
        {/* Top bar: Brand + Search + Multi-Device Status + Refresh */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFE600] border-3 border-black flex items-center justify-center font-black text-xl shadow-[2px_2px_0px_0px_#000] rotate-[-2deg] shrink-0">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase leading-none font-display">
                  Raport SMT <span className="bg-[#FF3E83] text-white px-2 py-0.5 rounded-lg border-2 border-black text-base">2026</span>
                </h1>
                <span className="bg-[#06D6A0] text-black font-extrabold text-[11px] px-2 py-0.5 rounded-full border-2 border-black uppercase tracking-wider">
                  Alsuters YTD
                </span>
              </div>
              <p className="text-xs font-bold text-gray-600 mt-1 flex items-center gap-1.5">
                <span>Semester Performance</span>
                <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                <span className="text-black font-extrabold">{totalCount} SMT</span>
                {lastUpdated && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-gray-500 font-medium ml-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Synced
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Search bar & Multi-Device Live Sync */}
          <div className="flex items-center gap-2 flex-1 max-w-xl justify-end relative" ref={dropdownRef}>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                id="smt-search-input"
                type="text"
                value={filters.searchQuery}
                onFocus={() => setIsFocused(true)}
                onChange={(e) => {
                  const val = e.target.value;
                  onFilterChange({ searchQuery: val });
                  setIsFocused(true);
                  
                  // Auto open modal on exact match
                  const queryDigits = extractDigits(val);
                  if (queryDigits.length >= 4) {
                    const exactMatch = smtList.find((s) => extractDigits(s.nip) === queryDigits);
                    if (exactMatch) {
                      onSelectSmt(exactMatch);
                    }
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Cari NIP atau Nama SMT..."
                className="w-full pl-9 pr-7 py-2 bg-white border-2 border-black rounded-xl text-xs sm:text-sm font-bold placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFE600] shadow-[2px_2px_0px_0px_#000]"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => {
                    onFilterChange({ searchQuery: '' });
                    setIsFocused(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-black bg-gray-200 hover:bg-gray-300 w-4 h-4 rounded-full flex items-center justify-center border border-black cursor-pointer"
                >
                  ✕
                </button>
              )}

              {/* Instant Search Results Dropdown */}
              {isFocused && filters.searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-2 bg-yellow-100 border-b-2 border-black flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-black flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      Hasil Pencarian ({searchHits.length})
                    </span>
                    <span className="text-[10px] font-bold text-gray-600">Tekan Enter untuk Buka Raport</span>
                  </div>

                  {searchHits.length > 0 ? (
                    <div className="divide-y-2 divide-gray-100 max-h-72 overflow-y-auto">
                      {searchHits.map((smt) => (
                        <div
                          key={smt.id}
                          onClick={() => handleSelectFromSearch(smt)}
                          className="p-3 hover:bg-yellow-50 active:bg-yellow-100 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-black text-white font-black text-xs flex items-center justify-center shrink-0 group-hover:bg-[#FF3E83] transition-colors">
                              #{smt.ytd.rank}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-black group-hover:text-[#FF3E83] transition-colors">
                                  {smt.nama}
                                </h4>
                                <span className="bg-yellow-300 border border-black text-black text-[10px] font-black px-1.5 py-0.2 rounded-md">
                                  NIP: {smt.nip}
                                </span>
                              </div>
                              <p className="text-[11px] font-bold text-gray-500 mt-0.5">
                                {smt.zone} • Sales YTD: <span className="font-extrabold text-emerald-700">{smt.ytd.rawSales}</span> • {smt.ytd.polisCount} FP
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-1 rounded-lg border border-black group-hover:bg-[#06D6A0] group-hover:text-black transition-colors flex items-center gap-1">
                              Buka Raport <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-xs font-black text-gray-600 uppercase">NIP/Nama "{filters.searchQuery}" tidak ditemukan.</p>
                      <p className="text-[11px] font-medium text-gray-400 mt-1">Cek kembali nomor NIP atau ejaan nama SMT.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Multi-Device Cloud Sync Button */}
            <button
              id="cloud-sync-button"
              onClick={handleCloudSync}
              disabled={isSyncingCloud || syncStatus.isSyncing}
              title={
                syncStatus.serverConnected
                  ? 'Koneksi Multi-Device Aktif: Semua HP/Laptop tersinkron otomatis. Klik untuk sync instan.'
                  : 'Mencoba menghubungkan server... Klik untuk coba koneksi ulang.'
              }
              className={`flex items-center gap-1.5 px-3 py-2 border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider bento-shadow-hover shrink-0 cursor-pointer transition-all ${
                syncStatus.serverConnected
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-950'
                  : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-900'
              }`}
            >
              <Cloud className={`w-3.5 h-3.5 ${isSyncingCloud || syncStatus.isSyncing ? 'animate-bounce text-[#FF3E83]' : syncStatus.serverConnected ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span className="hidden sm:inline">
                {isSyncingCloud ? 'Syncing...' : syncStatus.serverConnected ? 'Device Sync' : 'Reconnecting...'}
              </span>
              <span className={`w-2 h-2 rounded-full ${syncStatus.serverConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            </button>

            {/* Refresh from Google Sheets */}
            <button
              id="refresh-data-button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Sync data terbaru dari Google Sheets"
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-yellow-50 active:bg-yellow-100 border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider bento-shadow-hover shrink-0 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#FF3E83]' : ''}`} />
              <span className="hidden sm:inline">{isLoading ? 'Syncing...' : 'Sync Sheet'}</span>
            </button>
          </div>
        </div>

        {/* Simplified 3 Core Hubs: 1. Raport & Tim, 2. Supervisi SMT, 3. Analisis Lanjutan */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t-2 border-black/10">
          
          {/* Main 3 Navigation Tabs */}
          <nav className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            
            {/* HUB 1: Raport & Tim */}
            <button
              id="hub-raport-tim"
              onClick={() => onFilterChange({ activeView: 'bento' })}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-3 border-black text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
                activeHub === 'raport'
                  ? 'bg-black text-white shadow-[3px_3px_0px_0px_#FFE600] scale-[1.02]'
                  : 'bg-white text-gray-800 hover:bg-yellow-50 shadow-[2px_2px_0px_0px_#000]'
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-[#FFE600]" />
              <span>Raport & Tim SMT</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeHub === 'raport' ? 'bg-[#FFE600] text-black' : 'bg-gray-100 text-gray-800 border border-black/20'
              }`}>
                {totalCount}
              </span>
            </button>

            {/* HUB 2: Supervisi SMT (20 Rank Terbawah & SMT Pernah Dipanggil) */}
            <button
              id="hub-supervisi-smt"
              onClick={() => onFilterChange({ activeView: 'bottom20' })}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-3 border-black text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
                activeHub === 'supervisi'
                  ? 'bg-black text-[#EF476F] shadow-[3px_3px_0px_0px_#EF476F] scale-[1.02]'
                  : 'bg-white text-gray-800 hover:bg-red-50 shadow-[2px_2px_0px_0px_#000]'
              }`}
            >
              <UserCheck className="w-4 h-4 text-[#EF476F]" />
              <span>Supervisi & Coaching</span>
              <div className="flex items-center gap-1">
                <span className="bg-[#EF476F] text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  20 Prioritas
                </span>
                {coachedCount > 0 && (
                  <span className="bg-[#06D6A0] text-black text-[10px] px-1.5 py-0.2 rounded-full font-black hidden sm:inline">
                    {coachedCount} Dipanggil
                  </span>
                )}
              </div>
            </button>

            {/* HUB 3: Analisis Lanjutan */}
            <button
              id="hub-analisis-lanjutan"
              onClick={() => onFilterChange({ activeView: 'leaderboard' })}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-3 border-black text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
                activeHub === 'analisis'
                  ? 'bg-black text-[#06D6A0] shadow-[3px_3px_0px_0px_#06D6A0] scale-[1.02]'
                  : 'bg-white text-gray-800 hover:bg-emerald-50 shadow-[2px_2px_0px_0px_#000]'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-[#06D6A0]" />
              <span>Analisis & SP</span>
            </button>

          </nav>

          {/* Sub-navigation pills (Appears specifically based on the active hub) */}
          {activeHub === 'supervisi' && (
            <div className="flex items-center gap-1.5 bg-red-50/80 border-2 border-black p-1 rounded-xl self-start sm:self-auto shrink-0 shadow-[2px_2px_0px_0px_#000]">
              <button
                id="sub-view-bottom20"
                onClick={() => onFilterChange({ activeView: 'bottom20' })}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  filters.activeView === 'bottom20'
                    ? 'bg-[#EF476F] text-white shadow-sm'
                    : 'text-gray-700 hover:text-black hover:bg-white/60'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>20 Terbawah (Prioritas)</span>
              </button>

              <button
                id="sub-view-coached"
                onClick={() => onFilterChange({ activeView: 'coached_smts' })}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  filters.activeView === 'coached_smts'
                    ? 'bg-black text-[#FFE600] shadow-sm'
                    : 'text-gray-700 hover:text-black hover:bg-white/60'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-[#06D6A0]" />
                <span>Riwayat Dipanggil ({coachedCount})</span>
              </button>
            </div>
          )}

          {activeHub === 'analisis' && (
            <div className="flex items-center gap-1 bg-[#F4F5F8] border-2 border-black p-1 rounded-xl self-start sm:self-auto overflow-x-auto no-scrollbar shrink-0 shadow-[2px_2px_0px_0px_#000]">
              <button
                onClick={() => onFilterChange({ activeView: 'leaderboard' })}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  filters.activeView === 'leaderboard'
                    ? 'bg-black text-[#FFD166] shadow-sm'
                    : 'text-gray-700 hover:text-black hover:bg-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-[#FFD166]" />
                <span>Leaderboard</span>
              </button>

              <button
                onClick={() => onFilterChange({ activeView: 'monthly_drill' })}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  filters.activeView === 'monthly_drill'
                    ? 'bg-black text-[#06D6A0] shadow-sm'
                    : 'text-gray-700 hover:text-black hover:bg-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-[#06D6A0]" />
                <span>7 Bulan</span>
              </button>

              <button
                onClick={() => onFilterChange({ activeView: 'zones' })}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  filters.activeView === 'zones'
                    ? 'bg-black text-[#38BDF8] shadow-sm'
                    : 'text-gray-700 hover:text-black hover:bg-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Zona Battle</span>
              </button>

              <button
                onClick={() => onFilterChange({ activeView: 'sp_history' })}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  filters.activeView === 'sp_history'
                    ? 'bg-[#FF3E83] text-white shadow-sm'
                    : 'text-gray-700 hover:text-black hover:bg-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Historical SP</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
