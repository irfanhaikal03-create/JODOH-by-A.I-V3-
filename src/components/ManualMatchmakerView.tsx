import React, { useState, useMemo } from 'react';
import { Participant, MatchResult } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ManualMatchmakerViewProps {
  participants: Participant[];
  currentMatches: MatchResult[];
  preselectedParticipantId?: string;
  onAssignOfficialMatch: (match: MatchResult) => void;
  onOpenWhatsAppDispatch: (match: MatchResult) => void;
  onBackToDirectory: () => void;
}

export const ManualMatchmakerView: React.FC<ManualMatchmakerViewProps> = ({
  participants,
  currentMatches,
  preselectedParticipantId,
  onAssignOfficialMatch,
  onOpenWhatsAppDispatch,
  onBackToDirectory,
}) => {
  const { t } = useLanguage();

  const males = useMemo(() => participants.filter(p => p.gender === 'Male'), [participants]);
  const females = useMemo(() => participants.filter(p => p.gender === 'Female'), [participants]);

  // Determine initial selected male and female
  const initialMale = useMemo(() => {
    if (preselectedParticipantId) {
      const found = males.find(m => m.id === preselectedParticipantId);
      if (found) return found;
    }
    return males[0] || null;
  }, [males, preselectedParticipantId]);

  const initialFemale = useMemo(() => {
    if (preselectedParticipantId) {
      const found = females.find(f => f.id === preselectedParticipantId);
      if (found) return found;
    }
    return females[0] || null;
  }, [females, preselectedParticipantId]);

  const [selectedMaleId, setSelectedMaleId] = useState<string>(initialMale?.id || '');
  const [selectedFemaleId, setSelectedFemaleId] = useState<string>(initialFemale?.id || '');
  const [maleSearch, setMaleSearch] = useState('');
  const [femaleSearch, setFemaleSearch] = useState('');
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);

  const selectedMale = males.find(m => m.id === selectedMaleId) || null;
  const selectedFemale = females.find(f => f.id === selectedFemaleId) || null;

  // Filtered lists for selectors
  const filteredMales = useMemo(() => {
    if (!maleSearch.trim()) return males;
    const q = maleSearch.toLowerCase();
    return males.filter(
      m => m.name.toLowerCase().includes(q) || m.occupation.toLowerCase().includes(q) || m.location.toLowerCase().includes(q)
    );
  }, [males, maleSearch]);

  const filteredFemales = useMemo(() => {
    if (!femaleSearch.trim()) return females;
    const q = femaleSearch.toLowerCase();
    return females.filter(
      f => f.name.toLowerCase().includes(q) || f.occupation.toLowerCase().includes(q) || f.location.toLowerCase().includes(q)
    );
  }, [females, femaleSearch]);

  // Dynamic AI Match Computation
  const matchAnalysis = useMemo(() => {
    if (!selectedMale || !selectedFemale) return null;

    const m = selectedMale;
    const f = selectedFemale;

    // 1. Age Score (ideal within 0-6 years)
    const ageDiff = Math.abs(m.age - f.age);
    let ageScore = 95;
    if (ageDiff > 10) ageScore = 60;
    else if (ageDiff > 7) ageScore = 75;
    else if (ageDiff > 4) ageScore = 88;

    // 2. Location Score
    const sameLoc = m.location.toLowerCase() === f.location.toLowerCase();
    const klSelangor = ['kuala lumpur', 'selangor', 'putrajaya'];
    const isNearby = klSelangor.includes(m.location.toLowerCase()) && klSelangor.includes(f.location.toLowerCase());
    const locScore = sameLoc ? 96 : isNearby ? 90 : 72;

    // 3. Smoking Compatibility (Deal-breaker)
    let smokeScore = 90;
    if (m.smoking === 'Smoker' && f.smoking === 'Non-Smoker') {
      smokeScore = 45;
    } else if (m.smoking === 'Non-Smoker' && f.smoking === 'Non-Smoker') {
      smokeScore = 98;
    }

    // 4. Shared Hobbies / Interests
    const mHobbies = Array.isArray(m.hobbies) ? m.hobbies : (m.hobbies || '').split(',').map(s => s.trim());
    const fHobbies = Array.isArray(f.hobbies) ? f.hobbies : (f.hobbies || '').split(',').map(s => s.trim());
    
    const mWords = (m.hobbies + ' ' + m.ideal).toLowerCase().split(/\s+/);
    const fWords = (f.hobbies + ' ' + f.ideal).toLowerCase().split(/\s+/);
    const commonWords = mWords.filter(w => w.length > 3 && fWords.includes(w));
    const sharedInterestsScore = Math.min(95, 70 + commonWords.length * 6);

    // 5. Values & Lifestyle Synthesis
    const valuesScore = Math.min(96, Math.round((ageScore + locScore + smokeScore + sharedInterestsScore) / 4) + 4);

    // Total Overall Score
    const overallScore = Math.round(
      valuesScore * 0.35 +
      ageScore * 0.20 +
      locScore * 0.15 +
      smokeScore * 0.15 +
      sharedInterestsScore * 0.15
    );

    // AI Narrative Generation
    const whyTheyMatch = `Kedua-dua ${m.name} (${m.occupation}) dan ${f.name} (${f.occupation}) menunjukkan keselarasan aspirasi hidup yang matang. ${
      sameLoc || isNearby ? 'Faktor kedekatan geografi memudahkan urusan pertemuan keluarga dan ta\'aruf.' : 'Walaupun berbeza lokasi, kerjaya kedua-duanya membolehkan perancangan mobiliti fleksibel.'
    } Kriteria pasangan idaman mereka saling melengkapi dari aspek emosi dan kestabilan kerjaya.`;

    const potentialChallenges = `${
      m.smoking === 'Smoker' && f.smoking === 'Non-Smoker'
        ? 'Perbezaan amalan merokok adalah faktor sensitif yang memerlukan persetujuan awal secara telus.'
        : ageDiff > 5
        ? `Perbezaan umur ${ageDiff} tahun memerlukan persefahaman gaya komunikasi antara fasa kerjaya.`
        : 'Kedua-dua calon mempunyai komitmen kerjaya yang dinamik; perlu membincangkan pembahagian masa rumahtangga.'
    }`;

    const icebreakers = [
      `Pandangan terhadap keseimbangan kerjaya dan keluarga selepas mendirikan rumahtangga.`,
      `Rancangan perancangan tempat tinggal dan penglibatan kedua-dua belah keluarga / wali.`,
      `Aktiviti riadah dan percutian santai yang paling disukai pada hujung minggu.`,
    ];

    const isAlreadyMatched = currentMatches.some(
      curr => (curr.maleId === m.id && curr.femaleId === f.id) || (curr.maleId === m.id) || (curr.femaleId === f.id)
    );

    return {
      overallScore,
      ageScore,
      locScore,
      smokeScore,
      sharedInterestsScore,
      valuesScore,
      whyTheyMatch,
      potentialChallenges,
      icebreakers,
      mHobbies,
      fHobbies,
      isAlreadyMatched,
    };
  }, [selectedMale, selectedFemale, currentMatches]);

  const handleAssignAsOfficial = () => {
    if (!selectedMale || !selectedFemale || !matchAnalysis) return;

    const newMatch: MatchResult = {
      rank: currentMatches.length + 1,
      maleId: selectedMale.id,
      femaleId: selectedFemale.id,
      maleName: selectedMale.name,
      femaleName: selectedFemale.name,
      maleAge: selectedMale.age,
      femaleAge: selectedFemale.age,
      maleOccupation: selectedMale.occupation,
      femaleOccupation: selectedFemale.occupation,
      maleLocation: selectedMale.location,
      femaleLocation: selectedFemale.location,
      malePhoto: selectedMale.photo,
      femalePhoto: selectedFemale.photo,
      maleSmoking: selectedMale.smoking,
      femaleSmoking: selectedFemale.smoking,
      maleHobbies: matchAnalysis.mHobbies,
      femaleHobbies: matchAnalysis.fHobbies,
      score: matchAnalysis.overallScore,
      whyTheyMatch: matchAnalysis.whyTheyMatch,
      potentialChallenges: matchAnalysis.potentialChallenges,
      recommendedActivities: matchAnalysis.icebreakers,
      createdAt: new Date().toISOString(),
    };

    onAssignOfficialMatch(newMatch);
    setIsSavedSuccessfully(true);
    setTimeout(() => setIsSavedSuccessfully(false), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-2xl">handshake</span>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-on-surface">
              {t('manualMatchmakerTitle', 'Meja Kerja Padanan Manual Berbantu AI')}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-outline">
            Pilih mana-mana calon lelaki dan wanita untuk menganalisis keserasian secara langsung dan tetapkan sebagai pasangan rasmi penganjur.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onBackToDirectory}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high transition-all border border-outline-variant/20 flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Kembali</span>
          </button>
        </div>
      </div>

      {/* Main Split-Screen Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: MALE CANDIDATE (5 cols) */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <h3 className="font-serif font-bold text-sm sm:text-base text-on-surface">
                Calon Lelaki (Brother)
              </h3>
            </div>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
              {males.length} calon
            </span>
          </div>

          {/* Search / Select Dropdown */}
          <div className="space-y-2">
            <input
              type="text"
              value={maleSearch}
              onChange={e => setMaleSearch(e.target.value)}
              placeholder="Cari nama, kerjaya, lokasi..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container border border-outline-variant/30 focus:border-blue-500 focus:outline-none"
            />
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-outline-variant/20 rounded-xl p-1 bg-surface-container-low">
              {filteredMales.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMaleId(m.id)}
                  className={`w-full p-2 rounded-lg text-left text-xs transition-all flex items-center gap-2 cursor-pointer ${
                    m.id === selectedMaleId
                      ? 'bg-blue-500 text-white font-bold shadow-xs'
                      : 'hover:bg-surface-container text-on-surface'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-white/20 shrink-0">
                    {m.photo ? (
                      <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-[10px]">
                        {m.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="truncate flex-1">
                    <p className="truncate font-semibold">{m.name} ({m.age})</p>
                    <p className="text-[10px] opacity-80 truncate">{m.occupation} • {m.location}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Male Candidate Profile Spotlight */}
          {selectedMale ? (
            <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/20 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface-container-high shrink-0 border border-outline-variant/30 shadow-xs">
                  {selectedMale.photo ? (
                    <img src={selectedMale.photo} alt={selectedMale.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-blue-500">
                      {selectedMale.name[0]}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-serif font-bold text-base text-on-surface truncate">{selectedMale.name}</h4>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{selectedMale.occupation}</p>
                  <p className="text-xs text-outline">{selectedMale.age} tahun • {selectedMale.location}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-surface-container">
                  <span className="text-[10px] text-outline block">Status Perkahwinan</span>
                  <span className="font-bold text-on-surface">{selectedMale.marital}</span>
                </div>
                <div className="p-2 rounded-lg bg-surface-container">
                  <span className="text-[10px] text-outline block">Amalan Merokok</span>
                  <span className={`font-bold ${selectedMale.smoking === 'Smoker' ? 'text-rose-500' : 'text-emerald-600'}`}>
                    {selectedMale.smoking}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-outline block mb-1">Hobi & Kegemaran:</span>
                <p className="text-xs text-on-surface bg-surface-container p-2 rounded-lg leading-relaxed">
                  {Array.isArray(selectedMale.hobbies) ? selectedMale.hobbies.join(' • ') : selectedMale.hobbies}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-outline block mb-1">Kriteria Pasangan Idaman:</span>
                <p className="text-xs text-on-surface italic bg-surface-container p-2 rounded-lg leading-relaxed border-l-2 border-blue-500">
                  "{selectedMale.ideal}"
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-outline text-center py-6">Sila pilih calon lelaki di atas</p>
          )}
        </div>

        {/* MIDDLE COLUMN: LIVE AI COMPATIBILITY MATRIX (4 cols) */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="text-center border-b border-outline-variant/20 pb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-1.5">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span>Live AI Match Analyzer</span>
            </span>
            <h3 className="font-serif font-bold text-base sm:text-lg text-on-surface">
              Analisis Keserasian Semasa
            </h3>
          </div>

          {matchAnalysis ? (
            <div className="space-y-4">
              {/* Big Score Gauge */}
              <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/5 to-surface-container-low border border-primary/20 shadow-inner">
                <span className="text-4xl sm:text-5xl font-serif font-bold bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
                  {matchAnalysis.overallScore}%
                </span>
                <p className="text-xs font-bold text-on-surface uppercase tracking-wider mt-1">
                  {matchAnalysis.overallScore >= 85
                    ? '🌟 Keserasian Sangat Tinggi (Sangat Disyorkan)'
                    : matchAnalysis.overallScore >= 70
                    ? '✨ Keserasian Baik (Potensi Positif)'
                    : '⚖️ Keserasian Sederhana (Perlu Perbincangan Lanjut)'}
                </p>
              </div>

              {/* Dimensional Progress Breakdown */}
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span>Nilai & Prinsip Hidup</span>
                    <span className="font-bold text-primary">{matchAnalysis.valuesScore}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${matchAnalysis.valuesScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span>Keserasian Umur & Fasa Hidup</span>
                    <span className="font-bold text-blue-500">{matchAnalysis.ageScore}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${matchAnalysis.ageScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span>Kedekatan Geografi & Logistik</span>
                    <span className="font-bold text-emerald-500">{matchAnalysis.locScore}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${matchAnalysis.locScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span>Status Merokok & Syarat Utama</span>
                    <span className={`font-bold ${matchAnalysis.smokeScore < 60 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {matchAnalysis.smokeScore}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                    <div className={`h-full rounded-full ${matchAnalysis.smokeScore < 60 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${matchAnalysis.smokeScore}%` }} />
                  </div>
                </div>
              </div>

              {/* AI Matchmaker Narrative */}
              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 text-xs space-y-2">
                <div>
                  <span className="font-bold text-on-surface flex items-center gap-1 text-[11px] uppercase tracking-wider text-primary">
                    <span className="material-symbols-outlined text-sm">stars</span>
                    <span>Ulasan Keserasian AI:</span>
                  </span>
                  <p className="text-outline text-xs mt-1 leading-relaxed">
                    {matchAnalysis.whyTheyMatch}
                  </p>
                </div>

                <div className="pt-2 border-t border-outline-variant/20">
                  <span className="font-bold text-on-surface flex items-center gap-1 text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    <span className="material-symbols-outlined text-sm">info</span>
                    <span>Perkara Perlu Diperhatikan:</span>
                  </span>
                  <p className="text-outline text-xs mt-1 leading-relaxed">
                    {matchAnalysis.potentialChallenges}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleAssignAsOfficial}
                  className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-primary to-primary-container hover:from-primary/95 hover:to-primary-container/95 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-lg">verified</span>
                  <span>Tetapkan Sebagai Pasangan Rasmi</span>
                </button>

                {isSavedSuccessfully && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold text-center animate-fade-in flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span>Pasangan berjaya didaftarkan ke senarai rasmi!</span>
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (selectedMale && selectedFemale && matchAnalysis) {
                      onOpenWhatsAppDispatch({
                        rank: 1,
                        maleId: selectedMale.id,
                        femaleId: selectedFemale.id,
                        maleName: selectedMale.name,
                        femaleName: selectedFemale.name,
                        maleAge: selectedMale.age,
                        femaleAge: selectedFemale.age,
                        maleOccupation: selectedMale.occupation,
                        femaleOccupation: selectedFemale.occupation,
                        maleLocation: selectedMale.location,
                        femaleLocation: selectedFemale.location,
                        maleSmoking: selectedMale.smoking,
                        femaleSmoking: selectedFemale.smoking,
                        maleHobbies: matchAnalysis.mHobbies,
                        femaleHobbies: matchAnalysis.fHobbies,
                        score: matchAnalysis.overallScore,
                        whyTheyMatch: matchAnalysis.whyTheyMatch,
                        potentialChallenges: matchAnalysis.potentialChallenges,
                        recommendedActivities: matchAnalysis.icebreakers,
                      });
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base text-emerald-600">chat</span>
                  <span>Hantar Notifikasi WhatsApp Pasangan</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-outline text-center py-10">Pilih kedua-dua calon untuk melihat analisis</p>
          )}
        </div>

        {/* RIGHT COLUMN: FEMALE CANDIDATE (4 cols) */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-pink-500" />
              <h3 className="font-serif font-bold text-sm sm:text-base text-on-surface">
                Calon Wanita (Sister)
              </h3>
            </div>
            <span className="text-[11px] font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 px-2 py-0.5 rounded-full">
              {females.length} calon
            </span>
          </div>

          {/* Search / Select Dropdown */}
          <div className="space-y-2">
            <input
              type="text"
              value={femaleSearch}
              onChange={e => setFemaleSearch(e.target.value)}
              placeholder="Cari nama, kerjaya, lokasi..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container border border-outline-variant/30 focus:border-pink-500 focus:outline-none"
            />
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-outline-variant/20 rounded-xl p-1 bg-surface-container-low">
              {filteredFemales.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFemaleId(f.id)}
                  className={`w-full p-2 rounded-lg text-left text-xs transition-all flex items-center gap-2 cursor-pointer ${
                    f.id === selectedFemaleId
                      ? 'bg-pink-500 text-white font-bold shadow-xs'
                      : 'hover:bg-surface-container text-on-surface'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-white/20 shrink-0">
                    {f.photo ? (
                      <img src={f.photo} alt={f.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-[10px]">
                        {f.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="truncate flex-1">
                    <p className="truncate font-semibold">{f.name} ({f.age})</p>
                    <p className="text-[10px] opacity-80 truncate">{f.occupation} • {f.location}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Female Candidate Profile Spotlight */}
          {selectedFemale ? (
            <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/20 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface-container-high shrink-0 border border-outline-variant/30 shadow-xs">
                  {selectedFemale.photo ? (
                    <img src={selectedFemale.photo} alt={selectedFemale.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-pink-500">
                      {selectedFemale.name[0]}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-serif font-bold text-base text-on-surface truncate">{selectedFemale.name}</h4>
                  <p className="text-xs text-pink-600 dark:text-pink-400 font-semibold">{selectedFemale.occupation}</p>
                  <p className="text-xs text-outline">{selectedFemale.age} tahun • {selectedFemale.location}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-surface-container">
                  <span className="text-[10px] text-outline block">Status Perkahwinan</span>
                  <span className="font-bold text-on-surface">{selectedFemale.marital}</span>
                </div>
                <div className="p-2 rounded-lg bg-surface-container">
                  <span className="text-[10px] text-outline block">Amalan Merokok</span>
                  <span className={`font-bold ${selectedFemale.smoking === 'Smoker' ? 'text-rose-500' : 'text-emerald-600'}`}>
                    {selectedFemale.smoking}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-outline block mb-1">Hobi & Kegemaran:</span>
                <p className="text-xs text-on-surface bg-surface-container p-2 rounded-lg leading-relaxed">
                  {Array.isArray(selectedFemale.hobbies) ? selectedFemale.hobbies.join(' • ') : selectedFemale.hobbies}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-outline block mb-1">Kriteria Pasangan Idaman:</span>
                <p className="text-xs text-on-surface italic bg-surface-container p-2 rounded-lg leading-relaxed border-l-2 border-pink-500">
                  "{selectedFemale.ideal}"
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-outline text-center py-6">Sila pilih calon wanita di atas</p>
          )}
        </div>
      </div>
    </div>
  );
};
