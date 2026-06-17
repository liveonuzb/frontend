import React from "react";
import { Outlet, useSearchParams } from "react-router";
import {
  concat,
  filter,
  get,
  includes,
  map,
  size,
  slice,
  toNumber,
  trim,
} from "lodash";
import {
  ArchiveIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  FlameIcon,
  LanguagesIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SaveIcon,
  SearchIcon,
  SparklesIcon,
  UtensilsIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner.jsx";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import {
  AdminListHeader,
  AdminListPageShell,
  AdminListRefetchButton,
  AdminListToolbar,
} from "@/modules/admin/components/admin-list-shell.jsx";
import { useAdminDrawerListNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
import { useBreadcrumbStore, useLanguageStore } from "@/store";

const ADMIN_RECIPES_QUERY_KEY = ["admin", "recipes"];

const SORT_FIELDS = ["createdAt", "name", "calories", "protein"];
const SORT_DIRECTIONS = ["asc", "desc"];
const RECIPE_STATUS_LABELS = {
  draft: "Draft",
  pending_review: "Public review",
  published: "Published",
  rejected: "Rejected",
  archived: "Archived",
};

const resolveLabel = (translations, fallback, language) =>
  trim(get(translations, language, "")) ||
  trim(get(translations, "uz", "")) ||
  fallback ||
  "";

const resolveParam = (value, allowedValues, fallback) =>
  includes(allowedValues, value) ? value : fallback;

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

const getReadinessVariant = (status) => {
  if (status === "ready") return "default";
  if (status === "blocked") return "destructive";
  return "secondary";
};

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
    url: "/admin/nutrition/recipes",
    params: queryParams,
    queryProps: {
      queryKey: [...ADMIN_RECIPES_QUERY_KEY, queryParams],
    },
  });
  const publicationMutation = usePatchQuery({
    queryKey: ADMIN_RECIPES_QUERY_KEY,
  });
  const recognitionMutation = usePatchQuery({
    queryKey: [...ADMIN_RECIPES_QUERY_KEY, "product-recognition-jobs"],
  });

  const recognitionQueueParams = React.useMemo(
    () => ({ status: "needs_review", page: 1, pageSize: 5 }),
    [],
  );
  const { data: recognitionQueueData } = useGetQuery({
    url: "/admin/nutrition/recipes/product-recognition-jobs",
    params: recognitionQueueParams,
    queryProps: {
      queryKey: [
        ...ADMIN_RECIPES_QUERY_KEY,
        "product-recognition-jobs",
        recognitionQueueParams,
      ],
    },
  });

  const recipes = get(data, "data.data", []);
  const recognitionJobs = get(recognitionQueueData, "data.data", []);
  const recognitionMeta = get(recognitionQueueData, "data.meta", {});
  const recognitionTotal =
    toNumber(get(recognitionMeta, "total")) || size(recognitionJobs);
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

  const handlePublishRecipe = React.useCallback(
    async (recipe) => {
      try {
        await publicationMutation.mutateAsync({
          url: `/admin/nutrition/recipes/${recipe.id}/publish`,
        });
        toast.success("Recipe public qilindi");
      } catch (error) {
        toast.error(
          get(error, "response.data.message", "Recipe public qilinmadi"),
        );
      }
    },
    [publicationMutation],
  );

  const handleArchiveRecipe = React.useCallback(
    async (recipe) => {
      try {
        await publicationMutation.mutateAsync({
          url: `/admin/nutrition/recipes/${recipe.id}/archive`,
        });
        toast.success("Recipe arxivlandi");
      } catch (error) {
        toast.error(get(error, "response.data.message", "Recipe arxivlanmadi"));
      }
    },
    [publicationMutation],
  );

  const handleSaveRecognitionSuggestions = React.useCallback(
    async (job) => {
      const suggestions = get(job, "suggestions", []);

      if (!size(suggestions)) {
        toast.error("Saqlanadigan suggestion topilmadi");
        return;
      }

      try {
        await recognitionMutation.mutateAsync({
          url: `/admin/nutrition/recipes/product-recognition-jobs/${job.id}/suggestions`,
          attributes: { suggestions },
        });
        toast.success("Recognition suggestion saqlandi");
      } catch (error) {
        toast.error(
          get(error, "response.data.message", "Suggestion saqlanmadi"),
        );
      }
    },
    [recognitionMutation],
  );

  const handleReviewRecognitionJob = React.useCallback(
    async (job, status) => {
      try {
        await recognitionMutation.mutateAsync({
          url: `/admin/nutrition/recipes/product-recognition-jobs/${job.id}/review`,
          attributes: { status },
        });
        toast.success(
          status === "approved"
            ? "Recognition job approve qilindi"
            : "Recognition job reject qilindi",
        );
      } catch (error) {
        toast.error(
          get(error, "response.data.message", "Recognition review saqlanmadi"),
        );
      }
    },
    [recognitionMutation],
  );

  const toolbarFilters = React.useMemo(
    () => (
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
    ),
    [search, updateSearchParams],
  );

  const toolbarActions = React.useMemo(
    () => (
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
        <AdminListRefetchButton isFetching={isFetching} onClick={() => refetch()} />
      </div>
    ),
    [isFetching, refetch, sortBy, updateSearchParams],
  );

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
        filters={toolbarFilters}
        actions={toolbarActions}
      />

      {recognitionJobs.length ? (
        <section
          aria-label="AI product recognition review"
          className="space-y-3 rounded-lg border bg-card p-4 shadow-sm"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <SparklesIcon className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-semibold">
                  AI product recognition review
                </h2>
                <p className="text-xs text-muted-foreground">
                  {recognitionTotal} job review kerak
                </p>
              </div>
            </div>
            <Badge variant="outline">Pending va failed jobs</Badge>
          </div>
          <div className="grid gap-2">
            {map(recognitionJobs, (job) => {
              const products = map(
                get(job, "recognizedProducts", []),
                (product) => trim(get(product, "name", "")),
              )
                .filter(Boolean)
                .join(", ");
              const suggestions = get(job, "suggestions", []);
              const firstSuggestion = get(suggestions, "0.title", "");

              return (
                <div
                  key={job.id}
                  className="grid gap-3 rounded-lg border border-dashed p-3 lg:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={job.status === "failed" ? "destructive" : "secondary"}
                      >
                        {job.status}
                      </Badge>
                      <span className="text-sm font-medium">
                        {products || "Product topilmadi"}
                      </span>
                    </div>
                    {firstSuggestion ? (
                      <p className="text-sm text-muted-foreground">
                        {firstSuggestion}
                      </p>
                    ) : null}
                    {job.error ? (
                      <p className="text-xs text-destructive">{job.error}</p>
                    ) : null}
                    {job.user ? (
                      <p className="text-xs text-muted-foreground">
                        {get(job, "user.firstName") || get(job, "user.phone")}
                      </p>
                    ) : null}
                  </div>
                  {canManageContent ? (
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      {size(suggestions) ? (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={recognitionMutation.isPending}
                          onClick={() => handleSaveRecognitionSuggestions(job)}
                        >
                          <SaveIcon data-icon="inline-start" />
                          Suggestionni saqlash
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        disabled={recognitionMutation.isPending}
                        onClick={() => handleReviewRecognitionJob(job, "approved")}
                      >
                        <CheckCircleIcon data-icon="inline-start" />
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={recognitionMutation.isPending}
                        onClick={() => handleReviewRecognitionJob(job, "rejected")}
                      >
                        <XCircleIcon data-icon="inline-start" />
                        Reject
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

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
            const recipeStatus = get(
              recipe,
              "recipeStatus",
              recipe.isActive ? "published" : "draft",
            );
            const readiness = get(recipe, "readiness", {});
            const readinessIssues = get(readiness, "issues", []);
            const readinessStatus = get(readiness, "status", "blocked");
            const criticalIssueCount = size(
              filter(readinessIssues, { blocker: true }),
            );
            const statusLabel = get(
              RECIPE_STATUS_LABELS,
              recipeStatus,
              recipeStatus || "Draft",
            );
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
                    <Badge
                      variant={
                        recipeStatus === "pending_review"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {statusLabel}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {map(concat(categoryLabels, cuisineLabels), (label) =>
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

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant={getReadinessVariant(readinessStatus)}>
                      Readiness {toNumber(get(readiness, "score")) || 0}%
                    </Badge>
                    {criticalIssueCount ? (
                      <span>{criticalIssueCount} blocker</span>
                    ) : (
                      <span>Publish uchun tayyor</span>
                    )}
                    {map(slice(readinessIssues, 0, 2), (issue) => (
                      <span key={get(issue, "code")} className="truncate">
                        {get(issue, "label")}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-start gap-2 md:justify-end">
                  {recipeStatus !== "published" && canManageContent ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        publicationMutation.isPending ||
                        !get(readiness, "readyToPublish", false)
                      }
                      onClick={() => handlePublishRecipe(recipe)}
                    >
                      <CheckCircleIcon data-icon="inline-start" />
                      Publish
                    </Button>
                  ) : null}
                  {recipeStatus !== "archived" && canManageContent ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={publicationMutation.isPending}
                      onClick={() => handleArchiveRecipe(recipe)}
                    >
                      <ArchiveIcon data-icon="inline-start" />
                      Archive
                    </Button>
                  ) : null}
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
