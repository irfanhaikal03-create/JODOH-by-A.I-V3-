import React from 'react';
import { UserRole } from '../types';

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
        className={`fixed left-0 top-0 lg:top-20 bottom-0 w-72 lg:w-64 bg-surface-container-lowest shadow-2xl lg:shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 lg:z-40 flex flex-col justify-between py-space-lg px-space-md border-r border-outline-variant/20 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-space-lg">
          {/* Header Row with Close Button for Mobile */}
          <div className="flex items-center justify-between px-space-sm">
            <span className="font-label-sm text-label-sm text-outline tracking-wider uppercase font-bold">
              {isAdmin ? 'Papan Kawalan Penganjur' : 'Portal Suai Kenal'}
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

          <nav className="flex flex-col gap-space-xs">
            <button
              type="button"
              onClick={() => handleNavClick(() => onTabChange('participants-pool'))}
              className={`flex items-center gap-space-sm px-space-md py-space-sm rounded-lg font-label-md text-label-md transition-all text-left cursor-pointer ${
                activeTab === 'participants-pool'
                  ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-xl">
                {isAdmin ? 'groups' : 'person_search'}
              </span>
              <span>{isAdmin ? 'Participants Pool' : 'Direktori Peserta'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick(() => onTabChange('top-10-ai-matches'))}
              className={`flex items-center gap-space-sm px-space-md py-space-sm rounded-lg font-label-md text-label-md transition-all text-left cursor-pointer ${
                activeTab === 'top-10-ai-matches'
                  ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-xl">favorite</span>
              <span>{isAdmin ? 'AI Pairing Matrix' : 'Keputusan AI'}</span>
            </button>

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => handleNavClick(onOpenAffinityVectors)}
                  className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high hover:text-on-surface transition-all text-left cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">analytics</span>
                  <span>Vektor Keserasian</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick(onOpenMatchingRules)}
                  className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high hover:text-on-surface transition-all text-left cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">tune</span>
                  <span>Peraturan Algoritma</span>
                </button>
              </>
            )}

            {/* In-App Saved Sessions Archive button */}
            {onOpenSavedSessions && (
              <button
                type="button"
                onClick={() => handleNavClick(onOpenSavedSessions)}
                className="flex items-center justify-between px-space-md py-space-sm rounded-lg text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high hover:text-on-surface transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-xl text-primary">folder_managed</span>
                  <span>{isAdmin ? 'Arkib Keputusan AI' : 'Sejarah Rekod Rasmi'}</span>
                </div>
                {savedSessionsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                    {savedSessionsCount}
                  </span>
                )}
              </button>
            )}

            {/* Exclusive Administrator Reset Button */}
            {isAdmin && onOpenResetModal && (
              <button
                type="button"
                onClick={() => handleNavClick(onOpenResetModal)}
                className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-error font-label-md text-label-md hover:bg-error/10 transition-all text-left cursor-pointer mt-1"
                title="Pusat set semula data (Khas Administrator)"
              >
                <span className="material-symbols-outlined text-xl">restart_alt</span>
                <span>Pusat Reset (Admin)</span>
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
                  Penerbitan Keputusan
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    matchesPublished ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                ></span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-tight">
                {matchesPublished
                  ? 'Peserta kini boleh melihat keputusan pemadanan.'
                  : 'Keputusan belum diterbitkan kepada peserta.'}
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
          <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-xs border border-outline-variant/15">
            <div className="flex items-center gap-space-xs text-primary">
              <span className="material-symbols-outlined text-sm">lock_reset</span>
              <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider">
                Privasi Terjamin
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              {isAdmin
                ? 'Sistem penganjur berkuasa AI dengan enkripsi data dan perlindungan penuh calon.'
                : 'Data anda dilindungi dan diproses mengikut piawaian kerahsiaan acara.'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
