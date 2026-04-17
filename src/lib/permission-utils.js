export const PERMISSION_DOMAIN_OPTIONS = [
  { value: "platform", label: "Platform" },
];

export const getPermissionTranslation = (translations, language = "uz") => {
  if (!translations || typeof translations !== "object") {
    return "";
  }

  return (
    translations[language] ||
    translations.uz ||
    translations.ru ||
    translations.en ||
    ""
  );
};

export const normalizePermissionDomain = (value = "") => value.toLowerCase();
