import React from "react";
import i18n from "@/lib/i18n";

i18n.changeLanguage("uz");
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { size, take } from "lodash";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NutritionRecipesPage from "./index.jsx";
import RecipeCreateWizard from "./components/recipe-create-wizard.jsx";
import { MOCK_RECIPES } from "./recipe-mock-data.js";

const mockToggleFavorite = vi.fn();
const mockAddToMealLog = vi.fn();
const mockAddToMealPlan = vi.fn();
const mockCreateShoppingList = vi.fn();
const mockCreateMyRecipe = vi.fn();
const mockRequestPublication = vi.fn();
const mockUploadRecipeProductImages = vi.fn();
const mockCreateRecipeGenerationJob = vi.fn();
const mockSaveGeneratedRecipeSuggestion = vi.fn();
const recipeHookState = vi.hoisted(() => ({
  catalogRecipes: [],
  myRecipes: [],
  isCatalogLoading: false,
  isMyRecipesLoading: false,
  lastCatalogFilters: null,
  activeFilters: [],
  pantryItems: [],
  mealPlans: [],
  activePlan: null,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/hooks/app/use-nutrition-recipes.js", () => ({
  useNutritionRecipes: (filters = {}) => {
    recipeHookState.lastCatalogFilters = filters;
    const page = Number(filters.page || 1);
    const pageSize = Number(filters.pageSize || 12);
    const query = String(filters.q || "").toLowerCase();
    const filteredRecipes = recipeHookState.catalogRecipes.filter((recipe) => {
      const matchesSearch =
        !query ||
        String(recipe.title || recipe.name || "")
          .toLowerCase()
          .includes(query) ||
        String(recipe.description || "")
          .toLowerCase()
          .includes(query);
      const matchesFavorite =
        !filters.favoriteOnly || recipe.isFavorite === true;

      return matchesSearch && matchesFavorite;
    });
    const totalPages = Math.max(1, Math.ceil(filteredRecipes.length / pageSize));
    const start = (page - 1) * pageSize;

    return {
      recipes: filteredRecipes.slice(start, start + pageSize),
      pagination: {
        page,
        pageSize,
        total: filteredRecipes.length,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      activeFilters: recipeHookState.activeFilters,
      isLoading: recipeHookState.isCatalogLoading,
    };
  },
  useMyNutritionRecipes: () => ({
    recipes: recipeHookState.myRecipes,
    pagination: { total: size(recipeHookState.myRecipes) },
    isLoading: recipeHookState.isMyRecipesLoading,
  }),
  useNutritionRecipeGallery: () => ({
    images: [],
    isLoading: false,
  }),
  useNutritionRecipeFilters: () => ({
    categories: [],
    cuisines: [],
    dietaryTags: [],
    allergenTags: [],
    isLoading: false,
  }),
  useNutritionRecipeDetail: () => ({
    recipe: null,
    isLoading: false,
  }),
  useNutritionRecipeActions: () => ({
    toggleFavorite: mockToggleFavorite,
    addToMealLog: mockAddToMealLog,
    addToMealPlan: mockAddToMealPlan,
    createShoppingList: mockCreateShoppingList,
    isUpdating: false,
  }),
  useNutritionRecipeBuilderActions: () => ({
    createMyRecipe: mockCreateMyRecipe,
    requestPublication: mockRequestPublication,
    uploadMyRecipeImage: vi.fn(),
    uploadRecipeProductImages: mockUploadRecipeProductImages,
    createRecipeGenerationJob: mockCreateRecipeGenerationJob,
    saveGeneratedRecipeSuggestion: mockSaveGeneratedRecipeSuggestion,
    isUpdating: false,
  }),
}));

vi.mock("@/hooks/app/use-nutrition-ai.js", () => ({
  useNutritionAiPantry: () => ({
    pantryItems: recipeHookState.pantryItems,
    getSubstitutions: vi.fn(),
    isSubstitutionPending: false,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/app/use-meal-plan.js", () => ({
  useMealPlan: () => ({
    plans: recipeHookState.mealPlans,
    activePlan: recipeHookState.activePlan,
    isLoading: false,
  }),
}));

const renderRecipesPage = () =>
  render(
    <MemoryRouter initialEntries={["/user/nutrition/recipes"]}>
      <Routes>
        <Route path="/user/nutrition/recipes" element={<NutritionRecipesPage />} />
      </Routes>
    </MemoryRouter>,
  );

const createGeneratedRecipeJob = () => ({
  id: "job-1",
  status: "completed",
  reviewOnly: true,
  imageUploadIds: ["upload-1"],
  recognizedProducts: [
    {
      name: "Ismaloq",
      quantity: 100,
      unit: "g",
      confidence: 0.96,
    },
  ],
  suggestions: [
    {
      id: "generated-1",
      title: "Ismaloqli proteinli bowl",
      description: "Tasdiqlangan mahsulotlar asosida yaratilgan draft.",
      explanation: "Tez tayyorlanadigan balansli variant.",
      calories: 320,
      protein: 22,
      carbs: 34,
      fat: 12,
      cookingTimeMinutes: 18,
      servings: 2,
      confidence: 0.7,
      reviewOnly: true,
      ingredients: [{ name: "Ismaloq", quantity: 100, unit: "g" }],
      steps: [{ stepNumber: 1, body: "Ingredientlarni tayyorlang." }],
    },
  ],
});

describe("NutritionRecipesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:recipe-image"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    Element.prototype.scrollIntoView = vi.fn();
    recipeHookState.catalogRecipes = MOCK_RECIPES;
    recipeHookState.myRecipes = [];
    recipeHookState.isCatalogLoading = false;
    recipeHookState.isMyRecipesLoading = false;
    recipeHookState.lastCatalogFilters = null;
    recipeHookState.activeFilters = [];
    recipeHookState.pantryItems = [];
    recipeHookState.mealPlans = [
      {
        id: "plan-1",
        name: "Haftalik reja",
        status: "active",
        days: [{ dayNumber: 1, dayKey: "day-1", meals: [] }],
        durationDays: 7,
      },
    ];
    recipeHookState.activePlan = recipeHookState.mealPlans[0];
    mockToggleFavorite.mockResolvedValue({});
    mockAddToMealLog.mockResolvedValue({});
    mockAddToMealPlan.mockResolvedValue({});
    mockCreateShoppingList.mockResolvedValue({ items: [] });
    mockCreateMyRecipe.mockResolvedValue({
      recipe: { catalogFoodId: 777, title: "Yangi salat" },
    });
    mockRequestPublication.mockResolvedValue({});
    mockUploadRecipeProductImages.mockResolvedValue([
      {
        id: "upload-1",
        url: "/uploads/recipe-products.png",
        fileName: "products.png",
      },
    ]);
    mockCreateRecipeGenerationJob.mockResolvedValue({
      job: createGeneratedRecipeJob(),
    });
    mockSaveGeneratedRecipeSuggestion.mockResolvedValue({
      target: "draftRecipe",
      recipe: { id: 999, title: "Ismaloqli proteinli bowl" },
    });
  });

  it("renders explore cards and opens the detail drawer", () => {
    renderRecipesPage();

    expect(screen.getByRole("heading", { name: "Bugungi retseptlar" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Kashf etish" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Mening retseptlarim" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Rasmdan AI retsept" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Sevimlilar" })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /batafsil/i })[0]);

    expect(
      screen.getByRole("button", { name: "Pishirishni boshlash" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Masalliqlar")).toBeInTheDocument();
  });

  it("shows an empty state when the API returns no catalog recipes", () => {
    recipeHookState.catalogRecipes = [];

    renderRecipesPage();

    expect(screen.getByText("Retseptlar topilmadi")).toBeInTheDocument();
    expect(screen.queryByText("Bananli jo'xori bo'tqasi")).not.toBeInTheDocument();
    expect(screen.queryByText("Somon va brokkoli")).not.toBeInTheDocument();
  });

  it("filters recipes by search text", () => {
    renderRecipesPage();

    fireEvent.change(screen.getByLabelText("Retseptlar qidirish"), {
      target: { value: "banan" },
    });

    expect(screen.getAllByText("Bananli jo'xori bo'tqasi").length).toBeGreaterThan(0);
    expect(screen.queryByText("Somon va brokkoli")).not.toBeInTheDocument();
    expect(recipeHookState.lastCatalogFilters).toMatchObject({
      q: "banan",
      page: 1,
      pageSize: 12,
    });
  });

  it("sends advanced filters to the server query", async () => {
    renderRecipesPage();

    fireEvent.click(screen.getByRole("button", { name: /^Filterlar$/ }));
    fireEvent.click(screen.getByRole("button", { name: "30 daq" }));
    fireEvent.click(screen.getByRole("button", { name: "25g protein" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Tavsiya etilgan" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Saqlanganlar" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Filterlarni qo'llash" }),
    );

    await waitFor(() => {
      expect(recipeHookState.lastCatalogFilters).toMatchObject({
        maxTotalTimeMinutes: "30",
        minProtein: "25",
        featuredOnly: true,
        favoriteOnly: true,
        page: 1,
        pageSize: 12,
      });
    });
  });

  it("filters recipes by pantry coverage and surfaces substitution and expiring warnings", async () => {
    recipeHookState.pantryItems = [
      {
        id: "pantry-chicken",
        name: "Tovuq filesi",
        expiresAt: "2026-06-04T00:00:00.000Z",
      },
      { id: "pantry-quinoa", name: "Quinoa" },
      { id: "pantry-salad", name: "Salat barglari" },
      { id: "pantry-avocado", name: "Avokado" },
      { id: "pantry-tomato", name: "Cherry pomidor" },
      { id: "pantry-broccoli", name: "Brokkoli" },
    ];

    renderRecipesPage();

    expect(screen.getByText("Ombor 5/5")).toBeInTheDocument();
    expect(
      screen.getByText("Tez ishlating: Tovuq filesi"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Almashtirish: Somon filesi o'rniga/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Filterlar$/ }));
    fireEvent.click(screen.getByRole("button", { name: "Ombordagilar" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Filterlarni qo'llash" }),
    );

    await waitFor(() => {
      expect(recipeHookState.lastCatalogFilters).toMatchObject({
        page: 1,
        pageSize: 50,
      });
    });
    expect(screen.getByText("Tovuqli quinoa salatasi")).toBeInTheDocument();
    expect(screen.queryByText("Somon va brokkoli")).not.toBeInTheDocument();
  });

  it("requests favorite recipes from the server when the favorites tab opens", () => {
    renderRecipesPage();

    fireEvent.click(screen.getByRole("tab", { name: "Sevimlilar" }));

    expect(recipeHookState.lastCatalogFilters).toMatchObject({
      favoriteOnly: true,
      page: 1,
      pageSize: 12,
    });
  });

  it("uses server pagination controls for catalog recipes", async () => {
    recipeHookState.catalogRecipes = Array.from({ length: 13 }, (_, index) => ({
      ...MOCK_RECIPES[0],
      id: `recipe-${200 + index}`,
      catalogFoodId: 200 + index,
      title: `Server retsept ${index + 1}`,
      slug: `server-retsept-${index + 1}`,
    }));

    renderRecipesPage();

    expect(screen.getByText("13 ta retsept, 1/2 sahifa")).toBeInTheDocument();
    expect(screen.queryByText("Server retsept 13")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Keyingi sahifa" }));

    await waitFor(() => {
      expect(recipeHookState.lastCatalogFilters).toMatchObject({
        page: 2,
        pageSize: 12,
      });
    });
    expect(screen.getByText("Server retsept 13")).toBeInTheDocument();
  });

  it("toggles favorite and scales detail drawer ingredients with serving controls", () => {
    renderRecipesPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Tovuqli quinoa salatasi sevimlilarga qo'shish",
      }),
    );
    expect(
      screen.getByRole("button", {
        name: "Tovuqli quinoa salatasi sevimlilardan olib tashlash",
      }),
    ).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getAllByRole("button", { name: /batafsil/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /Masalliqlar/ }));
    fireEvent.click(screen.getByRole("button", { name: "Porsiyani oshirish" }));

    expect(screen.getByText("240 g")).toBeInTheDocument();
    expect(screen.getAllByText("840").length).toBeGreaterThan(0);
  });

  it("persists favorite changes for catalog-backed recipes outside the explore list", async () => {
    recipeHookState.catalogRecipes = [];
    recipeHookState.myRecipes = take(MOCK_RECIPES, 1);

    renderRecipesPage();

    fireEvent.click(screen.getByRole("tab", { name: "Mening retseptlarim" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Tovuqli quinoa salatasi sevimlilarga qo'shish",
      }),
    );

    await waitFor(() => {
      expect(mockToggleFavorite).toHaveBeenCalledWith(
        expect.objectContaining({ catalogFoodId: 101 }),
      );
    });
  });

  it("opens add drawer and submits a recipe to the meal log", async () => {
    renderRecipesPage();

    fireEvent.click(screen.getAllByRole("button", { name: "Qo'shish" })[0]);

    expect(screen.getByText("Rejaga qo'shish")).toBeInTheDocument();
    expect(screen.getByText("Saqlashdan oldingi nutrition")).toBeInTheDocument();
    expect(screen.getByText("9 ingredient snapshot")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Ovqat vaqti"), {
      target: { value: "13:45" },
    });

    const submitButtons = screen.getAllByRole("button", { name: "Qo'shish" });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => {
      expect(mockAddToMealLog).toHaveBeenCalledWith(
        101,
        expect.objectContaining({
          date: expect.any(String),
          mealType: expect.stringMatching(/breakfast|lunch|dinner|snack/),
          servings: 1,
          addedAt: expect.any(String),
        }),
      );
    });
  });

  it("submits a recipe to the selected meal plan slot", async () => {
    renderRecipesPage();

    fireEvent.click(screen.getAllByRole("button", { name: "Qo'shish" })[0]);
    fireEvent.click(screen.getByRole("tab", { name: "Reja" }));

    const submitButtons = screen.getAllByRole("button", { name: "Qo'shish" });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => {
      expect(mockAddToMealPlan).toHaveBeenCalledWith(101, {
        planId: "plan-1",
        dayKey: "day-1",
        mealType: expect.stringMatching(/breakfast|lunch|dinner|snack/),
        servings: 1,
      });
    });
  });

  it("blocks recipe meal-plan submit when the selected plan is archived", () => {
    recipeHookState.mealPlans = [
      {
        id: "archived-plan",
        name: "Eski reja",
        status: "archived",
        days: [{ dayNumber: 1, dayKey: "day-1", meals: [] }],
        durationDays: 7,
      },
    ];
    recipeHookState.activePlan = recipeHookState.mealPlans[0];

    renderRecipesPage();

    fireEvent.click(screen.getAllByRole("button", { name: "Qo'shish" })[0]);
    fireEvent.click(screen.getByRole("tab", { name: "Reja" }));

    expect(
      screen.getByText("Arxivlangan rejaga retsept qo'shib bo'lmaydi."),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Qo'shish" }).at(-1),
    ).toBeDisabled();
    expect(mockAddToMealPlan).not.toHaveBeenCalled();
  });

  it("shows empty states for My Recipes and Favorites", () => {
    renderRecipesPage();

    fireEvent.click(screen.getByRole("tab", { name: "Mening retseptlarim" }));
    expect(screen.getByText("Retseptlar topilmadi")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Retsept yaratish" }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("tab", { name: "Sevimlilar" }));
    expect(screen.getByText("Birinchi retseptingizni yarating")).toBeInTheDocument();
  });

  it("supports the AI From Image manual ingredient flow without mock chips", () => {
    renderRecipesPage();

    fireEvent.click(screen.getByRole("tab", { name: "Rasmdan AI retsept" }));
    expect(screen.getByText("Ingredient rasmini yuklang")).toBeInTheDocument();
    expect(screen.getByText("AI tavsiya hali yaratilmagan")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Tovuq filesi olib tashlash" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Shu ingredientlardan retsept chiqarish" }),
    ).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Ingredient qo'shish"), {
      target: { value: "Ismaloq" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ingredient qo'shish" }));

    expect(screen.getByDisplayValue("Ismaloq")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Shu ingredientlardan retsept chiqarish" }),
    ).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Ismaloq olib tashlash" }));
    expect(screen.queryByDisplayValue("Ismaloq")).not.toBeInTheDocument();
  });

  it("uploads product images, generates suggestions, and saves a draft recipe", async () => {
    renderRecipesPage();

    fireEvent.click(screen.getByRole("tab", { name: "Rasmdan AI retsept" }));
    const file = new File(["recipe"], "products.png", { type: "image/png" });

    fireEvent.change(screen.getByLabelText("Ingredient rasmi yuklash"), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(mockUploadRecipeProductImages).toHaveBeenCalledWith([file]);
    });

    fireEvent.change(screen.getByLabelText("Ingredient qo'shish"), {
      target: { value: "Ismaloq" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ingredient qo'shish" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "Shu ingredientlardan retsept chiqarish",
        }),
      ).not.toBeDisabled();
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Shu ingredientlardan retsept chiqarish",
      }),
    );

    await waitFor(() => {
      expect(mockCreateRecipeGenerationJob).toHaveBeenCalledWith({
        imageUploadIds: ["upload-1"],
        confirmedProducts: [
          {
            name: "Ismaloq",
            quantity: 100,
            unit: "g",
            confidence: 1,
          },
        ],
      });
    });
    expect(
      screen.getAllByText("Ismaloqli proteinli bowl").length,
    ).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole("button", { name: "Draft retseptga saqlash" }),
    );

    await waitFor(() => {
      expect(mockSaveGeneratedRecipeSuggestion).toHaveBeenCalledWith("job-1", {
        suggestionId: "generated-1",
        target: "draftRecipe",
      });
    });
    expect(screen.getByText("Draft retsept saqlandi")).toBeInTheDocument();
  });

  it("shows a localized processing state for AI image generation jobs without suggestions", async () => {
    mockCreateRecipeGenerationJob.mockResolvedValueOnce({
      job: {
        id: "job-processing",
        status: "processing",
        reviewOnly: true,
        imageUploadIds: ["upload-1"],
        recognizedProducts: [
          {
            name: "Ismaloq",
            quantity: 100,
            unit: "g",
            confidence: 0.96,
          },
        ],
        suggestions: [],
      },
    });

    renderRecipesPage();

    fireEvent.click(screen.getByRole("tab", { name: "Rasmdan AI retsept" }));
    const file = new File(["recipe"], "products.png", { type: "image/png" });

    fireEvent.change(screen.getByLabelText("Ingredient rasmi yuklash"), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(mockUploadRecipeProductImages).toHaveBeenCalledWith([file]);
    });

    fireEvent.change(screen.getByLabelText("Ingredient qo'shish"), {
      target: { value: "Ismaloq" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ingredient qo'shish" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Shu ingredientlardan retsept chiqarish",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("AI retsept tayyorlanmoqda"),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Ishlanmoqda")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Job qabul qilindi. Tavsiyalar tayyor bo'lishi bilan shu yerda chiqadi.",
      ),
    ).toBeInTheDocument();
  });

  it("shows generation failure and retries with the same reviewed products", async () => {
    mockCreateRecipeGenerationJob
      .mockRejectedValueOnce(new Error("generation failed"))
      .mockResolvedValueOnce({ job: createGeneratedRecipeJob() });

    renderRecipesPage();

    fireEvent.click(screen.getByRole("tab", { name: "Rasmdan AI retsept" }));
    const file = new File(["recipe"], "products.png", { type: "image/png" });

    fireEvent.change(screen.getByLabelText("Ingredient rasmi yuklash"), {
      target: { files: [file] },
    });
    await waitFor(() => {
      expect(mockUploadRecipeProductImages).toHaveBeenCalledWith([file]);
    });

    fireEvent.change(screen.getByLabelText("Ingredient qo'shish"), {
      target: { value: "Ismaloq" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ingredient qo'shish" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Shu ingredientlardan retsept chiqarish",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("AI retsept yaratib bo'lmadi. Qayta urinib ko'ring."),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Qayta urinish" }));

    await waitFor(() => {
      expect(mockCreateRecipeGenerationJob).toHaveBeenCalledTimes(2);
      expect(
        screen.getAllByText("Ismaloqli proteinli bowl").length,
      ).toBeGreaterThan(0);
    });
  });
});

describe("RecipeCreateWizard", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("validates the first step and recalculates nutrition after ingredient edits", async () => {
    render(
      <MemoryRouter>
        <RecipeCreateWizard onCancel={vi.fn()} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Keyingisi: Ingredientlar" }));
    expect(screen.getByText("Retsept nomini kiriting")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Retsept nomi"), {
      target: { value: "Yangi salat" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Kategoriya" }));
    fireEvent.click(screen.getByRole("button", { name: "Tushlik" }));
    fireEvent.click(screen.getByRole("button", { name: "Qiyinchilik darajasi" }));
    fireEvent.click(screen.getByRole("button", { name: "Oson" }));
    fireEvent.click(screen.getByRole("button", { name: "Keyingisi: Ingredientlar" }));

    expect(
      screen.getByRole("heading", { name: "2-qadam: Ingredientlar" }),
    ).toBeInTheDocument();
    expect(screen.getByText("468")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Tovuq filesi miqdori"), {
      target: { value: "240" },
    });

    await waitFor(() => {
      expect(screen.getByText("633")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Bodringni o'chirish" }));
    expect(screen.queryByText("Bodring")).not.toBeInTheDocument();
  });

  it("submits a public recipe for admin review through builder actions", async () => {
    render(
      <MemoryRouter>
        <RecipeCreateWizard onCancel={vi.fn()} />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Retsept nomi"), {
      target: { value: "Yangi salat" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Kategoriya" }));
    fireEvent.click(screen.getByRole("button", { name: "Tushlik" }));
    fireEvent.click(screen.getByRole("button", { name: "Qiyinchilik darajasi" }));
    fireEvent.click(screen.getByRole("button", { name: "Oson" }));
    fireEvent.click(screen.getByRole("button", { name: "Keyingisi: Ingredientlar" }));
    fireEvent.click(screen.getByRole("button", { name: "Keyingisi" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Admin ko'rib chiqishiga yuborish",
      }),
    );

    await waitFor(() => {
      expect(mockCreateMyRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Yangi salat",
          recipeStatus: "review_requested",
          needsAdminReview: true,
          ingredients: expect.arrayContaining([
            expect.objectContaining({
              name: "Tovuq filesi",
              nutritionSource: "manual",
              nutritionSnapshot: expect.objectContaining({
                calories: 165,
              }),
            }),
          ]),
        }),
      );
      expect(mockRequestPublication).toHaveBeenCalledWith(777);
    });
  });
});
