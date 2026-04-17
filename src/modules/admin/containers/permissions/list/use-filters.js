import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { trim } from "lodash";
import { PERMISSION_DOMAIN_OPTIONS } from "@/lib/permission-utils";

const STATUS_OPTIONS = ["all", "active", "inactive"];

export const usePermissionFilters = () => {
  const [selectedDomain, setSelectedDomain] = useQueryState(
    "domain",
    parseAsStringEnum(PERMISSION_DOMAIN_OPTIONS.map((item) => item.value)).withDefault("platform"),
  );
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(STATUS_OPTIONS).withDefault("all"),
  );

  const filterFields = React.useMemo(
    () => [
      {
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Group, action yoki code",
      },
      {
        label: "Domain",
        key: "domain",
        type: "select",
        defaultOperator: "is",
        options: PERMISSION_DOMAIN_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
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
    ],
    [],
  );

  const activeFilters = React.useMemo(() => {
    const next = [
      {
        id: "domain",
        field: "domain",
        operator: "is",
        values: [selectedDomain],
      },
    ];

    if (trim(search)) {
      next.push({
        id: "q",
        field: "q",
        operator: "contains",
        values: [search],
      });
    }

    if (statusFilter !== "all") {
      next.push({
        id: "status",
        field: "status",
        operator: "is",
        values: [statusFilter],
      });
    }

    return next;
  }, [search, selectedDomain, statusFilter]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const getValue = (field, fallback = "") =>
        nextFilters.find((item) => item.field === field)?.values?.[0] ?? fallback;

      React.startTransition(() => {
        void setSelectedDomain(getValue("domain", "platform"));
        void setSearch(getValue("q", ""));
        void setStatusFilter(getValue("status", "all"));
      });
    },
    [setSearch, setSelectedDomain, setStatusFilter],
  );

  return {
    selectedDomain,
    search,
    statusFilter,
    filterFields,
    activeFilters,
    handleFiltersChange,
  };
};
