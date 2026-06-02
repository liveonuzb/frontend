import React from "react";
import { ArrowLeftIcon, BookOpenIcon, ChefHatIcon } from "lucide-react";
import map from "lodash/map";
import { Link, useNavigate, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { cn } from "@/lib/utils.js";
import { useBreadcrumbStore } from "@/store";
import {
  useNutritionRecipeActions,
  useNutritionRecipeDetail,
} from "@/hooks/app/use-nutrition-recipes.js";
import NutritionLayout from "../ui/nutrition-layout.jsx";
import EmptyState from "./components/empty-state.jsx";
import RecipeAddDrawer from "./components/recipe-add-drawer.jsx";
import RecipeCookingMode from "./components/recipe-cooking-mode.jsx";
import RecipeImage from "./components/recipe-image.jsx";
import NutritionSummary from "./components/nutrition-summary.jsx";
import {
  findMockRecipe,
  formatQuantity,
  getRecipeNutrition,
} from "./recipe-mock-data.js";
import { normalizeRecipeForUi } from "./recipe-ui-utils.js";

const CookingIngredientsDrawer = ({ open, recipe, onOpenChange }) => {
  const [checkedMap, setCheckedMap] = React.useState({});

  if (!recipe) {
    return null;
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[88vh] data-[vaul-drawer-direction=bottom]:md:max-w-md">
        <DrawerHeader className="border-b border-border/40">
          <DrawerTitle>Masalliqlar</DrawerTitle>
          <DrawerDescription>
            Pishirish vaqtida tayyor bo'lgan masalliqlarni belgilab boring.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="flex flex-col gap-2">
            {map(recipe.ingredients, (ingredient) => {
              const checked = Boolean(checkedMap[ingredient.id]);

              return (
                <label
                  key={ingredient.id}
                  className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-border bg-background px-3 py-2 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Checkbox
                      checked={checked}
                      aria-label={`${ingredient.name} tayyor`}
                      onCheckedChange={(value) =>
                        setCheckedMap((current) => ({
                          ...current,
                          [ingredient.id]: Boolean(value),
                        }))
                      }
                    />
                    <span
                      className={cn(
                        "truncate font-medium text-foreground",
                        checked && "text-muted-foreground line-through",
                      )}
                    >
                      {ingredient.name}
                    </span>
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {formatQuantity(
                      ingredient.displayAmount ?? ingredient.quantity,
                      ingredient.displayUnit ?? ingredient.unit,
                      1,
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

const NutritionRecipeCookingPage = () => {
  const navigate = useNavigate();
  const { slugOrId } = useParams();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { recipe: apiRecipe, isLoading } = useNutritionRecipeDetail(slugOrId);
  const fallbackRecipe = React.useMemo(() => findMockRecipe(slugOrId), [slugOrId]);
  const recipe = React.useMemo(
    () =>
      apiRecipe || fallbackRecipe
        ? normalizeRecipeForUi(apiRecipe || fallbackRecipe)
        : null,
    [apiRecipe, fallbackRecipe],
  );
  const { addToMealLog, addToMealPlan, isUpdating } =
    useNutritionRecipeActions();
  const [addOpen, setAddOpen] = React.useState(false);
  const [ingredientsOpen, setIngredientsOpen] = React.useState(false);
  const instructions = recipe?.steps || recipe?.instructions || [];
  const nutrition = recipe ? getRecipeNutrition(recipe, 1) : null;

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user/dashboard", title: "Bosh sahifa" },
      { url: "/user/nutrition/overview", title: "Ovqatlanish" },
      { url: "/user/nutrition/recipes", title: "Retseptlar" },
      {
        url: `/user/nutrition/recipes/${slugOrId}/cook`,
        title: recipe?.title ? `${recipe.title} pishirish` : "Pishirish",
      },
    ]);

    return () => setBreadcrumbs([]);
  }, [recipe?.title, setBreadcrumbs, slugOrId]);

  if (isLoading && !fallbackRecipe) {
    return (
      <NutritionLayout>
        <Card>
          <CardContent className="h-72 p-5" />
        </Card>
      </NutritionLayout>
    );
  }

  if (!recipe || !instructions.length) {
    return (
      <NutritionLayout>
        <EmptyState
          icon={BookOpenIcon}
          title="Pishirish qadamlari topilmadi"
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
          <Link to={`/user/nutrition/recipes/${slugOrId}`}>
            <ArrowLeftIcon data-icon="inline-start" />
            Retseptga qaytish
          </Link>
        </Button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="xl:sticky xl:top-4 xl:self-start">
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="aspect-[16/10] overflow-hidden rounded-xl bg-muted">
              <RecipeImage recipe={recipe} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1">
                <ChefHatIcon className="size-3" />
                Cooking
              </Badge>
              <Badge variant="outline">{recipe.totalTimeMinutes} min</Badge>
              <Badge variant="outline">{instructions.length} qadam</Badge>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {recipe.title}
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {recipe.description}
              </p>
            </div>
            {nutrition ? <NutritionSummary nutrition={nutrition} /> : null}
          </CardContent>
        </Card>

        <RecipeCookingMode
          instructions={instructions}
          onShowIngredients={() => setIngredientsOpen(true)}
          onFinish={() => setAddOpen(true)}
        />
      </div>

      <RecipeAddDrawer
        open={addOpen}
        recipe={recipe}
        initialServings={1}
        addToMealLog={addToMealLog}
        addToMealPlan={addToMealPlan}
        isSubmitting={isUpdating}
        onOpenChange={setAddOpen}
      />
      <CookingIngredientsDrawer
        open={ingredientsOpen}
        recipe={recipe}
        onOpenChange={setIngredientsOpen}
      />
    </NutritionLayout>
  );
};

export default NutritionRecipeCookingPage;
