import React from "react";
import { useParams } from "react-router";
import get from "lodash/get";
import map from "lodash/map";
import size from "lodash/size";
import sortBy from "lodash/sortBy";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import {
  BookOpenIcon,
  ClockIcon,
  FlameIcon,
  SoupIcon,
  UtensilsIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Spinner } from "@/components/ui/spinner.jsx";
import { useGetQuery } from "@/hooks/api";
import { useAdminDrawerCloseNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";
import { useLanguageStore } from "@/store";

const getPayload = (response) =>
  get(response, "data.data", get(response, "data", response));

const resolveLabel = (translations, fallback, language) =>
  trim(get(translations, language, "")) ||
  trim(get(translations, "uz", "")) ||
  fallback ||
  "";

const resolveIngredientLabel = (item, language) => {
  const ingredient = get(item, "ingredient");
  return (
    resolveLabel(
      get(ingredient, "translations"),
      get(ingredient, "name"),
      language,
    ) ||
    get(item, "ingredientName") ||
    `Ingredient #${get(item, "ingredientId", get(item, "id", ""))}`
  );
};

const RecipeMetric = ({ icon: Icon, label, value }) => (
  <div className="rounded-lg border bg-muted/20 px-3 py-2">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </div>
    <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
  </div>
);

const RecipePreviewDrawer = () => {
  const { id } = useParams();
  const closeAdminDrawer = useAdminDrawerCloseNavigation("/admin/recipes/list");
  const currentLanguage =
    useLanguageStore((state) => state.currentLanguage) || "uz";

  const { data, isLoading } = useGetQuery({
    url: `/admin/foods/${id}`,
    queryProps: {
      enabled: Boolean(id),
      queryKey: ["admin", "recipes", "detail", id],
    },
  });
  const recipe = getPayload(data);
  const title = recipe
    ? resolveLabel(recipe.translations, recipe.name, currentLanguage)
    : "Retsept";
  const description =
    trim(get(recipe, "descriptionTranslations." + currentLanguage, "")) ||
    trim(get(recipe, "description", "")) ||
    "Admin preview";
  const categories = map(get(recipe, "categories", []), (category) =>
    resolveLabel(category.translations, category.name, currentLanguage),
  );
  const cuisines = map(get(recipe, "cuisines", []), (cuisine) =>
    resolveLabel(cuisine.translations, cuisine.name, currentLanguage),
  );
  const ingredients = sortBy(get(recipe, "recipeItems", []), [
    "orderKey",
    "id",
  ]);
  const steps = sortBy(get(recipe, "recipeInstructions", []), [
    "orderKey",
    "stepNumber",
    "id",
  ]);

  return (
    <Drawer
      open
      onOpenChange={(open) => !open && closeAdminDrawer()}
      direction="bottom"
    >
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader className="items-center text-center">
          <DrawerTitle>Retsept preview</DrawerTitle>
          <DrawerDescription>{title}</DrawerDescription>
        </DrawerHeader>

        {isLoading ? (
          <div className="flex min-h-72 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <DrawerBody>
            <div className="flex flex-col gap-6">
              <section className="grid gap-4 md:grid-cols-[180px_1fr]">
                {recipe?.imageUrl ? (
                  <img
                    src={recipe.imageUrl}
                    alt={title}
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <UtensilsIcon className="size-8" aria-hidden="true" />
                  </div>
                )}

                <div className="min-w-0 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {map([...categories, ...cuisines], (label) =>
                      label ? (
                        <Badge key={label} variant="outline">
                          {label}
                        </Badge>
                      ) : null,
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <RecipeMetric
                      icon={FlameIcon}
                      label="Kaloriya"
                      value={`${toNumber(recipe?.calories) || 0} kcal`}
                    />
                    <RecipeMetric
                      icon={SoupIcon}
                      label="Protein"
                      value={`${toNumber(recipe?.protein) || 0}g protein`}
                    />
                    <RecipeMetric
                      icon={ClockIcon}
                      label="Vaqt"
                      value={`${toNumber(recipe?.cookingMinutes) || 0} daqiqa`}
                    />
                    <RecipeMetric
                      icon={BookOpenIcon}
                      label="Qadam"
                      value={`${size(steps)} qadam`}
                    />
                  </div>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    Ingredientlar
                  </h3>
                  {ingredients.length ? (
                    <div className="mt-3 space-y-2">
                      {map(ingredients, (item) => (
                        <div
                          key={get(item, "id", get(item, "ingredientId"))}
                          className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-foreground">
                            {resolveIngredientLabel(item, currentLanguage)}
                          </span>
                          <span className="text-muted-foreground">
                            {toNumber(get(item, "grams")) || 0} g
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Ingredientlar hali kiritilmagan.
                    </p>
                  )}
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    Tayyorlash qadamlari
                  </h3>
                  {steps.length ? (
                    <div className="mt-3 space-y-3">
                      {map(steps, (step, index) => (
                        <div
                          key={get(step, "id", index)}
                          className="rounded-lg bg-muted/30 px-3 py-2 text-sm"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-foreground">
                              {trim(get(step, "title", "")) ||
                                `${index + 1}-qadam`}
                            </span>
                            {toNumber(get(step, "durationMinutes")) > 0 ? (
                              <span className="text-xs text-muted-foreground">
                                {toNumber(get(step, "durationMinutes"))} daqiqa
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-muted-foreground">
                            {trim(get(step, "body", ""))}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Tayyorlash qadamlari hali kiritilmagan.
                    </p>
                  )}
                </div>
              </section>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeAdminDrawer}
                >
                  Yopish
                </Button>
              </div>
            </div>
          </DrawerBody>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default RecipePreviewDrawer;
