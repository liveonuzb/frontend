import React from "react";
import { PlusIcon, SparklesIcon } from "lucide-react";
import { filter, find, map, size, toUpper } from "lodash";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBreadcrumbStore } from "@/store";
import {
  useMyNutritionRecipes,
  useNutritionRecipeActions,
  useNutritionRecipeFilters,
  useNutritionRecipes,
} from "@/hooks/app/use-nutrition-recipes.js";
import { useNutritionAiPantry } from "@/hooks/app/use-nutrition-ai.js";
import NutritionLayout from "../ui/nutrition-layout.jsx";
import AIFromImageRecipe from "./components/ai-from-image-recipe.jsx";
import EmptyState from "./components/empty-state.jsx";
import RecipeAddDrawer from "./components/recipe-add-drawer.jsx";
import RecipeCard from "./components/recipe-card.jsx";
import RecipeDetailDrawer from "./components/recipe-detail-drawer.jsx";
import RecipeFilters from "./components/recipe-filters.jsx";
import RecipeSearchBar from "./components/recipe-search-bar.jsx";
import useRecipeTranslation from "./lib/recipe-i18n.js";
import {
  getRecipeActionId,
  getRecipeKey,
  normalizeRecipeForUi,
} from "./recipe-ui-utils.js";
import {
  decorateRecipesWithPantry,
  filterRecipesByPantry,
} from "./recipe-pantry-utils.js";

const recipeTabs = [
  { value: "explore", labelKey: "tabs.explore" },
  { value: "mine", labelKey: "tabs.mine" },
  { value: "ai", labelKey: "tabs.ai" },
  { value: "favorites", labelKey: "tabs.favorites" },
];

const breadcrumbKeyByTab = {
  explore: "page.badge",
  mine: "tabs.mine",
  ai: "tabs.ai",
  favorites: "tabs.favorites",
};

const getRecipeRouteId = (recipe) =>
  recipe?.slug || recipe?.catalogFoodId || recipe?.id;

const getEmptyStateType = (activeTab, hasActiveFilters) => {
  if (activeTab === "mine" || activeTab === "favorites") {
    return activeTab;
  }

  return hasActiveFilters ? "filtered" : "explore";
};

const getEmptyStateCopy = (rt, type) => ({
  title: rt(`empty.${type}.title`),
  description: rt(`empty.${type}.description`),
  actionLabel: rt("buttons.create"),
});

const RECIPE_PAGE_SIZE = 12;

const emptyFilters = {
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
  featuredOnly: false,
  favoriteOnly: false,
  pantryOnly: false,
};

const buildRecipeListFilters = ({ search, filters, activeTab, page }) => ({
  q: search,
  page: filters.pantryOnly ? 1 : page,
  pageSize: filters.pantryOnly ? 50 : RECIPE_PAGE_SIZE,
  sort: filters.sort,
  categoryId: filters.categoryId,
  cuisineId: filters.cuisineId,
  dietaryTag: filters.dietaryTag,
  excludeAllergenTag: filters.excludeAllergenTag,
  difficulty: filters.difficulty,
  maxTotalTimeMinutes: filters.maxTotalTimeMinutes,
  minProtein: filters.minProtein,
  minCalories: filters.minCalories,
  maxCalories: filters.maxCalories,
  featuredOnly: filters.featuredOnly || undefined,
  favoriteOnly:
    activeTab === "favorites" || filters.favoriteOnly || undefined,
});

const getActiveFilterCount = (search, filters) =>
  size(
    filter(
      [
        search,
        filters.sort && filters.sort !== "newest",
        filters.categoryId,
        filters.cuisineId,
        filters.dietaryTag,
        filters.excludeAllergenTag,
        filters.difficulty,
        filters.maxTotalTimeMinutes,
        filters.minProtein,
        filters.minCalories,
        filters.maxCalories,
        filters.featuredOnly,
        filters.favoriteOnly,
        filters.pantryOnly,
      ],
      Boolean,
    ),
  );

const mergeFavoriteState = (recipes, favoriteIds) =>
  map(recipes, (recipe) => ({
    ...recipe,
    isFavorite:
      favoriteIds.has(getRecipeKey(recipe)) ||
      favoriteIds.has(String(recipe.catalogFoodId)) ||
      Boolean(recipe.isFavorite),
  }));

const RecipesGrid = ({
  recipes,
  selectedRecipeId,
  isUpdating,
  onSelect,
  onDetail,
  onFavorite,
  onSave,
  onAdd,
}) => (
  <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
    {map(recipes, (recipe) => (
      <RecipeCard
        key={getRecipeKey(recipe)}
        recipe={recipe}
        isSelected={getRecipeKey(recipe) === selectedRecipeId}
        isUpdating={isUpdating}
        onSelect={onSelect}
        onDetail={onDetail}
        onFavorite={onFavorite}
        onSave={onSave}
        onAdd={onAdd}
      />
    ))}
  </div>
);

const RecipePagination = ({ pagination, onPageChange }) => {
  const page = Number(pagination?.page || 1);
  const totalPages = Number(pagination?.totalPages || 1);
  const total = Number(pagination?.total || 0);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-muted-foreground">
        {total} ta retsept, {page}/{totalPages} sahifa
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={page <= 1}
          aria-label="Oldingi sahifa"
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Oldingi
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={page >= totalPages}
          aria-label="Keyingi sahifa"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Keyingi
        </Button>
      </div>
    </div>
  );
};

const NutritionRecipesPage = () => {
  const navigate = useNavigate();
  const rt = useRecipeTranslation();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const [activeTab, setActiveTab] = React.useState("explore");
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState(emptyFilters);
  const [recipePage, setRecipePage] = React.useState(1);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailRecipe, setDetailRecipe] = React.useState(null);
  const [detailServings, setDetailServings] = React.useState(1);
  const [addOpen, setAddOpen] = React.useState(false);
  const [addRecipe, setAddRecipe] = React.useState(null);
  const [addServings, setAddServings] = React.useState(1);
  const [favoriteIds, setFavoriteIds] = React.useState(() => new Set());
  const [selectedRecipeId, setSelectedRecipeId] = React.useState("");
  const previousRecipeListScopeRef = React.useRef(null);
  const isCatalogTab = activeTab === "explore" || activeTab === "favorites";
  const recipeListFilters = React.useMemo(
    () =>
      buildRecipeListFilters({
        search,
        filters,
        activeTab,
        page: recipePage,
      }),
    [activeTab, filters, recipePage, search],
  );
  const {
    recipes: apiRecipes = [],
    pagination,
    activeFilters: serverActiveFilters = [],
    isLoading,
  } = useNutritionRecipes(recipeListFilters);
  const { categories, cuisines, dietaryTags, allergenTags } =
    useNutritionRecipeFilters();
  const { pantryItems = [] } = useNutritionAiPantry({ enabled: isCatalogTab });
  const { recipes: myRecipes = [], isLoading: isMyRecipesLoading } =
    useMyNutritionRecipes({ status: "all" });
  const {
    toggleFavorite,
    addToMealLog,
    addToMealPlan,
    createShoppingList,
    isUpdating,
  } = useNutritionRecipeActions();
  const allRecipes = React.useMemo(
    () => map(apiRecipes, normalizeRecipeForUi),
    [apiRecipes],
  );
  const recipesWithFavorites = React.useMemo(
    () => mergeFavoriteState(allRecipes, favoriteIds),
    [allRecipes, favoriteIds],
  );
  const recipesWithPantry = React.useMemo(
    () => decorateRecipesWithPantry(recipesWithFavorites, pantryItems),
    [pantryItems, recipesWithFavorites],
  );
  const normalizedMyRecipes = React.useMemo(
    () => map(myRecipes, normalizeRecipeForUi),
    [myRecipes],
  );
  const activeDetailRecipe = React.useMemo(() => {
    if (!detailRecipe) {
      return null;
    }

    const detailKey = getRecipeKey(detailRecipe);

    return (
      find(recipesWithPantry, (recipe) => getRecipeKey(recipe) === detailKey) ||
      find(normalizedMyRecipes, (recipe) => getRecipeKey(recipe) === detailKey) ||
      detailRecipe
    );
  }, [detailRecipe, normalizedMyRecipes, recipesWithPantry]);

  React.useEffect(() => {
    const previous = previousRecipeListScopeRef.current;
    previousRecipeListScopeRef.current = { activeTab, filters, search };

    if (
      previous &&
      (previous.activeTab !== activeTab ||
        previous.filters !== filters ||
        previous.search !== search)
    ) {
      setRecipePage(1);
    }
  }, [activeTab, filters, search]);

  React.useEffect(() => {
    const currentBreadcrumb = rt(breadcrumbKeyByTab[activeTab] || "page.badge");

    setBreadcrumbs([
      { url: "/user/dashboard", title: "Bosh sahifa" },
      { url: "/user/nutrition/overview", title: "Ovqatlanish" },
      { url: "/user/nutrition/recipes", title: currentBreadcrumb },
    ]);

    return () => setBreadcrumbs([]);
  }, [activeTab, rt, setBreadcrumbs]);

  const handleSelectRecipe = React.useCallback((recipe) => {
    const normalizedRecipe = normalizeRecipeForUi(recipe);

    setSelectedRecipeId(getRecipeKey(normalizedRecipe));
    setDetailRecipe(normalizedRecipe);
    setDetailServings(1);
    setDetailOpen(true);
  }, []);

  const handleToggleFavorite = React.useCallback(
    async (recipe) => {
      if (!recipe) {
        return;
      }

      const key = getRecipeKey(recipe);
      const nextFavorite = !recipe.isFavorite;

      setFavoriteIds((current) => {
        const next = new Set(current);
        if (nextFavorite) {
          next.add(key);
          if (recipe.catalogFoodId) {
            next.add(String(recipe.catalogFoodId));
          }
        } else {
          next.delete(key);
          next.delete(String(recipe.catalogFoodId));
        }
        return next;
      });
      setDetailRecipe((current) =>
        getRecipeKey(current) === key
          ? { ...current, isFavorite: nextFavorite }
          : current,
      );
      setAddRecipe((current) =>
        getRecipeKey(current) === key
          ? { ...current, isFavorite: nextFavorite }
          : current,
      );

      if (getRecipeActionId(recipe)) {
        await toggleFavorite(recipe);
      }
    },
    [toggleFavorite],
  );

  const handleSaveRecipe = React.useCallback(
    (recipe) => {
      if (!recipe) {
        return;
      }

      if (!recipe.isFavorite) {
        handleToggleFavorite(recipe);
      }
      toast.success("Retsept saqlandi");
    },
    [handleToggleFavorite],
  );

  const handleAddRecipe = React.useCallback((recipe, nextServings = 1) => {
    if (!recipe) {
      return;
    }

    setAddRecipe(normalizeRecipeForUi(recipe));
    setAddServings(Math.max(0.25, nextServings || 1));
    setAddOpen(true);
  }, []);

  const handleCreateShoppingList = React.useCallback(
    async (recipe, nextServings = 1) => {
      if (!recipe) {
        return;
      }

      try {
        const shoppingList = await createShoppingList(recipe, {
          servings: Math.max(0.25, nextServings || 1),
        });
        const itemCount = size(shoppingList?.items || []);

        toast.success(
          itemCount > 0
            ? `Xarid ro'yxati yaratildi: ${itemCount} mahsulot`
            : "Xarid ro'yxati yaratildi",
        );
      } catch {
        toast.error("Xarid ro'yxatini yaratib bo'lmadi");
      }
    },
    [createShoppingList],
  );

  const handleStartCooking = React.useCallback(
    (recipe) => {
      const routeId = getRecipeRouteId(recipe);

      if (!routeId) {
        return;
      }

      navigate(`/user/nutrition/recipes/${encodeURIComponent(routeId)}/cook`);
    },
    [navigate],
  );

  const handleDetailAdd = React.useCallback(() => {
    handleAddRecipe(activeDetailRecipe, detailServings);
  }, [activeDetailRecipe, detailServings, handleAddRecipe]);

  const handleCloseDetail = React.useCallback((nextOpen) => {
    setDetailOpen(nextOpen);
    if (!nextOpen) {
      setDetailRecipe(null);
    }
  }, []);

  const handleClearFilters = React.useCallback(() => {
    setSearch("");
    setFilters(emptyFilters);
  }, []);

  const handleSearchChange = React.useCallback((value) => {
    setSearch(value);
    setRecipePage(1);
  }, []);
  const updateFilter = React.useCallback((key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setRecipePage(1);
  }, []);
  const activeFiltersCount = getActiveFilterCount(search, filters);
  const hasActiveFilters = Boolean(activeFiltersCount);
  const appliedFilterLabels = filter(
    [
      ...map(serverActiveFilters, (item) => {
        if (item.key === "sort" && item.value === "newest") {
          return "";
        }

        if (item.value === true) {
          return item.label;
        }

        return `${item.label}: ${item.value}`;
      }),
      filters.pantryOnly ? "Ombordagi ingredientlar" : "",
    ],
    Boolean,
  );
  const visibleRecipes = filterRecipesByPantry(
    recipesWithPantry,
    filters.pantryOnly,
  );
  const visibleEmptyState = getEmptyStateCopy(
    rt,
    getEmptyStateType(activeTab, hasActiveFilters),
  );
  const myRecipesEmptyState = getEmptyStateCopy(rt, "mine");

  const mainContent =
    activeTab === "ai" ? (
      <AIFromImageRecipe />
    ) : activeTab === "mine" ? (
      isMyRecipesLoading ? (
        <Card>
          <CardContent className="h-40 p-5" />
        </Card>
      ) : size(normalizedMyRecipes) ? (
        <RecipesGrid
          recipes={normalizedMyRecipes}
          selectedRecipeId={selectedRecipeId}
          isUpdating={isUpdating}
          onSelect={handleSelectRecipe}
          onDetail={handleSelectRecipe}
          onFavorite={handleToggleFavorite}
          onSave={handleSaveRecipe}
          onAdd={handleAddRecipe}
        />
      ) : (
        <EmptyState
          title={myRecipesEmptyState.title}
          description={myRecipesEmptyState.description}
          actionLabel={myRecipesEmptyState.actionLabel}
          onAction={() => navigate("/user/nutrition/recipes/create")}
        />
      )
    ) : size(visibleRecipes) ? (
      <div className="space-y-5">
        <RecipesGrid
          recipes={visibleRecipes}
          selectedRecipeId={selectedRecipeId}
          isUpdating={isUpdating}
          onSelect={handleSelectRecipe}
          onDetail={handleSelectRecipe}
          onFavorite={handleToggleFavorite}
          onSave={handleSaveRecipe}
          onAdd={handleAddRecipe}
        />
        <RecipePagination
          pagination={
            filters.pantryOnly
              ? { page: 1, totalPages: 1, total: size(visibleRecipes) }
              : pagination
          }
          onPageChange={setRecipePage}
        />
      </div>
    ) : (
      <EmptyState
        title={visibleEmptyState.title}
        description={visibleEmptyState.description}
        actionLabel={visibleEmptyState.actionLabel}
        onAction={() => navigate("/user/nutrition/recipes/create")}
      />
    );

  return (
    <NutritionLayout
      header={
        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-2">
              <Badge variant="secondary" className="gap-1 self-start uppercase">
                <SparklesIcon className="size-3" />
                {toUpper(rt("page.badge"))}
              </Badge>
              <h1 className="text-3xl font-semibold text-foreground">
                {rt("page.headerTitle")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {rt("page.description")}
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="h-auto flex-wrap">
                  {map(recipeTabs, (tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      onClick={() => setActiveTab(tab.value)}
                    >
                      {rt(tab.labelKey)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <Button
                type="button"
                onClick={() => navigate("/user/nutrition/recipes/create")}
              >
                <PlusIcon data-icon="inline-start" />
                {rt("buttons.create")}
              </Button>
            </div>

            {isCatalogTab ? (
              <div className="sticky top-2 z-20 flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/95 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
                <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <RecipeSearchBar
                    value={search}
                    onChange={handleSearchChange}
                  />
                  <RecipeFilters
                    sort={filters.sort}
                    categoryId={filters.categoryId}
                    cuisineId={filters.cuisineId}
                    dietaryTag={filters.dietaryTag}
                    excludeAllergenTag={filters.excludeAllergenTag}
                    difficulty={filters.difficulty}
                    maxTotalTimeMinutes={filters.maxTotalTimeMinutes}
                    minProtein={filters.minProtein}
                    minCalories={filters.minCalories}
                    maxCalories={filters.maxCalories}
                    featuredOnly={filters.featuredOnly}
                    favoriteOnly={filters.favoriteOnly}
                    pantryOnly={filters.pantryOnly}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFiltersCount}
                    categories={categories}
                    cuisines={cuisines}
                    dietaryTags={dietaryTags}
                    allergenTags={allergenTags}
                    className="justify-end"
                    onSortChange={(value) => updateFilter("sort", value)}
                    onCategoryChange={(value) =>
                      updateFilter("categoryId", value)
                    }
                    onCuisineChange={(value) =>
                      updateFilter("cuisineId", value)
                    }
                    onDietaryTagChange={(value) =>
                      updateFilter("dietaryTag", value)
                    }
                    onExcludeAllergenTagChange={(value) =>
                      updateFilter("excludeAllergenTag", value)
                    }
                    onDifficultyChange={(value) =>
                      updateFilter("difficulty", value)
                    }
                    onMaxTotalTimeMinutesChange={(value) =>
                      updateFilter("maxTotalTimeMinutes", value)
                    }
                    onMinProteinChange={(value) =>
                      updateFilter("minProtein", value)
                    }
                    onMinCaloriesChange={(value) =>
                      updateFilter("minCalories", value)
                    }
                    onMaxCaloriesChange={(value) =>
                      updateFilter("maxCalories", value)
                    }
                    onFeaturedOnlyToggle={() =>
                      updateFilter("featuredOnly", !filters.featuredOnly)
                    }
                    onFavoriteOnlyToggle={() =>
                      updateFilter("favoriteOnly", !filters.favoriteOnly)
                    }
                    onPantryOnlyToggle={() =>
                      updateFilter("pantryOnly", !filters.pantryOnly)
                    }
                    onClearFilters={handleClearFilters}
                  />
                </div>
                {size(appliedFilterLabels) ? (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {map(appliedFilterLabels, (label) => (
                      <Badge key={label} variant="secondary" className="shrink-0">
                        {label}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      }
    >
      {isLoading && (activeTab === "explore" || activeTab === "favorites") ? (
        <Card>
          <CardContent className="h-56 p-5" />
        </Card>
      ) : (
        mainContent
      )}

      <RecipeDetailDrawer
        open={detailOpen}
        recipe={activeDetailRecipe}
        servings={detailServings}
        isFavorite={Boolean(activeDetailRecipe?.isFavorite)}
        isUpdating={isUpdating}
        onOpenChange={handleCloseDetail}
        onServingsChange={setDetailServings}
        onFavorite={() => handleToggleFavorite(activeDetailRecipe)}
        onSave={() => handleSaveRecipe(activeDetailRecipe)}
        onAdd={handleDetailAdd}
        onCreateShoppingList={() =>
          handleCreateShoppingList(activeDetailRecipe, detailServings)
        }
        onEdit={() => navigate("/user/nutrition/recipes/create")}
        onStartCooking={() => handleStartCooking(activeDetailRecipe)}
      />
      <RecipeAddDrawer
        open={addOpen}
        recipe={addRecipe}
        initialServings={addServings}
        addToMealLog={addToMealLog}
        addToMealPlan={addToMealPlan}
        isSubmitting={isUpdating}
        onOpenChange={setAddOpen}
      />
    </NutritionLayout>
  );
};

export default NutritionRecipesPage;
