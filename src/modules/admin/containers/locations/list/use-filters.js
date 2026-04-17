import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { trim } from "lodash";

const LOCATION_TYPES = ["country", "region", "district", "city"];
const FILTER_LOCATION_TYPES = ["all", ...LOCATION_TYPES];
const STATUS_OPTIONS = ["all", "active", "inactive"];
const TRANSLATION_OPTIONS = ["all", "complete", "incomplete"];
const TYPE_LABELS = {
  country: "Country",
  region: "Region",
  district: "District",
  city: "City",
};

export const useLocationFilters = () => {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    parseAsStringEnum(FILTER_LOCATION_TYPES).withDefault("all"),
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(STATUS_OPTIONS).withDefault("all"),
  );
  const [translationFilter, setTranslationFilter] = useQueryState(
    "translations",
    parseAsStringEnum(TRANSLATION_OPTIONS).withDefault("all"),
  );

  const filterFields = React.useMemo(
    () => [
      {
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Location nomi yoki path",
      },
      {
        label: "Tur",
        key: "type",
        type: "select",
        defaultOperator: "is",
        options: FILTER_LOCATION_TYPES.map((value) => ({
          value,
          label: value === "all" ? "Barcha turlar" : TYPE_LABELS[value],
        })),
      },
      {
        label: "Status",
        key: "status",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha statuslar" },
          { value: "active", label: "Faqat faol" },
          { value: "inactive", label: "Faqat nofaol" },
        ],
      },
      {
        label: "Tarjimalar",
        key: "translations",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha tarjimalar" },
          { value: "complete", label: "Tarjimasi to'liq" },
          { value: "incomplete", label: "Tarjimasi to'liq emas" },
        ],
      },
    ],
    [],
  );

  const activeFilters = React.useMemo(() => {
    const next = [];

    if (trim(search)) {
      next.push({ id: "q", field: "q", operator: "contains", values: [search] });
    }

    if (typeFilter !== "all") {
      next.push({ id: "type", field: "type", operator: "is", values: [typeFilter] });
    }

    if (statusFilter !== "all") {
      next.push({ id: "status", field: "status", operator: "is", values: [statusFilter] });
    }

    if (translationFilter !== "all") {
      next.push({ id: "translations", field: "translations", operator: "is", values: [translationFilter] });
    }

    return next;
  }, [search, statusFilter, translationFilter, typeFilter]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const getValue = (field, fallback = "") =>
        nextFilters.find((item) => item.field === field)?.values?.[0] ?? fallback;

      React.startTransition(() => {
        void setSearch(getValue("q", ""));
        void setTypeFilter(getValue("type", "all"));
        void setStatusFilter(getValue("status", "all"));
        void setTranslationFilter(getValue("translations", "all"));
      });
    },
    [setSearch, setStatusFilter, setTranslationFilter, setTypeFilter],
  );

  return {
    search,
    typeFilter,
    statusFilter,
    translationFilter,
    filterFields,
    activeFilters,
    handleFiltersChange,
  };
};
