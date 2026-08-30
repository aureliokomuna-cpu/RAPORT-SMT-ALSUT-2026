import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Trophy, 
  Sparkles, 
  Printer, 
  Share2, 
  Check, 
  Flame, 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  Calendar, 
  TrendingUp, 
  ArrowLeft, 
  ArrowRight,
  Award,
  Zap,
  Info,
  CheckCircle2,
  UserCheck,
  CheckSquare,
  Square,
  PlusCircle,
  Trash2,
  MessageSquare
} from 'lucide-react';
import { MonthKey, SmtRecord } from '../types';
import { formatCompactRupiah, formatPct, formatRupiah, MONTH_CONFIGS } from '../utils/parser';
import { 
  getCoachingRecord, 
  toggleMonthCoaching, 
  addCustomCoachingLog, 
  removeCustomCoachingLog,
  subscribeToCoachingUpdates,
  SmtCoachingRecord 
} from '../utils/coachingStorage';

interface SmtDetailModalProps {
  smt: SmtRecord | null;
  onClose: () => void;
  onNavigate?: (direction: 'next' | 'prev') => void;
}

export const SmtDetailModal: React.FC<SmtDetailModalProps> = ({
  smt,
  onClose,
  onNavigate,
}) => {
  const [copied, setCopied] = useState(false);
  const [coachingData, setCoachingData] = useState<SmtCoachingRecord>(() => 
    smt ? getCoachingRecord(smt.nip) : {
      nip: '',
      checkedMonths: { jan: false, feb: false, mar: false, apr: false, may: false, jun: false, jul: false },
      customLogs: [],
      totalCount: 0,
    }
  );

  const [newTopic, setNewTopic] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [showAddLog, setShowAddLog] = useState(false);

  useEffect(() => {
    if (smt) {
      setCoachingData(getCoachingRecord(smt.nip));
      const unsubscribe = subscribeToCoachingUpdates(() => {
        setCoachingData(getCoachingRecord(smt.nip));
      });
      return unsubscribe;
    }
  }, [smt?.nip]);

  if (!smt) return null;

  const handleToggleMonth = (monthKey: MonthKey) => {
    const updated = toggleMonthCoaching(smt.nip, monthKey);
    setCoachingData({ ...updated });
    if (updated.checkedMonths[monthKey]) {
      confetti({
        particleCount: 35,
        spread: 40,
        origin: { y: 0.7 },
        colors: ['#06D6A0', '#FFE600', '#118AB2']
      });
    }
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    const updated = addCustomCoachingLog(smt.nip, newTopic.trim(), newNotes.trim());
    setCoachingData({ ...updated });
    setNewTopic('');
    setNewNotes('');
    setShowAddLog(false);
    confetti({
      particleCount: 45,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#FFE600', '#FF3E83', '#06D6A0']
    });
  };

  const handleRemoveLog = (logId: string) => {
    const updated = removeCustomCoachingLog(smt.nip, logId);
    setCoachingData({ ...updated });
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFE600', '#FF3E83', '#06D6A0', '#118AB2', '#A78BFA'],
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `📋 RAPORT SMT 2026 ALSUTERS\nNama: ${smt.nama} (NIP: ${smt.nip})\nZona: ${smt.zone}\nRank: #${smt.ytd.rank} | Grade: ${smt.ytd.overallGrade}\nYTD Sales: ${smt.ytd.rawSales}\nPolis Furnipro: ${smt.ytd.polisCount} Polis\nClean & Care: ${smt.ytd.rawComser}\nBulan Achieved: ${smt.ytd.salesAchCount}/7 Bulan\nStatus: ${smt.ytd.evaluationResult}\nAura Tag: ${smt.ytd.genzTag}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    triggerConfetti();
    setTimeout(() => setCopied(false), 2500);
  };

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-[#F4F5F8] border-4 border-black rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col bento-shadow-lg relative overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Toolbar */}
        <div className="bg-white border-b-3 border-black p-4 sm:p-5 flex items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#FFE600] border-2 border-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_0px_#000]">
              📋
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                Kartu Raport SMT Alsuters 2026
              </span>
              <h2 className="text-base sm:text-lg font-black font-display text-black uppercase leading-tight">
                {smt.nama}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={triggerConfetti}
              title="Selebrasi Aura SMT"
              className="px-3 py-1.5 bg-[#FFE600] hover:bg-yellow-300 border-2 border-black rounded-xl text-xs font-black uppercase flex items-center gap-1.5 bento-shadow-sm cursor-pointer"
            >
              <span>🎉</span>
              <span className="hidden sm:inline">Aura Blast</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 bg-white hover:bg-gray-100 border-2 border-black rounded-xl text-xs font-black uppercase flex items-center gap-1.5 bento-shadow-sm cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-black" />}
              <span className="hidden sm:inline">{copied ? 'Tersalin!' : 'Bagikan'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white hover:bg-gray-100 border-2 border-black rounded-xl text-xs font-black uppercase flex items-center gap-1.5 bento-shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-black" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 bg-black hover:bg-gray-800 text-white rounded-xl border-2 border-black flex items-center justify-center font-black text-sm cursor-pointer transition-transform hover:scale-105"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Scrollable Content: Raport Bento Card Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Main Character Header Bento Banner */}
          <div className="bg-[#FFE600] border-3 border-black rounded-3xl p-5 sm:p-6 bento-shadow relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-black text-white border-3 border-black flex items-center justify-center font-display font-black text-2xl sm:text-3xl shadow-[4px_4px_0px_0px_#FFF] shrink-0">
                  {smt.nama.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-black text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                      #{smt.ytd.rank} Top SMT
                    </span>
                    <span className="bg-white text-black font-black text-xs px-3 py-1 rounded-full border-2 border-black uppercase">
                      {smt.zone}
                    </span>
                    <span className="text-xs font-mono font-bold bg-black/10 px-2 py-0.5 rounded-lg border border-black/30">
                      NIP: {smt.nip}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-black uppercase tracking-tight mt-2">
                    {smt.nama}
                  </h1>
                  <p className="text-xs sm:text-sm font-extrabold text-black/80 flex items-center gap-1.5 mt-0.5">
                    <Sparkles className="w-4 h-4 text-purple-800" />
                    <span>{smt.ytd.genzTag}</span>
                    <span className="opacity-60">•</span>
                    <span className="italic font-medium">{smt.ytd.genzTagline}</span>
                  </p>
                </div>
              </div>

              {/* Overall Grade Pill */}
              <div className="bg-white border-3 border-black rounded-2xl p-3 sm:p-4 text-center min-w-[130px] shadow-[3px_3px_0px_0px_#000] self-start md:self-auto">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Grade Semester
                </p>
                <p className="text-4xl sm:text-5xl font-black font-display text-black leading-none my-0.5">
                  {smt.ytd.overallGrade}
                </p>
                <span className="inline-block text-[10px] font-black bg-black text-[#FFE600] px-2 py-0.5 rounded-md">
                  Aura: {smt.ytd.auraScore.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="absolute -right-8 -bottom-8 opacity-10 text-9xl font-black pointer-events-none select-none">
              🔥
            </div>
          </div>

          {/* Triad Metric Highlights Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white border-3 border-black rounded-3xl p-4 bento-shadow">
              <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                YTD Sales Achievement
              </span>
              <p className="text-3xl sm:text-4xl font-black font-display text-emerald-600 my-1">
                {smt.ytd.rawSales}
              </p>
              <div className="flex items-center justify-between text-xs font-bold text-gray-600 pt-1 border-t border-gray-200">
                <span>Target Status:</span>
                <span className="text-black font-black">
                  {smt.ytd.salesPct >= 100 ? '✅ ACHIEVED' : '⏳ UNDER TARGET'}
                </span>
              </div>
            </div>

            <div className="bg-white border-3 border-black rounded-3xl p-4 bento-shadow">
              <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                Furnipro Protection (FP)
              </span>
              <p className="text-3xl sm:text-4xl font-black font-display text-indigo-600 my-1">
                {smt.ytd.polisCount} <span className="text-lg font-bold text-gray-500">Polis</span>
              </p>
              <div className="flex items-center justify-between text-xs font-bold text-gray-600 pt-1 border-t border-gray-200">
                <span>Target FP Bulan:</span>
                <span className="text-black font-black">{smt.ytd.furniproAchCount} Achieved</span>
              </div>
            </div>

            <div className="bg-white border-3 border-black rounded-3xl p-4 bento-shadow">
              <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                Clean & Care (Comser)
              </span>
              <p className="text-2xl sm:text-3xl font-black font-display text-teal-600 my-1">
                {smt.ytd.rawComser}
              </p>
              <div className="flex items-center justify-between text-xs font-bold text-gray-600 pt-1 border-t border-gray-200">
                <span>Target Comser:</span>
                <span className="text-black font-black">{smt.ytd.commserAchCount} Achieved</span>
              </div>
            </div>
          </div>

          {/* Section: Penilaian Akhir Tiap Bulan SMT (JAN to JUL) */}
          <div className="bg-white border-3 border-black rounded-3xl p-5 bento-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b-2 border-gray-200">
              <div>
                <span className="bg-[#06D6A0] text-black font-black text-[10px] px-2.5 py-0.5 rounded-full border border-black uppercase tracking-wider">
                  Breakdown 7 Bulan
                </span>
                <h3 className="text-lg sm:text-xl font-black font-display text-black mt-1">
                  Penilaian & Evaluasi Tiap Bulan SMT
                </h3>
              </div>
              <div className="text-xs font-bold text-gray-600 bg-gray-100 border border-black px-3 py-1 rounded-xl">
                Total Bulan Lolos Target: <strong className="text-black font-black">{smt.ytd.salesAchCount} dari 7 Bulan</strong>
              </div>
            </div>

            {/* Monthly Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {MONTH_CONFIGS.map((m) => {
                const data = smt.monthly[m.key];
                return (
                  <div
                    key={m.key}
                    className={`border-2 border-black rounded-2xl p-3.5 flex flex-col justify-between transition-all ${
                      data.isAchieved ? 'bg-[#F9FAFB] shadow-[2px_2px_0px_0px_#000]' : 'bg-gray-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-7 h-7 rounded-lg bg-black text-white font-black text-xs flex items-center justify-center">
                            {m.short}
                          </span>
                          <span className="text-xs font-black text-gray-800 uppercase">
                            {m.name}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000] ${getGradeBg(
                            data.grade
                          )}`}
                        >
                          Grade {data.grade}
                        </span>
                      </div>

                      {/* Numbers */}
                      <div className="bg-white border border-black rounded-xl p-2.5 space-y-1.5 mb-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-500">Sales Ach:</span>
                          <span className="font-black text-sm text-black">
                            {data.rawSales}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-500">Furnipro (FP):</span>
                          <span className="font-black text-black">
                            {data.fpCount} Polis
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-500">Clean & Care:</span>
                          <span className="font-black text-black">
                            {formatCompactRupiah(data.ccVal)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Gen-Z Vibe Badge & Evaluation Comment */}
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-black text-purple-700 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded-md">
                          {data.vibe}
                        </span>
                        {data.rankInMonth && (
                          <span className="text-[10px] font-bold text-gray-500">
                            Rank #{data.rankInMonth}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-medium text-gray-700 leading-tight italic bg-gray-100/80 p-1.5 rounded-lg border border-gray-300">
                        "{data.comment}"
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Historical SP & Kedisiplinan Karyawan */}
          <div className="bg-white border-3 border-black rounded-3xl p-5 bento-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b-2 border-gray-200">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#FF3E83] text-white border-2 border-black flex items-center justify-center font-black text-sm">
                  ⚠️
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black font-display text-black uppercase">
                    Riwayat & Status Surat Peringatan (SP)
                  </h3>
                  <p className="text-[11px] font-bold text-gray-500">
                    Audit kepatuhan dan catatan disiplin berdasarkan NIP ({smt.nip})
                  </p>
                </div>
              </div>

              {smt.spList && smt.spList.length > 0 ? (
                <span className="bg-[#FF3E83] text-white font-black text-xs px-3 py-1 rounded-full border-2 border-black uppercase flex items-center gap-1">
                  🚨 Ada {smt.spList.length} Catatan SP
                </span>
              ) : (
                <span className="bg-[#06D6A0] text-black font-black text-xs px-3 py-1 rounded-full border-2 border-black uppercase flex items-center gap-1">
                  ✨ Bersih (Tidak Ada SP)
                </span>
              )}
            </div>

            {smt.spList && smt.spList.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {smt.spList.map((sp) => (
                    <div
                      key={sp.id}
                      className="border-2 border-black rounded-2xl p-3.5 bg-yellow-50/70 shadow-[2px_2px_0px_0px_#000] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg border border-black font-black text-xs uppercase ${
                              sp.spType === 'S2' ? 'bg-[#FF3E83] text-white' : 'bg-[#FFE600] text-black'
                            }`}
                          >
                            {sp.spLabel}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                              sp.status === 'AKTIF'
                                ? 'bg-amber-200 text-amber-950 border-amber-500'
                                : 'bg-gray-200 text-gray-700 border-gray-400'
                            }`}
                          >
                            {sp.status === 'AKTIF' ? `⏳ AKTIF (${sp.remainingDays} Hari Lagi)` : '✅ EXPIRED'}
                          </span>
                        </div>

                        <div className="bg-white border border-black rounded-xl p-2.5 text-xs space-y-1 my-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500 font-bold">Mulai Berlaku:</span>
                            <span className="font-black text-black">{sp.startDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 font-bold">Berakhir Pada:</span>
                            <span className="font-black text-black">{sp.expiredDate}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] font-semibold text-gray-600 italic">
                        *Masa sanksi 6 bulan kalender. Tetap jaga performa target sales dan derivatif.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-[#F8F9FA] border-2 border-dashed border-gray-300 rounded-2xl p-4 text-center">
                <p className="text-xs font-extrabold text-emerald-700 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Karyawan ini memiliki catatan kedisiplinan prima tanpa pelanggaran SP di Store Alsut.
                </p>
              </div>
            )}
          </div>

          {/* Section: Interactive Coaching Checklist & SMT Coaching Logs */}
          <div className="bg-white border-3 border-black rounded-3xl p-5 bento-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b-2 border-gray-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#FFE600] border-2 border-black flex items-center justify-center text-xl shadow-[2px_2px_0px_0px_#000]">
                  🎯
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black font-display text-black uppercase">
                    Lembar Checklist & Histori Coaching SMT
                  </h3>
                  <p className="text-[11px] font-bold text-gray-500">
                    Catatan pembinaan 1-on-1 SPV/Manager untuk target sales, FP, Clean Care & kedisiplinan
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-black text-xs px-3 py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5 ${
                  coachingData.totalCount > 0 ? 'bg-[#06D6A0] text-black' : 'bg-[#FF3E83] text-white'
                }`}>
                  <UserCheck className="w-4 h-4" />
                  <span>Total Dicoaching: {coachingData.totalCount}x Sesi</span>
                </span>
                
                <button
                  type="button"
                  onClick={() => setShowAddLog(!showAddLog)}
                  className="px-3 py-1.5 bg-[#A78BFA] hover:bg-purple-300 text-purple-950 font-black text-xs rounded-xl border-2 border-black flex items-center gap-1 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{showAddLog ? 'Tutup Form' : '+ Catat Sesi Baru'}</span>
                </button>
              </div>
            </div>

            {/* Form to Add Custom Coaching Session */}
            {showAddLog && (
              <form onSubmit={handleAddLog} className="mb-4 bg-[#F0F2F5] border-2 border-black rounded-2xl p-4 shadow-[2px_2px_0px_0px_#000] animate-in fade-in duration-150">
                <h4 className="text-xs font-black uppercase text-black mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                  Tambah Catatan Coaching SMT Baru
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-600 block mb-1">
                      Topik / Fokus Pembinaan *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Misal: Review Target Furnipro & Closing Care"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-semibold bg-white border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFE600]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-600 block mb-1">
                      Catatan & Komitmen Tindak Lanjut SMT
                    </label>
                    <input
                      type="text"
                      placeholder="Misal: SMT berjanji follow-up 5 customer per shift"
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-semibold bg-white border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFE600]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddLog(false)}
                    className="px-3 py-1 bg-white hover:bg-gray-100 text-black border-2 border-black rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 bg-black hover:bg-gray-800 text-[#FFE600] border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-[2px_2px_0px_0px_#FFE600]"
                  >
                    Simpan Catatan Coaching 💾
                  </button>
                </div>
              </form>
            )}

            {/* 7-Month Interactive Checklist Cards */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-600">
                  Centang Evaluasi Bulanan (Klik Kotak untuk Centang):
                </span>
                <span className="text-[11px] font-bold text-gray-500">
                  Tercentang:{' '}
                  <strong className="text-black font-black">
                    {Object.values(coachingData.checkedMonths).filter(Boolean).length}/7 Bulan
                  </strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {MONTH_CONFIGS.map((m) => {
                  const isChecked = !!coachingData.checkedMonths[m.key];
                  const mData = smt.monthly[m.key];
                  return (
                    <div
                      key={m.key}
                      onClick={() => handleToggleMonth(m.key)}
                      className={`border-2 border-black rounded-2xl p-2.5 cursor-pointer transition-all hover:scale-102 flex flex-col justify-between select-none ${
                        isChecked
                          ? 'bg-[#FFE600] shadow-[2px_2px_0px_0px_#000]'
                          : 'bg-[#F8F9FA] hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-xs font-black uppercase">
                          {m.short}
                        </span>
                        <div className="w-5 h-5 rounded-md border-2 border-black flex items-center justify-center bg-white shadow-[1px_1px_0px_0px_#000]">
                          {isChecked ? (
                            <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                          ) : null}
                        </div>
                      </div>

                      <div className="text-[10px] space-y-0.5 pt-1 border-t border-black/20">
                        <div className="flex justify-between font-bold">
                          <span>Sales:</span>
                          <span className="font-black text-black">{mData.rawSales}</span>
                        </div>
                        <p className="text-[9px] font-black uppercase text-center mt-1 py-0.5 rounded bg-black/10">
                          {isChecked ? '✅ Coached' : '⏳ Belum'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Log List (If Any) */}
            {coachingData.customLogs && coachingData.customLogs.length > 0 && (
              <div className="mt-3 pt-3 border-t-2 border-gray-200">
                <h4 className="text-xs font-black uppercase text-gray-700 mb-2">
                  Riwayat Sesi Coaching Tambahan ({coachingData.customLogs.length} Catatan):
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {coachingData.customLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-purple-50/80 border-2 border-purple-300 rounded-xl p-2.5 flex items-start justify-between gap-2 text-xs shadow-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-black text-purple-900 bg-purple-200 px-2 py-0.2 rounded text-[10px]">
                            {log.topic}
                          </span>
                          <span className="text-[10px] font-semibold text-gray-500">
                            📅 {log.date}
                          </span>
                          {log.coachName && (
                            <span className="text-[10px] font-bold text-purple-700">
                              👤 {log.coachName}
                            </span>
                          )}
                        </div>
                        {log.notes && (
                          <p className="text-[11px] text-gray-700 font-medium italic mt-0.5">
                            "{log.notes}"
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLog(log.id)}
                        title="Hapus sesi coaching ini"
                        className="text-gray-400 hover:text-red-600 p-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Verdict and Coaching Action Plan */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            {/* Verdict */}
            <div className="md:col-span-6 bg-black text-white border-3 border-black rounded-3xl p-5 bento-shadow flex flex-col justify-between">
              <div>
                <span className="bg-[#FFE600] text-black px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider">
                  Official Verdict
                </span>
                <h4 className="text-2xl sm:text-3xl font-black font-display text-[#FFE600] mt-2 mb-1">
                  {smt.ytd.evaluationResult}
                </h4>
                <p className="text-xs font-medium text-gray-300 leading-relaxed mt-2">
                  Berdasarkan kalkulasi Semester 1 (Januari - Juli 2026), SMT ini mencatatkan{' '}
                  <strong className="text-white">{smt.ytd.salesAchCount} bulan</strong> achieve sales,{' '}
                  <strong className="text-white">{smt.ytd.furniproAchCount} bulan</strong> target Furnipro, dan{' '}
                  <strong className="text-white">{smt.ytd.commserAchCount} bulan</strong> target Clean & Care.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs font-bold text-gray-400">
                <span>Evaluasi Store Alsut 2026</span>
                <span className="text-[#06D6A0] font-black">Status Validated ✅</span>
              </div>
            </div>

            {/* Coaching Plan */}
            <div className="md:col-span-6 bg-white border-3 border-black rounded-3xl p-5 bento-shadow flex flex-col justify-between">
              <div>
                <span className="bg-[#A78BFA] text-purple-950 px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider">
                  💡 Action Plan & Coaching
                </span>
                <h4 className="text-lg font-black font-display text-black mt-2 mb-2">
                  Rekomendasi Peningkatan SMT
                </h4>
                
                <ul className="text-xs font-semibold text-gray-700 space-y-1.5">
                  <li className="flex items-start gap-1.5">
                    <span className="text-black font-black">1.</span>
                    <span>
                      {smt.ytd.salesPct >= 100 
                        ? 'Pertahankan momentum sales dan tingkatkan cross-selling produk turunan (Furnipro & C&C).'
                        : 'Fokus pada closing teknik harian dan maksimalkan traffic customer di zona lantai.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-black font-black">2.</span>
                    <span>
                      {smt.ytd.polisCount < 10
                        ? 'Tingkatkan penawaran perlindungan polis Furnipro di setiap transaksi furniture.'
                        : 'Jadikan best practice penjualan polis Furnipro sebagai role model di tim zona.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-black font-black">3.</span>
                    <span>
                      {smt.ytd.comserVal < 1000000
                        ? 'Optimalkan penawaran jasa Clean & Care saat follow-up after-sales customer.'
                        : 'Pertahankan omset Clean & Care yang sudah sangat luar biasa!'}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-3 text-[11px] font-black text-gray-500 text-right">
                Diperbarui untuk Alsuters 2026
              </div>
            </div>
          </div>

        </div>

        {/* Footer Navigation (Prev / Next SMT) */}
        {onNavigate && (
          <div className="bg-white border-t-3 border-black p-3 sm:p-4 flex items-center justify-between no-print">
            <button
              onClick={() => onNavigate('prev')}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>SMT Sebelumnya</span>
            </button>

            <span className="text-xs font-bold text-gray-500">
              Rank #{smt.ytd.rank}
            </span>

            <button
              onClick={() => onNavigate('next')}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer"
            >
              <span>SMT Selanjutnya</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
