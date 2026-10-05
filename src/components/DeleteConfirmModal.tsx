import React from 'react';
import { Participant } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  participant: Participant | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  participant,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !participant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-inverse-surface/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-md p-space-lg flex flex-col border border-outline-variant/30">
        <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mb-space-md">
          <span className="material-symbols-outlined text-2xl">delete_forever</span>
        </div>

        <h3 className="font-headline-sm text-headline-sm text-on-surface font-serif font-semibold">
          Remove Participant?
        </h3>

        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 mb-space-lg leading-relaxed">
          Are you sure you want to permanently delete <strong className="text-on-surface">"{participant.name}"</strong> ({participant.gender}, {participant.age}) from the candidate pool? This action will invalidate current pairing permutations.
        </p>

        <div className="flex items-center justify-end gap-space-sm">
          <button
            type="button"
            onClick={onClose}
            className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-all cursor-pointer font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-space-lg py-2 rounded-lg bg-error text-on-error font-label-md text-label-md shadow-sm hover:opacity-90 transition-all font-bold cursor-pointer"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};
