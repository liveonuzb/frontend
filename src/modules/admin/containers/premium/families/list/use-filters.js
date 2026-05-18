import React from "react";
import { parseAsString, useQueryState } from "nuqs";
import { get, find, toNumber, trim } from "lodash";

const DEFAULT_PAGE_SIZE = 10;

export const useFamilyFilters = () => {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [pageQuery, setPageQuery] = useQueryState(
    "page",
    parseAsString.withDefault("1"),
  );
  const [pageSizeQuery, setPageSizeQuery] = useQueryState(
    "pageSize",
    parseAsString.withDefault(String(DEFAULT_PAGE_SIZE)),
  );
  const currentPage = Math.max(1, toNumber(pageQuery) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, toNumber(pageSizeQuery) || DEFAULT_PAGE_SIZE),
  );

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

    if (trim(search)) {
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
        void setPageQuery("1");
      });
    },
    [setPageQuery, setSearch],
  );

  return {
    search,
    currentPage,
    pageSize,
    setPageQuery,
    setPageSizeQuery,
    filterFields,
    activeFilters,
    handleFiltersChange,
  };
};
