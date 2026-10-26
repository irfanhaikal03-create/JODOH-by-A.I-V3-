import React, { useState, useMemo } from 'react';
import { Participant, MatchResult, ValuesQuizAnswers } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { ValuesQuizModal, calculateArchetype } from './ValuesQuizModal';

interface ParticipantGlimpseViewProps {
  participants: Participant[];
  currentUserParticipantId?: string;
  onEditMyProfile: () => void;
  matches: MatchResult[];
  matchesPublished: boolean;
  onViewMatches: () => void;
  onOpenSavedSessions?: () => void;
  savedSessionsCount?: number;
  onOpenConcierge?: () => void;
  onSaveQuizResult?: (participantId: string, archetype: string, answers: ValuesQuizAnswers) => void;
}

export const ParticipantGlimpseView: React.FC<ParticipantGlimpseViewProps> = ({
  participants,
  currentUserParticipantId,
  onEditMyProfile,
  matches,
  matchesPublished,
  onViewMatches,
  onOpenSavedSessions,
  savedSessionsCount = 0,
  onOpenConcierge,
  onSaveQuizResult,
}) => {
  const { t, translateGender, translateMarital, translateSmoking } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

  const maleCount = useMemo(() => participants.filter(p => p.gender === 'Male').length, [participants]);
  const femaleCount = useMemo(() => participants.filter(p => p.gender === 'Female').length, [participants]);

  // Current participant profile
  const myProfile = useMemo(() => {
    return participants.find(p => p.id === currentUserParticipantId) || null;
  }, [participants, currentUserParticipantId]);

  // Check if current participant is matched in any generated match
  const myMatch = useMemo(() => {
    if (!myProfile || !matchesPublished || matches.length === 0) return null;
    const nameLower = myProfile.name.toLowerCase();
    return matches.find(
      m =>
        m.maleName.toLowerCase().includes(nameLower) ||
        nameLower.includes(m.maleName.toLowerCase()) ||
        m.femaleName.toLowerCase().includes(nameLower) ||
        nameLower.includes(m.femaleName.toLowerCase()) ||
        (m.maleId && m.maleId === myProfile.id) ||
        (m.femaleId && m.femaleId === myProfile.id)
    );
  }, [myProfile, matches, matchesPublished]);

  // Compute matched partner profile from directory
  const partnerProfile = useMemo(() => {
    if (!myMatch || !myProfile) return null;
    const isMale = myProfile.gender === 'Male';
    const partnerId = isMale ? myMatch.femaleId : myMatch.maleId;
    const partnerName = (isMale ? myMatch.femaleName : myMatch.maleName).toLowerCase();
    return (
      participants.find(
        p => (p.id && p.id === partnerId) || (p.name && p.name.toLowerCase() === partnerName)
      ) || null
    );
  }, [myMatch, myProfile, participants]);

  // Compute shared values alignment score
  const valuesMatchScore = useMemo(() => {
    if (!myProfile?.valuesAnswers || !partnerProfile?.valuesAnswers) return null;
    const keys: (keyof ValuesQuizAnswers)[] = ['finance', 'conflict', 'career', 'living', 'lifestyle', 'roles'];
    let shared = 0;
    keys.forEach(k => {
      if (
        myProfile.valuesAnswers &&
        partnerProfile.valuesAnswers &&
        myProfile.valuesAnswers[k] &&
        myProfile.valuesAnswers[k] === partnerProfile.valuesAnswers[k]
      ) {
        shared++;
      }
    });
    return {
      percentage: Math.round((shared / keys.length) * 100),
      sharedCount: shared,
      totalCount: keys.length,
    };
  }, [myProfile, partnerProfile]);

  // Unique locations for filter
  const locations = useMemo(() => {
    const set = new Set<string>();
    participants.forEach(p => {
      if (p.location) set.add(p.location);
    });
    return Array.from(set);
  }, [participants]);

  // Filtered other participants
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      // Exclude self if present in roster to avoid redundancy with top banner
      // But allow seeing self if desired
      if (genderFilter !== 'ALL' && p.gender.toUpperCase() !== genderFilter) return false;
      if (locationFilter !== 'ALL' && p.location !== locationFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const hobbiesStr = Array.isArray(p.hobbies) ? p.hobbies.join(' ') : p.hobbies || '';
        const haystack = `${p.name} ${p.occupation} ${p.location} ${hobbiesStr} ${p.ideal}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [participants, genderFilter, locationFilter, searchQuery]);

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* MATCHING STATUS BANNER */}
      {matchesPublished && matches.length > 0 ? (
        <div className="bg-stone-900 text-white p-5 sm:p-6 rounded-2xl shadow-xl border border-[#b48246]/40 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-2 text-[#b48246] border border-[#b48246]/30">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                <span>{t('matchingResultsPublished', 'Keputusan Pemadanan Telah Diterbitkan!')}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                {t('aiGeneratedMatches', 'Algoritma AI Telah Menjana Top')} {matches.length} {t('topMatchesTitle', 'Padanan')}
              </h2>
              <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-2xl">
                {myMatch
                  ? `${t('congratsMatchFound', 'Tahniah! Anda telah tersenarai dalam')} ${t('matchRank', 'Padanan ')}${myMatch.rank} (${myMatch.score}%)`
                  : t('notPublishedDesc', 'Pihak penganjur telah memuktamadkan senarai pasangan serasi bagi kohort acara ini.')}
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {onOpenConcierge && myMatch && (
                <button
                  type="button"
                  onClick={onOpenConcierge}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-xs hover:bg-white/20 transition-all cursor-pointer border border-white/20 active:scale-95 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-base text-[#b48246]">psychology</span>
                  <span>{t('askAiConcierge', 'Tanya AI Concierge')}</span>
                </button>
              )}
              {onOpenSavedSessions && (
                <button
                  type="button"
                  onClick={onOpenSavedSessions}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-xs hover:bg-white/20 transition-all cursor-pointer border border-white/20"
                >
                  <span className="material-symbols-outlined text-base">history</span>
                  <span>{t('savedSessions', 'Sejarah Rekod')} ({savedSessionsCount})</span>
                </button>
              )}
              <button
                type="button"
                onClick={onViewMatches}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-stone-900 font-bold text-xs sm:text-sm shadow-md hover:bg-stone-100 transition-all shrink-0 cursor-pointer active:scale-95 border border-stone-200"
              >
                <span className="material-symbols-outlined text-base text-[#b48246]">favorite</span>
                <span>{t('viewMatchDetails', 'Lihat Keputusan Pemadanan')}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#fbf6ee] text-[#7c5820] border border-[#b48246]/25 flex items-center justify-center shrink-0 shadow-2xs">
              <span className="material-symbols-outlined text-2xl text-[#b48246]">hourglass_top</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#fbf6ee] text-[#7c5820] text-[11px] font-bold border border-[#b48246]/25">
                  {t('organizerWaitingTitle', 'Menunggu Tindakan Penganjur')}
                </span>
                <span className="text-xs text-stone-400 font-medium">
                  {maleCount} {t('male', 'Lelaki')} • {femaleCount} {t('female', 'Perempuan')}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900 mt-1 font-serif">
                {t('organizerWaitingTitle', 'Sesi Pendaftaran Calon Sedang Berlangsung')}
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-2xl mt-0.5">
                {t('organizerWaitingDesc', 'Pemadanan AI hanya boleh dijalankan oleh Administrator. Anda boleh melengkapkan profil peribadi dan melihat sekali imbas peserta-peserta lain di bawah.')}
              </p>
            </div>
          </div>

          {onOpenSavedSessions && savedSessionsCount > 0 && (
            <button
              type="button"
              onClick={onOpenSavedSessions}
              className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 self-start sm:self-center border border-stone-200/80"
            >
              <span className="material-symbols-outlined text-base text-[#b48246]">history</span>
              <span>{t('savedSessions', 'Rekod Sejarah Rasmi')} ({savedSessionsCount})</span>
            </button>
          )}
        </div>
      )}

      {/* MY PROFILE SPOTLIGHT CARD (If participant has a profile) */}
      {myProfile ? (
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-stone-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div className="flex items-center gap-3.5">
              {myProfile.photo ? (
                <img
                  src={myProfile.photo}
                  alt={myProfile.name}
                  className="w-14 h-14 rounded-2xl object-cover ring-1 ring-stone-200 shadow-2xs"
                  onError={e => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                    const sibling = e.currentTarget.parentElement?.querySelector('.my-monogram-fallback') as HTMLElement;
                    if (sibling) sibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={`my-monogram-fallback w-14 h-14 rounded-2xl bg-stone-100 text-stone-800 border border-stone-200 font-bold text-lg flex items-center justify-center shadow-2xs ${
                  myProfile.photo ? 'hidden' : ''
                }`}
              >
                {(myProfile.name || 'P').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold text-[#b48246] tracking-wider">
                    {t('myProfileSpotlight', 'Profil Peserta Saya')}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs text-emerald-800 font-semibold">{t('eligibleForMatching', 'Aktif dalam Kohort')}</span>
                </div>
                <h2 className="text-xl font-serif font-bold text-stone-900">
                  {myProfile.name || 'Peserta'}{myProfile.age && myProfile.age > 0 ? `, ${myProfile.age}` : ''}
                </h2>
                <p className="text-xs text-stone-500">
                  {myProfile.occupation || 'Pekerjaan belum dinyatakan'} • {myProfile.location || 'Lokasi belum dinyatakan'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onEditMyProfile}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-all shadow-2xs border border-stone-200/80 cursor-pointer self-start sm:self-center active:scale-95"
            >
              <span className="material-symbols-outlined text-base text-[#b48246]">edit</span>
              <span>{t('editProfile', 'Kemaskini Profil Saya')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-4 text-xs">
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-100">
              <span className="text-stone-400 uppercase font-bold text-[10px] block mb-1">{t('marital', 'Status')} & {t('smoking', 'Tabiat')}</span>
              <p className="font-semibold text-stone-800">
                {translateMarital(myProfile.marital)} • {translateSmoking(myProfile.smoking)}
              </p>
            </div>
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-100">
              <span className="text-stone-400 uppercase font-bold text-[10px] block mb-1">{t('hobbies', 'Hobi & Minat')}</span>
              <p className="font-semibold text-stone-800 truncate">
                {Array.isArray(myProfile.hobbies) && myProfile.hobbies.length > 0 ? myProfile.hobbies.join(', ') : (myProfile.hobbies || 'Belum dinyatakan')}
              </p>
            </div>
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-100">
              <span className="text-stone-400 uppercase font-bold text-[10px] block mb-1">{t('myIdealCriteria', 'Ciri Pasangan Idaman')}</span>
              <p className="font-semibold text-stone-800 truncate">
                {myProfile.ideal ? `"${myProfile.ideal}"` : 'Belum dinyatakan'}
              </p>
            </div>
          </div>

          {/* VALUES & PERSONALITY COMPATIBILITY QUIZ BANNER */}
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-[#fcf9f2] to-[#f6efe4] border border-[#b48246]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white text-[#b48246] border border-[#b48246]/30 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                <span className="material-symbols-outlined text-xl">psychology</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c5820]">
                    Kuiz Nilai Hidup & Arketaip
                  </span>
                  {myProfile.valuesArchetype ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Kuiz Selesai
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      Disyorkan
                    </span>
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-serif font-bold text-stone-900">
                  {myProfile.valuesArchetype ? myProfile.valuesArchetype : 'Ketahui Arketaip Nilai Perkahwinan Anda'}
                </h3>
                <p className="text-xs text-stone-600">
                  {myProfile.valuesArchetype
                    ? 'Berdasarkan 6 dimensi teras (kewangan, konflik, kerjaya, kediaman, gaya hidup, dan tugas domestik).'
                    : 'Jawab 6 soalan senario pantas untuk membolehkan sistem mengira keserasian nilai teras bersama pasangan.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsQuizModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0 border border-stone-900"
            >
              <span className="material-symbols-outlined text-base text-[#d4af37]">quiz</span>
              <span>{myProfile.valuesArchetype ? 'Semak / Ulangi Kuiz' : 'Mula Kuiz (6 Soalan)'}</span>
            </button>
          </div>

          {/* OFFICIAL PARTNER SPOTLIGHT BOX */}
          {myMatch && (
            <div className="mt-4 p-4 rounded-xl bg-[#fbf6ee] border border-[#b48246]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white text-[#b48246] border border-[#b48246]/30 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                  💍
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-[#7c5820] tracking-wider">
                      {t('matchedWith', 'Pasangan Rasmi Anda')} • {t('matchRank', 'Padanan ')}{myMatch.rank}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-[#7c5820] border border-[#b48246]/30 text-[10px] font-bold tabular-nums">
                      {myMatch.score}% {t('compatibilityScore', 'Keserasian')}
                    </span>
                  </div>
                  <h3 className="text-base font-serif font-bold text-stone-900">
                    {myProfile.gender === 'Male' ? myMatch.femaleName : myMatch.maleName}
                  </h3>
                  <p className="text-xs text-stone-600">
                    {myProfile.gender === 'Male' ? myMatch.femaleOccupation : myMatch.maleOccupation} • {myProfile.gender === 'Male' ? myMatch.femaleLocation : myMatch.maleLocation}
                  </p>

                  {/* Shared values alignment */}
                  {valuesMatchScore ? (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-[#f2e7d3] text-[#7c5820] font-bold">
                        {valuesMatchScore.percentage}% Keserasian Nilai Teras
                      </span>
                      <span className="text-stone-600 text-[11px]">
                        ({valuesMatchScore.sharedCount} daripada {valuesMatchScore.totalCount} dimensi nilai sepadan)
                      </span>
                    </div>
                  ) : partnerProfile?.valuesArchetype ? (
                    <div className="mt-2 flex items-center gap-2 text-xs text-stone-600">
                      <span className="text-[11px]">Arketaip Pasangan: <strong>{partnerProfile.valuesArchetype}</strong></span>
                    </div>
                  ) : null}
                </div>
              </div>

              {onOpenConcierge && (
                <button
                  type="button"
                  onClick={onOpenConcierge}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs shadow-xs hover:bg-stone-800 transition-all cursor-pointer shrink-0 active:scale-95 border border-stone-900"
                >
                  <span className="material-symbols-outlined text-base text-[#b48246]">psychology</span>
                  <span>{t('askAiConcierge', 'Tanya AI Dating Advisor')}</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-[#b48246] border border-[#b48246]/30 flex items-center justify-center font-bold text-2xl shadow-2xs shrink-0">
              <span className="material-symbols-outlined text-2xl">person_add</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-[#b48246] tracking-wider">
                  {t('myProfileSpotlight', 'Profil Peserta Saya')}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  Belum Diisi
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900">
                Lengkapkan Profil Suai Kenal Anda
              </h2>
              <p className="text-xs text-stone-500">
                Isi maklumat diri, minat, dan kriteria pasangan idaman anda untuk memudahkan pemadanan algoritma AI.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onEditMyProfile}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-base text-[#b48246]">edit_note</span>
            <span>Isi Profil Saya Sekarang</span>
          </button>
        </div>
      )}

      {/* ATTENDEE GLIMPSE DIRECTORY HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#b48246]">
              {t('participantsPool', 'Direktori Peserta')}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-300"></span>
            <span className="text-xs text-stone-500 font-medium">{t('glimpseCandidatesTitle', 'Sekali Imbas')}</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-stone-900 mt-0.5">
            {t('participantsPool', 'Peserta-Peserta Acara')} ({filteredParticipants.length})
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            {t('glimpseCandidatesDesc', 'Lihat serba sedikit latar belakang calon lain yang turut menyertai acara suai kenal ini.')}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Gender Filter */}
          <div className="inline-flex p-1 bg-stone-100 rounded-xl border border-stone-200/60 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setGenderFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                genderFilter === 'ALL'
                  ? 'bg-stone-900 text-white shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {t('filterAll', 'Semua')} ({participants.length})
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('MALE')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                genderFilter === 'MALE'
                  ? 'bg-stone-900 text-white shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {t('male', 'Lelaki')} ({maleCount})
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('FEMALE')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                genderFilter === 'FEMALE'
                  ? 'bg-stone-900 text-white shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {t('female', 'Perempuan')} ({femaleCount})
            </button>
          </div>

          {/* Location dropdown */}
          {locations.length > 1 && (
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#b48246]/20 transition-all cursor-pointer"
            >
              <option value="ALL">{t('filterAll', 'Semua Lokasi')}</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-lg pointer-events-none">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Cari mengikut nama, bidang kerjaya, minat, atau negeri..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-stone-200/80 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#b48246]/20 focus:border-[#b48246]/50 shadow-2xs transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-800 text-sm cursor-pointer p-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* PARTICIPANT CARDS GRID */}
      {filteredParticipants.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200/80 p-8 shadow-xs">
          <span className="material-symbols-outlined text-4xl text-stone-400 mb-2">person_search</span>
          <h4 className="text-base font-bold text-stone-900 font-serif">Tiada peserta ditemui</h4>
          <p className="text-xs text-stone-500 mt-1">
            Cuba ubah atau padamkan tapisan carian anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredParticipants.map(part => {
            const isSelf = myProfile && part.id === myProfile.id;
            const isMale = part.gender === 'Male';
            const hobbiesList = Array.isArray(part.hobbies)
              ? part.hobbies
              : part.hobbies
              ? part.hobbies.split(',').map(s => s.trim()).filter(Boolean)
              : [];

            return (
              <div
                key={part.id}
                className={`bg-white rounded-2xl p-5 shadow-xs hover:shadow-md transition-all border flex flex-col justify-between ${
                  isSelf ? 'border-[#b48246] ring-1 ring-[#b48246]/40' : 'border-stone-200/80 hover:border-[#b48246]/40'
                }`}
              >
                <div>
                  {/* Top Row: Avatar & Badges */}
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-3">
                      {part.photo ? (
                        <img
                          src={part.photo}
                          alt={part.name}
                          className="w-12 h-12 rounded-xl object-cover shadow-2xs ring-1 ring-stone-200"
                          onError={e => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const sibling = e.currentTarget.parentElement?.querySelector('.monogram-fallback') as HTMLElement;
                            if (sibling) sibling.style.display = 'flex';
                          }}
                        />
                      ) : null}

                      <div
                        className={`monogram-fallback w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm tracking-wider shadow-2xs ${
                          isMale ? 'bg-slate-100 text-slate-800 border border-slate-200' : 'bg-amber-50 text-[#7c5820] border border-amber-200'
                        } ${part.photo ? 'hidden' : ''}`}
                      >
                        {part.name.slice(0, 2).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-base text-stone-900 leading-snug font-serif">
                            {part.name}
                          </h4>
                          <span className="text-xs text-stone-400 font-normal">, {part.age}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              isMale ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#fbf6ee] text-[#7c5820] border-[#b48246]/25'
                            }`}
                          >
                            {translateGender(part.gender)}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-medium border border-stone-200/60">
                            {translateMarital(part.marital)}
                          </span>
                          {isSelf && (
                            <span className="px-2 py-0.5 rounded-full bg-stone-900 text-white text-[10px] font-bold">
                              Anda
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Occupation & Location */}
                  <div className="bg-stone-50 rounded-xl p-2.5 mb-3 space-y-1 text-xs border border-stone-100">
                    <div className="flex items-center gap-1.5 text-stone-900 font-semibold">
                      <span className="material-symbols-outlined text-sm text-[#b48246]">work</span>
                      <span className="truncate">{part.occupation}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-500">
                      <span className="material-symbols-outlined text-sm text-stone-400">location_on</span>
                      <span>{part.location}, Malaysia</span>
                    </div>
                  </div>

                  {/* Hobbies */}
                  {hobbiesList.length > 0 && (
                    <div className="mb-3">
                      <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1">
                        Minat & Aktiviti
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {hobbiesList.slice(0, 3).map((h, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[11px] border border-stone-200/50"
                          >
                            {h}
                          </span>
                        ))}
                        {hobbiesList.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] text-stone-400 font-medium">
                            +{hobbiesList.length - 3} lagi
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Values Archetype Tag */}
                  {part.valuesArchetype && (
                    <div className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#f8f4ec] border border-[#b48246]/25 text-[11px] text-[#7c5820] font-semibold">
                      <span className="material-symbols-outlined text-sm text-[#b48246]">psychology</span>
                      <span className="truncate">{part.valuesArchetype}</span>
                    </div>
                  )}
                </div>

                {isSelf && (
                  <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setIsQuizModalOpen(true)}
                      className="text-xs text-[#8f6430] hover:text-[#6a481c] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm text-[#b48246]">quiz</span>
                      <span>{part.valuesArchetype ? 'Kuiz Nilai' : 'Ambil Kuiz Nilai'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onEditMyProfile}
                      className="text-xs text-[#b48246] hover:text-[#8f6430] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      <span>Sunting Maklumat</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VALUES QUIZ MODAL */}
      {isQuizModalOpen && myProfile && (
        <ValuesQuizModal
          participant={myProfile}
          isOpen={isQuizModalOpen}
          onClose={() => setIsQuizModalOpen(false)}
          onSaveQuizResult={(archetype, answers) => {
            if (onSaveQuizResult) {
              onSaveQuizResult(myProfile.id, archetype, answers);
            }
          }}
        />
      )}
    </div>
  );
};
