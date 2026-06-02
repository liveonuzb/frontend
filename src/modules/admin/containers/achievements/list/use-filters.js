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
import {
  ACHIEVEMENT_CATEGORY_OPTIONS,
  ACHIEVEMENT_METRIC_OPTIONS,
  APP_MODE_OPTIONS,
} from "../api";

import filter from "lodash/filter";
import map from "lodash/map";
import trim from "lodash/trim";

const ITEMS_PER_PAGE = 10;
const SORT_FIELDS = [
  "orderKey",
  "name",
  "category",
  "metric",
  "threshold",
  "xpReward",
  "createdAt",
  "isActive",
];
const withAll = (label, options) => [{ value: "all", label }, ...options];

const STATUS_OPTIONS = [
  { value: "all", label: "Barcha statuslar" },
  { value: "active", label: "Faqat faol" },
  { value: "inactive", label: "Faqat nofaol" },
];

const TRANSLATION_OPTIONS = [
  { value: "all", label: "Barchasi" },
  { value: "complete", label: "To'liq" },
  { value: "missing", label: "Kam" },
];

export const useAchievementFilters = () => {
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
  const [categoryFilter, setCategoryFilter] = useQueryState(
    "category",
    parseAsStringEnum([
      "all",
      ...map(ACHIEVEMENT_CATEGORY_OPTIONS, (option) => option.value),
    ]).withDefault("all"),
  );
  const [categoryOperator, setCategoryOperator] = useQueryState(
    "categoryOp",
    parseAsStringEnum(ADMIN_SELECT_OPERATORS).withDefault("is"),
  );
  const [metricFilter, setMetricFilter] = useQueryState(
    "metric",
    parseAsStringEnum([
      "all",
      ...map(ACHIEVEMENT_METRIC_OPTIONS, (option) => option.value),
    ]).withDefault("all"),
  );
  const [metricOperator, setMetricOperator] = useQueryState(
    "metricOp",
    parseAsStringEnum(ADMIN_SELECT_OPERATORS).withDefault("is"),
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(["all", "active", "inactive"]).withDefault("all"),
  );
  const [statusOperator, setStatusOperator] = useQueryState(
    "statusOp",
    parseAsStringEnum(ADMIN_SELECT_OPERATORS).withDefault("is"),
  );
  const [hasImageFilter, setHasImageFilter] = useQueryState(
    "hasImage",
    parseAsStringEnum(["all", "yes", "no"]).withDefault("all"),
  );
  const [hasImageOperator, setHasImageOperator] = useQueryState(
    "hasImageOp",
    parseAsStringEnum(ADMIN_SELECT_OPERATORS).withDefault("is"),
  );
  const [imageModeFilter, setImageModeFilter] = useQueryState(
    "imageMode",
    parseAsStringEnum(["any", "madagascar", "zen", "focus"]).withDefault("any"),
  );
  const [translationsFilter, setTranslationsFilter] = useQueryState(
    "translations",
    parseAsStringEnum(["all", "complete", "missing"]).withDefault("all"),
  );
  const [translationsOperator, setTranslationsOperator] = useQueryState(
    "translationsOp",
    parseAsStringEnum(ADMIN_SELECT_OPERATORS).withDefault("is"),
  );
  const [visibleFilters, setVisibleFilters] = React.useState(() => ({
    category: categoryFilter !== "all",
    metric: metricFilter !== "all",
    status: statusFilter !== "all",
    hasImage: hasImageFilter !== "all",
    imageMode: imageModeFilter !== "any",
    translations: translationsFilter !== "all",
  }));
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
    parseAsStringEnum(SORT_FIELDS).withDefault("orderKey"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(ADMIN_SORT_DIRECTIONS).withDefault("asc"),
  );

  const currentPage = clampAdminPage(pageQuery);
  const pageSize = clampAdminPageSize(pageSizeQuery, ITEMS_PER_PAGE);
  const sorting = React.useMemo(
    () =>
      buildAdminSortingState({
        sortBy,
        sortDir,
        defaultSortBy: "orderKey",
        defaultSortDir: "asc",
      }),
    [sortBy, sortDir],
  );
  const canReorder =
    trim(nameFilter) === "" &&
    nameOperator === "contains" &&
    categoryFilter === "all" &&
    categoryOperator === "is" &&
    metricFilter === "all" &&
    metricOperator === "is" &&
    statusFilter === "all" &&
    statusOperator === "is" &&
    hasImageFilter === "all" &&
    hasImageOperator === "is" &&
    imageModeFilter === "any" &&
    translationsFilter === "all" &&
    translationsOperator === "is" &&
    sortBy === "orderKey" &&
    sortDir === "asc" &&
    currentPage === 1;

  const filterFields = React.useMemo(
    () => [
      {
        label: "Nomi",
        key: "name",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Search text...",
      },
      {
        label: "Kategoriya",
        key: "category",
        type: "select",
        defaultOperator: "is",
        options: withAll("Barcha kategoriyalar", ACHIEVEMENT_CATEGORY_OPTIONS),
      },
      {
        label: "Metric",
        key: "metric",
        type: "select",
        defaultOperator: "is",
        options: withAll("Barcha metriclar", ACHIEVEMENT_METRIC_OPTIONS),
      },
      {
        label: "Status",
        key: "status",
        type: "select",
        defaultOperator: "is",
        options: STATUS_OPTIONS,
      },
      {
        label: "Rasm",
        key: "hasImage",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barchasi" },
          { value: "yes", label: "Rasmli" },
          { value: "no", label: "Rasmsiz" },
        ],
      },
      {
        label: "Mode",
        key: "imageMode",
        type: "select",
        defaultOperator: "is",
        options: [{ value: "any", label: "Istalgan mode" }, ...APP_MODE_OPTIONS],
      },
      {
        label: "Tarjimalar",
        key: "translations",
        type: "select",
        defaultOperator: "is",
        options: TRANSLATION_OPTIONS,
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
      makeAdminSelectActiveFilter({
        field: "category",
        value: categoryFilter,
        operator: categoryOperator,
        visible: visibleFilters.category,
      }),
      makeAdminSelectActiveFilter({
        field: "metric",
        value: metricFilter,
        operator: metricOperator,
        visible: visibleFilters.metric,
      }),
      makeAdminSelectActiveFilter({
        field: "status",
        value: statusFilter,
        operator: statusOperator,
        visible: visibleFilters.status,
      }),
      makeAdminSelectActiveFilter({
        field: "hasImage",
        value: hasImageFilter,
        operator: hasImageOperator,
        visible: visibleFilters.hasImage,
      }),
      makeAdminSelectActiveFilter({
        field: "imageMode",
        value: imageModeFilter,
        operator: "is",
        visible: visibleFilters.imageMode,
        emptyValue: "any",
      }),
      makeAdminSelectActiveFilter({
        field: "translations",
        value: translationsFilter,
        operator: translationsOperator,
        visible: visibleFilters.translations,
      }),
    ], Boolean);
  }, [
    categoryFilter,
    categoryOperator,
    hasImageFilter,
    hasImageOperator,
    imageModeFilter,
    isNameFilterVisible,
    metricFilter,
    metricOperator,
    nameFilter,
    nameOperator,
    statusFilter,
    statusOperator,
    translationsFilter,
    translationsOperator,
    visibleFilters,
  ]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const { getValue, getOperator, isVisible } =
        getAdminFilterReader(nextFilters);

      React.startTransition(() => {
        setIsNameFilterVisible(isVisible("name"));
        setVisibleFilters({
          category: isVisible("category"),
          metric: isVisible("metric"),
          status: isVisible("status"),
          hasImage: isVisible("hasImage"),
          imageMode: isVisible("imageMode"),
          translations: isVisible("translations"),
        });
        void setNameFilter(getValue("name", ""));
        void setNameOperator(getOperator("name", "contains"));
        void setCategoryFilter(getValue("category", "all"));
        void setCategoryOperator(getOperator("category", "is"));
        void setMetricFilter(getValue("metric", "all"));
        void setMetricOperator(getOperator("metric", "is"));
        void setStatusFilter(getValue("status", "all"));
        void setStatusOperator(getOperator("status", "is"));
        void setHasImageFilter(getValue("hasImage", "all"));
        void setHasImageOperator(getOperator("hasImage", "is"));
        void setImageModeFilter(getValue("imageMode", "any"));
        void setTranslationsFilter(getValue("translations", "all"));
        void setTranslationsOperator(getOperator("translations", "is"));
        void setPageQuery("1");
      });
    },
    [
      setCategoryFilter,
      setCategoryOperator,
      setHasImageFilter,
      setHasImageOperator,
      setImageModeFilter,
      setMetricFilter,
      setMetricOperator,
      setNameFilter,
      setNameOperator,
      setPageQuery,
      setStatusFilter,
      setStatusOperator,
      setTranslationsFilter,
      setTranslationsOperator,
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
          void setSortBy("orderKey");
          void setSortDir("asc");
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
    categoryFilter,
    categoryOperator,
    metricFilter,
    metricOperator,
    statusFilter,
    statusOperator,
    hasImageFilter,
    hasImageOperator,
    imageModeFilter,
    translationsFilter,
    translationsOperator,
    sortBy,
    sortDir,
    sorting,
    pageQuery,
    setPageQuery,
    pageSizeQuery,
    setPageSizeQuery,
    currentPage,
    pageSize,
    canReorder,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  };
};
