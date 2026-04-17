import React from "react";
import { parseAsString, useQueryState } from "nuqs";
import { get, find } from "lodash";

export const useFamilyFilters = () => {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));

  const filterFields = React.useMemo(
    () => [
      {
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Ism yoki email qidirish",
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

    return items;
  }, [search]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch = get(
        find(nextFilters, (f) => get(f, "field") === "q"),
        "values[0]",
        "",
      );

      React.startTransition(() => {
        void setSearch(nextSearch);
      });
    },
    [setSearch],
  );

  return {
    search,
    filterFields,
    activeFilters,
    handleFiltersChange,
  };
};
