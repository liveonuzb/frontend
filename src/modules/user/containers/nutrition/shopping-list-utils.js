import defaultTo from "lodash/defaultTo";
import each from "lodash/each";
import get from "lodash/get";
import isArray from "lodash/isArray";
import map from "lodash/map";
import sortBy from "lodash/sortBy";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import { mealPlanDaysToKanban } from "@/hooks/app/use-meal-plan";

export const SHOPPING_WEEK_DAYS = [
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
  "Yakshanba",
];

export const getPlanShoppingDays = (plan) => {
  if (isArray(plan?.days)) {
    return map(plan.days, (day, index) => ({
      key: `day-${day?.dayNumber || index + 1}`,
      label: `${day?.dayNumber || index + 1}-kun`,
    }));
  }

  const durationDays = toNumber(get(plan, "durationDays")) || 0;

  if (durationDays > SHOPPING_WEEK_DAYS.length) {
    return Array.from({ length: durationDays }, (_, index) => ({
      key: `day-${index + 1}`,
      label: `${index + 1}-kun`,
    }));
  }

  return map(SHOPPING_WEEK_DAYS, (day) => ({ key: day, label: day }));
};

export const buildShoppingList = (planOrWeeklyPlan) => {
  const hasPlanShape =
    planOrWeeklyPlan &&
    typeof planOrWeeklyPlan === "object" &&
    (Object.prototype.hasOwnProperty.call(planOrWeeklyPlan, "days") ||
      Object.prototype.hasOwnProperty.call(planOrWeeklyPlan, "weeklyKanban"));
  const weeklyPlan = hasPlanShape
    ? isArray(get(planOrWeeklyPlan, "days"))
      ? mealPlanDaysToKanban(get(planOrWeeklyPlan, "days", []))
      : get(planOrWeeklyPlan, "weeklyKanban", {})
    : planOrWeeklyPlan || {};
  const shoppingDays = getPlanShoppingDays(
    hasPlanShape ? planOrWeeklyPlan : { weeklyKanban: weeklyPlan },
  );
  const productsMap = new Map();

  each(shoppingDays, ({ key }) => {
    each(defaultTo(weeklyPlan[key], []), (col) => {
      each(defaultTo(get(col, "items"), []), (item) => {
        const name = trim(String(get(item, "name", "")));
        if (!name) return;

        const qty = toNumber(get(item, "qty")) || 1;
        const grams =
          toNumber(get(item, "grams")) ||
          toNumber(get(item, "defaultAmount")) ||
          0;
        const unit = get(item, "unit", "g");

        const existing = productsMap.get(name) || {
          name,
          count: 0,
          totalCal: 0,
          totalAmount: 0,
          unit,
          emoji: get(item, "emoji", "🛒"),
          category: get(item, "category", ""),
        };

        existing.count += qty;
        existing.totalCal += (toNumber(get(item, "cal")) || 0) * qty;
        existing.totalAmount += grams * qty;
        productsMap.set(name, existing);
      });
    });
  });

  return sortBy(Array.from(productsMap.values()), [
    (item) => -item.count,
    (item) => item.name,
  ]);
};
