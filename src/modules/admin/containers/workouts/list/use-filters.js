import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { map as lodashMap, trim, toNumber, isObject, find } from "lodash";

const FOOD_SORT_FIELDS = [
  "orderKey",
  "name",
  "calories",
  "servingSize",
  "createdAt",
  "isActive",
];
const FOOD_SORT_DIRECTIONS = ["asc", "desc"];

const resolveLabel = (translations, fallback, language) => {
  if (isObject(translations)) {
    const direct = trim(String(translations?.[language] ?? ""));
    if (direct) return direct;

    const uz = trim(String(translations?.uz ?? ""));
    if (uz) return uz;

    const first = find(Object.values(translations), (value) =>
      trim(String(value)),
    );
    if (first) return trim(String(first));
  }

  return fallback;
};

export const useWorkoutFilters = ({ categories, currentLanguage }) => {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [categoryFilter, setCategoryFilter] = useQueryState(
    "category",
    parseAsString.withDefault("all"),
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(["all", "active", "inactive"]).withDefault("all"),
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
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Mashg'ulot qidirish",
      },
      {
        label: "Kategoriya",
        key: "category",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha kategoriyalar" },
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
        label: "Status",
        key: "status",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barchasi" },
          { value: "active", label: "Faol" },
          { value: "inactive", label: "Nofaol" },
        ],
      },
      {
        label: "YouTube Link",
        key: "hasImage",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barchasi" },
          { value: "yes", label: "Havola bilan" },
          { value: "no", label: "Havolasiz" },
        ],
      },
      {
        label: "Tarjima holati",
        key: "translations",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barchasi" },
          { value: "complete", label: "To'liq" },
          { value: "missing", label: "Kam tarjimali" },
        ],
      },
      {
        label: "Dublikatlar",
        key: "duplicates",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barchasi" },
          { value: "only", label: "Faqat dublikatlar" },
        ],
      },
    ],
    [categories, currentLanguage],
  );

  const activeFilters = React.useMemo(() => {
    const items = [];

    if (search.trim()) {
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
    search,
    translationsFilter,
    statusFilter,
  ]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch =
        nextFilters.find((filter) => filter.field === "q")?.values?.[0] ?? "";
      const nextCategory =
        nextFilters.find((filter) => filter.field === "category")
          ?.values?.[0] ?? "all";
      const nextStatus =
        nextFilters.find((filter) => filter.field === "status")?.values?.[0] ??
        "all";
      const nextHasImage =
        nextFilters.find((filter) => filter.field === "hasImage")
          ?.values?.[0] ?? "all";
      const nextTranslations =
        nextFilters.find((filter) => filter.field === "translations")
          ?.values?.[0] ?? "all";
      const nextDuplicates =
        nextFilters.find((filter) => filter.field === "duplicates")
          ?.values?.[0] ?? "all";
      React.startTransition(() => {
        void setSearch(nextSearch);
        void setCategoryFilter(nextCategory);
        void setStatusFilter(nextStatus);
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
      ...(hasImageFilter !== "all" ? { hasImage: hasImageFilter } : {}),
      ...(translationsFilter !== "all"
        ? { translations: translationsFilter }
        : {}),
      ...(duplicatesFilter !== "all" ? { duplicates: duplicatesFilter } : {}),
      ...(lifecycleFilter !== "active" ? { lifecycle: lifecycleFilter } : {}),
      sortBy,
      sortDir,
      page: currentPage,
      pageSize: 10,
    }),
    [
      categoryFilter,
      currentPage,
      deferredSearch,
      duplicatesFilter,
      hasImageFilter,
      lifecycleFilter,
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
    hasImageFilter,
    translationsFilter,
    duplicatesFilter,
    lifecycleFilter,
    currentPage,
    sortBy,
    sortDir,
    sorting,
    deferredSearch,
    queryParams,
    pageQuery,
    setPageQuery,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  };
};
