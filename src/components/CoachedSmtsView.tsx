import React, { useState, useEffect, useMemo } from 'react';
import { SmtRecord } from '../types';
import {
  getCoachingRecord,
  SmtCoachingRecord,
  subscribeToCoachingUpdates,
  getSyncStatus,
  subscribeToSyncStatus,
  forceSyncNow,
  SyncStatus,
} from '../utils/coachingStorage';
import {
  Users,
  Search,
  CheckCircle2,
  Calendar,
  FileText,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  FolderOpen,
  Filter,
  Check,
  ChevronRight,
  Wifi,
  CloudCheck,
  Award,
} from 'lucide-react';

interface CoachedSmtsViewProps {
  smtList: SmtRecord[];
  onSelectSmt: (smt: SmtRecord) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onNavigateToBottom20?: () => void;
}

export const CoachedSmtsView: React.FC<CoachedSmtsViewProps> = ({
  smtList,
  onSelectSmt,
  searchQuery = '',
  onSearchChange,
  onNavigateToBottom20,
}) => {
  const [coachingMap, setCoachingMap] = useState<Record<string, SmtCoachingRecord>>({});
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'sessions_desc' | 'latest_date' | 'rank_asc' | 'sales_asc' | 'name_asc'>('sessions_desc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus());
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Subscribe to coaching record updates
  useEffect(() => {
    const updateLocalMap = () => {
      const map: Record<string, SmtCoachingRecord> = {};
      smtList.forEach((smt) => {
        map[smt.nip] = getCoachingRecord(smt.nip);
      });
      setCoachingMap(map);
    };

    updateLocalMap();
    const unsub = subscribeToCoachingUpdates(updateLocalMap);
    return unsub;
  }, [smtList]);

  // Subscribe to sync status
  useEffect(() => {
    const unsub = subscribeToSyncStatus((status) => {
      setSyncStatus(status);
    });
    return unsub;
  }, []);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      await forceSyncNow();
    } finally {
      setTimeout(() => setIsManualSyncing(false), 600);
    }
  };

  // Filter SMTs that have at least 1 coaching session or checked week or custom log
  const coachedSmts = useMemo(() => {
    return smtList.filter((smt) => {
      const rec = coachingMap[smt.nip];
      if (!rec) return false;
      const hasLogs = (rec.customLogs && rec.customLogs.length > 0);
      const hasChecklist = (rec.totalCount && rec.totalCount > 0);
      return hasLogs || hasChecklist;
    });
  }, [smtList, coachingMap]);

  // Available unique zones
  const availableZones = useMemo(() => {
    const set = new Set<string>();
    coachedSmts.forEach((s) => {
      if (s.zone) set.add(s.zone);
    });
    return Array.from(set);
  }, [coachedSmts]);

  // Total statistics
  const stats = useMemo(() => {
    let totalSessions = 0;
    let totalDocs = 0;
    let totalWithLetter = 0;
    let salesSum = 0;

    coachedSmts.forEach((smt) => {
      const rec = coachingMap[smt.nip];
      if (rec) {
        totalSessions += (rec.totalCount || rec.customLogs?.length || 0);
        rec.customLogs?.forEach((l) => {
          if (l.attachments && l.attachments.length > 0) totalDocs += l.attachments.length;
          if (l.letterNumber && l.letterNumber.trim()) totalWithLetter++;
        });
      }
      salesSum += smt.ytd.salesPct;
    });

    const avgSales = coachedSmts.length > 0 ? Math.round(salesSum / coachedSmts.length) : 0;

    return {
      totalSmts: coachedSmts.length,
      totalSessions,
      totalDocs,
      totalWithLetter,
      avgSales,
    };
  }, [coachedSmts, coachingMap]);

  // Filtered and Sorted list
  const filteredAndSortedSmts = useMemo(() => {
    let list = [...coachedSmts];

    // Search query
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((smt) => {
        const matchName = smt.nama.toLowerCase().includes(q);
        const matchNip = smt.nip.toLowerCase().includes(q);
        const matchZone = smt.zone.toLowerCase().includes(q);
        const rec = coachingMap[smt.nip];
        const matchLogs = rec?.customLogs?.some(
          (l) =>
            l.topic?.toLowerCase().includes(q) ||
            l.notes?.toLowerCase().includes(q) ||
            l.coachName?.toLowerCase().includes(q) ||
            l.letterNumber?.toLowerCase().includes(q)
        );
        return matchName || matchNip || matchZone || matchLogs;
      });
    }

    // Zone filter
    if (selectedZone !== 'ALL') {
      list = list.filter((s) => s.zone === selectedZone);
    }

    // Category filter
    if (selectedCategory !== 'ALL') {
      list = list.filter((smt) => {
        const rec = coachingMap[smt.nip];
        if (!rec) return false;
        if (selectedCategory === 'HAS_DOCS') {
          return rec.customLogs?.some((l) => (l.attachments && l.attachments.length > 0) || l.letterNumber || l.driveUrl);
        }
        if (selectedCategory === 'SALES') {
          return rec.customLogs?.some((l) => l.salesChecked) || Object.values(rec.checkedWeeks || {}).some((w) => Object.values(w).some(Boolean));
        }
        if (selectedCategory === 'FURNIPRO') {
          return rec.customLogs?.some((l) => l.furniproChecked) || Object.values(rec.checkedFurniproWeeks || {}).some((w) => Object.values(w).some(Boolean));
        }
        if (selectedCategory === 'COMSER') {
          return rec.customLogs?.some((l) => l.comserChecked) || Object.values(rec.checkedComserWeeks || {}).some((w) => Object.values(w).some(Boolean));
        }
        return true;
      });
    }

    // Sorting
    list.sort((a, b) => {
      const recA = coachingMap[a.nip];
      const recB = coachingMap[b.nip];
      const countA = recA?.totalCount || recA?.customLogs?.length || 0;
      const countB = recB?.totalCount || recB?.customLogs?.length || 0;

      switch (sortBy) {
        case 'sessions_desc':
          return countB - countA;
        case 'sales_asc':
          return a.ytd.salesPct - b.ytd.salesPct;
        case 'rank_asc':
          return a.ytd.rank - b.ytd.rank;
        case 'name_asc':
          return a.nama.localeCompare(b.nama);
        case 'latest_date': {
          const logDateA = recA?.customLogs?.[0]?.date || '';
          const logDateB = recB?.customLogs?.[0]?.date || '';
          return logDateB.localeCompare(logDateA);
        }
        default:
          return countB - countA;
      }
    });

    return list;
  }, [coachedSmts, coachingMap, searchQuery, selectedZone, selectedCategory, sortBy]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Hero Header */}
      <div className="bg-white border-3 border-black rounded-3xl p-6 sm:p-8 bento-shadow relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#FFE600]/25 via-[#06D6A0]/20 to-[#FF3E83]/10 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 bg-black text-[#FFE600] rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000]">
                <Users className="w-3.5 h-3.5" />
                Menu Khusus Supervisi
              </span>

              {/* Multi-Device Sync Indicator */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border-2 border-black ${
                  syncStatus.serverConnected
                    ? 'bg-emerald-100 text-emerald-900'
                    : syncStatus.isOnline
                    ? 'bg-yellow-100 text-yellow-900'
                    : 'bg-red-100 text-red-900'
                }`}
                title={
                  syncStatus.serverConnected
                    ? 'Terhubung dengan database server Alsut. Semua device terupdate realtime.'
                    : 'Mode Offline / Local. Data tersimpan di HP/PC ini.'
                }
              >
                <span className={`w-2.5 h-2.5 rounded-full ${syncStatus.serverConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>
                  {syncStatus.serverConnected
                    ? 'Multi-Device Online & Terkoneksi'
                    : 'Menghubungkan Server...'}
                </span>
                {syncStatus.lastSyncedAt && (
                  <span className="hidden sm:inline text-[10px] opacity-75 font-semibold">
                    ({syncStatus.lastSyncedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})
                  </span>
                )}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-black flex items-center gap-3">
              <span>SMT Yang Sudah Pernah Dipanggil</span>
              <span className="bg-[#FFE600] text-black text-sm px-3 py-0.5 rounded-full border-2 border-black font-black">
                {coachedSmts.length} SMT
              </span>
            </h1>

            <p className="text-sm font-medium text-gray-600 max-w-3xl leading-relaxed">
              Daftar terpusat seluruh Sales Merchandising Team (SMT) yang telah menjalani sesi pemanggilan, pembinaan berkala, penandatanganan komitmen, maupun tindak lanjut SPV Store Alsut. Data otomatis tersinkronisasi antar semua perangkat HP dan PC.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={handleManualSync}
              disabled={isManualSyncing || syncStatus.isSyncing}
              className="flex items-center gap-2 px-4 py-2.5 bg-black text-white hover:bg-neutral-800 active:scale-95 border-2 border-black rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-[3px_3px_0px_0px_#FFE600] disabled:opacity-50"
              title="Sinkronkan data coaching dari server sekarang"
            >
              <RefreshCw className={`w-4 h-4 text-[#FFE600] ${isManualSyncing || syncStatus.isSyncing ? 'animate-spin' : ''}`} />
              <span>{isManualSyncing ? 'Menyinkronkan...' : 'Sync Semua Device'}</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t-2 border-dashed border-gray-200">
          <div className="bg-[#F8F9FB] border-2 border-black rounded-2xl p-3.5 relative overflow-hidden group hover:bg-white transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-600 uppercase">SMT Dipanggil</span>
              <span className="w-7 h-7 rounded-xl bg-black text-[#FFE600] flex items-center justify-center font-black text-xs">
                👤
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black font-display text-black">{stats.totalSmts}</span>
              <span className="text-xs font-bold text-gray-500">dari {smtList.length} SMT</span>
            </div>
            <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#FF3E83] h-full rounded-full transition-all duration-700"
                style={{ width: `${smtList.length > 0 ? (stats.totalSmts / smtList.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="bg-[#F8F9FB] border-2 border-black rounded-2xl p-3.5 relative overflow-hidden group hover:bg-white transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-600 uppercase">Total Sesi Coaching</span>
              <span className="w-7 h-7 rounded-xl bg-black text-[#06D6A0] flex items-center justify-center font-black text-xs">
                📝
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black font-display text-black">{stats.totalSessions}</span>
              <span className="text-xs font-bold text-gray-500">Sesi Tercatat</span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-700 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Termasuk checklist mingguan
            </p>
          </div>

          <div className="bg-[#F8F9FB] border-2 border-black rounded-2xl p-3.5 relative overflow-hidden group hover:bg-white transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-600 uppercase">Berkas & Memo</span>
              <span className="w-7 h-7 rounded-xl bg-black text-[#FFD166] flex items-center justify-center font-black text-xs">
                📁
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black font-display text-black">{stats.totalDocs}</span>
              <span className="text-xs font-bold text-gray-500">Lampiran Bukti</span>
            </div>
            <p className="text-[11px] font-semibold text-gray-500 mt-2">
              {stats.totalWithLetter} sesi memiliki No. Memo / SK
            </p>
          </div>

          <div className="bg-[#F8F9FB] border-2 border-black rounded-2xl p-3.5 relative overflow-hidden group hover:bg-white transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-600 uppercase">Rata-rata Sales SMT</span>
              <span className="w-7 h-7 rounded-xl bg-black text-white flex items-center justify-center font-black text-xs">
                📊
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black font-display text-black">{stats.avgSales}%</span>
              <span className="text-xs font-bold text-gray-500">YTD Ach</span>
            </div>
            <p className="text-[11px] font-semibold text-gray-500 mt-2">
              Supervisi peningkatan kinerja
            </p>
          </div>
        </div>
      </div>

      {/* Filter, Search & View Controls */}
      <div className="bg-white border-3 border-black rounded-2xl p-4 bento-shadow flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari SMT dipanggil (NIP, Nama, Topik Pembinaan, Coach)..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FB] border-2 border-black rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#FFE600]"
          />
        </div>

        {/* Filter Zone */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-[#F8F9FB] border-2 border-black px-2 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-gray-500 ml-1" />
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="bg-transparent text-xs font-black focus:outline-none cursor-pointer pr-2"
            >
              <option value="ALL">Semua Zona ({coachedSmts.length})</option>
              {availableZones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Category */}
          <div className="flex items-center gap-1 bg-[#F8F9FB] border-2 border-black px-2 py-1.5 rounded-xl">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-black focus:outline-none cursor-pointer pr-2"
            >
              <option value="ALL">Semua Jenis Pembinaan</option>
              <option value="HAS_DOCS">Memiliki Berkas / Memo</option>
              <option value="SALES">Fokus Sales</option>
              <option value="FURNIPRO">Fokus Furnipro</option>
              <option value="COMSER">Fokus Clean Care</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1 bg-[#F8F9FB] border-2 border-black px-2 py-1.5 rounded-xl">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-black focus:outline-none cursor-pointer pr-2"
            >
              <option value="sessions_desc">Sesi Terbanyak</option>
              <option value="latest_date">Tanggal Terbaru</option>
              <option value="rank_asc">Ranking Terbawah</option>
              <option value="sales_asc">Sales Terendah</option>
              <option value="name_asc">Nama SMT (A-Z)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border-2 border-black rounded-xl overflow-hidden bg-white">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-xs font-black transition-colors ${
                viewMode === 'cards' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              Kartu
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-black transition-colors ${
                viewMode === 'table' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              Tabel
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering */}
      {filteredAndSortedSmts.length > 0 ? (
        viewMode === 'cards' ? (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredAndSortedSmts.map((smt) => {
              const rec = coachingMap[smt.nip];
              const totalSessions = rec?.totalCount || rec?.customLogs?.length || 0;
              const latestLog = rec?.customLogs?.[0];
              const hasDocs = rec?.customLogs?.some((l) => l.attachments && l.attachments.length > 0);
              const driveUrl = rec?.driveUrl;

              return (
                <div
                  key={smt.id}
                  className="bg-white border-3 border-black rounded-2xl sm:rounded-3xl p-5 bento-shadow flex flex-col justify-between hover:-translate-y-1 transition-all group"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-black text-[#FFE600] font-black text-xs flex items-center justify-center shrink-0 border border-black shadow-[2px_2px_0px_0px_#FFE600]">
                          #{smt.ytd.rank}
                        </span>
                        <div>
                          <h3 className="text-base font-black text-black group-hover:text-[#FF3E83] transition-colors leading-tight">
                            {smt.nama}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-black bg-yellow-200 text-black px-1.5 py-0.2 rounded border border-black">
                              NIP: {smt.nip}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500">
                              {smt.zone}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 bg-black text-[#06D6A0] rounded-xl text-xs font-black border border-black shrink-0">
                        {totalSessions} Sesi
                      </span>
                    </div>

                    {/* Performance Chips */}
                    <div className="grid grid-cols-3 gap-2 mt-4 p-2.5 bg-[#F8F9FB] rounded-xl border border-gray-200 text-center">
                      <div>
                        <span className="text-[9px] font-black text-gray-500 block uppercase">Sales YTD</span>
                        <span
                          className={`text-xs font-black ${
                            smt.ytd.salesPct >= 100
                              ? 'text-emerald-700'
                              : smt.ytd.salesPct >= 80
                              ? 'text-amber-700'
                              : 'text-red-600'
                          }`}
                        >
                          {smt.ytd.salesPct}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-gray-500 block uppercase">Furnipro</span>
                        <span className="text-xs font-black text-black">
                          {smt.ytd.polisCount} Polis
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-gray-500 block uppercase">Clean Care</span>
                        <span className="text-xs font-black text-black">
                          {smt.ytd.comserVal > 0 ? `${(smt.ytd.comserVal / 1000000).toFixed(1)}Jt` : '0'}
                        </span>
                      </div>
                    </div>

                    {/* Latest Coaching Summary */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-black text-gray-700 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          Sesi Terakhir:
                        </span>
                        <span className="text-[11px] font-bold text-gray-500">
                          {latestLog?.date || 'Checklist Mingguan'}
                        </span>
                      </div>

                      {latestLog ? (
                        <div className="bg-yellow-50/70 border border-yellow-300/80 rounded-xl p-2.5 text-xs">
                          <div className="flex items-center justify-between gap-1 font-black text-black">
                            <span className="line-clamp-1">{latestLog.topic}</span>
                            {latestLog.letterNumber && (
                              <span className="text-[9px] font-extrabold bg-[#FF3E83] text-white px-1.5 py-0.2 rounded shrink-0">
                                Memo
                              </span>
                            )}
                          </div>
                          {latestLog.notes && (
                            <p className="text-[11px] text-gray-600 font-medium line-clamp-2 mt-1">
                              "{latestLog.notes}"
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-yellow-200/60 text-[10px] text-gray-500 font-bold">
                            <span>Coach: {latestLog.coachName || 'SPV Alsut'}</span>
                            {latestLog.attachments && latestLog.attachments.length > 0 && (
                              <span className="text-emerald-700 font-black flex items-center gap-0.5">
                                📎 {latestLog.attachments.length} Berkas
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-2 text-center text-xs text-gray-500 font-semibold">
                          Tercatat {totalSessions} centang sesi supervisi mingguan.
                        </div>
                      )}
                    </div>

                    {/* Google Drive Link if exists */}
                    {driveUrl && (
                      <a
                        href={driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center justify-between px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-blue-800 text-[11px] font-black transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                          Folder Dokumen Google Drive SMT
                        </span>
                        <ExternalLink className="w-3 h-3 text-blue-600" />
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 border-t-2 border-black flex items-center gap-2">
                    <button
                      onClick={() => onSelectSmt(smt)}
                      className="flex-1 py-2.5 px-3 bg-black hover:bg-neutral-800 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_#FFE600] transition-all"
                    >
                      <span>Buka Raport & Catat Sesi</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#FFE600]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white border-3 border-black rounded-3xl bento-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-black text-white font-black uppercase tracking-wider text-[11px] border-b-2 border-black">
                    <th className="p-3.5 text-center w-12">#</th>
                    <th className="p-3.5">SMT Profile</th>
                    <th className="p-3.5">Zona</th>
                    <th className="p-3.5 text-center">Total Panggilan</th>
                    <th className="p-3.5 text-right">Sales YTD</th>
                    <th className="p-3.5 text-right">Furnipro</th>
                    <th className="p-3.5 text-right">Clean Care</th>
                    <th className="p-3.5">Sesi Terakhir</th>
                    <th className="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-100 font-bold">
                  {filteredAndSortedSmts.map((smt, idx) => {
                    const rec = coachingMap[smt.nip];
                    const totalSessions = rec?.totalCount || rec?.customLogs?.length || 0;
                    const latestLog = rec?.customLogs?.[0];

                    return (
                      <tr key={smt.id} className="hover:bg-yellow-50/60 transition-colors">
                        <td className="p-3.5 text-center">
                          <span className="w-6 h-6 rounded-lg bg-black text-white font-black text-xs inline-flex items-center justify-center">
                            #{smt.ytd.rank}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-black text-sm text-black">{smt.nama}</div>
                          <div className="text-[10px] text-gray-500 font-bold">NIP: {smt.nip}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-gray-100 rounded-md border border-gray-300 text-[11px] font-black">
                            {smt.zone}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="px-2.5 py-1 bg-black text-[#FFE600] rounded-xl font-black text-xs border border-black shadow-[1px_1px_0px_0px_#000]">
                            {totalSessions} Sesi
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-black">
                          <span
                            className={
                              smt.ytd.salesPct >= 100
                                ? 'text-emerald-700'
                                : smt.ytd.salesPct >= 80
                                ? 'text-amber-700'
                                : 'text-red-600'
                            }
                          >
                            {smt.ytd.salesPct}%
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-black">{smt.ytd.polisCount} Polis</td>
                        <td className="p-3.5 text-right font-black">
                          {smt.ytd.comserVal > 0 ? `${(smt.ytd.comserVal / 1000000).toFixed(1)}Jt` : '0'}
                        </td>
                        <td className="p-3.5 max-w-xs">
                          {latestLog ? (
                            <div>
                              <div className="text-[11px] font-black text-black truncate">
                                {latestLog.topic}
                              </div>
                              <div className="text-[10px] text-gray-500 font-medium truncate">
                                {latestLog.date} • {latestLog.coachName || 'SPV'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400 font-medium">Checklist Terisi</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => onSelectSmt(smt)}
                            className="px-3 py-1.5 bg-black text-white hover:bg-neutral-800 rounded-xl font-black text-[11px] uppercase tracking-wider cursor-pointer shadow-[2px_2px_0px_0px_#FFE600] transition-all"
                          >
                            Buka Raport
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="bg-white border-3 border-black rounded-3xl p-10 bento-shadow text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-yellow-100 border-2 border-black flex items-center justify-center text-3xl mx-auto shadow-[3px_3px_0px_0px_#000]">
            📋
          </div>

          <h3 className="text-xl font-black font-display uppercase tracking-tight text-black">
            {coachedSmts.length === 0
              ? 'Belum Ada SMT Yang Tercatat Pernah Dipanggil'
              : 'Tidak Ada SMT Yang Cocok Dengan Pencarian / Filter'}
          </h3>

          <p className="text-xs font-semibold text-gray-600 leading-relaxed">
            {coachedSmts.length === 0
              ? 'Catat pemanggilan atau evaluasi SMT melalui tombol Raport pada menu Bento Cards atau Menu 20 Rank Terbawah. Semua sesi dan komitmen akan langsung muncul di menu ini dan tersinkronisasi otomatis ke semua device.'
              : 'Coba ubah kata kunci pencarian NIP/Nama atau ganti pilihan filter zona/kategori di atas.'}
          </p>

          {coachedSmts.length === 0 && onNavigateToBottom20 && (
            <button
              onClick={onNavigateToBottom20}
              className="mt-2 inline-flex items-center gap-2 px-5 py-3 bg-[#EF476F] text-white hover:bg-[#d9385f] active:scale-95 border-2 border-black rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-[3px_3px_0px_0px_#000] transition-all"
            >
              <span>Lihat 20 SMT Rank Terbawah (Prioritas Pemanggilan)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
