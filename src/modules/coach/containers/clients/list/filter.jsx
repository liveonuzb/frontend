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

export const useClientFilters = () => {
  const { t } = useTranslation();

  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(STATUS_VALUES).withDefault("all"),
  );
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
    ],
    [t],
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
    return items;
  }, [search, statusFilter]);

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
        void setPageQuery("1");
      });
    },
    [setSearch, setStatusFilter, setPageQuery],
  );

  const currentPage = Math.max(1, Number(pageQuery) || 1);
  const pageSize = Math.max(1, Number(pageSizeQuery) || DEFAULT_PAGE_SIZE);

  return {
    search,
    statusFilter,
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
