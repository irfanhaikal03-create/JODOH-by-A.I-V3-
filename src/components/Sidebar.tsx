import React from 'react';
import { UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';

export type NavTabType = 'participants-pool' | 'top-10-ai-matches' | 'admin-insights' | 'manual-matchmaker';

interface SidebarProps {
  activeTab: NavTabType;
  onTabChange: (tab: NavTabType) => void;
  onOpenAffinityVectors: () => void;
  onOpenMatchingRules: () => void;
  isOpen: boolean;
  onClose: () => void;
  userRole?: UserRole;
  matchesPublished?: boolean;
  onTogglePublish?: () => void;
  onOpenSavedSessions?: () => void;
  onOpenResetModal?: () => void;
  savedSessionsCount?: number;
  onOpenConcierge?: () => void;
  onOpenWhatsAppModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenAffinityVectors,
  onOpenMatchingRules,
  isOpen,
  onClose,
  userRole = 'admin',
  matchesPublished = true,
  onTogglePublish,
  onOpenSavedSessions,
  onOpenResetModal,
  savedSessionsCount = 0,
  onOpenConcierge,
  onOpenWhatsAppModal,
}) => {
  const { t, languageInfo, openLanguageModal } = useLanguage();
  const isAdmin = userRole === 'admin';

  const handleNavClick = (callback: () => void) => {
    callback();
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-inverse-surface/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Aside Bar */}
      <aside
        className={`fixed left-0 top-0 lg:top-20 bottom-0 w-72 lg:w-64 bg-white shadow-xl lg:shadow-[0_4px_20px_rgba(28,25,23,0.03)] z-50 lg:z-40 flex flex-col border-r border-stone-200/70 transition-transform duration-300 ease-in-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header Row with Close / Collapse Button (Mobile AND Desktop) */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-200/60 shrink-0 bg-white">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-lg text-[#b48246] shrink-0">diamond</span>
            <span className="text-[11px] text-stone-500 tracking-wider uppercase font-bold truncate">
              {isAdmin ? t('adminSuite', 'Executive Salon') : t('participantPortal', 'Private Concierge')}
            </span>
          </div>

          {/* Universal Close Button on Mobile, Tablet & Desktop */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-900 transition-all cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
            title="Tutup / Sembunyikan sidebar"
            aria-label="Tutup navigation menu"
          >
            <span className="material-symbols-outlined text-base">close</span>
            <span className="text-[11px] font-semibold pr-0.5">Tutup</span>
          </button>
        </div>

        {/* Scrollable Body: Nav Items & Bottom Section */}
        <div className="flex-1 overflow-y-auto overscroll-contain py-4 px-3 flex flex-col justify-between gap-6 sidebar-scroll">
          <nav className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => handleNavClick(() => onTabChange('participants-pool'))}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left cursor-pointer ${
                activeTab === 'participants-pool'
                  ? 'bg-stone-900 text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${activeTab === 'participants-pool' ? 'text-[#b48246]' : 'text-stone-400'}`}>
                {isAdmin ? 'groups' : 'person_search'}
              </span>
              <span>{isAdmin ? t('participantsPool', 'Direktori Calon') : t('participantsPool', 'Direktori Peserta')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick(() => onTabChange('top-10-ai-matches'))}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left cursor-pointer ${
                activeTab === 'top-10-ai-matches'
                  ? 'bg-stone-900 text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${activeTab === 'top-10-ai-matches' ? 'text-[#b48246]' : 'text-stone-400'}`}>
                favorite
              </span>
              <span>{isAdmin ? t('topMatches', 'Top 10 Padanan AI') : t('topMatches', 'Keputusan AI')}</span>
            </button>

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => handleNavClick(() => onTabChange('admin-insights'))}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left cursor-pointer ${
                    activeTab === 'admin-insights'
                      ? 'bg-stone-900 text-white font-bold shadow-xs'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <span className={`material-symbols-outlined text-xl ${activeTab === 'admin-insights' ? 'text-[#b48246]' : 'text-stone-400'}`}>
                    monitoring
                  </span>
                  <span>Analitik & Wawasan AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick(() => onTabChange('manual-matchmaker'))}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left cursor-pointer ${
                    activeTab === 'manual-matchmaker'
                      ? 'bg-stone-900 text-white font-bold shadow-xs'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <span className={`material-symbols-outlined text-xl ${activeTab === 'manual-matchmaker' ? 'text-[#b48246]' : 'text-stone-400'}`}>
                    handshake
                  </span>
                  <span>Meja Kerja Manual</span>
                </button>

                {onOpenWhatsAppModal && (
                  <button
                    type="button"
                    onClick={() => handleNavClick(onOpenWhatsAppModal)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-emerald-800 hover:bg-emerald-50 transition-all text-left cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xl text-emerald-600">chat</span>
                    <span>Pusat Makluman WhatsApp</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleNavClick(onOpenAffinityVectors)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-all text-left cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl text-stone-400">analytics</span>
                  <span>{t('affinityVectors', 'Vektor Keserasian')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick(onOpenMatchingRules)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-all text-left cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl text-stone-400">tune</span>
                  <span>{t('matchingRules', 'Peraturan Algoritma')}</span>
                </button>
              </>
            )}

            {/* In-App Saved Sessions Archive button */}
            {onOpenSavedSessions && (
              <button
                type="button"
                onClick={() => handleNavClick(onOpenSavedSessions)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-xl text-stone-400">folder_managed</span>
                  <span>{isAdmin ? t('savedSessions', 'Arkib Keputusan AI') : t('savedSessions', 'Sejarah Rekod Rasmi')}</span>
                </div>
                {savedSessionsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 text-[10px] font-bold border border-stone-200">
                    {savedSessionsCount}
                  </span>
                )}
              </button>
            )}

            {/* AI Concierge Chat Drawer Button */}
            {onOpenConcierge && (
              <button
                type="button"
                onClick={() => handleNavClick(onOpenConcierge)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#7c5820] bg-[#fbf6ee] hover:bg-[#f5eedb] border border-[#b48246]/25 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-xl text-[#b48246]">auto_awesome</span>
                  <span>AI Concierge</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#b48246] text-white font-bold">
                  {isAdmin ? 'Full Access' : 'Partner Advisor'}
                </span>
              </button>
            )}

            {/* Dedicated Translation Language Button */}
            <button
              type="button"
              onClick={() => handleNavClick(openLanguageModal)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-xl text-stone-400">translate</span>
                <span>{t('translateApp', 'Terjemah Aplikasi')}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 font-semibold border border-stone-200 flex items-center gap-1">
                <span>{languageInfo.flag}</span>
                <span className="uppercase">{languageInfo.code}</span>
              </span>
            </button>

            {/* Exclusive Administrator Reset Button */}
            {isAdmin && onOpenResetModal && (
              <button
                type="button"
                onClick={() => handleNavClick(onOpenResetModal)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-stone-500 hover:text-red-700 hover:bg-red-50 transition-all text-left cursor-pointer mt-1"
                title={t('systemReset', 'Pusat Set Semula')}
              >
                <span className="material-symbols-outlined text-xl">restart_alt</span>
                <span>{t('systemReset', 'Pusat Reset (Admin)')}</span>
              </button>
            )}
          </nav>

          {/* Bottom Section */}
          <div className="flex flex-col gap-3 pb-8">
            {/* Admin Publish Toggle Control */}
            {isAdmin && onTogglePublish && (
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-800">
                    {t('published', 'Penerbitan Keputusan')}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      matchesPublished ? 'bg-emerald-600' : 'bg-amber-500'
                    }`}
                  ></span>
                </div>
                <p className="text-[11px] text-stone-500 leading-tight">
                  {matchesPublished
                    ? (t('published', 'Diterbitkan') + ' - Peserta boleh melihat keputusan.')
                    : (t('draft', 'Draf') + ' - Belum diterbitkan kepada peserta.')}
                </p>
                <button
                  type="button"
                  onClick={onTogglePublish}
                  className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    matchesPublished
                      ? 'bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 shadow-2xs'
                      : 'bg-stone-900 text-white hover:bg-stone-800 shadow-xs'
                  }`}
                >
                  {matchesPublished ? t('withdrawPublish', 'Tarik Balik Penerbitan') : t('publishToParticipants', 'Terbitkan Kepada Peserta')}
                </button>
              </div>
            )}

            {/* Discreet Security Module */}
            <div className="p-3.5 rounded-xl bg-stone-50 flex flex-col gap-1 border border-stone-200/80">
              <div className="flex items-center gap-1.5 text-stone-700">
                <span className="material-symbols-outlined text-sm text-[#b48246]">lock</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {t('privacyGuaranteed', 'Privasi & Kerahsiaan')}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                {t('privacyDesc', 'Data profil calon dilindungi dengan piawaian kerahsiaan acara tertutup.')}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
