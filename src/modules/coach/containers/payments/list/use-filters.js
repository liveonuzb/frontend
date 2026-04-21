import React from "react";
import { find, get, times, trim } from "lodash";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";

const ITEMS_PER_PAGE = 10;

const PAYMENT_SORT_FIELDS = ["paidAt", "amount", "createdAt", "status"];
const PAYMENT_SORT_DIRECTIONS = ["asc", "desc"];
const PAYMENT_LIFECYCLE_VALUES = ["active", "trash", "all"];

const DEFAULT_MONTH = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

export const usePaymentFilters = () => {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [lifecycle, setLifecycle] = useQueryState(
    "lifecycle",
    parseAsStringEnum(PAYMENT_LIFECYCLE_VALUES).withDefault("active"),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringEnum(PAYMENT_SORT_FIELDS).withDefault("paidAt"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(PAYMENT_SORT_DIRECTIONS).withDefault("desc"),
  );
  const [pageQuery, setPageQuery] = useQueryState(
    "page",
    parseAsString.withDefault("1"),
  );
  const [selectedMonth, setSelectedMonth] = useQueryState(
    "month",
    parseAsString.withDefault(DEFAULT_MONTH),
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault("all"),
  );
  const [methodFilter, setMethodFilter] = useQueryState(
    "method",
    parseAsString.withDefault(""),
  );
  const [clientIdFilter, setClientIdFilter] = useQueryState(
    "clientId",
    parseAsString.withDefault(""),
  );

  const currentPage = Math.max(1, Number(pageQuery) || 1);
  const pageSize = ITEMS_PER_PAGE;

  const sorting = React.useMemo(
    () => [{ id: sortBy, desc: sortDir === "desc" }],
    [sortBy, sortDir],
  );

  const filterFields = React.useMemo(
    () => [
      {
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Mijoz nomi yoki izoh...",
      },
      {
        label: "Oy",
        key: "month",
        type: "select",
        options: times(12, (i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const label = new Intl.DateTimeFormat("uz-UZ", {
            month: "long",
            year: "numeric",
          }).format(d);
          return { value: val, label };
        }),
      },
      {
        label: "Status",
        key: "status",
        type: "select",
        options: [
          { value: "all", label: "Barchasi" },
          { value: "completed", label: "Muvaffaqiyatli" },
          { value: "refunded", label: "Qaytarilgan" },
          { value: "cancelled", label: "Bekor qilingan" },
        ],
      },
      {
        label: "Usul",
        key: "method",
        type: "select",
        options: [
          { value: "", label: "Barchasi" },
          { value: "CASH", label: "Naqd" },
          { value: "CLICK", label: "Click" },
          { value: "PAYME", label: "Payme" },
          { value: "TRANSFER", label: "O'tkazma" },
          { value: "OTHER", label: "Boshqa" },
        ],
      },
    ],
    [],
  );

  const activeFilters = React.useMemo(() => {
    const items = [];

    if (trim(search)) {
      items.push({ id: "q", field: "q", operator: "contains", values: [search] });
    }
    if (selectedMonth) {
      items.push({ id: "month", field: "month", operator: "is", values: [selectedMonth] });
    }
    if (statusFilter && statusFilter !== "all") {
      items.push({ id: "status", field: "status", operator: "is", values: [statusFilter] });
    }
    if (methodFilter) {
      items.push({ id: "method", field: "method", operator: "is", values: [methodFilter] });
    }

    return items;
  }, [search, selectedMonth, statusFilter, methodFilter]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch = get(find(nextFilters, (f) => f.field === "q"), "values[0]", "");
      const nextMonth = get(find(nextFilters, (f) => f.field === "month"), "values[0]", "");
      const nextStatus = get(find(nextFilters, (f) => f.field === "status"), "values[0]", "all");
      const nextMethod = get(find(nextFilters, (f) => f.field === "method"), "values[0]", "");

      React.startTransition(() => {
        void setSearch(nextSearch);
        void setPageQuery("1");
        if (nextMonth) void setSelectedMonth(nextMonth);
        void setStatusFilter(nextStatus);
        void setMethodFilter(nextMethod);
      });
    },
    [setSearch, setPageQuery, setSelectedMonth, setStatusFilter, setMethodFilter],
  );

  const handleSortingChange = React.useCallback(
    (updater) => {
      const nextSorting = typeof updater === "function" ? updater(sorting) : updater;
      const nextSort = nextSorting?.[0];

      React.startTransition(() => {
        void setPageQuery("1");

        if (!nextSort) {
          void setSortBy("paidAt");
          void setSortDir("desc");
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
    selectedMonth,
    lifecycle,
    setLifecycle,
    status: statusFilter,
    method: methodFilter,
    clientId: clientIdFilter,
    sortBy,
    sortDir,
    currentPage,
    pageSize,
    setPageQuery,
    sorting,
    canReorder: false,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  };
};
