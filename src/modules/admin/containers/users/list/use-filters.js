import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import {
  ADMIN_SELECT_OPERATORS,
  ADMIN_SORT_DIRECTIONS,
  ADMIN_TEXT_OPERATORS,
  buildAdminSortingState,
  clampAdminPage,
  clampAdminPageSize,
  getAdminFilterReader,
  makeAdminSelectActiveFilter,
  makeAdminTextActiveFilter,
} from "@/modules/admin/components/admin-filter-utils.js";

import filter from "lodash/filter";
import trim from "lodash/trim";

const DEFAULT_PAGE_SIZE = 10;

const ROLE_OPTIONS = [
  { value: "all", label: "Barcha rollar" },
  { value: "USER", label: "User" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "CONTENT_MANAGER", label: "Content manager" },
  { value: "SUPPORT", label: "Support" },
  { value: "FINANCE", label: "Finance" },
  { value: "GROWTH", label: "Growth" },
  { value: "READONLY_ADMIN", label: "Readonly admin" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Barcha status" },
  { value: "active", label: "Faol" },
  { value: "banned", label: "Bloklangan" },
  { value: "inactive", label: "Nofaol" },
];

const PREMIUM_OPTIONS = [
  { value: "all", label: "Barcha premium" },
  { value: "free", label: "Tekin" },
  { value: "active", label: "Faol premium" },
  { value: "expired", label: "Muddati o'tgan" },
  { value: "cancelled", label: "Bekor qilingan" },
];

export const useUserFilters = () => {
  const [nameFilter, setNameFilter] = useQueryState(
    "name",
    parseAsString.withDefault(""),
  );
  const [nameOperator, setNameOperator] = useQueryState(
    "nameOp",
    parseAsStringEnum(ADMIN_TEXT_OPERATORS).withDefault("contains"),
  );
  const [isNameFilterVisible, setIsNameFilterVisible] = React.useState(
    () => trim(nameFilter) !== "",
  );

  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
  const [isSearchVisible, setIsSearchVisible] = React.useState(
    () => trim(search) !== "",
  );

  const [roleFilter, setRoleFilter] = useQueryState(
    "role",
    parseAsStringEnum([
      "all",
      "USER",
      "SUPER_ADMIN",
      "CONTENT_MANAGER",
      "SUPPORT",
      "FINANCE",
      "GROWTH",
      "READONLY_ADMIN",
    ]).withDefault("all"),
  );
  const [roleOperator, setRoleOperator] = useQueryState(
    "roleOp",
    parseAsStringEnum(ADMIN_SELECT_OPERATORS).withDefault("is"),
  );

  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(["all", "active", "banned", "inactive"]).withDefault(
      "all",
    ),
  );
  const [statusOperator, setStatusOperator] = useQueryState(
    "statusOp",
    parseAsStringEnum(ADMIN_SELECT_OPERATORS).withDefault("is"),
  );

  const [premiumFilter, setPremiumFilter] = useQueryState(
    "premium",
    parseAsStringEnum([
      "all",
      "free",
      "active",
      "expired",
      "cancelled",
    ]).withDefault("all"),
  );
  const [premiumOperator, setPremiumOperator] = useQueryState(
    "premiumOp",
    parseAsStringEnum(ADMIN_SELECT_OPERATORS).withDefault("is"),
  );

  const [visibleFilters, setVisibleFilters] = React.useState(() => ({
    role: roleFilter !== "all",
    status: statusFilter !== "all",
    premium: premiumFilter !== "all",
  }));

  const [pageQuery, setPageQuery] = useQueryState(
    "page",
    parseAsString.withDefault("1"),
  );
  const [pageSizeQuery, setPageSizeQuery] = useQueryState(
    "pageSize",
    parseAsString.withDefault(String(DEFAULT_PAGE_SIZE)),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringEnum([
      "createdAt",
      "updatedAt",
      "firstName",
      "status",
      "email",
    ]).withDefault("createdAt"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(ADMIN_SORT_DIRECTIONS).withDefault("desc"),
  );

  const currentPage = clampAdminPage(pageQuery);
  const pageSize = clampAdminPageSize(pageSizeQuery, DEFAULT_PAGE_SIZE);
  const sorting = React.useMemo(
    () =>
      buildAdminSortingState({
        sortBy,
        sortDir,
        defaultSortBy: "createdAt",
        defaultSortDir: "desc",
      }),
    [sortBy, sortDir],
  );

  const filterFields = React.useMemo(
    () => [
      {
        label: "Nomi",
        key: "name",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Ism yoki familiya...",
      },
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
        options: ROLE_OPTIONS,
      },
      {
        label: "Status",
        key: "status",
        type: "select",
        defaultOperator: "is",
        options: STATUS_OPTIONS,
      },
      {
        label: "Premium",
        key: "premium",
        type: "select",
        defaultOperator: "is",
        options: PREMIUM_OPTIONS,
      },
    ],
    [],
  );

  const activeFilters = React.useMemo(() => {
    return filter([
      makeAdminTextActiveFilter({
        field: "name",
        value: nameFilter,
        operator: nameOperator,
        visible: isNameFilterVisible,
      }),
      makeAdminTextActiveFilter({
        field: "q",
        value: search,
        operator: "contains",
        visible: isSearchVisible,
      }),
      makeAdminSelectActiveFilter({
        field: "role",
        value: roleFilter,
        operator: roleOperator,
        visible: visibleFilters.role,
      }),
      makeAdminSelectActiveFilter({
        field: "status",
        value: statusFilter,
        operator: statusOperator,
        visible: visibleFilters.status,
      }),
      makeAdminSelectActiveFilter({
        field: "premium",
        value: premiumFilter,
        operator: premiumOperator,
        visible: visibleFilters.premium,
      }),
    ], Boolean);
  }, [
    isNameFilterVisible,
    isSearchVisible,
    nameFilter,
    nameOperator,
    premiumFilter,
    premiumOperator,
    roleFilter,
    roleOperator,
    search,
    statusFilter,
    statusOperator,
    visibleFilters,
  ]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const { getValue, getOperator, isVisible } =
        getAdminFilterReader(nextFilters);

      React.startTransition(() => {
        setIsNameFilterVisible(isVisible("name"));
        setIsSearchVisible(isVisible("q"));
        setVisibleFilters({
          role: isVisible("role"),
          status: isVisible("status"),
          premium: isVisible("premium"),
        });

        void setNameFilter(getValue("name", ""));
        void setNameOperator(getOperator("name", "contains"));
        void setSearch(getValue("q", ""));
        void setRoleFilter(getValue("role", "all"));
        void setRoleOperator(getOperator("role", "is"));
        void setStatusFilter(getValue("status", "all"));
        void setStatusOperator(getOperator("status", "is"));
        void setPremiumFilter(getValue("premium", "all"));
        void setPremiumOperator(getOperator("premium", "is"));
        void setPageQuery("1");
      });
    },
    [
      setNameFilter,
      setNameOperator,
      setPageQuery,
      setPremiumFilter,
      setPremiumOperator,
      setRoleFilter,
      setRoleOperator,
      setSearch,
      setStatusFilter,
      setStatusOperator,
    ],
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
    nameFilter,
    nameOperator,
    search,
    roleFilter,
    roleOperator,
    statusFilter,
    statusOperator,
    premiumFilter,
    premiumOperator,
    sortBy,
    sortDir,
    sorting,
    pageQuery,
    setPageQuery,
    pageSizeQuery,
    setPageSizeQuery,
    currentPage,
    pageSize,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  };
};
