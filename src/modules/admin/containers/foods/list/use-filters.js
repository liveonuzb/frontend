import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { map as lodashMap } from "lodash";
import {
  ALLERGEN_TAG_OPTIONS,
  DIETARY_TAG_OPTIONS,
} from "@/modules/admin/lib/nutrition-tags.js";

const ITEMS_PER_PAGE = 10;
const FOOD_SORT_FIELDS = [
  "orderKey",
  "name",
  "calories",
  "servingSize",
  "createdAt",
  "isActive",
  "isOnboarding",
  "nutritionMode",
];
const FOOD_SORT_DIRECTIONS = ["asc", "desc"];
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

const textOperatorOptions = [
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "starts_with", label: "starts with" },
  { value: "ends_with", label: "ends with" },
  { value: "is", label: "is exactly" },
  { value: "empty", label: "is empty" },
  { value: "not_empty", label: "is not empty" },
];

const selectOperatorOptions = [
  { value: "is", label: "is" },
  { value: "is_not", label: "is not" },
  { value: "empty", label: "is empty" },
  { value: "not_empty", label: "is not empty" },
];

export const useFoodFilters = ({
  categories = [],
  cuisines = [],
  currentLanguage,
  resolveLabel,
}) => {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [searchOp, setSearchOp] = useQueryState(
    "qOp",
    parseAsStringEnum(TEXT_OPERATORS).withDefault("contains"),
  );
  const [categoryFilter, setCategoryFilter] = useQueryState(
    "category",
    parseAsString.withDefault("all"),
  );
  const [categoryOp, setCategoryOp] = useQueryState(
    "categoryOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [cuisineFilter, setCuisineFilter] = useQueryState(
    "cuisine",
    parseAsString.withDefault("all"),
  );
  const [cuisineOp, setCuisineOp] = useQueryState(
    "cuisineOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(["all", "active", "inactive"]).withDefault("all"),
  );
  const [statusOp, setStatusOp] = useQueryState(
    "statusOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [onboardingFilter, setOnboardingFilter] = useQueryState(
    "onboarding",
    parseAsStringEnum(["all", "yes", "no"]).withDefault("all"),
  );
  const [onboardingOp, setOnboardingOp] = useQueryState(
    "onboardingOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [hasImageFilter, setHasImageFilter] = useQueryState(
    "hasImage",
    parseAsStringEnum(["all", "yes", "no"]).withDefault("all"),
  );
  const [hasImageOp, setHasImageOp] = useQueryState(
    "hasImageOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [translationsFilter, setTranslationsFilter] = useQueryState(
    "translations",
    parseAsStringEnum(["all", "complete", "missing"]).withDefault("all"),
  );
  const [translationsOp, setTranslationsOp] = useQueryState(
    "translationsOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [duplicatesFilter, setDuplicatesFilter] = useQueryState(
    "duplicates",
    parseAsStringEnum(["all", "only"]).withDefault("all"),
  );
  const [dietaryTag, setDietaryTag] = useQueryState(
    "dietaryTag",
    parseAsStringEnum([
      "all",
      ...DIETARY_TAG_OPTIONS.map((item) => item.value),
    ]).withDefault("all"),
  );
  const [dietaryTagOp, setDietaryTagOp] = useQueryState(
    "dietaryTagOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [allergenTag, setAllergenTag] = useQueryState(
    "allergenTag",
    parseAsStringEnum([
      "all",
      ...ALLERGEN_TAG_OPTIONS.map((item) => item.value),
    ]).withDefault("all"),
  );
  const [allergenTagOp, setAllergenTagOp] = useQueryState(
    "allergenTagOp",
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
    parseAsStringEnum(FOOD_SORT_FIELDS).withDefault("orderKey"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(FOOD_SORT_DIRECTIONS).withDefault("asc"),
  );

  const currentPage = Math.max(1, Number(pageQuery) || 1);
  const pageSize = Math.max(1, Number(pageSizeQuery) || ITEMS_PER_PAGE);

  const sorting = React.useMemo(
    () =>
      sortBy === "orderKey" && sortDir === "asc"
        ? []
        : [{ id: sortBy, desc: sortDir === "desc" }],
    [sortBy, sortDir],
  );

  const canReorder =
    search.trim() === "" &&
    searchOp === "contains" &&
    categoryFilter === "all" &&
    categoryOp === "is" &&
    cuisineFilter === "all" &&
    cuisineOp === "is" &&
    statusFilter === "all" &&
    statusOp === "is" &&
    onboardingFilter === "all" &&
    onboardingOp === "is" &&
    hasImageFilter === "all" &&
    hasImageOp === "is" &&
    dietaryTag === "all" &&
    dietaryTagOp === "is" &&
    allergenTag === "all" &&
    allergenTagOp === "is" &&
    translationsFilter === "all" &&
    translationsOp === "is" &&
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
        operators: textOperatorOptions,
        placeholder: "Ovqat qidirish",
      },
      {
        label: "Kategoriya",
        key: "category",
        type: "select",
        defaultOperator: "is",
        operators: selectOperatorOptions,
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
        label: "Oshxona",
        key: "cuisine",
        type: "select",
        defaultOperator: "is",
        operators: selectOperatorOptions,
        options: [
          { value: "all", label: "Barcha oshxonalar" },
          ...lodashMap(cuisines, (cuisine) => ({
            value: String(cuisine.id),
            label: resolveLabel(
              cuisine.translations,
              cuisine.name,
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
        operators: selectOperatorOptions,
        options: [
          { value: "all", label: "Barchasi" },
          { value: "active", label: "Faol" },
          { value: "inactive", label: "Nofaol" },
        ],
      },
      {
        label: "Onboarding",
        key: "onboarding",
        type: "select",
        defaultOperator: "is",
        operators: selectOperatorOptions,
        options: [
          { value: "all", label: "Barchasi" },
          { value: "yes", label: "Onboarding uchun" },
          { value: "no", label: "Qo'shimcha" },
        ],
      },
      {
        label: "Rasm",
        key: "hasImage",
        type: "select",
        defaultOperator: "is",
        operators: selectOperatorOptions,
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
        operators: selectOperatorOptions,
        options: [
          { value: "all", label: "Barchasi" },
          { value: "complete", label: "To'liq" },
          { value: "missing", label: "Kam tarjimali" },
        ],
      },
      {
        label: "Dietary tag",
        key: "dietaryTag",
        type: "select",
        defaultOperator: "is",
        operators: selectOperatorOptions,
        options: [{ value: "all", label: "Barchasi" }, ...DIETARY_TAG_OPTIONS],
      },
      {
        label: "Allergen tag",
        key: "allergenTag",
        type: "select",
        defaultOperator: "is",
        operators: selectOperatorOptions,
        options: [{ value: "all", label: "Barchasi" }, ...ALLERGEN_TAG_OPTIONS],
      },
      {
        label: "Dublikatlar",
        key: "duplicates",
        type: "select",
        defaultOperator: "is",
        operators: selectOperatorOptions,
        options: [
          { value: "all", label: "Barchasi" },
          { value: "only", label: "Faqat dublikatlar" },
        ],
      },
    ],
    [categories, cuisines, currentLanguage, resolveLabel],
  );

  const activeFilters = React.useMemo(() => {
    const items = [];

    if (search.trim() || searchOp !== "contains") {
      items.push({
        id: "q",
        field: "q",
        operator: searchOp,
        values: search.trim() ? [search] : [],
      });
    }

    if (categoryFilter !== "all" || categoryOp !== "is") {
      items.push({
        id: "category",
        field: "category",
        operator: categoryOp,
        values: categoryFilter !== "all" ? [categoryFilter] : [],
      });
    }

    if (cuisineFilter !== "all" || cuisineOp !== "is") {
      items.push({
        id: "cuisine",
        field: "cuisine",
        operator: cuisineOp,
        values: cuisineFilter !== "all" ? [cuisineFilter] : [],
      });
    }

    if (statusFilter !== "all" || statusOp !== "is") {
      items.push({
        id: "status",
        field: "status",
        operator: statusOp,
        values: statusFilter !== "all" ? [statusFilter] : [],
      });
    }

    if (onboardingFilter !== "all" || onboardingOp !== "is") {
      items.push({
        id: "onboarding",
        field: "onboarding",
        operator: onboardingOp,
        values: onboardingFilter !== "all" ? [onboardingFilter] : [],
      });
    }

    if (hasImageFilter !== "all" || hasImageOp !== "is") {
      items.push({
        id: "hasImage",
        field: "hasImage",
        operator: hasImageOp,
        values: hasImageFilter !== "all" ? [hasImageFilter] : [],
      });
    }

    if (translationsFilter !== "all" || translationsOp !== "is") {
      items.push({
        id: "translations",
        field: "translations",
        operator: translationsOp,
        values: translationsFilter !== "all" ? [translationsFilter] : [],
      });
    }

    if (dietaryTag !== "all" || dietaryTagOp !== "is") {
      items.push({
        id: "dietaryTag",
        field: "dietaryTag",
        operator: dietaryTagOp,
        values: dietaryTag !== "all" ? [dietaryTag] : [],
      });
    }

    if (allergenTag !== "all" || allergenTagOp !== "is") {
      items.push({
        id: "allergenTag",
        field: "allergenTag",
        operator: allergenTagOp,
        values: allergenTag !== "all" ? [allergenTag] : [],
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
    categoryOp,
    allergenTag,
    allergenTagOp,
    cuisineFilter,
    cuisineOp,
    dietaryTag,
    dietaryTagOp,
    duplicatesFilter,
    hasImageFilter,
    hasImageOp,
    onboardingFilter,
    onboardingOp,
    search,
    searchOp,
    translationsFilter,
    translationsOp,
    statusFilter,
    statusOp,
  ]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const byField = (field) =>
        nextFilters.find((filter) => filter.field === field);
      const nextSearch = byField("q")?.values?.[0] ?? "";
      const nextCategory = byField("category")?.values?.[0] ?? "all";
      const nextCuisine = byField("cuisine")?.values?.[0] ?? "all";
      const nextStatus = byField("status")?.values?.[0] ?? "all";
      const nextOnboarding = byField("onboarding")?.values?.[0] ?? "all";
      const nextHasImage = byField("hasImage")?.values?.[0] ?? "all";
      const nextTranslations = byField("translations")?.values?.[0] ?? "all";
      const nextDietaryTag = byField("dietaryTag")?.values?.[0] ?? "all";
      const nextAllergenTag = byField("allergenTag")?.values?.[0] ?? "all";
      const nextDuplicates = byField("duplicates")?.values?.[0] ?? "all";

      React.startTransition(() => {
        void setSearch(nextSearch);
        void setSearchOp(byField("q")?.operator ?? "contains");
        void setCategoryFilter(nextCategory);
        void setCategoryOp(byField("category")?.operator ?? "is");
        void setCuisineFilter(nextCuisine);
        void setCuisineOp(byField("cuisine")?.operator ?? "is");
        void setStatusFilter(nextStatus);
        void setStatusOp(byField("status")?.operator ?? "is");
        void setOnboardingFilter(nextOnboarding);
        void setOnboardingOp(byField("onboarding")?.operator ?? "is");
        void setHasImageFilter(nextHasImage);
        void setHasImageOp(byField("hasImage")?.operator ?? "is");
        void setTranslationsFilter(nextTranslations);
        void setTranslationsOp(byField("translations")?.operator ?? "is");
        void setDietaryTag(nextDietaryTag);
        void setDietaryTagOp(byField("dietaryTag")?.operator ?? "is");
        void setAllergenTag(nextAllergenTag);
        void setAllergenTagOp(byField("allergenTag")?.operator ?? "is");
        void setDuplicatesFilter(nextDuplicates);
        void setPageQuery("1");
      });
    },
    [
      setCategoryFilter,
      setCategoryOp,
      setAllergenTag,
      setAllergenTagOp,
      setCuisineFilter,
      setCuisineOp,
      setDietaryTag,
      setDietaryTagOp,
      setDuplicatesFilter,
      setHasImageFilter,
      setHasImageOp,
      setOnboardingFilter,
      setOnboardingOp,
      setPageQuery,
      setSearch,
      setSearchOp,
      setTranslationsFilter,
      setTranslationsOp,
      setStatusFilter,
      setStatusOp,
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
    searchOp,
    categoryFilter,
    categoryOp,
    cuisineFilter,
    cuisineOp,
    statusFilter,
    statusOp,
    onboardingFilter,
    onboardingOp,
    hasImageFilter,
    hasImageOp,
    dietaryTag,
    dietaryTagOp,
    allergenTag,
    allergenTagOp,
    translationsFilter,
    translationsOp,
    duplicatesFilter,
    sortBy,
    sortDir,
    pageQuery,
    setPageQuery,
    setPageSizeQuery,
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
