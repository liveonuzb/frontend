import React from "react";
import { useTranslation } from "react-i18next";
import find from "lodash/find";
import get from "lodash/get";
import map from "lodash/map";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { APPROVAL_STATUS_OPTIONS } from "./workout-plan-utils.js";

const DIFFICULTY_OPTIONS = ["Boshlang'ich", "O'rta", "Yuqori"];
const SORT_FIELDS = [
  "name",
  "difficulty",
  "daysPerWeek",
  "days",
  "approvalStatus",
  "version",
  "updatedAt",
  "isActive",
];
const SORT_DIRECTIONS = ["asc", "desc"];
const ITEMS_PER_PAGE = 10;

export const usePlanFilters = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(["all", "active", "inactive"]).withDefault("all"),
  );
  const [translationsFilter, setTranslationsFilter] = useQueryState(
    "translations",
    parseAsStringEnum(["all", "complete", "missing"]).withDefault("all"),
  );
  const [difficultyFilter, setDifficultyFilter] = useQueryState(
    "difficulty",
    parseAsStringEnum(["all", ...DIFFICULTY_OPTIONS]).withDefault("all"),
  );
  const [approvalStatusFilter, setApprovalStatusFilter] = useQueryState(
    "approvalStatus",
    parseAsStringEnum([
      "all",
      ...map(APPROVAL_STATUS_OPTIONS, (option) => option.value),
    ]).withDefault("all"),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringEnum(SORT_FIELDS).withDefault("updatedAt"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(SORT_DIRECTIONS).withDefault("desc"),
  );
  const [pageQuery, setPageQuery] = useQueryState(
    "page",
    parseAsString.withDefault("1"),
  );
  const [pageSizeQuery, setPageSizeQuery] = useQueryState(
    "pageSize",
    parseAsString.withDefault(String(ITEMS_PER_PAGE)),
  );

  const filterFields = React.useMemo(
    () => [
      {
        label: t("admin.common.search"),
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: t("admin.workoutPlans.filters.searchPlaceholder"),
      },
      {
        label: t("admin.common.status"),
        key: "status",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: t("admin.common.all") },
          { value: "active", label: t("admin.common.active") },
          { value: "inactive", label: t("admin.common.inactive") },
        ],
      },
      {
        label: t("admin.workoutPlans.columns.difficulty"),
        key: "difficulty",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: t("admin.workoutPlans.filters.allLevels") },
          ...map(DIFFICULTY_OPTIONS, (option) => ({
            value: option,
            label: option,
          })),
        ],
      },
      {
        label: t("admin.workoutPlans.form.approval"),
        key: "approvalStatus",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: t("admin.common.all") },
          ...APPROVAL_STATUS_OPTIONS,
        ],
      },
      {
        label: t("admin.workoutPlans.filters.translationStatus"),
        key: "translations",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: t("admin.common.all") },
          { value: "complete", label: t("admin.workoutPlans.filters.complete") },
          { value: "missing", label: t("admin.workoutPlans.filters.missing") },
        ],
      },
    ],
    [t],
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

    if (statusFilter !== "all") {
      items.push({
        id: "status",
        field: "status",
        operator: "is",
        values: [statusFilter],
      });
    }

    if (difficultyFilter !== "all") {
      items.push({
        id: "difficulty",
        field: "difficulty",
        operator: "is",
        values: [difficultyFilter],
      });
    }

    if (translationsFilter !== "all") {
      items.push({
        id: "translations",
        field: "translations",
        operator: "is",
        values: [translationsFilter],
      });
    }

    if (approvalStatusFilter !== "all") {
      items.push({
        id: "approvalStatus",
        field: "approvalStatus",
        operator: "is",
        values: [approvalStatusFilter],
      });
    }

    return items;
  }, [
    approvalStatusFilter,
    difficultyFilter,
    search,
    statusFilter,
    translationsFilter,
  ]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch = get(
        find(nextFilters, (filter) => filter.field === "q"),
        "values[0]",
        "",
      );
      const nextStatus = get(
        find(nextFilters, (filter) => filter.field === "status"),
        "values[0]",
        "all",
      );
      const nextDifficulty = get(
        find(nextFilters, (filter) => filter.field === "difficulty"),
        "values[0]",
        "all",
      );
      const nextTranslations = get(
        find(nextFilters, (filter) => filter.field === "translations"),
        "values[0]",
        "all",
      );
      const nextApprovalStatus = get(
        find(nextFilters, (filter) => filter.field === "approvalStatus"),
        "values[0]",
        "all",
      );

      React.startTransition(() => {
        void setSearch(nextSearch);
        void setStatusFilter(nextStatus);
        void setDifficultyFilter(nextDifficulty);
        void setTranslationsFilter(nextTranslations);
        void setApprovalStatusFilter(nextApprovalStatus);
        void setPageQuery("1");
      });
    },
    [
      setApprovalStatusFilter,
      setDifficultyFilter,
      setPageQuery,
      setSearch,
      setStatusFilter,
      setTranslationsFilter,
    ],
  );

  const sorting = React.useMemo(
    () => [{ id: sortBy, desc: sortDir === "desc" }],
    [sortBy, sortDir],
  );

  const handleSortingChange = React.useCallback(
    (updater) => {
      const nextSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      const nextSort = nextSorting?.[0];

      React.startTransition(() => {
        void setPageQuery("1");

        if (!nextSort) {
          void setSortBy("updatedAt");
          void setSortDir("desc");
          return;
        }

        void setSortBy(nextSort.id);
        void setSortDir(nextSort.desc ? "desc" : "asc");
      });
    },
    [setPageQuery, setSortBy, setSortDir, sorting],
  );

  const currentPage = Math.max(1, toNumber(pageQuery) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, toNumber(pageSizeQuery) || ITEMS_PER_PAGE),
  );

  const queryParams = React.useMemo(
    () => ({
      ...(trim(search) ? { q: trim(search) } : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(difficultyFilter !== "all" ? { difficulty: difficultyFilter } : {}),
      ...(approvalStatusFilter !== "all"
        ? { approvalStatus: approvalStatusFilter }
        : {}),
      ...(translationsFilter !== "all"
        ? { translations: translationsFilter }
        : {}),
      sortBy,
      sortDir,
      page: currentPage,
      pageSize,
    }),
    [
      approvalStatusFilter,
      currentPage,
      difficultyFilter,
      pageSize,
      search,
      sortBy,
      sortDir,
      statusFilter,
      translationsFilter,
    ],
  );

  return {
    search,
    statusFilter,
    translationsFilter,
    difficultyFilter,
    approvalStatusFilter,
    sortBy,
    sortDir,
    sorting,
    currentPage,
    pageSize,
    queryParams,
    pageQuery,
    setPageQuery,
    setPageSizeQuery,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  };
};
