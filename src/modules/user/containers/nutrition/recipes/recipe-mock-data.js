import filter from "lodash/filter";
import find from "lodash/find";
import includes from "lodash/includes";
import lowerCase from "lodash/lowerCase";
import map from "lodash/map";
import round from "lodash/round";
import sumBy from "lodash/sumBy";
import toNumber from "lodash/toNumber";

const now = "2026-06-02T00:00:00.000Z";

const mealImages = {
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

const createRecipe = (recipe) => {
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

export const MOCK_RECIPES = [
  createRecipe({
    id: "tovuqli-quinoa-salatasi",
    catalogFoodId: 101,
    title: "Tovuqli quinoa salatasi",
    description:
      "Yengil va to'yimli tushlik. Protein va tolaga boy, mushaklar uchun ideal.",
    imageUrl: mealImages.chickenBowl,
    category: "Tushlik",
    difficulty: "Oson",
    prepTimeMinutes: 20,
    cookTimeMinutes: 10,
    totalTimeMinutes: 30,
    servings: 1,
    caloriesPerServing: 420,
    proteinPerServing: 32,
    carbsPerServing: 38,
    fatPerServing: 15,
    fiberPerServing: 6.2,
    sugarPerServing: 3.8,
    sodiumPerServing: 320,
    tags: ["Yuqori protein", "Kam kaloriyali", "Oson", "To'yimli", "Glutensiz"],
    allergens: ["Glutensiz"],
    ingredients: [
      {
        id: "chicken-fillet",
        name: "Tovuq filesi",
        imageUrl: mealImages.stepChicken,
        quantity: 120,
        baseQuantity: 120,
        unit: "g",
        grams: 120,
        displayAmount: 120,
        displayUnit: "g",
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        fiber: 0,
        sugar: 0,
        sodium: 74,
        isRequired: true,
        note: "Qovurilgan",
      },
      {
        id: "quinoa",
        name: "Quinoa",
        imageUrl: mealImages.stepQuinoa,
        quantity: 50,
        baseQuantity: 50,
        unit: "g",
        grams: 50,
        displayAmount: 50,
        displayUnit: "g",
        calories: 90,
        protein: 4.4,
        carbs: 21,
        fat: 1.9,
        fiber: 2.8,
        sugar: 0.9,
        sodium: 7,
        isRequired: true,
        note: "Qaynatilgan",
      },
      {
        id: "salad-leaves",
        name: "Salat barglari",
        quantity: 40,
        baseQuantity: 40,
        unit: "g",
        grams: 40,
        displayAmount: 40,
        displayUnit: "g",
        calories: 6,
        protein: 0.6,
        carbs: 1.1,
        fat: 0.1,
        fiber: 0.8,
        sugar: 0.3,
        sodium: 11,
        isRequired: true,
      },
      {
        id: "avocado",
        name: "Avokado",
        imageUrl: mealImages.vegetables,
        quantity: 50,
        baseQuantity: 50,
        unit: "g",
        grams: 50,
        displayAmount: 50,
        displayUnit: "g",
        calories: 80,
        protein: 1,
        carbs: 4.3,
        fat: 7.4,
        fiber: 3.4,
        sugar: 0.3,
        sodium: 4,
        isRequired: true,
        note: "Tilimlangan",
      },
      {
        id: "cherry-tomato",
        name: "Cherry pomidor",
        imageUrl: mealImages.vegetables,
        quantity: 80,
        baseQuantity: 80,
        unit: "g",
        grams: 80,
        displayAmount: 80,
        displayUnit: "g",
        calories: 14,
        protein: 0.7,
        carbs: 2.9,
        fat: 0.2,
        fiber: 1,
        sugar: 1.8,
        sodium: 4,
        isRequired: true,
        note: "Yarimga bo'lingan",
      },
      {
        id: "olive-oil",
        name: "Zaytun yog'i",
        quantity: 1,
        baseQuantity: 1,
        unit: "osh qoshiq",
        grams: 10,
        displayAmount: 1,
        displayUnit: "osh qoshiq",
        calories: 62,
        protein: 0,
        carbs: 0,
        fat: 6.8,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        isRequired: false,
        note: "Extra virgin",
      },
      {
        id: "lemon-juice",
        name: "Limon sharbati",
        quantity: 1,
        baseQuantity: 1,
        unit: "choy qoshiq",
        displayAmount: 1,
        displayUnit: "choy qoshiq",
        calories: 3,
        protein: 0,
        carbs: 0.7,
        fat: 0,
        fiber: 0,
        sugar: 0.3,
        sodium: 0,
        isRequired: false,
      },
      {
        id: "salt",
        name: "Tuz",
        quantity: 1,
        baseQuantity: 1,
        unit: "ta'mga ko'ra",
        displayAmount: 1,
        displayUnit: "ta'mga ko'ra",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        sodium: 214,
        isRequired: false,
      },
      {
        id: "black-pepper",
        name: "Qora murch",
        quantity: 1,
        baseQuantity: 1,
        unit: "ta'mga ko'ra",
        displayAmount: 1,
        displayUnit: "ta'mga ko'ra",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        isRequired: false,
      },
    ],
    steps: [
      {
        id: "prepare-quinoa",
        order: 1,
        title: "Quinoani tayyorlang",
        description:
          "Quinoani sovuq suvda yaxshilab yuvib, 2 baravar suvda 15 daqiqa qaynatang. Suvini to'kib, 5 daqiqa qoldiring.",
        durationMinutes: 15,
        imageUrl: mealImages.stepQuinoa,
      },
      {
        id: "cook-chicken",
        order: 2,
        title: "Tovuqni pishiring",
        description:
          "Tovuq filesini tuz, murch va zaytun yog'i bilan surting. Qovada yoki grillda har ikki tomoni 4-5 daqiqa pishiring.",
        durationMinutes: 10,
        imageUrl: mealImages.stepChicken,
      },
      {
        id: "prepare-vegetables",
        order: 3,
        title: "Sabzavotlarni tayyorlang",
        description:
          "Salat barglarini yuvib, quriting. Avokadoni bo'laklab, cherry pomidorni ikkiga bo'ling.",
        durationMinutes: 6,
        imageUrl: mealImages.vegetables,
      },
      {
        id: "assemble-salad",
        order: 4,
        title: "Salatni yig'ing",
        description:
          "Idishga salat barglari, quinoa, tovuq, avokado va pomidorni soling.",
        durationMinutes: 4,
      },
      {
        id: "finish-sauce",
        order: 5,
        title: "Sous va yakuniy bosqich",
        description:
          "Limon sharbati va zaytun yog'ini aralashtirib, salat ustiga quying. Darhol torting.",
        durationMinutes: 5,
      },
    ],
  }),
  createRecipe({
    id: "somon-va-brokkoli",
    catalogFoodId: 102,
    title: "Somon va brokkoli",
    description: "Omega-3 ga boy kechki ovqat.",
    imageUrl: mealImages.salmon,
    category: "Kechki ovqat",
    difficulty: "Oson",
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    totalTimeMinutes: 25,
    servings: 1,
    caloriesPerServing: 520,
    proteinPerServing: 38,
    carbsPerServing: 22,
    fatPerServing: 28,
    fiberPerServing: 5,
    sugarPerServing: 2.4,
    sodiumPerServing: 260,
    tags: ["Yuqori protein", "Omega-3", "Oson"],
    allergens: ["Baliq"],
    ingredients: [
      {
        id: "salmon",
        name: "Somon filesi",
        quantity: 160,
        baseQuantity: 160,
        unit: "g",
        grams: 160,
        displayAmount: 160,
        displayUnit: "g",
        calories: 330,
        protein: 34,
        carbs: 0,
        fat: 20,
        isRequired: true,
      },
      {
        id: "broccoli",
        name: "Brokkoli",
        quantity: 120,
        baseQuantity: 120,
        unit: "g",
        grams: 120,
        displayAmount: 120,
        displayUnit: "g",
        calories: 42,
        protein: 3.4,
        carbs: 8,
        fat: 0.5,
        isRequired: true,
      },
    ],
    steps: [
      {
        id: "season-salmon",
        order: 1,
        title: "Somonni tayyorlang",
        description: "Somonni tuz, murch va limon sharbati bilan surting.",
        durationMinutes: 5,
      },
      {
        id: "steam-broccoli",
        order: 2,
        title: "Brokkolini bug'da pishiring",
        description: "Brokkolini 6-7 daqiqa yumshoq bo'lguncha pishiring.",
        durationMinutes: 7,
      },
    ],
  }),
  createRecipe({
    id: "bananli-jorxori-botqasi",
    catalogFoodId: 103,
    title: "Bananli jo'xori bo'tqasi",
    description: "Ertalab uchun energiya.",
    imageUrl: mealImages.oatmeal,
    category: "Nonushta",
    difficulty: "Oson",
    prepTimeMinutes: 5,
    cookTimeMinutes: 5,
    totalTimeMinutes: 10,
    servings: 1,
    caloriesPerServing: 310,
    proteinPerServing: 9,
    carbsPerServing: 56,
    fatPerServing: 7,
    fiberPerServing: 6,
    sugarPerServing: 12,
    sodiumPerServing: 80,
    tags: ["Oson", "Tez"],
    allergens: ["Gluten"],
    ingredients: [
      {
        id: "oats",
        name: "Jo'xori yormasi",
        quantity: 50,
        baseQuantity: 50,
        unit: "g",
        grams: 50,
        displayAmount: 50,
        displayUnit: "g",
        calories: 190,
        protein: 6,
        carbs: 32,
        fat: 4,
        isRequired: true,
      },
      {
        id: "banana",
        name: "Banan",
        quantity: 1,
        baseQuantity: 1,
        unit: "dona",
        displayAmount: 1,
        displayUnit: "dona",
        calories: 90,
        protein: 1,
        carbs: 23,
        fat: 0,
        isRequired: true,
      },
    ],
    steps: [
      {
        id: "cook-oats",
        order: 1,
        title: "Bo'tqani pishiring",
        description: "Jo'xori yormasini sut yoki suvda 5 daqiqa pishiring.",
        durationMinutes: 5,
      },
    ],
  }),
  createRecipe({
    id: "sabzavotli-omlet",
    catalogFoodId: 104,
    title: "Sabzavotli omlet",
    description: "Tez va oson nonushta.",
    imageUrl: mealImages.omelet,
    category: "Nonushta",
    difficulty: "Oson",
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    totalTimeMinutes: 15,
    servings: 1,
    caloriesPerServing: 280,
    proteinPerServing: 18,
    carbsPerServing: 12,
    fatPerServing: 17,
    fiberPerServing: 3,
    sugarPerServing: 4,
    sodiumPerServing: 240,
    tags: ["Oson", "Yuqori protein"],
    allergens: ["Tuxum"],
    ingredients: [],
    steps: [],
  }),
  createRecipe({
    id: "loviya-shorvasi",
    catalogFoodId: 105,
    title: "Loviya sho'rvasi",
    description: "O'simlik oqsili manbai.",
    imageUrl: mealImages.soup,
    category: "Tushlik",
    difficulty: "O'rtacha",
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    totalTimeMinutes: 30,
    servings: 2,
    caloriesPerServing: 360,
    proteinPerServing: 20,
    carbsPerServing: 48,
    fatPerServing: 8,
    fiberPerServing: 11,
    sugarPerServing: 6,
    sodiumPerServing: 420,
    tags: ["Vegetarian", "To'yimli"],
    allergens: [],
    ingredients: [],
    steps: [],
  }),
  createRecipe({
    id: "tvorogli-pankeyklar",
    catalogFoodId: 106,
    title: "Tvorogli pankeyklar",
    description: "Proteinli shirin nonushta.",
    imageUrl: mealImages.pancakes,
    category: "Nonushta",
    difficulty: "Oson",
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    totalTimeMinutes: 20,
    servings: 1,
    caloriesPerServing: 330,
    proteinPerServing: 22,
    carbsPerServing: 32,
    fatPerServing: 12,
    fiberPerServing: 2,
    sugarPerServing: 8,
    sodiumPerServing: 180,
    tags: ["Yuqori protein", "Oson"],
    allergens: ["Sut mahsulotlari", "Tuxum"],
    ingredients: [],
    steps: [],
  }),
];

export const SAMPLE_THUMBNAILS = [
  mealImages.stepChicken,
  mealImages.vegetables,
  mealImages.oatmeal,
  mealImages.soup,
  mealImages.chickenBowl,
];

export const ADMIN_RECIPE_IMAGES = [
  {
    id: "admin-chicken-bowl",
    title: "Tovuqli bowl",
    category: "Tushlik",
    imageUrl: mealImages.chickenBowl,
  },
  {
    id: "admin-salmon-dinner",
    title: "Somon kechki ovqat",
    category: "Kechki ovqat",
    imageUrl: mealImages.salmon,
  },
  {
    id: "admin-oatmeal",
    title: "Jo'xori nonushta",
    category: "Nonushta",
    imageUrl: mealImages.oatmeal,
  },
  {
    id: "admin-omelet",
    title: "Omlet",
    category: "Nonushta",
    imageUrl: mealImages.omelet,
  },
  {
    id: "admin-soup",
    title: "Sho'rva",
    category: "Tushlik",
    imageUrl: mealImages.soup,
  },
  {
    id: "admin-vegetables",
    title: "Sabzavotlar",
    category: "Ingredientlar",
    imageUrl: mealImages.vegetables,
  },
];

export const INITIAL_DETECTED_INGREDIENTS = [
  { id: "detected-chicken", name: "Tovuq filesi", confidence: 95 },
  { id: "detected-broccoli", name: "Brokoli", confidence: 92 },
  { id: "detected-pepper", name: "Qizil bulg'or qalampiri", confidence: 90 },
  { id: "detected-carrot", name: "Sabzi", confidence: 89 },
  { id: "detected-oil", name: "Zaytun moyi", confidence: 86 },
  { id: "detected-garlic", name: "Sarimsoq", confidence: 85 },
  { id: "detected-lemon", name: "Limon", confidence: 83 },
  { id: "detected-salt", name: "Tuz", confidence: 99 },
  { id: "detected-pepper-black", name: "Qora murch", confidence: 95 },
  { id: "detected-quinoa", name: "Quinoa", confidence: 88 },
];

export const DEFAULT_WIZARD_INGREDIENTS = [
  {
    id: "builder-chicken",
    name: "Tovuq filesi",
    imageUrl: mealImages.stepChicken,
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
  },
  {
    id: "builder-quinoa",
    name: "Quinoa",
    imageUrl: mealImages.stepQuinoa,
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
  },
  {
    id: "builder-avocado",
    name: "Avokado",
    imageUrl: mealImages.vegetables,
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
  },
  {
    id: "builder-tomato",
    name: "Cherry pomidor",
    imageUrl: mealImages.vegetables,
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
  },
  {
    id: "builder-cucumber",
    name: "Bodring",
    imageUrl: mealImages.vegetables,
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
  },
  {
    id: "builder-oil",
    name: "Zaytun yog'i",
    imageUrl: mealImages.vegetables,
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
    imageUrl: mealImages.stepChicken,
  },
  {
    id: "builder-step-quinoa",
    order: 2,
    title: "Quinoani qaynatish",
    description:
      "Quinoani elakda yuvib, 2 stakan suv qo'shing. Qaynagach, olovni pasaytirib 15 daqiqa pishiring.",
    durationMinutes: 15,
    imageUrl: mealImages.stepQuinoa,
  },
  {
    id: "builder-step-vegetables",
    order: 3,
    title: "Sabzavotlarni tayyorlash",
    description:
      "Brokoli, qizil qalampir va bodringni mayda bo'laklarga bo'ling. Pomidorni yarimga bo'ling.",
    durationMinutes: 8,
    imageUrl: mealImages.vegetables,
  },
  {
    id: "builder-step-cook-chicken",
    order: 4,
    title: "Tovuqni pishirish",
    description:
      "Grilda yoki skovorodkada o'rtacha olovda har ikki tomonini 6-7 daqiqa qovuring.",
    durationMinutes: 12,
    imageUrl: mealImages.stepChicken,
  },
  {
    id: "builder-step-finish",
    order: 5,
    title: "Yakuniy yig'ish",
    description:
      "Idishga quinoa soling, ustiga sabzavotlar va tovuqni joylashtiring. Zaytun moyi va limon sharbati bilan bezang.",
    durationMinutes: 5,
    imageUrl: mealImages.chickenBowl,
  },
];

export const AI_SUGGESTED_RECIPE = createRecipe({
  id: "ai-tovuq-quinoa-bowl",
  catalogFoodId: 201,
  title: "Tovuq va quinoa bilan sabzavotli bowl",
  description: "Yengil va to'yimli tushlik uchun mukammal muvozanatli taom.",
  imageUrl: mealImages.chickenBowl,
  category: "Tushlik",
  difficulty: "Oson",
  prepTimeMinutes: 15,
  cookTimeMinutes: 10,
  totalTimeMinutes: 25,
  servings: 1,
  caloriesPerServing: 520,
  proteinPerServing: 32,
  carbsPerServing: 58,
  fatPerServing: 18,
  fiberPerServing: 7,
  sugarPerServing: 4,
  sodiumPerServing: 280,
  tags: ["AI tavsiya", "Yuqori protein"],
  allergens: [],
  source: "ai",
  ingredients: [
    {
      id: "ai-chicken",
      name: "Tovuq filesi",
      quantity: 120,
      baseQuantity: 120,
      unit: "g",
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      isRequired: true,
    },
    {
      id: "ai-quinoa",
      name: "Quinoa",
      quantity: 50,
      baseQuantity: 50,
      unit: "g",
      calories: 120,
      protein: 4.4,
      carbs: 21,
      fat: 1.9,
      isRequired: true,
    },
    {
      id: "ai-broccoli",
      name: "Brokoli",
      quantity: 70,
      baseQuantity: 70,
      unit: "g",
      calories: 24,
      protein: 2,
      carbs: 5,
      fat: 0.3,
      isRequired: true,
    },
    {
      id: "ai-pepper",
      name: "Qizil bulg'or qalampiri",
      quantity: 50,
      baseQuantity: 50,
      unit: "g",
      calories: 16,
      protein: 0.5,
      carbs: 3,
      fat: 0.2,
      isRequired: true,
    },
    {
      id: "ai-carrot",
      name: "Sabzi",
      quantity: 50,
      baseQuantity: 50,
      unit: "g",
      calories: 20,
      protein: 0.4,
      carbs: 5,
      fat: 0.1,
      isRequired: true,
    },
  ],
  steps: [],
});

const numberOrZero = (value) => {
  const number = toNumber(value);
  return Number.isFinite(number) ? number : 0;
};

export const formatNumber = (value, maximumFractionDigits = 1) => {
  const rounded = round(numberOrZero(value), maximumFractionDigits);

  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
};

export const formatQuantity = (quantity, unit, multiplier = 1) => {
  const value = numberOrZero(quantity) * numberOrZero(multiplier || 1);
  const rounded = round(value, 1);
  const display = Number.isInteger(rounded) ? rounded.toFixed(0) : rounded;
  const normalizedUnit = unit || "g";
  const separator = ["g", "kg", "ml", "l"].includes(
    String(normalizedUnit).toLowerCase(),
  )
    ? " "
    : " ";

  return `${display}${separator}${normalizedUnit}`;
};

export const getRecipeNutrition = (recipe = {}, servings = 1) => ({
  calories: Math.round(numberOrZero(recipe.caloriesPerServing ?? recipe.calories) * servings),
  protein: round(numberOrZero(recipe.proteinPerServing ?? recipe.protein) * servings, 1),
  carbs: round(numberOrZero(recipe.carbsPerServing ?? recipe.carbs) * servings, 1),
  fat: round(numberOrZero(recipe.fatPerServing ?? recipe.fat) * servings, 1),
  fiber: round(numberOrZero(recipe.fiberPerServing ?? recipe.fiber) * servings, 1),
  sugar: round(numberOrZero(recipe.sugarPerServing ?? recipe.sugar) * servings, 1),
  sodium: Math.round(numberOrZero(recipe.sodiumPerServing ?? recipe.sodium) * servings),
});

const getIngredientScale = (ingredient) => {
  const baseQuantity = Math.max(0.01, numberOrZero(ingredient.baseQuantity || ingredient.quantity || 1));

  return numberOrZero(ingredient.quantity) / baseQuantity;
};

export const getIngredientsNutrition = (ingredients = []) => ({
  calories: Math.round(
    sumBy(ingredients, (ingredient) => numberOrZero(ingredient.calories) * getIngredientScale(ingredient)),
  ),
  protein: round(
    sumBy(ingredients, (ingredient) => numberOrZero(ingredient.protein) * getIngredientScale(ingredient)),
    1,
  ),
  carbs: round(
    sumBy(ingredients, (ingredient) => numberOrZero(ingredient.carbs) * getIngredientScale(ingredient)),
    1,
  ),
  fat: round(
    sumBy(ingredients, (ingredient) => numberOrZero(ingredient.fat) * getIngredientScale(ingredient)),
    1,
  ),
  fiber: round(
    sumBy(ingredients, (ingredient) => numberOrZero(ingredient.fiber) * getIngredientScale(ingredient)),
    1,
  ),
  sugar: round(
    sumBy(ingredients, (ingredient) => numberOrZero(ingredient.sugar) * getIngredientScale(ingredient)),
    1,
  ),
  sodium: Math.round(
    sumBy(ingredients, (ingredient) => numberOrZero(ingredient.sodium) * getIngredientScale(ingredient)),
  ),
});

export const findMockRecipe = (slugOrId) => {
  const target = String(slugOrId || "");

  return (
    find(MOCK_RECIPES, (recipe) =>
      includes([String(recipe.id), String(recipe.slug), String(recipe.catalogFoodId)], target),
    ) || null
  );
};

export const filterRecipes = (recipes, search, tag) => {
  const query = lowerCase(search);

  return filter(recipes, (recipe) => {
    const matchesSearch =
      !query ||
      lowerCase(recipe.title).includes(query) ||
      lowerCase(recipe.description).includes(query);
    const matchesTag = !tag || includes(recipe.tags, tag);

    return matchesSearch && matchesTag;
  });
};

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
    imageUrl: imageUrl || mealImages.chickenBowl,
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
