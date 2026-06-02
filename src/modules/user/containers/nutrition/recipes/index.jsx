import React from "react";
import {
  BookOpenIcon,
  CheckIcon,
  ClockIcon,
  ImageIcon,
  PlusIcon,
  SparklesIcon,
  UtensilsIcon,
  WandSparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ImageUploadTile from "@/components/image-upload-tile";
import OptionDrawerPicker from "@/components/option-drawer-picker";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  useMyNutritionRecipes,
  useNutritionRecipeActions,
  useNutritionRecipeDetail,
  useNutritionRecipeFilters,
  useNutritionRecipeBuilderActions,
  useNutritionRecipeGallery,
  useNutritionRecipes,
} from "@/hooks/app/use-nutrition-recipes.js";
import NutritionCard from "../ui/nutrition-card.jsx";
import NutritionLayout from "../ui/nutrition-layout.jsx";
import AddToMealLogButton from "./components/add-to-meal-log-button.jsx";
import RecipeCard from "./components/recipe-card.jsx";
import RecipeFilters from "./components/recipe-filters.jsx";
import RecipeNutritionCard from "./components/recipe-nutrition-card.jsx";
import RecipeSearchBar from "./components/recipe-search-bar.jsx";
import { cn } from "@/lib/utils.js";
import useRecipeTranslation from "./lib/recipe-i18n.js";

import filter from "lodash/filter";
import find from "lodash/find";
import get from "lodash/get";
import map from "lodash/map";
import size from "lodash/size";
import slice from "lodash/slice";
import some from "lodash/some";
import toArray from "lodash/toArray";
import toNumber from "lodash/toNumber";

const SEARCH_DEBOUNCE_MS = 350;

const getMealTypeOptions = (rt) => [
  { value: "breakfast", label: rt("meals.breakfast") },
  { value: "lunch", label: rt("meals.lunch") },
  { value: "dinner", label: rt("meals.dinner") },
  { value: "snack", label: rt("meals.snack") },
];

const todayKey = () => new Date().toISOString().slice(0, 10);

const formatMacro = (value, unit = "g") =>
  `${Math.round(toNumber(value) || 0)}${unit}`;

const selectClassName =
  "h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm font-semibold";

const RecipeImage = ({ recipe, className }) => {
  if (recipe?.imageUrl) {
    return (
      <img
        src={recipe.imageUrl}
        alt=""
        className={cn("h-full w-full object-cover", className)}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={cn(
        "grid h-full w-full place-items-center bg-[rgb(var(--accent-rgb)/0.10)] text-primary",
        className,
      )}
    >
      <UtensilsIcon className="size-8" />
    </div>
  );
};

const RecipeDetailPanel = ({
  recipe,
  isLoading,
  selectedMealType,
  servings,
  onMealTypeChange,
  onServingsChange,
  onAddToMealLog,
  isUpdating,
}) => {
  const rt = useRecipeTranslation();
  const mealTypes = React.useMemo(() => getMealTypeOptions(rt), [rt]);

  if (isLoading) {
    return (
      <NutritionCard className="min-h-[420px] animate-pulse bg-muted/30" />
    );
  }

  if (!recipe) {
    return (
      <NutritionCard className="min-h-[420px] p-5">
        <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
          <BookOpenIcon className="size-10 text-primary" />
          <h2 className="mt-4 text-xl font-black tracking-normal">
            {rt("page.selectRecipe")}
          </h2>
        </div>
      </NutritionCard>
    );
  }

  return (
    <NutritionCard className="overflow-hidden p-0">
      <div className="aspect-[16/10] overflow-hidden">
        <RecipeImage recipe={recipe} />
      </div>
      <div className="space-y-5 p-5">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-foreground">
            {recipe.title}
          </h2>
          {recipe.description ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {recipe.description}
            </p>
          ) : null}
        </div>

        <RecipeNutritionCard
          recipe={recipe}
          servings={servings}
          className="grid-cols-4"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-bold uppercase text-muted-foreground">
              {rt("detail.serving")}
            </span>
            <Input
              type="number"
              min="0.25"
              step="0.25"
              value={servings}
              onChange={(event) =>
                onServingsChange(
                  Math.max(0.25, toNumber(event.target.value) || 1),
                )
              }
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold uppercase text-muted-foreground">
              {rt("detail.mealType")}
            </span>
            <OptionDrawerPicker
              value={selectedMealType}
              options={mealTypes}
              title={rt("detail.mealType")}
              ariaLabel={rt("detail.mealType")}
              triggerClassName={selectClassName}
              onChange={onMealTypeChange}
            />
          </label>
        </div>

        <AddToMealLogButton isUpdating={isUpdating} onClick={onAddToMealLog} />

        <div>
          <h3 className="text-sm font-black uppercase text-muted-foreground">
            {rt("ingredients.title")}
          </h3>
          <div className="mt-3 space-y-2">
            {map(recipe.ingredients, (ingredient) => (
              <div
                key={
                  ingredient.id || ingredient.ingredientId || ingredient.name
                }
                className="flex items-center justify-between rounded-[18px] border border-border/60 bg-background/70 px-3 py-2 text-sm"
              >
                <span className="font-semibold">{ingredient.name}</span>
                <span className="text-muted-foreground">
                  {formatMacro(
                    (ingredient.grams || ingredient.estimatedGrams) * servings,
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase text-muted-foreground">
            {rt("steps.title")}
          </h3>
          <div className="mt-3 space-y-3">
            {map(recipe.instructions, (step, index) => (
              <div
                key={step.id || `${step.stepNumber}-${index}`}
                className="rounded-[20px] border border-border/60 bg-background/70 p-3"
              >
                <div className="flex items-center gap-2 text-sm font-black">
                  <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-xs text-primary">
                    {step.stepNumber || index + 1}
                  </span>
                  {step.title || rt("steps.fallbackTitle")}
                  {step.durationMinutes ? (
                    <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <ClockIcon className="size-3" />
                      {rt("common.minutes", { count: step.durationMinutes })}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.body || step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </NutritionCard>
  );
};

const RECIPE_APP_TABS = [
  { key: "explore", label: "Explore" },
  { key: "mine", label: "My Recipes" },
  { key: "ai", label: "AI From Image" },
  { key: "favorites", label: "Favorites" },
];

const RecipeAppTabs = ({ activeTab, onChange }) => (
  <div className="flex gap-2 overflow-x-auto pb-1">
    {map(RECIPE_APP_TABS, (tab) => (
      <Button
        key={tab.key}
        type="button"
        variant={activeTab === tab.key ? "default" : "outline"}
        size="sm"
        className="shrink-0"
        onClick={() => onChange(tab.key)}
      >
        {tab.label}
      </Button>
    ))}
  </div>
);

const MyRecipesPanel = ({
  recipes,
  isLoading,
  isUpdating,
  onRequestPublication,
}) => {
  if (isLoading) {
    return <NutritionCard className="h-40 animate-pulse bg-muted/30" />;
  }

  if (!recipes.length) {
    return (
      <NutritionCard className="p-6 text-center">
        <BookOpenIcon className="mx-auto size-9 text-primary" />
        <h2 className="mt-3 text-lg font-black tracking-normal">
          No custom recipes yet
        </h2>
      </NutritionCard>
    );
  }

  return (
    <div className="grid gap-3">
      {map(recipes, (recipe) => (
        <NutritionCard key={recipe.id} className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-black tracking-normal">
                  {recipe.title}
                </h3>
                <Badge variant="outline">{recipe.recipeStatus}</Badge>
              </div>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                {Math.round(toNumber(recipe.calories) || 0)} kcal ·{" "}
                {Math.round(toNumber(recipe.protein) || 0)}g protein
              </p>
            </div>
            {recipe.ownership?.canRequestPublication ? (
              <Button
                type="button"
                size="sm"
                disabled={isUpdating}
                onClick={() => onRequestPublication(recipe.catalogFoodId)}
              >
                Request public review
              </Button>
            ) : null}
          </div>
        </NutritionCard>
      ))}
    </div>
  );
};

const RecipeBuilderPanel = ({
  isOpen,
  images,
  isUpdating,
  onOpen,
  onCreate,
  onUploadImage,
}) => {
  const [title, setTitle] = React.useState("");
  const [ingredientId, setIngredientId] = React.useState("");
  const [ingredientGrams, setIngredientGrams] = React.useState("");
  const [instruction, setInstruction] = React.useState("");
  const [galleryImageId, setGalleryImageId] = React.useState("");
  const [uploadedImage, setUploadedImage] = React.useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const titleId = React.useId();
  const ingredientIdInputId = React.useId();
  const ingredientGramsId = React.useId();
  const instructionId = React.useId();
  const imageUploadRef = React.useRef(null);
  const imageUploadTokenRef = React.useRef(0);
  const selectedGalleryImage = React.useMemo(
    () => find(images, (image) => image.id === galleryImageId) || null,
    [galleryImageId, images],
  );
  const selectedImageUrl =
    get(uploadedImage, "url") || get(selectedGalleryImage, "url") || "";

  const handleSubmit = React.useCallback(async () => {
    const resolvedUploadedImage = imageUploadRef.current
      ? await imageUploadRef.current
      : uploadedImage;
    const imageUploadId = get(resolvedUploadedImage, "id") || undefined;

    await onCreate({
      title,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      servingSize: 1,
      servingUnit: "serving",
      servings: 1,
      imageUploadId,
      galleryImageId: imageUploadId ? undefined : galleryImageId || undefined,
      ingredients: [
        {
          ingredientId: toNumber(ingredientId),
          grams: toNumber(ingredientGrams),
        },
      ],
      instructions: [{ body: instruction }],
    });
    setTitle("");
    setIngredientId("");
    setIngredientGrams("");
    setInstruction("");
    setGalleryImageId("");
    setUploadedImage(null);
    setIsGalleryOpen(false);
    imageUploadRef.current = null;
    imageUploadTokenRef.current += 1;
  }, [
    galleryImageId,
    ingredientGrams,
    ingredientId,
    instruction,
    onCreate,
    title,
    uploadedImage,
  ]);

  const handleImageUpload = React.useCallback(
    async (file) => {
      if (!file) {
        return;
      }

      const uploadToken = imageUploadTokenRef.current + 1;
      imageUploadTokenRef.current = uploadToken;
      setIsUploadingImage(true);
      setGalleryImageId("");
      setUploadedImage(null);
      const uploadPromise = onUploadImage(file);
      imageUploadRef.current = uploadPromise;

      try {
        const uploaded = await uploadPromise;
        if (imageUploadTokenRef.current === uploadToken) {
          setUploadedImage(uploaded);
          setGalleryImageId("");
        }
      } finally {
        if (imageUploadTokenRef.current === uploadToken) {
          setIsUploadingImage(false);
        }
      }
    },
    [onUploadImage],
  );

  const handleGalleryImageSelect = React.useCallback((imageId) => {
    imageUploadTokenRef.current += 1;
    imageUploadRef.current = null;
    setUploadedImage(null);
    setGalleryImageId(imageId);
    setIsUploadingImage(false);
    setIsGalleryOpen(false);
  }, []);

  const handleRemoveSelectedImage = React.useCallback(() => {
    imageUploadTokenRef.current += 1;
    imageUploadRef.current = null;
    setUploadedImage(null);
    setGalleryImageId("");
    setIsUploadingImage(false);
  }, []);

  return (
    <NutritionCard className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-normal">Custom recipe</h2>
          <p className="text-sm font-semibold text-muted-foreground">
            Private draft first, public review when ready.
          </p>
        </div>
        <Button type="button" onClick={onOpen}>
          <PlusIcon className="size-4" />
          Create recipe
        </Button>
      </div>

      {isOpen ? (
        <div className="mt-4 grid gap-3">
          <label htmlFor={titleId} className="space-y-1.5">
            <span className="text-xs font-bold uppercase text-muted-foreground">
              Recipe title
            </span>
            <Input
              id={titleId}
              aria-label="Recipe title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label htmlFor={ingredientIdInputId} className="space-y-1.5">
              <span className="text-xs font-bold uppercase text-muted-foreground">
                Ingredient ID
              </span>
              <Input
                id={ingredientIdInputId}
                aria-label="Ingredient ID"
                type="number"
                value={ingredientId}
                onChange={(event) => setIngredientId(event.target.value)}
              />
            </label>
            <label htmlFor={ingredientGramsId} className="space-y-1.5">
              <span className="text-xs font-bold uppercase text-muted-foreground">
                Ingredient grams
              </span>
              <Input
                id={ingredientGramsId}
                aria-label="Ingredient grams"
                type="number"
                value={ingredientGrams}
                onChange={(event) => setIngredientGrams(event.target.value)}
              />
            </label>
          </div>
          <label htmlFor={instructionId} className="space-y-1.5">
            <span className="text-xs font-bold uppercase text-muted-foreground">
              Instruction
            </span>
            <Textarea
              id={instructionId}
              aria-label="Instruction"
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
            />
          </label>
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase text-muted-foreground">
              Recipe image
            </span>
            <ImageUploadTile
              imageUrl={selectedImageUrl}
              ariaLabel="Recipe image"
              accept="image/jpeg,image/png,image/webp"
              disabled={isUpdating}
              isUploading={isUploadingImage}
              emptyLabel="Upload recipe image"
              changeLabel="Change image"
              removeLabel="Remove image"
              onPick={handleImageUpload}
              onRemove={selectedImageUrl ? handleRemoveSelectedImage : undefined}
            />
          </div>
          {get(uploadedImage, "url") ? (
            <div className="flex items-center gap-2 rounded-[18px] border border-border/60 bg-background/70 p-2 text-sm font-semibold">
              <img
                src={uploadedImage.url}
                alt=""
                className="size-10 rounded-xl object-cover"
              />
              Uploaded image selected
            </div>
          ) : null}
          {selectedGalleryImage ? (
            <div className="flex items-center gap-2 rounded-[18px] border border-border/60 bg-background/70 p-2 text-sm font-semibold">
              <img
                src={selectedGalleryImage.url}
                alt=""
                className="size-10 rounded-xl object-cover"
              />
              {selectedGalleryImage.label}
            </div>
          ) : null}
          <Drawer
            open={isGalleryOpen}
            onOpenChange={setIsGalleryOpen}
            direction="bottom"
          >
            <Button
              type="button"
              variant="outline"
              disabled={isUpdating || !size(images)}
              onClick={() => setIsGalleryOpen(true)}
            >
              <ImageIcon className="size-4" />
              Choose from gallery
            </Button>
            {isGalleryOpen ? (
              <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
                <DrawerHeader>
                  <DrawerTitle>Choose from gallery</DrawerTitle>
                </DrawerHeader>
                <DrawerBody>
                  <div className="grid grid-cols-2 gap-3">
                    {map(images, (image) => {
                      const selected = galleryImageId === image.id;

                      return (
                        <button
                          key={image.id}
                          type="button"
                          aria-label={image.label}
                          className={cn(
                            "relative overflow-hidden rounded-2xl border bg-muted text-left",
                            selected &&
                              "border-primary ring-2 ring-primary/20",
                          )}
                          onClick={() => handleGalleryImageSelect(image.id)}
                        >
                          <img
                            src={image.url}
                            alt=""
                            className="aspect-square w-full object-cover"
                            loading="lazy"
                          />
                          <span className="block truncate p-2 text-xs font-bold">
                            {image.label}
                          </span>
                          {selected ? (
                            <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                              <CheckIcon className="size-4" />
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </DrawerBody>
              </DrawerContent>
            ) : null}
          </Drawer>
          <Button
            type="button"
            disabled={
              isUpdating ||
              !title ||
              !ingredientId ||
              !ingredientGrams ||
              !instruction
            }
            onClick={handleSubmit}
          >
            Save recipe
          </Button>
        </div>
      ) : null}
    </NutritionCard>
  );
};

const AiImageRecipePanel = ({
  isUpdating,
  onUploadImages,
  onGenerate,
  onSaveSuggestion,
}) => {
  const [files, setFiles] = React.useState([]);
  const [job, setJob] = React.useState(null);

  const handleFilesPick = React.useCallback((pickedFiles) => {
    setFiles((currentFiles) => [...currentFiles, ...toArray(pickedFiles)]);
  }, []);

  const handleRemoveFile = React.useCallback((fileIndex) => {
    setFiles((currentFiles) =>
      filter(currentFiles, (item, index) => index !== fileIndex),
    );
  }, []);

  const handleGenerate = React.useCallback(async () => {
    const uploaded = await onUploadImages(files);
    const imageUploadIds = filter(map(uploaded, (item) => item.id), Boolean);
    const result = await onGenerate({
      imageUploadIds,
      confirmedProducts: [],
    });
    setJob(result.job ?? null);
  }, [files, onGenerate, onUploadImages]);

  const handleSaveSuggestion = React.useCallback(
    async (suggestion) => {
      if (!job?.id || !suggestion?.id) {
        return;
      }

      await onSaveSuggestion(job.id, { suggestionId: suggestion.id });
    },
    [job, onSaveSuggestion],
  );

  return (
    <NutritionCard className="p-4">
      <div className="flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
          <WandSparklesIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black tracking-normal">
            Generate from product images
          </h2>
          <p className="text-sm font-semibold text-muted-foreground">
            Upload visible ingredients, review matches, then save an editable draft.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase text-muted-foreground">
            Product images
          </span>
          <ImageUploadTile
            multiple
            files={files}
            ariaLabel="Product images"
            accept="image/jpeg,image/png,image/webp"
            disabled={isUpdating}
            emptyLabel="Add product images"
            changeLabel="Add more"
            onPick={handleFilesPick}
            onRemoveFile={handleRemoveFile}
          />
        </div>
        <Button
          type="button"
          disabled={isUpdating || !size(files)}
          onClick={handleGenerate}
        >
          Generate from uploaded images
        </Button>
        {job?.recognizedProducts?.length ? (
          <div className="flex flex-wrap gap-2">
            {map(job.recognizedProducts, (product) => (
              <Badge key={product.name} variant="outline">
                {product.name}
              </Badge>
            ))}
          </div>
        ) : null}
        {job?.suggestions?.length ? (
          <div className="grid gap-2">
            {map(job.suggestions, (suggestion) => (
              <div
                key={suggestion.id || suggestion.title}
                className="flex flex-col gap-2 rounded-[18px] border border-border/60 bg-background/70 p-3 text-sm font-bold sm:flex-row sm:items-center sm:justify-between"
              >
                <span>{suggestion.title}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isUpdating}
                  onClick={() => handleSaveSuggestion(suggestion)}
                >
                  Save generated draft
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </NutritionCard>
  );
};

const NutritionRecipesPage = () => {
  const rt = useRecipeTranslation();
  const [activeTab, setActiveTab] = React.useState("explore");
  const [isBuilderOpen, setIsBuilderOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [sort, setSort] = React.useState("newest");
  const [categoryId, setCategoryId] = React.useState("");
  const [cuisineId, setCuisineId] = React.useState("");
  const [dietaryTag, setDietaryTag] = React.useState("");
  const [excludeAllergenTag, setExcludeAllergenTag] = React.useState("");
  const [difficulty, setDifficulty] = React.useState("");
  const [maxTotalTimeMinutes, setMaxTotalTimeMinutes] = React.useState("");
  const [minProtein, setMinProtein] = React.useState("");
  const [minCalories, setMinCalories] = React.useState("");
  const [maxCalories, setMaxCalories] = React.useState("");
  const [featuredOnly, setFeaturedOnly] = React.useState(false);
  const [favoriteOnly, setFavoriteOnly] = React.useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = React.useState(null);
  const [selectedMealType, setSelectedMealType] = React.useState("lunch");
  const [servings, setServings] = React.useState(1);

  React.useEffect(() => {
    const searchTimeout = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(searchTimeout);
    };
  }, [search]);

  const handleSearchChange = React.useCallback((nextSearch) => {
    setSearch(nextSearch);
  }, []);
  const handleActiveTabChange = React.useCallback((nextTab) => {
    setActiveTab(nextTab);
    if (nextTab === "favorites") {
      setFavoriteOnly(true);
    } else if (nextTab === "explore") {
      setFavoriteOnly(false);
    }
  }, []);

  const filters = React.useMemo(
    () => ({
      q: debouncedSearch,
      sort,
      categoryId,
      cuisineId,
      dietaryTag,
      excludeAllergenTag,
      difficulty,
      maxTotalTimeMinutes,
      minProtein,
      minCalories,
      maxCalories,
      featuredOnly: featuredOnly ? true : undefined,
      favoriteOnly: favoriteOnly ? true : undefined,
    }),
    [
      categoryId,
      cuisineId,
      dietaryTag,
      difficulty,
      excludeAllergenTag,
      favoriteOnly,
      featuredOnly,
      maxCalories,
      maxTotalTimeMinutes,
      minCalories,
      minProtein,
      debouncedSearch,
      sort,
    ],
  );
  const { categories, cuisines, dietaryTags, allergenTags } =
    useNutritionRecipeFilters();
  const { recipes, pagination, isLoading } = useNutritionRecipes(filters);
  const { recipes: myRecipes, isLoading: isMyRecipesLoading } =
    useMyNutritionRecipes({ status: "all" });
  const { images: galleryImages } = useNutritionRecipeGallery();
  const selectedRecipeIdForQuery = React.useMemo(() => {
    if (!recipes.length) {
      return null;
    }

    const selectedExists = some(
      recipes,
      (item) => item.catalogFoodId === selectedRecipeId,
    );

    return selectedExists
      ? selectedRecipeId
      : recipes[0]?.catalogFoodId || null;
  }, [recipes, selectedRecipeId]);
  const { recipe, isLoading: isDetailLoading } =
    useNutritionRecipeDetail(selectedRecipeIdForQuery);
  const { toggleFavorite, addToMealLog, isUpdating } =
    useNutritionRecipeActions();
  const {
    createMyRecipe,
    requestPublication,
    uploadMyRecipeImage,
    uploadRecipeProductImages,
    createRecipeGenerationJob,
    saveGeneratedRecipeSuggestion,
    isUpdating: isBuilderUpdating,
  } = useNutritionRecipeBuilderActions();
  const selectedRecipe =
    recipe ||
    find(recipes, (item) => item.catalogFoodId === selectedRecipeIdForQuery) ||
    null;

  const handleFavorite = React.useCallback(
    async (item) => {
      await toggleFavorite(item);
    },
    [toggleFavorite],
  );

  const handleAddToMealLog = React.useCallback(async () => {
    if (!selectedRecipe?.catalogFoodId) {
      return;
    }

    await addToMealLog(selectedRecipe.catalogFoodId, {
      date: todayKey(),
      mealType: selectedMealType,
      servings,
    });
    toast.success(rt("detail.logSuccess"));
  }, [addToMealLog, rt, selectedMealType, selectedRecipe, servings]);

  const handleCreateMyRecipe = React.useCallback(
    async (payload) => {
      await createMyRecipe(payload);
      toast.success("Recipe saved");
      setIsBuilderOpen(false);
      setActiveTab("mine");
    },
    [createMyRecipe],
  );

  const handleRequestPublication = React.useCallback(
    async (recipeId) => {
      await requestPublication(recipeId);
      toast.success("Recipe sent to public review");
    },
    [requestPublication],
  );

  const handleSaveGeneratedSuggestion = React.useCallback(
    async (jobId, payload) => {
      await saveGeneratedRecipeSuggestion(jobId, payload);
      toast.success("Generated recipe saved");
      setActiveTab("mine");
    },
    [saveGeneratedRecipeSuggestion],
  );

  const hasActiveFilters = Boolean(
    search ||
    sort !== "newest" ||
    categoryId ||
    cuisineId ||
    dietaryTag ||
    excludeAllergenTag ||
    difficulty ||
    maxTotalTimeMinutes ||
    minProtein ||
    minCalories ||
    maxCalories ||
    featuredOnly ||
    favoriteOnly,
  );

  const activeFilterCount = React.useMemo(
    () =>
      size(
        filter(
          [
            sort !== "newest",
            categoryId,
            cuisineId,
            dietaryTag,
            excludeAllergenTag,
            difficulty,
            maxTotalTimeMinutes,
            minProtein,
            minCalories,
            maxCalories,
            featuredOnly,
            favoriteOnly,
          ],
          Boolean,
        ),
      ),
    [
      categoryId,
      cuisineId,
      dietaryTag,
      difficulty,
      excludeAllergenTag,
      favoriteOnly,
      featuredOnly,
      maxCalories,
      maxTotalTimeMinutes,
      minCalories,
      minProtein,
      sort,
    ],
  );

  const handleClearFilters = React.useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setSort("newest");
    setCategoryId("");
    setCuisineId("");
    setDietaryTag("");
    setExcludeAllergenTag("");
    setDifficulty("");
    setMaxTotalTimeMinutes("");
    setMinProtein("");
    setMinCalories("");
    setMaxCalories("");
    setFeaturedOnly(false);
    setFavoriteOnly(false);
  }, []);

  return (
    <NutritionLayout
      header={
        <NutritionCard tone="accent" className="p-5">
          <div className="flex flex-col gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/70 px-3 py-1 text-xs font-black uppercase text-primary">
                <SparklesIcon className="size-3.5" />
                {rt("page.badge")}
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-normal text-foreground sm:text-3xl">
                {rt("page.title")}
              </h1>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <RecipeAppTabs
                activeTab={activeTab}
                onChange={handleActiveTabChange}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setIsBuilderOpen(true);
                  setActiveTab("mine");
                }}
              >
                <PlusIcon className="size-4" />
                Create recipe
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <RecipeSearchBar
                value={search}
                className="relative block self-end"
                onChange={handleSearchChange}
              />
              <RecipeFilters
                sort={sort}
                categoryId={categoryId}
                cuisineId={cuisineId}
                dietaryTag={dietaryTag}
                excludeAllergenTag={excludeAllergenTag}
                difficulty={difficulty}
                maxTotalTimeMinutes={maxTotalTimeMinutes}
                minProtein={minProtein}
                minCalories={minCalories}
                maxCalories={maxCalories}
                featuredOnly={featuredOnly}
                favoriteOnly={favoriteOnly}
                hasActiveFilters={hasActiveFilters}
                activeFilterCount={activeFilterCount}
                categories={categories}
                cuisines={cuisines}
                dietaryTags={dietaryTags}
                allergenTags={allergenTags}
                onSortChange={setSort}
                onCategoryChange={setCategoryId}
                onCuisineChange={setCuisineId}
                onDietaryTagChange={setDietaryTag}
                onExcludeAllergenTagChange={setExcludeAllergenTag}
                onDifficultyChange={setDifficulty}
                onMaxTotalTimeMinutesChange={setMaxTotalTimeMinutes}
                onMinProteinChange={setMinProtein}
                onMinCaloriesChange={setMinCalories}
                onMaxCaloriesChange={setMaxCalories}
                onFeaturedOnlyToggle={() => setFeaturedOnly((value) => !value)}
                onFavoriteOnlyToggle={() => setFavoriteOnly((value) => !value)}
                onClearFilters={handleClearFilters}
              />
            </div>
          </div>
        </NutritionCard>
      }
      sidebar={
        <RecipeDetailPanel
          recipe={selectedRecipe}
          isLoading={isDetailLoading}
          selectedMealType={selectedMealType}
          servings={servings}
          onMealTypeChange={setSelectedMealType}
          onServingsChange={setServings}
          onAddToMealLog={handleAddToMealLog}
          isUpdating={isUpdating}
        />
      }
    >
      {activeTab === "mine" ? (
        <div className="grid gap-4">
          <RecipeBuilderPanel
            isOpen={isBuilderOpen}
            images={galleryImages}
            isUpdating={isBuilderUpdating}
            onOpen={() => setIsBuilderOpen((value) => !value)}
            onCreate={handleCreateMyRecipe}
            onUploadImage={uploadMyRecipeImage}
          />
          <MyRecipesPanel
            recipes={myRecipes}
            isLoading={isMyRecipesLoading}
            isUpdating={isBuilderUpdating}
            onRequestPublication={handleRequestPublication}
          />
        </div>
      ) : activeTab === "ai" ? (
        <AiImageRecipePanel
          isUpdating={isBuilderUpdating}
          onUploadImages={uploadRecipeProductImages}
          onGenerate={createRecipeGenerationJob}
          onSaveSuggestion={handleSaveGeneratedSuggestion}
        />
      ) : (
        <div className="grid gap-3">
          {isLoading ? (
            <>
              <NutritionCard className="h-44 animate-pulse bg-muted/30" />
              <NutritionCard className="h-44 animate-pulse bg-muted/30" />
            </>
          ) : recipes.length ? (
            map(recipes, (recipeItem) => (
              <RecipeCard
                key={recipeItem.id}
                recipe={recipeItem}
                isSelected={
                  recipeItem.catalogFoodId === selectedRecipeIdForQuery
                }
                onSelect={(item) => {
                  setSelectedRecipeId(item.catalogFoodId);
                  setServings(1);
                }}
                onFavorite={handleFavorite}
                isUpdating={isUpdating}
              />
            ))
          ) : (
            <NutritionCard className="p-8 text-center">
              <BookOpenIcon className="mx-auto size-10 text-primary" />
              <h2 className="mt-4 text-xl font-black tracking-normal">
                {rt("page.empty")}
              </h2>
            </NutritionCard>
          )}
        </div>
      )}

      {recipes.length && activeTab !== "mine" && activeTab !== "ai" ? (
        <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground">
          <span>
            {rt("page.totalCount", {
              count: pagination.total || recipes.length,
            })}
          </span>
          <span>
            {slice(recipes, 0, 1).length
              ? `1 / ${pagination.totalPages || 1}`
              : ""}
          </span>
        </div>
      ) : null}
    </NutritionLayout>
  );
};

export default NutritionRecipesPage;
