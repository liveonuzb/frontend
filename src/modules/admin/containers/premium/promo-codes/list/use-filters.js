import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { get, find } from "lodash";

export const usePromoCodeFilters = () => {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(["all", "active", "inactive"]).withDefault("all"),
  );

  const filterFields = React.useMemo(
    () => [
      {
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Promo kod qidirish",
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

    return items;
  }, [search, statusFilter]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch = get(
        find(nextFilters, (f) => get(f, "field") === "q"),
        "values[0]",
        "",
      );
      const nextStatus = get(
        find(nextFilters, (f) => get(f, "field") === "status"),
        "values[0]",
        "all",
      );

      React.startTransition(() => {
        void setSearch(nextSearch);
        void setStatusFilter(nextStatus);
      });
    },
    [setSearch, setStatusFilter],
  );

  return {
    search,
    statusFilter,
    filterFields,
    activeFilters,
    handleFiltersChange,
  };
};
