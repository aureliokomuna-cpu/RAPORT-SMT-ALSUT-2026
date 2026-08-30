import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar, 
  Clock, 
  UserCheck, 
  FileWarning, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  TrendingDown,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';
import { SmtRecord, SpRecord } from '../types';
import { matchesSpSearch } from '../utils/searchHelper';

interface SpHistoryViewProps {
  smtList: SmtRecord[];
  allSpRecords: SpRecord[];
  onSelectSmt: (smt: SmtRecord) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const SpHistoryView: React.FC<SpHistoryViewProps> = ({
  smtList,
  allSpRecords,
  onSelectSmt,
  searchQuery = '',
  onSearchChange,
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [selectedSpType, setSelectedSpType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'AKTIF' | 'EXPIRED'>('ALL');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sortBy, setSortBy] = useState<'remaining' | 'name' | 'nip' | 'type'>('remaining');

  // Synchronize local search with parent search
  const effectiveSearch = onSearchChange ? searchQuery : localSearch;
  const handleSearch = (val: string) => {
    if (onSearchChange) onSearchChange(val);
    setLocalSearch(val);
  };

  // Map SP records with their associated SmtRecord
  const enrichedSpRecords = useMemo(() => {
    return allSpRecords.map((sp) => {
      // Find SMT by NIP
      const matchedSmt = smtList.find(
        (s) => s.nip === sp.nip || s.nama.toLowerCase() === sp.name.toLowerCase()
      );
      return {
        ...sp,
        zone: matchedSmt ? matchedSmt.zone : (sp.zone || 'STORE ALSUT'),
        smt: matchedSmt,
      };
    });
  }, [allSpRecords, smtList]);

  // Unique zones for filter
  const availableZones = useMemo(() => {
    const set = new Set<string>();
    enrichedSpRecords.forEach((r) => {
      if (r.zone) set.add(r.zone);
    });
    return Array.from(set);
  }, [enrichedSpRecords]);

  // Filtered SP records
  const filteredSpList = useMemo(() => {
    let result = [...enrichedSpRecords];

    // Search query (Nama or NIP)
    if (effectiveSearch.trim()) {
      result = result.filter((r) => matchesSpSearch(r, effectiveSearch));
    }

    // SP Type filter
    if (selectedSpType !== 'ALL') {
      result = result.filter((r) => r.spType === selectedSpType);
    }

    // Status filter
    if (selectedStatus !== 'ALL') {
      result = result.filter((r) => r.status === selectedStatus);
    }

    // Zone filter
    if (selectedZone !== 'ALL') {
      result = result.filter((r) => r.zone === selectedZone);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'remaining') {
        return a.remainingDays - b.remainingDays;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'nip') {
        return a.nip.localeCompare(b.nip);
      }
      if (sortBy === 'type') {
        return b.spType.localeCompare(a.spType);
      }
      return 0;
    });

    return result;
  }, [enrichedSpRecords, effectiveSearch, selectedSpType, selectedStatus, selectedZone, sortBy]);

  // Summary Metrics
  const totalSpCount = enrichedSpRecords.length;
  const activeSpCount = enrichedSpRecords.filter((r) => r.status === 'AKTIF').length;
  const sp1Count = enrichedSpRecords.filter((r) => r.spType === 'S1' || r.spType.includes('1')).length;
  const sp2Count = enrichedSpRecords.filter((r) => r.spType === 'S2' || r.spType.includes('2')).length;
  const employeesWithSpCount = new Set(enrichedSpRecords.map((r) => r.nip)).size;
  const cleanEmployeesCount = Math.max(0, smtList.length - employeesWithSpCount);
  const disciplineRate = smtList.length > 0 ? ((cleanEmployeesCount / smtList.length) * 100).toFixed(1) : '100';

  const handleExportCsv = () => {
    const headers = [
      'NIP',
      'Nama Karyawan',
      'Zona Lantai',
      'Tipe SP',
      'Label SP',
      'Tanggal Berlaku',
      'Tanggal Berakhir',
      'Status',
      'Sisa Hari',
      'YTD Sales SMT',
      'Hasil Evaluasi SMT',
    ];

    const rows = filteredSpList.map((r) => [
      `"${r.nip}"`,
      `"${r.name}"`,
      `"${r.zone || '-'}"`,
      `"${r.spType}"`,
      `"${r.spLabel}"`,
      `"${r.startDate}"`,
      `"${r.expiredDate}"`,
      `"${r.status}"`,
      r.remainingDays,
      `"${r.smt ? r.smt.ytd.rawSales : '-'}"`,
      `"${r.smt ? r.smt.ytd.evaluationResult : '-'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Historical_SP_Karyawan_Alsut_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Bento Hero SP History */}
      <div className="bg-[#FF3E83] border-3 border-black rounded-3xl p-5 sm:p-7 text-white bento-shadow relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="bg-black text-[#FFE600] font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider border border-black flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Historical SP Karyawan
              </span>
              <span className="bg-white text-black font-black text-xs px-3 py-1 rounded-full uppercase border border-black">
                Alsuters 2026
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display uppercase tracking-tight leading-tight">
              Data Riwayat & Status Surat Peringatan (SP)
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-white/90 mt-2 leading-relaxed">
              Monitoring kedisiplinan dan kepatuhan karyawan SMT Store Alam Sutera yang tersinkronisasi 
              secara akurat dengan NIP & Nama di Raport SMT.
            </p>
          </div>

          {/* Quick Rate Box */}
          <div className="bg-white text-black border-3 border-black rounded-2xl p-4 sm:p-5 text-center min-w-[170px] shadow-[4px_4px_0px_0px_#000] shrink-0 self-start md:self-auto">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              Disiplin S-Tier Store
            </p>
            <p className="text-4xl font-black font-display text-emerald-600 my-0.5">
              {disciplineRate}%
            </p>
            <span className="inline-block text-[11px] font-extrabold bg-[#06D6A0] text-black px-2 py-0.5 rounded-md border border-black">
              {cleanEmployeesCount} Bebas SP ✨
            </span>
          </div>
        </div>

        <div className="absolute -right-6 -bottom-6 opacity-10 text-9xl font-black pointer-events-none select-none">
          ⚠️
        </div>
      </div>

      {/* 4-Card Bento Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border-3 border-black rounded-3xl p-4 bento-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
              Total Catatan SP
            </span>
            <span className="w-7 h-7 rounded-xl bg-gray-100 border border-black flex items-center justify-center font-black text-xs">
              📋
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-black font-display text-black my-1">
            {totalSpCount}
          </p>
          <p className="text-[11px] font-bold text-gray-600">
            Tersebar di <strong className="text-black">{employeesWithSpCount} Karyawan</strong>
          </p>
        </div>

        <div className="bg-white border-3 border-black rounded-3xl p-4 bento-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
              Surat Peringatan 1 (S1)
            </span>
            <span className="w-7 h-7 rounded-xl bg-[#FFE600] border border-black flex items-center justify-center font-black text-xs">
              ⚡
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-black font-display text-amber-600 my-1">
            {sp1Count}
          </p>
          <p className="text-[11px] font-bold text-gray-600">
            Masa berlaku standar 6 bulan
          </p>
        </div>

        <div className="bg-white border-3 border-black rounded-3xl p-4 bento-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
              Surat Peringatan 2 (S2)
            </span>
            <span className="w-7 h-7 rounded-xl bg-[#FF3E83] text-white border border-black flex items-center justify-center font-black text-xs">
              🚨
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-black font-display text-[#FF3E83] my-1">
            {sp2Count}
          </p>
          <p className="text-[11px] font-bold text-gray-600">
            Perlu pendampingan intensif SPV
          </p>
        </div>

        <div className="bg-white border-3 border-black rounded-3xl p-4 bento-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
              SP Status Aktif
            </span>
            <span className="w-7 h-7 rounded-xl bg-[#06D6A0] border border-black flex items-center justify-center font-black text-xs">
              ⏳
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-black font-display text-emerald-600 my-1">
            {activeSpCount}
          </p>
          <p className="text-[11px] font-bold text-gray-600">
            Masih dalam masa sanksi
          </p>
        </div>
      </div>

      {/* Filter & Control Bar */}
      <div className="bg-white border-3 border-black rounded-3xl p-4 sm:p-5 bento-shadow space-y-4">
        
        {/* Search & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="search-sp-input"
              type="text"
              value={effectiveSearch}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Cari NIP atau Nama Karyawan ber-SP... (misal: 195002, Desta, Bagas)"
              className="w-full pl-9 pr-4 py-2 bg-white border-2 border-black rounded-xl text-xs sm:text-sm font-semibold placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFE600] shadow-[2px_2px_0px_0px_#000]"
            />
            {effectiveSearch && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black bg-gray-200 hover:bg-gray-300 w-5 h-5 rounded-full flex items-center justify-center border border-black"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 p-1 border-2 border-black rounded-xl">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-black text-white shadow-sm' : 'text-gray-700 hover:text-black'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kartu</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-black text-white shadow-sm' : 'text-gray-700 hover:text-black'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Tabel</span>
              </button>
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FFE600] hover:bg-yellow-300 border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider bento-shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Pills: Type + Zone + Sort */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t-2 border-gray-100">
          
          {/* SP Type & Status Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-wrap">
            <span className="text-[11px] font-black text-gray-500 uppercase mr-1">
              Tipe:
            </span>
            <button
              onClick={() => setSelectedSpType('ALL')}
              className={`px-3 py-1 rounded-xl border-2 border-black text-xs font-black transition-all cursor-pointer ${
                selectedSpType === 'ALL'
                  ? 'bg-black text-white shadow-[2px_2px_0px_0px_#FFE600]'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Semua SP
            </button>
            <button
              onClick={() => setSelectedSpType('S1')}
              className={`px-3 py-1 rounded-xl border-2 border-black text-xs font-black transition-all cursor-pointer ${
                selectedSpType === 'S1'
                  ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_0px_#000]'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              SP 1 (S1)
            </button>
            <button
              onClick={() => setSelectedSpType('S2')}
              className={`px-3 py-1 rounded-xl border-2 border-black text-xs font-black transition-all cursor-pointer ${
                selectedSpType === 'S2'
                  ? 'bg-[#FF3E83] text-white shadow-[2px_2px_0px_0px_#000]'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              SP 2 (S2)
            </button>
          </div>

          {/* Zone Filter & Sort */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="bg-white border-2 border-black rounded-xl px-3 py-1.5 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-[#FFE600] shadow-[2px_2px_0px_0px_#000] cursor-pointer"
            >
              <option value="ALL">🏢 Semua Zona Lantai</option>
              {availableZones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border-2 border-black rounded-xl px-3 py-1.5 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-[#FFE600] shadow-[2px_2px_0px_0px_#000] cursor-pointer"
            >
              <option value="remaining">⏳ Masa Berlaku (Terdekat)</option>
              <option value="type">🚨 Tipe SP (S2 Terlebih Dahulu)</option>
              <option value="name">🔤 Nama Karyawan (A - Z)</option>
              <option value="nip">🔢 NIP Karyawan</option>
            </select>
          </div>

        </div>

      </div>

      {/* Result Stats Indicator */}
      <div className="flex items-center justify-between text-xs font-bold text-gray-600 px-1">
        <span>
          Menampilkan <strong className="text-black font-black">{filteredSpList.length}</strong> dari {totalSpCount} Catatan SP Karyawan
        </span>
        {effectiveSearch && (
          <span className="text-indigo-600 font-black">
            Hasil pencarian untuk: "{effectiveSearch}"
          </span>
        )}
      </div>

      {/* Card Mode View */}
      {viewMode === 'cards' && (
        <div>
          {filteredSpList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredSpList.map((sp) => {
                const isS2 = sp.spType === 'S2' || sp.spType.includes('2');
                return (
                  <div
                    key={sp.id}
                    className={`bg-white border-3 border-black rounded-3xl p-5 bento-shadow bento-shadow-hover flex flex-col justify-between transition-all relative overflow-hidden group ${
                      isS2 ? 'ring-2 ring-[#FF3E83]' : ''
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-xl border-2 border-black font-black text-xs uppercase flex items-center gap-1 ${
                              isS2
                                ? 'bg-[#FF3E83] text-white shadow-[2px_2px_0px_0px_#000]'
                                : 'bg-[#FFE600] text-black shadow-[2px_2px_0px_0px_#000]'
                            }`}
                          >
                            <span>{isS2 ? '🚨' : '⚠️'}</span>
                            <span>{sp.spLabel}</span>
                          </span>

                          <span className="bg-[#F0F2F5] text-black border border-black/60 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase">
                            {sp.zone}
                          </span>
                        </div>

                        <span className="text-[11px] font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-300">
                          NIP: {sp.nip}
                        </span>
                      </div>

                      {/* Employee Name */}
                      <div className="mb-3">
                        <h3 className="text-xl font-black font-display text-black uppercase tracking-tight leading-snug">
                          {sp.name}
                        </h3>
                        {sp.smt && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-gray-600 flex-wrap">
                            <span className="bg-gray-100 border border-black/30 px-2 py-0.5 rounded-md text-black font-black">
                              Rank #{sp.smt.ytd.rank} SMT
                            </span>
                            <span className="text-emerald-700 font-extrabold">
                              Sales: {sp.smt.ytd.rawSales}
                            </span>
                            <span>•</span>
                            <span className="text-black font-extrabold">
                              Grade {sp.smt.ytd.overallGrade}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* SP Validity Period Box */}
                      <div className="bg-[#F8F9FA] border-2 border-black rounded-2xl p-3.5 space-y-2 mb-3.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-black" /> Tanggal Mulai:
                          </span>
                          <span className="font-black text-black">
                            {sp.startDate}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-black" /> Berakhir Pada:
                          </span>
                          <span className="font-black text-black">
                            {sp.expiredDate}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-500">Status Sanksi:</span>
                          <span
                            className={`font-black px-2 py-0.5 rounded-md border text-[11px] ${
                              sp.status === 'AKTIF'
                                ? 'bg-amber-100 text-amber-900 border-amber-400'
                                : 'bg-gray-200 text-gray-700 border-gray-400'
                            }`}
                          >
                            {sp.status === 'AKTIF' ? `⏳ AKTIF (${sp.remainingDays} Hari Lagi)` : '✅ EXPIRED'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button: Open SMT Raport */}
                    <div className="pt-2 border-t-2 border-gray-100">
                      {sp.smt ? (
                        <button
                          onClick={() => onSelectSmt(sp.smt!)}
                          className="w-full py-2 px-3 bg-black hover:bg-neutral-800 text-white rounded-xl font-black text-xs uppercase tracking-wider border-2 border-black flex items-center justify-center gap-1.5 transition-all bento-shadow-sm hover:shadow-[3px_3px_0px_0px_#FFE600] cursor-pointer"
                        >
                          <span>Buka Raport SMT Karyawan 📋</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#FFE600]" />
                        </button>
                      ) : (
                        <div className="text-center text-[11px] font-bold text-gray-500 py-1.5">
                          Karyawan Non-SMT / Data Terpisah
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border-3 border-black rounded-3xl p-10 bento-shadow text-center">
              <div className="text-5xl mb-3">🔍</div>
              <h3 className="text-xl font-black font-display uppercase">
                Tidak Ada Catatan SP Sesuai Filter
              </h3>
              <p className="text-xs text-gray-500 font-semibold mt-1">
                Coba ubah kata kunci pencarian NIP/Nama atau ganti filter zona/tipe SP.
              </p>
              <button
                onClick={() => {
                  handleSearch('');
                  setSelectedSpType('ALL');
                  setSelectedZone('ALL');
                }}
                className="mt-4 px-4 py-2 bg-black text-white rounded-xl text-xs font-black uppercase cursor-pointer"
              >
                Reset Filter SP
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table Mode View */}
      {viewMode === 'table' && (
        <div className="bg-white border-3 border-black rounded-3xl p-5 bento-shadow">
          <div className="overflow-x-auto border-2 border-black rounded-2xl">
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
              <thead className="bg-black text-white font-black uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-3 border-r border-gray-800 text-center w-12">#</th>
                  <th className="py-3 px-3 border-r border-gray-800">NIP & Nama Karyawan</th>
                  <th className="py-3 px-3 border-r border-gray-800">Zona Lantai</th>
                  <th className="py-3 px-3 border-r border-gray-800 text-center">Tipe SP</th>
                  <th className="py-3 px-3 border-r border-gray-800 text-center">Mulai SP</th>
                  <th className="py-3 px-3 border-r border-gray-800 text-center">Berakhir SP</th>
                  <th className="py-3 px-3 border-r border-gray-800 text-center">Status</th>
                  <th className="py-3 px-3 border-r border-gray-800 text-right">Performa SMT</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300 font-medium">
                {filteredSpList.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-yellow-50/80 transition-colors ${
                      idx % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-black text-center border-r border-gray-200">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-gray-200">
                      <span className="font-black text-black block leading-tight">{r.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono">NIP: {r.nip}</span>
                    </td>
                    <td className="py-2.5 px-3 border-r border-gray-200 font-bold uppercase text-gray-700">
                      {r.zone}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-gray-200 font-black">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-lg border text-[11px] font-black ${
                          r.spType === 'S2'
                            ? 'bg-[#FF3E83] text-white border-black'
                            : 'bg-[#FFE600] text-black border-black'
                        }`}
                      >
                        {r.spType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-gray-200 font-bold text-gray-700">
                      {r.startDate}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-gray-200 font-black text-black">
                      {r.expiredDate}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-gray-200">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-black ${
                          r.status === 'AKTIF'
                            ? 'bg-amber-100 text-amber-900 border-amber-400'
                            : 'bg-gray-200 text-gray-700 border-gray-400'
                        }`}
                      >
                        {r.status === 'AKTIF' ? `Aktif (${r.remainingDays}h)` : 'Expired'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right border-r border-gray-200 font-black text-emerald-700">
                      {r.smt ? `${r.smt.ytd.rawSales} (Rank #${r.smt.ytd.rank})` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {r.smt ? (
                        <button
                          onClick={() => onSelectSmt(r.smt!)}
                          className="p-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg border border-black transition-transform hover:scale-105 cursor-pointer"
                          title="Buka Raport SMT Karyawan"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#FFE600]" />
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Policy & Guidance Note Bento Card */}
      <div className="bg-white border-3 border-black rounded-3xl p-5 bento-shadow">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">💡</span>
          <h4 className="text-base font-black font-display uppercase text-black">
            Ketentuan & Kebijakan Disiplin SMT Alsut 2026
          </h4>
        </div>
        <p className="text-xs font-semibold text-gray-700 leading-relaxed">
          Surat Peringatan (SP 1 dan SP 2) memiliki masa berlaku selama 6 bulan kalender sejak diterbitkan. 
          Karyawan dengan SP aktif tetap diwajibkan memenuhi target sales bulanan, Furnipro, dan Clean & Care 
          sesuai standar evaluasi Store Alam Sutera. Data ini terintegrasi langsung dengan kartu raport SMT.
        </p>
      </div>

    </div>
  );
};
