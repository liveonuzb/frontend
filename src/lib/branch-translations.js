import { values, toPairs, map, filter, find, uniq, compact, first } from "lodash";
const normalizeText = (value) => String(value ?? "").trim();

export const resolveTranslatedBranchText = (
  translations,
  fallback,
  language,
) => {
  if (
    translations &&
    typeof translations === "object" &&
    !Array.isArray(translations)
  ) {
    const direct = normalizeText(translations[language]);
    if (direct) {
      return direct;
    }

    const uz = normalizeText(translations.uz);
    if (uz) {
      return uz;
    }

    const firstVal = find(values(translations), (value) => typeof value === "string" && normalizeText(value));
    if (typeof firstVal === "string" && normalizeText(firstVal)) {
      return normalizeText(firstVal);
    }
  }

  return normalizeText(fallback);
};

export const cleanBranchTranslations = (translations = {}) =>
  Object.fromEntries(
    filter(
      map(toPairs(translations), ([key, value]) => [normalizeText(key).toLowerCase(), normalizeText(value)]),
      ([key, value]) => Boolean(key) && Boolean(value),
    ),
  );

export const countFilledBranchTranslations = (translations = {}) =>
  filter(values(translations), (value) => typeof value === "string" && normalizeText(value)).length;

export const mergeBranchTranslationValue = (
  translations,
  language,
  value,
) => {
  const next = cleanBranchTranslations(translations);
  const normalized = normalizeText(value);

  if (normalized) {
    next[normalizeText(language).toLowerCase()] = normalized;
  } else {
    delete next[normalizeText(language).toLowerCase()];
  }

  return next;
};

export const getTranslatedBranchName = (branch, language) =>
  resolveTranslatedBranchText(branch?.nameTranslations, branch?.name, language);

export const getTranslatedBranchAddressLine = (branch, language) =>
  resolveTranslatedBranchText(
    branch?.addressLineTranslations,
    branch?.addressLine,
    language,
  );

export const getBranchPhoneNumbers = (branch) => {
  const phoneValues = Array.isArray(branch?.phoneNumbers) ? branch.phoneNumbers : [];

  return compact(map(uniq([...phoneValues, branch?.phone]), (value) => normalizeText(value)));
};

export const getPrimaryBranchPhone = (branch) =>
  first(getBranchPhoneNumbers(branch)) || "";
