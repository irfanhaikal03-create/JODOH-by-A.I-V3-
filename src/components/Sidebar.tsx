import React from 'react';
import { UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  activeTab: 'participants-pool' | 'top-10-ai-matches';
  onTabChange: (tab: 'participants-pool' | 'top-10-ai-matches') => void;
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
        className={`fixed left-0 top-0 lg:top-20 bottom-0 w-72 lg:w-64 bg-surface-container-lowest shadow-2xl lg:shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 lg:z-40 flex flex-col justify-between py-4 px-3 border-r border-outline-variant/20 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-4">
          {/* Header Row with Close Button for Mobile */}
          <div className="flex items-center justify-between px-2 pt-2 lg:pt-0">
            <span className="text-[11px] text-outline tracking-wider uppercase font-bold">
              {isAdmin ? t('adminSuite', 'Papan Kawalan Penganjur') : t('participantPortal', 'Portal Suai Kenal')}
            </span>

            {/* Close Button on Smartphone / Tablet */}
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-all cursor-pointer flex items-center justify-center shadow-xs"
              title="Tutup menu"
              aria-label="Tutup navigation menu"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => handleNavClick(() => onTabChange('participants-pool'))}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left cursor-pointer ${
                activeTab === 'participants-pool'
                  ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-xl">
                {isAdmin ? 'groups' : 'person_search'}
              </span>
              <span>{isAdmin ? t('participantsPool', 'Direktori Calon') : t('participantsPool', 'Direktori Peserta')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick(() => onTabChange('top-10-ai-matches'))}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left cursor-pointer ${
                activeTab === 'top-10-ai-matches'
                  ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-xl">favorite</span>
              <span>{isAdmin ? t('topMatches', 'Top 10 Padanan AI') : t('topMatches', 'Keputusan AI')}</span>
            </button>

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => handleNavClick(onOpenAffinityVectors)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all text-left cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">analytics</span>
                  <span>{t('affinityVectors', 'Vektor Keserasian')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick(onOpenMatchingRules)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all text-left cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">tune</span>
                  <span>{t('matchingRules', 'Peraturan Algoritma')}</span>
                </button>
              </>
            )}

            {/* In-App Saved Sessions Archive button */}
            {onOpenSavedSessions && (
              <button
                type="button"
                onClick={() => handleNavClick(onOpenSavedSessions)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-xl text-primary">folder_managed</span>
                  <span>{isAdmin ? t('savedSessions', 'Arkib Keputusan AI') : t('savedSessions', 'Sejarah Rekod Rasmi')}</span>
                </div>
                {savedSessionsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                    {savedSessionsCount}
                  </span>
                )}
              </button>
            )}

            {/* Dedicated Translation Language Button */}
            <button
              type="button"
              onClick={() => handleNavClick(openLanguageModal)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-xl text-primary">translate</span>
                <span>{t('translateApp', 'Terjemah Aplikasi')}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold flex items-center gap-1">
                <span>{languageInfo.flag}</span>
                <span className="uppercase">{languageInfo.code}</span>
              </span>
            </button>

            {/* Exclusive Administrator Reset Button */}
            {isAdmin && onOpenResetModal && (
              <button
                type="button"
                onClick={() => handleNavClick(onOpenResetModal)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-error hover:bg-error-container/30 transition-all text-left cursor-pointer mt-1"
                title={t('systemReset', 'Pusat Set Semula')}
              >
                <span className="material-symbols-outlined text-xl">restart_alt</span>
                <span>{t('systemReset', 'Pusat Reset (Admin)')}</span>
              </button>
            )}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-3">
          {/* Admin Publish Toggle Control */}
          {isAdmin && onTogglePublish && (
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface">
                  {t('published', 'Penerbitan Keputusan')}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    matchesPublished ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                ></span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-tight">
                {matchesPublished
                  ? (t('published', 'Diterbitkan') + ' - Peserta boleh melihat keputusan.')
                  : (t('draft', 'Draf') + ' - Belum diterbitkan kepada peserta.')}
              </p>
              <button
                type="button"
                onClick={onTogglePublish}
                className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  matchesPublished
                    ? 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface'
                    : 'bg-primary text-on-primary hover:opacity-95 shadow-xs'
                }`}
              >
                {matchesPublished ? 'Tarik Balik Penerbitan' : 'Terbitkan Kepada Peserta'}
              </button>
            </div>
          )}

          {/* Discreet Security Module */}
          <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1 border border-outline-variant/15">
            <div className="flex items-center gap-1.5 text-primary">
              <span className="material-symbols-outlined text-sm">lock</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Privasi Terjamin
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              {isAdmin
                ? 'Sistem penganjur berkuasa AI dengan perlindungan penuh kerahsiaan acara.'
                : 'Data anda dilindungi dan diproses mengikut piawaian kerahsiaan acara.'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
