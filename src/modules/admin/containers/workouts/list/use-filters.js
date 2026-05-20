import React from "react";
import { useTranslation } from "react-i18next";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { map as lodashMap, trim, toNumber, isObject, find, values as lodashValues } from "lodash";

const FOOD_SORT_FIELDS = [
  "orderKey",
  "name",
  "calories",
  "servingSize",
  "createdAt",
  "isActive",
  "isOnboarding",
];
const FOOD_SORT_DIRECTIONS = ["asc", "desc"];
const ITEMS_PER_PAGE = 10;

const resolveLabel = (translations, fallback, language) => {
  if (isObject(translations)) {
    const direct = trim(String(translations?.[language] ?? ""));
    if (direct) return direct;

    const uz = trim(String(translations?.uz ?? ""));
    if (uz) return uz;

    const first = find(lodashValues(translations), (value) =>
      trim(String(value)),
    );
    if (first) return trim(String(first));
  }

  return fallback;
};

export const useWorkoutFilters = ({ categories, currentLanguage }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [categoryFilter, setCategoryFilter] = useQueryState(
    "category",
    parseAsString.withDefault("all"),
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(["all", "active", "inactive"]).withDefault("all"),
  );
  const [onboardingFilter, setOnboardingFilter] = useQueryState(
    "onboarding",
    parseAsStringEnum(["all", "yes", "no"]).withDefault("all"),
  );
  const [hasImageFilter, setHasImageFilter] = useQueryState(
    "hasImage",
    parseAsStringEnum(["all", "yes", "no"]).withDefault("all"),
  );
  const [translationsFilter, setTranslationsFilter] = useQueryState(
    "translations",
    parseAsStringEnum(["all", "complete", "missing"]).withDefault("all"),
  );
  const [duplicatesFilter, setDuplicatesFilter] = useQueryState(
    "duplicates",
    parseAsStringEnum(["all", "only"]).withDefault("all"),
  );
  const [lifecycleFilter, setLifecycleFilter] = useQueryState(
    "lifecycle",
    parseAsStringEnum(["active", "trash"]).withDefault("active"),
  );
  const [pageQuery, setPageQuery] = useQueryState(
    "page",
    parseAsString.withDefault("1"),
  );
  const [pageSizeQuery, setPageSizeQuery] = useQueryState(
    "pageSize",
    parseAsString.withDefault(String(ITEMS_PER_PAGE)),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringEnum(FOOD_SORT_FIELDS).withDefault("orderKey"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(FOOD_SORT_DIRECTIONS).withDefault("asc"),
  );

  const deferredSearch = React.useDeferredValue(search);
  const currentPage = Math.max(1, toNumber(pageQuery) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, toNumber(pageSizeQuery) || ITEMS_PER_PAGE),
  );

  const sorting = React.useMemo(
    () =>
      sortBy === "orderKey" && sortDir === "asc"
        ? []
        : [{ id: sortBy, desc: sortDir === "desc" }],
    [sortBy, sortDir],
  );

  const filterFields = React.useMemo(
    () => [
      {
        label: t("admin.common.search"),
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: t("admin.workouts.filters.searchPlaceholder"),
      },
      {
        label: t("admin.workouts.filters.category"),
        key: "category",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: t("admin.workouts.filters.allCategories") },
          ...lodashMap(categories, (category) => ({
            value: String(category.id),
            label: resolveLabel(
              category.translations,
              category.name,
              currentLanguage,
            ),
          })),
        ],
      },
      {
        label: t("admin.common.status"),
        key: "status",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: t("admin.common.all") },
          { value: "active", label: t("admin.common.active") },
          { value: "inactive", label: t("admin.common.inactive") },
        ],
      },
      {
        label: t("admin.workouts.filters.showOnboarding"),
        key: "onboarding",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: t("admin.common.all") },
          { value: "yes", label: t("admin.workouts.filters.forOnboarding") },
          { value: "no", label: t("admin.workouts.filters.extra") },
        ],
      },
      {
        label: t("admin.workouts.filters.youtubeLink"),
        key: "hasImage",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: t("admin.common.all") },
          { value: "yes", label: t("admin.workouts.filters.withLink") },
          { value: "no", label: t("admin.workouts.filters.withoutLink") },
        ],
      },
      {
        label: t("admin.workoutPlans.filters.translationStatus"),
        key: "translations",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: t("admin.common.all") },
          { value: "complete", label: t("admin.workoutPlans.filters.complete") },
          { value: "missing", label: t("admin.workoutPlans.filters.missing") },
        ],
      },
      {
        label: t("admin.workouts.filters.duplicates"),
        key: "duplicates",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: t("admin.common.all") },
          { value: "only", label: t("admin.workouts.filters.onlyDuplicates") },
        ],
      },
    ],
    [categories, currentLanguage, t],
  );

  const activeFilters = React.useMemo(() => {
    const items = [];

    if (trim(search)) {
      items.push({
        id: "q",
        field: "q",
        operator: "contains",
        values: [search],
      });
    }

    if (categoryFilter !== "all") {
      items.push({
        id: "category",
        field: "category",
        operator: "is",
        values: [categoryFilter],
      });
    }

    if (statusFilter !== "all") {
      items.push({
        id: "status",
        field: "status",
        operator: "is",
        values: [statusFilter],
      });
    }

    if (onboardingFilter !== "all") {
      items.push({
        id: "onboarding",
        field: "onboarding",
        operator: "is",
        values: [onboardingFilter],
      });
    }

    if (hasImageFilter !== "all") {
      items.push({
        id: "hasImage",
        field: "hasImage",
        operator: "is",
        values: [hasImageFilter],
      });
    }

    if (translationsFilter !== "all") {
      items.push({
        id: "translations",
        field: "translations",
        operator: "is",
        values: [translationsFilter],
      });
    }

    if (duplicatesFilter !== "all") {
      items.push({
        id: "duplicates",
        field: "duplicates",
        operator: "is",
        values: [duplicatesFilter],
      });
    }

    return items;
  }, [
    categoryFilter,
    duplicatesFilter,
    hasImageFilter,
    onboardingFilter,
    search,
    translationsFilter,
    statusFilter,
  ]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch =
        find(nextFilters, (filter) => filter.field === "q")?.values?.[0] ?? "";
      const nextCategory =
        find(nextFilters, (filter) => filter.field === "category")
          ?.values?.[0] ?? "all";
      const nextStatus =
        find(nextFilters, (filter) => filter.field === "status")?.values?.[0] ??
        "all";
      const nextOnboarding =
        find(nextFilters, (filter) => filter.field === "onboarding")
          ?.values?.[0] ?? "all";
      const nextHasImage =
        find(nextFilters, (filter) => filter.field === "hasImage")
          ?.values?.[0] ?? "all";
      const nextTranslations =
        find(nextFilters, (filter) => filter.field === "translations")
          ?.values?.[0] ?? "all";
      const nextDuplicates =
        find(nextFilters, (filter) => filter.field === "duplicates")
          ?.values?.[0] ?? "all";
      React.startTransition(() => {
        void setSearch(nextSearch);
        void setCategoryFilter(nextCategory);
        void setStatusFilter(nextStatus);
        void setOnboardingFilter(nextOnboarding);
        void setHasImageFilter(nextHasImage);
        void setTranslationsFilter(nextTranslations);
        void setDuplicatesFilter(nextDuplicates);
        void setPageQuery("1");
      });
    },
    [
      setCategoryFilter,
      setDuplicatesFilter,
      setHasImageFilter,
      setOnboardingFilter,
      setPageQuery,
      setSearch,
      setTranslationsFilter,
      setStatusFilter,
    ],
  );

  const handleSortingChange = React.useCallback(
    (updater) => {
      const nextSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      const nextSort = nextSorting?.[0];

      React.startTransition(() => {
        void setPageQuery("1");

        if (!nextSort) {
          void setSortBy("orderKey");
          void setSortDir("asc");
          return;
        }

        void setSortBy(nextSort.id);
        void setSortDir(nextSort.desc ? "desc" : "asc");
      });
    },
    [setPageQuery, setSortBy, setSortDir, sorting],
  );

  const queryParams = React.useMemo(
    () => ({
      ...(trim(deferredSearch) ? { q: trim(deferredSearch) } : {}),
      ...(categoryFilter !== "all" ? { categoryId: categoryFilter } : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(onboardingFilter !== "all" ? { onboarding: onboardingFilter } : {}),
      ...(hasImageFilter !== "all" ? { hasImage: hasImageFilter } : {}),
      ...(translationsFilter !== "all"
        ? { translations: translationsFilter }
        : {}),
      ...(duplicatesFilter !== "all" ? { duplicates: duplicatesFilter } : {}),
      ...(lifecycleFilter !== "active" ? { lifecycle: lifecycleFilter } : {}),
      sortBy,
      sortDir,
      page: currentPage,
      pageSize,
    }),
    [
      categoryFilter,
      currentPage,
      deferredSearch,
      duplicatesFilter,
      hasImageFilter,
      onboardingFilter,
      lifecycleFilter,
      pageSize,
      sortBy,
      sortDir,
      translationsFilter,
      statusFilter,
    ],
  );

  return {
    search,
    categoryFilter,
    statusFilter,
    onboardingFilter,
    hasImageFilter,
    translationsFilter,
    duplicatesFilter,
    lifecycleFilter,
    currentPage,
    pageSize,
    sortBy,
    sortDir,
    sorting,
    deferredSearch,
    queryParams,
    pageQuery,
    setPageQuery,
    setPageSizeQuery,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  };
};


