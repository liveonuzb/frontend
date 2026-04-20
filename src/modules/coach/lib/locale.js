import useLanguageStore from "@/store/language-store";

const LANGUAGE_TO_LOCALE = {
  uz: "uz-UZ",
  ru: "ru-RU",
  en: "en-US",
};

const RELATIVE_TIME_UNITS = [
  { limit: 60, unit: "second", divisor: 1 },
  { limit: 60 * 60, unit: "minute", divisor: 60 },
  { limit: 60 * 60 * 24, unit: "hour", divisor: 60 * 60 },
  { limit: 60 * 60 * 24 * 7, unit: "day", divisor: 60 * 60 * 24 },
  { limit: 60 * 60 * 24 * 30, unit: "week", divisor: 60 * 60 * 24 * 7 },
  { limit: 60 * 60 * 24 * 365, unit: "month", divisor: 60 * 60 * 24 * 30 },
  { limit: Number.POSITIVE_INFINITY, unit: "year", divisor: 60 * 60 * 24 * 365 },
];

const resolveLocale = (language = "uz") =>
  LANGUAGE_TO_LOCALE[language] || LANGUAGE_TO_LOCALE.uz;

export const resolveLabel = (translations, fallback = "", language = "uz") => {
  if (translations && typeof translations === "object") {
    const direct = String(translations[language] || "").trim();
    if (direct) {
      return direct;
    }

    const uz = String(translations.uz || "").trim();
    if (uz) {
      return uz;
    }

    const firstTranslation = Object.values(translations).find((value) =>
      String(value || "").trim(),
    );

    if (firstTranslation) {
      return String(firstTranslation).trim();
    }
  }

  return fallback;
};

export const useCurrentLanguage = () =>
  useLanguageStore((state) => state.currentLanguage);

export const formatCurrency = (
  value,
  { language = "uz", currency = "UZS", ...options } = {},
) => {
  const normalizedValue = Number(value);
  const safeValue = Number.isFinite(normalizedValue) ? normalizedValue : 0;

  return new Intl.NumberFormat(resolveLocale(language), {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "UZS" ? 0 : 2,
    ...options,
  }).format(safeValue);
};

export const formatRelativeTime = (
  value,
  { language = "uz", now = Date.now(), fallback = "—" } = {},
) => {
  if (!value) {
    return fallback;
  }

  const targetTime = new Date(value).getTime();
  if (Number.isNaN(targetTime)) {
    return fallback;
  }

  const elapsedSeconds = Math.round((targetTime - now) / 1000);
  const formatter = new Intl.RelativeTimeFormat(resolveLocale(language), {
    numeric: "auto",
  });

  const absoluteSeconds = Math.abs(elapsedSeconds);
  const relativeUnit =
    RELATIVE_TIME_UNITS.find(({ limit }) => absoluteSeconds < limit) ||
    RELATIVE_TIME_UNITS[RELATIVE_TIME_UNITS.length - 1];

  return formatter.format(
    Math.round(elapsedSeconds / relativeUnit.divisor),
    relativeUnit.unit,
  );
};

export default {
  resolveLabel,
  useCurrentLanguage,
  formatCurrency,
  formatRelativeTime,
};
