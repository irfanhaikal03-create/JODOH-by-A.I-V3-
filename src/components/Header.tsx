import React from 'react';
import { User } from 'firebase/auth';
import { UserRole, AppUser } from '../types';
import { useLanguage } from '../context/LanguageContext';

export type NavTabType = 'participants-pool' | 'top-10-ai-matches' | 'admin-insights' | 'manual-matchmaker';

interface HeaderProps {
  activeTab: NavTabType;
  onTabChange: (tab: NavTabType) => void;
  matchesCount: number;
  isEligible: boolean;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  currentUser?: User | null;
  userProfile?: AppUser | null;
  userRole?: UserRole;
  userDisplayName?: string;
  onSignIn?: () => void;
  onSignOut?: () => void;
  isCloudSyncing?: boolean;
  onToggleRole?: () => void;
  onOpenConcierge?: () => void;
  onOpenWhatsAppModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  matchesCount,
  isEligible,
  onToggleSidebar,
  isSidebarOpen = true,
  currentUser,
  userProfile,
  userRole = 'admin',
  userDisplayName,
  onSignIn,
  onSignOut,
  isCloudSyncing,
  onToggleRole,
  onOpenConcierge,
  onOpenWhatsAppModal,
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
    <header className="fixed top-0 left-0 right-0 h-16 sm:h-20 bg-white/95 backdrop-blur-xl shadow-[0_1px_6px_rgba(28,25,23,0.03)] z-50 flex items-center justify-between px-3 sm:px-6 border-b border-stone-200/70 flex-nowrap gap-2 sm:gap-4 overflow-hidden">
      {/* Left Branding & App Title Area */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
        {/* Sidebar Toggle Button (Mobile & Desktop) */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border ${
              isSidebarOpen
                ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100 border-stone-200 bg-stone-50'
            }`}
            title={isSidebarOpen ? 'Tutup / Sembunyikan Sidebar Menu' : 'Buka Sidebar Menu'}
            aria-label={isSidebarOpen ? 'Tutup sidebar menu' : 'Buka sidebar menu'}
          >
            <span className="material-symbols-outlined text-xl transition-transform">
              {isSidebarOpen ? 'menu_open' : 'menu'}
            </span>
            <span className="hidden xl:inline text-xs font-semibold select-none">
              {isSidebarOpen ? 'Tutup Menu' : 'Menu'}
            </span>
          </button>
        )}

        {/* Brandmark and App Title */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer select-none shrink-0 group"
          onClick={() => onTabChange('participants-pool')}
        >
          <div className="w-8 h-8 rounded-lg bg-stone-900 text-[#b48246] flex items-center justify-center font-serif font-bold text-lg shadow-xs group-hover:scale-105 transition-transform">
            J
          </div>
          <div className="flex flex-col shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-serif font-bold text-stone-900 tracking-tight leading-none whitespace-nowrap">
                JODOH
              </span>
              <span className="text-[10px] sm:text-xs font-sans font-bold text-[#b48246] uppercase tracking-widest leading-none">
                by A.I
              </span>
            </div>
            <span className="hidden sm:inline font-sans text-[10px] text-stone-500 font-medium tracking-wider mt-0.5 whitespace-nowrap">
              {isAdmin ? t('adminSuite', 'Executive Salon • Penganjur') : t('participantPortal', 'Private Concierge • Peserta')}
            </span>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-stone-100/90 rounded-xl ml-2 shrink-0 border border-stone-200/50">
          <button
            type="button"
            onClick={() => onTabChange('participants-pool')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer font-semibold whitespace-nowrap ${
              activeTab === 'participants-pool'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <span>{isAdmin ? t('participantsPool', 'Direktori Calon') : t('participantsPool', 'Direktori Peserta')}</span>
          </button>
          
          <button
            type="button"
            onClick={() => onTabChange('top-10-ai-matches')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer font-semibold whitespace-nowrap ${
              activeTab === 'top-10-ai-matches'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <span>{isAdmin ? t('topMatches', 'Top 10 AI Matches') : t('topMatches', 'Keputusan AI')}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
              activeTab === 'top-10-ai-matches'
                ? 'bg-[#b48246] text-white'
                : 'bg-stone-200 text-stone-800'
            }`}>
              {matchesCount}
            </span>
          </button>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => onTabChange('admin-insights')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer font-semibold whitespace-nowrap ${
                  activeTab === 'admin-insights'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
                title="Papan Pemuka Analitik Demografi & AI Gap Analysis"
              >
                <span className="material-symbols-outlined text-sm">monitoring</span>
                <span>Analitik</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('manual-matchmaker')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer font-semibold whitespace-nowrap ${
                  activeTab === 'manual-matchmaker'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
                title="Meja Kerja Padanan Manual Berbantu AI"
              >
                <span className="material-symbols-outlined text-sm">handshake</span>
                <span>Padanan Manual</span>
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Right Header Controls Area */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-nowrap z-10">
        {/* Quick WhatsApp Dispatch Trigger for Admin */}
        {isAdmin && onOpenWhatsAppModal && (
          <button
            type="button"
            onClick={onOpenWhatsAppModal}
            title="Buka Pusat Makluman WhatsApp"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 h-8 sm:h-9 rounded-full text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 shadow-2xs transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
          >
            <span className="material-symbols-outlined text-sm text-emerald-600">chat</span>
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
        )}

        {/* Language / Translation Feature Button */}
        <button
          type="button"
          onClick={openLanguageModal}
          title={`${t('translateApp', 'Terjemah Aplikasi')} (${languageInfo.name})`}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 h-8 sm:h-9 rounded-full text-xs font-medium transition-all shadow-2xs border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
          aria-label={t('translateApp', 'Terjemah Aplikasi')}
        >
          <span className="text-sm leading-none">{languageInfo.flag}</span>
          <span className="hidden sm:inline font-semibold text-xs">
            {languageInfo.name}
          </span>
          <span className="material-symbols-outlined text-xs sm:text-sm text-stone-400 leading-none">
            translate
          </span>
        </button>

        {/* AI Concierge Chat Trigger Button */}
        {onOpenConcierge && (
          <button
            type="button"
            onClick={onOpenConcierge}
            title={isAdmin ? 'AI Matchmaking Concierge (Full Access)' : 'AI Relationship Advisor (Official Partner)'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 h-8 sm:h-9 rounded-full text-xs font-bold transition-all shadow-2xs border border-[#b48246]/30 bg-[#fbf6ee] hover:bg-[#f5eedb] text-[#7c5820] cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
            aria-label="AI Concierge"
          >
            <span className="material-symbols-outlined text-sm sm:text-base text-[#b48246] leading-none">
              auto_awesome
            </span>
            <span className="hidden md:inline font-bold text-xs">
              AI Concierge
            </span>
          </button>
        )}

        {isAuthenticated ? (
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-nowrap">
            {/* Administrator / Peserta Role Switcher Button */}
            {onToggleRole && (
              <button
                type="button"
                onClick={onToggleRole}
                title={`${t('toggleRole', 'Tukar Paparan')}: ${isAdmin ? t('roleAdmin', 'Administrator') : t('roleParticipant', 'Peserta')}`}
                className={`group inline-flex items-center gap-1.5 px-3 py-1.5 h-8 sm:h-9 rounded-full text-xs font-semibold transition-all shadow-2xs border cursor-pointer shrink-0 whitespace-nowrap active:scale-95 ${
                  isAdmin
                    ? 'bg-stone-100 text-stone-900 border-stone-200 hover:bg-stone-200/70'
                    : 'bg-[#fbf6ee] text-[#7c5820] border-[#b48246]/30 hover:bg-[#f5eedb]'
                }`}
              >
                <span className="material-symbols-outlined text-sm leading-none text-[#b48246]">
                  {isAdmin ? 'admin_panel_settings' : 'favorite'}
                </span>
                <span className="whitespace-nowrap">
                  {isAdmin ? t('roleAdmin', 'Admin') : t('roleParticipant', 'Peserta')}
                </span>
                <span className="flex items-center gap-0.5 pl-1.5 border-l border-stone-300 text-[10px] uppercase font-bold tracking-wider text-stone-400 group-hover:text-stone-700">
                  <span className="material-symbols-outlined text-xs leading-none">sync_alt</span>
                  <span className="hidden sm:inline whitespace-nowrap">{t('toggleRole', 'Tukar')}</span>
                </span>
              </button>
            )}

            {/* User Profile Pill & Logout Button */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-stone-200 shrink-0 whitespace-nowrap">
              {photo ? (
                <img
                  src={photo}
                  alt={displayName}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-[#b48246]/40 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-900 text-[#b48246] font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs ring-1 ring-[#b48246]/30">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}

              <div className="hidden xl:flex flex-col text-left max-w-[120px] shrink-0">
                <span className="text-xs font-semibold text-stone-900 truncate leading-tight">
                  {displayName}
                </span>
                {email && (
                  <span className="text-[10px] text-stone-400 truncate leading-none mt-0.5">
                    {email}
                  </span>
                )}
              </div>

              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  title={t('signOut', 'Log Keluar')}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-red-700 hover:bg-red-50 transition-all cursor-pointer flex items-center justify-center shrink-0"
                  aria-label={t('signOut', 'Log Keluar')}
                >
                  <span className="material-symbols-outlined text-lg leading-none">logout</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          onSignIn && (
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 h-8 sm:h-9 rounded-xl bg-stone-900 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer hover:bg-stone-800 active:scale-95 shrink-0 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-base leading-none text-[#b48246]">login</span>
              <span className="whitespace-nowrap">{t('signInRegister', 'Log Masuk / Daftar')}</span>
            </button>
          )
        )}
      </div>
    </header>
  );
};
