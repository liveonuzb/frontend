import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { trim, find, map, toNumber } from "lodash";

const LOCATION_TYPES = ["country", "region", "district", "city"];
const FILTER_LOCATION_TYPES = ["all", ...LOCATION_TYPES];
const STATUS_OPTIONS = ["all", "active", "inactive"];
const TRANSLATION_OPTIONS = ["all", "complete", "incomplete", "missing"];
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
const SORT_FIELDS = ["type", "name", "pathLabel", "createdAt", "updatedAt", "isActive"];
const SORT_DIRECTIONS = ["asc", "desc"];
const DEFAULT_PAGE_SIZE = 20;
const TYPE_LABELS = {
  country: "Country",
  region: "Region",
  district: "District",
  city: "City",
};

export const useLocationFilters = () => {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [searchOperator, setSearchOperator] = useQueryState(
    "qOp",
    parseAsStringEnum(TEXT_OPERATORS).withDefault("contains"),
  );
  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    parseAsStringEnum(FILTER_LOCATION_TYPES).withDefault("all"),
  );
  const [typeOperator, setTypeOperator] = useQueryState(
    "typeOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(STATUS_OPTIONS).withDefault("all"),
  );
  const [statusOperator, setStatusOperator] = useQueryState(
    "statusOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [translationFilter, setTranslationFilter] = useQueryState(
    "translations",
    parseAsStringEnum(TRANSLATION_OPTIONS).withDefault("all"),
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
    parseAsStringEnum(SORT_FIELDS).withDefault("type"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(SORT_DIRECTIONS).withDefault("asc"),
  );
  const currentPage = Math.max(1, toNumber(pageQuery) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, toNumber(pageSizeQuery) || DEFAULT_PAGE_SIZE),
  );
  const sorting = React.useMemo(
    () =>
      sortBy === "type" && sortDir === "asc"
        ? []
        : [{ id: sortBy, desc: sortDir === "desc" }],
    [sortBy, sortDir],
  );

  const textOperatorOptions = React.useMemo(
    () => [
      { value: "contains", label: "contains" },
      { value: "not_contains", label: "does not contain" },
      { value: "starts_with", label: "starts with" },
      { value: "ends_with", label: "ends with" },
      { value: "is", label: "is exactly" },
      { value: "empty", label: "is empty" },
      { value: "not_empty", label: "is not empty" },
    ],
    [],
  );
  const selectOperatorOptions = React.useMemo(
    () => [
      { value: "is", label: "is" },
      { value: "is_not", label: "is not" },
      { value: "empty", label: "is empty" },
      { value: "not_empty", label: "is not empty" },
    ],
    [],
  );

  const filterFields = React.useMemo(
    () => [
      {
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        operators: textOperatorOptions,
        placeholder: "Location nomi yoki path",
      },
      {
        label: "Tur",
        key: "type",
        type: "select",
        defaultOperator: "is",
        operators: selectOperatorOptions,
        options: map(FILTER_LOCATION_TYPES, (value) => ({
          value,
          label: value === "all" ? "Barcha turlar" : TYPE_LABELS[value],
        })),
      },
      {
        label: "Status",
        key: "status",
        type: "select",
        defaultOperator: "is",
        operators: selectOperatorOptions,
        options: [
          { value: "all", label: "Barcha statuslar" },
          { value: "active", label: "Faqat faol" },
          { value: "inactive", label: "Faqat nofaol" },
        ],
      },
      {
        label: "Tarjimalar",
        key: "translations",
        type: "select",
        defaultOperator: "is",
        operators: selectOperatorOptions,
        options: [
          { value: "all", label: "Barcha tarjimalar" },
          { value: "complete", label: "Tarjimasi to'liq" },
          { value: "incomplete", label: "Tarjimasi to'liq emas" },
        ],
      },
    ],
    [selectOperatorOptions, textOperatorOptions],
  );

  const activeFilters = React.useMemo(() => {
    const next = [];

    if (trim(search) || searchOperator === "empty" || searchOperator === "not_empty") {
      next.push({
        id: "q",
        field: "q",
        operator: searchOperator,
        values: searchOperator === "empty" || searchOperator === "not_empty" ? [] : [search],
      });
    }

    if (typeFilter !== "all" || typeOperator === "empty" || typeOperator === "not_empty") {
      next.push({
        id: "type",
        field: "type",
        operator: typeOperator,
        values: typeOperator === "empty" || typeOperator === "not_empty" ? [] : [typeFilter],
      });
    }

    if (statusFilter !== "all" || statusOperator === "empty" || statusOperator === "not_empty") {
      next.push({
        id: "status",
        field: "status",
        operator: statusOperator,
        values: statusOperator === "empty" || statusOperator === "not_empty" ? [] : [statusFilter],
      });
    }

    if (translationFilter !== "all" || translationOperator === "empty" || translationOperator === "not_empty") {
      next.push({
        id: "translations",
        field: "translations",
        operator: translationOperator,
        values:
          translationOperator === "empty" || translationOperator === "not_empty"
            ? []
            : [translationFilter],
      });
    }

    return next;
  }, [
    search,
    searchOperator,
    statusFilter,
    statusOperator,
    translationFilter,
    translationOperator,
    typeFilter,
    typeOperator,
  ]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const getValue = (field, fallback = "") =>
        find(nextFilters, (item) => item.field === field)?.values?.[0] ?? fallback;
      const getOperator = (field, fallback = "is") =>
        find(nextFilters, (item) => item.field === field)?.operator ?? fallback;

      React.startTransition(() => {
        void setSearch(getValue("q", ""));
        void setSearchOperator(getOperator("q", "contains"));
        void setTypeFilter(getValue("type", "all"));
        void setTypeOperator(getOperator("type", "is"));
        void setStatusFilter(getValue("status", "all"));
        void setStatusOperator(getOperator("status", "is"));
        void setTranslationFilter(getValue("translations", "all"));
        void setTranslationOperator(getOperator("translations", "is"));
        void setPageQuery("1");
      });
    },
    [
      setPageQuery,
      setSearch,
      setSearchOperator,
      setStatusFilter,
      setStatusOperator,
      setTranslationFilter,
      setTranslationOperator,
      setTypeFilter,
      setTypeOperator,
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
          void setSortBy("type");
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
    typeFilter,
    typeOperator,
    statusFilter,
    statusOperator,
    translationFilter,
    translationOperator,
    sortBy,
    sortDir,
    sorting,
    currentPage,
    pageSize,
    setPageQuery,
    setPageSizeQuery,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  };
};
