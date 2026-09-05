import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SmtRecord, MonthKey } from '../types';
import { SmtCoachingRecord } from '../utils/coachingStorage';
import { MONTH_CONFIGS, formatPct } from '../utils/parser';

export interface PdfExportOptions {
  focusMonth?: 'all' | MonthKey;
  includeMonthlyTable?: boolean;
  includeCoachingLogs?: boolean;
  includeSignatures?: boolean;
  includeRecommendations?: boolean;
}

export interface GeneratedPdfResult {
  pdf: jsPDF;
  blob: Blob;
  filename: string;
}

export function generateSmtPdfDocument(
  smt: SmtRecord,
  coachingData: SmtCoachingRecord,
  options: PdfExportOptions = {}
): GeneratedPdfResult {
  const {
    focusMonth = 'all',
    includeMonthlyTable = true,
    includeCoachingLogs = true,
    includeSignatures = true,
    includeRecommendations = true,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let currY = margin;

  // 1. Header Banner (#FFE600 Informa Yellow)
  doc.setFillColor(255, 230, 0);
  doc.roundedRect(margin, currY, contentWidth, 23, 2, 2, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, currY, contentWidth, 23, 2, 2, 'S');

  // Informa Badge Box
  doc.setFillColor(0, 0, 0);
  doc.roundedRect(margin + 2.5, currY + 2.5, 18, 18, 2, 2, 'F');
  doc.setTextColor(255, 230, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('INF', margin + 6.5, currY + 9.5);
  doc.setFontSize(7);
  doc.text('ALST', margin + 5.5, currY + 15.5);

  // Title Texts
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMA LIVING WORLD ALAM SUTERA', margin + 24, currY + 7);
  doc.setFontSize(13);
  doc.text('LEMBAR RAPORT KINERJA SMT', margin + 24, currY + 13.5);
  
  const printDateStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const periodLabel = focusMonth === 'all' ? 'YTD Jan - Ags 2026' : `Bulan ${focusMonth.toUpperCase()} 2026`;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Periode: ${periodLabel}  •  Dicetak: ${printDateStr}`, margin + 24, currY + 19);

  // Store Rank Box
  doc.setFillColor(0, 0, 0);
  doc.roundedRect(pageWidth - margin - 26, currY + 3, 23, 17, 2, 2, 'F');
  doc.setTextColor(255, 230, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`#${smt.ytd.rank}`, pageWidth - margin - 14.5, currY + 10, { align: 'center' });
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.text('RANK TOKO', pageWidth - margin - 14.5, currY + 15.5, { align: 'center' });

  currY += 26;

  // 2. Identity & Scorecard Section
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(margin, currY, contentWidth, 18, 2, 2, 'F');
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currY, contentWidth, 18, 2, 2, 'S');

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DATA SMT & ZONA PENJUALAN', margin + 4, currY + 5);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.text(smt.nama, margin + 4, currY + 11);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`NIP: ${smt.nip}   |   Zona: ${smt.zone || 'SEMUA ZONA'}   |   Toko: Living World Alam Sutera (08)`, margin + 4, currY + 15.5);

  // Status Evaluation Badge
  const evalText = smt.ytd.evaluationResult || 'Safe Performance';
  const isBest = evalText.toLowerCase().includes('best');
  const isWarning = evalText.toLowerCase().includes('warning');
  
  if (isBest) {
    doc.setFillColor(6, 214, 160); // Emerald
  } else if (isWarning) {
    doc.setFillColor(239, 71, 111); // Red/Coral
  } else {
    doc.setFillColor(0, 0, 0); // Black
  }
  doc.roundedRect(pageWidth - margin - 46, currY + 4, 42, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(evalText, pageWidth - margin - 25, currY + 10.5, { align: 'center' });

  currY += 21;

  // 3. 4 KPI Metrics Card Grid
  const cardWidth = (contentWidth - 9) / 4;
  const cardHeight = 16.5;

  const avgFp = (smt.ytd.polisCount / MONTH_CONFIGS.length).toFixed(1);
  const coachingCount = coachingData?.totalCount || 0;

  const metricCards = [
    {
      label: 'TOTAL SALES YTD',
      val: smt.ytd.rawSales,
      sub: `Pencapaian: ${formatPct(smt.ytd.salesPct)}`,
      subColor: smt.ytd.salesPct >= 100 ? [16, 130, 60] : [180, 50, 50],
    },
    {
      label: 'POLIS FURNIPRO (FP)',
      val: `${smt.ytd.polisCount} Polis`,
      sub: `Rata-rata: ${avgFp} polis/bln`,
      subColor: [30, 90, 150],
    },
    {
      label: 'CLEAN & CARE (C&C)',
      val: smt.ytd.rawComser,
      sub: 'Layanan Komersil SMT',
      subColor: [120, 80, 20],
    },
    {
      label: 'KONSISTENSI & COACHING',
      val: `${smt.ytd.salesAchCount} / ${MONTH_CONFIGS.length} Bln Ach`,
      sub: `Log Supervisi: ${coachingCount} sesi`,
      subColor: [40, 40, 40],
    },
  ];

  metricCards.forEach((card, idx) => {
    const x = margin + idx * (cardWidth + 3);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, currY, cardWidth, cardHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, currY, cardWidth, cardHeight, 1.5, 1.5, 'S');

    doc.setTextColor(110, 110, 110);
    doc.setFontSize(6.2);
    doc.setFont('helvetica', 'bold');
    doc.text(card.label, x + 3, currY + 4.5);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8.8);
    doc.setFont('helvetica', 'bold');
    doc.text(card.val, x + 3, currY + 9.5);

    doc.setTextColor(card.subColor[0], card.subColor[1], card.subColor[2]);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(card.sub, x + 3, currY + 13.8);
  });

  currY += cardHeight + 4;

  // 4. Monthly Performance Table
  if (includeMonthlyTable) {
    const months = focusMonth === 'all' 
      ? MONTH_CONFIGS 
      : MONTH_CONFIGS.filter(m => m.key === focusMonth);

    const tableRows = months.map(m => {
      const d = smt.monthly[m.key];
      const salesPctStr = d ? formatPct(d.salesPct) : '0%';
      const salesRpStr = d ? d.rawSales : 'Rp0';
      const fpStr = d ? `${d.fpCount} Polis` : '0 Polis';
      const ccStr = d ? d.rawCc : 'Rp0';
      const grade = d ? d.grade : 'D';
      const isAch = d ? d.isAchieved : false;
      const statusStr = isAch ? `ACH (${grade})` : `UNDER (${grade})`;

      return [
        `${m.name} 2026`,
        '100%',
        `${salesPctStr} (${salesRpStr})`,
        fpStr,
        ccStr,
        statusStr,
      ];
    });

    autoTable(doc, {
      startY: currY,
      head: [['Bulan', 'Target', 'Sales (% / Nominal)', 'Furnipro (FP)', 'Clean & Care (C&C)', 'Status / Grade']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.2,
        halign: 'center',
        cellPadding: 1.8,
      },
      bodyStyles: {
        fontSize: 6.8,
        cellPadding: 1.6,
        textColor: [20, 20, 20],
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold', cellWidth: 32 },
        1: { halign: 'center', cellWidth: 18 },
        2: { halign: 'center', fontStyle: 'bold', cellWidth: 42 },
        3: { halign: 'center', cellWidth: 26 },
        4: { halign: 'right', fontStyle: 'bold', cellWidth: 34 },
        5: { halign: 'center', fontStyle: 'bold', cellWidth: 30 },
      },
      margin: { left: margin, right: margin },
      didParseCell: function(data) {
        if (data.section === 'body') {
          if (data.column.index === 2 || data.column.index === 5) {
            const raw = String(data.cell.raw || '');
            if (raw.includes('ACH') || parseFloat(raw) >= 100) {
              data.cell.styles.textColor = [16, 128, 60];
            } else if (raw.includes('UNDER')) {
              data.cell.styles.textColor = [180, 40, 40];
            }
          }
        }
      },
    });

    // @ts-ignore
    currY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 4 : currY + 45;
  }

  // 5. Recommendations Section
  if (includeRecommendations && currY < pageHeight - 65) {
    const isUnderSales = smt.ytd.salesPct < 100;
    const isLowFp = smt.ytd.polisCount < 10;
    const isLowCc = smt.ytd.rawComser === 'Rp0' || smt.ytd.salesAchCount < 3;

    doc.setFillColor(254, 252, 232); // Light yellow
    doc.roundedRect(margin, currY, contentWidth, 23, 2, 2, 'F');
    doc.setDrawColor(230, 210, 100);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currY, contentWidth, 23, 2, 2, 'S');

    doc.setTextColor(130, 90, 0);
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.text('CATATAN EVALUASI & REKOMENDASI PENGEMBANGAN', margin + 3, currY + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(40, 40, 40);

    const rec1 = isUnderSales
      ? '• Sales: Fokus pada peningkatan closing rate harian dan follow-up prospek walk-in customer.'
      : '• Sales: Performa sales sangat baik. Pertahankan ritme penjualan dan dorong basket size transaksi.';
    const rec2 = isLowFp
      ? '• Furnipro: Perlu dorongan penawaran garansi perlindungan perabot sejak awal negosiasi harga.'
      : '• Furnipro: Capaian polis memuaskan, konsisten rekomendasikan proteksi furniture di setiap nota.';
    const rec3 = isLowCc
      ? '• Clean & Care: Aktifkan penawaran jasa pencucian dan perawatan furnitur sofa, matras, atau karpet.'
      : '• Clean & Care: Pertahankan pengenalan layanan komersil untuk kepuasan purna-jual pelanggan.';

    doc.text(rec1, margin + 3, currY + 9.5);
    doc.text(rec2, margin + 3, currY + 14);
    doc.text(rec3, margin + 3, currY + 18.5);

    currY += 26;
  }

  // 6. Coaching Logs Summary (if space permits)
  if (includeCoachingLogs && coachingData?.customLogs && coachingData.customLogs.length > 0 && currY < pageHeight - 55) {
    const recentLog = coachingData.customLogs[coachingData.customLogs.length - 1];
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(margin, currY, contentWidth, 16, 2, 2, 'F');
    doc.setDrawColor(210, 220, 230);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currY, contentWidth, 16, 2, 2, 'S');

    doc.setTextColor(20, 60, 110);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(`CATATAN COACHING SUPERVISI TERAKHIR (${recentLog.date} oleh ${recentLog.coachName || 'Supervisor'})`, margin + 3, currY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(50, 50, 50);
    const cleanTopic = recentLog.topic ? `Topik: ${recentLog.topic}. ` : '';
    const cleanNotes = recentLog.notes ? `Catatan: ${recentLog.notes}` : 'Catatan pembinaan supervisi berkala.';
    const combined = (cleanTopic + cleanNotes).substring(0, 105);
    
    doc.text(combined, margin + 3, currY + 9.2);
    if (recentLog.letterNumber) {
      doc.text(`No. Surat/Memo: ${recentLog.letterNumber}`, margin + 3, currY + 13.2);
    }

    currY += 19;
  }

  // 7. Official Signatures Block
  if (includeSignatures) {
    // Ensure signature block stays at the bottom of the page
    const sigBoxY = Math.max(currY, pageHeight - margin - 32);
    const colWidth = contentWidth / 3;

    // Col 1: SMT Signature
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('SMT Bersangkutan,', margin + colWidth / 2, sigBoxY + 3, { align: 'center' });
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.3);
    doc.line(margin + 6, sigBoxY + 18, margin + colWidth - 6, sigBoxY + 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(0, 0, 0);
    doc.text(smt.nama, margin + colWidth / 2, sigBoxY + 22, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(110, 110, 110);
    doc.text(`NIP: ${smt.nip}`, margin + colWidth / 2, sigBoxY + 25.5, { align: 'center' });

    // Col 2: Official Stamp Verification
    const stampX = margin + colWidth + colWidth / 2;
    const stampY = sigBoxY + 13;
    doc.setDrawColor(16, 140, 70);
    doc.setLineWidth(0.5);
    doc.circle(stampX, stampY, 10.5, 'S');
    doc.setTextColor(16, 140, 70);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.text('VERIFIED OFFICIAL', stampX, stampY - 3.8, { align: 'center' });
    doc.setFontSize(7.5);
    doc.text('ALSUT', stampX, stampY + 0.5, { align: 'center' });
    doc.setFontSize(5.5);
    doc.text('2026', stampX, stampY + 4.8, { align: 'center' });

    // Col 3: Store / Duty Manager
    const col3X = margin + colWidth * 2;
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Store / Duty Manager,', col3X + colWidth / 2, sigBoxY + 3, { align: 'center' });
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.3);
    doc.line(col3X + 6, sigBoxY + 18, col3X + colWidth - 6, sigBoxY + 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(0, 0, 0);
    doc.text('Living World Alam Sutera', col3X + colWidth / 2, sigBoxY + 22, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(110, 110, 110);
    doc.text('Operasional SMT 2026', col3X + colWidth / 2, sigBoxY + 25.5, { align: 'center' });
  }

  // Footer Note
  doc.setFontSize(6);
  doc.setTextColor(160, 160, 160);
  doc.text(
    'Dokumen Resmi Informa Living World Alam Sutera • Dihasilkan melalui Sistem Raport SMT Alsut 2026',
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  const cleanName = smt.nama.replace(/[^a-zA-Z0-9]/g, '_');
  const periodStr = focusMonth === 'all' ? 'YTD_2026' : `Bulan_${focusMonth.toUpperCase()}_2026`;
  const filename = `Raport_SMT_${smt.nip}_${cleanName}_${periodStr}.pdf`;
  const blob = doc.output('blob');

  return {
    pdf: doc,
    blob,
    filename,
  };
}
