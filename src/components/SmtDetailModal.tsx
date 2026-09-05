import React, { useState, useEffect, useRef } from 'react';
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
  MessageSquare,
  Image as ImageIcon,
  FileText,
  Paperclip,
  Upload,
  Download,
  Eye,
  Shield,
  Sparkle,
  FileCheck,
  Maximize2,
  FileDown
} from 'lucide-react';
import { SmtPdfExportModal } from './SmtPdfExportModal';
import { MonthKey, SmtRecord } from '../types';
import { formatCompactRupiah, formatPct, formatRupiah, MONTH_CONFIGS, getCoachingMonthConfigs } from '../utils/parser';
import { 
  getCoachingRecord, 
  toggleCategoryWeekCoaching,
  setMonthAllWeeksCoaching,
  addCustomCoachingLog, 
  addAttachmentToLog,
  removeCustomCoachingLog,
  subscribeToCoachingUpdates,
  SmtCoachingRecord,
  CoachingAttachment,
  CoachingCategory,
  WeekKey,
  WEEKS,
  ALL_MONTH_KEYS,
  getDefaultRecord
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
    smt ? getCoachingRecord(smt.nip) : getDefaultRecord('')
  );

  const coachingMonths = getCoachingMonthConfigs();
  const totalMaxWeeks = coachingMonths.length * 4;

  // Form State
  const [newTopic, setNewTopic] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newLetterNumber, setNewLetterNumber] = useState('');
  const [selectedMonthForLog, setSelectedMonthForLog] = useState<MonthKey>('sep');
  const [selectedWeekForLog, setSelectedWeekForLog] = useState<WeekKey>('w1');
  const [checkSalesInForm, setCheckSalesInForm] = useState(true);
  const [checkFurniproInForm, setCheckFurniproInForm] = useState(true);
  const [checkComserInForm, setCheckComserInForm] = useState(true);
  const [pendingAttachments, setPendingAttachments] = useState<CoachingAttachment[]>([]);
  const [showAddLog, setShowAddLog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Preview / Lightbox Modal State
  const [activePreviewAttachment, setActivePreviewAttachment] = useState<CoachingAttachment | null>(null);

  // Category view filter for matrix
  const [activeMatrixTab, setActiveMatrixTab] = useState<'all' | 'sales' | 'furnipro' | 'comser'>('all');

  // Interactive PDF Share & Export Modal
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleToggleCategoryWeek = (
    category: CoachingCategory,
    monthKey: MonthKey,
    weekKey: WeekKey
  ) => {
    const updated = toggleCategoryWeekCoaching(smt.nip, category, monthKey, weekKey);
    setCoachingData({ ...updated });
    
    // Check if the toggled week is now true
    let isNowChecked = false;
    if (category === 'sales') isNowChecked = !!updated.checkedWeeks[monthKey][weekKey];
    if (category === 'furnipro') isNowChecked = !!updated.checkedFurniproWeeks[monthKey][weekKey];
    if (category === 'comser') isNowChecked = !!updated.checkedComserWeeks[monthKey][weekKey];

    if (isNowChecked) {
      confetti({
        particleCount: 20,
        spread: 30,
        origin: { y: 0.7 },
        colors: category === 'furnipro' ? ['#6366F1', '#FFE600'] : category === 'comser' ? ['#06D6A0', '#118AB2'] : ['#FFE600', '#06D6A0']
      });
    }
  };

  const handleToggleMonthCategoryAll = (category: CoachingCategory, monthKey: MonthKey) => {
    const targetWeeks = 
      category === 'sales' 
        ? coachingData.checkedWeeks[monthKey] 
        : category === 'furnipro' 
        ? coachingData.checkedFurniproWeeks[monthKey] 
        : coachingData.checkedComserWeeks[monthKey];

    const isAllChecked = targetWeeks.w1 && targetWeeks.w2 && targetWeeks.w3 && targetWeeks.w4;
    const updated = setMonthAllWeeksCoaching(smt.nip, category, monthKey, !isAllChecked);
    setCoachingData({ ...updated });
    if (!isAllChecked) {
      confetti({
        particleCount: 35,
        spread: 40,
        origin: { y: 0.7 },
        colors: ['#FFE600', '#06D6A0', '#A78BFA']
      });
    }
  };

  // Convert File to Base64 Attachment
  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      const reader = new FileReader();

      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) return;

        const sizeInKb = Math.round(file.size / 1024);
        const formattedSize = sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`;

        const newAttachment: CoachingAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          type: isImage ? 'image' : isPdf ? 'pdf' : 'document',
          dataUrl,
          sizeFormatted: formattedSize,
          uploadedAt: new Date().toLocaleDateString('id-ID'),
        };

        setPendingAttachments((prev) => [...prev, newAttachment]);
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemovePendingAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    const updated = addCustomCoachingLog({
      nip: smt.nip,
      topic: newTopic.trim(),
      notes: newNotes.trim(),
      letterNumber: newLetterNumber.trim() || undefined,
      month: selectedMonthForLog,
      week: selectedWeekForLog,
      salesChecked: checkSalesInForm,
      furniproChecked: checkFurniproInForm,
      comserChecked: checkComserInForm,
      attachments: [...pendingAttachments],
    });

    setCoachingData({ ...updated });
    setNewTopic('');
    setNewNotes('');
    setNewLetterNumber('');
    setPendingAttachments([]);
    setShowAddLog(false);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#FFE600', '#FF3E83', '#06D6A0', '#6366F1']
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
      colors: ['#FFE600', '#FF3E83', '#06D6A0', '#118AB2']
    });
  };

  const handleCopySummary = () => {
    const text = `📊 *RAPORT SMT ALSUT 2026*
Nama: ${smt.nama} (NIP: ${smt.nip})
Zona: ${smt.zone}
Rank Toko: #${smt.ytd.rank}
Total Sales: ${smt.ytd.rawSales} (${formatPct(smt.ytd.salesPct)} Target)
Total Polis FP: ${smt.ytd.polisCount} Polis (Rata: ${(smt.ytd.polisCount / (MONTH_CONFIGS.length || 1)).toFixed(1)} Polis/bln)
Total Clean & Care: ${smt.ytd.rawComser} (Rata: ${formatCompactRupiah(smt.ytd.comserVal / (MONTH_CONFIGS.length || 1))}/bln)
Bulan Achieve Sales: ${smt.ytd.salesAchCount}/${MONTH_CONFIGS.length} Bulan
Total Coaching Selesai: ${coachingData.totalCount}x Minggu
Hasil Evaluasi: ${smt.ytd.evaluationResult}
Status: Toko Living World Alam Sutera`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    triggerConfetti();
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const isTop3 = smt.ytd.rank <= 3;
  const isAchieved = smt.ytd.salesPct >= 100;

  // Aggregate stats across all 7 months
  const totalSalesWeeksCount = ALL_MONTH_KEYS.reduce((acc, m) => {
    const w = coachingData.checkedWeeks[m] || { w1: false, w2: false, w3: false, w4: false };
    return acc + (w.w1 ? 1 : 0) + (w.w2 ? 1 : 0) + (w.w3 ? 1 : 0) + (w.w4 ? 1 : 0);
  }, 0);

  const totalFurniproWeeksCount = ALL_MONTH_KEYS.reduce((acc, m) => {
    const w = coachingData.checkedFurniproWeeks[m] || { w1: false, w2: false, w3: false, w4: false };
    return acc + (w.w1 ? 1 : 0) + (w.w2 ? 1 : 0) + (w.w3 ? 1 : 0) + (w.w4 ? 1 : 0);
  }, 0);

  const totalComserWeeksCount = ALL_MONTH_KEYS.reduce((acc, m) => {
    const w = coachingData.checkedComserWeeks[m] || { w1: false, w2: false, w3: false, w4: false };
    return acc + (w.w1 ? 1 : 0) + (w.w2 ? 1 : 0) + (w.w3 ? 1 : 0) + (w.w4 ? 1 : 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      
      {/* Lightbox / Document Preview Modal */}
      {activePreviewAttachment && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white border-3 border-black rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl relative">
            <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#FFE600] border-2 border-black flex items-center justify-center text-base font-black">
                  {activePreviewAttachment.type === 'image' ? '🖼️' : '📄'}
                </span>
                <div>
                  <h4 className="text-sm font-black text-black truncate max-w-xs sm:max-w-md">
                    {activePreviewAttachment.name}
                  </h4>
                  <span className="text-[10px] text-gray-500 font-bold">
                    Ukuran: {activePreviewAttachment.sizeFormatted || 'Standard'} • Diunggah: {activePreviewAttachment.uploadedAt}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={activePreviewAttachment.dataUrl}
                  download={activePreviewAttachment.name}
                  className="px-3 py-1.5 bg-[#06D6A0] hover:bg-emerald-400 text-black border-2 border-black rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_#000]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh File</span>
                </a>
                <button
                  onClick={() => setActivePreviewAttachment(null)}
                  className="p-1.5 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl cursor-pointer"
                >
                  <X className="w-4 h-4 text-black" />
                </button>
              </div>
            </div>

            {/* Content Preview */}
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-gray-100 rounded-2xl p-2 border-2 border-gray-300">
              {activePreviewAttachment.type === 'image' ? (
                <img
                  src={activePreviewAttachment.dataUrl}
                  alt={activePreviewAttachment.name}
                  className="max-h-[65vh] object-contain rounded-xl shadow"
                />
              ) : (
                <div className="text-center py-12 px-4">
                  <FileText className="w-16 h-16 text-indigo-600 mx-auto mb-3" />
                  <p className="text-sm font-black text-black mb-1">{activePreviewAttachment.name}</p>
                  <p className="text-xs text-gray-500 mb-4">Dokumen Surat Komitmen / Memo SMT</p>
                  <a
                    href={activePreviewAttachment.dataUrl}
                    download={activePreviewAttachment.name}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-black text-[#FFE600] rounded-xl text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_#FFE600]"
                  >
                    <Download className="w-4 h-4" />
                    Unduh Dokumen Surat
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Modal Container */}
      <div className="bg-[#FFFDF9] border-3 border-black rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-[8px_8px_0px_0px_#000] overflow-hidden my-auto relative">
        
        {/* Header Bar */}
        <div className="bg-black text-white p-4 sm:p-5 flex items-center justify-between border-b-3 border-black select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#FFE600] text-black border-2 border-black flex items-center justify-center font-display font-black text-xl sm:text-2xl shadow-[2px_2px_0px_0px_#FFF]">
              #{smt.ytd.rank}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-2xl font-black font-display tracking-tight text-white uppercase">
                  {smt.nama}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-[#FFE600] text-black border border-black uppercase tracking-wider">
                  {smt.zone}
                </span>
                {isTop3 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-[#FF3E83] text-white border border-white flex items-center gap-1 uppercase tracking-wider animate-pulse">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    Top 3 Store
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                NIP: {smt.nip} • Living World Alam Sutera (2026)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setIsPdfModalOpen(true)}
              title="Kirim & Bagikan Raport sebagai PDF Interaktif"
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-[#FFE600] hover:bg-yellow-300 text-black rounded-xl border-2 border-black text-xs font-black flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer shadow-[2px_2px_0px_0px_#000] no-print"
            >
              <FileDown className="w-4 h-4 text-black" />
              <span>Kirim PDF</span>
            </button>

            <button
              onClick={handleCopySummary}
              title="Salin Rangkuman Teks SMT"
              className="p-2 sm:px-3 sm:py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl border border-neutral-700 text-xs font-bold flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer no-print"
            >
              <Share2 className="w-4 h-4 text-[#06D6A0]" />
              <span className="hidden sm:inline">{copied ? 'Tersalin!' : 'Salin'}</span>
            </button>

            <button
              onClick={handlePrint}
              title="Cetak Raport SMT"
              className="p-2 sm:px-3 sm:py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl border border-neutral-700 text-xs font-bold flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer no-print"
            >
              <Printer className="w-4 h-4 text-gray-300" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-neutral-800 hover:bg-red-600 text-white rounded-xl border border-neutral-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Top Hero: Key Performance Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Sales Total */}
            <div className="bg-[#FFE600] border-3 border-black rounded-3xl p-4 bento-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-black/70">
                  Total Sales YTD
                </span>
                <span className="p-1.5 rounded-xl bg-black text-[#FFE600] border border-black">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="my-2">
                <div className="text-xl sm:text-2xl font-black font-display text-black">
                  {smt.ytd.rawSales}
                </div>
                <div className="text-xs font-bold text-black/80 mt-0.5">
                  Target: 100% ({formatPct(smt.ytd.salesPct)})
                </div>
              </div>
              <div className="pt-2 border-t-2 border-black/20 flex items-center justify-between text-[11px] font-black">
                <span>Pencapaian:</span>
                <span className={smt.ytd.salesPct >= 100 ? 'text-emerald-900' : 'text-red-900'}>
                  {smt.ytd.salesPct >= 100 ? '✅ ACHIEVED' : '⚠️ UNREACHED'}
                </span>
              </div>
            </div>

            {/* Furnipro Protection */}
            <div className="bg-[#C7D2FE] border-3 border-black rounded-3xl p-4 bento-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-950">
                  Furnipro (FP)
                </span>
                <span className="p-1.5 rounded-xl bg-indigo-950 text-[#C7D2FE] border border-black">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="my-2">
                <div className="text-xl sm:text-2xl font-black font-display text-indigo-950">
                  {smt.ytd.polisCount} Polis
                </div>
                <div className="text-xs font-bold text-indigo-900/80 mt-0.5">
                  Achieve: {smt.ytd.furniproAchCount}/{MONTH_CONFIGS.length} Bulan
                </div>
              </div>
              <div className="pt-2 border-t-2 border-black/20 flex items-center justify-between text-[11px] font-black text-indigo-950">
                <span>Rata-rata/Bulan:</span>
                <span className="bg-indigo-950 text-white px-2 py-0.5 rounded-lg text-[10px]">
                  {(smt.ytd.polisCount / (MONTH_CONFIGS.length || 1)).toFixed(1)} Polis/bln
                </span>
              </div>
            </div>

            {/* Clean & Care (Comser) */}
            <div className="bg-[#A7F3D0] border-3 border-black rounded-3xl p-4 bento-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950">
                  Clean & Care
                </span>
                <span className="p-1.5 rounded-xl bg-emerald-950 text-[#A7F3D0] border border-black">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>
              <div className="my-2">
                <div className="text-xl sm:text-2xl font-black font-display text-emerald-950">
                  {formatCompactRupiah(smt.ytd.comserVal)}
                </div>
                <div className="text-xs font-bold text-emerald-900/80 mt-0.5">
                  Achieve: {smt.ytd.commserAchCount}/{MONTH_CONFIGS.length} Bulan
                </div>
              </div>
              <div className="pt-2 border-t-2 border-black/20 flex items-center justify-between text-[11px] font-black text-emerald-950">
                <span>Rata-rata/Bulan:</span>
                <span className="bg-emerald-950 text-white px-2 py-0.5 rounded-lg text-[10px]">
                  {formatCompactRupiah(smt.ytd.comserVal / (MONTH_CONFIGS.length || 1))}/bln
                </span>
              </div>
            </div>

            {/* Coaching Completed Summary */}
            <div className="bg-[#FDE68A] border-3 border-black rounded-3xl p-4 bento-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-950">
                  Total Coaching
                </span>
                <span className="p-1.5 rounded-xl bg-black text-[#FFE600] border border-black">
                  <UserCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="my-2">
                <div className="text-xl sm:text-2xl font-black font-display text-amber-950">
                  {coachingData.totalCount}x Minggu
                </div>
                <div className="text-xs font-bold text-amber-900/80 mt-0.5">
                  Sales: {totalSalesWeeksCount}W • FP: {totalFurniproWeeksCount}W • CC: {totalComserWeeksCount}W
                </div>
              </div>
              <div className="pt-2 border-t-2 border-black/20 flex items-center justify-between text-[11px] font-black text-amber-950">
                <span>Dokumen Komitmen:</span>
                <span>{coachingData.customLogs.reduce((acc, l) => acc + (l.attachments?.length || 0), 0)} Berkas</span>
              </div>
            </div>
          </div>

          {/* Section: Comprehensive Monthly Breakdown Cards */}
          <div className="bg-white border-3 border-black rounded-3xl p-5 bento-shadow">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-gray-200">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-black text-[#FFE600] flex items-center justify-center font-black">
                  📅
                </span>
                <h3 className="text-base sm:text-lg font-black font-display text-black uppercase">
                  Histori Kinerja Bulanan (Jan - {MONTH_CONFIGS[MONTH_CONFIGS.length - 1]?.name || 'Aug'} 2026)
                </h3>
              </div>
              <span className="text-xs font-black bg-gray-100 px-3 py-1 rounded-xl border border-black/30">
                Achieve Sales: {smt.ytd.salesAchCount}/{MONTH_CONFIGS.length} Bulan
              </span>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(8, MONTH_CONFIGS.length)} gap-2.5`}>
              {MONTH_CONFIGS.map((m) => {
                const mData = smt.monthly[m.key];
                return (
                  <div
                    key={m.key}
                    className={`border-2 border-black rounded-2xl p-3 flex flex-col justify-between ${
                      mData.isAchieved 
                        ? 'bg-emerald-50/70 border-emerald-900 shadow-[2px_2px_0px_0px_#06D6A0]' 
                        : 'bg-[#F9FAFB]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1 pb-1 border-b border-black/10">
                        <span className="text-xs font-black uppercase text-black">{m.name}</span>
                        <span className={`text-[10px] font-black px-1.5 py-0.2 rounded border ${
                          mData.isAchieved 
                            ? 'bg-[#06D6A0] text-black border-black' 
                            : 'bg-gray-200 text-gray-700 border-gray-400'
                        }`}>
                          {mData.grade}
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px] my-2 font-medium">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Sales:</span>
                          <span className="font-black text-black">{mData.rawSales}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Target:</span>
                          <span className="font-bold text-gray-700">100%</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-dashed border-gray-300">
                          <span className="text-indigo-900 font-bold">FP:</span>
                          <span className="font-black text-indigo-950">{mData.rawFp} Polis</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-emerald-900 font-bold">Clean & Care:</span>
                          <span className="font-black text-emerald-950">{mData.rawCc}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-black/20 text-center">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block ${
                        mData.isAchieved ? 'bg-emerald-200 text-emerald-950' : 'bg-red-100 text-red-800'
                      }`}>
                        {mData.isAchieved ? 'Achieved 🎯' : 'Under Target 📉'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Interactive Weekly Coaching Matrix (Sales, Furnipro, Comser) & Document Uploader */}
          <div className="bg-white border-3 border-black rounded-3xl p-5 bento-shadow">
            
            {/* Title & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b-2 border-gray-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#FFE600] border-2 border-black flex items-center justify-center text-xl shadow-[2px_2px_0px_0px_#000]">
                  🎯
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black font-display text-black uppercase">
                    Checklist & Log Pembinaan Mingguan SMT
                  </h3>
                  <p className="text-[11px] font-bold text-gray-500">
                    Ceklis mingguan (W1-W4) untuk Sales, Furnipro, Clean & Care + Upload Foto & Surat Komitmen
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowAddLog(!showAddLog)}
                  className="px-3.5 py-2 bg-[#FFE600] hover:bg-yellow-300 text-black font-black text-xs rounded-xl border-2 border-black flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000] cursor-pointer transition-transform hover:scale-105"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{showAddLog ? 'Tutup Form' : '+ Catat Sesi & Upload Surat Komitmen'}</span>
                </button>
              </div>
            </div>

            {/* Form to Add Weekly Coaching Session with File / Photo Upload */}
            {showAddLog && (
              <form onSubmit={handleAddLog} className="mb-6 bg-[#F8FAFC] border-3 border-black rounded-2xl p-4 sm:p-5 shadow-[3px_3px_0px_0px_#000] animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-black/10">
                  <h4 className="text-xs sm:text-sm font-black uppercase text-black flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    Form Pemanggilan Coaching & Upload Surat Komitmen SMT
                  </h4>
                  <span className="text-[10px] font-black bg-[#FFE600] px-2 py-0.5 rounded border border-black uppercase">
                    SMT: {smt.nama}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-700 block mb-1">
                      Pilih Bulan *
                    </label>
                    <select
                      value={selectedMonthForLog}
                      onChange={(e) => setSelectedMonthForLog(e.target.value as MonthKey)}
                      className="w-full px-3 py-1.5 text-xs font-bold bg-white border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFE600]"
                    >
                      {coachingMonths.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.name} 2026 {m.isOngoing ? '(Bulan Berjalan 📝)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-700 block mb-1">
                      Pilih Minggu (Week) *
                    </label>
                    <select
                      value={selectedWeekForLog}
                      onChange={(e) => setSelectedWeekForLog(e.target.value as WeekKey)}
                      className="w-full px-3 py-1.5 text-xs font-bold bg-white border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFE600]"
                    >
                      <option value="w1">Minggu ke-1 (W1)</option>
                      <option value="w2">Minggu ke-2 (W2)</option>
                      <option value="w3">Minggu ke-3 (W3)</option>
                      <option value="w4">Minggu ke-4 (W4)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-700 block mb-1">
                      Nomor Surat / Memo (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Misal: SK-ALSUT/2026/W2"
                      value={newLetterNumber}
                      onChange={(e) => setNewLetterNumber(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-semibold bg-white border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFE600]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-700 block mb-1">
                      Ceklis Fokus Pembinaan *
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      <label className="flex items-center gap-1 text-[11px] font-black cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checkSalesInForm}
                          onChange={(e) => setCheckSalesInForm(e.target.checked)}
                          className="rounded border-black"
                        />
                        <span>Sales</span>
                      </label>
                      <label className="flex items-center gap-1 text-[11px] font-black text-indigo-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checkFurniproInForm}
                          onChange={(e) => setCheckFurniproInForm(e.target.checked)}
                          className="rounded border-black"
                        />
                        <span>Furnipro</span>
                      </label>
                      <label className="flex items-center gap-1 text-[11px] font-black text-emerald-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checkComserInForm}
                          onChange={(e) => setCheckComserInForm(e.target.checked)}
                          className="rounded border-black"
                        />
                        <span>Comser</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-700 block mb-1">
                      Topik / Fokus Pembinaan Mingguan *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Misal: Review Target Polis Furnipro & Follow-Up Clean Care W2"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-white border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFE600]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-700 block mb-1">
                      Catatan & Komitmen Tindak Lanjut SMT
                    </label>
                    <input
                      type="text"
                      placeholder="Misal: SMT berkomitmen minimal 3 penawaran FP dan follow up aftersales harian"
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-white border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFE600]"
                    />
                  </div>
                </div>

                {/* File / Photo Upload Dropzone (Supports Drag & Drop and Manual Selection) */}
                <div className="mb-4">
                  <label className="text-[10px] font-black uppercase text-gray-700 block mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Paperclip className="w-3.5 h-3.5 text-black" />
                      Lampiran Foto Sesi Pemanggilan / Scan Surat Komitmen Bertanda Tangan:
                    </span>
                    <span className="text-gray-500 font-bold text-[10px]">JPG, PNG, PDF, Dokumen</span>
                  </label>

                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-[#FFE600] bg-yellow-50 scale-101' 
                        : 'border-gray-400 bg-white hover:border-black hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      className="hidden"
                    />
                    <Upload className="w-6 h-6 text-gray-500 mx-auto mb-1" />
                    <p className="text-xs font-black text-black">
                      Tarik & lepas file foto / dokumen di sini, atau <span className="text-indigo-600 underline">klik untuk memilih file</span>
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                      Dapat mengunggah foto bukti 1-on-1, lembar SP, memo evaluasi, atau surat komitmen bermaterai/bertandatangan
                    </p>
                  </div>

                  {/* Pending Upload Previews */}
                  {pendingAttachments.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      {pendingAttachments.map((att) => (
                        <div
                          key={att.id}
                          className="bg-white border-2 border-black rounded-xl p-1.5 flex items-center gap-2 shadow-sm text-xs"
                        >
                          {att.type === 'image' ? (
                            <img
                              src={att.dataUrl}
                              alt={att.name}
                              className="w-9 h-9 object-cover rounded-lg border border-gray-300"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-indigo-100 border border-indigo-300 flex items-center justify-center text-indigo-700">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}
                          <div className="max-w-[140px] truncate">
                            <p className="font-bold text-[11px] truncate">{att.name}</p>
                            <p className="text-[9px] text-gray-500">{att.sizeFormatted}</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePendingAttachment(att.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 rounded cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
                  <button
                    type="button"
                    onClick={() => setShowAddLog(false)}
                    className="px-4 py-1.5 bg-white hover:bg-gray-100 text-black border-2 border-black rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 bg-black hover:bg-neutral-800 text-[#FFE600] border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-[2px_2px_0px_0px_#FFE600] transition-transform hover:scale-102"
                  >
                    Simpan Sesi & Dokumen 💾
                  </button>
                </div>
              </form>
            )}

            {/* Matrix View Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-700 mr-1">
                  Filter Tampilan Ceklis:
                </span>
                <button
                  type="button"
                  onClick={() => setActiveMatrixTab('all')}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-black border-2 transition-all cursor-pointer ${
                    activeMatrixTab === 'all'
                      ? 'bg-black text-[#FFE600] border-black shadow-[2px_2px_0px_0px_#FFE600]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                  }`}
                >
                  ⚡ Semua (Sales + FP + Comser)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMatrixTab('sales')}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-black border-2 transition-all cursor-pointer ${
                    activeMatrixTab === 'sales'
                      ? 'bg-[#FFE600] text-black border-black shadow-[2px_2px_0px_0px_#000]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                  }`}
                >
                  🎯 Sales ({totalSalesWeeksCount}/{totalMaxWeeks} W)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMatrixTab('furnipro')}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-black border-2 transition-all cursor-pointer ${
                    activeMatrixTab === 'furnipro'
                      ? 'bg-indigo-600 text-white border-black shadow-[2px_2px_0px_0px_#000]'
                      : 'bg-white text-indigo-900 border-gray-300 hover:border-black'
                  }`}
                >
                  🛡️ Furnipro ({totalFurniproWeeksCount}/{totalMaxWeeks} W)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMatrixTab('comser')}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-black border-2 transition-all cursor-pointer ${
                    activeMatrixTab === 'comser'
                      ? 'bg-[#06D6A0] text-black border-black shadow-[2px_2px_0px_0px_#000]'
                      : 'bg-white text-emerald-900 border-gray-300 hover:border-black'
                  }`}
                >
                  ✨ Clean & Care ({totalComserWeeksCount}/{totalMaxWeeks} W)
                </button>
              </div>

              <div className="text-[11px] font-black text-gray-600">
                Klik tombol W1 - W4 di bawah untuk centang pembinaan
              </div>
            </div>

            {/* Interactive Weekly Cards for All Coaching Months (Jan s/d Sep) with Sales, Furnipro & Comser Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
              {coachingMonths.map((m) => {
                const sWeeks = coachingData.checkedWeeks?.[m.key] || { w1: false, w2: false, w3: false, w4: false };
                const fWeeks = coachingData.checkedFurniproWeeks?.[m.key] || { w1: false, w2: false, w3: false, w4: false };
                const cWeeks = coachingData.checkedComserWeeks?.[m.key] || { w1: false, w2: false, w3: false, w4: false };

                const sCount = (sWeeks.w1 ? 1 : 0) + (sWeeks.w2 ? 1 : 0) + (sWeeks.w3 ? 1 : 0) + (sWeeks.w4 ? 1 : 0);
                const fCount = (fWeeks.w1 ? 1 : 0) + (fWeeks.w2 ? 1 : 0) + (fWeeks.w3 ? 1 : 0) + (fWeeks.w4 ? 1 : 0);
                const cCount = (cWeeks.w1 ? 1 : 0) + (cWeeks.w2 ? 1 : 0) + (cWeeks.w3 ? 1 : 0) + (cWeeks.w4 ? 1 : 0);

                const mData = smt.monthly[m.key] || {
                  rawSales: '0%',
                  salesPct: 0,
                  grade: 'F',
                  vibe: 'Bulan Berjalan',
                  isAchieved: false
                };

                return (
                  <div
                    key={m.key}
                    className={`border-2 border-black rounded-2xl p-2.5 bg-white shadow-[2px_2px_0px_0px_#000] flex flex-col justify-between ${
                      m.isOngoing ? 'ring-2 ring-[#FFE600] bg-yellow-50/20' : ''
                    }`}
                  >
                    {/* Month Header */}
                    <div className="pb-1.5 mb-2 border-b border-black/15 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black uppercase text-black block leading-tight">
                            {m.name}
                          </span>
                          {m.isOngoing && (
                            <span className="text-[8px] font-black bg-[#FFE600] text-black border border-black px-1.5 py-0.2 rounded-md">
                              Berjalan ⏳
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-bold text-gray-500">
                          {m.isOngoing ? 'Pencatatan Coaching 📝' : mData.rawSales}
                        </span>
                      </div>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-gray-100 border border-black/30">
                        {sCount + fCount + cCount}/12 Check
                      </span>
                    </div>

                    <div className="space-y-2 mb-2">
                      {/* Row 1: Sales Weekly Check */}
                      {(activeMatrixTab === 'all' || activeMatrixTab === 'sales') && (
                        <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-1.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-black uppercase text-amber-950 flex items-center gap-1">
                              <span>🎯 Sales:</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleMonthCategoryAll('sales', m.key)}
                              className="text-[8px] font-black px-1 py-0.2 rounded bg-amber-200 hover:bg-amber-300 text-black border border-amber-400 cursor-pointer"
                            >
                              {sCount === 4 ? '✓ 4W' : `${sCount}/4W`}
                            </button>
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            {WEEKS.map((wKey, idx) => {
                              const isChecked = !!sWeeks[wKey];
                              return (
                                <button
                                  key={wKey}
                                  type="button"
                                  onClick={() => handleToggleCategoryWeek('sales', m.key, wKey)}
                                  title={`Sales ${m.name} W${idx + 1}`}
                                  className={`py-1 rounded-lg text-[9px] font-black border flex items-center justify-center transition-all cursor-pointer ${
                                    isChecked
                                      ? 'bg-[#FFE600] text-black border-black font-black shadow-[1px_1px_0px_0px_#000]'
                                      : 'bg-white text-gray-400 border-gray-300 hover:border-black'
                                  }`}
                                >
                                  {isChecked ? `✓W${idx + 1}` : `W${idx + 1}`}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Row 2: Furnipro Weekly Check */}
                      {(activeMatrixTab === 'all' || activeMatrixTab === 'furnipro') && (
                        <div className="bg-indigo-50/70 border border-indigo-300 rounded-xl p-1.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-black uppercase text-indigo-950 flex items-center gap-1">
                              <span>🛡️ Furnipro:</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleMonthCategoryAll('furnipro', m.key)}
                              className="text-[8px] font-black px-1 py-0.2 rounded bg-indigo-200 hover:bg-indigo-300 text-indigo-950 border border-indigo-400 cursor-pointer"
                            >
                              {fCount === 4 ? '✓ 4W' : `${fCount}/4W`}
                            </button>
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            {WEEKS.map((wKey, idx) => {
                              const isChecked = !!fWeeks[wKey];
                              return (
                                <button
                                  key={wKey}
                                  type="button"
                                  onClick={() => handleToggleCategoryWeek('furnipro', m.key, wKey)}
                                  title={`Furnipro ${m.name} W${idx + 1}`}
                                  className={`py-1 rounded-lg text-[9px] font-black border flex items-center justify-center transition-all cursor-pointer ${
                                    isChecked
                                      ? 'bg-indigo-600 text-white border-black font-black shadow-[1px_1px_0px_0px_#000]'
                                      : 'bg-white text-gray-400 border-gray-300 hover:border-black'
                                  }`}
                                >
                                  {isChecked ? `✓W${idx + 1}` : `W${idx + 1}`}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Row 3: Clean & Care (Comser) Weekly Check */}
                      {(activeMatrixTab === 'all' || activeMatrixTab === 'comser') && (
                        <div className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-1.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-black uppercase text-emerald-950 flex items-center gap-1">
                              <span>✨ Clean & Care:</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleMonthCategoryAll('comser', m.key)}
                              className="text-[8px] font-black px-1 py-0.2 rounded bg-emerald-200 hover:bg-emerald-300 text-emerald-950 border border-emerald-400 cursor-pointer"
                            >
                              {cCount === 4 ? '✓ 4W' : `${cCount}/4W`}
                            </button>
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            {WEEKS.map((wKey, idx) => {
                              const isChecked = !!cWeeks[wKey];
                              return (
                                <button
                                  key={wKey}
                                  type="button"
                                  onClick={() => handleToggleCategoryWeek('comser', m.key, wKey)}
                                  title={`Clean & Care ${m.name} W${idx + 1}`}
                                  className={`py-1 rounded-lg text-[9px] font-black border flex items-center justify-center transition-all cursor-pointer ${
                                    isChecked
                                      ? 'bg-[#06D6A0] text-black border-black font-black shadow-[1px_1px_0px_0px_#000]'
                                      : 'bg-white text-gray-400 border-gray-300 hover:border-black'
                                  }`}
                                >
                                  {isChecked ? `✓W${idx + 1}` : `W${idx + 1}`}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Progress Indicator */}
                    <div className="pt-1 text-[9px] font-black text-center text-gray-500 uppercase">
                      {sCount === 4 && fCount === 4 && cCount === 4 ? '🌟 Lengkap 100%' : 'Sedang Berjalan'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Riwayat Pemanggilan SMT, Catatan & Berkas Surat Komitmen */}
            <div className="pt-4 border-t-2 border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs sm:text-sm font-black uppercase text-black flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-indigo-600" />
                  Riwayat Pemanggilan, Evaluasi & Berkas Surat Komitmen ({coachingData.customLogs?.length || 0})
                </h4>
                <span className="text-[11px] font-bold text-gray-500">
                  Total Lampiran:{' '}
                  <strong className="text-black font-black">
                    {coachingData.customLogs.reduce((acc, l) => acc + (l.attachments?.length || 0), 0)} Berkas/Foto
                  </strong>
                </span>
              </div>

              {(!coachingData.customLogs || coachingData.customLogs.length === 0) ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center text-gray-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-xs font-bold text-gray-700">Belum ada riwayat catatan sesi pemanggilan atau berkas surat komitmen</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Klik tombol <strong>"+ Catat Sesi & Upload Surat Komitmen"</strong> di atas untuk menambahkan catatan resmi & bukti foto/dokumen.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {coachingData.customLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-white border-2 border-black rounded-2xl p-3.5 shadow-[2px_2px_0px_0px_#000] flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="font-black text-black bg-[#FFE600] px-2 py-0.5 rounded-md text-[11px] border border-black uppercase">
                              {log.topic}
                            </span>
                            
                            {log.month && log.week && (
                              <span className="font-black text-white bg-black px-2 py-0.5 rounded-md text-[10px] uppercase">
                                📅 {log.month} • {log.week.toUpperCase()}
                              </span>
                            )}

                            {log.letterNumber && (
                              <span className="font-black text-indigo-900 bg-indigo-100 border border-indigo-300 px-2 py-0.5 rounded-md text-[10px]">
                                📜 No: {log.letterNumber}
                              </span>
                            )}

                            {log.salesChecked && (
                              <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                                ✓ Sales
                              </span>
                            )}
                            {log.furniproChecked && (
                              <span className="text-[9px] font-black bg-indigo-100 text-indigo-900 px-1.5 py-0.5 rounded">
                                ✓ Furnipro
                              </span>
                            )}
                            {log.comserChecked && (
                              <span className="text-[9px] font-black bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded">
                                ✓ Comser
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-gray-500 font-bold flex items-center gap-2 mt-1">
                            <span>🕒 {log.date}</span>
                            <span>•</span>
                            <span>Pembina: {log.coachName || 'SPV Store Alsut'}</span>
                          </div>

                          {log.notes && (
                            <p className="text-xs text-gray-800 font-medium mt-1.5 bg-gray-50 p-2 rounded-xl border border-gray-200">
                              <strong className="text-black">Komitmen SMT:</strong> "{log.notes}"
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveLog(log.id)}
                          title="Hapus sesi pemanggilan ini"
                          className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Display Uploaded Attachments / Photos / Surat Komitmen */}
                      {log.attachments && log.attachments.length > 0 && (
                        <div className="pt-2 mt-1 border-t border-gray-100">
                          <span className="text-[10px] font-black uppercase text-gray-600 block mb-1.5">
                            Dokumen & Foto Terlampir ({log.attachments.length}):
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            {log.attachments.map((att) => (
                              <div
                                key={att.id}
                                onClick={() => setActivePreviewAttachment(att)}
                                className="group relative bg-[#F8FAFC] border-2 border-black rounded-xl p-1.5 flex items-center gap-2 hover:bg-yellow-50 cursor-pointer transition-all hover:scale-102 shadow-[1px_1px_0px_0px_#000]"
                              >
                                {att.type === 'image' ? (
                                  <img
                                    src={att.dataUrl}
                                    alt={att.name}
                                    className="w-10 h-10 object-cover rounded-lg border border-gray-300"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-indigo-100 border border-indigo-300 flex items-center justify-center text-indigo-700">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                )}
                                <div className="max-w-[130px] pr-1">
                                  <p className="font-black text-[10px] text-black truncate">{att.name}</p>
                                  <span className="text-[8px] font-bold text-indigo-700 flex items-center gap-0.5">
                                    <Eye className="w-2.5 h-2.5" /> Klik lihat
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

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

              {/* Interactive PDF Share Banner */}
              <div className="mt-4 p-4 bg-gradient-to-r from-[#FFE600]/30 to-[#06D6A0]/20 border-2 border-black rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[2px_2px_0px_0px_#000] no-print">
                <div className="flex items-center gap-3 text-left w-full sm:w-auto">
                  <div className="p-2.5 bg-black text-[#FFE600] rounded-xl border border-black shrink-0">
                    <FileDown className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-black">
                      Butuh Dokumen Raport Resmi Bertanda Tangan?
                    </h5>
                    <p className="text-[11px] text-gray-700 font-medium">
                      Ekspor ke lembar PDF A4 standar perusahaan, lengkap dengan tabel, evaluasi, dan stempel Living World Alam Sutera.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(true)}
                  className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 shrink-0 shadow-[2px_2px_0px_0px_#000] w-full sm:w-auto justify-center"
                >
                  <FileDown className="w-4 h-4 text-[#FFE600]" />
                  <span>Buka & Bagikan PDF</span>
                </button>
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

      {/* Interactive PDF Share & Export Modal */}
      <SmtPdfExportModal
        smt={smt}
        coachingData={coachingData}
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
      />
    </div>
  );
};
