import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";

const ITEMS_PER_PAGE = 10;

const REFERRAL_STATUS_VALUES = ["all", "active", "cancelled"];
const REFERRAL_EVENT_VALUES = ["all", "CLICK", "SIGNUP", "PAID_CONVERSION"];
const REFERRAL_SORT_FIELDS = ["createdAt", "event", "status"];
const REFERRAL_SORT_DIRECTIONS = ["asc", "desc"];

export const useReferralFilters = () => {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [status, setStatus] = useQueryState(
    "status",
    parseAsStringEnum(REFERRAL_STATUS_VALUES).withDefault("all"),
  );
  const [event, setEvent] = useQueryState(
    "event",
    parseAsStringEnum(REFERRAL_EVENT_VALUES).withDefault("all"),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringEnum(REFERRAL_SORT_FIELDS).withDefault("createdAt"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(REFERRAL_SORT_DIRECTIONS).withDefault("desc"),
  );
  const [pageQuery, setPageQuery] = useQueryState(
    "page",
    parseAsString.withDefault("1"),
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
        placeholder: "Taklif qidirish",
      },
      {
        label: "Holat",
        key: "status",
        type: "select",
        defaultOperator: "eq",
        options: [
          { label: "Barchasi", value: "all" },
          { label: "Faol", value: "active" },
          { label: "Bekor qilingan", value: "cancelled" },
        ],
      },
      {
        label: "Hodisa",
        key: "event",
        type: "select",
        defaultOperator: "eq",
        options: [
          { label: "Barchasi", value: "all" },
          { label: "Klik", value: "CLICK" },
          { label: "Ro'yxatdan o'tish", value: "SIGNUP" },
          { label: "To'lov konversiyasi", value: "PAID_CONVERSION" },
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
    if (status !== "all") {
      items.push({
        id: "status",
        field: "status",
        operator: "eq",
        values: [status],
      });
    }
    if (event !== "all") {
      items.push({
        id: "event",
        field: "event",
        operator: "eq",
        values: [event],
      });
    }
    return items;
  }, [event, search, status]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch =
        nextFilters.find((f) => f.field === "q")?.values?.[0] ?? "";
      const nextStatus =
        nextFilters.find((f) => f.field === "status")?.values?.[0] ?? "all";
      const nextEvent =
        nextFilters.find((f) => f.field === "event")?.values?.[0] ?? "all";
      React.startTransition(() => {
        void setSearch(nextSearch);
        void setStatus(nextStatus);
        void setEvent(nextEvent);
        void setPageQuery("1");
      });
    },
    [setEvent, setSearch, setStatus, setPageQuery],
  );

  const handleSortingChange = React.useCallback(
    (updater) => {
      const nextSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      const nextSort = nextSorting?.[0];
      React.startTransition(() => {
        void setPageQuery("1");
        if (!nextSort) {
          void setSortBy("createdAt");
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
    status,
    event,
    sortBy,
    sortDir,
    pageQuery,
    setPageQuery,
    currentPage,
    pageSize,
    sorting,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  };
};
