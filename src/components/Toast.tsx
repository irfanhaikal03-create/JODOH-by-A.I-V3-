import React from 'react';

interface ToastProps {
  message: string | null;
  isError?: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, isError = false }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 transform translate-y-0 opacity-100 transition-all duration-300 pointer-events-none flex items-center gap-space-sm px-space-md py-space-sm rounded-xl bg-surface-container-lowest text-on-surface shadow-2xl border border-outline-variant/30">
      <span
        className={`material-symbols-outlined ${
          isError ? 'text-error' : 'text-secondary'
        }`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {isError ? 'error' : 'check_circle'}
      </span>
      <span className="font-label-md text-label-md font-semibold text-on-surface">
        {message}
      </span>
    </div>
  );
};
