import find from "lodash/find";
import isArray from "lodash/isArray";
import keys from "lodash/keys";
import toLower from "lodash/toLower";

const DAY_KEY_PREFIX = "day-";
const DAY_MS = 24 * 60 * 60 * 1000;

const normalizeWeekdayKey = (value) =>
  toLower(String(value || ""))
    .replaceAll("’", "'")
    .replaceAll(/[^a-z\u0400-\u04ff]+/g, "");

const startOfLocalDay = (value) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const getPlanDayStatus = (plan, date = new Date()) => {
  const durationDays = Number(plan?.durationDays || 0);
  const isDurationPlan = durationDays > 7;

  if (!isDurationPlan) {
    return {
      isDurationPlan: false,
      isExpired: false,
      dayNumber: null,
      durationDays: null,
    };
  }

  const currentDay = startOfLocalDay(date);
  const startDay = plan?.startDate ? startOfLocalDay(plan.startDate) : null;
  const dayNumber =
    currentDay && startDay
      ? Math.floor((currentDay.getTime() - startDay.getTime()) / DAY_MS) + 1
      : 1;

  return {
    isDurationPlan: true,
    isExpired: dayNumber > durationDays,
    dayNumber,
    durationDays,
  };
};

export const resolveLegacyPlanColumns = (weeklyKanban, selectedDay) => {
  if (!weeklyKanban || typeof weeklyKanban !== "object") {
    return [];
  }

  if (isArray(weeklyKanban[selectedDay])) {
    return weeklyKanban[selectedDay];
  }

  const normalizedSelectedDay = normalizeWeekdayKey(selectedDay);
  const matchedKey = find(
    keys(weeklyKanban),
    (key) => normalizeWeekdayKey(key) === normalizedSelectedDay,
  );

  return matchedKey && isArray(weeklyKanban[matchedKey])
    ? weeklyKanban[matchedKey]
    : [];
};

const getPlanDays = (plan) => (isArray(plan?.days) ? plan.days : []);

const getPlanDayMeals = (planDays, dayNumber, selectedDay) => {
  if (!isArray(planDays) || planDays.length === 0) {
    return [];
  }

  const byNumber = find(
    planDays,
    (day) => Number(day?.dayNumber) === Number(dayNumber),
  );

  if (byNumber && isArray(byNumber.meals)) {
    return byNumber.meals;
  }

  if (selectedDay) {
    const normalizedSelectedDay = normalizeWeekdayKey(selectedDay);
    const byKey = find(
      planDays,
      (day) =>
        normalizeWeekdayKey(day?.dayKey) === normalizedSelectedDay ||
        normalizeWeekdayKey(day?.label) === normalizedSelectedDay,
    );

    if (byKey && isArray(byKey.meals)) {
      return byKey.meals;
    }
  }

  return [];
};

export const resolvePlanColumnsForDate = (
  plan,
  date = new Date(),
  selectedDay,
) => {
  const planDays = getPlanDays(plan);
  const weeklyKanban =
    plan?.weeklyKanban &&
    typeof plan.weeklyKanban === "object" &&
    !isArray(plan.weeklyKanban)
      ? plan.weeklyKanban
      : {};
  const status = getPlanDayStatus(plan, date);

  if (status.isDurationPlan) {
    if (status.isExpired) {
      return [];
    }

    const dayMeals = getPlanDayMeals(planDays, status.dayNumber || 1);
    if (dayMeals.length > 0) {
      return dayMeals;
    }

    const dayKey = `${DAY_KEY_PREFIX}${status.dayNumber || 1}`;
    return isArray(weeklyKanban[dayKey]) ? weeklyKanban[dayKey] : [];
  }

  const legacyDayMeals = getPlanDayMeals(planDays, 1, selectedDay);
  if (legacyDayMeals.length > 0) {
    return legacyDayMeals;
  }

  return resolveLegacyPlanColumns(weeklyKanban, selectedDay);
};
