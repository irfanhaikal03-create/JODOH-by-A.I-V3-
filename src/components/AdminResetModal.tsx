import React, { useState } from 'react';

interface AdminResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetActiveMatches: () => void;
  onResetSavedSessions: () => void;
  onResetParticipantsToDefault: () => void;
  onFullSystemReset: () => void;
}

export const AdminResetModal: React.FC<AdminResetModalProps> = ({
  isOpen,
  onClose,
  onResetActiveMatches,
  onResetSavedSessions,
  onResetParticipantsToDefault,
  onFullSystemReset,
}) => {
  const [selectedAction, setSelectedAction] = useState<
    'matches' | 'sessions' | 'participants' | 'all' | null
  >(null);
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const handleExecute = () => {
    if (selectedAction === 'matches') {
      onResetActiveMatches();
      onClose();
    } else if (selectedAction === 'sessions') {
      onResetSavedSessions();
      onClose();
    } else if (selectedAction === 'participants') {
      onResetParticipantsToDefault();
      onClose();
    } else if (selectedAction === 'all') {
      onFullSystemReset();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-scrim/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-error/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">restart_alt</span>
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-on-surface flex items-center gap-2">
                <span>Pusat Set Semula (Admin Reset)</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-error/10 text-error">
                  Eksklusif Admin
                </span>
              </h2>
              <p className="text-xs text-on-surface-variant">
                Pilih bahagian data yang ingin diset semula dengan selamat.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Sebagai <strong>Administrator</strong>, anda mempunyai kawalan penuh untuk menetapkan semula data bila-bila masa. Sila pilih jenis reset yang ingin dilakukan:
          </p>

          <div className="space-y-2.5">
            {/* Option 1: Reset Active Matches */}
            <div
              onClick={() => setSelectedAction('matches')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                selectedAction === 'matches'
                  ? 'border-primary bg-primary/5 shadow-2xs'
                  : 'border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-low/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-xl">psychology_alt</span>
                <div className="flex-1">
                  <h4 className="font-bold text-xs sm:text-sm text-on-surface">
                    Kosongkan Keputusan AI Semasa
                  </h4>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                    Mengosongkan paparan 10 padanan AI yang sedang aktif supaya anda boleh menjana padanan serba baharu. Rekod arkib tersimpan dan calon tidak akan dipadamkan.
                  </p>
                </div>
              </div>
            </div>

            {/* Option 2: Reset Saved Sessions Archive */}
            <div
              onClick={() => setSelectedAction('sessions')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                selectedAction === 'sessions'
                  ? 'border-primary bg-primary/5 shadow-2xs'
                  : 'border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-low/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-600 text-xl">folder_delete</span>
                <div className="flex-1">
                  <h4 className="font-bold text-xs sm:text-sm text-on-surface">
                    Padam Semua Rekod Arkib & Draf Tersimpan
                  </h4>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                    Memadamkan semua sesi keputusan AI yang telah disimpan dalam aplikasi dan membatalkan status terbitan kepada peserta.
                  </p>
                </div>
              </div>
            </div>

            {/* Option 3: Reset Participants to Default */}
            <div
              onClick={() => setSelectedAction('participants')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                selectedAction === 'participants'
                  ? 'border-primary bg-primary/5 shadow-2xs'
                  : 'border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-low/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-xl">groups</span>
                <div className="flex-1">
                  <h4 className="font-bold text-xs sm:text-sm text-on-surface">
                    Kembalikan Senarai Calon Peserta ke Asal (Default Cohort)
                  </h4>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                    Memulihkan senarai kohort asal peserta eksekutif yang lengkap dengan data demografi seimbang.
                  </p>
                </div>
              </div>
            </div>

            {/* Option 4: Full System Reset */}
            <div
              onClick={() => setSelectedAction('all')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                selectedAction === 'all'
                  ? 'border-error bg-error/5 shadow-2xs'
                  : 'border-outline-variant/30 hover:border-error/40 hover:bg-error/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-error text-xl">auto_delete</span>
                <div className="flex-1">
                  <h4 className="font-bold text-xs sm:text-sm text-error">
                    Set Semula Penuh Sistem (Full Factory Reset)
                  </h4>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                    Membersihkan semua keputusan semasa, arkib pemadanan, dan mengembalikan semula peserta ke senarai permulaan rasmi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-outline-variant/20 bg-surface-container-low/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={!selectedAction}
            onClick={handleExecute}
            className="px-5 py-2 rounded-xl bg-error text-on-error text-xs font-bold shadow-sm hover:opacity-95 active:scale-98 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">restart_alt</span>
            <span>Sahkan & Laksanakan Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
