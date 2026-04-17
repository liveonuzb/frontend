import { find, get, times, trim } from "lodash";
import React from "react";
import { parseAsString, useQueryState } from "nuqs";
import { useTranslation } from "react-i18next";
import { Filters } from "@/components/reui/filters.jsx";

export const usePaymentFilters = ({ locale }) => {
  const { t } = useTranslation();

  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
  const [selectedMonth, setSelectedMonth] = useQueryState(
    "month",
    parseAsString.withDefault(
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
    ),
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault("all"),
  );

  const filterFields = React.useMemo(
    () => [
      {
        label: t("coach.payments.filters.search"),
        key: "q",
        type: "text",
        placeholder: t("coach.payments.filters.searchPlaceholder"),
      },
      {
        label: t("coach.payments.filters.month"),
        key: "month",
        type: "select",
        options: times(12, (i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const label = new Intl.DateTimeFormat(locale, {
            month: "long",
            year: "numeric",
          }).format(d);
          return { value: val, label };
        }),
      },
      {
        label: t("coach.payments.filters.status"),
        key: "status",
        type: "select",
        options: [
          { value: "all", label: t("coach.payments.filters.all") },
          {
            value: "completed",
            label: t("coach.payments.status.completed"),
          },
          { value: "refunded", label: t("coach.payments.status.refunded") },
          {
            value: "cancelled",
            label: t("coach.payments.status.cancelled"),
          },
        ],
      },
    ],
    [locale, t],
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
    if (selectedMonth) {
      items.push({
        id: "month",
        field: "month",
        operator: "is",
        values: [selectedMonth],
      });
    }
    if (statusFilter && statusFilter !== "all") {
      items.push({
        id: "status",
        field: "status",
        operator: "is",
        values: [statusFilter],
      });
    }
    return items;
  }, [search, selectedMonth, statusFilter]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch = get(find(nextFilters, (f) => f.field === "q"), "values[0]", "");
      const nextMonth = get(find(nextFilters, (f) => f.field === "month"), "values[0]", "");
      const nextStatus = get(find(nextFilters, (f) => f.field === "status"), "values[0]", "all");

      React.startTransition(() => {
        void setSearch(nextSearch);
        if (nextMonth) void setSelectedMonth(nextMonth);
        void setStatusFilter(nextStatus);
      });
    },
    [setSearch, setSelectedMonth, setStatusFilter],
  );

  return {
    search,
    selectedMonth,
    statusFilter,
    filterFields,
    activeFilters,
    handleFiltersChange,
  };
};

export const Filter = ({ filterFields, activeFilters, handleFiltersChange }) => {
  return (
    <Filters
      fields={filterFields}
      filters={activeFilters}
      onChange={handleFiltersChange}
    />
  );
};
