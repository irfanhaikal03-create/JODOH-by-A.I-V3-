import React, { useState, useEffect } from 'react';

interface GenerationModalProps {
  isOpen: boolean;
  onComplete: () => void;
  maleCount: number;
  femaleCount: number;
  totalCandidates: number;
}

export const GenerationModal: React.FC<GenerationModalProps> = ({
  isOpen,
  onComplete,
  maleCount,
  femaleCount,
  totalCandidates,
}) => {
  const [step, setStep] = useState(1);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setIsFinished(false);
      return;
    }

    const timer1 = setTimeout(() => {
      setStep(2);
    }, 1200);

    const timer2 = setTimeout(() => {
      setStep(3);
    }, 2400);

    const timer3 = setTimeout(() => {
      setIsFinished(true);
    }, 3600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-inverse-surface/60 backdrop-blur-md">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg p-space-xl flex flex-col items-center text-center relative overflow-hidden border border-outline-variant/30">
        {/* Ambient light effects */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-secondary-fixed/40 blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-tertiary-fixed/30 blur-2xl pointer-events-none"></div>

        {/* Animated Icon & Ring */}
        <div className="relative w-20 h-20 mb-space-lg flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-surface-container border-t-primary animate-spin"></div>
          <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-2xl animate-pulse">psychology</span>
          </div>
        </div>

        <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-widest mb-1">
          Neural Affinity Engine
        </span>
        <h3 className="font-headline-md text-headline-md text-on-surface font-serif font-semibold">
          Evaluating Permutations
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs max-w-sm leading-relaxed">
          {isFinished
            ? `High-affinity pairings successfully generated. ${Math.min(10, Math.min(maleCount, femaleCount))} exclusive 1-to-1 matches ready with zero partner overlap.`
            : 'Synthesizing value vectors, communicative temperament, and relational expectations with strict 1-to-1 candidate exclusivity...'}
        </p>

        {/* Dynamic Step Badges */}
        <div className="w-full bg-surface-container-low rounded-xl p-space-md my-space-lg flex flex-col gap-space-xs text-left border border-outline-variant/15">
          {/* Step 1 */}
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm">
            {step >= 2 ? (
              <span className="material-symbols-outlined text-base text-emerald-600">
                check_circle
              </span>
            ) : (
              <span className="material-symbols-outlined text-base animate-spin text-primary">
                sync
              </span>
            )}
            <span className={step >= 2 ? 'text-on-surface' : 'text-primary font-bold'}>
              {step >= 2
                ? `Cohort pool permutations generated (${maleCount * femaleCount} cross-comparisons)`
                : `Analyzing cohort pool (${totalCandidates} entries)...`}
            </span>
          </div>

          {/* Step 2 */}
          <div
            className={`flex items-center gap-space-xs font-label-sm text-label-sm ${
              step < 2 ? 'text-outline opacity-50' : step === 2 ? 'text-primary font-bold' : 'text-on-surface'
            }`}
          >
            {step > 2 ? (
              <span className="material-symbols-outlined text-base text-emerald-600">
                check_circle
              </span>
            ) : step === 2 ? (
              <span className="material-symbols-outlined text-base animate-spin text-primary">
                sync
              </span>
            ) : (
              <span className="material-symbols-outlined text-base">radio_button_unchecked</span>
            )}
            <span>
              {step > 2
                ? 'Psychometric compatibility scored across all vectors'
                : 'Synthesizing conflict vectors & communication styles'}
            </span>
          </div>

          {/* Step 3 */}
          <div
            className={`flex items-center gap-space-xs font-label-sm text-label-sm ${
              !isFinished && step < 3
                ? 'text-outline opacity-50'
                : step === 3 && !isFinished
                ? 'text-primary font-bold'
                : 'text-on-surface'
            }`}
          >
            {isFinished ? (
              <span className="material-symbols-outlined text-base text-emerald-600">
                check_circle
              </span>
            ) : step === 3 ? (
              <span className="material-symbols-outlined text-base animate-spin text-primary">
                sync
              </span>
            ) : (
              <span className="material-symbols-outlined text-base">radio_button_unchecked</span>
            )}
            <span>
              {isFinished
                ? 'Exclusive 1-to-1 pairings synthesized (zero partner overlap)'
                : 'Curating customized first-date conversation architectures'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full flex items-center justify-center gap-space-sm pt-space-xs">
          {isFinished ? (
            <button
              type="button"
              onClick={onComplete}
              className="w-full py-space-sm px-space-lg rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-space-xs cursor-pointer font-bold animate-bounce-subtle"
            >
              <span>Inspect Exclusive AI Matches</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          ) : (
            <div className="w-full py-2.5 rounded-xl bg-surface-container-high text-on-surface-variant font-label-md flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm animate-spin text-primary">
                refresh
              </span>
              <span>Running Deep Compatibility Evaluation...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
