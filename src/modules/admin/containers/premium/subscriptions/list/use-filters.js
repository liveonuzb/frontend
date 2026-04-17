import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { get, find, isEmpty, isEqual } from "lodash";

const DEFAULT_PAGE_SIZE = 10;

export const useSubscriptionFilters = () => {
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(["all", "ACTIVE", "EXPIRED", "CANCELLED"]).withDefault(
      "all",
    ),
  );
  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    parseAsStringEnum(["all", "INDIVIDUAL", "FAMILY"]).withDefault("all"),
  );
  const [autoRenewFilter, setAutoRenewFilter] = useQueryState(
    "autoRenew",
    parseAsStringEnum(["all", "on", "off"]).withDefault("all"),
  );
  const [pageQuery, setPageQuery] = useQueryState(
    "page",
    parseAsString.withDefault("1"),
  );
  const [pageSizeQuery, setPageSizeQuery] = useQueryState(
    "pageSize",
    parseAsString.withDefault(String(DEFAULT_PAGE_SIZE)),
  );

  const currentPage = Math.max(1, Number(pageQuery) || 1);
  const pageSize = Math.max(1, Number(pageSizeQuery) || DEFAULT_PAGE_SIZE);

  const filterFields = React.useMemo(
    () => [
      {
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Ism yoki email qidirish",
      },
      {
        label: "Status",
        key: "status",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha statuslar" },
          { value: "ACTIVE", label: "Faol" },
          { value: "EXPIRED", label: "Tugagan" },
          { value: "CANCELLED", label: "Bekor qilingan" },
        ],
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
        label: "Auto-renew",
        key: "autoRenew",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barchasi" },
          { value: "on", label: "Yoqilgan" },
          { value: "off", label: "O'chirilgan" },
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
    if (!isEqual(statusFilter, "all")) {
      items.push({
        id: "status",
        field: "status",
        operator: "is",
        values: [statusFilter],
      });
    }
    if (!isEqual(typeFilter, "all")) {
      items.push({
        id: "type",
        field: "type",
        operator: "is",
        values: [typeFilter],
      });
    }
    if (!isEqual(autoRenewFilter, "all")) {
      items.push({
        id: "autoRenew",
        field: "autoRenew",
        operator: "is",
        values: [autoRenewFilter],
      });
    }
    return items;
  }, [search, statusFilter, typeFilter, autoRenewFilter]);

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
        void setStatusFilter(getValue("status", "all"));
        void setTypeFilter(getValue("type", "all"));
        void setAutoRenewFilter(getValue("autoRenew", "all"));
        void setPageQuery("1");
      });
    },
    [setPageQuery, setSearch, setStatusFilter, setTypeFilter, setAutoRenewFilter],
  );

  return {
    search,
    statusFilter,
    typeFilter,
    autoRenewFilter,
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
