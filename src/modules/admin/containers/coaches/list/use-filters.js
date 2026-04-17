import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { get, find, isEmpty, isEqual } from "lodash";

const DEFAULT_PAGE_SIZE = 10;

export const useCoachFilters = () => {
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
  const [coachStatusFilter, setCoachStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(["all", "pending", "approved", "rejected"]).withDefault(
      "all",
    ),
  );
  const [pageQuery, setPageQuery] = useQueryState(
    "page",
    parseAsString.withDefault("1"),
  );
  const [pageSizeQuery, setPageSizeQuery] = useQueryState(
    "pageSize",
    parseAsString.withDefault(String(DEFAULT_PAGE_SIZE)),
  );

  const filterFields = React.useMemo(
    () => [
      {
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Ism yoki email...",
      },
      {
        label: "Holat",
        key: "status",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha holatlar" },
          { value: "pending", label: "Kutilmoqda" },
          { value: "approved", label: "Tasdiqlangan" },
          { value: "rejected", label: "Rad etilgan" },
        ],
      },
    ],
    [],
  );

  const activeFilters = React.useMemo(() => {
    const items = [];
    if (!isEmpty(String(search).trim())) {
      items.push({
        id: "q",
        field: "q",
        operator: "contains",
        values: [search],
      });
    }
    if (!isEqual(coachStatusFilter, "all")) {
      items.push({
        id: "status",
        field: "status",
        operator: "is",
        values: [coachStatusFilter],
      });
    }
    return items;
  }, [coachStatusFilter, search]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const getValue = (field, fallback = "") =>
        get(
          find(nextFilters, (item) => isEqual(get(item, "field"), field)),
          "values[0]",
          fallback,
        );

      React.startTransition(() => {
        void setSearch(getValue("q", ""));
        void setCoachStatusFilter(getValue("status", "all"));
        void setPageQuery("1");
      });
    },
    [setCoachStatusFilter, setPageQuery, setSearch],
  );

  const currentPage = Math.max(1, Number(pageQuery) || 1);
  const pageSize = Math.max(1, Number(pageSizeQuery) || DEFAULT_PAGE_SIZE);

  return {
    search,
    coachStatusFilter,
    pageQuery,
    setPageQuery,
    pageSizeQuery,
    setPageSizeQuery,
    currentPage,
    pageSize,
    filterFields,
    activeFilters,
    handleFiltersChange,
  };
};
