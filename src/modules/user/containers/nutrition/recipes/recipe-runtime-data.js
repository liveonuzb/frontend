import map from "lodash/map";
import {
  getIngredientsNutrition,
  numberOrZero,
} from "./recipe-ui-utils.js";

const now = "2026-06-02T00:00:00.000Z";

export const RECIPE_ASSET_IMAGES = {
  chickenBowl: "/madagascar/dashboard/light/lunch.webp",
  salmon: "/madagascar/dashboard/light/dinner.webp",
  oatmeal: "/madagascar/dashboard/light/breakfast.webp",
  omelet: "/zen/meals/breakfast.webp",
  soup: "/zen/meals/lunch.webp",
  pancakes: "/zen/meals/snack.webp",
  stepChicken: "/madagascar/dashboard/light/dinner.webp",
  stepQuinoa: "/madagascar/dashboard/light/lunch.webp",
  vegetables: "/madagascar/dashboard/light/snack.webp",
};

const toInstruction = (step) => ({
  ...step,
  stepNumber: step.order,
  body: step.description,
});

export const createRecipe = (recipe) => {
  const caloriesPerServing = recipe.caloriesPerServing ?? recipe.calories;
  const proteinPerServing = recipe.proteinPerServing ?? recipe.protein;
  const carbsPerServing = recipe.carbsPerServing ?? recipe.carbs;
  const fatPerServing = recipe.fatPerServing ?? recipe.fat;
  const fiberPerServing = recipe.fiberPerServing ?? recipe.fiber ?? 0;
  const sugarPerServing = recipe.sugarPerServing ?? recipe.sugar ?? 0;
  const sodiumPerServing = recipe.sodiumPerServing ?? recipe.sodium ?? 0;
  const steps = map(recipe.steps || [], toInstruction);

  return {
    ...recipe,
    catalogFoodId: recipe.catalogFoodId || recipe.id,
    slug: recipe.slug || recipe.id,
    calories: caloriesPerServing,
    protein: proteinPerServing,
    carbs: carbsPerServing,
    fat: fatPerServing,
    fiber: fiberPerServing,
    sugar: sugarPerServing,
    sodium: sodiumPerServing,
    caloriesPerServing,
    proteinPerServing,
    carbsPerServing,
    fatPerServing,
    fiberPerServing,
    sugarPerServing,
    sodiumPerServing,
    instructions: steps,
    steps,
    ingredientsCount: recipe.ingredients?.length || 0,
    stepsCount: steps.length,
    servingLabel: `${recipe.servings} porsiya`,
    authorId: recipe.authorId || "system",
    source: recipe.source || "admin",
    visibility: recipe.visibility || "public",
    isPublished: recipe.isPublished ?? true,
    isFavorite: recipe.isFavorite ?? false,
    createdAt: recipe.createdAt || now,
    updatedAt: recipe.updatedAt || now,
  };
};

export const ADMIN_RECIPE_IMAGES = [
  {
    id: "admin-chicken-bowl",
    title: "Tovuqli bowl",
    category: "Tushlik",
    imageUrl: RECIPE_ASSET_IMAGES.chickenBowl,
  },
  {
    id: "admin-salmon-dinner",
    title: "Somon kechki ovqat",
    category: "Kechki ovqat",
    imageUrl: RECIPE_ASSET_IMAGES.salmon,
  },
  {
    id: "admin-oatmeal",
    title: "Jo'xori nonushta",
    category: "Nonushta",
    imageUrl: RECIPE_ASSET_IMAGES.oatmeal,
  },
  {
    id: "admin-omelet",
    title: "Omlet",
    category: "Nonushta",
    imageUrl: RECIPE_ASSET_IMAGES.omelet,
  },
  {
    id: "admin-soup",
    title: "Sho'rva",
    category: "Tushlik",
    imageUrl: RECIPE_ASSET_IMAGES.soup,
  },
  {
    id: "admin-vegetables",
    title: "Sabzavotlar",
    category: "Ingredientlar",
    imageUrl: RECIPE_ASSET_IMAGES.vegetables,
  },
];

export const DEFAULT_WIZARD_INGREDIENTS = [
  {
    id: "builder-chicken",
    name: "Tovuq filesi",
    imageUrl: RECIPE_ASSET_IMAGES.stepChicken,
    quantity: 120,
    baseQuantity: 120,
    unit: "g",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    sugar: 0,
    sodium: 74,
    isRequired: true,
    note: "Qovurilgan",
    nutritionSource: "manual",
    matchStatus: "manual",
    reviewNeeded: false,
  },
  {
    id: "builder-quinoa",
    name: "Quinoa",
    imageUrl: RECIPE_ASSET_IMAGES.stepQuinoa,
    quantity: 50,
    baseQuantity: 50,
    unit: "g",
    calories: 120,
    protein: 4.4,
    carbs: 21,
    fat: 1.9,
    fiber: 2.8,
    sugar: 0.9,
    sodium: 7,
    isRequired: true,
    note: "Qaynatilgan",
    nutritionSource: "manual",
    matchStatus: "manual",
    reviewNeeded: false,
  },
  {
    id: "builder-avocado",
    name: "Avokado",
    imageUrl: RECIPE_ASSET_IMAGES.vegetables,
    quantity: 50,
    baseQuantity: 50,
    unit: "g",
    calories: 80,
    protein: 1,
    carbs: 4.3,
    fat: 7.4,
    fiber: 3.4,
    sugar: 0.3,
    sodium: 4,
    isRequired: true,
    note: "Tilimlangan",
    nutritionSource: "manual",
    matchStatus: "manual",
    reviewNeeded: false,
  },
  {
    id: "builder-tomato",
    name: "Cherry pomidor",
    imageUrl: RECIPE_ASSET_IMAGES.vegetables,
    quantity: 80,
    baseQuantity: 80,
    unit: "g",
    calories: 14,
    protein: 0.7,
    carbs: 2.9,
    fat: 0.2,
    fiber: 1,
    sugar: 1.8,
    sodium: 4,
    isRequired: true,
    note: "Yarimga bo'lingan",
    nutritionSource: "manual",
    matchStatus: "manual",
    reviewNeeded: false,
  },
  {
    id: "builder-cucumber",
    name: "Bodring",
    imageUrl: RECIPE_ASSET_IMAGES.vegetables,
    quantity: 60,
    baseQuantity: 60,
    unit: "g",
    calories: 9,
    protein: 0.4,
    carbs: 2.2,
    fat: 0.1,
    fiber: 0.6,
    sugar: 1.1,
    sodium: 2,
    isRequired: false,
    note: "",
    nutritionSource: "manual",
    matchStatus: "manual",
    reviewNeeded: false,
  },
  {
    id: "builder-oil",
    name: "Zaytun yog'i",
    imageUrl: RECIPE_ASSET_IMAGES.vegetables,
    quantity: 10,
    baseQuantity: 10,
    unit: "ml",
    calories: 80,
    protein: 0,
    carbs: 0,
    fat: 10,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    isRequired: true,
    note: "Extra virgin",
    nutritionSource: "manual",
    matchStatus: "manual",
    reviewNeeded: false,
  },
];

export const DEFAULT_WIZARD_STEPS = [
  {
    id: "builder-step-chicken-prep",
    order: 1,
    title: "Tovuqli fileyni tayyorlash",
    description:
      "Tovuq filelarini sovuq suvda yuvib, qog'oz sochiq bilan quriting. Tuz, murch va zaytun moyi bilan surting.",
    durationMinutes: 10,
    imageUrl: RECIPE_ASSET_IMAGES.stepChicken,
  },
  {
    id: "builder-step-quinoa",
    order: 2,
    title: "Quinoani qaynatish",
    description:
      "Quinoani elakda yuvib, 2 stakan suv qo'shing. Qaynagach, olovni pasaytirib 15 daqiqa pishiring.",
    durationMinutes: 15,
    imageUrl: RECIPE_ASSET_IMAGES.stepQuinoa,
  },
  {
    id: "builder-step-vegetables",
    order: 3,
    title: "Sabzavotlarni tayyorlash",
    description:
      "Brokoli, qizil qalampir va bodringni mayda bo'laklarga bo'ling. Pomidorni yarimga bo'ling.",
    durationMinutes: 8,
    imageUrl: RECIPE_ASSET_IMAGES.vegetables,
  },
  {
    id: "builder-step-cook-chicken",
    order: 4,
    title: "Tovuqni pishirish",
    description:
      "Grilda yoki skovorodkada o'rtacha olovda har ikki tomonini 6-7 daqiqa qovuring.",
    durationMinutes: 12,
    imageUrl: RECIPE_ASSET_IMAGES.stepChicken,
  },
  {
    id: "builder-step-finish",
    order: 5,
    title: "Yakuniy yig'ish",
    description:
      "Idishga quinoa soling, ustiga sabzavotlar va tovuqni joylashtiring. Zaytun moyi va limon sharbati bilan bezang.",
    durationMinutes: 5,
    imageUrl: RECIPE_ASSET_IMAGES.chickenBowl,
  },
];

export const toRecipeFromBuilder = ({
  basicInfo,
  ingredients,
  steps,
  imageUrl,
  visibility,
  isPublished,
}) => {
  const nutrition = getIngredientsNutrition(ingredients);

  return createRecipe({
    id: `user-${Date.now()}`,
    title: basicInfo.title,
    description: basicInfo.description,
    imageUrl: imageUrl || RECIPE_ASSET_IMAGES.chickenBowl,
    category: basicInfo.category,
    difficulty: basicInfo.difficulty,
    prepTimeMinutes: numberOrZero(basicInfo.prepTimeMinutes),
    cookTimeMinutes: numberOrZero(basicInfo.cookTimeMinutes),
    totalTimeMinutes: numberOrZero(basicInfo.totalTimeMinutes),
    servings: numberOrZero(basicInfo.servings) || 1,
    caloriesPerServing: nutrition.calories,
    proteinPerServing: nutrition.protein,
    carbsPerServing: nutrition.carbs,
    fatPerServing: nutrition.fat,
    fiberPerServing: nutrition.fiber,
    sugarPerServing: nutrition.sugar,
    sodiumPerServing: nutrition.sodium,
    tags: basicInfo.tags,
    allergens: basicInfo.allergens,
    ingredients,
    steps,
    authorId: "current-user",
    source: "user",
    visibility,
    isPublished,
  });
};
