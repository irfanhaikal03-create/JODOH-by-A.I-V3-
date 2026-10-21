import React, { useState } from 'react';
import { MatchResult } from '../types';
import { jsPDF } from 'jspdf';

export interface MatchDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: MatchResult[];
  initialMatchRank?: number;
  customMatch?: MatchResult;
  participantsCount?: number;
  medianAffinity?: string;
  geographicOverlapPercent?: string;
  smokingConcordance?: string;
}

export const MatchDossierModal: React.FC<MatchDossierModalProps> = ({
  isOpen,
  onClose,
  matches,
  initialMatchRank = 1,
  customMatch,
  participantsCount = 20,
  medianAffinity = '88%',
  geographicOverlapPercent = '85%',
  smokingConcordance = '100%',
}) => {
  const [viewMode, setViewMode] = useState<'single_table' | 'batch_report'>(
    customMatch ? 'single_table' : 'single_table'
  );
  const [selectedRank, setSelectedRank] = useState<number>(initialMatchRank || 1);
  const [tableNumber, setTableNumber] = useState<string>(`Meja ${initialMatchRank || 1}`);
  const [eventName, setEventName] = useState<string>('Sesi Ta\'aruf Eksklusif Siri 2026');
  const [facilitatorName, setFacilitatorName] = useState<string>('Ustaz / Fasilitator Acara');
  const [isAnonymized, setIsAnonymized] = useState<boolean>(false);
  const [includeIcebreakers, setIncludeIcebreakers] = useState<boolean>(true);
  const [includeEvaluationSlip, setIncludeEvaluationSlip] = useState<boolean>(true);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  // Determine active match to display for single table mode
  const activeMatch: MatchResult =
    customMatch ||
    matches.find(m => m.rank === selectedRank) ||
    matches[0] || {
      rank: 1,
      maleId: 'm1',
      femaleId: 'f1',
      maleName: 'Calon Lelaki',
      femaleName: 'Calon Perempuan',
      maleAge: 29,
      femaleAge: 27,
      maleOccupation: 'Eksekutif',
      femaleOccupation: 'Profesional',
      maleLocation: 'Kuala Lumpur',
      femaleLocation: 'Selangor',
      maleSmoking: 'Bukan Perokok',
      femaleSmoking: 'Bukan Perokok',
      score: 92,
      whyTheyMatch: 'Keserasian nilai yang tinggi dan matlamat hidup yang sehaluan.',
      potentialChallenges: 'Penyelarasan masa kerja dan komitmen luar pejabat.',
      recommendedActivities: ['Sesi teh petang santai', 'Bercakap mengenai visi keluarga'],
    };

  // Anonymized candidate codenames for privacy mode
  const displayMaleName = isAnonymized
    ? `CALON LELAKI #${activeMatch.maleId ? activeMatch.maleId.toUpperCase() : `M0${activeMatch.rank}`}`
    : activeMatch.maleName;
  const displayFemaleName = isAnonymized
    ? `CALON PEREMPUAN #${activeMatch.femaleId ? activeMatch.femaleId.toUpperCase() : `F0${activeMatch.rank}`}`
    : activeMatch.femaleName;

  // Tailored Islamic Ta'aruf Questions & Icebreakers based on synergies
  const taarufQuestions = [
    {
      theme: 'Visi Rumahtangga & Nilai Hidup',
      question:
        'Apakah 3 prinsip paling penting dalam membina keluarga yang sakinah, mawaddah & rahmah mengikut pandangan anda?',
    },
    {
      theme: `Kerjaya (${activeMatch.maleOccupation} & ${activeMatch.femaleOccupation})`,
      question:
        'Bagaimanakah anda membahagikan masa antara tuntutan kerjaya profesional dan masa berkualiti untuk rumahtangga?',
    },
    {
      theme: 'Komunikasi & Pengurusan Perbezaan',
      question:
        'Apabila timbul perselisihan faham atau perbezaan pendapat, apakah kaedah komunikasi yang paling anda selesa gunakan?',
    },
    {
      theme: 'Keluarga & Adat Tradisi',
      question:
        'Bagaimanakah pandangan anda mengenai pengurusan giliran hari raya bersama keluarga kedua belah pihak dan penglibatan mertua?',
    },
  ];

  // Browser Print handler
  const handlePrint = () => {
    window.print();
  };

  // Native jsPDF Generator for high-res offline PDF file
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;
      let y = 14;

      const clean = (text: string) => text.replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ').trim();

      if (viewMode === 'single_table') {
        // --- SINGLE TABLE / SPEED DATING CARD DOSSIER ---
        // Header Obsidian Box
        doc.setFillColor(28, 25, 23); // #1C1917 Obsidian Noir
        doc.rect(margin, y, contentWidth, 22, 'F');

        // Gold decorative left accent line
        doc.setFillColor(180, 130, 70); // #B48246 Champagne Gold
        doc.rect(margin, y, 3, 22, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(clean(eventName.toUpperCase()), margin + 7, y + 8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(220, 215, 205);
        doc.text(
          `KAD MEJA TA'ARUF RASMI | ${clean(tableNumber)} | SKOR KESERASIAN: ${activeMatch.score}%`,
          margin + 7,
          y + 14
        );
        doc.text(`Tarikh: ${new Date().toLocaleDateString('ms-MY')}`, pageWidth - margin - 35, y + 14);

        y += 27;

        // Candidate Bios Side-by-Side
        const colWidth = (contentWidth - 6) / 2;

        // Male Candidate Box
        doc.setFillColor(250, 250, 249);
        doc.roundedRect(margin, y, colWidth, 42, 2, 2, 'F');
        doc.setDrawColor(231, 229, 228);
        doc.roundedRect(margin, y, colWidth, 42, 2, 2, 'D');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(180, 130, 70);
        doc.text('CALON LELAKI', margin + 4, y + 6);

        doc.setFontSize(11);
        doc.setTextColor(28, 25, 23);
        doc.text(clean(displayMaleName), margin + 4, y + 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(87, 83, 78);
        doc.text(`Umur: ${activeMatch.maleAge} tahun`, margin + 4, y + 18);
        doc.text(`Kerjaya: ${clean(activeMatch.maleOccupation)}`, margin + 4, y + 23);
        doc.text(`Lokasi: ${clean(activeMatch.maleLocation)}`, margin + 4, y + 28);
        doc.text(`Tabiat: ${clean(activeMatch.maleSmoking)}`, margin + 4, y + 33);
        if (activeMatch.maleHobbies && activeMatch.maleHobbies.length > 0) {
          doc.text(`Minat: ${clean(activeMatch.maleHobbies.slice(0, 3).join(', '))}`, margin + 4, y + 38);
        }

        // Female Candidate Box
        const femaleX = margin + colWidth + 6;
        doc.setFillColor(250, 250, 249);
        doc.roundedRect(femaleX, y, colWidth, 42, 2, 2, 'F');
        doc.setDrawColor(231, 229, 228);
        doc.roundedRect(femaleX, y, colWidth, 42, 2, 2, 'D');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(180, 130, 70);
        doc.text('CALON PEREMPUAN', femaleX + 4, y + 6);

        doc.setFontSize(11);
        doc.setTextColor(28, 25, 23);
        doc.text(clean(displayFemaleName), femaleX + 4, y + 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(87, 83, 78);
        doc.text(`Umur: ${activeMatch.femaleAge} tahun`, femaleX + 4, y + 18);
        doc.text(`Kerjaya: ${clean(activeMatch.femaleOccupation)}`, femaleX + 4, y + 23);
        doc.text(`Lokasi: ${clean(activeMatch.femaleLocation)}`, femaleX + 4, y + 28);
        doc.text(`Tabiat: ${clean(activeMatch.femaleSmoking)}`, femaleX + 4, y + 33);
        if (activeMatch.femaleHobbies && activeMatch.femaleHobbies.length > 0) {
          doc.text(`Minat: ${clean(activeMatch.femaleHobbies.slice(0, 3).join(', '))}`, femaleX + 4, y + 38);
        }

        y += 48;

        // Why They Match Synthesis
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(28, 25, 23);
        doc.text('SINTESIS KESERASIAN & DAYA TARIKAN (ALGORITMA AI)', margin, y);
        y += 4.5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(68, 64, 60);
        const splitWhy = doc.splitTextToSize(clean(activeMatch.whyTheyMatch), contentWidth);
        doc.text(splitWhy, margin, y);
        y += splitWhy.length * 4.2 + 4;

        // Potential Challenges
        if (activeMatch.potentialChallenges) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(180, 130, 70);
          doc.text('PERKARA PERLU PENYESUAIAN:', margin, y);
          y += 4;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(87, 83, 78);
          const splitChal = doc.splitTextToSize(clean(activeMatch.potentialChallenges), contentWidth);
          doc.text(splitChal, margin, y);
          y += splitChal.length * 4 + 4;
        }

        // Ta'aruf Icebreaker Questions
        if (includeIcebreakers) {
          doc.setFillColor(254, 252, 246);
          doc.roundedRect(margin, y, contentWidth, 36, 2, 2, 'F');
          doc.setDrawColor(228, 214, 185);
          doc.roundedRect(margin, y, contentWidth, 36, 2, 2, 'D');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(180, 130, 70);
          doc.text('CADANGAN TOPIK PERBUALAN & SOALAN TA\'ARUF', margin + 4, y + 5.5);

          let qY = y + 10.5;
          taarufQuestions.slice(0, 3).forEach((item, idx) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(28, 25, 23);
            doc.text(`${idx + 1}. ${clean(item.theme)}:`, margin + 4, qY);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(87, 83, 78);
            const qText = doc.splitTextToSize(clean(item.question), contentWidth - 45);
            doc.text(qText, margin + 40, qY);
            qY += 8;
          });

          y += 41;
        }

        // Facilitator / Participant Decision Slip
        if (includeEvaluationSlip) {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(margin, y, contentWidth, 48, 2, 2, 'F');
          doc.setDrawColor(200, 195, 190);
          doc.roundedRect(margin, y, contentWidth, 48, 2, 2, 'D');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(28, 25, 23);
          doc.text('BORANG KEPUTUSAN FASILITATOR & PERSETUJUAN SESI MEJA', margin + 4, y + 6);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(87, 83, 78);
          doc.text('[  ] Bersetuju untuk pertukaran nombor telefon / Ta\'aruf Fasa Seterusnya', margin + 6, y + 13);
          doc.text('[  ] Memerlukan masa istikharah & perbincangan keluarga (Tempoh 3-7 hari)', margin + 6, y + 19);
          doc.text('[  ] Sesi tamat secara harmoni / Mencari calon dengan keserasian berbeza', margin + 6, y + 25);

          doc.text('Catatan Fasilitator: ____________________________________________________________________', margin + 6, y + 33);
          doc.text('Tandatangan Calon Lelaki: _______________   Tandatangan Calon Perempuan: _______________', margin + 6, y + 41);
        }

        // Footer Stamp
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(168, 162, 158);
        doc.text(
          'Dijana melalui JODOH by A.I Platform Pengurusan Jodoh Eksklusif • Hak Cipta Terpelihara',
          margin,
          pageHeight - 6
        );
      } else {
        // --- BATCH DOSSIER REPORT (ALL MATCHES) ---
        doc.setFillColor(28, 25, 23);
        doc.rect(margin, y, contentWidth, 22, 'F');
        doc.setFillColor(180, 130, 70);
        doc.rect(margin, y, 3, 22, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('LAPORAN EKSEKUTIF PADANAN KOHORT JODOH BY A.I', margin + 7, y + 8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(220, 215, 205);
        doc.text(
          `Jumlah ${matches.length} Pasangan 1-to-1 Eksklusif | Kohort ${participantsCount} Calon | Model Algoritma Gemini AI`,
          margin + 7,
          y + 14
        );
        doc.text(`Tarikh: ${new Date().toLocaleDateString('ms-MY')}`, pageWidth - margin - 35, y + 14);

        y += 27;

        // Metrics Ribbon
        doc.setFillColor(250, 250, 249);
        doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'F');
        doc.setDrawColor(231, 229, 228);
        doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'D');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(180, 130, 70);
        doc.text(`Purata Keserasian: ${medianAffinity}`, margin + 5, y + 8);
        doc.setTextColor(28, 25, 23);
        doc.text(`Pertindihan Wilayah: ${geographicOverlapPercent}`, margin + 55, y + 8);
        doc.text(`Kesesuaian Rokok: ${smokingConcordance}`, margin + 110, y + 8);
        doc.text(`Status: Sifar Konflik`, margin + 155, y + 8);

        y += 18;

        // Loop matches
        matches.forEach((m, idx) => {
          if (y + 40 > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }

          doc.setFillColor(m.rank === 1 ? 254 : 255, m.rank === 1 ? 252 : 255, m.rank === 1 ? 246 : 255);
          doc.roundedRect(margin, y, contentWidth, 25, 1.5, 1.5, 'F');
          doc.setDrawColor(m.rank === 1 ? 228 : 231, m.rank === 1 ? 214 : 229, m.rank === 1 ? 185 : 228);
          doc.roundedRect(margin, y, contentWidth, 25, 1.5, 1.5, 'D');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(180, 130, 70);
          doc.text(`MEJA #${m.rank} (${m.score}% AFFINITY)`, margin + 4, y + 6);

          doc.setFontSize(10);
          doc.setTextColor(28, 25, 23);
          doc.text(`${clean(m.maleName)} & ${clean(m.femaleName)}`, margin + 45, y + 6);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(87, 83, 78);
          doc.text(
            `${clean(m.maleName)} (${m.maleAge} thn, ${clean(m.maleOccupation)}, ${clean(m.maleLocation)}) — ${clean(m.femaleName)} (${m.femaleAge} thn, ${clean(m.femaleOccupation)}, ${clean(m.femaleLocation)})`,
            margin + 4,
            y + 12
          );

          const splitWhy = doc.splitTextToSize(`Keserasian: ${clean(m.whyTheyMatch)}`, contentWidth - 8);
          doc.text(splitWhy.slice(0, 2), margin + 4, y + 17);

          y += 28;
        });
      }

      const fileName =
        viewMode === 'single_table'
          ? `Dossier_Taaruf_${tableNumber.replace(/\s+/g, '_')}_${activeMatch.maleName.split(' ')[0]}_${activeMatch.femaleName.split(' ')[0]}.pdf`
          : `Laporan_Eksekutif_Padanan_Kohort_Jodoh.pdf`;

      doc.save(fileName);
    } catch (e) {
      console.error('Failed to generate PDF dossier:', e);
      window.print();
    }
  };

  // Copy text summary to clipboard
  const handleCopySummary = () => {
    const text = `📋 DOSSIER SESI TA'ARUF — ${eventName.toUpperCase()}
📍 ${tableNumber.toUpperCase()} | SKOR KESERASIAN: ${activeMatch.score}%
--------------------------------------------------
👨 CALON LELAKI: ${displayMaleName} (${activeMatch.maleAge} thn)
💼 Kerjaya: ${activeMatch.maleOccupation} | 📍 Lokasi: ${activeMatch.maleLocation}
🚬 Status Merokok: ${activeMatch.maleSmoking}

🧕 CALON PEREMPUAN: ${displayFemaleName} (${activeMatch.femaleAge} thn)
💼 Kerjaya: ${activeMatch.femaleOccupation} | 📍 Lokasi: ${activeMatch.femaleLocation}
🚬 Status Merokok: ${activeMatch.femaleSmoking}

✨ FAKTOR KESERASIAN:
${activeMatch.whyTheyMatch}

💡 CADANGAN SOALAN TA'ARUF:
${taarufQuestions.map((q, i) => `${i + 1}. [${q.theme}] ${q.question}`).join('\n')}

Disediakan oleh Fasilitator: ${facilitatorName}`;

    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in print:p-0 print:bg-white print:static print:z-auto">
      {/* Dedicated Print Media Stylesheet to guarantee high-res crisp print */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #dossier-print-container, #dossier-print-container * {
            visibility: visible;
          }
          #dossier-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 15mm !important;
            background: white !important;
            color: #1c1917 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>

      <div
        className="bg-white w-full max-w-4xl max-h-[94vh] rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full"
        onClick={e => e.stopPropagation()}
      >
        {/* MODAL CONTROLS HEADER BAR (Hidden when printing) */}
        <header className="px-5 py-4 bg-stone-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 border-b border-stone-800 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-800 text-[#b48246] flex items-center justify-center border border-[#b48246]/40 shrink-0">
              <span className="material-symbols-outlined text-2xl">print</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base sm:text-lg text-white">
                  Dossier & Kad Meja Ta'aruf Fizikal
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#b48246]/20 text-[#b48246] font-semibold border border-[#b48246]/30">
                  Sedia Cetak
                </span>
              </div>
              <p className="text-xs text-stone-300">
                Format dokumen rasmi untuk sesi ta'aruf bersemuka & speed dating syariah
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-colors cursor-pointer active:scale-95"
              title="Salin ringkasan ke papan keratan"
            >
              <span className="material-symbols-outlined text-sm">
                {copySuccess ? 'check' : 'content_copy'}
              </span>
              <span>{copySuccess ? 'Disalin!' : 'Salin Teks'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#b48246] hover:bg-[#a37237] text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
              title="Muat turun fail PDF A4 beresolusi tinggi"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Muat Turun PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-stone-900 text-xs font-bold shadow-sm hover:bg-stone-100 transition-all cursor-pointer active:scale-95"
              title="Cetak terus menggunakan pencetak atau Cetak ke PDF"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>Cetak Sekarang</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-all cursor-pointer ml-1"
              aria-label="Tutup"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </header>

        {/* TOOLBAR CONTROLS RIBBON (Customization for event) (Hidden when printing) */}
        <div className="px-5 py-3 bg-stone-50 border-b border-stone-200 text-xs text-stone-700 flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('single_table')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'single_table'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Kad Meja Individu
            </button>
            <button
              type="button"
              onClick={() => setViewMode('batch_report')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'batch_report'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Laporan Penuh Kohort
            </button>
          </div>

          {/* Conditional Match Selector */}
          {viewMode === 'single_table' && matches.length > 0 && !customMatch && (
            <div className="flex items-center gap-2">
              <span className="text-stone-500 font-medium">Pilih Pasangan:</span>
              <select
                value={selectedRank}
                onChange={e => {
                  const rank = Number(e.target.value);
                  setSelectedRank(rank);
                  setTableNumber(`Meja 0${rank}`);
                }}
                className="bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#b48246]"
              >
                {matches.map(m => (
                  <option key={m.rank} value={m.rank}>
                    Meja #{m.rank} — {m.maleName.split(' ')[0]} & {m.femaleName.split(' ')[0]} ({m.score}%)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Options Toggles */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymized}
                onChange={e => setIsAnonymized(e.target.checked)}
                className="rounded text-[#b48246] focus:ring-[#b48246] cursor-pointer"
              />
              <span className="font-medium text-stone-700">Mod Kod Rahsia (Privasi)</span>
            </label>

            {viewMode === 'single_table' && (
              <>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeIcebreakers}
                    onChange={e => setIncludeIcebreakers(e.target.checked)}
                    className="rounded text-[#b48246] focus:ring-[#b48246] cursor-pointer"
                  />
                  <span className="font-medium text-stone-700">Soalan Ta'aruf</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeEvaluationSlip}
                    onChange={e => setIncludeEvaluationSlip(e.target.checked)}
                    className="rounded text-[#b48246] focus:ring-[#b48246] cursor-pointer"
                  />
                  <span className="font-medium text-stone-700">Borang Keputusan</span>
                </label>
              </>
            )}
          </div>
        </div>

        {/* SCROLLABLE DOCUMENT CANVAS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-stone-100/60 print:p-0 print:bg-white print:overflow-visible">
          <div
            id="dossier-print-container"
            className="max-w-3xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-stone-200/80 print:shadow-none print:border-none print:p-0 print:max-w-full"
          >
            {/* DOCUMENT HEADER BANNER */}
            <header className="p-5 sm:p-6 rounded-2xl bg-stone-900 text-white mb-6 border-l-4 border-[#b48246] relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#b48246] mb-1">
                    <span>Jodoh by A.I Executive Protocol</span>
                    <span>·</span>
                    <span>Sesi Bersemuka</span>
                  </div>
                  <h1 className="font-serif font-bold text-xl sm:text-2xl text-white tracking-tight">
                    {viewMode === 'single_table' ? (
                      <input
                        type="text"
                        value={eventName}
                        onChange={e => setEventName(e.target.value)}
                        className="bg-transparent border-b border-transparent hover:border-white/30 focus:border-white focus:outline-none w-full font-serif font-bold"
                        title="Klik untuk sunting nama acara"
                      />
                    ) : (
                      'LAPORAN EKSEKUTIF PADANAN KOHORT'
                    )}
                  </h1>
                  <p className="text-xs text-stone-300 mt-1">
                    {viewMode === 'single_table'
                      ? 'Dossier Rasmi Meja Ta\'aruf & Penilaian Keserasian Holistik'
                      : `Analisis Padanan Algoritma 1-ke-1 Eksklusif • Kohort ${participantsCount} Calon`}
                  </p>
                </div>

                <div className="sm:text-right sm:border-l sm:border-stone-800 sm:pl-5 shrink-0">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                    {viewMode === 'single_table' ? 'Lokasi / Nombor Meja' : 'Tarikh Sesi'}
                  </div>
                  {viewMode === 'single_table' ? (
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={e => setTableNumber(e.target.value)}
                      className="bg-stone-800/80 text-[#b48246] font-bold text-sm px-2.5 py-1 rounded border border-stone-700 w-32 text-center mt-1 focus:outline-none focus:ring-1 focus:ring-[#b48246]"
                    />
                  ) : (
                    <div className="text-sm font-bold text-white mt-1">
                      {new Date().toLocaleDateString('ms-MY', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* SINGLE TABLE VIEW MODE */}
            {viewMode === 'single_table' ? (
              <div className="space-y-6">
                {/* MATCH PROFILE OVERVIEW CARD */}
                <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200/90 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#b48246]/50 flex items-center justify-center text-[#b48246] font-serif font-bold text-lg shadow-2xs">
                      #{activeMatch.rank}
                    </div>
                    <div>
                      <div className="text-xs text-stone-500 font-medium">Pasangan Rasmi Meja</div>
                      <div className="text-base sm:text-lg font-bold font-serif text-stone-900">
                        {displayMaleName} & {displayFemaleName}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-stone-200 shadow-2xs">
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">
                        Skor Keserasian
                      </div>
                      <div className="text-lg font-bold font-mono text-stone-900">
                        {activeMatch.score}%
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-[#b48246]/10 text-[#b48246] flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">favorite</span>
                    </div>
                  </div>
                </div>

                {/* SIDE-BY-SIDE CANDIDATE DOSSIERS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Calon Lelaki */}
                  <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                        <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                          Calon Lelaki
                        </span>
                      </div>
                      <span className="text-xs text-stone-500 font-medium">
                        {activeMatch.maleAge} Tahun
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-stone-900 font-serif">
                        {displayMaleName}
                      </h4>
                      <p className="text-xs text-[#b48246] font-semibold mt-0.5">
                        {activeMatch.maleOccupation}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs text-stone-600 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-stone-400">location_on</span>
                        <span>{activeMatch.maleLocation}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-stone-400">smoking_rooms</span>
                        <span>{activeMatch.maleSmoking}</span>
                      </div>
                      {activeMatch.maleHobbies && activeMatch.maleHobbies.length > 0 && (
                        <div className="flex items-start gap-2 pt-1">
                          <span className="material-symbols-outlined text-sm text-stone-400 mt-0.5">
                            interests
                          </span>
                          <span className="text-stone-500">
                            Minat & Riadah: <strong className="text-stone-800">{activeMatch.maleHobbies.join(', ')}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Calon Perempuan */}
                  <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#b48246]"></span>
                        <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                          Calon Perempuan
                        </span>
                      </div>
                      <span className="text-xs text-stone-500 font-medium">
                        {activeMatch.femaleAge} Tahun
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-stone-900 font-serif">
                        {displayFemaleName}
                      </h4>
                      <p className="text-xs text-[#b48246] font-semibold mt-0.5">
                        {activeMatch.femaleOccupation}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs text-stone-600 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-stone-400">location_on</span>
                        <span>{activeMatch.femaleLocation}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-stone-400">smoking_rooms</span>
                        <span>{activeMatch.femaleSmoking}</span>
                      </div>
                      {activeMatch.femaleHobbies && activeMatch.femaleHobbies.length > 0 && (
                        <div className="flex items-start gap-2 pt-1">
                          <span className="material-symbols-outlined text-sm text-stone-400 mt-0.5">
                            interests
                          </span>
                          <span className="text-stone-500">
                            Minat & Riadah: <strong className="text-stone-800">{activeMatch.femaleHobbies.join(', ')}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SYNTHESIS & POTENTIAL CHALLENGES */}
                <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-3">
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5 mb-1.5">
                      <span className="material-symbols-outlined text-base text-[#b48246]">auto_awesome</span>
                      <span>Sintesis Afiniti & Sebab Dipadankan</span>
                    </h5>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {activeMatch.whyTheyMatch}
                    </p>
                  </div>

                  {activeMatch.potentialChallenges && (
                    <div className="pt-2 border-t border-stone-100">
                      <h6 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                        Titik Penyelarasan & Cabaran Berpotensi:
                      </h6>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {activeMatch.potentialChallenges}
                      </p>
                    </div>
                  )}
                </div>

                {/* TA'ARUF ICEBREAKER QUESTIONS */}
                {includeIcebreakers && (
                  <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/70 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base text-[#b48246]">forum</span>
                        <span>Cadangan Soalan Ta'aruf & Panduan Perbualan Meja</span>
                      </h5>
                      <span className="text-[10px] text-stone-400 font-semibold">
                        Gunakan sebagai panduan memulakan perbualan
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {taarufQuestions.map((q, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-3 rounded-xl border border-stone-200/80 text-xs shadow-2xs"
                        >
                          <div className="text-[10px] font-bold text-[#b48246] uppercase tracking-wider mb-1">
                            {idx + 1}. {q.theme}
                          </div>
                          <p className="text-stone-700 leading-relaxed font-medium">
                            "{q.question}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FACILITATOR / CANDIDATE EVALUATION & CONSENT SLIP */}
                {includeEvaluationSlip && (
                  <div className="p-5 rounded-2xl bg-white border border-stone-300 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                        Borang Keputusan Meja & Persetujuan Bersama
                      </h5>
                      <span className="text-[10px] text-stone-500 font-mono">
                        Ref ID: TAARUF-{activeMatch.rank}-{new Date().getFullYear()}
                      </span>
                    </div>

                    {/* Checkbox Options */}
                    <div className="space-y-2 text-xs text-stone-700 font-medium">
                      <label className="flex items-center gap-2.5 p-2 rounded-lg bg-stone-50 border border-stone-200/80">
                        <input type="checkbox" className="rounded text-stone-800" />
                        <span>Bersetuju untuk pertukaran nombor telefon / Ta'aruf Fasa 2 bersama keluarga</span>
                      </label>
                      <label className="flex items-center gap-2.5 p-2 rounded-lg bg-stone-50 border border-stone-200/80">
                        <input type="checkbox" className="rounded text-stone-800" />
                        <span>Memerlukan tempoh istikharah & perbincangan lanjut (Tempoh cadangan: 3 hingga 7 hari)</span>
                      </label>
                      <label className="flex items-center gap-2.5 p-2 rounded-lg bg-stone-50 border border-stone-200/80">
                        <input type="checkbox" className="rounded text-stone-800" />
                        <span>Sesi tamat secara harmoni / Mencari calon dengan keserasian yang berbeza</span>
                      </label>
                    </div>

                    {/* Signatures & Facilitator Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="border border-stone-200 rounded-xl p-3 bg-stone-50/50">
                        <div className="text-[10px] text-stone-400 font-bold uppercase mb-6">
                          Tandatangan Calon Lelaki
                        </div>
                        <div className="border-t border-stone-300 pt-1 text-xs text-stone-500">
                          Nama: {displayMaleName}
                        </div>
                      </div>

                      <div className="border border-stone-200 rounded-xl p-3 bg-stone-50/50">
                        <div className="text-[10px] text-stone-400 font-bold uppercase mb-6">
                          Tandatangan Calon Perempuan
                        </div>
                        <div className="border-t border-stone-300 pt-1 text-xs text-stone-500">
                          Nama: {displayFemaleName}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 text-[11px] text-stone-500 flex items-center justify-between border-t border-stone-100">
                      <span>Fasilitator Bertugas: {facilitatorName}</span>
                      <span>Disahkan oleh Pengelola Acara Jodoh</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* BATCH REPORT VIEW MODE */
              <div className="space-y-6">
                {/* Cohort Metric Summary Ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Purata Afiniti</span>
                    <span className="font-serif font-bold text-[#b48246] text-lg">{medianAffinity}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Kesesuaian Rokok</span>
                    <span className="font-bold text-stone-900 text-sm">{smokingConcordance}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Pertindihan Lokasi</span>
                    <span className="font-bold text-stone-900 text-sm">{geographicOverlapPercent}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Jumlah Pasangan</span>
                    <span className="font-bold text-stone-900 text-sm">{matches.length} Pasangan 1-to-1</span>
                  </div>
                </div>

                {/* List of matches */}
                <div className="space-y-3">
                  {matches.map(m => (
                    <div
                      key={m.rank}
                      className="p-4 rounded-xl border border-stone-200 bg-white space-y-2"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-stone-900 text-white">
                            MEJA #{m.rank}
                          </span>
                          <span className="font-serif font-bold text-sm text-stone-900">
                            {isAnonymized ? `CALON M0${m.rank}` : m.maleName} & {isAnonymized ? `CALON F0${m.rank}` : m.femaleName}
                          </span>
                        </div>
                        <span className="text-xs font-bold font-mono text-[#b48246]">
                          {m.score}% Keserasian
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600">
                        <div>
                          <strong>Calon Lelaki:</strong> {m.maleAge} thn, {m.maleOccupation}, {m.maleLocation}
                        </div>
                        <div>
                          <strong>Calon Perempuan:</strong> {m.femaleAge} thn, {m.femaleOccupation}, {m.femaleLocation}
                        </div>
                      </div>

                      <p className="text-xs text-stone-500 pt-1 leading-relaxed">
                        <strong>Faktor Utama:</strong> {m.whyTheyMatch}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DOCUMENT FOOTER STAMP */}
            <footer className="mt-8 pt-4 border-t border-stone-200 text-center text-xs text-stone-400">
              <p>JODOH BY A.I • Sistem Padanan Ta'aruf Holistik & Pengurusan Pasangan Bersepadu</p>
              <p className="text-[10px] text-stone-400 mt-0.5">
                Dokumen rasmi ini dijana secara selamat untuk kegunaan pengelola dan fasilitator ta'aruf bersemuka.
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};
