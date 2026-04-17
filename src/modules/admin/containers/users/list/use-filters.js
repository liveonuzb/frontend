import React from "react";
import {
  parseAsJson,
  parseAsString,
  parseAsStringEnum,
  useQueryState,
} from "nuqs";
import { get, isEqual, isEmpty, find } from "lodash";

const DEFAULT_PAGE_SIZE = 10;

export const useUserFilters = () => {
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
  const [roleFilter, setRoleFilter] = useQueryState(
    "role",
    parseAsStringEnum([
      "all",
      "USER",
      "COACH",
      "SUPER_ADMIN",
    ]).withDefault("all"),
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(["all", "active", "banned", "inactive"]).withDefault(
      "all",
    ),
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
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Ism, email yoki telefon",
      },
      {
        label: "Rol",
        key: "role",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha rollar" },
          { value: "USER", label: "User" },
          { value: "COACH", label: "Coach" },
          { value: "SUPER_ADMIN", label: "Super Admin" },
        ],
      },
      {
        label: "Status",
        key: "status",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha status" },
          { value: "active", label: "Faol" },
          { value: "banned", label: "Bloklangan" },
          { value: "inactive", label: "Nofaol" },
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
    if (!isEqual(roleFilter, "all")) {
      items.push({
        id: "role",
        field: "role",
        operator: "is",
        values: [roleFilter],
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
  }, [roleFilter, search, statusFilter]);

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
        void setRoleFilter(getValue("role", "all"));
        void setStatusFilter(getValue("status", "all"));
        void setPageQuery("1");
      });
    },
    [setRoleFilter, setStatusFilter, setPageQuery, setSearch],
  );

  const currentPage = Math.max(1, Number(pageQuery) || 1);
  const pageSize = Math.max(1, Number(pageSizeQuery) || DEFAULT_PAGE_SIZE);

  return {
    search,
    roleFilter,
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
