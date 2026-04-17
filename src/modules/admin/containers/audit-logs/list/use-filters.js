import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { get, find, map } from "lodash";
import {
  AUDIT_LOG_SORT_FIELDS,
  AUDIT_LOG_SORT_DIRECTIONS,
  auditActionLabels,
  auditEntityLabels,
} from "./config.js";

export const useAuditLogFilters = ({ actions = [], entityTypes = [] }) => {
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
  const [actionFilter, setActionFilter] = useQueryState(
    "action",
    parseAsString.withDefault("all"),
  );
  const [entityFilter, setEntityFilter] = useQueryState(
    "entityType",
    parseAsString.withDefault("all"),
  );
  const [pageQuery, setPageQuery] = useQueryState(
    "page",
    parseAsString.withDefault("1"),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringEnum(AUDIT_LOG_SORT_FIELDS).withDefault("createdAt"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(AUDIT_LOG_SORT_DIRECTIONS).withDefault("desc"),
  );

  const deferredSearch = React.useDeferredValue(search);
  const currentPage = Math.max(1, Number(pageQuery) || 1);

  const sorting = React.useMemo(
    () => [{ id: sortBy, desc: sortDir === "desc" }],
    [sortBy, sortDir],
  );

  const handleSortingChange = React.useCallback(
    (updater) => {
      const nextSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      const nextSort = get(nextSorting, "[0]");

      React.startTransition(() => {
        void setPageQuery("1");

        if (!nextSort) {
          void setSortBy("createdAt");
          void setSortDir("desc");
          return;
        }

        void setSortBy(get(nextSort, "id"));
        void setSortDir(get(nextSort, "desc") ? "desc" : "asc");
      });
    },
    [setPageQuery, setSortBy, setSortDir, sorting],
  );

  const filterFields = React.useMemo(
    () => [
      {
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Admin, entity yoki izoh bo'yicha qidirish",
      },
      {
        label: "Action",
        key: "action",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha actionlar" },
          ...map(
            actions.length ? actions : Object.keys(auditActionLabels),
            (value) => ({
              value,
              label: get(auditActionLabels, value, value),
            }),
          ),
        ],
      },
      {
        label: "Entity",
        key: "entityType",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha entitylar" },
          ...map(
            entityTypes.length ? entityTypes : Object.keys(auditEntityLabels),
            (value) => ({
              value,
              label: get(auditEntityLabels, value, value),
            }),
          ),
        ],
      },
    ],
    [actions, entityTypes],
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

    if (actionFilter !== "all") {
      items.push({
        id: "action",
        field: "action",
        operator: "is",
        values: [actionFilter],
      });
    }

    if (entityFilter !== "all") {
      items.push({
        id: "entityType",
        field: "entityType",
        operator: "is",
        values: [entityFilter],
      });
    }

    return items;
  }, [actionFilter, entityFilter, search]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch = get(
        find(nextFilters, (f) => get(f, "field") === "q"),
        "values[0]",
        "",
      );
      const nextAction = get(
        find(nextFilters, (f) => get(f, "field") === "action"),
        "values[0]",
        "all",
      );
      const nextEntity = get(
        find(nextFilters, (f) => get(f, "field") === "entityType"),
        "values[0]",
        "all",
      );

      React.startTransition(() => {
        void setSearch(nextSearch);
        void setActionFilter(nextAction);
        void setEntityFilter(nextEntity);
        void setPageQuery("1");
      });
    },
    [setActionFilter, setEntityFilter, setPageQuery, setSearch],
  );

  return {
    search,
    deferredSearch,
    actionFilter,
    entityFilter,
    pageQuery,
    setPageQuery,
    currentPage,
    sortBy,
    sortDir,
    sorting,
    handleSortingChange,
    filterFields,
    activeFilters,
    handleFiltersChange,
  };
};
