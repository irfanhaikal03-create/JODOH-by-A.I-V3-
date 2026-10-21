import React, { useState, useMemo } from 'react';
import { Participant } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ParticipantsPoolViewProps {
  participants: Participant[];
  onOpenAddModal: () => void;
  onEditParticipant: (participant: Participant) => void;
  onDeleteParticipant: (participant: Participant) => void;
  onGenerateMatches: () => void;
  onOpenWhatsAppDispatch?: (participant: Participant) => void;
  onNavigateToInsights?: () => void;
  onNavigateToManualMatchmaker?: (participantId?: string) => void;
}

export const ParticipantsPoolView: React.FC<ParticipantsPoolViewProps> = ({
  participants,
  onOpenAddModal,
  onEditParticipant,
  onDeleteParticipant,
  onGenerateMatches,
  onOpenWhatsAppDispatch,
  onNavigateToInsights,
  onNavigateToManualMatchmaker,
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
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {/* Total Participants */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs flex items-center justify-between transition-all hover:shadow-sm border border-stone-200/80">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider font-bold truncate leading-tight">
              {t('totalCandidates', 'Jumlah Calon')}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif leading-none tabular-nums">
                {totalCount}
              </span>
              <span className="text-[10px] sm:text-xs text-stone-500 truncate font-medium">
                {t('activeLanguage', 'Aktif')}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center shrink-0 border border-stone-200/60">
            <span className="material-symbols-outlined text-lg sm:text-2xl">group_work</span>
          </div>
        </div>

        {/* Male Candidates */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs flex items-center justify-between transition-all hover:shadow-sm border border-stone-200/80">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider font-bold truncate leading-tight">
              {t('filterMale', 'Calon Lelaki')}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif leading-none tabular-nums">
                {maleCount}
              </span>
              <span className="text-[10px] sm:text-xs text-stone-500 truncate font-medium">
                {t('male', 'Lelaki')}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/60">
            <span className="material-symbols-outlined text-lg sm:text-2xl">man</span>
          </div>
        </div>

        {/* Female Candidates */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs flex items-center justify-between transition-all hover:shadow-sm border border-stone-200/80">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider font-bold truncate leading-tight">
              {t('filterFemale', 'Calon Wanita')}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif leading-none tabular-nums">
                {femaleCount}
              </span>
              <span className="text-[10px] sm:text-xs text-stone-500 truncate font-medium">
                {t('female', 'Wanita')}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-50 text-[#8f6430] flex items-center justify-center shrink-0 border border-amber-200/60">
            <span className="material-symbols-outlined text-lg sm:text-2xl">woman</span>
          </div>
        </div>

        {/* Match Eligibility Indicator */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col justify-between transition-all border border-stone-200/80 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider font-bold">
              Status Quorum
            </span>
            {isEligible ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] sm:text-xs flex items-center gap-1 font-semibold border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                {t('eligibleForMatching', 'Sedia')}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] sm:text-xs flex items-center gap-1 font-semibold border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                {t('notEligible', 'Tidak Lengkap')}
              </span>
            )}
          </div>
          <div className="mt-2">
            <h4 className="text-xs sm:text-sm text-stone-900 font-bold">
              {isEligible ? 'Quorum Dipenuhi (1L + 1W)' : 'Quorum Belum Mencukupi'}
            </h4>
            <p className="text-[10px] sm:text-xs text-stone-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
              {isEligible
                ? `Potensi: ${Math.min(maleCount, femaleCount)} pasangan 1-ke-1`
                : 'Perlu sekurang-kurangnya 1 lelaki & 1 wanita'}
            </p>
          </div>
        </div>
      </section>

      {/* Editorial Section Bar & Primary Action Ribbon */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border border-stone-200/80">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#b48246] uppercase font-bold tracking-widest">
              Executive Cohort
            </span>
            <span className="w-1 h-1 rounded-full bg-stone-300"></span>
            <span className="text-xs text-stone-500 font-medium">
              Private Registry
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl text-stone-900 tracking-tight mt-0.5 font-serif font-bold">
            {t('participantsPool', 'Direktori Calon Peserta')}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Dossier profil calon eksklusif untuk analisis keserasian algoritma pintar.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {onNavigateToInsights && (
            <button
              type="button"
              onClick={onNavigateToInsights}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-100 text-stone-800 text-xs sm:text-sm hover:bg-stone-200 transition-all border border-stone-200/80 cursor-pointer font-semibold active:scale-95"
              title="Lihat Demografi & Analisis Jurang Calon"
            >
              <span className="material-symbols-outlined text-[#b48246] text-lg">monitoring</span>
              <span>Analitik Demografi</span>
            </button>
          )}

          {onNavigateToManualMatchmaker && (
            <button
              type="button"
              onClick={() => onNavigateToManualMatchmaker()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-100 text-stone-800 text-xs sm:text-sm hover:bg-stone-200 transition-all border border-stone-200/80 cursor-pointer font-semibold active:scale-95"
              title="Padankan mana-mana 2 calon secara manual"
            >
              <span className="material-symbols-outlined text-[#7c5820] text-lg">handshake</span>
              <span>Padankan Manual</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs sm:text-sm border border-stone-300 transition-all shadow-2xs active:scale-95 cursor-pointer font-bold"
          >
            <span className="material-symbols-outlined text-[#b48246] text-lg">person_add</span>
            <span>+ {t('addCandidate', 'Tambah Calon')}</span>
          </button>

          <button
            type="button"
            disabled={!isEligible}
            onClick={onGenerateMatches}
            className={`relative group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all cursor-pointer font-bold ${
              isEligible
                ? 'bg-stone-900 text-white hover:bg-stone-800 hover:shadow-md active:scale-95 border border-stone-900'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200 opacity-60'
            }`}
          >
            <span className="material-symbols-outlined text-base text-[#b48246]">auto_awesome</span>
            <span>{t('generateMatches', 'Jana Padanan AI')}</span>
          </button>
        </div>
      </div>

      {/* Filtration & Search Shelf */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-xs mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border border-stone-200/80">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xl pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder', 'Cari mengikut nama, profesion, lokasi atau hobi...')}
            className="w-full pl-10 pr-10 py-2.5 bg-stone-50 hover:bg-stone-100/50 rounded-xl border border-stone-200 text-xs sm:text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#b48246]/20 focus:border-[#b48246]/50 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-800 cursor-pointer p-1"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Gender Segmented Filter */}
          <div className="flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200/60 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setGenderFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                genderFilter === 'ALL'
                  ? 'bg-stone-900 text-white shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {t('filterAll', 'Semua')}
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
              {t('male', 'Lelaki')}
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
              {t('female', 'Wanita')}
            </button>
          </div>

          {/* Marital Status Filter */}
          <select
            value={maritalFilter}
            onChange={e => setMaritalFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 hover:bg-stone-100/60 text-stone-800 text-xs font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b48246]/20 focus:border-[#b48246]/50 cursor-pointer border border-stone-200 transition-all"
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
            className="px-3 py-2 bg-stone-50 hover:bg-stone-100/60 text-stone-800 text-xs font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b48246]/20 focus:border-[#b48246]/50 cursor-pointer border border-stone-200 transition-all"
          >
            <option value="ALL">{t('smoking', 'Tabiat Merokok')}: {t('filterAll', 'Semua')}</option>
            <option value="Non-Smoker">{translateSmoking('Non-Smoker')}</option>
            <option value="Smoker">{translateSmoking('Smoker')}</option>
          </select>
        </div>
      </div>

      {/* Candidates Grid Container */}
      {filteredCandidates.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs p-8 sm:p-12 text-center flex flex-col items-center justify-center my-4 border border-stone-200/80">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-600 mb-4 border border-stone-200/60">
            <span className="material-symbols-outlined text-3xl text-[#b48246]">person_search</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-stone-900 font-serif">
            {t('noCandidatesFound', 'Tiada Calon Dijumpai')}
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto mt-1 mb-6">
            Tiada profil menepati kriteria carian anda. Sila ubah tapisan atau tambah profil baru.
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold shadow-xs hover:bg-stone-800 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-[#b48246]">add</span>
            <span>{t('addCandidate', 'Tambah Calon')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCandidates.map(item => {
            const isMale = item.gender === 'Male';
            const genderBadgeClass = isMale
              ? 'bg-slate-100 text-slate-700 border border-slate-200/70 font-semibold'
              : 'bg-[#fbf6ee] text-[#7c5820] border border-[#b48246]/30 font-semibold';

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
                className="bg-white rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group border border-stone-200/80 hover:border-[#b48246]/40"
              >
                <div>
                  {/* Header bar with Avatar, Name, Age, Status */}
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.photo && item.photo.trim().length > 8 ? (
                        <img
                          src={item.photo}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover shadow-2xs ring-1 ring-stone-200 shrink-0"
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
                            ? 'bg-slate-100 text-slate-800 border border-slate-200'
                            : 'bg-amber-50 text-[#7c5820] border border-amber-200'
                        } shrink-0 ${
                          item.photo && item.photo.trim().length > 8 ? 'hidden' : 'flex'
                        }`}
                      >
                        {initials}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base text-stone-900 truncate font-bold font-serif">
                            {item.name}
                          </h3>
                          <span className="text-xs text-stone-400 font-medium">
                            , {item.age} {t('yearsOld', 'thn')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${genderBadgeClass}`}>
                            {translateGender(item.gender)}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-medium border border-stone-200/60">
                            {translateMarital(item.marital)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              item.smoking === 'Smoker'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {translateSmoking(item.smoking)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
                      {onOpenWhatsAppDispatch && (
                        <button
                          type="button"
                          onClick={() => onOpenWhatsAppDispatch(item)}
                          title="Hantar Makluman WhatsApp"
                          className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">chat</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEditParticipant(item)}
                        title={t('editCandidate', 'Kemaskini')}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteParticipant(item)}
                        title={t('deleteCandidate', 'Padam')}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Demographics & Profession Grid */}
                  <div className="space-y-1.5 py-2.5 bg-stone-50/80 rounded-xl px-3 mb-3 border border-stone-200/60">
                    <div className="flex items-center gap-2 text-stone-700 text-xs">
                      <span className="material-symbols-outlined text-base text-[#b48246]">work</span>
                      <span className="font-semibold text-stone-900 truncate">
                        {item.occupation}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-stone-500 text-xs">
                      <span className="material-symbols-outlined text-base text-stone-400">location_on</span>
                      <span>{item.location}, Malaysia</span>
                    </div>
                  </div>

                  {/* Hobbies Tags */}
                  <div className="mb-3">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block mb-1">
                      {t('hobbies', 'Hobi & Minat')}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {hobbiesArr.map((h, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700 text-[11px] font-medium border border-stone-200/50"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Ideal Partner Criteria */}
                  <div className="p-3 bg-[#fbfbf9] rounded-xl border border-stone-200/70 mb-3.5">
                    <span className="text-[10px] text-[#b48246] uppercase font-bold tracking-wider block mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">favorite</span>
                      <span>{t('idealPartner', 'Kriteria Pasangan Idaman')}</span>
                    </span>
                    <p className="text-xs text-stone-600 italic leading-relaxed line-clamp-2">
                      "{item.ideal}"
                    </p>
                  </div>
                </div>

                {/* Footer action button */}
                <button
                  type="button"
                  onClick={() => onEditParticipant(item)}
                  className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-800 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-stone-200/70 hover:border-stone-900"
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
