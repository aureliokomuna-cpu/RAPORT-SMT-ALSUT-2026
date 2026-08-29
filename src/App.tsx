import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewBento } from './components/OverviewBento';
import { FilterBar } from './components/FilterBar';
import { SmtCard } from './components/SmtCard';
import { SmtDetailModal } from './components/SmtDetailModal';
import { MonthlyDeepDive } from './components/MonthlyDeepDive';
import { LeaderboardPodium } from './components/LeaderboardPodium';
import { ZoneBattleView } from './components/ZoneBattleView';
import { TableView } from './components/TableView';

import { FilterState, SmtRecord, ZoneSummary } from './types';
import { computeZoneSummaries, parseSmtCsv } from './utils/parser';
import { DEFAULT_CSV_URL, FALLBACK_CSV_DATA } from './data/defaultCsv';
import { Sparkles, HelpCircle, Layers, ArrowUp, RefreshCw } from 'lucide-react';

export default function App() {
  // Initialize with fallback embedded data so it loads instantly with 0 latency
  const [smtList, setSmtList] = useState<SmtRecord[]>(() => parseSmtCsv(FALLBACK_CSV_DATA));
  const [zoneSummaries, setZoneSummaries] = useState<ZoneSummary[]>(() => 
    computeZoneSummaries(parseSmtCsv(FALLBACK_CSV_DATA))
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());
  const [selectedSmt, setSelectedSmt] = useState<SmtRecord | null>(null);

  // Filters and Navigation State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedZone: 'ALL',
    selectedStatus: 'ALL',
    selectedMonth: 'ytd',
    sortBy: 'rank',
    sortOrder: 'asc',
    activeView: 'bento',
  });

  // Fetch live CSV data on mount from Google Sheet published URL
  const fetchLiveData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(DEFAULT_CSV_URL, { cache: 'no-cache' });
      if (!response.ok) throw new Error('Gagal memuat Google Sheet');
      const csvText = await response.text();
      if (csvText && csvText.length > 200) {
        const parsed = parseSmtCsv(csvText);
        if (parsed.length > 0) {
          setSmtList(parsed);
          setZoneSummaries(computeZoneSummaries(parsed));
          setLastUpdated(new Date());
        }
      }
    } catch (err) {
      console.warn('Menggunakan data cache fallback offline:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
  }, []);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Get available unique zones
  const availableZones = useMemo(() => {
    const set = new Set<string>();
    smtList.forEach((s) => {
      if (s.zone) set.add(s.zone);
    });
    return Array.from(set);
  }, [smtList]);

  // Filtered & Sorted SMT list
  const filteredSmts = useMemo(() => {
    let result = [...smtList];

    // Search query
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.nama.toLowerCase().includes(q) ||
          s.nip.toLowerCase().includes(q) ||
          s.zone.toLowerCase().includes(q)
      );
    }

    // Zone filter
    if (filters.selectedZone !== 'ALL') {
      result = result.filter((s) => s.zone === filters.selectedZone);
    }

    // Status category filter
    if (filters.selectedStatus !== 'ALL') {
      result = result.filter((s) => {
        const evalStr = s.ytd.evaluationResult;
        switch (filters.selectedStatus) {
          case 'BEST':
            return evalStr.includes('Best Performer');
          case 'SAFE':
            return evalStr.includes('Safe');
          case 'WARN_DERIVATIVE':
            return evalStr.includes('Warning All Derivative');
          case 'WARN_COMSER':
            return evalStr.includes('Warning Comser');
          case 'WARN_FP':
            return evalStr.includes('Warning FP');
          case 'PANTAUAN':
            return evalStr.includes('PANTAUAN');
          default:
            return true;
        }
      });
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'rank':
          comparison = a.ytd.rank - b.ytd.rank;
          break;
        case 'sales':
          comparison = b.ytd.salesPct - a.ytd.salesPct;
          break;
        case 'polis':
          comparison = b.ytd.polisCount - a.ytd.polisCount;
          break;
        case 'comser':
          comparison = b.ytd.comserVal - a.ytd.comserVal;
          break;
        case 'achCount':
          comparison = b.ytd.salesAchCount - a.ytd.salesAchCount;
          break;
        case 'name':
          comparison = a.nama.localeCompare(b.nama);
          break;
        default:
          comparison = a.ytd.rank - b.ytd.rank;
      }
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [smtList, filters]);

  // Modal navigation handler (Next / Prev)
  const handleModalNavigate = (direction: 'next' | 'prev') => {
    if (!selectedSmt) return;
    const currentIndex = filteredSmts.findIndex((s) => s.id === selectedSmt.id);
    if (currentIndex === -1) return;

    if (direction === 'next') {
      const nextIndex = (currentIndex + 1) % filteredSmts.length;
      setSelectedSmt(filteredSmts[nextIndex]);
    } else {
      const prevIndex = (currentIndex - 1 + filteredSmts.length) % filteredSmts.length;
      setSelectedSmt(filteredSmts[prevIndex]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-[#111827] flex flex-col selection:bg-[#FFE600] selection:text-black">
      
      {/* Sticky Header */}
      <Navbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onRefresh={fetchLiveData}
        isLoading={isLoading}
        lastUpdated={lastUpdated}
        totalCount={smtList.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        
        {/* Render View based on active tab */}
        {filters.activeView === 'bento' && (
          <div>
            {/* Overview Bento Dashboard */}
            <OverviewBento
              smtList={smtList}
              zoneSummaries={zoneSummaries}
              onSelectSmt={(smt) => setSelectedSmt(smt)}
            />

            {/* Filter & Sort Controls */}
            <FilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              availableZones={availableZones}
              totalFiltered={filteredSmts.length}
              totalAll={smtList.length}
            />

            {/* SMT Bento Cards Grid */}
            {filteredSmts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {filteredSmts.map((smt) => (
                  <SmtCard
                    key={smt.id}
                    smt={smt}
                    onOpenDetail={(s) => setSelectedSmt(s)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white border-3 border-black rounded-3xl p-10 bento-shadow text-center">
                <div className="text-5xl mb-3">🔍</div>
                <h3 className="text-xl font-black font-display uppercase">
                  Tidak Ada SMT Ditemukan
                </h3>
                <p className="text-xs text-gray-500 font-semibold mt-1">
                  Coba ubah kata kunci pencarian atau reset filter status/zona.
                </p>
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      searchQuery: '',
                      selectedZone: 'ALL',
                      selectedStatus: 'ALL',
                    }))
                  }
                  className="mt-4 px-4 py-2 bg-black text-white rounded-xl text-xs font-black uppercase cursor-pointer"
                >
                  Reset Semua Filter
                </button>
              </div>
            )}
          </div>
        )}

        {filters.activeView === 'monthly_drill' && (
          <MonthlyDeepDive
            smtList={smtList}
            onSelectSmt={(smt) => setSelectedSmt(smt)}
          />
        )}

        {filters.activeView === 'leaderboard' && (
          <LeaderboardPodium
            smtList={smtList}
            onSelectSmt={(smt) => setSelectedSmt(smt)}
          />
        )}

        {filters.activeView === 'zones' && (
          <ZoneBattleView
            zoneSummaries={zoneSummaries}
            smtList={smtList}
            onSelectSmt={(smt) => setSelectedSmt(smt)}
            onFilterZone={(zone) => {
              setFilters((prev) => ({
                ...prev,
                selectedZone: zone,
                activeView: 'bento',
              }));
            }}
          />
        )}

        {filters.activeView === 'table' && (
          <TableView
            smtList={filteredSmts}
            onSelectSmt={(smt) => setSelectedSmt(smt)}
          />
        )}

      </main>

      {/* SMT Detailed Bento Raport Modal */}
      {selectedSmt && (
        <SmtDetailModal
          smt={selectedSmt}
          onClose={() => setSelectedSmt(null)}
          onNavigate={handleModalNavigate}
        />
      )}

      {/* Modern Gen-Z Footer */}
      <footer className="bg-black text-white border-t-3 border-black py-8 px-4 sm:px-6 mt-12 no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-xl">⚡</span>
              <span className="text-lg font-black font-display uppercase tracking-tight text-[#FFE600]">
                RAPORT SMT ALSUTERS 2026
              </span>
            </div>
            <p className="text-xs font-medium text-gray-400 mt-1">
              Evaluasi YTD Semester 1 • Sistem Penilaian Sales & Derivatif Produk
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center text-xs font-bold text-gray-400">
            <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20">
              📊 150 SMT Aktif
            </span>
            <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20">
              🛡️ Furnipro & Clean Care
            </span>
            <span className="bg-[#FFE600] text-black px-3 py-1 rounded-full font-black">
              Bento Gen-Z UI
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
