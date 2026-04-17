import React from "react";
import { find, get } from "lodash";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";

export const useChallengeFilters = () => {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum([
      "all",
      "UPCOMING",
      "ACTIVE",
      "COMPLETED",
      "CANCELLED",
    ]).withDefault("all"),
  );
  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    parseAsStringEnum(["all", "GLOBAL", "USER_CREATED"]).withDefault("all"),
  );

  const filterFields = React.useMemo(
    () => [
      {
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Nomi yoki ta'rifi bo'yicha qidiring",
      },
      {
        label: "Turi",
        key: "type",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha turlar" },
          { value: "GLOBAL", label: "Global" },
          { value: "USER_CREATED", label: "Community" },
        ],
      },
      {
        label: "Holati",
        key: "status",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha holatlar" },
          { value: "UPCOMING", label: "Boshlanmagan" },
          { value: "ACTIVE", label: "Faol" },
          { value: "COMPLETED", label: "Yakunlangan" },
          { value: "CANCELLED", label: "Bekor qilingan" },
        ],
      },
    ],
    [],
  );

  const activeFilters = React.useMemo(() => {
    const filters = [];

    if (search.trim()) {
      filters.push({
        id: "q",
        field: "q",
        operator: "contains",
        values: [search],
      });
    }

    if (typeFilter !== "all") {
      filters.push({
        id: "type",
        field: "type",
        operator: "is",
        values: [typeFilter],
      });
    }

    if (statusFilter !== "all") {
      filters.push({
        id: "status",
        field: "status",
        operator: "is",
        values: [statusFilter],
      });
    }

    return filters;
  }, [search, statusFilter, typeFilter]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch =
        get(find(nextFilters, (item) => item.field === "q"), "values[0]", "");
      const nextType =
        get(find(nextFilters, (item) => item.field === "type"), "values[0]", "all");
      const nextStatus =
        get(find(nextFilters, (item) => item.field === "status"), "values[0]", "all");

      React.startTransition(() => {
        void setSearch(nextSearch);
        void setTypeFilter(nextType);
        void setStatusFilter(nextStatus);
      });
    },
    [setSearch, setStatusFilter, setTypeFilter],
  );

  return {
    search,
    statusFilter,
    typeFilter,
    filterFields,
    activeFilters,
    handleFiltersChange,
  };
};
