import React, { useState, useMemo } from 'react';
import { Participant } from '../types';

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
  const permutations = maleCount * femaleCount;

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
    <div className="flex flex-col w-full">
      {/* Top Stat Metrics Section */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-space-md mb-space-md sm:mb-space-xl">
        {/* Total Participants */}
        <div className="bg-surface-container-lowest p-2.5 sm:p-space-md lg:p-space-lg rounded-xl shadow-sm flex items-center justify-between transition-all hover:shadow-md border border-outline-variant/15">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-xs text-outline uppercase tracking-wider font-bold truncate leading-tight">
              Candidate Registry
            </span>
            <div className="flex items-baseline gap-1 mt-1 sm:mt-space-xs">
              <span className="text-lg sm:text-2xl lg:text-3xl font-bold text-on-surface font-serif leading-none">
                {totalCount}
              </span>
              <span className="text-[10px] sm:text-body-sm text-on-surface-variant truncate">
                Active
              </span>
            </div>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0 ml-1">
            <span className="material-symbols-outlined text-lg sm:text-xl lg:text-2xl">group_work</span>
          </div>
        </div>

        {/* Male Candidates */}
        <div className="bg-surface-container-lowest p-2.5 sm:p-space-md lg:p-space-lg rounded-xl shadow-sm flex items-center justify-between transition-all hover:shadow-md border border-outline-variant/15">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-xs text-outline uppercase tracking-wider font-bold truncate leading-tight">
              Male Pool
            </span>
            <div className="flex items-baseline gap-1 mt-1 sm:mt-space-xs">
              <span className="text-lg sm:text-2xl lg:text-3xl font-bold text-on-surface font-serif leading-none">
                {maleCount}
              </span>
              <span className="text-[10px] sm:text-body-sm text-on-surface-variant truncate">
                Candidates
              </span>
            </div>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-surface-container flex items-center justify-center text-tertiary shrink-0 ml-1">
            <span className="material-symbols-outlined text-lg sm:text-xl lg:text-2xl">man</span>
          </div>
        </div>

        {/* Female Candidates */}
        <div className="bg-surface-container-lowest p-2.5 sm:p-space-md lg:p-space-lg rounded-xl shadow-sm flex items-center justify-between transition-all hover:shadow-md border border-outline-variant/15">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-xs text-outline uppercase tracking-wider font-bold truncate leading-tight">
              Female Pool
            </span>
            <div className="flex items-baseline gap-1 mt-1 sm:mt-space-xs">
              <span className="text-lg sm:text-2xl lg:text-3xl font-bold text-on-surface font-serif leading-none">
                {femaleCount}
              </span>
              <span className="text-[10px] sm:text-body-sm text-on-surface-variant truncate">
                Candidates
              </span>
            </div>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary shrink-0 ml-1">
            <span className="material-symbols-outlined text-lg sm:text-xl lg:text-2xl">woman</span>
          </div>
        </div>

        {/* Match Eligibility Indicator */}
        <div className="bg-surface-container-lowest p-2.5 sm:p-space-md lg:p-space-lg rounded-xl shadow-sm flex flex-col justify-between transition-all border border-outline-variant/15 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-outline uppercase tracking-wider font-bold">
              Status Matrix
            </span>
            {isEligible ? (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] sm:text-xs flex items-center gap-1 font-semibold border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                Ready
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full bg-error-container text-on-error-container text-[10px] sm:text-xs flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                Incomplete
              </span>
            )}
          </div>
          <div className="mt-1 sm:mt-space-xs">
            <h4 className="text-xs sm:text-label-lg text-on-surface font-bold">
              {isEligible ? '1M + 1F Requirement Met' : 'Minimum Quorum Unmet'}
            </h4>
            <p className="text-[10px] sm:text-body-sm text-on-surface-variant mt-0.5 line-clamp-1 sm:line-clamp-none">
              {isEligible
                ? `1-to-1 unique potential: ${Math.min(maleCount, femaleCount)} exclusive couples`
                : 'Requires ≥1 Male and ≥1 Female to evaluate pairings'}
            </p>
          </div>
        </div>
      </section>

      {/* Editorial Section Bar & Primary Action Ribbon */}
      <div className="bg-surface-container-lowest p-3 sm:p-space-lg rounded-xl shadow-sm mb-space-md sm:mb-space-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-space-md border border-outline-variant/15">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs">
            <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-widest">
              Cohort Masterfile
            </span>
            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Manual Input Engine
            </span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight mt-0.5 font-serif">
            Participants Registry
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Discreet attendee dossier. Enter complete profiles to empower deep affinity synthesis.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-space-sm">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-label-lg text-label-lg hover:bg-surface-container-highest transition-all shadow-sm active:scale-95 cursor-pointer font-semibold"
          >
            <span className="material-symbols-outlined text-primary text-xl">person_add</span>
            <span>+ Add Participant</span>
          </button>

          <button
            type="button"
            disabled={!isEligible}
            onClick={onGenerateMatches}
            className={`relative group inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg font-label-lg text-label-lg shadow-sm transition-all cursor-pointer font-bold ${
              isEligible
                ? 'bg-primary-container text-on-primary hover:shadow-lg hover:opacity-95 active:scale-95'
                : 'bg-surface-container text-outline cursor-not-allowed opacity-60'
            }`}
          >
            <span className="material-symbols-outlined text-lg">auto_awesome</span>
            <span>Generate AI Matches</span>

            {/* Tooltip */}
            <span className="pointer-events-none absolute -bottom-10 right-0 w-max px-space-sm py-1 rounded bg-inverse-surface text-inverse-on-surface font-label-sm text-label-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md">
              {isEligible
                ? 'Synthesizes exclusive 1-to-1 pairings with zero partner overlap'
                : 'Requires at least 1 male and 1 female profile to generate matches'}
            </span>
          </button>
        </div>
      </div>

      {/* Filtration & Search Shelf */}
      <div className="bg-surface-container-lowest p-2.5 sm:p-space-md rounded-xl shadow-sm mb-space-md sm:mb-space-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-space-md border border-outline-variant/15">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, occupation, state, or interest..."
            className="w-full pl-10 pr-space-md py-2 bg-surface-container-low rounded-lg text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest placeholder:text-outline/70 transition-all border border-transparent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-space-md top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-space-xs sm:gap-space-sm">
          {/* Gender Segmented Filter */}
          <div className="flex items-center p-0.5 sm:p-1 bg-surface-container-low rounded-lg text-on-surface-variant font-label-md text-label-md">
            <button
              type="button"
              onClick={() => setGenderFilter('ALL')}
              className={`px-space-md py-1 rounded-md transition-all cursor-pointer font-semibold ${
                genderFilter === 'ALL'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('MALE')}
              className={`px-space-md py-1 rounded-md transition-all cursor-pointer font-semibold ${
                genderFilter === 'MALE'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Male
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('FEMALE')}
              className={`px-space-md py-1 rounded-md transition-all cursor-pointer font-semibold ${
                genderFilter === 'FEMALE'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Female
            </button>
          </div>

          {/* Marital Status Filter */}
          <select
            value={maritalFilter}
            onChange={e => setMaritalFilter(e.target.value)}
            className="px-space-md py-2 bg-surface-container-low text-on-surface font-label-md text-label-md rounded-lg focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer border border-transparent"
          >
            <option value="ALL">All Marital Statuses</option>
            <option value="Single">Single</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>

          {/* Smoking Status Filter */}
          <select
            value={smokingFilter}
            onChange={e => setSmokingFilter(e.target.value)}
            className="px-space-md py-2 bg-surface-container-low text-on-surface font-label-md text-label-md rounded-lg focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer border border-transparent"
          >
            <option value="ALL">All Habits</option>
            <option value="Non-Smoker">Non-Smoker</option>
            <option value="Smoker">Smoker</option>
          </select>
        </div>
      </div>

      {/* Candidates Grid Container */}
      {filteredCandidates.length === 0 ? (
        /* Empty State */
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-xl text-center flex flex-col items-center justify-center my-space-lg border border-outline-variant/15">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary mb-space-md">
            <span className="material-symbols-outlined text-3xl">sentiment_dissatisfied</span>
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface font-serif">
            No Participants Found
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto mt-space-xs mb-space-lg">
            No candidates match your current search or filter criteria. Try adjusting your query or add a new candidate profile.
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg shadow-sm hover:opacity-90 transition-all cursor-pointer font-bold"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Add Participant</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-space-lg">
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
                className="bg-surface-container-lowest rounded-xl p-3.5 sm:p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between group border border-outline-variant/15"
              >
                <div>
                  {/* Header bar with Avatar, Name, Age, Status */}
                  <div className="flex items-start justify-between gap-space-sm mb-space-md">
                    <div className="flex items-center gap-space-sm min-w-0">
                      {item.photo && item.photo.trim().length > 8 ? (
                        <img
                          src={item.photo}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover shadow-xs ring-1 ring-outline-variant/30 flex-shrink-0"
                          onError={e => {
                            // Fallback to stylized monogram avatar
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const sibling = (e.currentTarget.parentElement?.querySelector('.monogram-fallback') as HTMLElement);
                            if (sibling) sibling.style.display = 'flex';
                          }}
                        />
                      ) : null}

                      <div
                        className={`monogram-fallback w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm tracking-wider shadow-xs ${
                          isMale
                            ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                            : 'bg-secondary-fixed text-secondary'
                        } ring-1 ring-outline-variant/30 flex-shrink-0 ${
                          item.photo && item.photo.trim().length > 8 ? 'hidden' : 'flex'
                        }`}
                      >
                        {initials}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-space-xs">
                          <h3 className="font-headline-sm text-headline-sm text-on-surface truncate font-semibold">
                            {item.name}
                          </h3>
                          <span className="font-body-md text-body-md text-outline">
                            , {item.age}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm ${genderBadgeClass}`}>
                            {item.gender}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm">
                            {item.marital}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm ${
                              item.smoking === 'Smoker'
                                ? 'bg-error-container text-error'
                                : 'bg-surface-container-low text-on-surface-variant'
                            }`}
                          >
                            {item.smoking}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditParticipant(item)}
                        title="Edit Profile"
                        className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteParticipant(item)}
                        title="Delete Profile"
                        className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Demographics & Profession Grid */}
                  <div className="space-y-space-xs py-space-xs bg-surface-container-low/60 rounded-lg p-space-sm mb-space-sm">
                    <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
                      <span className="material-symbols-outlined text-base text-outline">work</span>
                      <span className="font-semibold text-on-surface truncate">
                        {item.occupation}
                      </span>
                    </div>
                    <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
                      <span className="material-symbols-outlined text-base text-outline">location_on</span>
                      <span>{item.location}, Malaysia</span>
                    </div>
                  </div>

                  {/* Hobbies Tags */}
                  <div className="mb-space-sm">
                    <span className="font-label-sm text-label-sm text-outline uppercase font-semibold block mb-1">
                      Passions & Leisure
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {hobbiesArr.map((h, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Ideal Partner Brief */}
                  <div className="mb-space-sm">
                    <span className="font-label-sm text-label-sm text-outline uppercase font-semibold block mb-1">
                      Target Affinity Dynamics
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface line-clamp-2 italic">
                      "{item.ideal}"
                    </p>
                  </div>
                </div>

                {/* Bottom Footer Info */}
                <div className="pt-space-sm mt-space-sm bg-surface-container-low/40 -mx-space-lg -mb-space-lg px-space-lg py-space-sm rounded-b-xl flex items-center justify-between border-t border-outline-variant/15">
                  <span className="font-label-sm text-label-sm text-outline">
                    ID: #{item.id}
                  </span>
                  <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    Indexed for AI Pairing
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
