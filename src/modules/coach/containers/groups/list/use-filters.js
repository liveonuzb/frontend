import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";

const ITEMS_PER_PAGE = 10;

const GROUP_SORT_FIELDS = ["name", "createdAt", "updatedAt", "orderKey"];
const GROUP_SORT_DIRECTIONS = ["asc", "desc"];
const GROUP_LIFECYCLE_VALUES = ["active", "trash", "all"];

export const useGroupFilters = () => {
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
  const [lifecycle, setLifecycle] = useQueryState(
    "lifecycle",
    parseAsStringEnum(GROUP_LIFECYCLE_VALUES).withDefault("active"),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringEnum(GROUP_SORT_FIELDS).withDefault("orderKey"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(GROUP_SORT_DIRECTIONS).withDefault("asc"),
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
    search.trim() === "" &&
    lifecycle === "active" &&
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
        placeholder: "Guruh qidirish",
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
      const nextSearch =
        nextFilters.find((f) => f.field === "q")?.values?.[0] ?? "";
      React.startTransition(() => {
        void setSearch(nextSearch);
        void setPageQuery("1");
      });
    },
    [setSearch, setPageQuery],
  );

  const handleSortingChange = React.useCallback(
    (updater) => {
      const nextSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      const nextSort = nextSorting?.[0];

      React.startTransition(() => {
        void setPageQuery("1");

        if (!nextSort) {
          void setSortBy("orderKey");
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
    lifecycle,
    setLifecycle,
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
