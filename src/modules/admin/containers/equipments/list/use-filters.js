import React from "react";
import { find, get, isEmpty, isEqual } from "lodash";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";

const ITEMS_PER_PAGE = 10;
const SORT_FIELDS = ["orderKey", "name", "createdAt", "isActive", "isOnboarding"];
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

export const useEquipmentFilters = () => {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [searchOperator, setSearchOperator] = useQueryState(
    "qOp",
    parseAsStringEnum(TEXT_OPERATORS).withDefault("contains"),
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(["all", "active", "inactive"]).withDefault("all"),
  );
  const [statusOperator, setStatusOperator] = useQueryState(
    "statusOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [onboardingFilter, setOnboardingFilter] = useQueryState(
    "onboarding",
    parseAsStringEnum(["all", "yes", "no"]).withDefault("all"),
  );
  const [onboardingOperator, setOnboardingOperator] = useQueryState(
    "onboardingOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [imageFilter, setImageFilter] = useQueryState(
    "hasImage",
    parseAsStringEnum(["all", "yes", "no"]).withDefault("all"),
  );
  const [imageOperator, setImageOperator] = useQueryState(
    "hasImageOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [translationFilter, setTranslationFilter] = useQueryState(
    "translations",
    parseAsStringEnum(["all", "complete", "missing"]).withDefault("all"),
  );
  const [translationOperator, setTranslationOperator] = useQueryState(
    "translationsOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
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
    parseAsStringEnum(SORT_FIELDS).withDefault("orderKey"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(SORT_DIRECTIONS).withDefault("asc"),
  );
  const [visibleFilters, setVisibleFilters] = React.useState(() => ({
    status: statusFilter !== "all",
    onboarding: onboardingFilter !== "all",
    hasImage: imageFilter !== "all",
    translations: translationFilter !== "all",
  }));

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
    search.trim() === "" &&
    searchOperator === "contains" &&
    statusFilter === "all" &&
    statusOperator === "is" &&
    onboardingFilter === "all" &&
    onboardingOperator === "is" &&
    imageFilter === "all" &&
    imageOperator === "is" &&
    translationFilter === "all" &&
    translationOperator === "is" &&
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
        placeholder: "Jihoz qidirish",
      },
      {
        label: "Status",
        key: "status",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha statuslar" },
          { value: "active", label: "Faqat faol" },
          { value: "inactive", label: "Faqat nofaol" },
        ],
      },
      {
        label: "Onboarding",
        key: "onboarding",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barchasi" },
          { value: "yes", label: "Onboarding uchun" },
          { value: "no", label: "Qo'shimcha" },
        ],
      },
      {
        label: "Rasm",
        key: "image",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Hammasi" },
          { value: "yes", label: "Rasm bor" },
          { value: "no", label: "Rasmsiz" },
        ],
      },
      {
        label: "Tarjimalar",
        key: "translations",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha tarjimalar" },
          { value: "complete", label: "Tarjimasi to'liq" },
          { value: "missing", label: "Tarjimasi to'liq emas" },
        ],
      },
    ],
    [],
  );

  const activeFilters = React.useMemo(() => {
    const items = [];

    if (
      !isEmpty(String(search).trim()) ||
      searchOperator === "empty" ||
      searchOperator === "not_empty"
    ) {
      items.push({
        id: "q",
        field: "q",
        operator: searchOperator,
        values:
          searchOperator === "empty" || searchOperator === "not_empty"
            ? []
            : [search],
      });
    }

    const pushSelect = (field, value, operator, visible, emptyValue) => {
      if (
        visible ||
        !isEqual(value, emptyValue) ||
        operator === "empty" ||
        operator === "not_empty"
      ) {
        items.push({
          id: field,
          field,
          operator,
          values:
            operator === "empty" || operator === "not_empty" ? [] : [value],
        });
      }
    };

    pushSelect("status", statusFilter, statusOperator, visibleFilters.status, "all");
    pushSelect(
      "onboarding",
      onboardingFilter,
      onboardingOperator,
      visibleFilters.onboarding,
      "all",
    );
    pushSelect("hasImage", imageFilter, imageOperator, visibleFilters.hasImage, "all");
    pushSelect(
      "translations",
      translationFilter,
      translationOperator,
      visibleFilters.translations,
      "all",
    );

    return items;
  }, [
    imageFilter,
    imageOperator,
    onboardingFilter,
    onboardingOperator,
    search,
    searchOperator,
    statusFilter,
    statusOperator,
    translationFilter,
    translationOperator,
    visibleFilters,
  ]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch =
        get(find(nextFilters, (filter) => filter.field === "q"), "values[0]", "");
      const nextSearchOperator =
        get(find(nextFilters, (filter) => filter.field === "q"), "operator", "contains");
      const nextStatus =
        get(find(nextFilters, (filter) => filter.field === "status"), "values[0]", "all");
      const nextStatusOperator =
        get(find(nextFilters, (filter) => filter.field === "status"), "operator", "is");
      const nextImage =
        get(find(nextFilters, (filter) => filter.field === "hasImage"), "values[0]", "all");
      const nextImageOperator =
        get(find(nextFilters, (filter) => filter.field === "hasImage"), "operator", "is");
      const nextOnboarding =
        get(find(nextFilters, (filter) => filter.field === "onboarding"), "values[0]", "all");
      const nextOnboardingOperator =
        get(find(nextFilters, (filter) => filter.field === "onboarding"), "operator", "is");
      const nextTranslations =
        get(find(nextFilters, (filter) => filter.field === "translations"), "values[0]", "all");
      const nextTranslationsOperator =
        get(find(nextFilters, (filter) => filter.field === "translations"), "operator", "is");

      React.startTransition(() => {
        setVisibleFilters({
          status: Boolean(find(nextFilters, (filter) => filter.field === "status")),
          onboarding: Boolean(find(nextFilters, (filter) => filter.field === "onboarding")),
          hasImage: Boolean(find(nextFilters, (filter) => filter.field === "hasImage")),
          translations: Boolean(find(nextFilters, (filter) => filter.field === "translations")),
        });
        void setSearch(nextSearch);
        void setSearchOperator(nextSearchOperator);
        void setStatusFilter(nextStatus);
        void setStatusOperator(nextStatusOperator);
        void setOnboardingFilter(nextOnboarding);
        void setOnboardingOperator(nextOnboardingOperator);
        void setImageFilter(nextImage);
        void setImageOperator(nextImageOperator);
        void setTranslationFilter(nextTranslations);
        void setTranslationOperator(nextTranslationsOperator);
        void setPageQuery("1");
      });
    },
    [
      setImageFilter,
      setImageOperator,
      setOnboardingFilter,
      setOnboardingOperator,
      setPageQuery,
      setSearch,
      setSearchOperator,
      setStatusFilter,
      setStatusOperator,
      setTranslationFilter,
      setTranslationOperator,
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
    searchOperator,
    statusFilter,
    statusOperator,
    onboardingFilter,
    onboardingOperator,
    imageFilter,
    imageOperator,
    translationFilter,
    translationOperator,
    sortBy,
    sortDir,
    sorting,
    currentPage,
    pageSize,
    setPageQuery,
    setPageSizeQuery,
    canReorder,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  };
};
