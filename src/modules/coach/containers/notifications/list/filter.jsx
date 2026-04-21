import { Filters } from "@/components/reui/filters.jsx";

export const Filter = ({ filterFields, activeFilters, handleFiltersChange }) => (
  <Filters
    fields={filterFields}
    filters={activeFilters}
    onChange={handleFiltersChange}
    className="flex-1"
  />
);
