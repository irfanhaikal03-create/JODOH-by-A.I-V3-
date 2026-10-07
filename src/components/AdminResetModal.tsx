import React, { useState } from 'react';

interface AdminResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetActiveMatches: () => void;
  onResetSavedSessions: () => void;
  onClearAllParticipants: () => void;
  onResetParticipantsToDefault: () => void;
  onFullSystemReset: () => void;
}

export const AdminResetModal: React.FC<AdminResetModalProps> = ({
  isOpen,
  onClose,
  onResetActiveMatches,
  onResetSavedSessions,
  onClearAllParticipants,
  onResetParticipantsToDefault,
  onFullSystemReset,
}) => {
  const [selectedAction, setSelectedAction] = useState<
    'matches' | 'sessions' | 'clear-participants' | 'participants' | 'all' | null
  >(null);

  if (!isOpen) return null;

  const handleExecute = () => {
    if (selectedAction === 'matches') {
      onResetActiveMatches();
      onClose();
    } else if (selectedAction === 'sessions') {
      onResetSavedSessions();
      onClose();
    } else if (selectedAction === 'clear-participants') {
      onClearAllParticipants();
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
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-error/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">restart_alt</span>
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-on-surface flex items-center gap-2">
                <span>Pusat Set Semula & Sinkronisasi (Admin Reset)</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-error/10 text-error">
                  Eksklusif Admin
                </span>
              </h2>
              <p className="text-xs text-on-surface-variant">
                Tindakan ini akan dikemas kini serta-merta ke Cloud Firestore dan semua peranti pengguna.
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
        <div className="p-5 sm:p-6 space-y-3.5 overflow-y-auto">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Sebagai <strong>Administrator</strong>, anda mempunyai kawalan penuh untuk menyelaraskan data pangkalan. Pilih jenis set semula yang ingin disegerakkan:
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
                <span className="material-symbols-outlined text-primary text-xl shrink-0">psychology_alt</span>
                <div className="flex-1">
                  <h4 className="font-bold text-xs sm:text-sm text-on-surface">
                    Kosongkan Keputusan Padanan AI Semasa
                  </h4>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                    Memadamkan paparan 10 padanan AI di Cloud & peranti peserta agar peserta tidak melihat keputusan lama dan bersedia untuk penjanaan baharu.
                  </p>
                </div>
              </div>
            </div>

            {/* Option 2: Clear All Participants (Empty candidate pool for live event) */}
            <div
              onClick={() => setSelectedAction('clear-participants')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                selectedAction === 'clear-participants'
                  ? 'border-error bg-error/5 shadow-2xs'
                  : 'border-outline-variant/30 hover:border-error/40 hover:bg-surface-container-low/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-error text-xl shrink-0">person_remove</span>
                <div className="flex-1">
                  <h4 className="font-bold text-xs sm:text-sm text-error">
                    Kosongkan Semua Calon Peserta (0 Peserta)
                  </h4>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                    Memadamkan seluruh rekod profil peserta di Cloud Firestore. Sesuai apabila anda ingin membuka pendaftaran acara baharu secara bersih.
                  </p>
                </div>
              </div>
            </div>

            {/* Option 3: Reset Participants to Default 20 Cohort */}
            <div
              onClick={() => setSelectedAction('participants')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                selectedAction === 'participants'
                  ? 'border-secondary bg-secondary/5 shadow-2xs'
                  : 'border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-low/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-xl shrink-0">groups</span>
                <div className="flex-1">
                  <h4 className="font-bold text-xs sm:text-sm text-on-surface">
                    Muat Semula Kohort Asal (20 Peserta Contoh Eksekutif)
                  </h4>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                    Memulihkan 20 profil contoh peserta eksekutif (10 Lelaki, 10 Wanita) lengkap dengan hobi, kerjaya, dan nilai ideal untuk ujian padanan segera.
                  </p>
                </div>
              </div>
            </div>

            {/* Option 4: Reset Saved Sessions Archive */}
            <div
              onClick={() => setSelectedAction('sessions')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                selectedAction === 'sessions'
                  ? 'border-amber-600 bg-amber-600/5 shadow-2xs'
                  : 'border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-low/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-600 text-xl shrink-0">folder_delete</span>
                <div className="flex-1">
                  <h4 className="font-bold text-xs sm:text-sm text-on-surface">
                    Padam Semua Rekod Arkib Sesi Tersimpan
                  </h4>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                    Memadamkan semua fail sesi keputusan lama yang telah disimpan dalam arkib penganjur.
                  </p>
                </div>
              </div>
            </div>

            {/* Option 5: Full System Reset */}
            <div
              onClick={() => setSelectedAction('all')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                selectedAction === 'all'
                  ? 'border-error bg-error/10 shadow-2xs'
                  : 'border-outline-variant/30 hover:border-error/40 hover:bg-error/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-error text-xl shrink-0">auto_delete</span>
                <div className="flex-1">
                  <h4 className="font-bold text-xs sm:text-sm text-error">
                    Set Semula Penuh Sistem (Full Factory Reset)
                  </h4>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                    Mengosongkan padanan semasa, memadam arkib, dan mengembalikan peserta kepada kohort asal 20 peserta contoh.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-outline-variant/20 bg-surface-container-low/40 flex items-center justify-between gap-3 shrink-0">
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
