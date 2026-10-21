import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface GenerationModalProps {
  isOpen: boolean;
  onComplete: () => void;
  maleCount: number;
  femaleCount: number;
  totalCandidates: number;
  isGenerating?: boolean;
  matchesCount?: number;
}

export const GenerationModal: React.FC<GenerationModalProps> = ({
  isOpen,
  onComplete,
  maleCount,
  femaleCount,
  totalCandidates,
  isGenerating = false,
  matchesCount = 10,
}) => {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setMinTimeElapsed(false);
      return;
    }

    const timer1 = setTimeout(() => setStep(2), 700);
    const timer2 = setTimeout(() => setStep(3), 1500);
    const timer3 = setTimeout(() => setMinTimeElapsed(true), 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen]);

  // Generation is truly ready when minimum visual animation elapsed AND backend/client generation completed
  const isReady = minTimeElapsed && !isGenerating;

  // Auto-redirect to results after 1.8 seconds of readiness to prevent user hanging
  useEffect(() => {
    if (isReady && isOpen) {
      const autoRedirect = setTimeout(() => {
        onComplete();
      }, 1600);
      return () => clearTimeout(autoRedirect);
    }
  }, [isReady, isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden border border-stone-200">
        {/* Ambient subtle light effects */}
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#fbf6ee] blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-[#fbf6ee] blur-2xl pointer-events-none"></div>

        {/* Animated Icon & Ring */}
        <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full border-3 border-stone-100 ${
              isReady ? 'border-emerald-500' : 'border-t-[#b48246] animate-spin'
            }`}
          ></div>
          <div className="w-14 h-14 rounded-full bg-stone-900 text-white flex items-center justify-center shadow-md border border-stone-800">
            <span
              className={`material-symbols-outlined text-2xl ${
                isReady ? 'text-emerald-400' : 'animate-pulse text-[#b48246]'
              }`}
            >
              {isReady ? 'verified' : 'auto_awesome'}
            </span>
          </div>
        </div>

        <span className="text-xs text-[#b48246] uppercase font-bold tracking-widest mb-1">
          Enjin Padanan AI & Sintesis Nilai
        </span>
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
          {isReady ? 'Padanan Berjaya Dijana!' : 'Menilai Keserasian Kohort'}
        </h3>
        <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-sm leading-relaxed">
          {isReady
            ? `Top ${matchesCount} padanan 1-ke-1 eksklusif sedia dibuka dengan sifar pertindihan calon.`
            : `Menganalisis ${totalCandidates} calon (${maleCount} lelaki & ${femaleCount} perempuan) menggunakan model keserasian holistik...`}
        </p>

        {/* Step Progression Indicators */}
        <div className="w-full bg-stone-50 rounded-xl p-4 my-5 flex flex-col gap-2.5 text-left border border-stone-200/90">
          {/* Step 1 */}
          <div className="flex items-center gap-2.5 text-xs">
            {step >= 2 ? (
              <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
            ) : (
              <span className="material-symbols-outlined text-base animate-spin text-[#b48246]">sync</span>
            )}
            <span className={step >= 2 ? 'text-stone-800 font-medium' : 'text-stone-900 font-bold'}>
              {step >= 2
                ? `Matriks silang ${maleCount * femaleCount} kombinasi berjaya dinilai`
                : `Memproses profil ${totalCandidates} calon berdaftar...`}
            </span>
          </div>

          {/* Step 2 */}
          <div
            className={`flex items-center gap-2.5 text-xs ${
              step < 2 ? 'text-stone-400 opacity-60' : step === 2 ? 'text-stone-900 font-bold' : 'text-stone-800 font-medium'
            }`}
          >
            {step > 2 ? (
              <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
            ) : step === 2 ? (
              <span className="material-symbols-outlined text-base animate-spin text-[#b48246]">sync</span>
            ) : (
              <span className="material-symbols-outlined text-base">radio_button_unchecked</span>
            )}
            <span>
              {step > 2
                ? 'Penilaian tabiat, lokasi, minat & umur diselaraskan'
                : 'Menganalisis vektor personaliti & kriteria pasangan...'}
            </span>
          </div>

          {/* Step 3 */}
          <div
            className={`flex items-center gap-2.5 text-xs ${
              !isReady && step < 3
                ? 'text-stone-400 opacity-60'
                : step === 3 && !isReady
                ? 'text-stone-900 font-bold'
                : 'text-stone-800 font-medium'
            }`}
          >
            {isReady ? (
              <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
            ) : step === 3 ? (
              <span className="material-symbols-outlined text-base animate-spin text-[#b48246]">sync</span>
            ) : (
              <span className="material-symbols-outlined text-base">radio_button_unchecked</span>
            )}
            <span>
              {isReady
                ? 'Model 1-ke-1 selesai (sifar pertindihan pasangan)'
                : 'Menjana cadangan topik perbualan ta\'aruf...'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full flex items-center justify-center pt-1">
          {isReady ? (
            <button
              type="button"
              onClick={onComplete}
              className="w-full py-3 px-5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-stone-900"
            >
              <span>Lihat Keputusan Padanan AI Sekarang</span>
              <span className="material-symbols-outlined text-base text-[#b48246]">arrow_forward</span>
            </button>
          ) : (
            <div className="w-full py-2.5 rounded-xl bg-stone-100 text-stone-600 text-xs font-semibold flex items-center justify-center gap-2 border border-stone-200">
              <span className="material-symbols-outlined text-sm animate-spin text-[#b48246]">refresh</span>
              <span>Menjana Padanan Optimum...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
