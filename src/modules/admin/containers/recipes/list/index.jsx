import React from "react";
import { Outlet, useSearchParams } from "react-router";
import get from "lodash/get";
import map from "lodash/map";
import size from "lodash/size";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import {
  BookOpenIcon,
  ClockIcon,
  EyeIcon,
  FlameIcon,
  LanguagesIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  UtensilsIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner.jsx";
import { useGetQuery } from "@/hooks/api";
import {
  AdminListHeader,
  AdminListPageShell,
  AdminListRefetchButton,
  AdminListToolbar,
} from "@/modules/admin/components/admin-list-shell.jsx";
import { useAdminDrawerListNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
import { useBreadcrumbStore, useLanguageStore } from "@/store";

export const ADMIN_RECIPES_QUERY_KEY = ["admin", "recipes"];

const SORT_FIELDS = ["createdAt", "name", "calories", "protein"];
const SORT_DIRECTIONS = ["asc", "desc"];

const resolveLabel = (translations, fallback, language) =>
  trim(get(translations, language, "")) ||
  trim(get(translations, "uz", "")) ||
  fallback ||
  "";

const resolveParam = (value, allowedValues, fallback) =>
  allowedValues.includes(value) ? value : fallback;

const resolveMetaTotalPages = (meta) =>
  Math.max(
    1,
    toNumber(get(meta, "totalPages", get(meta, "pageCount", 1))) || 1,
  );

const RecipeStat = ({ icon: Icon, children }) => (
  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
    <Icon className="size-4" aria-hidden="true" />
    {children}
  </span>
);

const RecipeListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigateAdminDrawer = useAdminDrawerListNavigation();
  const { canManageContent } = useAdminPermissions();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage =
    useLanguageStore((state) => state.currentLanguage) || "uz";

  const search = searchParams.get("q") || "";
  const currentPage = Math.max(1, toNumber(searchParams.get("page")) || 1);
  const pageSize = Math.min(
    48,
    Math.max(1, toNumber(searchParams.get("pageSize")) || 12),
  );
  const sortBy = resolveParam(
    searchParams.get("sortBy"),
    SORT_FIELDS,
    "createdAt",
  );
  const sortDir = resolveParam(
    searchParams.get("sortDir"),
    SORT_DIRECTIONS,
    "desc",
  );
  const deferredSearch = React.useDeferredValue(search);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/recipes/list", title: "Retseptlar" },
    ]);
  }, [setBreadcrumbs]);

  const queryParams = React.useMemo(
    () => ({
      nutritionMode: "recipe",
      ...(trim(deferredSearch) ? { name: trim(deferredSearch) } : {}),
      sortBy,
      sortDir,
      page: currentPage,
      pageSize,
    }),
    [currentPage, deferredSearch, pageSize, sortBy, sortDir],
  );

  const { data, isLoading, isFetching, refetch } = useGetQuery({
    url: "/admin/foods",
    params: queryParams,
    queryProps: {
      queryKey: [...ADMIN_RECIPES_QUERY_KEY, queryParams],
    },
  });

  const recipes = get(data, "data.data", []);
  const meta = get(data, "data.meta", {
    total: 0,
    page: currentPage,
    pageSize,
    totalPages: 1,
  });
  const totalPages = resolveMetaTotalPages(meta);
  const totalCount = toNumber(get(meta, "total")) || size(recipes);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setSearchParams((params) => {
        const nextParams = new URLSearchParams(params);
        nextParams.set("page", String(totalPages));
        return nextParams;
      });
    }
  }, [currentPage, setSearchParams, totalPages]);

  const updateSearchParams = React.useCallback(
    (updates) => {
      setSearchParams((params) => {
        const nextParams = new URLSearchParams(params);

        map(updates, (value, key) => {
          if (value === null || value === undefined || value === "") {
            nextParams.delete(key);
            return;
          }

          nextParams.set(key, String(value));
        });

        return nextParams;
      });
    },
    [setSearchParams],
  );

  const openCreateDrawer = () => {
    if (!canManageContent) return;
    navigateAdminDrawer("create?nutritionMode=recipe");
  };

  const openEditDrawer = (recipe) => {
    if (!canManageContent) return;
    navigateAdminDrawer(`edit/${recipe.id}`);
  };

  const openTranslateDrawer = (recipe) => {
    if (!canManageContent) return;
    navigateAdminDrawer(`translate/${recipe.id}`);
  };

  const openPreviewDrawer = (recipe) => {
    navigateAdminDrawer(`preview/${recipe.id}`);
  };

  const openRecipeDrawer = (recipe) => {
    if (!canManageContent) return;
    navigateAdminDrawer(`recipe/${recipe.id}`);
  };

  return (
    <AdminListPageShell>
      <AdminListHeader
        icon={BookOpenIcon}
        title="Retseptlar"
        description="Ingredientlar asosida hisoblanadigan taomlar"
        actions={
          canManageContent ? (
            <Button type="button" onClick={openCreateDrawer}>
              <PlusIcon data-icon="inline-start" />
              Yangi retsept
            </Button>
          ) : null
        }
      />

      <AdminListToolbar
        filters={
          <div className="relative max-w-md">
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(event) =>
                updateSearchParams({ q: event.target.value, page: 1 })
              }
              placeholder="Retsept qidirish..."
              className="pl-9"
            />
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                updateSearchParams({
                  sortBy: sortBy === "createdAt" ? "name" : "createdAt",
                  sortDir: sortBy === "createdAt" ? "asc" : "desc",
                  page: 1,
                })
              }
            >
              <RotateCcwIcon data-icon="inline-start" />
              Tartib
            </Button>
            <AdminListRefetchButton
              isFetching={isFetching}
              onClick={() => refetch()}
            />
          </div>
        }
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{totalCount} retsept</span>
        <span>
          {currentPage}/{totalPages} sahifa
        </span>
      </div>

      {isLoading ? (
        <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed">
          <Spinner />
        </div>
      ) : recipes.length ? (
        <div className="grid gap-3">
          {map(recipes, (recipe) => {
            const title = resolveLabel(
              recipe.translations,
              recipe.name,
              currentLanguage,
            );
            const ingredientCount = size(get(recipe, "recipeItems", []));
            const stepCount = size(get(recipe, "recipeInstructions", []));
            const categoryLabels = map(
              get(recipe, "categories", []),
              (category) =>
                resolveLabel(
                  category.translations,
                  category.name,
                  currentLanguage,
                ),
            );
            const cuisineLabels = map(get(recipe, "cuisines", []), (cuisine) =>
              resolveLabel(cuisine.translations, cuisine.name, currentLanguage),
            );

            return (
              <article
                key={recipe.id}
                className="grid gap-4 rounded-lg border bg-card p-4 shadow-sm md:grid-cols-[80px_1fr_auto]"
              >
                {recipe.imageUrl ? (
                  <img
                    src={recipe.imageUrl}
                    alt={title}
                    className="size-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex size-20 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <UtensilsIcon className="size-6" aria-hidden="true" />
                  </div>
                )}

                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-semibold text-foreground">
                      {title}
                    </h2>
                    <Badge variant={recipe.isActive ? "default" : "secondary"}>
                      {recipe.isActive ? "Faol" : "Nofaol"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {map([...categoryLabels, ...cuisineLabels], (label) =>
                      label ? (
                        <Badge key={label} variant="outline">
                          {label}
                        </Badge>
                      ) : null,
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    <RecipeStat icon={FlameIcon}>
                      {toNumber(recipe.calories) || 0} kcal
                    </RecipeStat>
                    <RecipeStat icon={UtensilsIcon}>
                      {ingredientCount} ingredient
                    </RecipeStat>
                    <RecipeStat icon={BookOpenIcon}>
                      {stepCount} qadam
                    </RecipeStat>
                    <RecipeStat icon={ClockIcon}>
                      {toNumber(recipe.cookingMinutes) || 0} daqiqa
                    </RecipeStat>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>Protein: {toNumber(recipe.protein) || 0}g</span>
                    <span>Uglevod: {toNumber(recipe.carbs) || 0}g</span>
                    <span>Yog': {toNumber(recipe.fat) || 0}g</span>
                    <span>Porsiya: {toNumber(recipe.servings) || 1}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-start gap-2 md:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openPreviewDrawer(recipe)}
                  >
                    <EyeIcon data-icon="inline-start" />
                    Ko&apos;rish
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openRecipeDrawer(recipe)}
                    disabled={!canManageContent}
                  >
                    <BookOpenIcon data-icon="inline-start" />
                    Tarkib
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openTranslateDrawer(recipe)}
                    disabled={!canManageContent}
                  >
                    <LanguagesIcon data-icon="inline-start" />
                    Tarjima
                  </Button>
                  <Button
                    type="button"
                    onClick={() => openEditDrawer(recipe)}
                    disabled={!canManageContent}
                  >
                    <PencilIcon data-icon="inline-start" />
                    Tahrirlash
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Retsept topilmadi.
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={currentPage <= 1 || isFetching}
          onClick={() => updateSearchParams({ page: currentPage - 1 })}
        >
          Oldingi
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={currentPage >= totalPages || isFetching}
          onClick={() => updateSearchParams({ page: currentPage + 1 })}
        >
          Keyingi
        </Button>
      </div>

      <Outlet />
    </AdminListPageShell>
  );
};

export default RecipeListPage;
