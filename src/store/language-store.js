import { create } from "zustand";
import { persist } from "zustand/middleware";
import i18n from "@/lib/i18n";

const useLanguageStore = create()(
  persist(
    (set) => ({
      currentLanguage: "uz",
      hasSelectedLanguage: false,
      setCurrentLanguage: (language) => {
        set({ currentLanguage: language, hasSelectedLanguage: true });
        void i18n.changeLanguage(language);
      },
    }),
    {
      name: "language-storage",
    },
  ),
);

export default useLanguageStore;
