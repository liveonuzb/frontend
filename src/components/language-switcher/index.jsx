import { filter, some, find, first } from "lodash";
import React from "react";
import { useLanguageStore } from "@/store";
import useAppLanguages from "@/hooks/app/use-app-languages";
import LanguageDrawerPicker from "@/components/language-drawer-picker";

const LanguageSwitcher = ({ className, compact = false }) => {
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const setCurrentLanguage = useLanguageStore(
    (state) => state.setCurrentLanguage,
  );
  const { languages } = useAppLanguages();

  const activeLanguages = React.useMemo(
    () => filter(languages, (language) => language.isActive !== false),
    [languages],
  );

  React.useEffect(() => {
    if (!activeLanguages.length) {
      return;
    }

    const hasCurrentLanguage = some(
      activeLanguages,
      (language) => language.code === currentLanguage,
    );

    if (!hasCurrentLanguage) {
      setCurrentLanguage(first(activeLanguages).code);
    }
  }, [activeLanguages, currentLanguage, setCurrentLanguage]);

  const resolvedLanguage =
    find(activeLanguages, (language) => language.code === currentLanguage) ||
    first(activeLanguages);

  return (
    <LanguageDrawerPicker
      ariaLabel="Til tanlash"
      className={className}
      compact={compact}
      languages={activeLanguages}
      onValueChange={setCurrentLanguage}
      value={resolvedLanguage?.code || currentLanguage}
    />
  );
};

export default LanguageSwitcher;
