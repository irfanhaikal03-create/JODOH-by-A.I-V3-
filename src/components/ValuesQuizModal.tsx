import React, { useState } from 'react';
import { Participant, ValuesQuizAnswers } from '../types';

interface ValuesQuizModalProps {
  participant: Participant;
  isOpen: boolean;
  onClose: () => void;
  onSaveQuizResult: (archetype: string, answers: ValuesQuizAnswers) => void;
}

interface QuestionDef {
  key: keyof ValuesQuizAnswers;
  number: number;
  category: string;
  title: string;
  subtitle: string;
  options: {
    id: string;
    label: string;
    desc: string;
    icon: string;
  }[];
}

const QUIZ_QUESTIONS: QuestionDef[] = [
  {
    key: 'finance',
    number: 1,
    category: 'Kewangan Rumah Tangga',
    title: 'Bagaimanakah pendekatan kewangan yang paling sesuai untuk anda berdua?',
    subtitle: 'Pengurusan aliran tunai dan komitmen kewangan bersama',
    options: [
      {
        id: 'A',
        label: 'Akaun Bersama Sepenuhnya',
        desc: 'Semua pendapatan dan perbelanjaan dikongsi bersama secara telus dalam satu tabung utama.',
        icon: 'account_balance',
      },
      {
        id: 'B',
        label: 'Model Hibrid Seimbang',
        desc: 'Akaun bersama untuk komitmen bulanan rumah tangga, manakala baki simpanan peribadi diuruskan sendiri.',
        icon: 'savings',
      },
      {
        id: 'C',
        label: 'Model Nafkah Tradisional',
        desc: 'Suami membiayai keperluan asas dan nafkah keluarga, pendapatan isteri adalah hak peribadinya.',
        icon: 'account_balance_wallet',
      },
    ],
  },
  {
    key: 'conflict',
    number: 2,
    category: 'Resolusi Konflik',
    title: 'Apabila berlaku perselisihan faham, apakah kaedah penyelesaian yang anda utamakan?',
    subtitle: 'Pendekatan mengurus emosi dan perbezaan pendapat',
    options: [
      {
        id: 'A',
        label: 'Bincang Serta-Merta',
        desc: 'Menyelesaikan isu pada hari yang sama dengan tenang sebelum tidur tanpa membiarkannya berlarutan.',
        icon: 'forum',
      },
      {
        id: 'B',
        label: 'Beri Ruang Bertenang',
        desc: 'Mengambil masa 1 hingga 2 jam untuk menyejukkan emosi sebelum kembali berbincang secara rasional.',
        icon: 'hourglass_empty',
      },
      {
        id: 'C',
        label: 'Refleksi Bertulis',
        desc: 'Meluahkan perasaan melalui pesanan bertulis atau nota jika sukar diungkapkan secara lisan terlebih dahulu.',
        icon: 'edit_note',
      },
    ],
  },
  {
    key: 'career',
    number: 3,
    category: 'Kerjaya & Waktu Keluarga',
    title: 'Bagaimana anda mengimbangi tuntutan kerjaya dan kehidupan peribadi?',
    subtitle: 'Falsafah pengurusan masa dan sokongan perkembangan profesional',
    options: [
      {
        id: 'A',
        label: 'Keluarga Sentiasa Utama',
        desc: 'Masa berkualiti bersama keluarga tidak boleh dikorbankan demi tuntutan pekerjaan.',
        icon: 'family_restroom',
      },
      {
        id: 'B',
        label: 'Saling Menyokong Kerjaya',
        desc: 'Fleksibel dan saling bergilir menyokong sekiranya pasangan perlu mengejar peluang atau kenaikan kerjaya.',
        icon: 'trending_up',
      },
      {
        id: 'C',
        label: 'Bina Kestabilan Awal',
        desc: 'Fokus membina kedudukan ekonomi yang kukuh pada tahun-tahun awal perkahwinan demi masa depan.',
        icon: 'workspace_premium',
      },
    ],
  },
  {
    key: 'living',
    number: 4,
    category: 'Kediaman & Keluarga Mertua',
    title: 'Apakah susunan tempat tinggal yang menjadi keutamaan anda selepas bernikah?',
    subtitle: 'Privasi rumah tangga dan hubungan silaturahim bersama ibu bapa',
    options: [
      {
        id: 'A',
        label: 'Kediaman Sendiri Mutlak',
        desc: 'Mesti mempunyai kediaman berasingan sendiri demi menjaga privasi dan keharmonian suami isteri.',
        icon: 'home',
      },
      {
        id: 'B',
        label: 'Fleksibel Berdekatan Keluarga',
        desc: 'Terbuka tinggal berdekatan atau menumpang sementara jika situasi keluarga memerlukan.',
        icon: 'holiday_village',
      },
      {
        id: 'C',
        label: 'Komited Menjaga Ibu Bapa',
        desc: 'Bersedia tinggal bersama atau menjaga ibu bapa yang sudah berusia di bawah satu bumbung.',
        icon: 'volunteer_activism',
      },
    ],
  },
  {
    key: 'lifestyle',
    number: 5,
    category: 'Gaya Hidup & Waktu Lapang',
    title: 'Bagaimanakah cara anda mengisi masa lapang pada hujung minggu?',
    subtitle: 'Corak rekreasi dan tenaga sosial pasangan',
    options: [
      {
        id: 'A',
        label: 'Ketenangan di Rumah',
        desc: 'Menghargai ketenangan berdua di rumah, menonton bersama, dan berehat santai tanpa kesibukan luar.',
        icon: 'weekend',
      },
      {
        id: 'B',
        label: 'Aktiviti Luar & Kembara',
        desc: 'Gemar melancong, mencuba tempat makan baharu, aktiviti riadah luar, dan bersosial.',
        icon: 'explore',
      },
      {
        id: 'C',
        label: 'Keseimbangan Hobi Sendiri',
        desc: 'Menghargai ruang untuk hobi individu di samping meluangkan masa berdua yang berkualiti.',
        icon: 'palette',
      },
    ],
  },
  {
    key: 'roles',
    number: 6,
    category: 'Tanggungjawab Domestik',
    title: 'Bagaimanakah pembahagian tugas menguruskan rumah tangga dan anak-anak?',
    subtitle: 'Kerjasama praktikal harian di dalam rumah',
    options: [
      {
        id: 'A',
        label: 'Saksama 50/50',
        desc: 'Tugas memasak, membersih, dan urusan rumah tangga dikongsi bersama secara seimbang tanpa stereotaip jantina.',
        icon: 'balance',
      },
      {
        id: 'B',
        label: 'Mengikut Kepakaran',
        desc: 'Masing-masing menguruskan bahagian yang mereka mahir dan paling selesa lakukan.',
        icon: 'handshake',
      },
      {
        id: 'C',
        label: 'Fleksibel Mengikut Kelapangan',
        desc: 'Saling membantu secara dinamik mengikut siapa yang mempunyai kelapangan masa pada hari berkenaan.',
        icon: 'sync_alt',
      },
    ],
  },
];

// Determine archetype based on answers
export const calculateArchetype = (answers: ValuesQuizAnswers): { title: string; summary: string; color: string } => {
  const { finance, conflict, career, living, lifestyle, roles } = answers;
  
  if (finance === 'A' && living === 'A' && (roles === 'A' || roles === 'B')) {
    return {
      title: 'Arkitek Keluarga Terancang',
      summary: 'Mengutamakan ketelusan tinggi, perancangan masa depan berstruktur, dan privasi rumah tangga yang selamat.',
      color: 'bg-emerald-900 text-emerald-100 border-emerald-700',
    };
  }

  if (finance === 'C' || living === 'C' || career === 'A') {
    return {
      title: 'Penyayang Tradisional Harmoni',
      summary: 'Menjunjung nilai kekeluargaan erat, bakti kepada ibu bapa, dan keharmonian peranan saling melengkapi.',
      color: 'bg-amber-900 text-amber-100 border-amber-700',
    };
  }

  if (roles === 'A' && career === 'B') {
    return {
      title: 'Rakan Kongsi Progresif Simbiotik',
      summary: 'Mengamalkan perkongsian saksama, saling menyokong kemajuan kerjaya, dan kerjasama dinamik 50/50.',
      color: 'bg-stone-900 text-amber-200 border-[#b48246]',
    };
  }

  return {
    title: 'Penjelajah Santai Bersahaja',
    summary: 'Mementingkan keseimbangan emosi, fleksibiliti dalam urusan harian, dan komunikasi yang terbuka tanpa tekanan.',
    color: 'bg-sky-900 text-sky-100 border-sky-700',
  };
};

export const ValuesQuizModal: React.FC<ValuesQuizModalProps> = ({
  participant,
  isOpen,
  onClose,
  onSaveQuizResult,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<ValuesQuizAnswers>(() => {
    return (
      participant.valuesAnswers || {
        finance: '',
        conflict: '',
        career: '',
        living: '',
        lifestyle: '',
        roles: '',
      }
    );
  });
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isOpen) return null;

  const currentQ = QUIZ_QUESTIONS[currentStep];
  const totalQuestions = QUIZ_QUESTIONS.length;
  const currentAnswer = answers[currentQ.key];

  const handleSelectOption = (optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQ.key]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentStep < totalQuestions - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    const result = calculateArchetype(answers);
    onSaveQuizResult(result.title, answers);
    onClose();
  };

  const archetypeResult = isCompleted ? calculateArchetype(answers) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#fdfbf7] text-stone-900 rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Top Header */}
        <div className="px-6 py-5 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-800 border border-[#b48246]/40 flex items-center justify-center text-[#d4af37]">
              <span className="material-symbols-outlined text-xl">psychology</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#d4af37]">
                  JODOH by A.I Assessment
                </span>
                <span className="px-2 py-0.2 rounded-full bg-stone-800 text-stone-300 text-[10px] font-medium">
                  {participant.name}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-white">
                Kuiz Nilai Hidup & Keserasian Personaliti
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {!isCompleted ? (
          <div>
            {/* Progress Bar */}
            <div className="px-6 pt-4 pb-2 bg-[#f8f5ee] border-b border-stone-200/60">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-stone-700">
                  Soalan {currentStep + 1} daripada {totalQuestions}: <span className="text-[#8f6430]">{currentQ.category}</span>
                </span>
                <span className="text-stone-500 font-semibold tabular-nums">
                  {Math.round(((currentStep + 1) / totalQuestions) * 100)}% Selesai
                </span>
              </div>
              <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#b48246] to-[#8f6430] transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="p-6 sm:p-7 space-y-5">
              <div>
                <span className="inline-block px-2.5 py-1 rounded-md bg-[#f2e9dc] text-[#7c5820] text-[11px] font-bold uppercase tracking-wider mb-2">
                  Dimensi {currentQ.number}
                </span>
                <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900 leading-snug">
                  {currentQ.title}
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  {currentQ.subtitle}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3 pt-1">
                {currentQ.options.map(opt => {
                  const isSelected = currentAnswer === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(opt.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                        isSelected
                          ? 'bg-[#fcf8f0] border-[#b48246] ring-1 ring-[#b48246] shadow-xs'
                          : 'bg-white hover:bg-stone-50/80 border-stone-200 text-stone-800'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base font-bold transition-colors ${
                          isSelected
                            ? 'bg-[#b48246] text-white shadow-xs'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">{opt.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`text-sm font-bold ${
                              isSelected ? 'text-stone-900' : 'text-stone-800'
                            }`}
                          >
                            {opt.label}
                          </h4>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#b48246] text-white flex items-center justify-center text-xs">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                          {opt.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="px-6 py-4 bg-[#f8f5ee] border-t border-stone-200/80 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentStep === 0
                    ? 'opacity-40 cursor-not-allowed text-stone-400'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Sebelumnya</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!currentAnswer}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                  !currentAnswer
                    ? 'opacity-50 cursor-not-allowed bg-stone-300 text-stone-500'
                    : 'bg-stone-900 hover:bg-stone-800 text-white'
                }`}
              >
                <span>{currentStep === totalQuestions - 1 ? 'Lihat Keputusan Arketaip' : 'Seterusnya'}</span>
                <span className="material-symbols-outlined text-sm text-[#d4af37]">arrow_forward</span>
              </button>
            </div>
          </div>
        ) : (
          /* Completion & Archetype Reveal Screen */
          <div className="p-6 sm:p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-[#f7eedc] text-[#b48246] border border-[#b48246]/40 flex items-center justify-center text-4xl shadow-sm">
              ✨
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-[#f4e8d3] text-[#7c5820] text-xs font-bold uppercase tracking-wider">
                Keputusan Arketaip Personaliti Nilai
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                {archetypeResult?.title}
              </h3>
              <p className="text-sm text-stone-600 max-w-lg mx-auto leading-relaxed">
                {archetypeResult?.summary}
              </p>
            </div>

            {/* Answer Synthesis Matrix */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 text-left space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Ringkasan Nilai Terpilih
                </span>
                <span className="text-xs text-[#8f6430] font-semibold">
                  6 / 6 Dimensi Lengkap
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {QUIZ_QUESTIONS.map(q => {
                  const selectedId = answers[q.key];
                  const opt = q.options.find(o => o.id === selectedId);
                  return (
                    <div key={q.key} className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
                        {q.category}
                      </span>
                      <p className="font-semibold text-stone-800">
                        {opt?.label || 'Belum dipilih'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCompleted(false);
                  setCurrentStep(0);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white text-stone-700 hover:bg-stone-100 border border-stone-200 text-xs font-semibold transition-all cursor-pointer"
              >
                Semak Semula Jawapan
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base text-[#d4af37]">check_circle</span>
                <span>Simpan ke Profil Saya</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
