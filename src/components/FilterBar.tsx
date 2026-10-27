import React, { useState } from 'react';
import { 
  ArrowUpDown, 
  Sparkles, 
  AlertTriangle, 
  Trophy, 
  ShieldAlert, 
  Grid, 
  Table as TableIcon, 
  SlidersHorizontal, 
  RotateCcw,
  MapPin,
  Check
} from 'lucide-react';
import { FilterState, StatusCategory } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  availableZones: string[];
  totalFiltered: number;
  totalAll: number;
  needAttentionCount?: number;
  topPerformerCount?: number;
  withSpCount?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  availableZones,
  totalFiltered,
  totalAll,
  needAttentionCount = 0,
  topPerformerCount = 0,
  withSpCount = 0,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Quick Preset Categories
  const isNeedAttention = filters.selectedStatus === 'NEED_ATTENTION';
  const isTopPerformer = filters.selectedStatus === 'TOP_PERFORMER';
  const isWithSp = filters.selectedStatus === 'WITH_SP';
  const isAll = filters.selectedStatus === 'ALL';

  const isGranularStatus = [
    'BEST',
    'SAFE',
    'WARN_DERIVATIVE',
    'WARN_COMSER',
    'WARN_FP',
    'PANTAUAN'
  ].includes(filters.selectedStatus);

  const granularOptions: { id: StatusCategory; label: string; emoji: string; color: string }[] = [
    { id: 'BEST', label: 'Best Performer', emoji: '🏆', color: 'bg-emerald-100 text-emerald-950 border-emerald-400' },
    { id: 'SAFE', label: 'Safe', emoji: '✅', color: 'bg-yellow-100 text-yellow-950 border-yellow-400' },
    { id: 'WARN_DERIVATIVE', label: 'Warn All Derivative', emoji: '⚠️', color: 'bg-amber-100 text-amber-950 border-amber-400' },
    { id: 'WARN_COMSER', label: 'Warn Comser', emoji: '🫧', color: 'bg-blue-100 text-blue-950 border-blue-400' },
    { id: 'WARN_FP', label: 'Warn FP', emoji: '🛡️', color: 'bg-orange-100 text-orange-950 border-orange-400' },
    { id: 'PANTAUAN', label: 'Dalam Pantauan', emoji: '🚨', color: 'bg-pink-100 text-pink-950 border-pink-400' },
  ];

  const handleResetFilters = () => {
    onFilterChange({
      selectedStatus: 'ALL',
      selectedZone: 'ALL',
      sortBy: 'rank',
      sortOrder: 'asc',
      searchQuery: '',
    });
  };

  const hasActiveCustomFilters = 
    filters.selectedStatus !== 'ALL' || 
    filters.selectedZone !== 'ALL' || 
    filters.sortBy !== 'rank' || 
    filters.sortOrder !== 'asc';

  return (
    <div className="bg-white border-3 border-black rounded-3xl p-4 sm:p-5 bento-shadow mb-6">
      
      {/* Primary Toolbar: Quick Presets + Zone + Sort + View Mode */}
      <div className="flex flex-col gap-3.5">
        
        {/* Top Row: Quick Presets & View Mode Toggle */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* 4 Super Intuitive Quick Filter Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar flex-wrap">
            
            {/* 1. Semua SMT */}
            <button
              id="quick-filter-all"
              onClick={() => onFilterChange({ selectedStatus: 'ALL' })}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border-2 border-black text-xs font-black transition-all cursor-pointer ${
                isAll
                  ? 'bg-black text-white shadow-[2px_2px_0px_0px_#FFE600]'
                  : 'bg-[#F4F5F8] text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFE600]" />
              <span>Semua SMT</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                isAll ? 'bg-white text-black' : 'bg-gray-200 text-gray-800'
              }`}>
                {totalAll}
              </span>
            </button>

            {/* 2. Butuh Perhatian (Pantauan + Warning) */}
            <button
              id="quick-filter-need-attention"
              onClick={() => onFilterChange({ selectedStatus: 'NEED_ATTENTION' })}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border-2 border-black text-xs font-black transition-all cursor-pointer ${
                isNeedAttention
                  ? 'bg-[#EF476F] text-white shadow-[2px_2px_0px_0px_#000]'
                  : 'bg-red-50 text-red-900 border-red-300 hover:bg-red-100'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${isNeedAttention ? 'text-white' : 'text-[#EF476F]'}`} />
              <span>Butuh Perhatian</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                isNeedAttention ? 'bg-black text-white' : 'bg-red-200 text-red-900'
              }`}>
                {needAttentionCount} SMT
              </span>
            </button>

            {/* 3. Top Performer (Best + Safe) */}
            <button
              id="quick-filter-top-performer"
              onClick={() => onFilterChange({ selectedStatus: 'TOP_PERFORMER' })}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border-2 border-black text-xs font-black transition-all cursor-pointer ${
                isTopPerformer
                  ? 'bg-[#06D6A0] text-black shadow-[2px_2px_0px_0px_#000]'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Top Performer</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                isTopPerformer ? 'bg-black text-white' : 'bg-emerald-200 text-emerald-900'
              }`}>
                {topPerformerCount}
              </span>
            </button>

            {/* 4. Ada Riwayat SP */}
            <button
              id="quick-filter-with-sp"
              onClick={() => onFilterChange({ selectedStatus: 'WITH_SP' })}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border-2 border-black text-xs font-black transition-all cursor-pointer ${
                isWithSp
                  ? 'bg-[#FF3E83] text-white shadow-[2px_2px_0px_0px_#000]'
                  : 'bg-pink-50 text-pink-900 border-pink-300 hover:bg-pink-100'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-pink-600" />
              <span>Riwayat SP</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                isWithSp ? 'bg-white text-black' : 'bg-pink-200 text-pink-900'
              }`}>
                {withSpCount}
              </span>
            </button>

          </div>

          {/* View Toggle: Kartu Bento vs Tabel */}
          <div className="flex items-center justify-end gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-gray-500 hidden sm:inline mr-1">Tampilan:</span>
            <div className="bg-[#F4F5F8] border-2 border-black p-0.5 rounded-xl flex items-center shadow-[1px_1px_0px_0px_#000]">
              <button
                id="toggle-view-bento"
                onClick={() => onFilterChange({ activeView: 'bento' })}
                title="Tampilan Kartu Bento"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  filters.activeView === 'bento'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-700 hover:text-black'
                }`}
              >
                <Grid className="w-3.5 h-3.5 text-[#FFE600]" />
                <span className="text-[11px]">Kartu</span>
              </button>

              <button
                id="toggle-view-table"
                onClick={() => onFilterChange({ activeView: 'table' })}
                title="Tampilan Tabel Raport"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  filters.activeView === 'table'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-700 hover:text-black'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5 text-[#06D6A0]" />
                <span className="text-[11px]">Tabel</span>
              </button>
            </div>
          </div>

        </div>

        {/* Second Row: Compact Zona Selector, Urutan, and Detail Filter Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t-2 border-gray-100">
          
          {/* Zona and Sort Selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Compact Zona Selector */}
            <div className="flex items-center gap-1.5 bg-[#F4F5F8] border-2 border-black px-2.5 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_#000]">
              <MapPin className="w-3.5 h-3.5 text-[#FF3E83]" />
              <span className="text-[11px] font-black uppercase text-gray-700">Zona:</span>
              <select
                id="compact-zone-select"
                value={filters.selectedZone}
                onChange={(e) => onFilterChange({ selectedZone: e.target.value })}
                className="bg-transparent text-xs font-black text-black focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Zona ({totalAll} SMT)</option>
                {availableZones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>

            {/* Compact Sort Selector */}
            <div className="flex items-center gap-1.5 bg-[#F4F5F8] border-2 border-black px-2.5 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_#000]">
              <ArrowUpDown className="w-3.5 h-3.5 text-black" />
              <span className="text-[11px] font-black uppercase text-gray-700">Urutkan:</span>
              <select
                id="compact-sort-select"
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-') as [FilterState['sortBy'], FilterState['sortOrder']];
                  onFilterChange({ sortBy, sortOrder });
                }}
                className="bg-transparent text-xs font-black text-black focus:outline-none cursor-pointer"
              >
                <option value="rank-asc">🏆 Ranking Teratas (Top Sales)</option>
                <option value="sales-desc">📈 Sales YTD Tertinggi (%)</option>
                <option value="sales-asc">📉 Sales YTD Terendah (%)</option>
                <option value="polis-desc">🛡️ Polis Furnipro Terbanyak</option>
                <option value="comser-desc">🫧 Clean Care Terbesar (Rp)</option>
                <option value="achCount-desc">🎯 Bulan Achieved (7 Bulan)</option>
                <option value="name-asc">🔤 Nama SMT (A - Z)</option>
              </select>
            </div>

          </div>

          {/* Right Action: Toggle Granular Filter + Reset */}
          <div className="flex items-center gap-2 justify-end">
            
            {hasActiveCustomFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-black text-gray-600 hover:text-red-600 bg-gray-100 hover:bg-red-50 border border-gray-300 rounded-xl cursor-pointer transition-colors"
                title="Reset semua filter ke awal"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}

            <button
              id="toggle-detail-filters"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-black text-xs font-black transition-all cursor-pointer ${
                showAdvanced || isGranularStatus
                  ? 'bg-yellow-300 text-black shadow-[2px_2px_0px_0px_#000]'
                  : 'bg-white text-gray-800 hover:bg-yellow-50 shadow-[1px_1px_0px_0px_#000]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-black" />
              <span>Filter Detail Status</span>
              {isGranularStatus && (
                <span className="w-2 h-2 rounded-full bg-[#FF3E83]"></span>
              )}
              <span className="text-[10px] text-gray-700">{showAdvanced ? '▲' : '▼'}</span>
            </button>

            <span className="text-xs font-extrabold text-gray-500 pl-1 hidden sm:inline">
              <span className="text-black font-black">{totalFiltered}</span> SMT
            </span>

          </div>

        </div>

        {/* Expandable Granular Status Chips (Shown on demand without cluttering default view) */}
        {showAdvanced && (
          <div className="pt-3 border-t-2 border-dashed border-gray-200 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                Pilih Status Evaluasi Spesifik:
              </span>
              <span className="text-[10px] text-gray-400 font-bold">
                Klik salah satu untuk filter khusus
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-wrap">
              {granularOptions.map((st) => {
                const isSelected = filters.selectedStatus === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => onFilterChange({ selectedStatus: st.id })}
                    className={`flex items-center gap-1 px-3 py-1 rounded-xl border-2 text-xs font-black transition-all cursor-pointer ${
                      isSelected
                        ? 'border-black bg-black text-white shadow-[2px_2px_0px_0px_#FFE600] scale-105'
                        : `${st.color} hover:shadow-sm`
                    }`}
                  >
                    <span>{st.emoji}</span>
                    <span>{st.label}</span>
                    {isSelected && <Check className="w-3 h-3 text-[#FFE600] ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
