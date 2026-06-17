import dayjs from "dayjs";
import filter from "lodash/filter";
import get from "lodash/get";
import map from "lodash/map";
import trim from "lodash/trim";
import toNumber from "lodash/toNumber";

export const INGREDIENT_KEY_REGION_KEYS = ["uzbekistan", "tashkent"];
export const INGREDIENT_PRICE_STALE_DAYS = 180;
const DIETARY_TO_EXCLUDED_ALLERGEN_TAGS = {
  "gluten-free": ["gluten"],
  "lactose-free": ["lactose"],
};

const hasUsablePositiveNumber = (value) => {
  const number = toNumber(value);
  return Number.isFinite(number) && number > 0;
};

const hasMacroCalorieMismatch = (ingredient) => {
  const calories = toNumber(get(ingredient, "calories"));
  const protein = toNumber(get(ingredient, "protein"));
  const carbs = toNumber(get(ingredient, "carbs"));
  const fat = toNumber(get(ingredient, "fat"));

  if (
    !Number.isFinite(calories) ||
    !Number.isFinite(protein) ||
    !Number.isFinite(carbs) ||
    !Number.isFinite(fat) ||
    calories <= 0 ||
    protein < 0 ||
    carbs < 0 ||
    fat < 0
  ) {
    return false;
  }

  const macroCalories = protein * 4 + carbs * 4 + fat * 9;

  if (macroCalories <= 0) {
    return false;
  }

  return Math.abs(calories - macroCalories) > Math.max(50, calories * 0.25);
};

export const getIngredientQualityIssues = (
  ingredient,
  keyRegionKeys = INGREDIENT_KEY_REGION_KEYS,
) => {
  const issues = [];
  const pricePer100g = get(ingredient, "pricePer100g");
  const numericPrice = toNumber(pricePer100g);
  const calories = toNumber(get(ingredient, "calories"));

  if (pricePer100g === null || pricePer100g === undefined) {
    issues.push({
      code: "missing_price",
      label: "Narx yo'q",
      section: "pricing",
    });
  } else if (
    !Number.isFinite(numericPrice) ||
    numericPrice <= 0 ||
    numericPrice > 10000000
  ) {
    issues.push({
      code: "impossible_price",
      label: "Narx shubhali",
      section: "pricing",
    });
  }

  if (hasUsablePositiveNumber(pricePer100g)) {
    const priceUpdatedAt = get(ingredient, "priceUpdatedAt");
    const isStale =
      !priceUpdatedAt ||
      dayjs(priceUpdatedAt).isBefore(
        dayjs().subtract(INGREDIENT_PRICE_STALE_DAYS, "day"),
      );

    if (isStale) {
      issues.push({
        code: "stale_price",
        label: "Narx eski",
        section: "pricing",
      });
    }
  }

  const regionalPriceKeys = new Set(
    map(
      filter(get(ingredient, "regionalPrices", []), (price) =>
        hasUsablePositiveNumber(get(price, "pricePer100g")),
      ),
      (price) => get(price, "regionKey"),
    ),
  );
  const missingRegionKeys = filter(
    keyRegionKeys,
    (regionKey) => !regionalPriceKeys.has(regionKey),
  );

  if (missingRegionKeys.length) {
    issues.push({
      code: "missing_regional_price",
      label: `${missingRegionKeys.length} region narxi yo'q`,
      section: "pricing",
    });
  }

  if (!Number.isFinite(calories) || calories < 0 || calories > 900) {
    issues.push({
      code: "impossible_calories",
      label: "Kaloriya shubhali",
      section: "nutrition",
    });
  }

  if (hasMacroCalorieMismatch(ingredient)) {
    issues.push({
      code: "macro_calorie_mismatch",
      label: "Macro mismatch",
      section: "nutrition",
    });
  }

  if (!trim(String(get(ingredient, "servingUnit", "")))) {
    issues.push({
      code: "missing_serving_unit",
      label: "Birlik yo'q",
      section: "nutrition",
    });
  }

  const allergenTagSet = new Set(get(ingredient, "allergenTags", []));
  const conflictingDietaryTags = filter(
    get(ingredient, "dietaryTags", []),
    (tag) =>
      filter(
        DIETARY_TO_EXCLUDED_ALLERGEN_TAGS[tag] ?? [],
        (allergenTag) => allergenTagSet.has(allergenTag),
      ).length > 0,
  );

  if (conflictingDietaryTags.length) {
    issues.push({
      code: "dietary_allergen_conflict",
      label: "Tag konflikti",
      section: "nutrition",
    });
  }

  return issues;
};
