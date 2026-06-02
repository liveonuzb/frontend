import filter from "lodash/filter";
import forEach from "lodash/forEach";
import map from "lodash/map";
import round from "lodash/round";
import slice from "lodash/slice";

export const WEEK_DAYS = [
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
  "Yakshanba",
];

const buildGeneratorDayKeys = (dayCount = WEEK_DAYS.length) =>
  dayCount > WEEK_DAYS.length
    ? Array.from({ length: dayCount }, (_, index) => `day-${index + 1}`)
    : WEEK_DAYS;

const MEALS_3 = [
  { type: "Nonushta", time: "08:00-09:00", ratio: 0.3 },
  { type: "Tushlik", time: "13:00-14:00", ratio: 0.4 },
  { type: "Kechki ovqat", time: "19:00-20:00", ratio: 0.3 },
];

const MEALS_5 = [
  { type: "Nonushta", time: "08:00-09:00", ratio: 0.25 },
  { type: "1-chi gazak", time: "11:00-11:30", ratio: 0.1 },
  { type: "Tushlik", time: "13:00-14:00", ratio: 0.35 },
  { type: "2-chi gazak", time: "17:00-17:30", ratio: 0.1 },
  { type: "Kechki ovqat", time: "19:00-20:00", ratio: 0.2 },
];

const makeId = () => `col-${Math.random().toString(36).slice(2, 9)}`;

const pickFoodsForMeal = (pool, targetCal, dayIdx, mealIdx) => {
  if (!pool.length) return [];

  const offset = (dayIdx * 5 + mealIdx * 3) % pool.length;
  const rotated = [...slice(pool, offset), ...slice(pool, 0, offset)];

  const picked = [];
  let cumCal = 0;

  for (const food of rotated) {
    if (picked.length >= 4) break;
    if (cumCal >= targetCal * 0.88) break;

    const baseCal = food.baseCal || food.cal || 0;
    if (baseCal <= 0) continue;

    const step = food.step || 10;
    const defaultAmount = food.defaultAmount || 100;
    const remaining = targetCal - cumCal;
    const portion = picked.length === 0 ? remaining * 0.6 : remaining * 0.4;
    const isGramBased = !food.unit || food.unit === "g" || food.unit === "ml";
    const rawGrams = isGramBased
      ? round(((portion / baseCal) * 100) / step) * step
      : round(((portion / baseCal) * defaultAmount) / step) * step;
    const grams = Math.max(step, Math.min(500, rawGrams || step));

    const factor = isGramBased ? grams / 100 : grams / defaultAmount;

    picked.push({
      ...food,
      grams,
      cal: round(baseCal * factor),
      protein: round((food.baseProtein || food.protein || 0) * factor),
      carbs: round((food.baseCarbs || food.carbs || 0) * factor),
      fat: round((food.baseFat || food.fat || 0) * factor),
    });

    cumCal += round(baseCal * factor);
  }

  return picked;
};

export const generateWeeklyKanban = (
  foods,
  goal,
  targetCal,
  mealsPerDay,
  dayCount = WEEK_DAYS.length,
) => {
  const mealTemplates = mealsPerDay === 5 ? MEALS_5 : MEALS_3;

  const proteinFoods = filter(
    foods,
    (f) => (f.baseProtein || f.protein || 0) >= 12,
  );

  const breakfastPool = proteinFoods.length ? proteinFoods : foods;
  const lunchPool = foods.length ? foods : proteinFoods;
  const dinnerPool = proteinFoods.length ? proteinFoods : foods;
  const snackPool = filter(foods, (f) => (f.baseCal || f.cal || 0) < 200);

  const getPool = (mealType) => {
    if (mealType === "Nonushta") return breakfastPool;
    if (mealType === "Tushlik") return lunchPool;
    if (mealType === "Kechki ovqat") return dinnerPool;
    return snackPool.length ? snackPool : foods;
  };

  const kanban = {};

  forEach(buildGeneratorDayKeys(dayCount), (dayKey, dayIdx) => {
    kanban[dayKey] = map(mealTemplates, (meal, mealIdx) => ({
      id: makeId(),
      type: meal.type,
      time: meal.time,
      items: pickFoodsForMeal(
        getPool(meal.type),
        round(targetCal * meal.ratio),
        dayIdx,
        mealIdx,
      ),
    }));
  });

  return kanban;
};
