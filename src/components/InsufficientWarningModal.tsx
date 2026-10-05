import React from 'react';

interface InsufficientWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddParticipants: () => void;
}

export const InsufficientWarningModal: React.FC<InsufficientWarningModalProps> = ({
  isOpen,
  onClose,
  onAddParticipants,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-inverse-surface/40 backdrop-blur-sm">
      <div className="w-full max-w-md p-space-lg rounded-2xl bg-surface-container-lowest shadow-2xl flex flex-col gap-space-md border border-outline-variant/30">
        <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl">warning</span>
        </div>

        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-2">
            <h4 className="font-headline-sm text-headline-sm text-on-surface font-serif font-semibold">
              Insufficient Candidates Pool
            </h4>
            <span className="px-space-xs py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm font-bold">
              PRD F04
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Requires at least 1 male and 1 female participant to generate matches. Please return to the Participants Pool to add more attendees.
          </p>
        </div>

        <div className="flex items-center justify-end gap-space-sm mt-space-sm">
          <button
            type="button"
            onClick={onClose}
            className="px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md cursor-pointer font-semibold hover:bg-surface-container transition-all"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onAddParticipants();
            }}
            className="px-space-md py-space-sm rounded-lg bg-primary-container text-on-primary font-label-md text-label-md shadow-sm cursor-pointer font-bold hover:opacity-90 transition-all"
          >
            Add Participants
          </button>
        </div>
      </div>
    </div>
  );
};
