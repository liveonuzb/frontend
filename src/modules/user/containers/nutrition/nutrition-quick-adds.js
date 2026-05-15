const QUICK_ADD_LIMIT = 6;

const toNumber = (value, fallback = 0) => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
};

const normalizeKeyPart = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const makeNameKey = (name) => {
  const normalized = normalizeKeyPart(name);
  return normalized ? `name:${normalized}` : null;
};

const makeBarcodeKey = (barcode) => {
  const normalized = normalizeKeyPart(barcode);
  return normalized ? `barcode:${normalized}` : null;
};

const makeCatalogIdKey = (food) => {
  const value = food?.catalogFoodId ?? food?.id;
  const normalized = normalizeKeyPart(value);
  return normalized ? `catalog:${normalized}` : null;
};

const compact = (items) => items.filter(Boolean);

export const buildSavedMealQuickAddPayload = (savedMeal = {}) => ({
  name: savedMeal.name,
  source: "saved-meal",
  savedMealId: savedMeal.id,
  cal: toNumber(savedMeal.calories ?? savedMeal.cal),
  protein: toNumber(savedMeal.protein),
  carbs: toNumber(savedMeal.carbs),
  fat: toNumber(savedMeal.fat),
  fiber: toNumber(savedMeal.fiber),
  grams: toNumber(savedMeal.grams, 0),
  image: savedMeal.imageUrl ?? savedMeal.image ?? null,
  ingredients: Array.isArray(savedMeal.ingredients) ? savedMeal.ingredients : [],
});

export const buildCatalogQuickAddPayload = (food = {}) => ({
  id: food.id,
  catalogFoodId: food.catalogFoodId ?? food.id,
  barcode: food.barcode ?? null,
  name: food.name,
  source: "manual",
  qty: 1,
  grams: toNumber(food.defaultAmount ?? food.grams, 100),
  unit: food.unit || "g",
  cal: toNumber(food.baseCal ?? food.cal),
  protein: toNumber(food.baseProtein ?? food.protein),
  carbs: toNumber(food.baseCarbs ?? food.carbs),
  fat: toNumber(food.baseFat ?? food.fat),
  fiber: toNumber(food.fiber),
  image: food.image ?? food.imageUrl ?? null,
  addedFromPlan: false,
});

const makeSavedQuickAdd = (savedMeal) => {
  if (!savedMeal?.id || !String(savedMeal.name || "").trim()) {
    return null;
  }

  const payload = buildSavedMealQuickAddPayload(savedMeal);

  return {
    id: `saved:${savedMeal.id}`,
    type: "saved",
    title: savedMeal.name,
    subtitle: "Mening taomlarim",
    calories: payload.cal,
    protein: payload.protein,
    carbs: payload.carbs,
    fat: payload.fat,
    grams: payload.grams,
    image: payload.image,
    payload,
    sourceItem: savedMeal,
    dedupeKeys: compact([makeNameKey(savedMeal.name)]),
  };
};

const makeCatalogQuickAdd = (food) => {
  if (!food?.id || !String(food.name || "").trim()) {
    return null;
  }

  const payload = buildCatalogQuickAddPayload(food);

  return {
    id: `catalog:${food.catalogFoodId ?? food.id}`,
    type: "catalog",
    title: food.name,
    subtitle: food.serving || `${payload.grams}${payload.unit || "g"}`,
    calories: payload.cal,
    protein: payload.protein,
    carbs: payload.carbs,
    fat: payload.fat,
    grams: payload.grams,
    image: payload.image,
    payload,
    sourceItem: food,
    dedupeKeys: compact([
      makeNameKey(food.name),
      makeBarcodeKey(food.barcode),
      makeCatalogIdKey(food),
    ]),
  };
};

export const buildNutritionQuickAdds = ({
  savedMeals = [],
  recentFoods = [],
  limit = QUICK_ADD_LIMIT,
} = {}) => {
  const seen = new Set();
  const quickAdds = [];

  const pushIfUnique = (item) => {
    if (!item || quickAdds.length >= limit) {
      return;
    }

    if (item.dedupeKeys.some((key) => seen.has(key))) {
      return;
    }

    item.dedupeKeys.forEach((key) => seen.add(key));
    quickAdds.push(item);
  };

  savedMeals.map(makeSavedQuickAdd).forEach(pushIfUnique);
  recentFoods.map(makeCatalogQuickAdd).forEach(pushIfUnique);

  return quickAdds;
};
