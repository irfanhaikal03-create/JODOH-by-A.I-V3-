import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { MatchResult, Participant } from '../types';
import { DossierPreviewModal } from './DossierPreviewModal';
import { useLanguage } from '../context/LanguageContext';

// Clean Unicode and non-WinAnsi characters to prevent jsPDF encoding errors
function cleanPdfText(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019]/g, "'") // smart single quotes
    .replace(/[\u201C\u201D]/g, '"') // smart double quotes
    .replace(/[\u2013\u2014]/g, '-') // en-dash, em-dash
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '*') // bullet characters
    .replace(/…/g, '...')
    .replace(/[^\x00-\x7F]/g, ' ') // convert any remaining multi-byte chars to space
    .trim();
}

interface TopMatchesViewProps {
  matches: MatchResult[];
  participantsCount: number;
  onBackToParticipants: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  onSimulateInsufficient: () => void;
  showToast: (msg: string) => void;
  userRole?: 'admin' | 'participant';
  matchesPublished?: boolean;
  onTogglePublish?: () => void;
  currentUserParticipantId?: string;
  currentUserName?: string;
  onSaveMatchesToApp?: () => void;
  onOpenSavedSessions?: () => void;
  onOpenResetModal?: () => void;
  savedSessionsCount?: number;
  activeSessionTitle?: string;
  onOpenConcierge?: (rank?: number) => void;
}

export const TopMatchesView: React.FC<TopMatchesViewProps> = ({
  matches,
  participantsCount,
  onBackToParticipants,
  onRegenerate,
  isRegenerating,
  onSimulateInsufficient,
  showToast,
  userRole = 'admin',
  matchesPublished = true,
  onTogglePublish,
  currentUserParticipantId,
  currentUserName,
  onSaveMatchesToApp,
  onOpenSavedSessions,
  onOpenResetModal,
  savedSessionsCount = 0,
  activeSessionTitle,
  onOpenConcierge,
}) => {
  const { t, translateSmoking } = useLanguage();
  const isAdmin = userRole === 'admin';
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const [isDossierPreviewOpen, setIsDossierPreviewOpen] = useState(false);

  // Check if current participant user is in any match
  const myMatch = useMemo(() => {
    if (isAdmin || !currentUserName) return null;
    const nameLower = currentUserName.toLowerCase();
    return matches.find(
      m =>
        m.maleName.toLowerCase().includes(nameLower) ||
        nameLower.includes(m.maleName.toLowerCase()) ||
        m.femaleName.toLowerCase().includes(nameLower) ||
        nameLower.includes(m.femaleName.toLowerCase()) ||
        (currentUserParticipantId && (m.maleId === currentUserParticipantId || m.femaleId === currentUserParticipantId))
    );
  }, [matches, currentUserName, currentUserParticipantId, isAdmin]);

  const allExpanded = useMemo(() => {
    if (matches.length <= 1) return false;
    return matches.slice(1).every(m => expandedCards[m.rank]);
  }, [matches, expandedCards]);

  const toggleCard = (rank: number) => {
    setExpandedCards(prev => ({
      ...prev,
      [rank]: !prev[rank],
    }));
  };

  const toggleAll = () => {
    const nextState = !allExpanded;
    const updated: Record<number, boolean> = {};
    matches.slice(1).forEach(m => {
      updated[m.rank] = nextState;
    });
    setExpandedCards(updated);
  };

  // Metrics calculations
  const medianAffinity = useMemo(() => {
    if (!matches.length) return '0.0%';
    const scores = matches.map(m => m.score);
    const sum = scores.reduce((a, b) => a + b, 0);
    return (sum / scores.length).toFixed(1) + '%';
  }, [matches]);

  const smokingConcordance = useMemo(() => {
    if (!matches.length) return '0/0';
    const concordant = matches.filter(m => m.maleSmoking === m.femaleSmoking).length;
    return `${concordant}/${matches.length}`;
  }, [matches]);

  const geographicOverlapPercent = useMemo(() => {
    if (!matches.length) return '0%';
    const sameLoc = matches.filter(
      m => m.maleLocation.toLowerCase().includes(m.femaleLocation.toLowerCase()) ||
           m.femaleLocation.toLowerCase().includes(m.maleLocation.toLowerCase()) ||
           (m.maleLocation.includes('Kuala Lumpur') && m.femaleLocation.includes('Petaling Jaya')) ||
           (m.maleLocation.includes('Petaling Jaya') && m.femaleLocation.includes('Kuala Lumpur')) ||
           (m.maleLocation.includes('Selangor') && m.femaleLocation.includes('Kuala Lumpur'))
    ).length;
    return Math.round((sameLoc / matches.length) * 100) + '%';
  }, [matches]);

  // Export options - PDF Dossier Generation
  const handleExportPDF = () => {
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

      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
          // Mini Header on subsequent pages
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(137, 113, 118);
          doc.text(`JODOH by A.I - Matchmaking Dossier (Continued)`, margin, y);
          doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin - 15, y);
          y += 4;
          doc.setDrawColor(220, 192, 197);
          doc.setLineWidth(0.3);
          doc.line(margin, y, pageWidth - margin, y);
          y += 6;
        }
      };

      // Header Banner
      doc.setFillColor(98, 0, 45); // Primary #62002d
      doc.rect(margin, y, contentWidth, 20, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('JODOH BY A.I - EXECUTIVE MATCHMAKING DOSSIER', margin + 6, y + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(
        `Top ${matches.length} Algorithmic Compatibility Matches | 1-to-1 Exclusive Model | Cohort of ${participantsCount} Candidates`,
        margin + 6,
        y + 15
      );

      y += 24;

      // Metric Summary Ribbon Box
      doc.setFillColor(242, 243, 255);
      doc.roundedRect(margin, y, contentWidth, 11, 2, 2, 'F');
      doc.setDrawColor(220, 192, 197);
      doc.roundedRect(margin, y, contentWidth, 11, 2, 2, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(98, 0, 45);
      doc.text(`Median Affinity: ${medianAffinity}`, margin + 5, y + 7);
      doc.setTextColor(86, 65, 70);
      doc.text(`Smoking Sync: ${smokingConcordance}`, margin + 50, y + 7);
      doc.text(`Metro Overlap: ${geographicOverlapPercent}`, margin + 98, y + 7);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, margin + 142, y + 7);

      y += 16;

      // Loop through matches
      matches.forEach(m => {
        checkPageBreak(54);

        // Couple Header Ribbon
        const isGold = m.rank === 1;
        if (isGold) {
          doc.setFillColor(184, 16, 89); // Secondary
        } else {
          doc.setFillColor(234, 237, 255); // Surface container
        }
        doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        const cleanMaleName = cleanPdfText(m.maleName);
        const cleanFemaleName = cleanPdfText(m.femaleName);
        if (isGold) {
          doc.setTextColor(255, 255, 255);
          doc.text(`#${m.rank} GOLD RIBBON TOP MATCH: ${cleanMaleName} & ${cleanFemaleName}`, margin + 4, y + 5.5);
          doc.text(`Affinity: ${m.score}%`, pageWidth - margin - 25, y + 5.5);
        } else {
          doc.setTextColor(98, 0, 45);
          doc.text(`#${m.rank} MATCH: ${cleanMaleName} & ${cleanFemaleName}`, margin + 4, y + 5.5);
          doc.text(`Affinity: ${m.score}%`, pageWidth - margin - 25, y + 5.5);
        }

        y += 11;

        // Candidate Profile Lines
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(98, 0, 45);
        doc.text(`Male Candidate:`, margin + 2, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(19, 27, 46);
        doc.text(
          `${cleanMaleName}, Age ${m.maleAge} | ${cleanPdfText(m.maleOccupation)} | ${cleanPdfText(m.maleLocation)} | ${cleanPdfText(m.maleSmoking)}`,
          margin + 26,
          y
        );
        y += 4.5;

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(184, 16, 89);
        doc.text(`Female Candidate:`, margin + 2, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(19, 27, 46);
        doc.text(
          `${cleanFemaleName}, Age ${m.femaleAge} | ${cleanPdfText(m.femaleOccupation)} | ${cleanPdfText(m.femaleLocation)} | ${cleanPdfText(m.femaleSmoking)}`,
          margin + 28,
          y
        );
        y += 5.5;

        // Why They Match
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(98, 0, 45);
        doc.text('1. Why They Match:', margin + 2, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(86, 65, 70);
        const cleanWhy = cleanPdfText(m.whyTheyMatch);
        const whyLines = doc.splitTextToSize(cleanWhy, contentWidth - 4);
        doc.text(whyLines, margin + 2, y + 3.5);
        y += 4 + whyLines.length * 3.4;

        // Potential Challenges
        checkPageBreak(20);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(184, 16, 89);
        doc.text('2. Potential Challenges:', margin + 2, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(86, 65, 70);
        const cleanChallenges = cleanPdfText(m.potentialChallenges);
        const challengeLines = doc.splitTextToSize(cleanChallenges, contentWidth - 4);
        doc.text(challengeLines, margin + 2, y + 3.5);
        y += 4 + challengeLines.length * 3.4;

        // Tailored Dates
        checkPageBreak(16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(98, 0, 45);
        doc.text('3. Tailored Date Ideas:', margin + 2, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(86, 65, 70);
        const acts = Array.isArray(m.recommendedActivities) ? m.recommendedActivities : [];
        const datesText = acts
          .map((act, i) => `${i + 1}. ${cleanPdfText(act)}`)
          .join('   *   ');
        const datesLines = doc.splitTextToSize(datesText, contentWidth - 4);
        doc.text(datesLines, margin + 2, y + 3.5);
        y += 5 + datesLines.length * 3.4;

        // Thin separator line
        doc.setDrawColor(220, 192, 197);
        doc.setLineWidth(0.2);
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;
      });

      // Save PDF file directly with fallback
      const filename = `jodoh_by_ai_top_${matches.length}_matches_report.pdf`;
      try {
        doc.save(filename);
      } catch (saveErr) {
        console.warn('doc.save failed, using data URI fallback:', saveErr);
        const pdfDataUri = doc.output('datauristring');
        const link = document.createElement('a');
        link.setAttribute('href', pdfDataUri);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      showToast(`PDF Dossier (${matches.length} pairings) successfully downloaded.`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      showToast('Opening PDF Dossier Preview & Print modal.');
      setIsDossierPreviewOpen(true);
    }
  };

  const handleExport = () => {
    handleExportPDF();
  };

  const handleExportCSV = () => {
    const headers = ['Rank', 'Male Candidate', 'Male Age', 'Female Candidate', 'Female Age', 'Affinity %', 'Why They Match', 'Potential Challenges', 'Tailored Dates'];
    const rows = matches.map(m => [
      m.rank,
      `"${m.maleName}"`,
      m.maleAge,
      `"${m.femaleName}"`,
      m.femaleAge,
      `${m.score}%`,
      `"${m.whyTheyMatch.replace(/"/g, '""')}"`,
      `"${m.potentialChallenges.replace(/"/g, '""')}"`,
      `"${m.recommendedActivities.join('; ').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `jodoh_by_ai_top_${matches.length}_matches.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Summary report exported as CSV (${matches.length} matches).`);
  };

  const match1 = matches[0];
  const secondaryMatches = matches.slice(1);

  if (!match1) {
    return (
      <div className="bg-surface-container-lowest rounded-xl p-space-xl text-center flex flex-col items-center justify-center my-space-lg border border-outline-variant/20">
        <span className="material-symbols-outlined text-4xl text-outline mb-space-sm">psychology</span>
        <h3 className="font-headline-md text-headline-md text-on-surface font-serif">Tiada Padanan Dijana Lagi</h3>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto mt-space-xs mb-space-lg">
          {isAdmin
            ? 'Sila pastikan terdapat sekurang-kurangnya 1 calon lelaki dan 1 perempuan, kemudian jalankan pemadanan AI.'
            : 'Penganjur acara belum menjalankan pemadanan AI untuk kohort ini. Sila semak semula sebentar lagi.'}
        </p>
        <button
          type="button"
          onClick={onBackToParticipants}
          className="px-space-lg py-space-sm rounded-lg bg-primary-container text-on-primary font-label-lg font-bold cursor-pointer"
        >
          {isAdmin ? 'Kembali ke Participants Pool' : 'Kembali ke Direktori Peserta'}
        </button>
      </div>
    );
  }

  // If participant and matching is not yet published
  if (!isAdmin && !matchesPublished) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center my-6 border border-outline-variant/20 max-w-2xl mx-auto shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl">hourglass_top</span>
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 text-xs font-bold border border-amber-500/20 mb-3">
          Status: Menunggu Penganjur Menjalankan Pemadanan
        </span>
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-on-surface">
          Keputusan Belum Diterbitkan
        </h3>
        <p className="text-xs sm:text-sm text-on-surface-variant max-w-lg mt-2 mb-6 leading-relaxed">
          Pemadanan berkuasa AI hanya boleh dijalankan oleh <strong>Administrator (Penganjur Acara)</strong>. Sila semak semula sebentar lagi atau kembali ke direktori peserta untuk melihat maklumat peserta lain.
        </p>
        <button
          type="button"
          onClick={onBackToParticipants}
          className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-95 transition-all shadow-sm cursor-pointer"
        >
          Kembali ke Direktori Peserta
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* PERSONAL MATCH CONGRATULATORY BANNER (For participant) */}
      {myMatch && (
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-lg border border-primary-fixed/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shrink-0 shadow-inner">
              💍
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white/90 mb-0.5">
                <span className="material-symbols-outlined text-sm">favorite</span>
                <span>Tahniah! Padanan Anda Telah Ditemui</span>
              </div>
              <h2 className="text-xl font-bold font-serif text-white">
                Anda Dipadankan Bersama {myMatch.maleName.includes(currentUserName || '') ? myMatch.femaleName : myMatch.maleName}
              </h2>
              <p className="text-xs text-white/80 mt-0.5">
                Padanan #{myMatch.rank} • Skor Keserasian: <strong>{myMatch.score}%</strong> • {myMatch.whyTheyMatch.slice(0, 110)}...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {onOpenConcierge && (
              <button
                type="button"
                onClick={() => onOpenConcierge(myMatch.rank)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all shrink-0 cursor-pointer backdrop-blur-xs border border-white/30 active:scale-95 shadow-sm"
              >
                <span className="material-symbols-outlined text-base">psychology</span>
                <span>Tanya AI Dating Advisor</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setExpandedCards(prev => ({ ...prev, [myMatch.rank]: true }));
                const el = document.getElementById(`match-card-${myMatch.rank}`);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2.5 rounded-xl bg-white text-primary text-xs font-bold shadow-md hover:bg-surface-container-lowest transition-all shrink-0 cursor-pointer active:scale-95"
            >
              Lihat Butiran Padanan
            </button>
          </div>
        </div>
      )}

      {/* Breadcrumbs & Header Section */}
      <section className="flex flex-col gap-space-sm sm:gap-space-md pb-space-md sm:pb-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-space-md">
          <nav className="flex items-center gap-space-xs text-on-surface-variant text-xs sm:text-label-md flex-wrap">
            <button
              type="button"
              onClick={onBackToParticipants}
              className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer font-semibold"
            >
              <span className="material-symbols-outlined text-sm sm:text-base">groups</span>
              <span>{isAdmin ? 'Participants Pool' : 'Direktori Peserta'}</span>
            </button>
            <span className="material-symbols-outlined text-xs text-outline">chevron_right</span>
            <span className="text-on-surface font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm sm:text-base text-primary">batch_prediction</span>
              <span>Batch Run #01 ({participantsCount} Calon)</span>
            </span>
          </nav>

          {/* Badge for Batch Status */}
          <div className="inline-flex self-start sm:self-auto items-center gap-1 sm:gap-space-xs px-2.5 py-1 rounded-full bg-surface-container-high text-primary text-[10px] sm:text-label-sm font-semibold max-w-full">
            <span
              className="material-symbols-outlined text-xs sm:text-sm text-secondary animate-pulse shrink-0"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            <span className="truncate">
              {matches.length} Pasangan 1-to-1 Eksklusif • Sifar Pertindihan
            </span>
          </div>
        </div>

        {/* Editorial Title & Action Matrix */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-sm sm:gap-space-lg">
          <div className="max-w-3xl flex flex-col gap-1">
            <div className="flex items-center gap-space-xs text-primary text-[10px] sm:text-label-sm uppercase tracking-wider font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
              <span>Sintesis Afiniti AI • Model 1-ke-1 Eksklusif</span>
            </div>
            <h1 className="text-xl sm:text-headline-lg text-on-surface font-semibold tracking-tight font-serif">
              Top {matches.length} Padanan Keserasian AI
            </h1>
            <p className="text-xs sm:text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
              Penilaian bersilang merangkumi umur, kerjaya, tabiat hidup, minat riadah dan kriteria pasangan idaman dengan padanan eksklusif.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-space-sm no-print">
            <button
              type="button"
              onClick={onBackToParticipants}
              className="flex items-center gap-1 sm:gap-space-xs px-3 py-2 sm:px-space-md sm:py-space-sm rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors text-xs sm:text-label-lg shadow-sm cursor-pointer border border-outline-variant/20 font-semibold"
            >
              <span className="material-symbols-outlined text-base sm:text-lg">arrow_back</span>
              <span>{isAdmin ? 'Back to Pool' : 'Ke Direktori'}</span>
            </button>

            <div className="relative group">
              <button
                type="button"
                onClick={handleExportPDF}
                className="flex items-center gap-1 sm:gap-space-xs px-3 py-2 sm:px-space-md sm:py-space-sm rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors text-xs sm:text-label-lg cursor-pointer font-semibold border border-outline-variant/20"
                title="Muat turun Laporan PDF Dossier atau CSV"
              >
                <span className="material-symbols-outlined text-base sm:text-lg">download</span>
                <span>Export PDF</span>
                <span className="material-symbols-outlined text-sm text-outline -mr-0.5">arrow_drop_down</span>
              </button>
              <div className="absolute right-0 top-full mt-1 bg-surface-container-lowest rounded-lg shadow-lg border border-outline-variant/20 p-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-20 flex flex-col min-w-[200px]">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="px-3 py-2 text-left text-xs font-semibold text-on-surface hover:bg-surface-container rounded-md flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-primary">download</span>
                  <span>Muat Turun PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDossierPreviewOpen(true)}
                  className="px-3 py-2 text-left text-xs font-semibold text-on-surface hover:bg-surface-container rounded-md flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-tertiary">visibility</span>
                  <span>Pratonton Dossier</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-2 text-left text-xs font-semibold text-on-surface hover:bg-surface-container rounded-md flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-secondary">table_view</span>
                  <span>Muat Turun Jadual CSV</span>
                </button>
              </div>
            </div>

            {/* AI Concierge Chat Trigger Button */}
            {onOpenConcierge && (
              <button
                type="button"
                onClick={() => onOpenConcierge()}
                className="flex items-center gap-1.5 px-3 py-2 sm:px-space-md sm:py-space-sm rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-all text-xs sm:text-label-lg font-bold shadow-xs cursor-pointer"
                title={isAdmin ? 'AI Matchmaking Concierge (Full Cohort Access)' : 'AI Dating Advisor'}
              >
                <span className="material-symbols-outlined text-base sm:text-lg">psychology</span>
                <span>{isAdmin ? 'AI Concierge' : 'Tanya AI'}</span>
              </button>
            )}

            {isAdmin ? (
              <>
                {/* 1. Save directly into App Archive (Draf Dalam Aplikasi) */}
                {onSaveMatchesToApp && (
                  <button
                    type="button"
                    onClick={onSaveMatchesToApp}
                    className="flex items-center gap-1.5 px-3 py-2 sm:px-space-md sm:py-space-sm rounded-lg bg-surface-container-lowest text-primary hover:bg-primary/5 transition-all text-xs sm:text-label-lg font-bold border border-primary/30 shadow-xs cursor-pointer"
                    title="Simpan keputusan ini terus ke dalam arkib aplikasi (sebagai Draf Admin)"
                  >
                    <span className="material-symbols-outlined text-base sm:text-lg">bookmark_add</span>
                    <span>Simpan ke Arkib</span>
                  </button>
                )}

                {/* 2. Open Saved Sessions Archive */}
                {onOpenSavedSessions && (
                  <button
                    type="button"
                    onClick={onOpenSavedSessions}
                    className="flex items-center gap-1.5 px-3 py-2 sm:px-space-md sm:py-space-sm rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container transition-all text-xs sm:text-label-lg font-bold border border-outline-variant/30 cursor-pointer"
                    title="Buka arkib keputusan dan draf yang tersimpan"
                  >
                    <span className="material-symbols-outlined text-base sm:text-lg">folder_managed</span>
                    <span>Arkib ({savedSessionsCount})</span>
                  </button>
                )}

                {/* 3. Publish / Draft Toggle */}
                {onTogglePublish && (
                  <button
                    type="button"
                    onClick={onTogglePublish}
                    className={`flex items-center gap-1.5 px-3 py-2 sm:px-space-md sm:py-space-sm rounded-lg text-xs sm:text-label-lg font-bold transition-all cursor-pointer border ${
                      matchesPublished
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    }`}
                    title={matchesPublished ? 'Keputusan diterbitkan (Peserta boleh melihat)' : 'Keputusan dalam mod Draf (Hanya Admin)'}
                  >
                    <span className="material-symbols-outlined text-base">
                      {matchesPublished ? 'visibility' : 'visibility_off'}
                    </span>
                    <span>{matchesPublished ? 'Diterbitkan (Published)' : 'Draf (Hanya Admin)'}</span>
                  </button>
                )}

                {/* 4. Regenerate AI */}
                <button
                  type="button"
                  disabled={isRegenerating}
                  onClick={onRegenerate}
                  className="flex items-center gap-1 sm:gap-space-xs px-3.5 py-2 sm:px-space-lg sm:py-space-sm rounded-lg bg-primary-container text-on-primary hover:opacity-95 active:scale-95 transition-all text-xs sm:text-label-lg shadow-md shadow-primary-container/20 cursor-pointer font-bold disabled:opacity-60"
                >
                  <span
                    className={`material-symbols-outlined text-base sm:text-lg ${
                      isRegenerating ? 'animate-spin' : ''
                    }`}
                  >
                    cached
                  </span>
                  <span>{isRegenerating ? 'Menjana AI...' : 'Jana Semula'}</span>
                </button>

                {/* 5. ADMIN EXCLUSIVE RESET BUTTON */}
                {onOpenResetModal && (
                  <button
                    type="button"
                    onClick={onOpenResetModal}
                    className="flex items-center gap-1 px-2.5 py-2 sm:px-3 sm:py-space-sm rounded-lg bg-error/10 hover:bg-error/20 text-error border border-error/25 transition-all text-xs sm:text-label-lg font-bold cursor-pointer"
                    title="Pusat Set Semula Data (Eksklusif Administrator)"
                  >
                    <span className="material-symbols-outlined text-base sm:text-lg">restart_alt</span>
                    <span>Reset</span>
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                {onOpenConcierge && (
                  <button
                    type="button"
                    onClick={() => onOpenConcierge()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold border border-primary/25 cursor-pointer shadow-xs"
                    title="Tanya AI Dating Advisor"
                  >
                    <span className="material-symbols-outlined text-base">psychology</span>
                    <span>Tanya AI Dating Advisor</span>
                  </button>
                )}
                {onOpenSavedSessions && (
                  <button
                    type="button"
                    onClick={onOpenSavedSessions}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold border border-outline-variant/30 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base text-primary">history</span>
                    <span>Sejarah Rekod ({savedSessionsCount})</span>
                  </button>
                )}
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container text-on-surface-variant text-xs font-semibold border border-outline-variant/30 select-none">
                  <span className="material-symbols-outlined text-base text-primary">verified</span>
                  <span>Diterbitkan oleh Penganjur</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Status Notice for Admin */}
        {isAdmin && (
          <div
            className={`mt-2 p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
              matchesPublished
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-900'
                : 'bg-amber-500/10 border-amber-500/25 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0">
                {matchesPublished ? 'check_circle' : 'lock'}
              </span>
              <span>
                <strong>Status Akses: </strong>
                {matchesPublished
                  ? 'Keputusan rasmi telah Diterbitkan. Peserta kini boleh melihat padanan dan sejarah rekod mereka.'
                  : 'Keputusan ini disimpan sebagai Draf Dalaman. Peserta TIDAK BOLEH melihat keputusan ini sehingga anda klik butang "Terbitkan".'}
              </span>
            </div>

            {activeSessionTitle && (
              <span className="hidden sm:inline text-[11px] font-semibold opacity-85 shrink-0">
                Rekod: {activeSessionTitle}
              </span>
            )}
          </div>
        )}
      </section>

      {/* Metric Quick Ribbon */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-space-md mb-space-md sm:mb-space-xl">
        {/* Box 1: Median Affinity */}
        <div className="p-2.5 sm:p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between border border-outline-variant/15 min-h-[76px] sm:min-h-[100px] h-auto">
          <span className="text-[10px] sm:text-xs text-outline uppercase tracking-wider font-bold truncate leading-tight">
            Median Affinity
          </span>
          <div className="flex items-baseline justify-between sm:justify-start gap-1 sm:gap-2 mt-1 sm:mt-auto">
            <span className="text-lg sm:text-2xl lg:text-3xl font-bold text-primary font-serif leading-none">
              {medianAffinity}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-secondary-fixed/60 text-secondary font-bold text-[9px] sm:text-xs shrink-0 self-center">
              +4.2% vs avg
            </span>
          </div>
        </div>

        {/* Box 2: Top Category Alignment */}
        <div className="p-2.5 sm:p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between border border-outline-variant/15 min-h-[76px] sm:min-h-[100px] h-auto">
          <span className="text-[10px] sm:text-xs text-outline uppercase tracking-wider font-bold truncate leading-tight">
            Top Category Alignment
          </span>
          <div className="flex flex-col gap-0.5 mt-1 sm:mt-auto">
            <div className="flex items-center gap-1 text-on-surface">
              <span className="material-symbols-outlined text-primary text-sm sm:text-base shrink-0">psychology</span>
              <span className="text-xs sm:text-sm lg:text-base font-bold text-on-surface font-serif truncate leading-tight">
                Value Vector 04
              </span>
            </div>
            <span className="text-[9px] sm:text-xs text-on-surface-variant truncate leading-tight">
              Ethical & Family Aspirations
            </span>
          </div>
        </div>

        {/* Box 3: Geographic Overlap */}
        <div className="p-2.5 sm:p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between border border-outline-variant/15 min-h-[76px] sm:min-h-[100px] h-auto">
          <span className="text-[10px] sm:text-xs text-outline uppercase tracking-wider font-bold truncate leading-tight">
            Geographic Overlap
          </span>
          <div className="flex items-baseline justify-between sm:justify-start gap-1 sm:gap-2 mt-1 sm:mt-auto">
            <span className="text-lg sm:text-2xl lg:text-3xl font-bold text-on-surface font-serif leading-none">
              {geographicOverlapPercent}
            </span>
            <span className="text-[9px] sm:text-xs font-medium text-on-surface-variant shrink-0">
              Same Metro Zone
            </span>
          </div>
        </div>

        {/* Box 4: Smoking Status Sync */}
        <div className="p-2.5 sm:p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between border border-outline-variant/15 min-h-[76px] sm:min-h-[100px] h-auto">
          <span className="text-[10px] sm:text-xs text-outline uppercase tracking-wider font-bold truncate leading-tight">
            Smoking Status Sync
          </span>
          <div className="flex items-baseline justify-between sm:justify-start gap-1 sm:gap-2 mt-1 sm:mt-auto">
            <span className="text-lg sm:text-2xl lg:text-3xl font-bold text-primary-container font-serif leading-none">
              {smokingConcordance}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-secondary-fixed/60 text-secondary font-bold text-[9px] sm:text-xs shrink-0 self-center">
              100% Concordance
            </span>
          </div>
        </div>
      </section>

      {/* MATCH #1: Golden Ribbon Master Card */}
      <section className="mb-space-xl">
        <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest shadow-md transition-all duration-300 hover:shadow-xl border border-outline-variant/20">
          {/* High Affinity Ambient Header Bar */}
          <div className="px-3 sm:px-space-lg py-2 sm:py-space-sm bg-gradient-to-r from-secondary-fixed via-surface-container-high to-surface-container flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-space-sm">
              <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary text-on-secondary text-xs sm:text-label-md font-bold shadow-sm">
                #1
              </span>
              <div className="flex items-center gap-1 sm:gap-space-xs px-2 sm:px-space-sm py-0.5 rounded-full bg-surface-container-lowest text-primary text-[10px] sm:text-label-sm font-bold tracking-wide uppercase shadow-xs">
                <span
                  className="material-symbols-outlined text-xs sm:text-sm text-secondary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  workspace_premium
                </span>
                <span>Gold Ribbon • Top Algorithmic Match</span>
              </div>
            </div>

            <div className="flex items-center gap-space-md">
              <div className="flex items-center gap-1 sm:gap-space-xs px-2.5 sm:px-space-md py-0.5 sm:py-1 rounded-full bg-surface-container-lowest shadow-sm">
                <span className="text-[10px] sm:text-label-sm text-outline uppercase font-bold">
                  Match Affinity
                </span>
                <span className="text-base sm:text-headline-sm text-primary font-bold">
                  {match1.score}%
                </span>
              </div>
            </div>
          </div>

          {/* Candidate Side-by-Side Arena */}
          <div className="p-3 sm:p-space-lg">
            <div className="grid grid-cols-1 lg:grid-cols-11 items-center gap-3 sm:gap-space-lg">
              {/* Male Candidate (Left) */}
              <div className="lg:col-span-5 flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-space-md p-3 sm:p-space-md rounded-xl bg-surface-container-low transition-transform hover:-translate-y-0.5 border border-outline-variant/15">
                <img
                  className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-xl object-cover shadow-sm flex-shrink-0 ring-1 ring-outline-variant/30"
                  alt={`Portrait of ${match1.maleName}`}
                  src={
                    match1.malePhoto ||
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuD8zczZF_wak5QDSkGoR1xuQ60CERQj0dh7XpQtqg3p2gkgi0yds-_wQZgjC0TJcM3r0-kwMVjs_5vZ6IZvhAldRU3FmEIrAEo62yNCRqEP7zYkOTfRq1dc9antaVhVpww6gphKLo2c51jfWRsv9-qcv7F6SiooWX1i5ZTSd0FP5tstDZNE265YMzY8dQQFHNP_73WdiFlch6EiWbB77QIaI7xgMMGo287qbehAOxRQOI1gwAExVxY0'
                  }
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuD8zczZF_wak5QDSkGoR1xuQ60CERQj0dh7XpQtqg3p2gkgi0yds-_wQZgjC0TJcM3r0-kwMVjs_5vZ6IZvhAldRU3FmEIrAEo62yNCRqEP7zYkOTfRq1dc9antaVhVpww6gphKLo2c51jfWRsv9-qcv7F6SiooWX1i5ZTSd0FP5tstDZNE265YMzY8dQQFHNP_73WdiFlch6EiWbB77QIaI7xgMMGo287qbehAOxRQOI1gwAExVxY0';
                  }}
                />
                <div className="flex flex-col text-center sm:text-left gap-1 w-full min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1 sm:gap-space-xs">
                    <span className="text-base sm:text-headline-sm text-on-surface font-semibold font-serif">
                      {match1.maleName}
                    </span>
                    <span className="text-xs sm:text-label-md text-outline">
                      {match1.maleAge} yrs
                    </span>
                  </div>
                  <span className="text-xs sm:text-label-md text-primary font-semibold">
                    {match1.maleOccupation}
                  </span>
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-on-surface-variant text-[11px] sm:text-body-sm mt-0.5">
                    <span className="material-symbols-outlined text-xs sm:text-sm text-outline">
                      location_on
                    </span>
                    <span>{match1.maleLocation}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1 mt-1.5 sm:mt-space-sm">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] sm:text-label-sm font-semibold">
                      {match1.maleSmoking}
                    </span>
                    {match1.maleHobbies.slice(0, 2).map((h, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] sm:text-label-sm font-semibold"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Central Affinity Badge */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center py-1 sm:py-2 lg:py-0">
                <div className="relative flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-primary-container text-on-primary shadow-md sm:shadow-lg shadow-primary-container/30">
                  <span
                    className="material-symbols-outlined text-lg sm:text-2xl animate-pulse"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    all_inclusive
                  </span>
                  <div className="absolute -inset-1 rounded-full bg-primary-container/20 animate-ping pointer-events-none"></div>
                </div>
                <span className="text-[10px] sm:text-label-sm text-primary font-bold mt-1 sm:mt-2 uppercase tracking-tight">
                  {match1.score}% Synced
                </span>
              </div>

              {/* Female Candidate (Right) */}
              <div className="lg:col-span-5 flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-space-md p-3 sm:p-space-md rounded-xl bg-surface-container-low transition-transform hover:-translate-y-0.5 border border-outline-variant/15">
                <img
                  className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-xl object-cover shadow-sm flex-shrink-0 ring-1 ring-outline-variant/30"
                  alt={`Portrait of ${match1.femaleName}`}
                  src={
                    match1.femalePhoto ||
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuCp1BmPGSgNACd1BwdSsDGuK8rQxAaOz5t25wpW1BqBkW9TnZ_QtoohTDlTVCpouDuwjmu5xGPINw3NTlE3DBtuftEKtoauCSnDhEnO2tmhjf_NXC6Ni2qsDluZSrPv-CN7dylHdf2jfdWKTFwzUPJjnxi3Xh9mFhJpLB0oanJe2B-d4H_a1FIuo5yopzHZ2i5XuEmx6Vm3EeYGhJN0lgJG17vO7Ftv_NzR3r502Zv3331PKcLuGPlE'
                  }
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuCp1BmPGSgNACd1BwdSsDGuK8rQxAaOz5t25wpW1BqBkW9TnZ_QtoohTDlTVCpouDuwjmu5xGPINw3NTlE3DBtuftEKtoauCSnDhEnO2tmhjf_NXC6Ni2qsDluZSrPv-CN7dylHdf2jfdWKTFwzUPJjnxi3Xh9mFhJpLB0oanJe2B-d4H_a1FIuo5yopzHZ2i5XuEmx6Vm3EeYGhJN0lgJG17vO7Ftv_NzR3r502Zv3331PKcLuGPlE';
                  }}
                />
                <div className="flex flex-col text-center sm:text-left gap-1 w-full min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1 sm:gap-space-xs">
                    <span className="text-base sm:text-headline-sm text-on-surface font-semibold font-serif">
                      {match1.femaleName}
                    </span>
                    <span className="text-xs sm:text-label-md text-outline">
                      {match1.femaleAge} yrs
                    </span>
                  </div>
                  <span className="text-xs sm:text-label-md text-primary font-semibold">
                    {match1.femaleOccupation}
                  </span>
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-on-surface-variant text-[11px] sm:text-body-sm mt-0.5">
                    <span className="material-symbols-outlined text-xs sm:text-sm text-outline">
                      location_on
                    </span>
                    <span>{match1.femaleLocation}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1 mt-1.5 sm:mt-space-sm">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] sm:text-label-sm font-semibold">
                      {match1.femaleSmoking}
                    </span>
                    {match1.femaleHobbies.slice(0, 2).map((h, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] sm:text-label-sm font-semibold"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Shared Trait Quick Badges */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-space-xs mt-3 sm:mt-space-lg pt-3 sm:pt-space-md border-t border-outline-variant/30">
              <span className="text-[10px] sm:text-label-sm text-outline uppercase tracking-wider mr-1 sm:mr-2 font-bold">
                Cross-Checked Traits:
              </span>
              {(match1.crossCheckedTraits || [
                'Non-Smoker Match',
                'Shared Hobby: Culinary Arts',
                'Aligned Location (12km Radius)',
                'Equal Priority: Work-Life Boundaries'
              ]).map((trait, tIdx) => (
                <span
                  key={tIdx}
                  className={`flex items-center gap-1 px-2 py-0.5 sm:px-space-sm sm:py-1 rounded-full text-[10px] sm:text-label-sm font-semibold ${
                    tIdx === 0
                      ? 'bg-secondary-fixed text-on-secondary-fixed'
                      : tIdx % 2 === 1
                      ? 'bg-surface-container-high text-primary'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-xs sm:text-sm">
                    {tIdx === 0
                      ? 'smoke_free'
                      : tIdx === 1
                      ? 'outdoor_grill'
                      : tIdx === 2
                      ? 'share_location'
                      : 'schedule'}
                  </span>
                  <span>{trait}</span>
                </span>
              ))}
            </div>

            {/* 3-Pillar Qualitative Evaluation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-space-md mt-3 sm:mt-space-lg">
              {/* Pillar 1: Why They Match */}
              <div className="p-3 sm:p-space-md rounded-xl bg-surface-container-low flex flex-col gap-1 sm:gap-space-xs border border-outline-variant/15">
                <div className="flex items-center gap-1.5 text-primary">
                  <span className="material-symbols-outlined text-base sm:text-lg">auto_awesome</span>
                  <h3 className="text-xs sm:text-label-lg font-bold uppercase tracking-wider">
                    1. Why They Match
                  </h3>
                </div>
                <p className="text-xs sm:text-body-sm text-on-surface-variant leading-relaxed">
                  {match1.whyTheyMatch}
                </p>
                <div className="mt-auto pt-2">
                  <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-700"
                      style={{ width: `${match1.valueSynthesisPercent || 98}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] sm:text-label-sm text-outline mt-1 block font-semibold">
                    Value Synthesis: {match1.valueSynthesisPercent || 98}% Strong
                  </span>
                </div>
              </div>

              {/* Pillar 2: Potential Challenges */}
              <div className="p-3 sm:p-space-md rounded-xl bg-surface-container-low flex flex-col gap-1 sm:gap-space-xs border border-outline-variant/15">
                <div className="flex items-center gap-1.5 text-on-surface">
                  <span className="material-symbols-outlined text-base sm:text-lg text-secondary">balance</span>
                  <h3 className="text-xs sm:text-label-lg font-bold uppercase tracking-wider">
                    2. Potential Challenges
                  </h3>
                </div>
                <p className="text-xs sm:text-body-sm text-on-surface-variant leading-relaxed">
                  {match1.potentialChallenges}
                </p>
                <div className="mt-auto pt-2">
                  <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-secondary-container h-full rounded-full transition-all duration-700"
                      style={{ width: `${match1.frictionProbabilityPercent || 22}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] sm:text-label-sm text-outline mt-1 block font-semibold">
                    Friction Probability: Low ({match1.frictionProbabilityPercent || 22}%)
                  </span>
                </div>
              </div>

              {/* Pillar 3: Tailored Date Recommendations */}
              <div className="p-3 sm:p-space-md rounded-xl bg-surface-container-low flex flex-col gap-1 sm:gap-space-xs border border-outline-variant/15">
                <div className="flex items-center gap-1.5 text-primary">
                  <span className="material-symbols-outlined text-base sm:text-lg">hotel_class</span>
                  <h3 className="text-xs sm:text-label-lg font-bold uppercase tracking-wider">
                    3. Tailored Date Ideas
                  </h3>
                </div>
                <ul className="flex flex-col gap-1 text-xs sm:text-body-sm text-on-surface-variant">
                  {match1.recommendedActivities.map((act, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-surface-container-high text-primary text-[10px] sm:text-label-sm font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom Action Bar for Match #1 */}
              {onOpenConcierge && (isAdmin || (myMatch && myMatch.rank === 1)) && (
                <div className="col-span-1 md:col-span-3 mt-3 pt-3 border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                    <span className="material-symbols-outlined text-base text-primary">psychology</span>
                    <span>
                      {isAdmin
                        ? 'AI Concierge: Analisis mendalam kekuatan nilai & cadangan aktiviti Pasangan #1'
                        : 'AI Dating Advisor: Bincang idea temu janji & pengukuhan hubungan'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenConcierge(1)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90 transition-all cursor-pointer self-start sm:self-auto active:scale-95"
                  >
                    <span className="material-symbols-outlined text-sm">chat</span>
                    <span>{isAdmin ? 'Analisis Pasangan #1 dengan AI' : 'Tanya AI Mengenai Pasangan Ini'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MATCHES #2 THROUGH #10: Interactive Accordion Hierarchy */}
      {secondaryMatches.length > 0 && (
        <section className="flex flex-col gap-space-md mb-space-xl">
          <div className="flex items-center justify-between no-print">
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold font-serif">
                Secondary Algorithmic Pairings
              </span>
              <span className="px-space-xs py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-bold">
                Ranks #2 - #{matches.length}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleAll}
              className="font-label-md text-label-md text-primary hover:underline cursor-pointer font-semibold"
            >
              {allExpanded ? 'Collapse All Pairings' : 'Expand All Pairings'}
            </button>
          </div>

          {secondaryMatches.map(match => {
            const isExpanded = !!expandedCards[match.rank];

            return (
              <div
                key={match.rank}
                className="rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-200 border border-outline-variant/15 overflow-hidden"
              >
                {/* Trigger Row */}
                <div
                  onClick={() => toggleCard(match.rank)}
                  className="p-3 sm:p-space-md cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-space-md hover:bg-surface-container-low/40 rounded-xl transition-colors select-none"
                >
                  <div className="flex items-center gap-2.5 sm:gap-space-md min-w-0">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-container-high text-primary text-xs sm:text-label-md font-bold flex items-center justify-center flex-shrink-0">
                      #{match.rank}
                    </span>

                    <div className="flex items-center gap-2 sm:gap-space-sm min-w-0">
                      <div className="flex -space-x-2.5 sm:-space-x-3 overflow-hidden flex-shrink-0">
                        <img
                          className="inline-block h-10 w-10 sm:h-12 sm:w-12 rounded-full ring-2 ring-surface-container-lowest object-cover"
                          alt={match.maleName}
                          src={
                            match.malePhoto ||
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuAwOqlCtrC7wUSP62ZrSTKwVCa18SwrN7yEN_VPoHM2eSuDPcJfp2ajgyFTZGe8jYhs-pjTpYDHoVr9EmRpV5SWHTzwr86XN9LWOjKGAaW8Y645slcvdlLU6XHML39LTJ2GE6h_tHpGUdI9uAWjj2Nmd8jBqgASdPQb5tSDd6nrQ-1epJ-tTyAbMOq82GyTIGsKQ2wIt9wARh3wzv9slVcX1Bs1EeV4X_FSDBgFacd4Awfg2SNqGg84'
                          }
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80';
                          }}
                        />
                        <img
                          className="inline-block h-10 w-10 sm:h-12 sm:w-12 rounded-full ring-2 ring-surface-container-lowest object-cover"
                          alt={match.femaleName}
                          src={
                            match.femalePhoto ||
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuBnSwa8m2QElUYk3cXu4-FBt_8BOb2uaCzu0RaP20Z8W8f9OyyFFt-M8Ddcrjlbz9ZWLIBS9S1-S8l5kwB63LxCDVKYKXvnIQMm04_EtdQNvScW8NXkWUG7eU4kHrqW6BXdCj5qZraQVlIWGf1UMJkgP2t2g-S3BKHRRvuEECoRtGipu0KtT_DV859ZTflCMruAR-kJpFFIHeLYNQH88pCAuN6DEi-i9oUCgua6mK2ONxwVzqS7PV3i'
                          }
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
                          }}
                        />
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                          <span className="text-sm sm:text-headline-sm text-on-surface font-semibold font-serif truncate">
                            {match.maleName}
                          </span>
                          <span className="text-xs text-outline">&amp;</span>
                          <span className="text-sm sm:text-headline-sm text-on-surface font-semibold font-serif truncate">
                            {match.femaleName}
                          </span>
                        </div>
                        <span className="text-[11px] sm:text-body-sm text-on-surface-variant truncate">
                          {match.maleOccupation} ({match.maleAge}) • {match.femaleOccupation} ({match.femaleAge})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-space-md justify-between md:justify-end pt-1 md:pt-0 border-t border-outline-variant/10 md:border-0">
                    <div className="flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] sm:text-label-sm font-semibold">
                        {match.maleSmoking}
                      </span>
                      {match.crossCheckedTraits && match.crossCheckedTraits[1] && (
                        <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] sm:text-label-sm">
                          {match.crossCheckedTraits[1]}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-space-sm shrink-0">
                      <div className="text-right">
                        <span className="text-base sm:text-headline-sm text-primary font-bold">
                          {match.score}%
                        </span>
                        <span className="text-[9px] sm:text-label-sm text-outline block font-medium">
                          Affinity
                        </span>
                      </div>
                      <span
                        className={`material-symbols-outlined text-outline transform transition-transform duration-200 text-lg sm:text-2xl ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      >
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expandable Drawer Details */}
                {isExpanded && (
                  <div className="px-3 pb-3 sm:px-space-lg sm:pb-space-lg pt-1 card-details">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-space-md pt-2.5 sm:pt-space-md border-t border-outline-variant/30">
                      <div className="p-3 sm:p-space-md rounded-xl bg-surface-container-low flex flex-col gap-1 border border-outline-variant/15">
                        <span className="text-xs sm:text-label-sm text-primary font-bold uppercase tracking-wider">
                          Why They Match
                        </span>
                        <p className="text-xs sm:text-body-sm text-on-surface-variant mt-0.5 leading-relaxed">
                          {match.whyTheyMatch}
                        </p>
                      </div>

                      <div className="p-3 sm:p-space-md rounded-xl bg-surface-container-low flex flex-col gap-1 border border-outline-variant/15">
                        <span className="text-xs sm:text-label-sm text-secondary font-bold uppercase tracking-wider">
                          Potential Challenges
                        </span>
                        <p className="text-xs sm:text-body-sm text-on-surface-variant mt-0.5 leading-relaxed">
                          {match.potentialChallenges}
                        </p>
                      </div>

                      <div className="p-3 sm:p-space-md rounded-xl bg-surface-container-low flex flex-col gap-1 border border-outline-variant/15">
                        <span className="text-xs sm:text-label-sm text-primary font-bold uppercase tracking-wider">
                          Tailored Date Recommendations
                        </span>
                        <ul className="text-xs sm:text-body-sm text-on-surface-variant mt-0.5 flex flex-col gap-1">
                          {match.recommendedActivities.map((act, aIdx) => (
                            <li key={aIdx}>
                              {aIdx + 1}. {act}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Secondary Match Card Concierge Action */}
                      {onOpenConcierge && (isAdmin || (myMatch && myMatch.rank === match.rank)) && (
                        <div className="mt-3 pt-3 border-t border-outline-variant/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                            <span className="material-symbols-outlined text-base text-primary">psychology</span>
                            <span>{isAdmin ? `AI Analysis untuk Pasangan #${match.rank}` : 'Personal AI Dating Advisor'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onOpenConcierge(match.rank)}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all cursor-pointer self-start sm:self-auto active:scale-95"
                          >
                            <span className="material-symbols-outlined text-sm">chat</span>
                            <span>{isAdmin ? `Bincang Pasangan #${match.rank} dengan AI` : 'Tanya AI Mengenai Pasangan Ini'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* PRD Fallback / Insufficient Candidates Notice Module */}
      <section className="mt-space-md sm:mt-space-lg mb-space-lg sm:mb-space-xl no-print">
        <div className="p-3.5 sm:p-space-lg rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-space-md border border-outline-variant/15">
          <div className="flex items-start gap-2.5 sm:gap-space-md">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-surface-container-high text-primary flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
              <span className="material-symbols-outlined text-xl sm:text-2xl">info</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-space-xs">
                <span className="text-sm sm:text-headline-sm text-on-surface font-semibold font-serif">
                  System Requirement Note
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-[10px] sm:text-label-sm font-bold shrink-0">
                  PRD Section F04
                </span>
              </div>
              <p className="text-xs sm:text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                Requires at least 1 male and 1 female participant to generate matches. When fewer candidates exist, the algorithmic generator halts automatically to safeguard evaluation integrity.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSimulateInsufficient}
            className="w-full md:w-auto px-space-md py-2 sm:py-space-sm rounded-lg bg-surface-container-high text-primary hover:bg-surface-container transition-colors text-xs sm:text-label-md font-semibold flex-shrink-0 cursor-pointer text-center"
          >
            Simulate Insufficient Pool
          </button>
        </div>
      </section>

      {/* Dossier Preview Modal */}
      <DossierPreviewModal
        isOpen={isDossierPreviewOpen}
        onClose={() => setIsDossierPreviewOpen(false)}
        matches={matches}
        participantsCount={participantsCount}
        medianAffinity={medianAffinity}
        geographicOverlapPercent={geographicOverlapPercent}
        smokingConcordance={smokingConcordance}
        onDownloadPDF={handleExportPDF}
        onDownloadCSV={handleExportCSV}
      />
    </div>
  );
};
