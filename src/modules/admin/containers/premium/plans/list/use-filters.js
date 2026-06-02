import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import get from "lodash/get";
import find from "lodash/find";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";

const DEFAULT_PAGE_SIZE = 10;

export const usePlanFilters = () => {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    parseAsStringEnum(["all", "INDIVIDUAL", "FAMILY"]).withDefault("all"),
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(["all", "active", "inactive"]).withDefault("all"),
  );
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
        placeholder: "Plan nomi yoki slug qidirish",
      },
      {
        label: "Turi",
        key: "type",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha turlar" },
          { value: "INDIVIDUAL", label: "Individual" },
          { value: "FAMILY", label: "Oilaviy" },
        ],
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

    if (trim(search)) {
      items.push({
        id: "q",
        field: "q",
        operator: "contains",
        values: [search],
      });
    }

    if (typeFilter !== "all") {
      items.push({
        id: "type",
        field: "type",
        operator: "is",
        values: [typeFilter],
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
  }, [search, typeFilter, statusFilter]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch = get(
        find(nextFilters, (f) => get(f, "field") === "q"),
        "values[0]",
        "",
      );
      const nextType = get(
        find(nextFilters, (f) => get(f, "field") === "type"),
        "values[0]",
        "all",
      );
      const nextStatus = get(
        find(nextFilters, (f) => get(f, "field") === "status"),
        "values[0]",
        "all",
      );

      React.startTransition(() => {
        void setSearch(nextSearch);
        void setTypeFilter(nextType);
        void setStatusFilter(nextStatus);
        void setPageQuery("1");
      });
    },
    [setPageQuery, setSearch, setTypeFilter, setStatusFilter],
  );

  return {
    search,
    typeFilter,
    statusFilter,
    currentPage,
    pageSize,
    setPageQuery,
    setPageSizeQuery,
    filterFields,
    activeFilters,
    handleFiltersChange,
  };
};
