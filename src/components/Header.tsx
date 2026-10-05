import React from 'react';
import { User } from 'firebase/auth';
import { UserRole, AppUser } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  activeTab: 'participants-pool' | 'top-10-ai-matches';
  onTabChange: (tab: 'participants-pool' | 'top-10-ai-matches') => void;
  matchesCount: number;
  isEligible: boolean;
  onToggleSidebar?: () => void;
  currentUser?: User | null;
  userProfile?: AppUser | null;
  userRole?: UserRole;
  userDisplayName?: string;
  onSignIn?: () => void;
  onSignOut?: () => void;
  isCloudSyncing?: boolean;
  onToggleRole?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  matchesCount,
  isEligible,
  onToggleSidebar,
  currentUser,
  userProfile,
  userRole = 'admin',
  userDisplayName,
  onSignIn,
  onSignOut,
  isCloudSyncing,
  onToggleRole,
}) => {
  const { t, languageInfo, openLanguageModal } = useLanguage();
  const isAdmin = userRole === 'admin';
  const isAuthenticated = Boolean(currentUser || userProfile);

  const displayName =
    userDisplayName ||
    userProfile?.displayName ||
    currentUser?.displayName ||
    (isAdmin ? t('roleAdmin', 'Administrator') : t('roleParticipant', 'Peserta'));

  const email = userProfile?.email || currentUser?.email || '';
  const photo = userProfile?.photoURL || currentUser?.photoURL;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 sm:h-20 bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex items-center justify-between px-3 sm:px-6 border-b border-outline-variant/20 flex-nowrap gap-2 sm:gap-4 overflow-hidden">
      {/* Left Branding & App Title Area */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
        {/* Mobile Sidebar Toggle Button */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 rounded-lg text-on-surface hover:bg-surface-container transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="Buka menu navigasi"
            aria-label="Buka navigasi menu"
          >
            <span className="material-symbols-outlined text-xl sm:text-2xl">menu</span>
          </button>
        )}

        {/* Brandmark and App Title */}
        <div 
          className="flex items-center gap-2 cursor-pointer select-none shrink-0"
          onClick={() => onTabChange('participants-pool')}
        >
          <img
            alt="JODOH by A.I Brandmark"
            className="h-7 sm:h-8 w-auto object-contain shrink-0"
            src="https://lh3.googleusercontent.com/aida/AEtjO1VoFLL6PMuoTOKgVSCpLzUMnlZyTQA4E_UYhGM9U8V8FpBdFxu0BzwDFStd-XbBcC8sSE0xn1hIo_mg1mmR22sjvveERNM-rb9AlOtCyZ68-4GwaVELEHouNtRtVhCjV_47Da6rOkBc9sq1z_ppc-K_x4dHn2eI2Ny1m56p3c93pPVPVwP4-J2JaHJqkSNZp353ig9gtoeYUjACf1ghaeQ1aOJOGgXojHKL2ErYCxJv6hyGRVDdKmWWXh4"
          />
          <div className="flex flex-col shrink-0">
            <span className="text-base sm:text-lg font-serif font-bold text-primary tracking-tight leading-none whitespace-nowrap">
              JODOH by A.I
            </span>
            <span className="hidden sm:inline font-sans text-[10px] text-outline font-semibold uppercase tracking-wider mt-0.5 whitespace-nowrap">
              {isAdmin ? t('adminSuite', 'Suite Administrator') : t('participantPortal', 'Portal Peserta')}
            </span>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-surface-container-low rounded-xl ml-2 shrink-0">
          <button
            type="button"
            onClick={() => onTabChange('participants-pool')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer font-semibold whitespace-nowrap ${
              activeTab === 'participants-pool'
                ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
            }`}
          >
            <span>{isAdmin ? t('participantsPool', 'Direktori Calon') : t('participantsPool', 'Direktori Peserta')}</span>
          </button>
          
          <button
            type="button"
            onClick={() => onTabChange('top-10-ai-matches')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer font-semibold whitespace-nowrap ${
              activeTab === 'top-10-ai-matches'
                ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
            }`}
          >
            <span>{isAdmin ? t('topMatches', 'Top 10 AI Matches') : t('topMatches', 'Keputusan AI')}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold ml-0.5 shrink-0">
              {matchesCount}
            </span>
          </button>
        </nav>
      </div>

      {/* Right Header Controls Area */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-nowrap z-10">
        {/* Language / Translation Feature Button */}
        <button
          type="button"
          onClick={openLanguageModal}
          title={`${t('translateApp', 'Terjemah Aplikasi')} (${languageInfo.name})`}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 h-8 sm:h-9 rounded-full text-xs font-bold transition-all shadow-xs border border-outline-variant/30 bg-surface-container-low hover:bg-surface-container text-on-surface cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
          aria-label={t('translateApp', 'Terjemah Aplikasi')}
        >
          <span className="text-sm leading-none">{languageInfo.flag}</span>
          <span className="hidden sm:inline font-semibold text-xs">
            {languageInfo.name}
          </span>
          <span className="material-symbols-outlined text-xs sm:text-sm text-outline leading-none">
            translate
          </span>
        </button>

        {isAuthenticated ? (
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-nowrap">
            {/* Administrator / Peserta Role Switcher Button */}
            {onToggleRole && (
              <button
                type="button"
                onClick={onToggleRole}
                title={`${t('toggleRole', 'Tukar Paparan')}: ${isAdmin ? t('roleAdmin', 'Administrator') : t('roleParticipant', 'Peserta')}`}
                className={`group inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 h-8 sm:h-9 rounded-full text-xs font-bold transition-all shadow-xs border cursor-pointer shrink-0 whitespace-nowrap active:scale-95 ${
                  isAdmin
                    ? 'bg-primary/10 text-primary border-primary/25 hover:bg-primary/20'
                    : 'bg-secondary-fixed text-on-secondary-fixed border-secondary/25 hover:bg-secondary-fixed-dim'
                }`}
              >
                <span className="material-symbols-outlined text-sm sm:text-base leading-none">
                  {isAdmin ? 'admin_panel_settings' : 'favorite'}
                </span>
                <span className="whitespace-nowrap">
                  {isAdmin ? t('roleAdmin', 'Administrator') : t('roleParticipant', 'Peserta')}
                </span>
                <span className="flex items-center gap-0.5 pl-1.5 border-l border-current/25 text-[10px] uppercase font-bold tracking-wider opacity-75 group-hover:opacity-100">
                  <span className="material-symbols-outlined text-xs leading-none">sync_alt</span>
                  <span className="hidden sm:inline whitespace-nowrap">{t('toggleRole', 'Tukar')}</span>
                </span>
              </button>
            )}

            {/* User Profile Pill & Logout Button */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 pl-2 sm:pl-3 border-l border-outline-variant/30 shrink-0 whitespace-nowrap">
              {photo ? (
                <img
                  src={photo}
                  alt={displayName}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-primary/30 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-container text-on-primary font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}

              <div className="hidden xl:flex flex-col text-left max-w-[120px] shrink-0">
                <span className="text-xs font-bold text-on-surface truncate leading-tight">
                  {displayName}
                </span>
                {email && (
                  <span className="text-[10px] text-outline truncate leading-none mt-0.5">
                    {email}
                  </span>
                )}
              </div>

              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  title={t('signOut', 'Log Keluar')}
                  className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container/20 transition-all cursor-pointer flex items-center justify-center shrink-0"
                  aria-label={t('signOut', 'Log Keluar')}
                >
                  <span className="material-symbols-outlined text-lg sm:text-xl leading-none">logout</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          onSignIn && (
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 h-8 sm:h-9 rounded-xl bg-primary text-on-primary text-xs font-bold transition-all shadow-sm cursor-pointer hover:opacity-95 active:scale-95 shrink-0 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-base leading-none">login</span>
              <span className="whitespace-nowrap">{t('signInRegister', 'Log Masuk / Daftar')}</span>
            </button>
          )
        )}
      </div>
    </header>
  );
};
