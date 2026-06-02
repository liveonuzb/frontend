import React from "react";
import find from "lodash/find";
import get from "lodash/get";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";

const DEFAULT_PAGE_SIZE = 20;
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
const SORT_FIELDS = [
  "orderKey",
  "name",
  "createdAt",
  "isActive",
  "isOnboarding",
];
const SORT_DIRECTIONS = ["asc", "desc"];

const clampPage = (page) => Math.max(1, toNumber(page) || 1);

const clampPageSize = (pageSize) =>
  Math.min(100, Math.max(1, toNumber(pageSize) || DEFAULT_PAGE_SIZE));

const isEmptyOperator = (operator) =>
  operator === "empty" || operator === "not_empty";

const getFilterValue = (filters, field, fallback) =>
  get(
    find(filters, (filter) => get(filter, "field") === field),
    "values[0]",
    fallback,
  );

const getFilterOperator = (filters, field, fallback) =>
  get(
    find(filters, (filter) => get(filter, "field") === field),
    "operator",
    fallback,
  );

export function useLocalizedCatalogFilters({ pluralSearchPlaceholder }) {
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
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
    parseAsString.withDefault(String(DEFAULT_PAGE_SIZE)),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringEnum(SORT_FIELDS).withDefault("orderKey"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(SORT_DIRECTIONS).withDefault("asc"),
  );

  const currentPage = clampPage(pageQuery);
  const pageSize = clampPageSize(pageSizeQuery);
  const deferredSearch = React.useDeferredValue(search);
  const sorting = React.useMemo(
    () =>
      sortBy === "orderKey" && sortDir === "asc"
        ? []
        : [{ id: sortBy, desc: sortDir === "desc" }],
    [sortBy, sortDir],
  );

  const queryParams = React.useMemo(
    () => ({
      ...(trim(deferredSearch) ? { q: trim(deferredSearch) } : {}),
      ...((trim(deferredSearch) || isEmptyOperator(searchOperator)) &&
      searchOperator !== "contains"
        ? { qOp: searchOperator }
        : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...((statusFilter !== "all" || isEmptyOperator(statusOperator)) &&
      statusOperator !== "is"
        ? { statusOp: statusOperator }
        : {}),
      ...(onboardingFilter !== "all" ? { onboarding: onboardingFilter } : {}),
      ...((onboardingFilter !== "all" || isEmptyOperator(onboardingOperator)) &&
      onboardingOperator !== "is"
        ? { onboardingOp: onboardingOperator }
        : {}),
      ...(translationFilter !== "all"
        ? { translations: translationFilter }
        : {}),
      ...((translationFilter !== "all" ||
        isEmptyOperator(translationOperator)) &&
      translationOperator !== "is"
        ? { translationsOp: translationOperator }
        : {}),
      sortBy,
      sortDir,
      page: currentPage,
      pageSize,
    }),
    [
      currentPage,
      deferredSearch,
      onboardingFilter,
      onboardingOperator,
      pageSize,
      searchOperator,
      sortBy,
      sortDir,
      statusFilter,
      statusOperator,
      translationFilter,
      translationOperator,
    ],
  );

  const filterFields = React.useMemo(
    () => [
      {
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: pluralSearchPlaceholder,
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
        label: "Onboardingda ko'rsatish",
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
    [pluralSearchPlaceholder],
  );

  const activeFilters = React.useMemo(() => {
    const next = [];

    if (trim(search) || isEmptyOperator(searchOperator)) {
      next.push({
        id: "q",
        field: "q",
        operator: searchOperator,
        values: isEmptyOperator(searchOperator) ? [] : [search],
      });
    }

    if (statusFilter !== "all" || isEmptyOperator(statusOperator)) {
      next.push({
        id: "status",
        field: "status",
        operator: statusOperator,
        values: isEmptyOperator(statusOperator) ? [] : [statusFilter],
      });
    }

    if (onboardingFilter !== "all" || isEmptyOperator(onboardingOperator)) {
      next.push({
        id: "onboarding",
        field: "onboarding",
        operator: onboardingOperator,
        values: isEmptyOperator(onboardingOperator) ? [] : [onboardingFilter],
      });
    }

    if (translationFilter !== "all" || isEmptyOperator(translationOperator)) {
      next.push({
        id: "translations",
        field: "translations",
        operator: translationOperator,
        values: isEmptyOperator(translationOperator)
          ? []
          : [translationFilter],
      });
    }

    return next;
  }, [
    onboardingFilter,
    onboardingOperator,
    search,
    searchOperator,
    statusFilter,
    statusOperator,
    translationFilter,
    translationOperator,
  ]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      React.startTransition(() => {
        void setSearch(getFilterValue(nextFilters, "q", ""));
        void setSearchOperator(
          getFilterOperator(nextFilters, "q", "contains"),
        );
        void setStatusFilter(getFilterValue(nextFilters, "status", "all"));
        void setStatusOperator(
          getFilterOperator(nextFilters, "status", "is"),
        );
        void setOnboardingFilter(
          getFilterValue(nextFilters, "onboarding", "all"),
        );
        void setOnboardingOperator(
          getFilterOperator(nextFilters, "onboarding", "is"),
        );
        void setTranslationFilter(
          getFilterValue(nextFilters, "translations", "all"),
        );
        void setTranslationOperator(
          getFilterOperator(nextFilters, "translations", "is"),
        );
        void setPageQuery("1");
      });
    },
    [
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

  const isDefaultReorderView =
    trim(deferredSearch) === "" &&
    searchOperator === "contains" &&
    statusFilter === "all" &&
    statusOperator === "is" &&
    onboardingFilter === "all" &&
    onboardingOperator === "is" &&
    translationFilter === "all" &&
    translationOperator === "is" &&
    sortBy === "orderKey" &&
    sortDir === "asc" &&
    currentPage === 1;

  return {
    activeFilters,
    currentPage,
    deferredSearch,
    filterFields,
    handleFiltersChange,
    isDefaultReorderView,
    onboardingFilter,
    pageSize,
    queryParams,
    search,
    setPageQuery,
    setPageSizeQuery,
    setSortBy,
    setSortDir,
    sortBy,
    sortDir,
    sorting,
    statusFilter,
    translationFilter,
  };
}
