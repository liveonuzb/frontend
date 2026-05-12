import { create } from "zustand";
import { persist } from "zustand/middleware";
import i18n from "@/lib/i18n";

const DOCUMENT_TITLES = {
  en: "LiveOn - AI meal and workout plan in 60 seconds",
  ru: "LiveOn - AI-план питания и тренировок за 60 секунд",
  uz: "LiveOn - 60 soniyada AI ovqatlanish va mashg'ulot rejasi",
};

const syncLanguage = (language) => {
  if (!language) {
    return;
  }

  void i18n.changeLanguage(language);

  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
    document.title = DOCUMENT_TITLES[language] ?? DOCUMENT_TITLES.uz;
  }
};

const useLanguageStore = create()(
  persist(
    (set) => ({
      currentLanguage: "uz",
      hasSelectedLanguage: false,
      setCurrentLanguage: (language) => {
        set({ currentLanguage: language, hasSelectedLanguage: true });
        syncLanguage(language);
      },
    }),
    {
      name: "language-storage",
      onRehydrateStorage: () => (state) => {
        syncLanguage(state?.currentLanguage);
      },
    },
  ),
);

export default useLanguageStore;
