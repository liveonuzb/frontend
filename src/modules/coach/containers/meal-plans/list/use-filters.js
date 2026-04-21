import React from "react";
import { find, get, trim } from "lodash";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";

const ITEMS_PER_PAGE = 10;

const MEAL_PLAN_SORT_FIELDS = [
  "title",
  "source",
  "mealsCount",
  "daysWithMeals",
  "assignedClientsCount",
  "totalCalories",
  "updatedAt",
  "orderKey",
];
const MEAL_PLAN_SORT_DIRECTIONS = ["asc", "desc"];
const MEAL_PLAN_LIFECYCLE_VALUES = ["active", "trash", "all"];

export const useMealPlanFilters = () => {
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
  const [lifecycle, setLifecycle] = useQueryState(
    "lifecycle",
    parseAsStringEnum(MEAL_PLAN_LIFECYCLE_VALUES).withDefault("active"),
  );
  const [sourceFilter, setSourceFilter] = useQueryState(
    "source",
    parseAsStringEnum(["all", "manual", "ai"]).withDefault("all"),
  );
  const [assignmentFilter, setAssignmentFilter] = useQueryState(
    "assigned",
    parseAsStringEnum(["all", "assigned", "unassigned"]).withDefault("all"),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringEnum(MEAL_PLAN_SORT_FIELDS).withDefault("updatedAt"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(MEAL_PLAN_SORT_DIRECTIONS).withDefault("desc"),
  );
  const [pageQuery, setPageQuery] = useQueryState(
    "page",
    parseAsString.withDefault("1"),
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
    trim(search) === "" &&
    lifecycle === "active" &&
    sourceFilter === "all" &&
    assignmentFilter === "all" &&
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
        placeholder: "Reja nomi bo'yicha qidiring",
      },
      {
        label: "Manba",
        key: "source",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha manbalar" },
          { value: "manual", label: "Manual" },
          { value: "ai", label: "AI" },
        ],
      },
      {
        label: "Biriktirish",
        key: "assigned",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha template'lar" },
          { value: "assigned", label: "Mijozga biriktirilgan" },
          { value: "unassigned", label: "Bo'sh template" },
        ],
      },
    ],
    [],
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

    if (sourceFilter !== "all") {
      items.push({
        id: "source",
        field: "source",
        operator: "is",
        values: [sourceFilter],
      });
    }

    if (assignmentFilter !== "all") {
      items.push({
        id: "assigned",
        field: "assigned",
        operator: "is",
        values: [assignmentFilter],
      });
    }

    return items;
  }, [search, sourceFilter, assignmentFilter]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch = get(find(nextFilters, (f) => f.field === "q"), "values[0]", "");
      const nextSource = get(find(nextFilters, (f) => f.field === "source"), "values[0]", "all");
      const nextAssigned = get(find(nextFilters, (f) => f.field === "assigned"), "values[0]", "all");

      React.startTransition(() => {
        void setSearch(nextSearch);
        void setSourceFilter(nextSource);
        void setAssignmentFilter(nextAssigned);
        void setPageQuery("1");
      });
    },
    [setSearch, setSourceFilter, setAssignmentFilter, setPageQuery],
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

  return {
    search,
    lifecycle,
    setLifecycle,
    sourceFilter,
    assignmentFilter,
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
