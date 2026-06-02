import React from "react";
import { ArrowLeftIcon, BookOpenIcon } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBreadcrumbStore } from "@/store";
import {
  useNutritionRecipeActions,
  useNutritionRecipeDetail,
} from "@/hooks/app/use-nutrition-recipes.js";
import NutritionLayout from "../ui/nutrition-layout.jsx";
import EmptyState from "./components/empty-state.jsx";
import RecipeAddDrawer from "./components/recipe-add-drawer.jsx";
import RecipeDetailView from "./components/recipe-detail-view.jsx";
import { findMockRecipe } from "./recipe-mock-data.js";
import { normalizeRecipeForUi } from "./recipe-ui-utils.js";

const getRecipeRouteId = (recipe) =>
  recipe?.slug || recipe?.catalogFoodId || recipe?.id;

const NutritionRecipeDetailPage = () => {
  const navigate = useNavigate();
  const { slugOrId } = useParams();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { recipe: apiRecipe, isLoading } = useNutritionRecipeDetail(slugOrId);
  const { toggleFavorite, addToMealLog, addToMealPlan, isUpdating } =
    useNutritionRecipeActions();
  const fallbackRecipe = React.useMemo(() => findMockRecipe(slugOrId), [slugOrId]);
  const recipe = React.useMemo(
    () =>
      apiRecipe || fallbackRecipe
        ? normalizeRecipeForUi(apiRecipe || fallbackRecipe)
        : null,
    [apiRecipe, fallbackRecipe],
  );
  const [servings, setServings] = React.useState(1);
  const [addOpen, setAddOpen] = React.useState(false);
  const [addServings, setAddServings] = React.useState(1);
  const [favoriteState, setFavoriteState] = React.useState({
    recipeKey: "",
    isFavorite: false,
  });
  const recipeKey = recipe ? String(recipe.id || recipe.catalogFoodId) : "";
  const isFavorite =
    favoriteState.recipeKey === recipeKey
      ? favoriteState.isFavorite
      : Boolean(recipe?.isFavorite);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user/dashboard", title: "Bosh sahifa" },
      { url: "/user/nutrition/overview", title: "Ovqatlanish" },
      { url: "/user/nutrition/recipes", title: "Retseptlar" },
      {
        url: `/user/nutrition/recipes/${slugOrId}`,
        title: recipe?.title || "Retsept",
      },
    ]);

    return () => setBreadcrumbs([]);
  }, [recipe?.title, setBreadcrumbs, slugOrId]);

  const handleFavorite = React.useCallback(async () => {
    if (!recipe) {
      return;
    }

    setFavoriteState({
      recipeKey,
      isFavorite: !isFavorite,
    });
    if (apiRecipe) {
      await toggleFavorite(recipe);
    }
  }, [apiRecipe, isFavorite, recipe, recipeKey, toggleFavorite]);

  const handleSave = React.useCallback(() => {
    if (!isFavorite) {
      handleFavorite();
    }
    toast.success("Retsept saqlandi");
  }, [handleFavorite, isFavorite]);

  const handleAddToMealPlan = React.useCallback(() => {
    setAddServings(servings);
    setAddOpen(true);
  }, [servings]);

  const handleStartCooking = React.useCallback(() => {
    const routeId = getRecipeRouteId(recipe);

    if (!routeId) {
      return;
    }

    navigate(`/user/nutrition/recipes/${encodeURIComponent(routeId)}/cook`);
  }, [navigate, recipe]);

  if (isLoading && !fallbackRecipe) {
    return (
      <NutritionLayout>
        <Card>
          <CardContent className="h-72 p-5" />
        </Card>
      </NutritionLayout>
    );
  }

  if (!recipe) {
    return (
      <NutritionLayout>
        <EmptyState
          icon={BookOpenIcon}
          title="Retsept topilmadi"
          description="Retseptlar sahifasiga qaytib, boshqa retseptni tanlang."
          actionLabel="Retseptlarga qaytish"
          onAction={() => navigate("/user/nutrition/recipes")}
        />
      </NutritionLayout>
    );
  }

  return (
    <NutritionLayout
      header={
        <Button type="button" variant="outline" asChild>
          <Link to="/user/nutrition/recipes">
            <ArrowLeftIcon data-icon="inline-start" />
            Retseptlarga qaytish
          </Link>
        </Button>
      }
    >
      <RecipeDetailView
        recipe={recipe}
        servings={servings}
        isFavorite={isFavorite}
        isUpdating={isUpdating}
        onServingsChange={setServings}
        onFavorite={handleFavorite}
        onSave={handleSave}
        onAddToMealPlan={handleAddToMealPlan}
        onEdit={() => navigate("/user/nutrition/recipes/create")}
        onStartCooking={handleStartCooking}
      />
      <RecipeAddDrawer
        open={addOpen}
        recipe={recipe}
        initialServings={addServings}
        addToMealLog={addToMealLog}
        addToMealPlan={addToMealPlan}
        isSubmitting={isUpdating}
        onOpenChange={setAddOpen}
      />
    </NutritionLayout>
  );
};

export default NutritionRecipeDetailPage;
