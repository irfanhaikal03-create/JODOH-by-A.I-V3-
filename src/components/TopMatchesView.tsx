import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { MatchResult, Participant } from '../types';
import { MatchDossierModal } from './MatchDossierModal';
import { useLanguage } from '../context/LanguageContext';

// Clean Unicode and non-WinAnsi characters to prevent jsPDF encoding errors
function cleanPdfText(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019]/g, "'") // smart single quotes
    .replace(/[\u201C\u201D]/g, '"') // smart double quotes
    .replace(/[\u2013\u2014]/g, '-') // en-dash, em-dash
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-') // bullet characters
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
  onOpenWhatsAppDispatch?: (match: MatchResult) => void;
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
  onOpenWhatsAppDispatch,
}) => {
  const { t, translateSmoking } = useLanguage();
  const isAdmin = userRole === 'admin';
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const [isDossierPreviewOpen, setIsDossierPreviewOpen] = useState(false);
  const [selectedDossierMatch, setSelectedDossierMatch] = useState<MatchResult | undefined>(undefined);

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
        doc.setTextColor(180, 130, 70);
        doc.text('2. Potential Challenges:', margin + 2, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(87, 83, 78);
        const cleanChallenges = cleanPdfText(m.potentialChallenges);
        const challengeLines = doc.splitTextToSize(cleanChallenges, contentWidth - 4);
        doc.text(challengeLines, margin + 2, y + 3.5);
        y += 4 + challengeLines.length * 3.4;

        // Tailored Dates
        checkPageBreak(16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(28, 25, 23);
        doc.text('3. Tailored Date Ideas:', margin + 2, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(87, 83, 78);
        const acts = Array.isArray(m.recommendedActivities) ? m.recommendedActivities : [];
        const datesText = acts
          .map((act, i) => `${i + 1}. ${cleanPdfText(act)}`)
          .join('   •   ');
        const datesLines = doc.splitTextToSize(datesText, contentWidth - 4);
        doc.text(datesLines, margin + 2, y + 3.5);
        y += 5 + datesLines.length * 3.4;

        // Thin separator line
        doc.setDrawColor(231, 229, 228);
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
        <h3 className="font-headline-md text-headline-md text-on-surface font-serif">{t('noMatchesYet', 'Tiada Padanan Dijana Lagi')}</h3>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto mt-space-xs mb-space-lg">
          {isAdmin
            ? t('noMatchesDesc', 'Sila pastikan terdapat sekurang-kurangnya 1 calon lelaki dan 1 perempuan, kemudian jalankan pemadanan AI.')
            : t('notPublishedDesc', 'Penganjur acara belum menjalankan pemadanan AI untuk kohort ini. Sila semak semula sebentar lagi.')}
        </p>
        <button
          type="button"
          onClick={onBackToParticipants}
          className="px-space-lg py-space-sm rounded-lg bg-primary-container text-on-primary font-label-lg font-bold cursor-pointer"
        >
          {isAdmin ? t('backToPool', 'Kembali ke Direktori') : t('backToPool', 'Kembali ke Direktori Peserta')}
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
          {t('organizerWaitingTitle', 'Status: Menunggu Penganjur Menjalankan Pemadanan')}
        </span>
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-on-surface">
          {t('notPublishedTitle', 'Keputusan Belum Diterbitkan')}
        </h3>
        <p className="text-xs sm:text-sm text-on-surface-variant max-w-lg mt-2 mb-6 leading-relaxed">
          {t('notPublishedDesc', 'Penganjur acara belum menerbitkan keputusan padanan AI kepada peserta. Sila tunggu pengumuman rasmi.')}
        </p>
        <button
          type="button"
          onClick={onBackToParticipants}
          className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-95 transition-all shadow-sm cursor-pointer"
        >
          {t('backToPool', 'Kembali ke Direktori Peserta')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* PERSONAL MATCH CONGRATULATORY BANNER (For participant) */}
      {myMatch && (
        <div className="mb-6 p-6 rounded-2xl bg-stone-900 text-white shadow-xl border border-[#b48246]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-stone-800 text-[#b48246] border border-[#b48246]/40 flex items-center justify-center text-2xl shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-3xl">favorite</span>
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#b48246] mb-1">
                <span>{t('congratsMatchFound', 'Tahniah! Padanan Anda Telah Ditemui')}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight">
                {t('matchedWith', 'Anda Dipadankan Bersama')} {myMatch.maleName.includes(currentUserName || '') ? myMatch.femaleName : myMatch.maleName}
              </h2>
              <p className="text-xs text-stone-300 mt-1">
                {t('matchRank', 'Padanan ')}{myMatch.rank} <span className="text-[#b48246]">·</span> {t('compatibilityScore', 'Skor Keserasian')}: <strong className="text-white font-mono">{myMatch.score}%</strong> <span className="text-[#b48246]">·</span> {myMatch.whyTheyMatch.slice(0, 110)}...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0 relative z-10">
            {onOpenConcierge && (
              <button
                type="button"
                onClick={() => onOpenConcierge(myMatch.rank)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all shrink-0 cursor-pointer border border-white/20 active:scale-95 shadow-2xs"
              >
                <span className="material-symbols-outlined text-base text-[#b48246]">auto_awesome</span>
                <span>{t('askAiConcierge', 'Tanya AI Dating Advisor')}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setExpandedCards(prev => ({ ...prev, [myMatch.rank]: true }));
                const el = document.getElementById(`match-card-${myMatch.rank}`);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2.5 rounded-xl bg-[#b48246] text-white text-xs font-bold shadow-md hover:bg-[#a37237] transition-all shrink-0 cursor-pointer active:scale-95"
            >
              {t('viewMatchDetails', 'Lihat Butiran Padanan')}
            </button>
          </div>
        </div>
      )}

      {/* Breadcrumbs & Header Section */}
      <section className="flex flex-col gap-2 sm:gap-3 pb-4 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <nav className="flex items-center gap-2 text-stone-500 text-xs font-medium flex-wrap">
            <button
              type="button"
              onClick={onBackToParticipants}
              className="hover:text-stone-900 transition-colors flex items-center gap-1 cursor-pointer font-semibold"
            >
              <span className="material-symbols-outlined text-sm sm:text-base text-stone-400">groups</span>
              <span>{isAdmin ? t('participantsPool', 'Direktori Calon') : t('participantsPool', 'Direktori Peserta')}</span>
            </button>
            <span className="text-stone-300">/</span>
            <span className="text-stone-900 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm sm:text-base text-[#b48246]">verified</span>
              <span>Batch Run #01 ({participantsCount} {t('registeredCount', 'Calon')})</span>
            </span>
          </nav>

          {/* Badge for Batch Status */}
          <div className="inline-flex self-start sm:self-auto items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-medium border border-stone-200">
            <span className="material-symbols-outlined text-xs text-[#b48246] shrink-0">
              diamond
            </span>
            <span className="truncate">
              {matches.length} {t('exclusivePairings', 'Pasangan 1-to-1 Eksklusif • Sifar Pertindihan')}
            </span>
          </div>
        </div>

        {/* Editorial Title & Action Matrix */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 sm:gap-6 mt-1">
          <div className="max-w-3xl flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[#b48246] text-xs uppercase tracking-widest font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#b48246]"></span>
              <span>{t('aiAffinitySynthesis', 'Sintesis Afiniti AI • Model 1-ke-1 Eksklusif')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl text-stone-900 font-bold tracking-tight font-serif">
              Top {matches.length} {t('topMatchesTitle', 'Padanan Keserasian AI')}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 max-w-2xl leading-relaxed">
              {t('matchesSubtitle', 'Penilaian bersilang merangkumi umur, kerjaya, tabiat hidup, minat riadah dan kriteria pasangan idaman dengan padanan eksklusif.')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 no-print">
            <button
              type="button"
              onClick={onBackToParticipants}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition-colors text-xs font-semibold border border-stone-200 shadow-2xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>{isAdmin ? t('backToPool', 'Direktori') : t('backToPool', 'Ke Direktori')}</span>
            </button>

            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  setSelectedDossierMatch(undefined);
                  setIsDossierPreviewOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition-colors text-xs font-semibold shadow-2xs cursor-pointer"
                title="Buka Cetakan Dossier Meja Ta'aruf & Laporan Eksekutif PDF"
              >
                <span className="material-symbols-outlined text-base text-[#b48246]">print</span>
                <span>Cetak Dossier & Kad Meja</span>
                <span className="material-symbols-outlined text-sm text-stone-400 -mr-0.5">arrow_drop_down</span>
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-stone-200 p-1.5 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-20 flex flex-col min-w-[220px]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDossierMatch(undefined);
                    setIsDossierPreviewOpen(true);
                  }}
                  className="px-3 py-2 text-left text-xs font-semibold text-stone-800 hover:bg-stone-100 rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-[#b48246]">description</span>
                  <span>Dossier & Kad Meja Ta'aruf</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="px-3 py-2 text-left text-xs font-semibold text-stone-800 hover:bg-stone-100 rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-stone-600">download</span>
                  <span>Muat Turun PDF Laporan</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-2 text-left text-xs font-semibold text-stone-800 hover:bg-stone-100 rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-stone-600">table_view</span>
                  <span>Muat Turun Jadual CSV</span>
                </button>
              </div>
            </div>

            {/* AI Concierge Chat Trigger Button */}
            {onOpenConcierge && (
              <button
                type="button"
                onClick={() => onOpenConcierge()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#fbf6ee] hover:bg-[#f5eedb] text-[#7c5820] border border-[#b48246]/30 transition-all text-xs font-bold shadow-2xs cursor-pointer"
                title={isAdmin ? 'AI Matchmaking Concierge (Full Cohort Access)' : 'AI Dating Advisor'}
              >
                <span className="material-symbols-outlined text-base text-[#b48246]">auto_awesome</span>
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
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-stone-800 hover:bg-stone-50 transition-all text-xs font-semibold border border-stone-200 shadow-2xs cursor-pointer"
                    title="Simpan keputusan ini terus ke dalam arkib aplikasi (sebagai Draf Admin)"
                  >
                    <span className="material-symbols-outlined text-base text-[#b48246]">bookmark_add</span>
                    <span>Simpan ke Arkib</span>
                  </button>
                )}

                {/* 2. Open Saved Sessions Archive */}
                {onOpenSavedSessions && (
                  <button
                    type="button"
                    onClick={onOpenSavedSessions}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-50 text-stone-800 hover:bg-stone-100 transition-all text-xs font-semibold border border-stone-200 shadow-2xs cursor-pointer"
                    title="Buka arkib keputusan dan draf yang tersimpan"
                  >
                    <span className="material-symbols-outlined text-base text-stone-500">folder_managed</span>
                    <span>Arkib ({savedSessionsCount})</span>
                  </button>
                )}

                {/* 3. Publish / Draft Toggle */}
                {onTogglePublish && (
                  <button
                    type="button"
                    onClick={onTogglePublish}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      matchesPublished
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 active:scale-95 transition-all text-xs shadow-xs cursor-pointer font-bold disabled:opacity-60"
                >
                  <span
                    className={`material-symbols-outlined text-base ${
                      isRegenerating ? 'animate-spin' : 'text-[#b48246]'
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
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-all text-xs font-semibold cursor-pointer"
                    title="Pusat Set Semula Data (Eksklusif Administrator)"
                  >
                    <span className="material-symbols-outlined text-base">restart_alt</span>
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
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#fbf6ee] hover:bg-[#f5eedb] text-[#7c5820] text-xs font-bold border border-[#b48246]/30 cursor-pointer shadow-2xs"
                    title="Tanya AI Dating Advisor"
                  >
                    <span className="material-symbols-outlined text-base text-[#b48246]">auto_awesome</span>
                    <span>Tanya AI Dating Advisor</span>
                  </button>
                )}
                {onOpenSavedSessions && (
                  <button
                    type="button"
                    onClick={onOpenSavedSessions}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-50 text-stone-800 hover:bg-stone-100 text-xs font-semibold border border-stone-200 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base text-stone-500">history</span>
                    <span>Sejarah Rekod ({savedSessionsCount})</span>
                  </button>
                )}
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold border border-stone-200 select-none">
                  <span className="material-symbols-outlined text-base text-emerald-600">verified</span>
                  <span>Diterbitkan oleh Penganjur</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Status Notice for Admin */}
        {isAdmin && (
          <div
            className={`mt-2 p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
              matchesPublished
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0 text-emerald-700">
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
              <span className="hidden sm:inline text-[11px] font-semibold text-stone-500 shrink-0">
                Rekod: {activeSessionTitle}
              </span>
            )}
          </div>
        )}
      </section>

      {/* Metric Quick Ribbon */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {/* Box 1: Median Affinity */}
        <div className="p-4 rounded-xl bg-white shadow-2xs flex flex-col justify-between border border-stone-200/80 hover:border-stone-300 transition-all min-h-[85px] sm:min-h-[105px]">
          <span className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider font-bold truncate leading-tight">
            Median Affinity
          </span>
          <div className="flex items-baseline justify-between sm:justify-start gap-1 sm:gap-2 mt-2">
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-stone-900 font-serif leading-none tabular-nums">
              {medianAffinity}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#fbf6ee] text-[#7c5820] font-bold text-[10px] border border-[#b48246]/20 shrink-0">
              +4.2% vs avg
            </span>
          </div>
        </div>

        {/* Box 2: Top Category Alignment */}
        <div className="p-4 rounded-xl bg-white shadow-2xs flex flex-col justify-between border border-stone-200/80 hover:border-stone-300 transition-all min-h-[85px] sm:min-h-[105px]">
          <span className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider font-bold truncate leading-tight">
            Top Category Alignment
          </span>
          <div className="flex flex-col gap-0.5 mt-2">
            <div className="flex items-center gap-1.5 text-stone-900">
              <span className="material-symbols-outlined text-[#b48246] text-sm sm:text-base shrink-0">auto_awesome</span>
              <span className="text-xs sm:text-sm lg:text-base font-bold text-stone-900 font-serif truncate leading-tight">
                Value Vector 04
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-stone-500 truncate leading-tight">
              Ethical & Family Aspirations
            </span>
          </div>
        </div>

        {/* Box 3: Geographic Overlap */}
        <div className="p-4 rounded-xl bg-white shadow-2xs flex flex-col justify-between border border-stone-200/80 hover:border-stone-300 transition-all min-h-[85px] sm:min-h-[105px]">
          <span className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider font-bold truncate leading-tight">
            Geographic Overlap
          </span>
          <div className="flex items-baseline justify-between sm:justify-start gap-1 sm:gap-2 mt-2">
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-stone-900 font-serif leading-none tabular-nums">
              {geographicOverlapPercent}
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-stone-500 shrink-0">
              Same Metro Zone
            </span>
          </div>
        </div>

        {/* Box 4: Smoking Status Sync */}
        <div className="p-4 rounded-xl bg-white shadow-2xs flex flex-col justify-between border border-stone-200/80 hover:border-stone-300 transition-all min-h-[85px] sm:min-h-[105px]">
          <span className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider font-bold truncate leading-tight">
            Smoking Status Sync
          </span>
          <div className="flex items-baseline justify-between sm:justify-start gap-1 sm:gap-2 mt-2">
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-stone-900 font-serif leading-none tabular-nums">
              {smokingConcordance}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200 shrink-0">
              100% Concordance
            </span>
          </div>
        </div>
      </section>
      {/* MATCH #1: Golden Ribbon Master Card */}
      <section className="mb-8" id="match-card-1">
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:shadow-xl border border-[#b48246]/35">
          {/* High Affinity Ambient Header Bar */}
          <div className="px-4 sm:px-6 py-3.5 bg-[#fbf6ee] border-b border-[#b48246]/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center px-2.5 h-8 rounded-full bg-[#b48246] text-white text-xs font-bold shadow-xs">
                Meja 1
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#7c5820] text-xs font-bold tracking-wider uppercase border border-[#b48246]/30 shadow-2xs">
                <span className="material-symbols-outlined text-sm text-[#b48246]">
                  workspace_premium
                </span>
                <span>Gold Ribbon • Top Algorithmic Match</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#b48246]/30 shadow-2xs">
                <span className="text-[11px] text-stone-500 uppercase tracking-wider font-bold">
                  Keserasian
                </span>
                <span className="text-base sm:text-lg text-stone-900 font-bold font-mono">
                  {match1.score}%
                </span>
              </div>
            </div>
          </div>

          {/* Candidate Side-by-Side Arena */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-11 items-center gap-4 sm:gap-6">
              {/* Male Candidate (Left) */}
              <div className="lg:col-span-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-stone-50/70 transition-all hover:bg-stone-50 border border-stone-200/80">
                <img
                  className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-xs shrink-0 ring-1 ring-stone-300/60"
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
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                    <span className="text-lg sm:text-xl text-stone-900 font-bold font-serif">
                      {match1.maleName}
                    </span>
                    <span className="text-xs text-stone-400 font-medium">
                      {match1.maleAge} thn
                    </span>
                  </div>
                  <span className="text-xs text-[#b48246] font-semibold">
                    {match1.maleOccupation}
                  </span>
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-stone-500 text-xs mt-0.5">
                    <span className="material-symbols-outlined text-xs text-stone-400">
                      location_on
                    </span>
                    <span>{match1.maleLocation}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-stone-200/80 text-stone-700 text-xs font-medium">
                      {match1.maleSmoking}
                    </span>
                    {match1.maleHobbies.slice(0, 2).map((h, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full bg-[#fbf6ee] text-[#7c5820] border border-[#b48246]/20 text-xs font-medium"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Central Affinity Badge / Luxury Dial */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center py-2 lg:py-0">
                <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-stone-900 text-white shadow-md border border-[#b48246]/40">
                  <span className="material-symbols-outlined text-2xl text-[#b48246]">
                    favorite
                  </span>
                </div>
                <span className="text-[11px] text-stone-900 font-bold font-mono mt-2">
                  {match1.score}%
                </span>
                <span className="text-[9px] text-stone-400 uppercase tracking-widest font-semibold">
                  Synced
                </span>
              </div>

              {/* Female Candidate (Right) */}
              <div className="lg:col-span-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-stone-50/70 transition-all hover:bg-stone-50 border border-stone-200/80">
                <img
                  className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-xs shrink-0 ring-1 ring-stone-300/60"
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
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                    <span className="text-lg sm:text-xl text-stone-900 font-bold font-serif">
                      {match1.femaleName}
                    </span>
                    <span className="text-xs text-stone-400 font-medium">
                      {match1.femaleAge} thn
                    </span>
                  </div>
                  <span className="text-xs text-[#b48246] font-semibold">
                    {match1.femaleOccupation}
                  </span>
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-stone-500 text-xs mt-0.5">
                    <span className="material-symbols-outlined text-xs text-stone-400">
                      location_on
                    </span>
                    <span>{match1.femaleLocation}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-stone-200/80 text-stone-700 text-xs font-medium">
                      {match1.femaleSmoking}
                    </span>
                    {match1.femaleHobbies.slice(0, 2).map((h, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full bg-[#fbf6ee] text-[#7c5820] border border-[#b48246]/20 text-xs font-medium"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Shared Trait Quick Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-stone-200/70">
              <span className="text-xs text-stone-400 uppercase tracking-wider font-bold mr-1">
                Kelebihan Bersama:
              </span>
              {(match1.crossCheckedTraits || [
                'Non-Smoker Match',
                'Shared Hobby: Culinary Arts',
                'Aligned Location (12km Radius)',
                'Equal Priority: Work-Life Boundaries'
              ]).map((trait, tIdx) => (
                <span
                  key={tIdx}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200"
                >
                  <span className="material-symbols-outlined text-sm text-[#b48246]">
                    {tIdx === 0
                      ? 'smoke_free'
                      : tIdx === 1
                      ? 'restaurant'
                      : tIdx === 2
                      ? 'near_me'
                      : 'schedule'}
                  </span>
                  <span>{trait}</span>
                </span>
              ))}
            </div>

            {/* 3-Pillar Qualitative Evaluation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              {/* Pillar 1: Why They Match */}
              <div className="p-4 rounded-xl bg-white flex flex-col gap-1.5 border border-stone-200/80 shadow-2xs">
                <div className="flex items-center gap-1.5 text-stone-900">
                  <span className="material-symbols-outlined text-base text-[#b48246]">auto_awesome</span>
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    1. Kenapa Mereka Serasi
                  </h3>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed mt-1">
                  {match1.whyTheyMatch}
                </p>
                <div className="mt-auto pt-3">
                  <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#b48246] h-full rounded-full transition-all duration-700"
                      style={{ width: `${match1.valueSynthesisPercent || 98}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-stone-400 mt-1.5 block font-semibold">
                    Value Synthesis: {match1.valueSynthesisPercent || 98}% Kukuh
                  </span>
                </div>
              </div>

              {/* Pillar 2: Potential Challenges */}
              <div className="p-4 rounded-xl bg-white flex flex-col gap-1.5 border border-stone-200/80 shadow-2xs">
                <div className="flex items-center gap-1.5 text-stone-900">
                  <span className="material-symbols-outlined text-base text-stone-500">balance</span>
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    2. Cabaran Berpotensi
                  </h3>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed mt-1">
                  {match1.potentialChallenges}
                </p>
                <div className="mt-auto pt-3">
                  <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-stone-800 h-full rounded-full transition-all duration-700"
                      style={{ width: `${match1.frictionProbabilityPercent || 22}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-stone-400 mt-1.5 block font-semibold">
                    Risiko Friksi: Rendah ({match1.frictionProbabilityPercent || 22}%)
                  </span>
                </div>
              </div>

              {/* Pillar 3: Tailored Date Recommendations */}
              <div className="p-4 rounded-xl bg-white flex flex-col gap-1.5 border border-stone-200/80 shadow-2xs">
                <div className="flex items-center gap-1.5 text-stone-900">
                  <span className="material-symbols-outlined text-base text-[#b48246]">local_activity</span>
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    3. Cadangan Janji Temu
                  </h3>
                </div>
                <ul className="flex flex-col gap-2 text-xs text-stone-600 mt-1">
                  {match1.recommendedActivities.map((act, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="shrink-0 w-4 h-4 rounded-full bg-[#fbf6ee] text-[#7c5820] text-[10px] font-bold flex items-center justify-center border border-[#b48246]/30">
                        {idx + 1}
                      </span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom Action Bar for Match #1 */}
              <div className="col-span-1 md:col-span-3 mt-2 pt-3 border-t border-stone-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                  <span className="material-symbols-outlined text-base text-[#b48246]">verified</span>
                  <span>
                    {isAdmin
                      ? 'AI Concierge: Analisis mendalam kekuatan nilai & cadangan aktiviti Pasangan 1'
                      : 'AI Dating Advisor: Bincang idea temu janji & pengukuhan hubungan'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDossierMatch(match1);
                      setIsDossierPreviewOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-2xs"
                    title="Cetak Kad Meja Ta'aruf & Dossier untuk Pasangan 1"
                  >
                    <span className="material-symbols-outlined text-sm text-[#b48246]">print</span>
                    <span>Cetak Kad Meja 1</span>
                  </button>

                  {onOpenWhatsAppDispatch && isAdmin && (
                    <button
                      type="button"
                      onClick={() => onOpenWhatsAppDispatch(match1)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-2xs"
                      title="Hantar makluman rasmi ke WhatsApp pasangan"
                    >
                      <span className="material-symbols-outlined text-sm text-emerald-600">chat</span>
                      <span>Hantar WhatsApp</span>
                    </button>
                  )}

                  {onOpenConcierge && (isAdmin || (myMatch && myMatch.rank === 1)) && (
                    <button
                      type="button"
                      onClick={() => onOpenConcierge(1)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold shadow-xs hover:bg-stone-800 transition-all cursor-pointer active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm text-[#b48246]">auto_awesome</span>
                      <span>{isAdmin ? 'Analisis Pasangan 1 dengan AI' : 'Tanya AI Mengenai Pasangan Ini'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MATCHES #2 THROUGH #10: Interactive Accordion Hierarchy */}
      {secondaryMatches.length > 0 && (
        <section className="flex flex-col gap-4 mb-8">
          <div className="flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <span className="text-lg text-stone-900 font-bold font-serif">
                Padanan Keserasian Seterusnya
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-semibold text-xs border border-stone-200">
                Pasangan 2 hingga {matches.length}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-[#b48246] hover:text-[#8f6430] hover:underline cursor-pointer font-bold transition-colors"
            >
              {allExpanded ? 'Tutup Semua Butiran' : 'Buka Semua Butiran'}
            </button>
          </div>

          {secondaryMatches.map(match => {
            const isExpanded = !!expandedCards[match.rank];

            return (
              <div
                key={match.rank}
                id={`match-card-${match.rank}`}
                className="rounded-2xl bg-white shadow-2xs hover:shadow-md transition-all duration-200 border border-stone-200/80 hover:border-[#b48246]/40 overflow-hidden"
              >
                {/* Trigger Row */}
                <div
                  onClick={() => toggleCard(match.rank)}
                  className="p-4 sm:p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-stone-50/50 transition-colors select-none"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-bold flex items-center justify-center shrink-0 border border-stone-200/60 font-mono">
                      Meja {match.rank}
                    </span>

                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex -space-x-2.5 overflow-hidden shrink-0">
                        <img
                          className="inline-block h-11 w-11 rounded-full ring-2 ring-white object-cover shadow-2xs"
                          alt={match.maleName}
                          src={
                            match.malePhoto ||
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuAwOqlCtrC7wUSP62ZrSTKwVCa18SwrN7yEN_VPoHM2eSuDPcJfp2ajgyFTZGe8jYhs-pjTpYDHoVr9EmRpV5SWHTzwr86XN9LWOjKGAaW8Y645slcvdlLU6XHML39LTJ2GE6h_tHpGUdI9uAWjj2Nmd8jBqgASdPQb5tSDd6nrQ-1epJ-tTyAbMOq82GyTIGsKQ2wIt9wARh3wzv9slVcX1Bs1EeV4X_FSDBgFacd4Awfg2SNqGg84'
                          }
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://lh3.googleusercontent.com/aida-public/AB6AXuAwOqlCtrC7wUSP62ZrSTKwVCa18SwrN7yEN_VPoHM2eSuDPcJfp2ajgyFTZGe8jYhs-pjTpYDHoVr9EmRpV5SWHTzwr86XN9LWOjKGAaW8Y645slcvdlLU6XHML39LTJ2GE6h_tHpGUdI9uAWjj2Nmd8jBqgASdPQb5tSDd6nrQ-1epJ-tTyAbMOq82GyTIGsKQ2wIt9wARh3wzv9slVcX1Bs1EeV4X_FSDBgFacd4Awfg2SNqGg84';
                          }}
                        />
                        <img
                          className="inline-block h-11 w-11 rounded-full ring-2 ring-white object-cover shadow-2xs"
                          alt={match.femaleName}
                          src={
                            match.femalePhoto ||
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuBnSwa8m2QElUYk3cXu4-FBt_8BOb2uaCzu0RaP20Z8W8f9OyyFFt-M8Ddcrjlbz9ZWLIBS9S1-S8l5kwB63LxCDVKYKXvnIQMm04_EtdQNvScW8NXkWUG7eU4kHrqW6BXdCj5qZraQVlIWGf1UMJkgP2t2g-S3BKHRRvuEECoRtGipu0KtT_DV859ZTflCMruAR-kJpFFIHeLYNQH88pCAuN6DEi-i9oUCgua6mK2ONxwVzqS7PV3i'
                          }
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://lh3.googleusercontent.com/aida-public/AB6AXuBnSwa8m2QElUYk3cXu4-FBt_8BOb2uaCzu0RaP20Z8W8f9OyyFFt-M8Ddcrjlbz9ZWLIBS9S1-S8l5kwB63LxCDVKYKXvnIQMm04_EtdQNvScW8NXkWUG7eU4kHrqW6BXdCj5qZraQVlIWGf1UMJkgP2t2g-S3BKHRRvuEECoRtGipu0KtT_DV859ZTflCMruAR-kJpFFIHeLYNQH88pCAuN6DEi-i9oUCgua6mK2ONxwVzqS7PV3i';
                          }}
                        />
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-base text-stone-900 font-bold font-serif truncate">
                            {match.maleName}
                          </span>
                          <span className="text-xs text-stone-400 font-serif italic">&amp;</span>
                          <span className="text-base text-stone-900 font-bold font-serif truncate">
                            {match.femaleName}
                          </span>
                        </div>
                        <span className="text-xs text-stone-500 truncate">
                          {match.maleOccupation} ({match.maleAge}) <span className="text-stone-300">·</span> {match.femaleOccupation} ({match.femaleAge})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 justify-between md:justify-end pt-2 md:pt-0 border-t border-stone-100 md:border-0">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-xs font-medium">
                        {match.maleSmoking}
                      </span>
                      {match.crossCheckedTraits && match.crossCheckedTraits[1] && (
                        <span className="px-2.5 py-0.5 rounded-full bg-stone-50 text-stone-600 text-xs border border-stone-200/60">
                          {match.crossCheckedTraits[1]}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-base sm:text-lg text-stone-900 font-bold font-mono">
                          {match.score}%
                        </span>
                        <span className="text-[9px] text-stone-400 block font-semibold uppercase tracking-wider">
                          Keserasian
                        </span>
                      </div>
                      <span
                        className={`material-symbols-outlined text-stone-400 transform transition-transform duration-200 text-xl ${
                          isExpanded ? 'rotate-180 text-stone-900' : ''
                        }`}
                      >
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expandable Drawer Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 sm:px-6 sm:pb-6 pt-1 card-details border-t border-stone-100 bg-stone-50/40">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
                      <div className="p-4 rounded-xl bg-white flex flex-col gap-1 border border-stone-200/80 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-stone-900">
                          <span className="material-symbols-outlined text-base text-[#b48246]">auto_awesome</span>
                          <span className="text-xs text-stone-900 font-bold uppercase tracking-wider">
                            Kenapa Mereka Serasi
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                          {match.whyTheyMatch}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-white flex flex-col gap-1 border border-stone-200/80 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-stone-900">
                          <span className="material-symbols-outlined text-base text-stone-500">balance</span>
                          <span className="text-xs text-stone-900 font-bold uppercase tracking-wider">
                            Cabaran Berpotensi
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                          {match.potentialChallenges}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-white flex flex-col gap-1 border border-stone-200/80 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-stone-900">
                          <span className="material-symbols-outlined text-base text-[#b48246]">local_activity</span>
                          <span className="text-xs text-stone-900 font-bold uppercase tracking-wider">
                            Cadangan Janji Temu
                          </span>
                        </div>
                        <ul className="text-xs text-stone-600 mt-1 flex flex-col gap-1.5">
                          {match.recommendedActivities.map((act, aIdx) => (
                            <li key={aIdx} className="flex items-start gap-1.5">
                              <span className="shrink-0 w-3.5 h-3.5 rounded-full bg-[#fbf6ee] text-[#7c5820] text-[9px] font-bold flex items-center justify-center border border-[#b48246]/20 mt-0.5">
                                {aIdx + 1}
                              </span>
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Secondary Match Card Concierge Action & WhatsApp Dispatch */}
                      <div className="col-span-1 md:col-span-3 mt-2 pt-3 border-t border-stone-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                          <span className="material-symbols-outlined text-base text-[#b48246]">psychology</span>
                          <span>{isAdmin ? `Tindakan Penganjur untuk Pasangan ${match.rank}` : 'Personal AI Dating Advisor'}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDossierMatch(match);
                              setIsDossierPreviewOpen(true);
                            }}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-2xs"
                            title={`Cetak Kad Meja Ta'aruf untuk Meja ${match.rank}`}
                          >
                            <span className="material-symbols-outlined text-sm text-[#b48246]">print</span>
                            <span>Cetak Meja {match.rank}</span>
                          </button>

                          {onOpenWhatsAppDispatch && isAdmin && (
                            <button
                              type="button"
                              onClick={() => onOpenWhatsAppDispatch(match)}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-2xs"
                              title="Hantar makluman rasmi ke WhatsApp pasangan"
                            >
                              <span className="material-symbols-outlined text-sm text-emerald-600">chat</span>
                              <span>Hantar WhatsApp</span>
                            </button>
                          )}

                          {onOpenConcierge && (isAdmin || (myMatch && myMatch.rank === match.rank)) && (
                            <button
                              type="button"
                              onClick={() => onOpenConcierge(match.rank)}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-xs"
                            >
                              <span className="material-symbols-outlined text-sm text-[#b48246]">auto_awesome</span>
                              <span>{isAdmin ? `Bincang Pasangan ${match.rank}` : 'Tanya AI'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* PRD Fallback / Insufficient Candidates Notice Module */}
      <section className="mt-4 mb-8 no-print">
        <div className="p-4 sm:p-5 rounded-2xl bg-white shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-stone-200/80">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-[#b48246] flex items-center justify-center shrink-0 border border-stone-200">
              <span className="material-symbols-outlined text-xl">info</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-stone-900 font-serif">
                  Nota Syarat Kelayakan Sistem
                </span>
                <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold border border-stone-200">
                  Mod Integriti
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Memerlukan sekurang-kurangnya 1 calon lelaki dan 1 calon perempuan untuk membolehkan enjin AI menjana padanan yang tepat dan bebas kecenderungan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSimulateInsufficient}
            className="w-full md:w-auto px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors text-xs font-semibold shrink-0 cursor-pointer text-center border border-stone-200"
          >
            Simulasi Kohort Tidak Cukup
          </button>
        </div>
      </section>

      {/* Match Dossier & Physical Ta'aruf Print Suite Modal */}
      <MatchDossierModal
        isOpen={isDossierPreviewOpen}
        onClose={() => {
          setIsDossierPreviewOpen(false);
          setSelectedDossierMatch(undefined);
        }}
        matches={matches}
        customMatch={selectedDossierMatch}
        initialMatchRank={selectedDossierMatch?.rank || 1}
        participantsCount={participantsCount}
        medianAffinity={medianAffinity}
        geographicOverlapPercent={geographicOverlapPercent}
        smokingConcordance={smokingConcordance}
      />
    </div>
  );
};
