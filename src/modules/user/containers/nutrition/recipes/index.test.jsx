import React from "react";
import i18n from "@/lib/i18n";

i18n.changeLanguage("uz");
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { last } from "lodash";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NutritionRecipesPage from "./index.jsx";

const mockUseNutritionRecipes = vi.fn();
const mockUseMyNutritionRecipes = vi.fn();
const mockToggleFavorite = vi.fn();
const mockAddToMealLog = vi.fn();
const mockCreateMyRecipe = vi.fn();
const mockRequestPublication = vi.fn();
const mockUploadMyRecipeImage = vi.fn();
const mockUploadRecipeProductImages = vi.fn();
const mockCreateRecipeGenerationJob = vi.fn();
const mockSaveGeneratedRecipeSuggestion = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock("@/hooks/app/use-nutrition-recipes.js", () => ({
  useNutritionRecipes: (...args) => mockUseNutritionRecipes(...args),
  useMyNutritionRecipes: (...args) => mockUseMyNutritionRecipes(...args),
  useNutritionRecipeGallery: () => ({
    images: [
      {
        id: "gallery-1",
        label: "Fresh salad",
        url: "https://cdn.liveon.test/gallery/salad.webp",
      },
    ],
    isLoading: false,
  }),
  useNutritionRecipeFilters: () => ({
    categories: [
      {
        id: 2,
        label: "Tushlik",
      },
    ],
    cuisines: [
      {
        id: 5,
        label: "O'zbek",
      },
    ],
    dietaryTags: ["quick"],
    allergenTags: ["gluten"],
    isLoading: false,
  }),
  useNutritionRecipeDetail: () => ({
    recipe: null,
    isLoading: false,
  }),
  useNutritionRecipeActions: () => ({
    toggleFavorite: mockToggleFavorite,
    addToMealLog: mockAddToMealLog,
    isUpdating: false,
  }),
  useNutritionRecipeBuilderActions: () => ({
    createMyRecipe: mockCreateMyRecipe,
    requestPublication: mockRequestPublication,
    uploadMyRecipeImage: mockUploadMyRecipeImage,
    uploadRecipeProductImages: mockUploadRecipeProductImages,
    createRecipeGenerationJob: mockCreateRecipeGenerationJob,
    saveGeneratedRecipeSuggestion: mockSaveGeneratedRecipeSuggestion,
    isUpdating: false,
  }),
}));

const renderRecipesPage = () =>
  render(
    <MemoryRouter initialEntries={["/user/nutrition/recipes"]}>
      <NutritionRecipesPage />
    </MemoryRouter>,
  );

describe("NutritionRecipesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToggleFavorite.mockResolvedValue({});
    mockAddToMealLog.mockResolvedValue({});
    mockCreateMyRecipe.mockResolvedValue({ recipe: { id: 77 } });
    mockRequestPublication.mockResolvedValue({ recipe: { id: 77 } });
    mockUploadMyRecipeImage.mockResolvedValue({
      id: "custom-image-1",
      url: "https://cdn.liveon.test/custom.webp",
    });
    mockUploadRecipeProductImages.mockResolvedValue([
      { id: "upload-1", url: "https://cdn.liveon.test/product.webp" },
    ]);
    mockCreateRecipeGenerationJob.mockResolvedValue({
      job: {
        id: "job-1",
        status: "completed",
        recognizedProducts: [{ name: "Sabzi", ingredientId: 5 }],
        suggestions: [{ id: "generated-1", title: "Sabzili salat" }],
      },
    });
    mockSaveGeneratedRecipeSuggestion.mockResolvedValue({
      recipe: { id: 88, title: "Sabzili salat" },
    });
    mockUseNutritionRecipes.mockReturnValue({
      recipes: [
        {
          id: "recipe-11",
          catalogFoodId: 11,
          title: "Toshkent palovi",
          description: "Klassik palov",
          calories: 540,
          protein: 18,
          carbs: 62,
          fat: 22,
          difficulty: "medium",
          totalTimeMinutes: 80,
          ratingAverage: 4.7,
          ratingCount: 12,
          isFeatured: true,
          servingLabel: "350 g",
          imageUrl: null,
          ingredients: [],
          instructions: [],
          ingredientsCount: 3,
          stepsCount: 4,
          isFavorite: false,
        },
      ],
      pagination: {
        total: 1,
        totalPages: 1,
      },
      isLoading: false,
    });
    mockUseMyNutritionRecipes.mockReturnValue({
      recipes: [
        {
          id: "recipe-77",
          catalogFoodId: 77,
          title: "Uy salati",
          recipeStatus: "draft",
          imageUrl: null,
          calories: 220,
          protein: 8,
          carbs: 24,
          fat: 10,
          ownership: {
            canEdit: true,
            canRequestPublication: true,
          },
        },
      ],
      pagination: { total: 1 },
      isLoading: false,
    });
  });

  it("renders a tabbed recipe app shell with custom and AI entry points", () => {
    renderRecipesPage();

    expect(screen.getByRole("button", { name: "Explore" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "My Recipes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "AI From Image" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Favorites" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create recipe" })).toBeInTheDocument();
  });

  it("shows owned recipes with publication request actions", async () => {
    renderRecipesPage();

    fireEvent.click(screen.getByRole("button", { name: "My Recipes" }));

    expect(screen.getByText("Uy salati")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Request public review" }));

    await waitFor(() => {
      expect(mockRequestPublication).toHaveBeenCalledWith(77);
    });
  });

  it("creates a custom recipe with selected gallery image, ingredients, and steps", async () => {
    renderRecipesPage();

    fireEvent.click(screen.getByRole("button", { name: "Create recipe" }));
    fireEvent.change(screen.getByLabelText("Recipe title"), {
      target: { value: "Uy salati" },
    });
    fireEvent.change(screen.getByLabelText("Ingredient ID"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("Ingredient grams"), {
      target: { value: "150" },
    });
    fireEvent.change(screen.getByLabelText("Instruction"), {
      target: { value: "Aralashtiring" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Choose from gallery" }));
    fireEvent.click(screen.getByRole("button", { name: "Fresh salad" }));
    fireEvent.click(screen.getByRole("button", { name: "Save recipe" }));

    await waitFor(() => {
      expect(mockCreateMyRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Uy salati",
          galleryImageId: "gallery-1",
          ingredients: [expect.objectContaining({ ingredientId: 5, grams: 150 })],
          instructions: [expect.objectContaining({ body: "Aralashtiring" })],
        }),
      );
    });
  });

  it("uses the latest selected recipe image source when upload and gallery both change", async () => {
    renderRecipesPage();

    fireEvent.click(screen.getByRole("button", { name: "Create recipe" }));
    fireEvent.change(screen.getByLabelText("Recipe title"), {
      target: { value: "Uy salati" },
    });
    fireEvent.change(screen.getByLabelText("Ingredient ID"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("Ingredient grams"), {
      target: { value: "150" },
    });
    fireEvent.change(screen.getByLabelText("Instruction"), {
      target: { value: "Aralashtiring" },
    });
    fireEvent.change(screen.getByLabelText("Recipe image"), {
      target: {
        files: [new File(["image"], "custom.webp", { type: "image/webp" })],
      },
    });

    await screen.findByText("Uploaded image selected");

    fireEvent.click(screen.getByRole("button", { name: "Choose from gallery" }));
    fireEvent.click(screen.getByRole("button", { name: "Fresh salad" }));
    fireEvent.click(screen.getByRole("button", { name: "Save recipe" }));

    await waitFor(() => {
      expect(mockCreateMyRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUploadId: undefined,
          galleryImageId: "gallery-1",
        }),
      );
    });
  });

  it("uploads a custom recipe image and includes the upload id in the draft", async () => {
    renderRecipesPage();

    fireEvent.click(screen.getByRole("button", { name: "Create recipe" }));
    fireEvent.change(screen.getByLabelText("Recipe title"), {
      target: { value: "Uy salati" },
    });
    fireEvent.change(screen.getByLabelText("Ingredient ID"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("Ingredient grams"), {
      target: { value: "150" },
    });
    fireEvent.change(screen.getByLabelText("Instruction"), {
      target: { value: "Aralashtiring" },
    });
    fireEvent.change(screen.getByLabelText("Recipe image"), {
      target: {
        files: [new File(["image"], "custom.webp", { type: "image/webp" })],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save recipe" }));

    await waitFor(() => {
      expect(mockUploadMyRecipeImage).toHaveBeenCalledWith(expect.any(File));
      expect(mockCreateMyRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUploadId: "custom-image-1",
          galleryImageId: undefined,
        }),
      );
    });
  });

  it("runs the AI image recipe generation entry point", async () => {
    renderRecipesPage();

    fireEvent.click(screen.getByRole("button", { name: "AI From Image" }));
    fireEvent.change(screen.getByLabelText("Product images"), {
      target: {
        files: [new File(["image"], "product.webp", { type: "image/webp" })],
      },
    });
    expect(screen.getByText("product.webp")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Generate from uploaded images" }));

    await waitFor(() => {
      expect(mockUploadRecipeProductImages).toHaveBeenCalled();
      expect(mockCreateRecipeGenerationJob).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUploadIds: ["upload-1"],
          confirmedProducts: [],
        }),
      );
    });
    expect(screen.getByText("Sabzili salat")).toBeInTheDocument();
  });

  it("saves an AI generated recipe suggestion as an editable draft", async () => {
    renderRecipesPage();

    fireEvent.click(screen.getByRole("button", { name: "AI From Image" }));
    fireEvent.change(screen.getByLabelText("Product images"), {
      target: {
        files: [new File(["image"], "product.webp", { type: "image/webp" })],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate from uploaded images" }));

    await screen.findByText("Sabzili salat");
    fireEvent.click(screen.getByRole("button", { name: "Save generated draft" }));

    await waitFor(() => {
      expect(mockSaveGeneratedRecipeSuggestion).toHaveBeenCalledWith(
        "job-1",
        { suggestionId: "generated-1" },
      );
    });
  });

  it("passes category, cuisine, macro, allergen, dietary tag, and saved filters to the recipes query", async () => {
    renderRecipesPage();
    mockUseNutritionRecipes.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Filterlar" }));
    fireEvent.click(screen.getByRole("button", { name: "Kategoriya" }));
    fireEvent.click(last(screen.getAllByRole("button", { name: "Tushlik" })));
    fireEvent.click(screen.getByRole("button", { name: "Oshxona" }));
    fireEvent.click(screen.getByRole("button", { name: "O'zbek" }));
    fireEvent.click(screen.getByRole("button", { name: "Teg" }));
    fireEvent.click(screen.getByRole("button", { name: "quick" }));
    fireEvent.click(screen.getByRole("button", { name: "Allergen" }));
    fireEvent.click(screen.getByRole("button", { name: "gluten" }));
    fireEvent.click(screen.getByRole("button", { name: "Qiyinlik" }));
    fireEvent.click(screen.getByRole("button", { name: "Oson" }));
    fireEvent.change(screen.getByLabelText("Maksimal vaqt"), {
      target: { value: "30" },
    });
    fireEvent.change(screen.getByLabelText("Minimal protein"), {
      target: { value: "25" },
    });
    fireEvent.change(screen.getByLabelText("Minimal kcal"), {
      target: { value: "350" },
    });
    fireEvent.change(screen.getByLabelText("Maksimal kcal"), {
      target: { value: "650" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Saralash" }));
    fireEvent.click(screen.getByRole("button", { name: "Reyting" }));
    fireEvent.click(screen.getByRole("button", { name: "Tavsiya etilgan" }));
    fireEvent.click(screen.getByRole("button", { name: "Saqlanganlar" }));

    expect(mockUseNutritionRecipes).not.toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: "2",
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Filterlarni qo'llash" }));

    await waitFor(() => {
      expect(mockUseNutritionRecipes).toHaveBeenLastCalledWith(
        expect.objectContaining({
          categoryId: "2",
          cuisineId: "5",
          dietaryTag: "quick",
          excludeAllergenTag: "gluten",
          difficulty: "easy",
          maxTotalTimeMinutes: "30",
          minProtein: "25",
          minCalories: "350",
          maxCalories: "650",
          sort: "highestRated",
          featuredOnly: true,
          favoriteOnly: true,
        }),
      );
    });
  });

  it("clears active recipe filters in one action", async () => {
    renderRecipesPage();

    fireEvent.change(screen.getByLabelText("Retsept qidirish"), {
      target: { value: "palov" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Filterlar" }));
    fireEvent.click(screen.getByRole("button", { name: "Kategoriya" }));
    fireEvent.click(last(screen.getAllByRole("button", { name: "Tushlik" })));
    fireEvent.click(screen.getByRole("button", { name: "Allergen" }));
    fireEvent.click(screen.getByRole("button", { name: "gluten" }));
    fireEvent.click(screen.getByRole("button", { name: "Qiyinlik" }));
    fireEvent.click(screen.getByRole("button", { name: "Oson" }));
    fireEvent.change(screen.getByLabelText("Maksimal vaqt"), {
      target: { value: "30" },
    });
    fireEvent.change(screen.getByLabelText("Minimal protein"), {
      target: { value: "25" },
    });
    fireEvent.change(screen.getByLabelText("Minimal kcal"), {
      target: { value: "350" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Saqlanganlar" }));
    fireEvent.click(screen.getByRole("button", { name: "Tavsiya etilgan" }));
    fireEvent.click(screen.getByRole("button", { name: "Filterlarni qo'llash" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Filterlarni tozalash" }),
    );

    await waitFor(() => {
      expect(mockUseNutritionRecipes).toHaveBeenLastCalledWith(
        expect.objectContaining({
          q: "",
          sort: "newest",
          categoryId: "",
          cuisineId: "",
          dietaryTag: "",
          excludeAllergenTag: "",
          difficulty: "",
          maxTotalTimeMinutes: "",
          minProtein: "",
          minCalories: "",
          maxCalories: "",
          featuredOnly: undefined,
          favoriteOnly: undefined,
        }),
      );
    });
  });

  it("selects meal type from a bottom drawer before adding a recipe to the meal log", async () => {
    renderRecipesPage();

    fireEvent.click(screen.getByRole("button", { name: "Mahal" }));
    fireEvent.click(screen.getByRole("button", { name: "Nonushta" }));
    fireEvent.click(screen.getByRole("button", { name: "Bugungi logga qo'shish" }));

    await waitFor(() => {
      expect(mockAddToMealLog).toHaveBeenCalledWith(11, {
        date: expect.any(String),
        mealType: "breakfast",
        servings: 1,
      });
    });
  });

  it("debounces search before sending it to the recipes query", () => {
    vi.useFakeTimers();

    try {
      renderRecipesPage();
      mockUseNutritionRecipes.mockClear();

      fireEvent.change(screen.getByLabelText("Retsept qidirish"), {
        target: { value: "palov" },
      });

      expect(mockUseNutritionRecipes).toHaveBeenLastCalledWith(
        expect.objectContaining({
          q: "",
        }),
      );

      act(() => {
        vi.advanceTimersByTime(349);
      });
      expect(mockUseNutritionRecipes).not.toHaveBeenLastCalledWith(
        expect.objectContaining({
          q: "palov",
        }),
      );

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(mockUseNutritionRecipes).toHaveBeenLastCalledWith(
        expect.objectContaining({
          q: "palov",
        }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("links recipe cards to the dedicated detail route", () => {
    renderRecipesPage();

    expect(
      screen.getByRole("link", { name: "Toshkent palovi batafsil" }),
    ).toHaveAttribute("href", "/user/nutrition/recipes/11");
  });
});
