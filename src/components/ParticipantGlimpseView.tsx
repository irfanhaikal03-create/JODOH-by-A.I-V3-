import React, { useState, useMemo } from 'react';
import { Participant, MatchResult } from '../types';
import { useLanguage } from '../context/LanguageContext';

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
}) => {
  const { t, translateGender, translateMarital, translateSmoking } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');

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
        <div className="bg-gradient-to-r from-primary-container via-primary to-primary-container text-on-primary p-5 sm:p-6 rounded-2xl shadow-lg border border-primary-fixed/20 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                <span>Keputusan Pemadanan Telah Diterbitkan!</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                Algoritma AI Telah Selesai Menjana Top {matches.length} Padanan
              </h2>
              <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-2xl">
                {myMatch
                  ? `Tahniah! Anda telah tersenarai dalam Padanan #${myMatch.rank} dengan skor keserasian ${myMatch.score}%!`
                  : 'Pihak penganjur telah memuktamadkan senarai pasangan serasi bagi kohort acara ini.'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {onOpenConcierge && myMatch && (
                <button
                  type="button"
                  onClick={onOpenConcierge}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-white/20 text-white font-bold text-xs hover:bg-white/30 transition-all cursor-pointer backdrop-blur-xs border border-white/30 active:scale-95 shadow-sm"
                >
                  <span className="material-symbols-outlined text-base">psychology</span>
                  <span>Tanya AI Concierge Pasangan</span>
                </button>
              )}
              {onOpenSavedSessions && (
                <button
                  type="button"
                  onClick={onOpenSavedSessions}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-white/20 text-white font-bold text-xs hover:bg-white/30 transition-all cursor-pointer backdrop-blur-xs"
                >
                  <span className="material-symbols-outlined text-base">history</span>
                  <span>Sejarah Rekod ({savedSessionsCount})</span>
                </button>
              )}
              <button
                type="button"
                onClick={onViewMatches}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-primary font-bold text-sm shadow-md hover:bg-surface-container-lowest transition-all shrink-0 cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">favorite</span>
                <span>Lihat Keputusan Pemadanan</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-2xl">hourglass_top</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 text-[11px] font-bold border border-amber-500/20">
                  Menunggu Tindakan Penganjur
                </span>
                <span className="text-xs text-outline font-medium">
                  {maleCount} Lelaki • {femaleCount} Perempuan berdaftar
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-on-surface mt-1 font-serif">
                Sesi Pendaftaran Peserta Sedang Berlangsung
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl mt-0.5">
                Pemadanan AI hanya boleh dijalankan oleh <strong>Administrator</strong>. Anda boleh melengkapkan profil peribadi dan melihat sekali imbas peserta-peserta lain di bawah sementara menunggu penganjur menerbitkan keputusan.
              </p>
            </div>
          </div>

          {onOpenSavedSessions && savedSessionsCount > 0 && (
            <button
              type="button"
              onClick={onOpenSavedSessions}
              className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 self-start sm:self-center shadow-2xs"
            >
              <span className="material-symbols-outlined text-base text-primary">history</span>
              <span>Rekod Sejarah Rasmi ({savedSessionsCount})</span>
            </button>
          )}
        </div>
      )}

      {/* MY PROFILE SPOTLIGHT CARD (If participant has a profile) */}
      {myProfile && (
        <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-sm border border-primary/20 bg-gradient-to-br from-surface-container-lowest to-primary/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/20">
            <div className="flex items-center gap-3.5">
              {myProfile.photo ? (
                <img
                  src={myProfile.photo}
                  alt={myProfile.name}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary/40 shadow-sm"
                  onError={e => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                    const sibling = e.currentTarget.parentElement?.querySelector('.my-monogram-fallback') as HTMLElement;
                    if (sibling) sibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={`my-monogram-fallback w-14 h-14 rounded-2xl bg-primary-container text-on-primary font-bold text-lg flex items-center justify-center shadow-sm ${
                  myProfile.photo ? 'hidden' : ''
                }`}
              >
                {myProfile.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold text-primary tracking-wider">
                    Profil Peserta Saya
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs text-emerald-700 font-semibold">Aktif dalam Kohort</span>
                </div>
                <h2 className="text-xl font-serif font-bold text-on-surface">
                  {myProfile.name}, {myProfile.age}
                </h2>
                <p className="text-xs text-on-surface-variant">
                  {myProfile.occupation} • {myProfile.location}, Malaysia
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onEditMyProfile}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition-all shadow-xs border border-outline-variant/30 cursor-pointer self-start sm:self-center"
            >
              <span className="material-symbols-outlined text-base text-primary">edit</span>
              <span>Kemaskini Profil Saya</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-4 text-xs text-on-surface-variant">
            <div className="bg-surface-container-low/70 p-3 rounded-xl">
              <span className="text-outline uppercase font-bold text-[10px] block mb-1">Status & Gaya Hidup</span>
              <p className="font-semibold text-on-surface">
                {myProfile.marital} • {myProfile.smoking}
              </p>
            </div>
            <div className="bg-surface-container-low/70 p-3 rounded-xl">
              <span className="text-outline uppercase font-bold text-[10px] block mb-1">Hobi & Minat</span>
              <p className="font-semibold text-on-surface truncate">
                {Array.isArray(myProfile.hobbies) ? myProfile.hobbies.join(', ') : myProfile.hobbies}
              </p>
            </div>
            <div className="bg-surface-container-low/70 p-3 rounded-xl">
              <span className="text-outline uppercase font-bold text-[10px] block mb-1">Ciri Pasangan Idaman</span>
              <p className="font-semibold text-on-surface truncate">
                "{myProfile.ideal}"
              </p>
            </div>
          </div>

          {/* OFFICIAL PARTNER SPOTLIGHT BOX */}
          {myMatch && (
            <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center text-xl shrink-0 shadow-xs ring-2 ring-primary/20">
                  💍
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                      Pasangan Rasmi Anda • Padanan #{myMatch.rank}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">
                      {myMatch.score}% Keserasian
                    </span>
                  </div>
                  <h3 className="text-base font-serif font-bold text-on-surface">
                    {myProfile.gender === 'Male' ? myMatch.femaleName : myMatch.maleName}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {myProfile.gender === 'Male' ? myMatch.femaleOccupation : myMatch.maleOccupation} • {myProfile.gender === 'Male' ? myMatch.femaleLocation : myMatch.maleLocation}
                  </p>
                </div>
              </div>

              {onOpenConcierge && (
                <button
                  type="button"
                  onClick={onOpenConcierge}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:bg-primary/90 transition-all cursor-pointer shrink-0 active:scale-95"
                >
                  <span className="material-symbols-outlined text-base">psychology</span>
                  <span>Tanya AI Dating Advisor (Recap & Dates)</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ATTENDEE GLIMPSE DIRECTORY HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Direktori Peserta
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
            <span className="text-xs text-on-surface-variant font-medium">Sekali Imbas (In a Glimpse)</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-on-surface mt-0.5">
            Peserta-Peserta Acara ({filteredParticipants.length})
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Lihat serba sedikit latar belakang calon lain yang turut menyertai acara suai kenal ini.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Gender Filter */}
          <div className="inline-flex p-1 bg-surface-container-low rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setGenderFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                genderFilter === 'ALL'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Semua ({participants.length})
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('MALE')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                genderFilter === 'MALE'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Lelaki ({maleCount})
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('FEMALE')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                genderFilter === 'FEMALE'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Perempuan ({femaleCount})
            </button>
          </div>

          {/* Location dropdown */}
          {locations.length > 1 && (
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-semibold text-on-surface"
            >
              <option value="ALL">Semua Lokasi</option>
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
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Cari mengikut nama, bidang kerjaya, minat, atau negeri..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface text-sm cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* PARTICIPANT CARDS GRID */}
      {filteredParticipants.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-8">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">person_search</span>
          <h4 className="text-base font-bold text-on-surface">Tiada peserta ditemui</h4>
          <p className="text-xs text-on-surface-variant mt-1">
            Cuba padamkan tapisan carian anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
                className={`bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all border flex flex-col justify-between ${
                  isSelf ? 'border-primary ring-1 ring-primary/30' : 'border-outline-variant/20'
                }`}
              >
                <div>
                  {/* Top Row: Avatar & Badges */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {part.photo ? (
                        <img
                          src={part.photo}
                          alt={part.name}
                          className="w-12 h-12 rounded-2xl object-cover shadow-xs ring-1 ring-outline-variant/20"
                          onError={e => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const sibling = e.currentTarget.parentElement?.querySelector('.monogram-fallback') as HTMLElement;
                            if (sibling) sibling.style.display = 'flex';
                          }}
                        />
                      ) : null}

                      <div
                        className={`monogram-fallback w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm tracking-wider shadow-xs ${
                          isMale ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-secondary-fixed text-secondary'
                        } ${part.photo ? 'hidden' : ''}`}
                      >
                        {part.name.slice(0, 2).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-base text-on-surface leading-snug font-serif">
                            {part.name}
                          </h4>
                          <span className="text-xs text-outline font-normal">, {part.age}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isMale ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-secondary-fixed text-secondary'
                            }`}
                          >
                            {translateGender(part.gender)}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[10px] font-semibold">
                            {translateMarital(part.marital)}
                          </span>
                          {isSelf && (
                            <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary text-[10px] font-bold">
                              Anda
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Occupation & Location */}
                  <div className="bg-surface-container-low/60 rounded-xl p-2.5 mb-3 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-on-surface font-semibold">
                      <span className="material-symbols-outlined text-sm text-outline">work</span>
                      <span className="truncate">{part.occupation}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm text-outline">location_on</span>
                      <span>{part.location}, Malaysia</span>
                    </div>
                  </div>

                  {/* Hobbies */}
                  {hobbiesList.length > 0 && (
                    <div className="mb-3">
                      <span className="text-[10px] uppercase font-bold text-outline tracking-wider block mb-1">
                        Minat & Aktiviti
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {hobbiesList.slice(0, 3).map((h, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[11px]"
                          >
                            {h}
                          </span>
                        ))}
                        {hobbiesList.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] text-outline font-semibold">
                            +{hobbiesList.length - 3} lagi
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ideal Partner snippet */}
                  {part.ideal && (
                    <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 text-[11px] text-on-surface-variant italic leading-relaxed">
                      "{part.ideal.length > 90 ? part.ideal.slice(0, 90) + '...' : part.ideal}"
                    </div>
                  )}
                </div>

                {isSelf && (
                  <div className="mt-3 pt-3 border-t border-outline-variant/20 flex justify-end">
                    <button
                      type="button"
                      onClick={onEditMyProfile}
                      className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      <span>Sunting Maklumat Saya</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
