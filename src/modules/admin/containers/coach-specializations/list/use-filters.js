import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { get, find, isEmpty, isEqual } from "lodash";

const COACH_CATEGORIES = [
  { value: "all", label: "Barcha kategoriyalar" },
  { value: "FITNESS", label: "Fitness" },
  { value: "YOGA", label: "Yoga" },
  { value: "BOXING", label: "Boks" },
  { value: "FOOTBALL", label: "Futbol" },
  { value: "SWIMMING", label: "Suzish" },
  { value: "TENNIS", label: "Tennis" },
  { value: "BASKETBALL", label: "Basketbol" },
  { value: "MARTIAL_ARTS", label: "Jang san'ati" },
  { value: "RUNNING", label: "Yugurish" },
  { value: "GYMNASTICS", label: "Gimnastika" },
  { value: "DANCE", label: "Raqs" },
  { value: "CHEERLEADING", label: "Cheerleading" },
  { value: "SKATING", label: "Muz uchish" },
  { value: "CYCLING", label: "Velosiped" },
  { value: "CLIMBING", label: "Toqqa chiqish" },
  { value: "OTHER", label: "Boshqa" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Barcha statuslar" },
  { value: "active", label: "Faqat faol" },
  { value: "inactive", label: "Faqat nofaol" },
];

export const useSpecializationFilters = () => {
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
  const [categoryFilter, setCategoryFilter] = useQueryState(
    "category",
    parseAsStringEnum([
      "all",
      "FITNESS",
      "YOGA",
      "BOXING",
      "FOOTBALL",
      "SWIMMING",
      "TENNIS",
      "BASKETBALL",
      "MARTIAL_ARTS",
      "RUNNING",
      "GYMNASTICS",
      "DANCE",
      "CHEERLEADING",
      "SKATING",
      "CYCLING",
      "CLIMBING",
      "OTHER",
    ]).withDefault("all"),
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(["all", "active", "inactive"]).withDefault("all"),
  );

  const filterFields = React.useMemo(
    () => [
      {
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Nomi yoki kalit so'z...",
      },
      {
        label: "Kategoriya",
        key: "category",
        type: "select",
        defaultOperator: "is",
        options: COACH_CATEGORIES,
      },
      {
        label: "Status",
        key: "status",
        type: "select",
        defaultOperator: "is",
        options: STATUS_OPTIONS,
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
    if (!isEqual(categoryFilter, "all")) {
      items.push({
        id: "category",
        field: "category",
        operator: "is",
        values: [categoryFilter],
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
  }, [categoryFilter, search, statusFilter]);

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
        void setCategoryFilter(getValue("category", "all"));
        void setStatusFilter(getValue("status", "all"));
      });
    },
    [setCategoryFilter, setSearch, setStatusFilter],
  );

  return {
    search,
    categoryFilter,
    statusFilter,
    filterFields,
    activeFilters,
    handleFiltersChange,
  };
};
