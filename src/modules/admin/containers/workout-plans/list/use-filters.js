import React from "react";
import { find, get, map } from "lodash";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";

const DIFFICULTY_OPTIONS = ["Boshlang'ich", "O'rta", "Yuqori"];
const SORT_FIELDS = [
  "name",
  "difficulty",
  "daysPerWeek",
  "days",
  "totalExercises",
  "updatedAt",
  "isActive",
];
const SORT_DIRECTIONS = ["asc", "desc"];

export const usePlanFilters = () => {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(["all", "active", "inactive"]).withDefault("all"),
  );
  const [translationsFilter, setTranslationsFilter] = useQueryState(
    "translations",
    parseAsStringEnum(["all", "complete", "missing"]).withDefault("all"),
  );
  const [difficultyFilter, setDifficultyFilter] = useQueryState(
    "difficulty",
    parseAsStringEnum(["all", ...DIFFICULTY_OPTIONS]).withDefault("all"),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringEnum(SORT_FIELDS).withDefault("updatedAt"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(SORT_DIRECTIONS).withDefault("desc"),
  );
  const [pageQuery, setPageQuery] = useQueryState(
    "page",
    parseAsString.withDefault("1"),
  );

  const filterFields = React.useMemo(
    () => [
      {
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Workout shablon qidirish",
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
        label: "Qiyinchilik",
        key: "difficulty",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha darajalar" },
          ...map(DIFFICULTY_OPTIONS, (option) => ({
            value: option,
            label: option,
          })),
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

    if (search.trim()) {
      items.push({
        id: "q",
        field: "q",
        operator: "contains",
        values: [search],
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

    if (difficultyFilter !== "all") {
      items.push({
        id: "difficulty",
        field: "difficulty",
        operator: "is",
        values: [difficultyFilter],
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

    return items;
  }, [difficultyFilter, search, statusFilter, translationsFilter]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch =
        get(find(nextFilters, (filter) => filter.field === "q"), "values[0]", "");
      const nextStatus =
        get(find(nextFilters, (filter) => filter.field === "status"), "values[0]", "all");
      const nextDifficulty =
        get(find(nextFilters, (filter) => filter.field === "difficulty"), "values[0]", "all");
      const nextTranslations =
        get(find(nextFilters, (filter) => filter.field === "translations"), "values[0]", "all");

      React.startTransition(() => {
        void setSearch(nextSearch);
        void setStatusFilter(nextStatus);
        void setDifficultyFilter(nextDifficulty);
        void setTranslationsFilter(nextTranslations);
        void setPageQuery("1");
      });
    },
    [
      setDifficultyFilter,
      setPageQuery,
      setSearch,
      setStatusFilter,
      setTranslationsFilter,
    ],
  );

  const sorting = React.useMemo(
    () => [{ id: sortBy, desc: sortDir === "desc" }],
    [sortBy, sortDir],
  );

  const handleSortingChange = React.useCallback(
    (updater) => {
      const nextSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      const nextSort = nextSorting?.[0];

      React.startTransition(() => {
        void setPageQuery("1");

        if (!nextSort) {
          void setSortBy("updatedAt");
          void setSortDir("desc");
          return;
        }

        void setSortBy(nextSort.id);
        void setSortDir(nextSort.desc ? "desc" : "asc");
      });
    },
    [setPageQuery, setSortBy, setSortDir, sorting],
  );

  const currentPage = Math.max(1, Number(pageQuery) || 1);

  return {
    search,
    statusFilter,
    translationsFilter,
    difficultyFilter,
    sortBy,
    sortDir,
    sorting,
    currentPage,
    pageQuery,
    setPageQuery,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  };
};
