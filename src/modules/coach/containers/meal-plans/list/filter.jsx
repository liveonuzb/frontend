import { find, get, trim } from "lodash";
import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { useTranslation } from "react-i18next";
import { Filters } from "@/components/reui/filters.jsx";

const MEAL_PLAN_SORT_FIELDS = [
  "title",
  "source",
  "mealsCount",
  "daysWithMeals",
  "assignedClientsCount",
  "totalCalories",
  "updatedAt",
];
const MEAL_PLAN_SORT_DIRECTIONS = ["asc", "desc"];

export const useMealPlanFilters = () => {
  const { t } = useTranslation();

  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault(""),
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

  const sorting = React.useMemo(
    () => [{ id: sortBy, desc: sortDir === "desc" }],
    [sortBy, sortDir],
  );

  const filterFields = React.useMemo(
    () => [
      {
        label: t("coach.mealPlans.filters.search"),
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: t("coach.mealPlans.filters.searchPlaceholder"),
      },
      {
        label: t("coach.mealPlans.filters.source"),
        key: "source",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: t("coach.mealPlans.filters.allSources") },
          { value: "manual", label: t("coach.mealPlans.filters.manual") },
          { value: "ai", label: t("coach.mealPlans.filters.ai") },
        ],
      },
      {
        label: t("coach.mealPlans.filters.assignment"),
        key: "assigned",
        type: "select",
        defaultOperator: "is",
        options: [
          {
            value: "all",
            label: t("coach.mealPlans.filters.allTemplates"),
          },
          {
            value: "assigned",
            label: t("coach.mealPlans.filters.assigned"),
          },
          {
            value: "unassigned",
            label: t("coach.mealPlans.filters.unassigned"),
          },
        ],
      },
    ],
    [t],
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
  }, [assignmentFilter, search, sourceFilter]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch = get(find(nextFilters, (filter) => filter.field === "q"), "values[0]", "");
      const nextSource = get(find(nextFilters, (filter) => filter.field === "source"), "values[0]", "all");
      const nextAssigned = get(find(nextFilters, (filter) => filter.field === "assigned"), "values[0]", "all");

      React.startTransition(() => {
        void setSearch(nextSearch);
        void setSourceFilter(nextSource);
        void setAssignmentFilter(nextAssigned);
      });
    },
    [setAssignmentFilter, setSearch, setSourceFilter],
  );

  const handleSortingChange = React.useCallback(
    (updater) => {
      const nextSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      const nextSort = get(nextSorting, "[0]");

      React.startTransition(() => {
        if (!nextSort) {
          void setSortBy("updatedAt");
          void setSortDir("desc");
          return;
        }
        void setSortBy(nextSort.id);
        void setSortDir(nextSort.desc ? "desc" : "asc");
      });
    },
    [setSortBy, setSortDir, sorting],
  );

  return {
    search,
    sourceFilter,
    assignmentFilter,
    sorting,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  };
};

export const Filter = ({ filterFields, activeFilters, handleFiltersChange }) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <Filters
        fields={filterFields}
        filters={activeFilters}
        onChange={handleFiltersChange}
        className="flex-1"
      />
    </div>
  );
};
