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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden border border-stone-200/80">
        {/* Ambient light effects */}
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#fbf6ee] blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-[#fbf6ee] blur-2xl pointer-events-none"></div>

        {/* Animated Icon & Ring */}
        <div className="relative w-20 h-20 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-3 border-stone-100 border-t-[#b48246] animate-spin"></div>
          <div className="w-14 h-14 rounded-full bg-stone-900 text-white flex items-center justify-center shadow-md border border-stone-900">
            <span className="material-symbols-outlined text-2xl animate-pulse text-[#b48246]">psychology</span>
          </div>
        </div>

        <span className="text-xs text-[#b48246] uppercase font-bold tracking-widest mb-1">
          Neural Affinity Engine
        </span>
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
          Evaluating Permutations
        </h3>
        <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-sm leading-relaxed">
          {isFinished
            ? `High-affinity pairings successfully generated. ${Math.min(10, Math.min(maleCount, femaleCount))} exclusive 1-to-1 matches ready with zero partner overlap.`
            : 'Synthesizing value vectors, communicative temperament, and relational expectations with strict 1-to-1 candidate exclusivity...'}
        </p>

        {/* Dynamic Step Badges */}
        <div className="w-full bg-stone-50 rounded-xl p-4 my-5 flex flex-col gap-2 text-left border border-stone-200/80">
          {/* Step 1 */}
          <div className="flex items-center gap-2 text-xs">
            {step >= 2 ? (
              <span className="material-symbols-outlined text-base text-emerald-600">
                check_circle
              </span>
            ) : (
              <span className="material-symbols-outlined text-base animate-spin text-[#b48246]">
                sync
              </span>
            )}
            <span className={step >= 2 ? 'text-stone-800 font-medium' : 'text-stone-900 font-bold'}>
              {step >= 2
                ? `Cohort pool permutations generated (${maleCount * femaleCount} cross-comparisons)`
                : `Analyzing cohort pool (${totalCandidates} entries)...`}
            </span>
          </div>

          {/* Step 2 */}
          <div
            className={`flex items-center gap-2 text-xs ${
              step < 2 ? 'text-stone-400 opacity-60' : step === 2 ? 'text-stone-900 font-bold' : 'text-stone-800 font-medium'
            }`}
          >
            {step > 2 ? (
              <span className="material-symbols-outlined text-base text-emerald-600">
                check_circle
              </span>
            ) : step === 2 ? (
              <span className="material-symbols-outlined text-base animate-spin text-[#b48246]">
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
            className={`flex items-center gap-2 text-xs ${
              !isFinished && step < 3
                ? 'text-stone-400 opacity-60'
                : step === 3 && !isFinished
                ? 'text-stone-900 font-bold'
                : 'text-stone-800 font-medium'
            }`}
          >
            {isFinished ? (
              <span className="material-symbols-outlined text-base text-emerald-600">
                check_circle
              </span>
            ) : step === 3 ? (
              <span className="material-symbols-outlined text-base animate-spin text-[#b48246]">
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
        <div className="w-full flex items-center justify-center pt-1">
          {isFinished ? (
            <button
              type="button"
              onClick={onComplete}
              className="w-full py-3 px-5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-stone-900"
            >
              <span>Inspect Exclusive AI Matches</span>
              <span className="material-symbols-outlined text-base text-[#b48246]">arrow_forward</span>
            </button>
          ) : (
            <div className="w-full py-2.5 rounded-xl bg-stone-100 text-stone-600 text-xs font-semibold flex items-center justify-center gap-2 border border-stone-200/60">
              <span className="material-symbols-outlined text-sm animate-spin text-[#b48246]">
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
