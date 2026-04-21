import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";

const ITEMS_PER_PAGE = 10;

const ENTITY_TYPE_VALUES = [
  "all",
  "CLIENT",
  "PAYMENT",
  "MEAL_PLAN",
  "WORKOUT_PLAN",
  "PROGRAM",
  "CHALLENGE",
  "GROUP",
  "SNIPPET",
];

const ACTION_VALUES = [
  "all",
  "CREATE",
  "UPDATE",
  "DELETE",
  "RESTORE",
  "HARD_DELETE",
  "REORDER",
  "BULK_TRASH",
  "BULK_RESTORE",
];

const SORT_DIRECTIONS = ["asc", "desc"];

export const useAuditFilters = () => {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [entityType, setEntityType] = useQueryState(
    "entityType",
    parseAsStringEnum(ENTITY_TYPE_VALUES).withDefault("all"),
  );
  const [action, setAction] = useQueryState(
    "action",
    parseAsStringEnum(ACTION_VALUES).withDefault("all"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(SORT_DIRECTIONS).withDefault("desc"),
  );
  const [pageQuery, setPageQuery] = useQueryState("page", parseAsString.withDefault("1"));

  const currentPage = Math.max(1, Number(pageQuery) || 1);
  const pageSize = ITEMS_PER_PAGE;
  const sortBy = "createdAt";

  const sorting = React.useMemo(
    () => [{ id: sortBy, desc: sortDir === "desc" }],
    [sortDir],
  );

  const filterFields = React.useMemo(
    () => [
      {
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Log qidirish",
      },
      {
        label: "Ob'ekt turi",
        key: "entityType",
        type: "select",
        defaultOperator: "eq",
        options: [
          { label: "Barchasi", value: "all" },
          { label: "Mijoz", value: "CLIENT" },
          { label: "To'lov", value: "PAYMENT" },
          { label: "Ovqatlanish rejasi", value: "MEAL_PLAN" },
          { label: "Mashq rejasi", value: "WORKOUT_PLAN" },
          { label: "Dastur", value: "PROGRAM" },
          { label: "Challenge", value: "CHALLENGE" },
          { label: "Guruh", value: "GROUP" },
          { label: "Snippet", value: "SNIPPET" },
        ],
      },
      {
        label: "Harakat",
        key: "action",
        type: "select",
        defaultOperator: "eq",
        options: [
          { label: "Barchasi", value: "all" },
          { label: "Yaratish", value: "CREATE" },
          { label: "Yangilash", value: "UPDATE" },
          { label: "O'chirish", value: "DELETE" },
          { label: "Tiklash", value: "RESTORE" },
          { label: "Butunlay o'chirish", value: "HARD_DELETE" },
          { label: "Tartiblashtirish", value: "REORDER" },
          { label: "Ommaviy trashga yuborish", value: "BULK_TRASH" },
          { label: "Ommaviy tiklash", value: "BULK_RESTORE" },
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
    if (entityType !== "all") {
      items.push({ id: "entityType", field: "entityType", operator: "eq", values: [entityType] });
    }
    if (action !== "all") {
      items.push({ id: "action", field: "action", operator: "eq", values: [action] });
    }
    return items;
  }, [search, entityType, action]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch = nextFilters.find((f) => f.field === "q")?.values?.[0] ?? "";
      const nextEntityType = nextFilters.find((f) => f.field === "entityType")?.values?.[0] ?? "all";
      const nextAction = nextFilters.find((f) => f.field === "action")?.values?.[0] ?? "all";
      React.startTransition(() => {
        void setSearch(nextSearch);
        void setEntityType(nextEntityType);
        void setAction(nextAction);
        void setPageQuery("1");
      });
    },
    [setSearch, setEntityType, setAction, setPageQuery],
  );

  const handleSortingChange = React.useCallback(
    (updater) => {
      const nextSorting = typeof updater === "function" ? updater(sorting) : updater;
      const nextSort = nextSorting?.[0];
      React.startTransition(() => {
        void setPageQuery("1");
        void setSortDir(nextSort?.desc ? "desc" : "asc");
      });
    },
    [setPageQuery, setSortDir, sorting],
  );

  return {
    search,
    entityType,
    action,
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
