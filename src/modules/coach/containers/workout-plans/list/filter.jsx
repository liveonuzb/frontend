import { find, get, trim } from "lodash";
import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { useTranslation } from "react-i18next";
import { Filters } from "@/components/reui/filters.jsx";

const WORKOUT_PLAN_SORT_FIELDS = [
  "name",
  "totalExercises",
  "daysWithWorkouts",
  "assignedClientsCount",
  "updatedAt",
];
const WORKOUT_PLAN_SORT_DIRECTIONS = ["asc", "desc"];

export const useWorkoutPlanFilters = () => {
  const { t } = useTranslation();

  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
  const [assignmentFilter, setAssignmentFilter] = useQueryState(
    "assigned",
    parseAsStringEnum(["all", "assigned", "unassigned"]).withDefault("all"),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringEnum(WORKOUT_PLAN_SORT_FIELDS).withDefault("updatedAt"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(WORKOUT_PLAN_SORT_DIRECTIONS).withDefault("desc"),
  );

  const sorting = React.useMemo(
    () => [{ id: sortBy, desc: sortDir === "desc" }],
    [sortBy, sortDir],
  );

  const filterFields = React.useMemo(
    () => [
      {
        label: t("coach.workoutPlans.filters.search"),
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: t("coach.workoutPlans.filters.searchPlaceholder"),
      },
      {
        label: t("coach.workoutPlans.filters.assignment"),
        key: "assigned",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: t("coach.workoutPlans.filters.all") },
          {
            value: "assigned",
            label: t("coach.workoutPlans.filters.assigned"),
          },
          {
            value: "unassigned",
            label: t("coach.workoutPlans.filters.unassigned"),
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
    if (assignmentFilter !== "all") {
      items.push({
        id: "assigned",
        field: "assigned",
        operator: "is",
        values: [assignmentFilter],
      });
    }
    return items;
  }, [assignmentFilter, search]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch = get(
        find(nextFilters, (f) => get(f, "field") === "q"),
        "values[0]",
        "",
      );
      const nextAssigned = get(
        find(nextFilters, (f) => get(f, "field") === "assigned"),
        "values[0]",
        "all",
      );

      React.startTransition(() => {
        void setSearch(nextSearch);
        void setAssignmentFilter(nextAssigned);
      });
    },
    [setAssignmentFilter, setSearch],
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
        void setSortBy(get(nextSort, "id"));
        void setSortDir(get(nextSort, "desc") ? "desc" : "asc");
      });
    },
    [setSortBy, setSortDir, sorting],
  );

  return {
    search,
    assignmentFilter,
    sorting,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  };
};

export const Filter = ({
  filterFields,
  activeFilters,
  handleFiltersChange,
  onRefetch,
  isFetching,
}) => {
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
