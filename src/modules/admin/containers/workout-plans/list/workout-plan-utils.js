import filter from "lodash/filter";
import find from "lodash/find";
import fromPairs from "lodash/fromPairs";
import isArray from "lodash/isArray";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import map from "lodash/map";
import lodashValues from "lodash/values";
import toPairs from "lodash/toPairs";
export const ITEMS_PER_PAGE = 10;
export const DIFFICULTY_OPTIONS = ["Boshlang'ich", "O'rta", "Yuqori"];
export const APPROVAL_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Review" },
  { value: "approved", label: "Tasdiqlangan" },
  { value: "rejected", label: "Rad etilgan" },
];

export const emptyForm = {
  name: "",
  description: "",
  difficulty: "O'rta",
  approvalStatus: "approved",
  approvalReason: "",
  isActive: true,
};

export function resolveText(translations, fallback, language) {
  if (translations && typeof translations === "object") {
    const direct = trim(String(translations?.[language] ?? ""));
    if (direct) return direct;

    const uzText = trim(String(translations?.uz ?? ""));
    if (uzText) return uzText;

    const firstValue = find(lodashValues(translations), (value) =>
      trim(String(value ?? "")));
    if (firstValue) {
      return trim(String(firstValue));
    }
  }

  return trim(String(fallback ?? ""));
}

export function cleanTranslations(translations = {}) {
  return fromPairs(filter(map(
    toPairs(translations),
    ([code, value]) => [code, trim(String(value ?? ""))],
  ), ([code, value]) => Boolean(code) && Boolean(value)));
}

export function countFilledTranslations(translations = {}) {
  return filter(lodashValues(translations), (value) =>
    trim(String(value ?? ""))).length;
}

export function resolveErrorMessage(error, fallback) {
  const message = error?.response?.data?.message;

  if (isArray(message)) {
    return message.join(", ");
  }

  return message || fallback;
}

export function createFormFromTemplate(template, language) {
  return {
    name: resolveText(template?.translations, template?.name ?? "", language),
    description: resolveText(
      template?.descriptionTranslations,
      template?.description ?? "",
      language,
    ),
    difficulty: template?.difficulty || "O'rta",
    approvalStatus:
      template?.approvalStatus || (template?.isActive ? "approved" : "draft"),
    approvalReason: template?.approvalReason || "",
    isActive: template?.isActive ?? true,
  };
}

export const createTranslationForm = (template, languages = []) => ({
  titles: fromPairs(map((isArray(languages) ? languages : []), (language) => [
    language.code,
    resolveText(template?.translations, template?.name ?? "", language.code),
  ])),
  descriptions: fromPairs(map((isArray(languages) ? languages : []), (language) => [
    language.code,
    resolveText(
      template?.descriptionTranslations,
      template?.description ?? "",
      language.code,
    ),
  ])),
});

export function hasCompleteTranslations(template, languageCount) {
  const titleCount = countFilledTranslations(template?.translations || {});
  const descriptionCount = countFilledTranslations(
    template?.descriptionTranslations || {},
  );
  const requiresDescription = Boolean(
    trim(String(template?.description ?? "")),
  );

  return (
    titleCount >= languageCount &&
    (!requiresDescription || descriptionCount >= languageCount)
  );
}

export function sortTemplates(templates, sortBy, sortDir, currentLanguage) {
  const collator = new Intl.Collator("uz", {
    sensitivity: "base",
    numeric: true,
  });
  const factor = sortDir === "desc" ? -1 : 1;
  const source = isArray(templates) ? templates : [];

  return [...source].sort((left, right) => {
    let result;

    switch (sortBy) {
      case "name":
        result = collator.compare(
          resolveText(left.translations, left.name, currentLanguage),
          resolveText(right.translations, right.name, currentLanguage),
        );
        break;
      case "difficulty":
        result = collator.compare(
          String(left.difficulty ?? ""),
          String(right.difficulty ?? ""),
        );
        break;
      case "daysPerWeek":
        result = toNumber(left.daysPerWeek ?? 0) - toNumber(right.daysPerWeek ?? 0);
        break;
      case "days":
        result = toNumber(left.days ?? 0) - toNumber(right.days ?? 0);
        break;
      case "approvalStatus":
        result = collator.compare(
          String(left.approvalStatus ?? ""),
          String(right.approvalStatus ?? ""),
        );
        break;
      case "version":
        result = toNumber(left.version ?? 0) - toNumber(right.version ?? 0);
        break;
      case "totalExercises":
        result =
          toNumber(left.totalExercises ?? 0) - toNumber(right.totalExercises ?? 0);
        break;
      case "isActive":
        result =
          toNumber(Boolean(left.isActive)) - toNumber(Boolean(right.isActive));
        break;
      case "updatedAt":
      default:
        result =
          new Date(left.updatedAt ?? 0).getTime() -
          new Date(right.updatedAt ?? 0).getTime();
        break;
    }

    if (result === 0) {
      result =
        new Date(left.updatedAt ?? 0).getTime() -
        new Date(right.updatedAt ?? 0).getTime();
    }

    return result * factor;
  });
}



