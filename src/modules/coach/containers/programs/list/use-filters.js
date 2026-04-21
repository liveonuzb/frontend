import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";

const ITEMS_PER_PAGE = 10;

const PROGRAM_SORT_FIELDS = ["title", "createdAt", "updatedAt", "orderKey"];
const PROGRAM_SORT_DIRECTIONS = ["asc", "desc"];
const PROGRAM_LIFECYCLE_VALUES = ["active", "trash", "all"];
const PROGRAM_STATUS_VALUES = ["all", "DRAFT", "ACTIVE", "ARCHIVED"];

export const useProgramFilters = () => {
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
  const [lifecycle, setLifecycle] = useQueryState(
    "lifecycle",
    parseAsStringEnum(PROGRAM_LIFECYCLE_VALUES).withDefault("active"),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringEnum(PROGRAM_SORT_FIELDS).withDefault("orderKey"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(PROGRAM_SORT_DIRECTIONS).withDefault("asc"),
  );
  const [pageQuery, setPageQuery] = useQueryState(
    "page",
    parseAsString.withDefault("1"),
  );
  const [status, setStatus] = useQueryState(
    "status",
    parseAsStringEnum(PROGRAM_STATUS_VALUES).withDefault("all"),
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
        placeholder: "Dastur qidirish",
      },
      {
        label: "Holat",
        key: "status",
        type: "select",
        defaultOperator: "eq",
        options: [
          { label: "Barchasi", value: "all" },
          { label: "Qoralama", value: "DRAFT" },
          { label: "Faol", value: "ACTIVE" },
          { label: "Arxivlangan", value: "ARCHIVED" },
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

    if (status && status !== "all") {
      items.push({
        id: "status",
        field: "status",
        operator: "eq",
        values: [status],
      });
    }

    return items;
  }, [search, status]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch =
        nextFilters.find((f) => f.field === "q")?.values?.[0] ?? "";
      const nextStatus =
        nextFilters.find((f) => f.field === "status")?.values?.[0] ?? "all";
      React.startTransition(() => {
        void setSearch(nextSearch);
        void setStatus(nextStatus);
        void setPageQuery("1");
      });
    },
    [setSearch, setStatus, setPageQuery],
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
