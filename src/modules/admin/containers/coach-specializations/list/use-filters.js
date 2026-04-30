import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { get, find, isEmpty, isEqual } from "lodash";

const ITEMS_PER_PAGE = 10;
const SORT_FIELDS = ["orderKey", "name", "category", "createdAt", "isActive"];
const SORT_DIRECTIONS = ["asc", "desc"];
const TEXT_OPERATORS = [
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "is",
  "empty",
  "not_empty",
];
const SELECT_OPERATORS = ["is", "is_not", "empty", "not_empty"];

const COACH_CATEGORIES = [
  { value: "all", label: "Barcha kategoriyalar" },
  { value: "FITNESS", label: "Fitness" },
  { value: "YOGA", label: "Yoga" },
  { value: "BOXING", label: "Boks" },
  { value: "FOOTBALL", label: "Futbol" },
  { value: "SWIMMING", label: "Suzish" },
  { value: "TENNIS", label: "Tennis" },
  { value: "BASKETBALL", label: "Basketbol" },
  { value: "MARTIAL_ARTS", label: "Jang san'ati" },
  { value: "RUNNING", label: "Yugurish" },
  { value: "GYMNASTICS", label: "Gimnastika" },
  { value: "DANCE", label: "Raqs" },
  { value: "CHEERLEADING", label: "Cheerleading" },
  { value: "SKATING", label: "Muz uchish" },
  { value: "CYCLING", label: "Velosiped" },
  { value: "CLIMBING", label: "Toqqa chiqish" },
  { value: "OTHER", label: "Boshqa" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Barcha statuslar" },
  { value: "active", label: "Faqat faol" },
  { value: "inactive", label: "Faqat nofaol" },
];

export const useSpecializationFilters = () => {
  const [nameFilter, setNameFilter] = useQueryState(
    "name",
    parseAsString.withDefault(""),
  );
  const [nameOperator, setNameOperator] = useQueryState(
    "nameOp",
    parseAsStringEnum(TEXT_OPERATORS).withDefault("contains"),
  );
  const [isNameFilterVisible, setIsNameFilterVisible] = React.useState(
    () => nameFilter.trim() !== "",
  );
  const [categoryFilter, setCategoryFilter] = useQueryState(
    "category",
    parseAsStringEnum([
      "all",
      "FITNESS",
      "YOGA",
      "BOXING",
      "FOOTBALL",
      "SWIMMING",
      "TENNIS",
      "BASKETBALL",
      "MARTIAL_ARTS",
      "RUNNING",
      "GYMNASTICS",
      "DANCE",
      "CHEERLEADING",
      "SKATING",
      "CYCLING",
      "CLIMBING",
      "OTHER",
    ]).withDefault("all"),
  );
  const [categoryOperator, setCategoryOperator] = useQueryState(
    "categoryOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(["all", "active", "inactive"]).withDefault("all"),
  );
  const [statusOperator, setStatusOperator] = useQueryState(
    "statusOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [hasImageFilter, setHasImageFilter] = useQueryState(
    "hasImage",
    parseAsStringEnum(["all", "yes", "no"]).withDefault("all"),
  );
  const [hasImageOperator, setHasImageOperator] = useQueryState(
    "hasImageOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [translationsFilter, setTranslationsFilter] = useQueryState(
    "translations",
    parseAsStringEnum(["all", "complete", "missing"]).withDefault("all"),
  );
  const [translationsOperator, setTranslationsOperator] = useQueryState(
    "translationsOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [visibleFilters, setVisibleFilters] = React.useState(() => ({
    category: categoryFilter !== "all",
    status: statusFilter !== "all",
    hasImage: hasImageFilter !== "all",
    translations: translationsFilter !== "all",
  }));
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
    parseAsStringEnum(SORT_FIELDS).withDefault("orderKey"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(SORT_DIRECTIONS).withDefault("asc"),
  );

  const currentPage = Math.max(1, Number(pageQuery) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(pageSizeQuery) || ITEMS_PER_PAGE),
  );
  const sorting = React.useMemo(
    () =>
      sortBy === "orderKey" && sortDir === "asc"
        ? []
        : [{ id: sortBy, desc: sortDir === "desc" }],
    [sortBy, sortDir],
  );
  const canReorder =
    nameFilter.trim() === "" &&
    nameOperator === "contains" &&
    categoryFilter === "all" &&
    categoryOperator === "is" &&
    statusFilter === "all" &&
    statusOperator === "is" &&
    hasImageFilter === "all" &&
    hasImageOperator === "is" &&
    translationsFilter === "all" &&
    translationsOperator === "is" &&
    sortBy === "orderKey" &&
    sortDir === "asc" &&
    currentPage === 1;

  const filterFields = React.useMemo(
    () => [
      {
        label: "Nomi",
        key: "name",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Search text...",
      },
      {
        label: "Kategoriya",
        key: "category",
        type: "select",
        defaultOperator: "is",
        options: COACH_CATEGORIES,
      },
      {
        label: "Status",
        key: "status",
        type: "select",
        defaultOperator: "is",
        options: STATUS_OPTIONS,
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
    ],
    [],
  );

  const activeFilters = React.useMemo(() => {
    const items = [];
    if (
      isNameFilterVisible ||
      !isEmpty(String(nameFilter).trim()) ||
      nameOperator === "empty" ||
      nameOperator === "not_empty"
    ) {
      items.push({
        id: "name",
        field: "name",
        operator: nameOperator,
        values:
          nameOperator === "empty" || nameOperator === "not_empty"
            ? []
            : [nameFilter],
      });
    }
    if (
      visibleFilters.category ||
      !isEqual(categoryFilter, "all") ||
      categoryOperator === "empty" ||
      categoryOperator === "not_empty"
    ) {
      items.push({
        id: "category",
        field: "category",
        operator: categoryOperator,
        values:
          categoryOperator === "empty" || categoryOperator === "not_empty"
            ? []
            : [categoryFilter],
      });
    }
    if (
      visibleFilters.status ||
      !isEqual(statusFilter, "all") ||
      statusOperator === "empty" ||
      statusOperator === "not_empty"
    ) {
      items.push({
        id: "status",
        field: "status",
        operator: statusOperator,
        values:
          statusOperator === "empty" || statusOperator === "not_empty"
            ? []
            : [statusFilter],
      });
    }
    if (
      visibleFilters.hasImage ||
      !isEqual(hasImageFilter, "all") ||
      hasImageOperator === "empty" ||
      hasImageOperator === "not_empty"
    ) {
      items.push({
        id: "hasImage",
        field: "hasImage",
        operator: hasImageOperator,
        values:
          hasImageOperator === "empty" || hasImageOperator === "not_empty"
            ? []
            : [hasImageFilter],
      });
    }
    if (
      visibleFilters.translations ||
      !isEqual(translationsFilter, "all") ||
      translationsOperator === "empty" ||
      translationsOperator === "not_empty"
    ) {
      items.push({
        id: "translations",
        field: "translations",
        operator: translationsOperator,
        values:
          translationsOperator === "empty" ||
          translationsOperator === "not_empty"
            ? []
            : [translationsFilter],
      });
    }
    return items;
  }, [
    categoryFilter,
    categoryOperator,
    hasImageFilter,
    hasImageOperator,
    isNameFilterVisible,
    nameFilter,
    nameOperator,
    statusFilter,
    statusOperator,
    translationsFilter,
    translationsOperator,
    visibleFilters,
  ]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const getFilter = (field) =>
        find(nextFilters, (item) => isEqual(get(item, "field"), field));
      const nameFilterItem = getFilter("name");
      const categoryFilterItem = getFilter("category");
      const statusFilterItem = getFilter("status");
      const hasImageFilterItem = getFilter("hasImage");
      const translationsFilterItem = getFilter("translations");
      const getValue = (field, fallback = "") =>
        get(getFilter(field), "values[0]", fallback);
      const getOperator = (field, fallback = "is") =>
        get(getFilter(field), "operator", fallback);

      React.startTransition(() => {
        setIsNameFilterVisible(Boolean(nameFilterItem));
        setVisibleFilters({
          category: Boolean(categoryFilterItem),
          status: Boolean(statusFilterItem),
          hasImage: Boolean(hasImageFilterItem),
          translations: Boolean(translationsFilterItem),
        });
        void setNameFilter(getValue("name", ""));
        void setNameOperator(getOperator("name", "contains"));
        void setCategoryFilter(getValue("category", "all"));
        void setCategoryOperator(getOperator("category", "is"));
        void setStatusFilter(getValue("status", "all"));
        void setStatusOperator(getOperator("status", "is"));
        void setHasImageFilter(getValue("hasImage", "all"));
        void setHasImageOperator(getOperator("hasImage", "is"));
        void setTranslationsFilter(getValue("translations", "all"));
        void setTranslationsOperator(getOperator("translations", "is"));
        void setPageQuery("1");
      });
    },
    [
      setCategoryFilter,
      setCategoryOperator,
      setHasImageFilter,
      setHasImageOperator,
      setNameFilter,
      setNameOperator,
      setPageQuery,
      setStatusFilter,
      setStatusOperator,
      setTranslationsFilter,
      setTranslationsOperator,
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
    nameFilter,
    nameOperator,
    categoryFilter,
    categoryOperator,
    statusFilter,
    statusOperator,
    hasImageFilter,
    hasImageOperator,
    translationsFilter,
    translationsOperator,
    sortBy,
    sortDir,
    sorting,
    pageQuery,
    setPageQuery,
    pageSizeQuery,
    setPageSizeQuery,
    currentPage,
    pageSize,
    canReorder,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  };
};
