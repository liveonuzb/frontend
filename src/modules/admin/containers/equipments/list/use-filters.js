import React from "react";
import { find, get } from "lodash";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";

export const useEquipmentFilters = () => {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(["all", "active", "inactive"]).withDefault("all"),
  );
  const [imageFilter, setImageFilter] = useQueryState(
    "image",
    parseAsStringEnum(["all", "with-image", "without-image"]).withDefault("all"),
  );
  const [translationFilter, setTranslationFilter] = useQueryState(
    "translations",
    parseAsStringEnum(["all", "complete", "incomplete"]).withDefault("all"),
  );

  const filterFields = React.useMemo(
    () => [
      {
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Jihoz qidirish",
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
        label: "Rasm",
        key: "image",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Hammasi" },
          { value: "with-image", label: "Rasm bor" },
          { value: "without-image", label: "Rasmsiz" },
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
    const items = [];

    if (search.trim()) {
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

    if (imageFilter !== "all") {
      items.push({
        id: "image",
        field: "image",
        operator: "is",
        values: [imageFilter],
      });
    }

    if (translationFilter !== "all") {
      items.push({
        id: "translations",
        field: "translations",
        operator: "is",
        values: [translationFilter],
      });
    }

    return items;
  }, [imageFilter, search, statusFilter, translationFilter]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch =
        get(find(nextFilters, (filter) => filter.field === "q"), "values[0]", "");
      const nextStatus =
        get(find(nextFilters, (filter) => filter.field === "status"), "values[0]", "all");
      const nextImage =
        get(find(nextFilters, (filter) => filter.field === "image"), "values[0]", "all");
      const nextTranslations =
        get(find(nextFilters, (filter) => filter.field === "translations"), "values[0]", "all");

      React.startTransition(() => {
        void setSearch(nextSearch);
        void setStatusFilter(nextStatus);
        void setImageFilter(nextImage);
        void setTranslationFilter(nextTranslations);
      });
    },
    [setImageFilter, setSearch, setStatusFilter, setTranslationFilter],
  );

  return {
    search,
    statusFilter,
    imageFilter,
    translationFilter,
    filterFields,
    activeFilters,
    handleFiltersChange,
  };
};
