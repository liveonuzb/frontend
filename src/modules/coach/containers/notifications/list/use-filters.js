import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";

const ITEMS_PER_PAGE = 10;

const NOTIFICATION_TYPE_VALUES = ["all", "PAYMENT_REMINDER", "CHECKIN_DUE", "PROGRESS_UPDATE", "SYSTEM"];
const NOTIFICATION_READ_VALUES = ["all", "unread", "read"];
const NOTIFICATION_LIFECYCLE_VALUES = ["active", "trash", "all"];
const NOTIFICATION_SORT_FIELDS = ["createdAt", "type"];
const NOTIFICATION_SORT_DIRECTIONS = ["asc", "desc"];

export const useNotificationFilters = () => {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [type, setType] = useQueryState(
    "type",
    parseAsStringEnum(NOTIFICATION_TYPE_VALUES).withDefault("all"),
  );
  const [read, setRead] = useQueryState(
    "read",
    parseAsStringEnum(NOTIFICATION_READ_VALUES).withDefault("all"),
  );
  const [lifecycle, setLifecycle] = useQueryState(
    "lifecycle",
    parseAsStringEnum(NOTIFICATION_LIFECYCLE_VALUES).withDefault("active"),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringEnum(NOTIFICATION_SORT_FIELDS).withDefault("createdAt"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(NOTIFICATION_SORT_DIRECTIONS).withDefault("desc"),
  );
  const [pageQuery, setPageQuery] = useQueryState("page", parseAsString.withDefault("1"));

  const currentPage = Math.max(1, Number(pageQuery) || 1);
  const pageSize = ITEMS_PER_PAGE;
  const canReorder = false;

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
        placeholder: "Bildirishnoma qidirish",
      },
      {
        label: "Tur",
        key: "type",
        type: "select",
        defaultOperator: "eq",
        options: [
          { label: "Barchasi", value: "all" },
          { label: "To'lov eslatmasi", value: "PAYMENT_REMINDER" },
          { label: "Tekshiruv kutilmoqda", value: "CHECKIN_DUE" },
          { label: "Taraqqiyot yangilanishi", value: "PROGRESS_UPDATE" },
          { label: "Tizim", value: "SYSTEM" },
        ],
      },
      {
        label: "Holat",
        key: "read",
        type: "select",
        defaultOperator: "eq",
        options: [
          { label: "Barchasi", value: "all" },
          { label: "O'qilmagan", value: "unread" },
          { label: "O'qilgan", value: "read" },
        ],
      },
    ],
    [],
  );

  const activeFilters = React.useMemo(() => {
    const items = [];
    if (search.trim()) {
      items.push({ id: "q", field: "q", operator: "contains", values: [search] });
    }
    if (type !== "all") {
      items.push({ id: "type", field: "type", operator: "eq", values: [type] });
    }
    if (read !== "all") {
      items.push({ id: "read", field: "read", operator: "eq", values: [read] });
    }
    return items;
  }, [search, type, read]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch = nextFilters.find((f) => f.field === "q")?.values?.[0] ?? "";
      const nextType = nextFilters.find((f) => f.field === "type")?.values?.[0] ?? "all";
      const nextRead = nextFilters.find((f) => f.field === "read")?.values?.[0] ?? "all";
      React.startTransition(() => {
        void setSearch(nextSearch);
        void setType(nextType);
        void setRead(nextRead);
        void setPageQuery("1");
      });
    },
    [setSearch, setType, setRead, setPageQuery],
  );

  const handleSortingChange = React.useCallback(
    (updater) => {
      const nextSorting = typeof updater === "function" ? updater(sorting) : updater;
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
    type,
    read,
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
