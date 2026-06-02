import React from "react";
import { FilterIcon, PlusIcon, SparklesIcon, XIcon } from "lucide-react";
import filter from "lodash/filter";
import find from "lodash/find";
import map from "lodash/map";
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
  useNutritionRecipes,
} from "@/hooks/app/use-nutrition-recipes.js";
import NutritionLayout from "../ui/nutrition-layout.jsx";
import AIFromImageRecipe from "./components/ai-from-image-recipe.jsx";
import EmptyState from "./components/empty-state.jsx";
import RecipeAddDrawer from "./components/recipe-add-drawer.jsx";
import RecipeCard from "./components/recipe-card.jsx";
import RecipeDetailDrawer from "./components/recipe-detail-drawer.jsx";
import RecipeFilterDrawer from "./components/recipe-filter-drawer.jsx";
import RecipeSearchBar from "./components/recipe-search-bar.jsx";
import {
  MOCK_RECIPES,
  filterRecipes,
} from "./recipe-mock-data.js";
import {
  getRecipeKey,
  normalizeRecipeForUi,
} from "./recipe-ui-utils.js";

const recipeTabs = [
  { value: "explore", label: "Explore" },
  { value: "mine", label: "Mening retseptlarim" },
  { value: "ai", label: "AI From Image" },
  { value: "favorites", label: "Sevimlilar" },
];

const getRecipeRouteId = (recipe) =>
  recipe?.slug || recipe?.catalogFoodId || recipe?.id;

const emptyFilters = {
  tag: "",
  category: "",
  difficulty: "",
  maxTime: "",
};

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

const NutritionRecipesPage = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const [activeTab, setActiveTab] = React.useState("explore");
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState(emptyFilters);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailRecipe, setDetailRecipe] = React.useState(null);
  const [detailServings, setDetailServings] = React.useState(1);
  const [addOpen, setAddOpen] = React.useState(false);
  const [addRecipe, setAddRecipe] = React.useState(null);
  const [addServings, setAddServings] = React.useState(1);
  const [favoriteIds, setFavoriteIds] = React.useState(() => new Set());
  const [selectedRecipeId, setSelectedRecipeId] = React.useState("");
  const { recipes: apiRecipes = [], isLoading } = useNutritionRecipes({});
  const { recipes: myRecipes = [], isLoading: isMyRecipesLoading } =
    useMyNutritionRecipes({ status: "all" });
  const { toggleFavorite, addToMealLog, addToMealPlan, isUpdating } =
    useNutritionRecipeActions();
  const hasApiRecipes = apiRecipes.length > 0;
  const allRecipes = React.useMemo(
    () =>
      map(hasApiRecipes ? apiRecipes : MOCK_RECIPES, normalizeRecipeForUi),
    [apiRecipes, hasApiRecipes],
  );
  const recipesWithFavorites = React.useMemo(
    () => mergeFavoriteState(allRecipes, favoriteIds),
    [allRecipes, favoriteIds],
  );
  const filteredRecipes = React.useMemo(() => {
    const base = filterRecipes(recipesWithFavorites, search, filters.tag);
    const maxTime = Number(filters.maxTime) || 0;

    return filter(base, (recipe) => {
      const matchesCategory = filters.category
        ? recipe.category === filters.category
        : true;
      const matchesDifficulty = filters.difficulty
        ? recipe.difficulty === filters.difficulty
        : true;
      const matchesTime = maxTime ? recipe.totalTimeMinutes <= maxTime : true;

      return matchesCategory && matchesDifficulty && matchesTime;
    });
  }, [filters, recipesWithFavorites, search]);
  const favoriteRecipes = React.useMemo(
    () => filter(filteredRecipes, (recipe) => recipe.isFavorite),
    [filteredRecipes],
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
      find(recipesWithFavorites, (recipe) => getRecipeKey(recipe) === detailKey) ||
      find(normalizedMyRecipes, (recipe) => getRecipeKey(recipe) === detailKey) ||
      detailRecipe
    );
  }, [detailRecipe, normalizedMyRecipes, recipesWithFavorites]);

  React.useEffect(() => {
    const currentBreadcrumb =
      activeTab === "ai"
        ? "AI From Image"
        : activeTab === "mine"
          ? "Mening retseptlarim"
          : activeTab === "favorites"
            ? "Sevimlilar"
            : "Retseptlar";

    setBreadcrumbs([
      { url: "/user/dashboard", title: "Bosh sahifa" },
      { url: "/user/nutrition/overview", title: "Ovqatlanish" },
      { url: "/user/nutrition/recipes", title: currentBreadcrumb },
    ]);

    return () => setBreadcrumbs([]);
  }, [activeTab, setBreadcrumbs]);

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

      if (hasApiRecipes) {
        await toggleFavorite(recipe);
      }
    },
    [hasApiRecipes, toggleFavorite],
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

  const activeFiltersCount = filter(Object.values(filters), Boolean).length;
  const hasActiveFilters = Boolean(search || activeFiltersCount);
  const appliedFilterLabels = filter(
    [
      filters.tag,
      filters.category,
      filters.difficulty,
      filters.maxTime ? `${filters.maxTime} daqiqagacha` : "",
    ],
    Boolean,
  );
  const visibleRecipes =
    activeTab === "favorites" ? favoriteRecipes : filteredRecipes;

  const mainContent =
    activeTab === "ai" ? (
      <AIFromImageRecipe
        onCreateRecipe={() => navigate("/user/nutrition/recipes/create")}
        onAddToMealPlan={handleAddRecipe}
      />
    ) : activeTab === "mine" ? (
      isMyRecipesLoading ? (
        <Card>
          <CardContent className="h-40 p-5" />
        </Card>
      ) : normalizedMyRecipes.length ? (
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
          title="Retseptlar topilmadi"
          description="Birinchi retseptingizni yarating"
          actionLabel="Retsept yaratish"
          onAction={() => navigate("/user/nutrition/recipes/create")}
        />
      )
    ) : visibleRecipes.length ? (
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
    ) : (
      <EmptyState
        title="Retseptlar topilmadi"
        description="Birinchi retseptingizni yarating"
        actionLabel="Retsept yaratish"
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
                RETSEPTLAR
              </Badge>
              <h1 className="text-3xl font-semibold text-foreground">
                Bugungi retseptlar
              </h1>
              <p className="text-sm text-muted-foreground">
                Sog'liq uchun foydali va mazali retseptlarni kashf eting
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
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <Button
                type="button"
                onClick={() => navigate("/user/nutrition/recipes/create")}
              >
                <PlusIcon data-icon="inline-start" />
                Retsept yaratish
              </Button>
            </div>

            {activeTab !== "ai" ? (
              <div className="sticky top-2 z-20 flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/95 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
                <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <RecipeSearchBar value={search} onChange={setSearch} />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFilterOpen(true)}
                  >
                    <FilterIcon data-icon="inline-start" />
                    Filterlar
                    {activeFiltersCount ? (
                      <Badge variant="secondary">{activeFiltersCount}</Badge>
                    ) : null}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!hasActiveFilters}
                    onClick={handleClearFilters}
                  >
                    <XIcon data-icon="inline-start" />
                    Tozalash
                  </Button>
                </div>
                {appliedFilterLabels.length ? (
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
      {isLoading && activeTab === "explore" ? (
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
      <RecipeFilterDrawer
        open={filterOpen}
        filters={filters}
        resultsCount={filteredRecipes.length}
        onOpenChange={setFilterOpen}
        onApply={setFilters}
        onClear={handleClearFilters}
      />
    </NutritionLayout>
  );
};

export default NutritionRecipesPage;
