import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import {
  clampAdminPage,
  clampAdminPageSize,
  getAdminFilterReader,
  makeAdminSelectActiveFilter,
  makeAdminTextActiveFilter,
} from "@/modules/admin/components/admin-filter-utils.js";

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
    return [
      makeAdminTextActiveFilter({
        field: "q",
        value: search,
        operator: "contains",
      }),
      makeAdminSelectActiveFilter({
        field: "status",
        value: coachStatusFilter,
        operator: "is",
      }),
    ].filter(Boolean);
  }, [coachStatusFilter, search]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const { getValue } = getAdminFilterReader(nextFilters);

      React.startTransition(() => {
        void setSearch(getValue("q", ""));
        void setCoachStatusFilter(getValue("status", "all"));
        void setPageQuery("1");
      });
    },
    [setCoachStatusFilter, setPageQuery, setSearch],
  );

  const currentPage = clampAdminPage(pageQuery);
  const pageSize = clampAdminPageSize(pageSizeQuery, DEFAULT_PAGE_SIZE);

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
