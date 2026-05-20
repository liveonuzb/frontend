import { round, sumBy } from "lodash";

export const clampPercent = (value, target) => {
  if (!target || target <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
};

export const buildNutritionDashboardMetrics = ({
  roundedTotals = {},
  goals = {},
  waterConsumedMl = 0,
  waterGoalMl = 0,
  dayMeals = {},
}) => {
  const mealSections = [
    dayMeals.breakfast || [],
    dayMeals.lunch || [],
    dayMeals.dinner || [],
    dayMeals.snack || [],
  ];
  const mealsCompleted = sumBy(mealSections, (items) => (items.length > 0 ? 1 : 0));
  const caloriePercent = clampPercent(roundedTotals.calories || 0, goals.calories || 0);
  const proteinPercent = clampPercent(roundedTotals.protein || 0, goals.protein || 0);
  const waterPercent = clampPercent(waterConsumedMl, waterGoalMl);
  const healthScore = round(
    (Math.min(caloriePercent, 100) +
      Math.min(proteinPercent, 100) +
      Math.min(waterPercent, 100)) /
      3,
  );

  return {
    calories: roundedTotals.calories || 0,
    targetCalories: goals.calories || 0,
    macros: {
      protein: {
        current: roundedTotals.protein || 0,
        target: goals.protein || 0,
      },
      carbs: {
        current: roundedTotals.carbs || 0,
        target: goals.carbs || 0,
      },
      fat: {
        current: roundedTotals.fat || 0,
        target: goals.fat || 0,
      },
    },
    water: {
      current: waterConsumedMl,
      target: waterGoalMl,
      percent: waterPercent,
    },
    healthScore,
    mealsCompleted,
    totalMeals: 4,
    streakDays: 7,
  };
};

