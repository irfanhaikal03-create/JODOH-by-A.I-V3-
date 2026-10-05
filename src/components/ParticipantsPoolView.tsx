import React, { useState, useMemo } from 'react';
import { Participant } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ParticipantsPoolViewProps {
  participants: Participant[];
  onOpenAddModal: () => void;
  onEditParticipant: (participant: Participant) => void;
  onDeleteParticipant: (participant: Participant) => void;
  onGenerateMatches: () => void;
}

export const ParticipantsPoolView: React.FC<ParticipantsPoolViewProps> = ({
  participants,
  onOpenAddModal,
  onEditParticipant,
  onDeleteParticipant,
  onGenerateMatches,
}) => {
  const { t, translateGender, translateMarital, translateSmoking } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [maritalFilter, setMaritalFilter] = useState('ALL');
  const [smokingFilter, setSmokingFilter] = useState('ALL');

  const maleCount = useMemo(
    () => participants.filter(p => p.gender === 'Male').length,
    [participants]
  );
  const femaleCount = useMemo(
    () => participants.filter(p => p.gender === 'Female').length,
    [participants]
  );
  const totalCount = participants.length;
  const isEligible = maleCount >= 1 && femaleCount >= 1;

  const filteredCandidates = useMemo(() => {
    return participants.filter(p => {
      // Gender filter
      if (genderFilter !== 'ALL' && p.gender.toUpperCase() !== genderFilter) {
        return false;
      }
      // Marital status filter
      if (maritalFilter !== 'ALL' && p.marital !== maritalFilter) {
        return false;
      }
      // Smoking habit filter
      if (smokingFilter !== 'ALL' && p.smoking !== smokingFilter) {
        return false;
      }
      // Search query across name, occupation, location, hobbies, ideal
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const hobbiesStr = Array.isArray(p.hobbies)
          ? p.hobbies.join(' ')
          : (p.hobbies || '');
        const haystack = `${p.name} ${p.occupation} ${p.location} ${hobbiesStr} ${p.ideal}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [participants, genderFilter, maritalFilter, smokingFilter, searchQuery]);

  return (
    <div className="flex flex-col w-full font-sans">
      {/* Top Stat Metrics Section */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        {/* Total Participants */}
        <div className="bg-surface-container-lowest p-3 sm:p-5 rounded-2xl shadow-xs flex items-center justify-between transition-all hover:shadow-sm border border-outline-variant/15">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-xs text-outline uppercase tracking-wider font-bold truncate leading-tight">
              {t('totalCandidates', 'Jumlah Calon')}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-3xl font-bold text-on-surface font-serif leading-none">
                {totalCount}
              </span>
              <span className="text-[10px] sm:text-xs text-on-surface-variant truncate">
                {t('activeLanguage', 'Aktif')}
              </span>
            </div>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0 ml-1">
            <span className="material-symbols-outlined text-lg sm:text-2xl">group_work</span>
          </div>
        </div>

        {/* Male Candidates */}
        <div className="bg-surface-container-lowest p-3 sm:p-5 rounded-2xl shadow-xs flex items-center justify-between transition-all hover:shadow-sm border border-outline-variant/15">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-xs text-outline uppercase tracking-wider font-bold truncate leading-tight">
              {t('filterMale', 'Calon Lelaki')}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-3xl font-bold text-on-surface font-serif leading-none">
                {maleCount}
              </span>
              <span className="text-[10px] sm:text-xs text-on-surface-variant truncate">
                {t('male', 'Lelaki')}
              </span>
            </div>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-surface-container flex items-center justify-center text-tertiary shrink-0 ml-1">
            <span className="material-symbols-outlined text-lg sm:text-2xl">man</span>
          </div>
        </div>

        {/* Female Candidates */}
        <div className="bg-surface-container-lowest p-3 sm:p-5 rounded-2xl shadow-xs flex items-center justify-between transition-all hover:shadow-sm border border-outline-variant/15">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-xs text-outline uppercase tracking-wider font-bold truncate leading-tight">
              {t('filterFemale', 'Calon Wanita')}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-3xl font-bold text-on-surface font-serif leading-none">
                {femaleCount}
              </span>
              <span className="text-[10px] sm:text-xs text-on-surface-variant truncate">
                {t('female', 'Wanita')}
              </span>
            </div>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary shrink-0 ml-1">
            <span className="material-symbols-outlined text-lg sm:text-2xl">woman</span>
          </div>
        </div>

        {/* Match Eligibility Indicator */}
        <div className="bg-surface-container-lowest p-3 sm:p-5 rounded-2xl shadow-xs flex flex-col justify-between transition-all border border-outline-variant/15 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-outline uppercase tracking-wider font-bold">
              Status Quorum
            </span>
            {isEligible ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] sm:text-xs flex items-center gap-1 font-semibold border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                {t('eligibleForMatching', 'Sedia')}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[10px] sm:text-xs flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                {t('notEligible', 'Tidak Lengkap')}
              </span>
            )}
          </div>
          <div className="mt-1">
            <h4 className="text-xs sm:text-sm text-on-surface font-bold">
              {isEligible ? '1 Lelaki + 1 Wanita Dipenuhi' : 'Quorum Minimum Belum Tercapai'}
            </h4>
            <p className="text-[10px] sm:text-xs text-on-surface-variant mt-0.5 line-clamp-1 sm:line-clamp-none">
              {isEligible
                ? `Potensi 1-ke-1: ${Math.min(maleCount, femaleCount)} pasangan eksklusif`
                : 'Perlu sekurang-kurangnya 1 lelaki & 1 wanita'}
            </p>
          </div>
        </div>
      </section>

      {/* Editorial Section Bar & Primary Action Ribbon */}
      <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-2xl shadow-xs mb-4 sm:mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 border border-outline-variant/15">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs text-primary uppercase font-bold tracking-widest">
              Cohort Registry
            </span>
            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
            <span className="text-xs text-on-surface-variant font-medium">
              Manual Input Suite
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl text-on-surface tracking-tight mt-0.5 font-serif font-bold">
            {t('participantsPool', 'Direktori Calon Peserta')}
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Dossier maklumat peribadi profil calon untuk analisis keserasian algoritma pintar.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-xs sm:text-sm hover:bg-surface-container-highest transition-all shadow-2xs active:scale-95 cursor-pointer font-bold"
          >
            <span className="material-symbols-outlined text-primary text-xl">person_add</span>
            <span>+ {t('addCandidate', 'Tambah Calon')}</span>
          </button>

          <button
            type="button"
            disabled={!isEligible}
            onClick={onGenerateMatches}
            className={`relative group inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-xs transition-all cursor-pointer font-bold ${
              isEligible
                ? 'bg-primary text-on-primary hover:shadow-md hover:opacity-95 active:scale-95'
                : 'bg-surface-container text-outline cursor-not-allowed opacity-60'
            }`}
          >
            <span className="material-symbols-outlined text-lg">auto_awesome</span>
            <span>{t('generateMatches', 'Jana Padanan AI')}</span>
          </button>
        </div>
      </div>

      {/* Filtration & Search Shelf */}
      <div className="bg-surface-container-lowest p-3 sm:p-4 rounded-2xl shadow-xs mb-4 sm:mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border border-outline-variant/15">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder', 'Cari mengikut nama, profesion, lokasi atau hobi...')}
            className="w-full pl-10 pr-10 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Gender Segmented Filter */}
          <div className="flex items-center p-1 bg-surface-container-low rounded-xl text-on-surface-variant text-xs font-semibold">
            <button
              type="button"
              onClick={() => setGenderFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                genderFilter === 'ALL'
                  ? 'bg-primary text-on-primary shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t('filterAll', 'Semua')}
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('MALE')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                genderFilter === 'MALE'
                  ? 'bg-primary text-on-primary shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t('male', 'Lelaki')}
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('FEMALE')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                genderFilter === 'FEMALE'
                  ? 'bg-primary text-on-primary shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t('female', 'Wanita')}
            </button>
          </div>

          {/* Marital Status Filter */}
          <select
            value={maritalFilter}
            onChange={e => setMaritalFilter(e.target.value)}
            className="px-3 py-2 bg-surface-container-low text-on-surface text-xs font-medium rounded-xl focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer border border-outline-variant/30"
          >
            <option value="ALL">{t('marital', 'Status Perkahwinan')}: {t('filterAll', 'Semua')}</option>
            <option value="Single">{translateMarital('Single')}</option>
            <option value="Divorced">{translateMarital('Divorced')}</option>
            <option value="Widowed">{translateMarital('Widowed')}</option>
          </select>

          {/* Smoking Status Filter */}
          <select
            value={smokingFilter}
            onChange={e => setSmokingFilter(e.target.value)}
            className="px-3 py-2 bg-surface-container-low text-on-surface text-xs font-medium rounded-xl focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer border border-outline-variant/30"
          >
            <option value="ALL">{t('smoking', 'Tabiat Merokok')}: {t('filterAll', 'Semua')}</option>
            <option value="Non-Smoker">{translateSmoking('Non-Smoker')}</option>
            <option value="Smoker">{translateSmoking('Smoker')}</option>
          </select>
        </div>
      </div>

      {/* Candidates Grid Container */}
      {filteredCandidates.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl shadow-xs p-8 sm:p-12 text-center flex flex-col items-center justify-center my-4 border border-outline-variant/15">
          <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined text-3xl">sentiment_dissatisfied</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-on-surface font-serif">
            {t('noCandidatesFound', 'Tiada Calon Dijumpai')}
          </h3>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto mt-1 mb-6">
            Tiada profil menepati kriteria carian anda. Sila ubah tapisan atau tambah profil baru.
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>{t('addCandidate', 'Tambah Calon')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCandidates.map(item => {
            const isMale = item.gender === 'Male';
            const genderBadgeClass = isMale
              ? 'bg-surface-container text-tertiary font-bold'
              : 'bg-secondary-fixed text-secondary font-bold';

            const hobbiesArr = Array.isArray(item.hobbies)
              ? item.hobbies
              : item.hobbies
              ? item.hobbies.split(',').map(s => s.trim()).filter(Boolean)
              : [];

            const cleanName = item.name.replace(/^Dr\.\s*/i, '');
            const initials =
              cleanName
                .split(' ')
                .map(n => n[0])
                .filter(Boolean)
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'JD';

            return (
              <div
                key={item.id}
                className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group border border-outline-variant/15"
              >
                <div>
                  {/* Header bar with Avatar, Name, Age, Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.photo && item.photo.trim().length > 8 ? (
                        <img
                          src={item.photo}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover shadow-2xs ring-1 ring-outline-variant/30 shrink-0"
                          onError={e => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const sibling = (e.currentTarget.parentElement?.querySelector('.monogram-fallback') as HTMLElement);
                            if (sibling) sibling.style.display = 'flex';
                          }}
                        />
                      ) : null}

                      <div
                        className={`monogram-fallback w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm tracking-wider shadow-2xs ${
                          isMale
                            ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                            : 'bg-secondary-fixed text-secondary'
                        } ring-1 ring-outline-variant/30 shrink-0 ${
                          item.photo && item.photo.trim().length > 8 ? 'hidden' : 'flex'
                        }`}
                      >
                        {initials}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base text-on-surface truncate font-semibold">
                            {item.name}
                          </h3>
                          <span className="text-xs text-outline font-medium">
                            , {item.age} {t('yearsOld', 'thn')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${genderBadgeClass}`}>
                            {translateGender(item.gender)}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[10px] font-semibold">
                            {translateMarital(item.marital)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              item.smoking === 'Smoker'
                                ? 'bg-error-container text-error'
                                : 'bg-surface-container-low text-on-surface-variant'
                            }`}
                          >
                            {translateSmoking(item.smoking)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditParticipant(item)}
                        title={t('editCandidate', 'Kemaskini')}
                        className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteParticipant(item)}
                        title={t('deleteCandidate', 'Padam')}
                        className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Demographics & Profession Grid */}
                  <div className="space-y-1.5 py-2 bg-surface-container-low/60 rounded-xl p-3 mb-3">
                    <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                      <span className="material-symbols-outlined text-base text-outline">work</span>
                      <span className="font-semibold text-on-surface truncate">
                        {item.occupation}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                      <span className="material-symbols-outlined text-base text-outline">location_on</span>
                      <span>{item.location}, Malaysia</span>
                    </div>
                  </div>

                  {/* Hobbies Tags */}
                  <div className="mb-3">
                    <span className="text-[10px] text-outline uppercase font-bold block mb-1">
                      {t('hobbies', 'Hobi & Minat')}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {hobbiesArr.map((h, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-medium"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Ideal Partner Criteria */}
                  <div className="p-3 bg-surface-container-low/40 rounded-xl border border-outline-variant/15 mb-3">
                    <span className="text-[10px] text-primary uppercase font-bold tracking-wider block mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">favorite</span>
                      <span>{t('idealPartner', 'Kriteria Pasangan Idaman')}</span>
                    </span>
                    <p className="text-xs text-on-surface-variant italic leading-relaxed line-clamp-2">
                      "{item.ideal}"
                    </p>
                  </div>
                </div>

                {/* Footer action button */}
                <button
                  type="button"
                  onClick={() => onEditParticipant(item)}
                  className="w-full py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  <span>{t('viewProfile', 'Lihat Profil Lengkap')}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
