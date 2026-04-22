import { join } from "lodash";

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

export const ACHIEVEMENT_CATEGORY_OPTIONS = Object.entries(
  ACHIEVEMENT_CATEGORY_LABELS,
).map(([value, label]) => ({ value, label }));

export const ACHIEVEMENT_METRIC_OPTIONS = Object.entries(
  ACHIEVEMENT_METRIC_LABELS,
).map(([value, label]) => ({ value, label }));

export const createEmptyAchievementForm = () => ({
  key: "",
  name: "",
  description: "",
  icon: "🏆",
  category: "NUTRITION",
  metric: "MEAL_LOG",
  threshold: "1",
  xpReward: "0",
  sortOrder: "0",
  isActive: true,
});

export const normalizeAchievementForm = (achievement = {}) => ({
  key: achievement.key ?? "",
  name: achievement.name ?? "",
  description: achievement.description ?? "",
  icon: achievement.icon ?? "🏆",
  category: achievement.category ?? "NUTRITION",
  metric: achievement.metric ?? "MEAL_LOG",
  threshold: String(achievement.threshold ?? 1),
  xpReward: String(achievement.xpReward ?? 0),
  sortOrder: String(achievement.sortOrder ?? 0),
  isActive: achievement.isActive ?? true,
});

const parseIntField = (value, label, minimum = 0) => {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);

  if (!Number.isFinite(parsed) || parsed < minimum) {
    throw new Error(`${label} noto'g'ri kiritildi.`);
  }

  return parsed;
};

export const buildAchievementPayload = (formData) => {
  const key = String(formData.key ?? "").trim().toLowerCase();
  const name = String(formData.name ?? "").trim();
  const description = String(formData.description ?? "").trim();
  const icon = String(formData.icon ?? "").trim();

  if (!key) {
    throw new Error("Achievement key kiritilishi shart.");
  }

  if (!name) {
    throw new Error("Achievement nomi kiritilishi shart.");
  }

  if (!description) {
    throw new Error("Achievement tavsifi kiritilishi shart.");
  }

  if (!icon) {
    throw new Error("Achievement icon kiritilishi shart.");
  }

  return {
    key,
    name,
    description,
    icon,
    category: formData.category,
    metric: formData.metric,
    threshold: parseIntField(formData.threshold, "Threshold", 1),
    xpReward: parseIntField(formData.xpReward, "XP reward", 0),
    sortOrder: parseIntField(formData.sortOrder, "Sort order", 0),
    isActive: Boolean(formData.isActive),
  };
};

export const resolveAchievementApiErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message;

  if (Array.isArray(message)) {
    return join(message, ", ");
  }

  return message || fallback;
};
