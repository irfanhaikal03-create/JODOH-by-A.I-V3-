import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { POPULAR_LANGUAGES, LanguageOption } from '../i18n/languages';

export const LanguageModal: React.FC = () => {
  const {
    currentLanguage,
    languageInfo,
    isLanguageModalOpen,
    closeLanguageModal,
    setLanguage,
    t,
    isTranslating,
  } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [isApplyingCustom, setIsApplyingCustom] = useState(false);

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_LANGUAGES;
    const q = searchQuery.toLowerCase().trim();
    return POPULAR_LANGUAGES.filter(
      l =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (!isLanguageModalOpen) return null;

  const handleSelectLanguage = async (code: string) => {
    await setLanguage(code);
    closeLanguageModal();
  };

  const handleApplyCustomLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    setIsApplyingCustom(true);
    try {
      await setLanguage(customInput.trim());
      setCustomInput('');
      closeLanguageModal();
    } finally {
      setIsApplyingCustom(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-modal-title"
    >
      <div className="bg-surface-container-lowest text-on-surface rounded-2xl max-w-xl w-full border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-outline-variant/20 flex items-center justify-between shrink-0 bg-surface-container-low/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">translate</span>
            </div>
            <div>
              <h2 id="language-modal-title" className="font-serif font-bold text-lg sm:text-xl text-primary leading-tight">
                {t('selectLanguage', 'Pilih Bahasa')}
              </h2>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                {t('onlyOneLanguageNote', 'Satu bahasa aktif pada satu masa untuk ketekalan antaramuka.')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeLanguageModal}
            className="w-8 h-8 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Tutup modal"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Current Active Language Pill */}
        <div className="px-4 sm:px-6 py-3 bg-primary-fixed/25 border-b border-primary/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              {t('activeLanguage', 'Bahasa Aktif')}:
            </span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest text-primary text-xs font-bold shadow-2xs border border-primary/20">
              <span className="text-sm">{languageInfo.flag}</span>
              <span>{languageInfo.nativeName} ({languageInfo.name})</span>
            </div>
          </div>

          {isTranslating && (
            <div className="flex items-center gap-1.5 text-xs text-primary font-semibold animate-pulse">
              <span className="material-symbols-outlined text-sm animate-spin">sync</span>
              <span>{t('translating', 'Menterjemah...')}</span>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="p-4 sm:p-6 pb-2 shrink-0">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('searchLanguage', 'Cari bahasa pilihan...')}
              className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-sm">clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Languages Grid */}
        <div className="p-4 sm:p-6 pt-2 overflow-y-auto flex-1 space-y-4">
          <div>
            <span className="text-[11px] font-bold text-outline uppercase tracking-wider mb-2 block">
              Bahasa Utama / Popular Languages
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredLanguages.map(lang => {
                const isActive = currentLanguage.toLowerCase() === lang.code.toLowerCase();
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer group ${
                      isActive
                        ? 'bg-primary text-on-primary border-primary shadow-xs'
                        : 'bg-surface-container-low/70 border-outline-variant/20 hover:bg-surface-container hover:border-outline-variant/60 text-on-surface'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{lang.flag}</span>
                      <div className="truncate">
                        <span className="text-xs sm:text-sm font-bold block truncate">
                          {lang.nativeName}
                        </span>
                        <span
                          className={`text-[11px] block truncate ${
                            isActive ? 'text-on-primary/80' : 'text-on-surface-variant'
                          }`}
                        >
                          {lang.name}
                        </span>
                      </div>
                    </div>

                    {isActive && (
                      <span className="material-symbols-outlined text-lg shrink-0 text-on-primary">
                        check_circle
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {filteredLanguages.length === 0 && (
              <div className="text-center py-6 text-on-surface-variant text-xs">
                Tiada bahasa ditemui dalam senarai popular. Anda boleh memasukkan nama bahasa di bawah.
              </div>
            )}
          </div>

          {/* Custom Language Section */}
          <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/25">
            <div className="flex items-start gap-2.5 mb-2">
              <span className="material-symbols-outlined text-primary text-lg mt-0.5 shrink-0">
                language
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-on-surface">
                  {t('customLanguage', 'Terjemah ke Mana-mana Bahasa')}
                </h3>
                <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                  {t(
                    'customLanguageDesc',
                    'Masukkan nama bahasa yang anda inginkan untuk menukar keseluruhan sistem ke bahasa tersebut.'
                  )}
                </p>
              </div>
            </div>

            <form onSubmit={handleApplyCustomLanguage} className="flex gap-2 mt-3">
              <input
                type="text"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                placeholder={t('customLanguagePlaceholder', 'Nama bahasa (cth: Swedish, French, Spanish)...')}
                className="flex-1 px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/30 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="submit"
                disabled={!customInput.trim() || isApplyingCustom}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap shadow-xs"
              >
                {isApplyingCustom ? t('loading', 'Memproses...') : t('applyLanguage', 'Gunakan Bahasa')}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant/20 bg-surface-container-low/50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={closeLanguageModal}
            className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            {t('close', 'Tutup')}
          </button>
        </div>
      </div>
    </div>
  );
};
