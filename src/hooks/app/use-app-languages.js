import React from "react";
import { get } from "lodash";
import { useGetQuery } from "@/hooks/api";

export const APP_LANGUAGES_QUERY_KEY = ["languages"];

const FALLBACK_LANGUAGES = [
  { id: "uz", code: "uz", name: "O'zbekcha", flag: "🇺🇿", isActive: true },
  { id: "en", code: "en", name: "English", flag: "🇺🇸", isActive: true },
  { id: "ru", code: "ru", name: "Русский", flag: "🇷🇺", isActive: true },
];

const useAppLanguages = () => {
  const { data, ...query } = useGetQuery({
    url: "/languages",
    queryProps: {
      queryKey: APP_LANGUAGES_QUERY_KEY,
    },
  });

  const responseLanguages = React.useMemo(() => get(data, "data", []), [data]);

  const languages = React.useMemo(() => {
    if (Array.isArray(responseLanguages) && responseLanguages.length > 0) {
      return responseLanguages;
    }

    return FALLBACK_LANGUAGES;
  }, [responseLanguages]);

  return {
    ...query,
    languages,
  };
};

export default useAppLanguages;
