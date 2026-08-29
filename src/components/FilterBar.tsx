import React from 'react';
import { 
  Filter, 
  ArrowUpDown, 
  Check, 
  Trophy, 
  ShieldCheck, 
  AlertTriangle, 
  Flame,
  LayoutGrid
} from 'lucide-react';
import { FilterState, StatusCategory } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  availableZones: string[];
  totalFiltered: number;
  totalAll: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  availableZones,
  totalFiltered,
  totalAll,
}) => {
  const statusOptions: { id: StatusCategory; label: string; emoji: string; colorClass: string }[] = [
    { id: 'ALL', label: 'Semua Status', emoji: '✨', colorClass: 'bg-white text-black' },
    { id: 'BEST', label: 'Best Performer', emoji: '🏆', colorClass: 'bg-[#06D6A0] text-black' },
    { id: 'SAFE', label: 'Safe', emoji: '✅', colorClass: 'bg-[#FFE600] text-black' },
    { id: 'WARN_DERIVATIVE', label: 'Warn All Derivative', emoji: '🛡️⚠️', colorClass: 'bg-[#FFD166] text-black' },
    { id: 'WARN_COMSER', label: 'Warn Comser', emoji: '🫧', colorClass: 'bg-[#93C5FD] text-black' },
    { id: 'WARN_FP', label: 'Warn FP', emoji: '🛡️', colorClass: 'bg-[#FDBA74] text-black' },
    { id: 'PANTAUAN', label: 'Dalam Pantauan', emoji: '🚨', colorClass: 'bg-[#FF3E83] text-white' },
  ];

  return (
    <div className="bg-white border-3 border-black rounded-3xl p-4 sm:p-5 bento-shadow mb-6">
      <div className="flex flex-col gap-4">
        
        {/* Zone Pills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-black" /> Filter Zona SMT
            </span>
            <span className="text-xs font-bold text-gray-500">
              Menampilkan <span className="font-black text-black">{totalFiltered}</span> dari {totalAll} SMT
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-wrap">
            <button
              id="filter-zone-all"
              onClick={() => onFilterChange({ selectedZone: 'ALL' })}
              className={`px-3.5 py-1.5 rounded-xl border-2 border-black text-xs font-black uppercase transition-all cursor-pointer ${
                filters.selectedZone === 'ALL'
                  ? 'bg-black text-white shadow-[2px_2px_0px_0px_#FFE600]'
                  : 'bg-[#F4F5F8] text-gray-800 hover:bg-gray-200'
              }`}
            >
              Semua Zona
            </button>

            {availableZones.map((zone) => (
              <button
                key={zone}
                id={`filter-zone-${zone.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => onFilterChange({ selectedZone: zone })}
                className={`px-3.5 py-1.5 rounded-xl border-2 border-black text-xs font-black uppercase transition-all cursor-pointer whitespace-nowrap ${
                  filters.selectedZone === zone
                    ? 'bg-black text-white shadow-[2px_2px_0px_0px_#06D6A0]'
                    : 'bg-[#F4F5F8] text-gray-800 hover:bg-gray-200'
                }`}
              >
                {zone}
              </button>
            ))}
          </div>
        </div>

        {/* Status Evaluation Filter & Sort Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t-2 border-gray-200">
          
          {/* Status Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-wrap">
            {statusOptions.map((st) => (
              <button
                key={st.id}
                id={`filter-status-${st.id.toLowerCase()}`}
                onClick={() => onFilterChange({ selectedStatus: st.id })}
                className={`flex items-center gap-1 px-3 py-1 rounded-xl border-2 border-black text-xs font-black transition-all cursor-pointer ${
                  filters.selectedStatus === st.id
                    ? `${st.colorClass} shadow-[2px_2px_0px_0px_#000] scale-105`
                    : 'bg-white text-gray-700 opacity-60 hover:opacity-100 hover:bg-gray-50'
                }`}
              >
                <span>{st.emoji}</span>
                <span>{st.label}</span>
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
            <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-black" /> Urutkan:
            </span>
            <select
              id="smt-sort-select"
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-') as [FilterState['sortBy'], FilterState['sortOrder']];
                onFilterChange({ sortBy, sortOrder });
              }}
              className="bg-white border-2 border-black rounded-xl px-3 py-1.5 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-[#FFE600] shadow-[2px_2px_0px_0px_#000] cursor-pointer"
            >
              <option value="rank-asc">🏆 Ranking Teratas (Top Sales)</option>
              <option value="sales-desc">📈 Sales YTD Tertinggi (%)</option>
              <option value="sales-asc">📉 Sales YTD Terendah (%)</option>
              <option value="polis-desc">🛡️ Polis Furnipro Terbanyak</option>
              <option value="comser-desc">🫧 Clean & Care Terbesar (Rp)</option>
              <option value="achCount-desc">🎯 Bulan Achieved Terbanyak (7/7)</option>
              <option value="name-asc">🔤 Nama SMT (A - Z)</option>
            </select>
          </div>

        </div>

      </div>
    </div>
  );
};
