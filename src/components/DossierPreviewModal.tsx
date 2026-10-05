import React from 'react';
import { MatchResult } from '../types';

interface DossierPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: MatchResult[];
  participantsCount: number;
  medianAffinity: string;
  geographicOverlapPercent: string;
  smokingConcordance: string;
  onDownloadPDF: () => void;
  onDownloadCSV: () => void;
}

export const DossierPreviewModal: React.FC<DossierPreviewModalProps> = ({
  isOpen,
  onClose,
  matches,
  participantsCount,
  medianAffinity,
  geographicOverlapPercent,
  smokingConcordance,
  onDownloadPDF,
  onDownloadCSV,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    // Printable view using hidden iframe or printable window
    const printContent = document.getElementById('printable-dossier-content');
    if (!printContent) return;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>JODOH by A.I — Executive Matchmaking Dossier</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #131b2e; font-size: 13px; line-height: 1.5; }
              h1 { color: #62002d; font-size: 20px; margin-bottom: 4px; }
              .subtitle { font-size: 11px; color: #564146; margin-bottom: 20px; }
              .meta-grid { display: flex; gap: 16px; background: #f2f3ff; border: 1px solid #dcc0c5; padding: 10px 14px; border-radius: 6px; margin-bottom: 24px; font-size: 11px; font-weight: bold; }
              .card { border: 1px solid #dcc0c5; border-radius: 8px; margin-bottom: 20px; padding: 16px; page-break-inside: avoid; }
              .card-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 12px; }
              .rank-title { font-weight: bold; color: #62002d; font-size: 15px; }
              .score { background: #ffd9e0; color: #62002d; padding: 3px 8px; border-radius: 12px; font-weight: bold; }
              .candidates { display: flex; gap: 20px; margin-bottom: 12px; }
              .candidate-box { flex: 1; background: #faf8ff; padding: 8px 12px; border-radius: 6px; }
              .candidate-role { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #897176; }
              .section-title { font-size: 11px; font-weight: bold; color: #62002d; margin-top: 8px; margin-bottom: 2px; }
              .section-text { font-size: 12px; color: #444; }
              .date-item { display: inline-block; background: #eef0ff; padding: 2px 8px; border-radius: 4px; margin-right: 6px; margin-top: 4px; font-size: 11px; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        } catch (e) {
          console.error('Print iframe error:', e);
        }
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 2000);
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-surface-container-lowest w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">description</span>
            <div>
              <h3 className="font-serif font-bold text-on-surface text-base sm:text-lg leading-tight">
                Executive Matchmaking Dossier Preview
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Top {matches.length} Algorithmic Compatibility Matches • Cohort of {participantsCount}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-bold text-xs shadow-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer"
              title="Download compiled PDF document directly"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-semibold text-xs transition-all cursor-pointer"
              title="Print document or Save as PDF"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={onDownloadCSV}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-semibold text-xs transition-all cursor-pointer"
              title="Export as CSV table"
            >
              <span className="material-symbols-outlined text-sm">table_view</span>
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer ml-1"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Document Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-surface-container-lowest/50">
          <div id="printable-dossier-content" className="max-w-3xl mx-auto bg-surface-container-lowest p-4 sm:p-8 rounded-xl shadow-xs border border-outline-variant/20">
            {/* Header Title Banner */}
            <div className="p-4 sm:p-5 rounded-xl bg-primary text-on-primary mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h1 className="font-serif font-bold text-lg sm:text-xl text-white tracking-wide">
                    JODOH BY A.I — EXECUTIVE MATCHMAKING DOSSIER
                  </h1>
                  <p className="text-xs text-white/80 mt-0.5">
                    Deterministic & Gemini AI Algorithmic Pairings • 1-to-1 Exclusive Model
                  </p>
                </div>
                <div className="text-right sm:border-l sm:border-white/20 sm:pl-4">
                  <span className="text-[10px] uppercase tracking-wider text-white/70 block">Evaluation Date</span>
                  <span className="text-xs font-bold text-white">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Metrics Ribbon */}
            <div className="meta-grid grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 mb-6 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-outline block">Median Affinity</span>
                <span className="font-serif font-bold text-primary text-base">{medianAffinity}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-outline block">Smoking Sync</span>
                <span className="font-bold text-on-surface text-sm">{smokingConcordance}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-outline block">Metro Overlap</span>
                <span className="font-bold text-on-surface text-sm">{geographicOverlapPercent}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-outline block">Cohort Quorum</span>
                <span className="font-bold text-emerald-700 text-sm">{participantsCount} Candidates</span>
              </div>
            </div>

            {/* List of Match Cards */}
            <div className="flex flex-col gap-4">
              {matches.map(m => (
                <div 
                  key={m.rank}
                  className={`card p-4 rounded-xl border ${
                    m.rank === 1
                      ? 'border-secondary/40 bg-surface-container-lowest shadow-sm ring-1 ring-secondary/20'
                      : 'border-outline-variant/25 bg-surface-container-lowest'
                  }`}
                >
                  <div className="card-header flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        m.rank === 1 ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-on-surface'
                      }`}>
                        #{m.rank} {m.rank === 1 ? 'GOLD RIBBON' : 'MATCH'}
                      </span>
                      <h4 className="font-serif font-bold text-sm sm:text-base text-on-surface">
                        {m.maleName} & {m.femaleName}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold text-xs">
                      <span>{m.score}% Affinity</span>
                    </div>
                  </div>

                  {/* Candidate Bios */}
                  <div className="candidates grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div className="candidate-box p-2.5 rounded-lg bg-surface-container-low/70 border border-outline-variant/15 text-xs">
                      <span className="candidate-role text-[10px] font-bold text-primary block uppercase">Male Candidate</span>
                      <div className="font-semibold text-on-surface mt-0.5">{m.maleName}, Age {m.maleAge}</div>
                      <div className="text-[11px] text-on-surface-variant">{m.maleOccupation} • {m.maleLocation} • {m.maleSmoking}</div>
                    </div>

                    <div className="candidate-box p-2.5 rounded-lg bg-surface-container-low/70 border border-outline-variant/15 text-xs">
                      <span className="candidate-role text-[10px] font-bold text-secondary block uppercase">Female Candidate</span>
                      <div className="font-semibold text-on-surface mt-0.5">{m.femaleName}, Age {m.femaleAge}</div>
                      <div className="text-[11px] text-on-surface-variant">{m.femaleOccupation} • {m.femaleLocation} • {m.femaleSmoking}</div>
                    </div>
                  </div>

                  {/* Why They Match */}
                  <div className="mb-2.5">
                    <span className="section-title text-[11px] font-bold text-primary uppercase block">1. Why They Match</span>
                    <p className="section-text text-xs text-on-surface-variant leading-relaxed mt-0.5">{m.whyTheyMatch}</p>
                  </div>

                  {/* Potential Challenges */}
                  <div className="mb-2.5">
                    <span className="section-title text-[11px] font-bold text-secondary uppercase block">2. Potential Challenges</span>
                    <p className="section-text text-xs text-on-surface-variant leading-relaxed mt-0.5">{m.potentialChallenges}</p>
                  </div>

                  {/* Tailored Dates */}
                  <div>
                    <span className="section-title text-[11px] font-bold text-on-surface uppercase block">3. Tailored Date Ideas</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(m.recommendedActivities || []).map((date, idx) => (
                        <span key={idx} className="date-item text-[11px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                          {idx + 1}. {date}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 bg-surface-container-low border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <p className="text-[11px] text-outline text-center sm:text-left">
            Dossier compiled via JODOH by A.I Executive Suite • Strict 1-to-1 candidate assignment
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-on-surface hover:bg-surface-container transition-all cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onDownloadPDF}
              className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold shadow-sm hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Download PDF File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
