import {
  get,
  join,
  isArray,
  map,
  toLower,
  trim,
  toPairs,
  parseInt as lodashParseInt,
} from "lodash";

export const ADMIN_ACHIEVEMENTS_QUERY_KEY = ["admin", "achievements"];

export const getAdminAchievementQueryKey = (id) => [
  ...ADMIN_ACHIEVEMENTS_QUERY_KEY,
  id,
];

export const ACHIEVEMENT_CATEGORY_LABELS = {
  NUTRITION: "Ovqatlanish",
  WORKOUT: "Mashg'ulot",
  WATER: "Suv",
  SOCIAL: "Ijtimoiy",
  STREAK: "Streak",
  CHALLENGE: "Challenge",
  GENERAL: "Umumiy",
};

export const ACHIEVEMENT_METRIC_LABELS = {
  MEAL_LOG: "Meal log",
  WATER_LOG: "Water log",
  WORKOUT_SESSION: "Workout session",
  FRIEND_ACCEPTED: "Friend accepted",
  CHALLENGE_JOINED: "Challenge joined",
};

export const ACHIEVEMENT_CATEGORY_OPTIONS = map(toPairs(ACHIEVEMENT_CATEGORY_LABELS), ([value, label]) => ({ value, label }));

export const ACHIEVEMENT_METRIC_OPTIONS = map(toPairs(ACHIEVEMENT_METRIC_LABELS), ([value, label]) => ({ value, label }));

export const APP_MODE_OPTIONS = [
  { value: "madagascar", label: "Madagascar" },
  { value: "zen", label: "Zen" },
  { value: "focus", label: "Focus" },
];

export const IMAGE_FIELD_BY_MODE = {
  madagascar: "imageMadagascarUrl",
  zen: "imageZenUrl",
  focus: "imageFocusUrl",
};

export const resolveAchievementImage = (achievement, mode = "madagascar") =>
  get(achievement, IMAGE_FIELD_BY_MODE[mode]) ||
  get(achievement, "imageMadagascarUrl") ||
  get(achievement, "imageZenUrl") ||
  get(achievement, "imageFocusUrl") ||
  get(achievement, "imageUrl") ||
  "";

export const createEmptyAchievementForm = () => ({
  key: "",
  name: "",
  description: "",
  imageMadagascarUrl: "",
  imageZenUrl: "",
  imageFocusUrl: "",
  category: "NUTRITION",
  metric: "MEAL_LOG",
  threshold: "1",
  xpReward: "0",
  isActive: true,
});

export const normalizeAchievementForm = (achievement = {}, language = "uz") => ({
  key: achievement.key ?? "",
  name:
    get(achievement, `translations.${language}`) ??
    get(achievement, "translations.uz") ??
    achievement.name ??
    "",
  description:
    get(achievement, `descriptionTranslations.${language}`) ??
    get(achievement, "descriptionTranslations.uz") ??
    achievement.description ??
    "",
  imageMadagascarUrl: achievement.imageMadagascarUrl ?? "",
  imageZenUrl: achievement.imageZenUrl ?? "",
  imageFocusUrl: achievement.imageFocusUrl ?? "",
  category: achievement.category ?? "NUTRITION",
  metric: achievement.metric ?? "MEAL_LOG",
  threshold: String(achievement.threshold ?? 1),
  xpReward: String(achievement.xpReward ?? 0),
  isActive: achievement.isActive ?? true,
});

const parseIntField = (value, label, minimum = 0) => {
  const parsed = lodashParseInt(trim(String(value ?? "")), 10);

  if (!Number.isFinite(parsed) || parsed < minimum) {
    throw new Error(`${label} noto'g'ri kiritildi.`);
  }

  return parsed;
};

export const buildAchievementPayload = (formData, language = "uz") => {
  const key = toLower(trim(String(formData.key ?? "")));
  const name = trim(String(formData.name ?? ""));
  const description = trim(String(formData.description ?? ""));

  if (!name) {
    throw new Error("Achievement nomi kiritilishi shart.");
  }

  if (!description) {
    throw new Error("Achievement tavsifi kiritilishi shart.");
  }

  return {
    ...(key ? { key } : {}),
    name,
    description,
    translations: {
      [language]: name,
    },
    descriptionTranslations: {
      [language]: description,
    },
    imageMadagascarUrl: trim(String(formData.imageMadagascarUrl ?? "")),
    imageZenUrl: trim(String(formData.imageZenUrl ?? "")),
    imageFocusUrl: trim(String(formData.imageFocusUrl ?? "")),
    category: formData.category,
    metric: formData.metric,
    threshold: parseIntField(formData.threshold, "Threshold", 1),
    xpReward: parseIntField(formData.xpReward, "XP reward", 0),
    isActive: Boolean(formData.isActive),
  };
};

export const resolveAchievementApiErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message;

  if (isArray(message)) {
    return join(message, ", ");
  }

  return message || fallback;
};
