import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { find, get, isEmpty, isEqual } from "lodash";

const DEFAULT_PAGE_SIZE = 10;
const TEXT_OPERATORS = [
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "is",
  "empty",
  "not_empty",
];
const SELECT_OPERATORS = ["is", "is_not", "empty", "not_empty"];

const ROLE_OPTIONS = [
  { value: "all", label: "Barcha rollar" },
  { value: "USER", label: "User" },
  { value: "COACH", label: "Coach" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
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

const COACH_STATUS_OPTIONS = [
  { value: "all", label: "Barcha coach status" },
  { value: "none", label: "Coach emas" },
  { value: "pending", label: "Kutilmoqda" },
  { value: "approved", label: "Tasdiqlangan" },
  { value: "rejected", label: "Rad etilgan" },
];

export const useUserFilters = () => {
  const [nameFilter, setNameFilter] = useQueryState(
    "name",
    parseAsString.withDefault(""),
  );
  const [nameOperator, setNameOperator] = useQueryState(
    "nameOp",
    parseAsStringEnum(TEXT_OPERATORS).withDefault("contains"),
  );
  const [isNameFilterVisible, setIsNameFilterVisible] = React.useState(
    () => nameFilter.trim() !== "",
  );

  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
  const [isSearchVisible, setIsSearchVisible] = React.useState(
    () => search.trim() !== "",
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
  const [roleOperator, setRoleOperator] = useQueryState(
    "roleOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );

  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(["all", "active", "banned", "inactive"]).withDefault(
      "all",
    ),
  );
  const [statusOperator, setStatusOperator] = useQueryState(
    "statusOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
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
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );

  const [coachStatusFilter, setCoachStatusFilter] = useQueryState(
    "coachStatus",
    parseAsStringEnum([
      "all",
      "none",
      "pending",
      "approved",
      "rejected",
    ]).withDefault("all"),
  );
  const [coachStatusOperator, setCoachStatusOperator] = useQueryState(
    "coachStatusOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );

  const [visibleFilters, setVisibleFilters] = React.useState(() => ({
    role: roleFilter !== "all",
    status: statusFilter !== "all",
    premium: premiumFilter !== "all",
    coachStatus: coachStatusFilter !== "all",
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
    parseAsStringEnum(["asc", "desc"]).withDefault("desc"),
  );

  const currentPage = Math.max(1, Number(pageQuery) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(pageSizeQuery) || DEFAULT_PAGE_SIZE),
  );
  const sorting = React.useMemo(
    () =>
      sortBy === "createdAt" && sortDir === "desc"
        ? []
        : [{ id: sortBy, desc: sortDir === "desc" }],
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
      {
        label: "Coach status",
        key: "coachStatus",
        type: "select",
        defaultOperator: "is",
        options: COACH_STATUS_OPTIONS,
      },
    ],
    [],
  );

  const activeFilters = React.useMemo(() => {
    const items = [];

    if (
      isNameFilterVisible ||
      !isEmpty(String(nameFilter).trim()) ||
      nameOperator === "empty" ||
      nameOperator === "not_empty"
    ) {
      items.push({
        id: "name",
        field: "name",
        operator: nameOperator,
        values:
          nameOperator === "empty" || nameOperator === "not_empty"
            ? []
            : [nameFilter],
      });
    }

    if (isSearchVisible || !isEmpty(String(search).trim())) {
      items.push({
        id: "q",
        field: "q",
        operator: "contains",
        values: [search],
      });
    }

    const pushSelect = (field, value, operator, visible, emptyValue) => {
      if (
        visible ||
        !isEqual(value, emptyValue) ||
        operator === "empty" ||
        operator === "not_empty"
      ) {
        items.push({
          id: field,
          field,
          operator,
          values:
            operator === "empty" || operator === "not_empty" ? [] : [value],
        });
      }
    };

    pushSelect("role", roleFilter, roleOperator, visibleFilters.role, "all");
    pushSelect(
      "status",
      statusFilter,
      statusOperator,
      visibleFilters.status,
      "all",
    );
    pushSelect(
      "premium",
      premiumFilter,
      premiumOperator,
      visibleFilters.premium,
      "all",
    );
    pushSelect(
      "coachStatus",
      coachStatusFilter,
      coachStatusOperator,
      visibleFilters.coachStatus,
      "all",
    );

    return items;
  }, [
    coachStatusFilter,
    coachStatusOperator,
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
      const getFilter = (field) =>
        find(nextFilters, (item) => isEqual(get(item, "field"), field));
      const getValue = (field, fallback = "") =>
        get(getFilter(field), "values[0]", fallback);
      const getOperator = (field, fallback = "is") =>
        get(getFilter(field), "operator", fallback);

      React.startTransition(() => {
        setIsNameFilterVisible(Boolean(getFilter("name")));
        setIsSearchVisible(Boolean(getFilter("q")));
        setVisibleFilters({
          role: Boolean(getFilter("role")),
          status: Boolean(getFilter("status")),
          premium: Boolean(getFilter("premium")),
          coachStatus: Boolean(getFilter("coachStatus")),
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
        void setCoachStatusFilter(getValue("coachStatus", "all"));
        void setCoachStatusOperator(getOperator("coachStatus", "is"));
        void setPageQuery("1");
      });
    },
    [
      setCoachStatusFilter,
      setCoachStatusOperator,
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
    coachStatusFilter,
    coachStatusOperator,
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
