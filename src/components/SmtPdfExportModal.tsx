import React, { useState, useRef } from 'react';
import { 
  FileDown, 
  Share2, 
  Printer, 
  X, 
  Sliders, 
  Eye, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  Copy, 
  Check, 
  Sparkles,
  Download,
  Send,
  MessageCircle,
  FileText,
  Building2,
  Calendar,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  Flame,
  HelpCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import { SmtRecord, MonthKey } from '../types';
import { 
  formatCompactRupiah, 
  formatPct, 
  formatRupiah, 
  MONTH_CONFIGS 
} from '../utils/parser';
import { SmtCoachingRecord, WEEKS } from '../utils/coachingStorage';

interface SmtPdfExportModalProps {
  smt: SmtRecord;
  coachingData: SmtCoachingRecord;
  isOpen: boolean;
  onClose: () => void;
}

export const SmtPdfExportModal: React.FC<SmtPdfExportModalProps> = ({
  smt,
  coachingData,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'options'>('preview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState<string>('');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [waPhone, setWaPhone] = useState('');
  const [showWaInput, setShowWaInput] = useState(false);

  // PDF Customization Options
  const [includeMonthlyTable, setIncludeMonthlyTable] = useState(true);
  const [includeCoachingLogs, setIncludeCoachingLogs] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [focusMonth, setFocusMonth] = useState<'all' | MonthKey>('all');
  const [themeMode, setThemeMode] = useState<'official' | 'informa'>('informa');

  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const currentDateFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const triggerCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#FFE600', '#06D6A0', '#118AB2', '#FF3E83'],
    });
  };

  const getCleanPdfFilename = () => {
    const cleanName = smt.nama.replace(/[^a-zA-Z0-9]/g, '_');
    const periodStr = focusMonth === 'all' ? 'YTD_2026' : `Bulan_${focusMonth.toUpperCase()}_2026`;
    return `Raport_SMT_${smt.nip}_${cleanName}_${periodStr}.pdf`;
  };

  // Internal helper to render the PDF document via html2canvas & jsPDF
  const generatePdfBlob = async (): Promise<{ pdf: jsPDF; blob: Blob; filename: string } | null> => {
    if (!printAreaRef.current) return null;

    try {
      setIsGenerating(true);
      setGeneratingProgress('Menyiapkan tata letak dokumen...');

      // Small delay to ensure styles and webfonts settle
      await new Promise((resolve) => setTimeout(resolve, 200));

      setGeneratingProgress('Merender halaman raport ke grafis resolusi tinggi (2x Retina)...');
      
      const canvas = await html2canvas(printAreaRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
      });

      setGeneratingProgress('Mengonversi ke format PDF standar cetak A4...');

      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210; // A4 standard width in mm
      const pageHeight = 297; // A4 standard height in mm
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Handle multi-page documents if content exceeds standard A4 height
      while (heightLeft > 5) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const filename = getCleanPdfFilename();
      const blob = pdf.output('blob');

      return { pdf, blob, filename };
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Terjadi kendala saat merender PDF. Silakan gunakan opsi Cetak browser.');
      return null;
    } finally {
      setIsGenerating(false);
      setGeneratingProgress('');
    }
  };

  // Direct Download Action
  const handleDownloadPdf = async () => {
    const result = await generatePdfBlob();
    if (!result) return;

    result.pdf.save(result.filename);
    triggerCelebration();
  };

  // Native Web Share API (Mobile / Tablet / Modern Browsers)
  const handleNativeSharePdf = async () => {
    const result = await generatePdfBlob();
    if (!result) return;

    const file = new File([result.blob], result.filename, { type: 'application/pdf' });
    const shareText = `📊 Dokumen Raport Kinerja SMT Informa Living World Alam Sutera 2026\nNama: ${smt.nama} (NIP: ${smt.nip})\nZona: ${smt.zone} • Rank Toko: #${smt.ytd.rank}\nTotal Sales: ${smt.ytd.rawSales} (${formatPct(smt.ytd.salesPct)})\nStatus: ${smt.ytd.evaluationResult}`;

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Raport SMT - ${smt.nama}`,
          text: shareText,
          files: [file],
        });
        triggerCelebration();
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Share was aborted or not supported:', err);
        }
      }
    }

    // Fallback: Download file automatically and provide WhatsApp share option
    result.pdf.save(result.filename);
    triggerCelebration();
    setShowWaInput(true);
  };

  // Share via WhatsApp Flow
  const handleShareToWhatsApp = async () => {
    // Generate and download PDF first so user has the file ready to attach
    const result = await generatePdfBlob();
    if (result) {
      result.pdf.save(result.filename);
      triggerCelebration();
    }

    const summaryText = `*📄 RAPORT SMT ALSUT 2026 (FILE PDF TERLAMPIR)*
━━━━━━━━━━━━━━━━━━━━
*Nama:* ${smt.nama}
*NIP:* ${smt.nip}
*Zona:* ${smt.zone}
*Peringkat Toko:* #${smt.ytd.rank} dari 150 SMT

📈 *Capaian YTD:*
• Total Sales: *${smt.ytd.rawSales}* (${formatPct(smt.ytd.salesPct)} Target)
• Furnipro (FP): *${smt.ytd.polisCount} Polis*
• Clean & Care: *${smt.ytd.rawComser}*
• Bulan Achieve: *${smt.ytd.salesAchCount}/${MONTH_CONFIGS.length} Bulan*
• Status Evaluasi: *${smt.ytd.evaluationResult}*

_File PDF resmi telah diunduh (${result?.filename || 'Raport_SMT.pdf'}). Silakan lampirkan dokumen PDF tersebut pada chat ini._`;

    const encodedText = encodeURIComponent(summaryText);
    const cleanPhone = waPhone.replace(/[^0-9]/g, '');
    const waUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(waUrl, '_blank');
  };

  const handleCopySummaryText = () => {
    const text = `📊 *RAPORT SMT ALSUT 2026*
Nama: ${smt.nama} (NIP: ${smt.nip})
Zona: ${smt.zone}
Rank Toko: #${smt.ytd.rank}
Total Sales: ${smt.ytd.rawSales} (${formatPct(smt.ytd.salesPct)} Target)
Total Polis FP: ${smt.ytd.polisCount} Polis
Total Clean & Care: ${smt.ytd.rawComser}
Bulan Achieve Sales: ${smt.ytd.salesAchCount}/${MONTH_CONFIGS.length} Bulan
Hasil Evaluasi: ${smt.ytd.evaluationResult}
Status: Toko Informa Living World Alam Sutera (2026)`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    triggerCelebration();
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  const monthsToDisplay = focusMonth === 'all' 
    ? MONTH_CONFIGS 
    : MONTH_CONFIGS.filter(m => m.key === focusMonth);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border-3 border-black rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Header Bar */}
        <div className="bg-black text-white p-4 sm:p-5 flex items-center justify-between gap-3 border-b-3 border-black shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#FFE600] text-black border-2 border-black rounded-2xl shadow-[2px_2px_0px_0px_#fff]">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black font-display tracking-tight text-white">
                  Kirim & Bagikan Raport PDF
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-[#06D6A0] text-black uppercase">
                  Interaktif
                </span>
              </div>
              <p className="text-xs text-gray-300 font-medium">
                {smt.nama} • NIP: {smt.nip} ({smt.zone})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switchers */}
            <div className="bg-neutral-800 p-1 rounded-xl flex items-center text-xs font-bold">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-[#FFE600] text-black font-black'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Pratinjau PDF</span>
              </button>
              <button
                onClick={() => setActiveTab('options')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'options'
                    ? 'bg-[#FFE600] text-black font-black'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Kustomisasi</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 bg-neutral-800 hover:bg-red-600 text-white rounded-xl border border-neutral-700 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-neutral-100 flex flex-col lg:flex-row gap-5">
          
          {/* Main Content Area: Document Preview */}
          <div className="flex-1 flex flex-col items-center">
            
            {/* Document Preview Card (This is captured into PDF) */}
            <div className="w-full max-w-[760px] bg-white border-2 border-neutral-300 shadow-xl rounded-xl p-5 sm:p-8 text-black transition-all">
              <div ref={printAreaRef} className="bg-white p-2">
                
                {/* PDF Header Informa */}
                <div className="border-b-3 border-black pb-4 mb-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#FFE600] border-2 border-black flex flex-col items-center justify-center font-black leading-none text-black shadow-[2px_2px_0px_0px_#000]">
                      <span className="text-xs font-black">INF</span>
                      <span className="text-[9px] font-bold">ALST</span>
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-[#FF3E83]">
                        INFORMA LIVING WORLD ALAM SUTERA
                      </div>
                      <h1 className="text-lg sm:text-xl font-black font-display tracking-tight text-black">
                        LEMBAR RAPORT KINERJA SMT
                      </h1>
                      <div className="text-[11px] font-bold text-gray-500">
                        Periode: {focusMonth === 'all' ? 'YTD Januari – Agustus/September 2026' : `Fokus Bulan ${focusMonth.toUpperCase()} 2026`} • Dicetak: {currentDateFormatted}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="inline-block px-3 py-1 bg-black text-white text-[11px] font-black rounded-lg uppercase tracking-wider">
                      Rank #{smt.ytd.rank} Toko
                    </div>
                    <div className="text-[10px] font-mono text-gray-500 mt-1">
                      ID: {smt.nip}
                    </div>
                  </div>
                </div>

                {/* SMT Profile Banner */}
                <div className="bg-[#FFE600]/25 border-2 border-black rounded-2xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                      Identitas Sales Marketing Team (SMT)
                    </div>
                    <div className="text-base sm:text-lg font-black text-black">
                      {smt.nama}
                    </div>
                    <div className="text-xs font-bold text-gray-700 flex items-center gap-2 mt-0.5">
                      <span>NIP: <span className="font-mono">{smt.nip}</span></span>
                      <span>•</span>
                      <span>Zona: <span className="font-black text-black">{smt.zone}</span></span>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <div className="text-[10px] font-black uppercase text-gray-500">
                      Status Evaluasi Toko
                    </div>
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-white border-2 border-black rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_#000] mt-1">
                      <span>{smt.ytd.evaluationResult}</span>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
                  <div className="bg-white border-2 border-black rounded-xl p-2.5 shadow-[2px_2px_0px_0px_#000]">
                    <div className="text-[10px] font-black uppercase text-gray-500">
                      Total Sales YTD
                    </div>
                    <div className="text-sm sm:text-base font-black text-black mt-0.5">
                      {smt.ytd.rawSales}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-700">
                      Target: {formatPct(smt.ytd.salesPct)}
                    </div>
                  </div>

                  <div className="bg-white border-2 border-black rounded-xl p-2.5 shadow-[2px_2px_0px_0px_#000]">
                    <div className="text-[10px] font-black uppercase text-gray-500">
                      Polis Furnipro (FP)
                    </div>
                    <div className="text-sm sm:text-base font-black text-indigo-900 mt-0.5">
                      {smt.ytd.polisCount} Polis
                    </div>
                    <div className="text-[10px] font-bold text-gray-600">
                      Rata: {(smt.ytd.polisCount / (MONTH_CONFIGS.length || 1)).toFixed(1)}/bln
                    </div>
                  </div>

                  <div className="bg-white border-2 border-black rounded-xl p-2.5 shadow-[2px_2px_0px_0px_#000]">
                    <div className="text-[10px] font-black uppercase text-gray-500">
                      Clean & Care (C&C)
                    </div>
                    <div className="text-sm sm:text-base font-black text-emerald-900 mt-0.5">
                      {smt.ytd.rawComser}
                    </div>
                    <div className="text-[10px] font-bold text-gray-600">
                      Rata: {formatCompactRupiah(smt.ytd.comserVal / (MONTH_CONFIGS.length || 1))}/bln
                    </div>
                  </div>

                  <div className="bg-white border-2 border-black rounded-xl p-2.5 shadow-[2px_2px_0px_0px_#000]">
                    <div className="text-[10px] font-black uppercase text-gray-500">
                      Konsistensi Capaian
                    </div>
                    <div className="text-sm sm:text-base font-black text-black mt-0.5">
                      {smt.ytd.salesAchCount} / {MONTH_CONFIGS.length} Bln
                    </div>
                    <div className="text-[10px] font-bold text-gray-600">
                      Coaching: {coachingData.totalCount}x
                    </div>
                  </div>
                </div>

                {/* Monthly Breakdown Table */}
                {includeMonthlyTable && (
                  <div className="mb-5">
                    <div className="text-xs font-black uppercase tracking-wider text-black mb-2 flex items-center justify-between">
                      <span>Rincian Performa Bulanan ({monthsToDisplay.length} Bulan)</span>
                      <span className="text-[10px] font-normal text-gray-500">Base Target: 100%</span>
                    </div>

                    <div className="border-2 border-black rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-black text-white text-[10px] font-black uppercase">
                            <th className="p-2 border-r border-neutral-700">Bulan</th>
                            <th className="p-2 border-r border-neutral-700 text-center">Sales (%)</th>
                            <th className="p-2 border-r border-neutral-700 text-center">Furnipro</th>
                            <th className="p-2 border-r border-neutral-700 text-right">Clean & Care</th>
                            <th className="p-2 text-center">Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 font-medium">
                          {monthsToDisplay.map((m) => {
                            const d = smt.monthly[m.key];
                            const isAch = d?.isAchieved;
                            return (
                              <tr key={m.key} className={isAch ? 'bg-emerald-50/50' : 'bg-white'}>
                                <td className="p-2 font-black border-r border-gray-200">
                                  {m.name} 2026
                                </td>
                                <td className="p-2 border-r border-gray-200 text-center font-bold">
                                  <span className={d?.salesPct >= 100 ? 'text-emerald-700 font-black' : 'text-gray-900'}>
                                    {d?.rawSales || '0%'}
                                  </span>
                                </td>
                                <td className="p-2 border-r border-gray-200 text-center font-semibold">
                                  {d?.rawFp || '0'} Polis
                                </td>
                                <td className="p-2 border-r border-gray-200 text-right font-mono">
                                  {d?.rawCc || 'Rp0'}
                                </td>
                                <td className="p-2 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border ${
                                    d?.grade === 'A+' || d?.grade === 'A'
                                      ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                                      : d?.grade === 'B'
                                      ? 'bg-yellow-100 text-yellow-900 border-yellow-400'
                                      : 'bg-red-100 text-red-900 border-red-400'
                                  }`}>
                                    {d?.grade || '-'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Coaching Logs & Action Plans */}
                {includeCoachingLogs && coachingData.logs && coachingData.logs.length > 0 && (
                  <div className="mb-5 bg-gray-50 border-2 border-black rounded-xl p-3">
                    <div className="text-xs font-black uppercase tracking-wider text-black mb-1.5 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Catatan Pembinaan & Action Plan Supervisi ({coachingData.logs.length} Log)</span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-hidden text-[11px]">
                      {coachingData.logs.slice(0, 3).map((log) => (
                        <div key={log.id} className="bg-white border border-gray-300 rounded-lg p-2">
                          <div className="flex items-center justify-between font-bold text-gray-500 text-[10px]">
                            <span>Bulan {log.month.toUpperCase()} • {log.date}</span>
                            <span className="text-blue-700">Oleh: {log.coachName}</span>
                          </div>
                          <p className="text-black font-semibold mt-0.5">
                            {log.notes}
                          </p>
                          {log.actionPlan && (
                            <p className="text-emerald-800 font-bold mt-0.5">
                              🎯 Action Plan: {log.actionPlan}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {includeRecommendations && (
                  <div className="mb-5 bg-yellow-50/70 border-2 border-black rounded-xl p-3 text-xs">
                    <div className="text-[11px] font-black uppercase text-black mb-1 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>Rekomendasi Peningkatan Kinerja SMT</span>
                    </div>
                    <ul className="text-[11px] font-medium text-gray-800 space-y-1 pl-4 list-disc">
                      <li>
                        {smt.ytd.salesPct >= 100
                          ? 'Pertahankan konsistensi closing sales harian dan tularkan teknik penjualan ke rekan zona.'
                          : 'Tingkatkan fokus pada greeting, probing kebutuhan customer, dan teknik closing bertahap.'}
                      </li>
                      <li>
                        {smt.ytd.polisCount < 10
                          ? 'Perkuat penawaran garansi Furnipro di setiap negosiasi produk furniture berisiko.'
                          : 'Pertahankan pencapaian Furnipro yang solid, eksplorasi paket proteksi jangka panjang.'}
                      </li>
                      <li>
                        {smt.ytd.comserVal < 1000000
                          ? 'Aktifkan penawaran jasa cuci Clean & Care untuk customer sofa, matras, dan karpet.'
                          : 'Capaian omset Clean & Care sangat baik, lanjutkan follow-up kepuasan pelanggan.'}
                      </li>
                    </ul>
                  </div>
                )}

                {/* Official Signatures & Verification Stamp */}
                {includeSignatures && (
                  <div className="pt-2 border-t-2 border-dashed border-gray-400">
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 mb-10">
                          SMT Bersangkutan,
                        </div>
                        <div className="font-black text-black border-t border-black pt-1 mx-2">
                          {smt.nama}
                        </div>
                        <div className="text-[9px] text-gray-500 font-mono">
                          NIP: {smt.nip}
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-600 flex flex-col items-center justify-center text-center p-1 rotate-[-6deg] text-emerald-800 font-black">
                          <span className="text-[7px] uppercase tracking-tighter">Verified Official</span>
                          <span className="text-[9px] leading-tight">ALSUT</span>
                          <span className="text-[7px]">2026</span>
                        </div>
                        <span className="text-[8px] text-gray-400 mt-1 font-mono">
                          LW-ALSUT-REC-{smt.nip}
                        </span>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold text-gray-500 mb-10">
                          Store / Duty Manager,
                        </div>
                        <div className="font-black text-black border-t border-black pt-1 mx-2">
                          Living World Alam Sutera
                        </div>
                        <div className="text-[9px] text-gray-500">
                          Operasional 2026
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Document Info Bar below preview */}
            <div className="text-xs text-gray-500 font-medium mt-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#FFE600]" />
              <span>Dokumen siap dibagikan dalam format PDF resmi resolusi tinggi.</span>
            </div>
          </div>

          {/* Right Controls & Action Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4">
            
            {/* Quick Action Box */}
            <div className="bg-white border-3 border-black rounded-2xl p-4 shadow-[3px_3px_0px_0px_#000]">
              <h4 className="text-xs font-black uppercase tracking-wider text-black mb-3 flex items-center gap-1.5">
                <Send className="w-4 h-4 text-[#FF3E83]" />
                <span>Pilihan Kirim & Bagikan</span>
              </h4>

              <div className="space-y-2.5">
                
                {/* 1. Direct PDF Download */}
                <button
                  onClick={handleDownloadPdf}
                  disabled={isGenerating}
                  className="w-full py-2.5 px-3 bg-[#FFE600] hover:bg-yellow-300 text-black border-2 border-black rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isGenerating ? 'Membuat PDF...' : 'Unduh Dokumen PDF'}</span>
                </button>

                {/* 2. Direct Web Share / Device Share */}
                <button
                  onClick={handleNativeSharePdf}
                  disabled={isGenerating}
                  className="w-full py-2.5 px-3 bg-[#06D6A0] hover:bg-emerald-400 text-black border-2 border-black rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 transition-all disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Bagikan File PDF (Device Share)</span>
                </button>

                {/* 3. WhatsApp Direct Share Button */}
                <button
                  onClick={() => setShowWaInput(!showWaInput)}
                  className="w-full py-2.5 px-3 bg-[#25D366] hover:bg-emerald-500 text-white border-2 border-black rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 transition-all"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Kirim via WhatsApp</span>
                </button>

                {/* WhatsApp Phone Number Expandable Form */}
                {showWaInput && (
                  <div className="p-3 bg-emerald-50 border-2 border-[#25D366] rounded-xl text-xs space-y-2 animate-in fade-in duration-150">
                    <label className="block text-[11px] font-bold text-gray-700">
                      Nomor WhatsApp Tujuan (Opsional):
                    </label>
                    <input
                      type="tel"
                      placeholder="Contoh: 08123456789 atau 62812..."
                      value={waPhone}
                      onChange={(e) => setWaPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border-2 border-black rounded-lg text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                    />
                    <div className="text-[10px] text-gray-500">
                      *Klik tombol di bawah untuk mengunduh PDF dan otomatis membuka chat WhatsApp.
                    </div>
                    <button
                      onClick={handleShareToWhatsApp}
                      disabled={isGenerating}
                      className="w-full py-2 bg-[#25D366] hover:bg-emerald-600 text-white font-black rounded-lg border border-black flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Buka WhatsApp & Unduh PDF</span>
                    </button>
                  </div>
                )}

                {/* 4. Browser Print */}
                <button
                  onClick={handleBrowserPrint}
                  className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-black border-2 border-black rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4 text-gray-700" />
                  <span>Cetak Langsung (Printer)</span>
                </button>

                {/* 5. Copy Text Summary */}
                <button
                  onClick={handleCopySummaryText}
                  className="w-full py-2 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {copiedSummary ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-black">Teks Rangkuman Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-gray-500" />
                      <span>Salin Rangkuman Teks</span>
                    </>
                  )}
                </button>
              </div>

              {/* Loader indicator when rendering */}
              {isGenerating && (
                <div className="mt-3 p-2.5 bg-yellow-50 border-2 border-[#FFE600] rounded-xl flex items-center gap-2 text-xs font-bold text-black animate-pulse">
                  <div className="w-3 h-3 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  <span>{generatingProgress || 'Sedang memproses PDF...'}</span>
                </div>
              )}
            </div>

            {/* Customization Options Box */}
            <div className="bg-white border-3 border-black rounded-2xl p-4 shadow-[3px_3px_0px_0px_#000]">
              <h4 className="text-xs font-black uppercase tracking-wider text-black mb-3 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#118AB2]" />
                <span>Pengaturan Dokumen</span>
              </h4>

              <div className="space-y-3 text-xs">
                
                {/* Focus Period Selector */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-600 mb-1">
                    Cakupan Periode:
                  </label>
                  <select
                    value={focusMonth}
                    onChange={(e) => setFocusMonth(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border-2 border-black rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="all">Semua Bulan (YTD Jan - Ags 2026)</option>
                    {MONTH_CONFIGS.map(m => (
                      <option key={m.key} value={m.key}>
                        Hanya Bulan {m.name} 2026
                      </option>
                    ))}
                  </select>
                </div>

                {/* Toggles */}
                <div className="space-y-2 pt-1 border-t border-gray-200">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                    <input
                      type="checkbox"
                      checked={includeMonthlyTable}
                      onChange={(e) => setIncludeMonthlyTable(e.target.checked)}
                      className="w-4 h-4 accent-black rounded cursor-pointer"
                    />
                    <span>Tabel Rincian Bulanan</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                    <input
                      type="checkbox"
                      checked={includeCoachingLogs}
                      onChange={(e) => setIncludeCoachingLogs(e.target.checked)}
                      className="w-4 h-4 accent-black rounded cursor-pointer"
                    />
                    <span>Catatan Coaching & Action Plan</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                    <input
                      type="checkbox"
                      checked={includeRecommendations}
                      onChange={(e) => setIncludeRecommendations(e.target.checked)}
                      className="w-4 h-4 accent-black rounded cursor-pointer"
                    />
                    <span>Rekomendasi Peningkatan</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                    <input
                      type="checkbox"
                      checked={includeSignatures}
                      onChange={(e) => setIncludeSignatures(e.target.checked)}
                      className="w-4 h-4 accent-black rounded cursor-pointer"
                    />
                    <span>Kolom Tanda Tangan & Verifikasi</span>
                  </label>
                </div>

              </div>
            </div>

            {/* Quick SMT Summary Card */}
            <div className="bg-black text-white rounded-2xl p-3.5 border-2 border-black text-xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 mb-1">
                <span>Profil Terpilih</span>
                <span className="text-[#FFE600] font-black">Rank #{smt.ytd.rank}</span>
              </div>
              <div className="font-black text-white text-sm truncate">
                {smt.nama}
              </div>
              <div className="text-[11px] text-gray-300 font-mono mt-0.5">
                NIP: {smt.nip} • {smt.zone}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
