import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import get from "lodash/get";
import find from "lodash/find";
import map from "lodash/map";
import keys from "lodash/keys";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import {
  AUDIT_LOG_SORT_FIELDS,
  AUDIT_LOG_SORT_DIRECTIONS,
  auditActionLabels,
  auditEntityLabels,
} from "./config.js";

const ITEMS_PER_PAGE = 10;

export const useAuditLogFilters = ({ actions = [], entityTypes = [] }) => {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [actionFilter, setActionFilter] = useQueryState(
    "action",
    parseAsString.withDefault("all"),
  );
  const [entityFilter, setEntityFilter] = useQueryState(
    "entityType",
    parseAsString.withDefault("all"),
  );
  const [adminId, setAdminId] = useQueryState(
    "adminId",
    parseAsString.withDefault(""),
  );
  const [entityId, setEntityId] = useQueryState(
    "entityId",
    parseAsString.withDefault(""),
  );
  const [dateFrom, setDateFrom] = useQueryState(
    "dateFrom",
    parseAsString.withDefault(""),
  );
  const [dateTo, setDateTo] = useQueryState(
    "dateTo",
    parseAsString.withDefault(""),
  );
  const [pageQuery, setPageQuery] = useQueryState(
    "page",
    parseAsString.withDefault("1"),
  );
  const [pageSizeQuery, setPageSizeQuery] = useQueryState(
    "pageSize",
    parseAsString.withDefault(String(ITEMS_PER_PAGE)),
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
  const currentPage = Math.max(1, toNumber(pageQuery) || 1);
  const pageSize = Math.max(1, toNumber(pageSizeQuery) || ITEMS_PER_PAGE);

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
            actions.length ? actions : keys(auditActionLabels),
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
            entityTypes.length ? entityTypes : keys(auditEntityLabels),
            (value) => ({
              value,
              label: get(auditEntityLabels, value, value),
            }),
          ),
        ],
      },
      {
        label: "Admin ID",
        key: "adminId",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Admin ID",
      },
      {
        label: "Entity ID",
        key: "entityId",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Entity ID",
      },
      {
        label: "Boshlanish sanasi",
        key: "dateFrom",
        type: "text",
        defaultOperator: "is",
        placeholder: "YYYY-MM-DD",
        pattern: "^\\d{4}-\\d{2}-\\d{2}$",
      },
      {
        label: "Tugash sanasi",
        key: "dateTo",
        type: "text",
        defaultOperator: "is",
        placeholder: "YYYY-MM-DD",
        pattern: "^\\d{4}-\\d{2}-\\d{2}$",
      },
    ],
    [actions, entityTypes],
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

    if (trim(adminId)) {
      items.push({
        id: "adminId",
        field: "adminId",
        operator: "contains",
        values: [adminId],
      });
    }

    if (trim(entityId)) {
      items.push({
        id: "entityId",
        field: "entityId",
        operator: "contains",
        values: [entityId],
      });
    }

    if (trim(dateFrom)) {
      items.push({
        id: "dateFrom",
        field: "dateFrom",
        operator: "is",
        values: [dateFrom],
      });
    }

    if (trim(dateTo)) {
      items.push({
        id: "dateTo",
        field: "dateTo",
        operator: "is",
        values: [dateTo],
      });
    }

    return items;
  }, [actionFilter, adminId, dateFrom, dateTo, entityFilter, entityId, search]);

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
      const nextAdminId = get(
        find(nextFilters, (f) => get(f, "field") === "adminId"),
        "values[0]",
        "",
      );
      const nextEntityId = get(
        find(nextFilters, (f) => get(f, "field") === "entityId"),
        "values[0]",
        "",
      );
      const nextDateFrom = get(
        find(nextFilters, (f) => get(f, "field") === "dateFrom"),
        "values[0]",
        "",
      );
      const nextDateTo = get(
        find(nextFilters, (f) => get(f, "field") === "dateTo"),
        "values[0]",
        "",
      );

      React.startTransition(() => {
        void setSearch(nextSearch);
        void setActionFilter(nextAction);
        void setEntityFilter(nextEntity);
        void setAdminId(nextAdminId);
        void setEntityId(nextEntityId);
        void setDateFrom(nextDateFrom);
        void setDateTo(nextDateTo);
        void setPageQuery("1");
      });
    },
    [
      setActionFilter,
      setAdminId,
      setDateFrom,
      setDateTo,
      setEntityFilter,
      setEntityId,
      setPageQuery,
      setSearch,
    ],
  );

  return {
    search,
    deferredSearch,
    actionFilter,
    entityFilter,
    adminId,
    entityId,
    dateFrom,
    dateTo,
    pageQuery,
    setPageQuery,
    pageSizeQuery,
    setPageSizeQuery,
    currentPage,
    pageSize,
    sortBy,
    sortDir,
    sorting,
    handleSortingChange,
    filterFields,
    activeFilters,
    handleFiltersChange,
  };
};
