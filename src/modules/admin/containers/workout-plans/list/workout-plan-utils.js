export const ITEMS_PER_PAGE = 10;
export const DIFFICULTY_OPTIONS = ["Boshlang'ich", "O'rta", "Yuqori"];

export const emptyForm = {
  name: "",
  description: "",
  difficulty: "O'rta",
  isActive: true,
};

export function resolveText(translations, fallback, language) {
  if (translations && typeof translations === "object") {
    const direct = String(translations?.[language] ?? "").trim();
    if (direct) return direct;

    const uzText = String(translations?.uz ?? "").trim();
    if (uzText) return uzText;

    const firstValue = Object.values(translations).find((value) =>
      String(value ?? "").trim(),
    );
    if (firstValue) {
      return String(firstValue).trim();
    }
  }

  return String(fallback ?? "").trim();
}

export function cleanTranslations(translations = {}) {
  return Object.fromEntries(
    Object.entries(translations)
      .map(([code, value]) => [code, String(value ?? "").trim()])
      .filter(([code, value]) => Boolean(code) && Boolean(value)),
  );
}

export function countFilledTranslations(translations = {}) {
  return Object.values(translations).filter((value) =>
    String(value ?? "").trim(),
  ).length;
}

export function resolveErrorMessage(error, fallback) {
  const message = error?.response?.data?.message;

  if (Array.isArray(message)) {
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
    isActive: template?.isActive ?? true,
  };
}

export const createTranslationForm = (template, languages = []) => ({
  titles: Object.fromEntries(
    (Array.isArray(languages) ? languages : []).map((language) => [
      language.code,
      resolveText(template?.translations, template?.name ?? "", language.code),
    ]),
  ),
  descriptions: Object.fromEntries(
    (Array.isArray(languages) ? languages : []).map((language) => [
      language.code,
      resolveText(
        template?.descriptionTranslations,
        template?.description ?? "",
        language.code,
      ),
    ]),
  ),
});

export function hasCompleteTranslations(template, languageCount) {
  const titleCount = countFilledTranslations(template?.translations || {});
  const descriptionCount = countFilledTranslations(
    template?.descriptionTranslations || {},
  );
  const requiresDescription = Boolean(
    String(template?.description ?? "").trim(),
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
  const source = Array.isArray(templates) ? templates : [];

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
        result = Number(left.daysPerWeek ?? 0) - Number(right.daysPerWeek ?? 0);
        break;
      case "days":
        result = Number(left.days ?? 0) - Number(right.days ?? 0);
        break;
      case "totalExercises":
        result =
          Number(left.totalExercises ?? 0) - Number(right.totalExercises ?? 0);
        break;
      case "isActive":
        result =
          Number(Boolean(left.isActive)) - Number(Boolean(right.isActive));
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
