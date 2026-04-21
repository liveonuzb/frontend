import { Filters } from "@/components/reui/filters.jsx";

export { usePaymentFilters } from "./use-filters.js";

export const Filter = ({ filterFields, activeFilters, handleFiltersChange }) => (
  <Filters
    fields={filterFields}
    filters={activeFilters}
    onChange={handleFiltersChange}
  />
);
