import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  POPULAR_LANGUAGES,
  STATIC_DICTIONARIES,
  LanguageOption,
  TranslationKey,
} from '../i18n/languages';

const STORAGE_LANG = 'jodoh_selected_language';
const STORAGE_CUSTOM_TRANSLATIONS = 'jodoh_custom_i18n_cache';

interface LanguageContextType {
  currentLanguage: string;
  languageInfo: LanguageOption;
  allLanguages: LanguageOption[];
  isTranslating: boolean;
  isLanguageModalOpen: boolean;
  openLanguageModal: () => void;
  closeLanguageModal: () => void;
  setLanguage: (langCodeOrName: string) => Promise<void>;
  t: (key: TranslationKey | string, fallback?: string) => string;
  translateText: (text: string) => string;
  translateGender: (gender?: string) => string;
  translateMarital: (marital?: string) => string;
  translateSmoking: (smoking?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_LANG);
      if (stored) return stored;
    } catch (e) {}
    return 'ms'; // Default to Malay
  });

  const [customTranslations, setCustomTranslations] = useState<Record<string, Record<string, string>>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CUSTOM_TRANSLATIONS);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {};
  });

  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState<boolean>(false);

  // Compute language metadata
  const languageInfo = useMemo<LanguageOption>(() => {
    const found = POPULAR_LANGUAGES.find(
      l => l.code.toLowerCase() === currentLanguage.toLowerCase() ||
           l.name.toLowerCase() === currentLanguage.toLowerCase()
    );
    if (found) return found;

    return {
      code: currentLanguage,
      name: currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1),
      nativeName: currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1),
      flag: '🌐',
    };
  }, [currentLanguage]);

  // Translate key
  const t = (key: TranslationKey | string, fallback?: string): string => {
    const lang = currentLanguage.toLowerCase();

    // 1. Check custom cached translations
    if (customTranslations[lang] && customTranslations[lang][key]) {
      return customTranslations[lang][key];
    }

    // 2. Check static dictionaries
    if (STATIC_DICTIONARIES[lang] && STATIC_DICTIONARIES[lang][key as TranslationKey]) {
      return STATIC_DICTIONARIES[lang][key as TranslationKey];
    }

    // 3. Fallback to English dictionary
    if (STATIC_DICTIONARIES.en && STATIC_DICTIONARIES.en[key as TranslationKey]) {
      return STATIC_DICTIONARIES.en[key as TranslationKey];
    }

    // 4. Return provided fallback or key itself
    return fallback || key;
  };

  // Helper translations for common candidate attributes
  const translateGender = (gender?: string): string => {
    if (!gender) return '';
    const clean = gender.toLowerCase().trim();
    if (clean === 'male' || clean === 'lelaki') return t('male', 'Lelaki');
    if (clean === 'female' || clean === 'wanita') return t('female', 'Wanita');
    return gender;
  };

  const translateMarital = (marital?: string): string => {
    if (!marital) return '';
    const clean = marital.toLowerCase().trim();
    if (clean === 'single' || clean === 'bujang') return t('single', 'Bujang');
    if (clean === 'divorced' || clean === 'bercerai') return t('divorced', 'Bercerai');
    if (clean === 'widowed' || clean === 'kematian pasangan') return t('widowed', 'Kematian Pasangan');
    return marital;
  };

  const translateSmoking = (smoking?: string): string => {
    if (!smoking) return '';
    const clean = smoking.toLowerCase().trim();
    if (clean.includes('non') || clean.includes('bukan')) return t('nonSmoker', 'Bukan Perokok');
    if (clean.includes('smoker') || clean.includes('perokok')) return t('smoker', 'Perokok');
    return smoking;
  };

  const translateText = (text: string): string => {
    if (!text) return '';
    const lang = currentLanguage.toLowerCase();
    if (customTranslations[lang] && customTranslations[lang][text]) {
      return customTranslations[lang][text];
    }
    return text;
  };

  // Switch Language
  const setLanguage = async (langCodeOrName: string) => {
    const clean = langCodeOrName.trim();
    if (!clean) return;

    const matched = POPULAR_LANGUAGES.find(
      l => l.code.toLowerCase() === clean.toLowerCase() ||
           l.name.toLowerCase() === clean.toLowerCase() ||
           l.nativeName.toLowerCase() === clean.toLowerCase()
    );

    const targetCode = matched ? matched.code : clean.toLowerCase();

    // Set active single language immediately
    setCurrentLanguageState(targetCode);
    try {
      localStorage.setItem(STORAGE_LANG, targetCode);
    } catch (e) {}

    // If it's a custom language not covered in static dictionary, fetch dynamic translations
    if (!STATIC_DICTIONARIES[targetCode] && !customTranslations[targetCode]) {
      setIsTranslating(true);
      try {
        const sourceDict = STATIC_DICTIONARIES.en;
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetLanguage: matched ? matched.name : clean,
            texts: sourceDict,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.translated && typeof data.translated === 'object') {
            const updated = {
              ...customTranslations,
              [targetCode]: data.translated,
            };
            setCustomTranslations(updated);
            try {
              localStorage.setItem(STORAGE_CUSTOM_TRANSLATIONS, JSON.stringify(updated));
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn('Dynamic language translation warning:', err);
      } finally {
        setIsTranslating(false);
      }
    }
  };

  const openLanguageModal = () => setIsLanguageModalOpen(true);
  const closeLanguageModal = () => setIsLanguageModalOpen(false);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        languageInfo,
        allLanguages: POPULAR_LANGUAGES,
        isTranslating,
        isLanguageModalOpen,
        openLanguageModal,
        closeLanguageModal,
        setLanguage,
        t,
        translateText,
        translateGender,
        translateMarital,
        translateSmoking,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
