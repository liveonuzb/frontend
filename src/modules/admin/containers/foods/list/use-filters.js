import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { map as lodashMap } from "lodash";

const ITEMS_PER_PAGE = 10;
const FOOD_SORT_FIELDS = [
  "orderKey",
  "name",
  "calories",
  "servingSize",
  "createdAt",
  "isActive",
];
const FOOD_SORT_DIRECTIONS = ["asc", "desc"];

export const useFoodFilters = ({ categories = [], currentLanguage, resolveLabel }) => {
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

  const currentPage = Math.max(1, Number(pageQuery) || 1);
  const pageSize = ITEMS_PER_PAGE;

  const sorting = React.useMemo(
    () =>
      sortBy === "orderKey" && sortDir === "asc"
        ? []
        : [{ id: sortBy, desc: sortDir === "desc" }],
    [sortBy, sortDir],
  );

  const canReorder =
    search.trim() === "" &&
    categoryFilter === "all" &&
    statusFilter === "all" &&
    hasImageFilter === "all" &&
    translationsFilter === "all" &&
    duplicatesFilter === "all" &&
    sortBy === "orderKey" &&
    sortDir === "asc" &&
    currentPage === 1;

  const filterFields = React.useMemo(
    () => [
      {
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Ovqat qidirish",
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
        label: "Rasm",
        key: "hasImage",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barchasi" },
          { value: "yes", label: "Rasmli" },
          { value: "no", label: "Rasmsiz" },
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
    [categories, currentLanguage, resolveLabel],
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
        nextFilters.find((filter) => filter.field === "category")?.values?.[0] ??
        "all";
      const nextStatus =
        nextFilters.find((filter) => filter.field === "status")?.values?.[0] ??
        "all";
      const nextHasImage =
        nextFilters.find((filter) => filter.field === "hasImage")?.values?.[0] ??
        "all";
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

  return {
    search,
    categoryFilter,
    statusFilter,
    hasImageFilter,
    translationsFilter,
    duplicatesFilter,
    sortBy,
    sortDir,
    pageQuery,
    setPageQuery,
    currentPage,
    pageSize,
    sorting,
    canReorder,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  };
};
