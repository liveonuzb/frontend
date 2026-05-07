/* eslint-disable react-refresh/only-export-components */
import {
  find,
  get,
  isEmpty,
  isEqual,
  trim,
} from "lodash";
import React from "react";
import { parseAsJson, parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { useTranslation } from "react-i18next";
import { Filters } from "@/components/reui/filters.jsx";

const STATUS_VALUES = ["all", "active", "paused", "inactive", "pending", "declined"];
const DEFAULT_PAGE_SIZE = 10;

export const useClientFilters = (tagOptions = []) => {
  const { t } = useTranslation();

  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(STATUS_VALUES).withDefault("all"),
  );
  const [tagId, setTagId] = useQueryState("tagId", parseAsString.withDefault(""));
  const [pageQuery, setPageQuery] = useQueryState(
    "page",
    parseAsString.withDefault("1"),
  );
  const [pageSizeQuery, setPageSizeQuery] = useQueryState(
    "pageSize",
    parseAsString.withDefault(String(DEFAULT_PAGE_SIZE)),
  );
  const [sorting, setSorting] = useQueryState(
    "sort",
    parseAsJson().withDefault([]),
  );

  const filterFields = React.useMemo(
    () => [
      {
        label: t("coach.clients.filters.search.label"),
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: t("coach.clients.filters.search.placeholder"),
      },
      {
        label: t("coach.clients.filters.status.label"),
        key: "status",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: t("coach.clients.filters.status.all") },
          { value: "active", label: t("coach.clients.filters.status.active") },
          { value: "paused", label: t("coach.clients.filters.status.paused") },
          { value: "inactive", label: t("coach.clients.filters.status.inactive") },
          { value: "pending", label: t("common.status.pending") },
          { value: "declined", label: t("common.status.declined") },
        ],
      },
      ...(tagOptions.length
        ? [
            {
              label: "Teg",
              key: "tagId",
              type: "select",
              defaultOperator: "is",
              options: [
                { value: "", label: "Barcha teglar" },
                ...tagOptions.map((tag) => ({
                  value: tag.id || tag.slug,
                  label: tag.label,
                })),
              ],
            },
          ]
        : []),
    ],
    [t, tagOptions],
  );

  const activeFilters = React.useMemo(() => {
    const items = [];
    if (!isEmpty(trim(String(search)))) {
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
    if (!isEmpty(trim(String(tagId)))) {
      items.push({
        id: "tagId",
        field: "tagId",
        operator: "is",
        values: [tagId],
      });
    }
    return items;
  }, [search, statusFilter, tagId]);

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
        void setTagId(getValue("tagId", ""));
        void setPageQuery("1");
      });
    },
    [setSearch, setStatusFilter, setTagId, setPageQuery],
  );

  const currentPage = Math.max(1, Number(pageQuery) || 1);
  const pageSize = Math.max(1, Number(pageSizeQuery) || DEFAULT_PAGE_SIZE);

  return {
    search,
    statusFilter,
    tagId,
    pageQuery,
    setPageQuery,
    pageSizeQuery,
    setPageSizeQuery,
    currentPage,
    pageSize,
    filterFields,
    activeFilters,
    handleFiltersChange,
    sorting,
    setSorting,
  };
};

export const Filter = ({
  filterFields,
  activeFilters,
  handleFiltersChange,
}) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <Filters
        fields={filterFields}
        filters={activeFilters}
        onChange={handleFiltersChange}
        allowMultiple={false}
      />
    </div>
  );
};
