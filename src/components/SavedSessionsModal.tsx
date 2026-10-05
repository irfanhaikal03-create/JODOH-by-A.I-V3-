import React, { useState } from 'react';
import { SavedMatchSession, MatchResult } from '../types';

interface SavedSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SavedMatchSession[];
  onLoadSession: (session: SavedMatchSession) => void;
  onTogglePublishSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  isAdmin: boolean;
  currentParticipantName?: string;
  currentUserParticipantId?: string;
  activeSessionId?: string;
  onSaveCurrentMatches?: () => void;
  hasActiveMatches?: boolean;
}

export const SavedSessionsModal: React.FC<SavedSessionsModalProps> = ({
  isOpen,
  onClose,
  sessions,
  onLoadSession,
  onTogglePublishSession,
  onDeleteSession,
  isAdmin,
  currentParticipantName,
  currentUserParticipantId,
  activeSessionId,
  onSaveCurrentMatches,
  hasActiveMatches,
}) => {
  const [selectedSessionForPreview, setSelectedSessionForPreview] = useState<SavedMatchSession | null>(null);

  if (!isOpen) return null;

  // For participants: only show published sessions
  const visibleSessions = isAdmin
    ? sessions
    : sessions.filter(s => s.isPublished);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('ms-MY', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Find if current participant is in a given session
  const findParticipantMatch = (matches: MatchResult[]) => {
    if (!currentParticipantName && !currentUserParticipantId) return null;
    const nameLower = (currentParticipantName || '').toLowerCase();
    return matches.find(
      m =>
        (nameLower && (m.maleName.toLowerCase().includes(nameLower) || m.femaleName.toLowerCase().includes(nameLower))) ||
        (currentUserParticipantId && (m.maleId === currentUserParticipantId || m.femaleId === currentUserParticipantId))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-scrim/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">folder_managed</span>
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-on-surface flex items-center gap-2">
                <span>{isAdmin ? 'Arkib Keputusan Pemadanan AI' : 'Sejarah Rekod Padanan AI'}</span>
                <span className="text-xs font-sans font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {visibleSessions.length} Rekod Tersimpan
                </span>
              </h2>
              <p className="text-xs text-on-surface-variant">
                {isAdmin
                  ? 'Keputusan disimpan terus dalam aplikasi. Mod draf hanya boleh dilihat oleh admin sehingga diterbitkan.'
                  : 'Senarai sesi keputusan rasmi yang telah diterbitkan oleh penganjur acara.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onSaveCurrentMatches && hasActiveMatches && (
              <button
                type="button"
                onClick={onSaveCurrentMatches}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-on-primary hover:opacity-90 transition-all shadow-xs cursor-pointer"
                title="Simpan keputusan yang sedang dipaparkan sekarang"
              >
                <span className="material-symbols-outlined text-base">bookmark_add</span>
                <span>Simpan Sesi Semasa</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {visibleSessions.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-low/30">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">folder_off</span>
              <h3 className="font-serif font-bold text-on-surface text-base">
                {isAdmin ? 'Tiada Sesi Tersimpan Dalam Arkib' : 'Tiada Sejarah Rekod Diterbitkan Lagi'}
              </h3>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto mt-1 mb-4">
                {isAdmin
                  ? 'Anda boleh menyimpan mana-mana keputusan Top 10 padanan AI terus ke dalam aplikasi ini menggunakan butang "Simpan ke Arkib". Keputusan disimpan sebagai draf peribadi admin terlebih dahulu.'
                  : 'Pihak penganjur belum menerbitkan sebarang rekod sesi keputusan pemadanan AI rasmi setakat ini.'}
              </p>
              {isAdmin && onSaveCurrentMatches && hasActiveMatches && (
                <button
                  type="button"
                  onClick={onSaveCurrentMatches}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-sm hover:opacity-95 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">bookmark_add</span>
                  <span>Simpan Keputusan Semasa Sekarang</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {visibleSessions.map(session => {
                const isActive = session.id === activeSessionId;
                const userMatch = !isAdmin ? findParticipantMatch(session.matches) : null;

                return (
                  <div
                    key={session.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-outline-variant/30 bg-surface-container-lowest hover:border-outline-variant hover:bg-surface-container-low/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left Details */}
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            session.isPublished
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xl">
                            {session.isPublished ? 'verified' : 'lock'}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm sm:text-base text-on-surface">
                              {session.title}
                            </h4>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold">
                                Sedang Aktif
                              </span>
                            )}
                            {session.isPublished ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">visibility</span>
                                Diterbitkan (Peserta Boleh Tengok)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">lock</span>
                                Draf Sulit (Hanya Admin)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">schedule</span>
                              {formatDate(session.createdAt)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">favorite</span>
                              {session.matches.length} Pasangan
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">groups</span>
                              {session.participantsCount} Calon Terlibat
                            </span>
                          </div>

                          {/* Participant match highlight in this session */}
                          {!isAdmin && userMatch && (
                            <div className="mt-2 p-2 rounded-lg bg-emerald-50 text-emerald-900 text-xs font-medium border border-emerald-200 flex items-center gap-2">
                              <span>💍</span>
                              <span>
                                Anda dipadankan dalam sesi ini bersama <strong>{userMatch.maleName.includes(currentParticipantName || '') ? userMatch.femaleName : userMatch.maleName}</strong> (Skor: {userMatch.score}%)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {isAdmin && onTogglePublishSession && (
                          <button
                            type="button"
                            onClick={() => onTogglePublishSession(session.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                              session.isPublished
                                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            }`}
                            title={session.isPublished ? 'Tukar ke status Draf peribadi' : 'Terbitkan kepada peserta'}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {session.isPublished ? 'lock' : 'send'}
                            </span>
                            <span>{session.isPublished ? 'Tarik Balik (Draf)' : 'Terbitkan'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            onLoadSession(session);
                            onClose();
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            isActive
                              ? 'bg-surface-container text-on-surface'
                              : 'bg-primary text-on-primary hover:opacity-95 shadow-2xs'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          <span>{isActive ? 'Sedang Dipapar' : 'Buka & Papar'}</span>
                        </button>

                        {isAdmin && onDeleteSession && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Adakah anda pasti mahu memadam rekod "${session.title}" daripada arkib aplikasi?`)) {
                                onDeleteSession(session.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error/10 transition-all cursor-pointer"
                            title="Padam rekod sesi dari arkib"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-outline-variant/20 bg-surface-container-low/30 flex items-center justify-between text-xs text-on-surface-variant">
          <span>
            {isAdmin
              ? '💡 Tip: Keputusan yang disimpan sebagai draf membolehkan admin menyemak kualiti padanan sebelum diterbitkan.'
              : 'Semua rekod di arkibkan secara rasmi oleh penganjur acara.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
