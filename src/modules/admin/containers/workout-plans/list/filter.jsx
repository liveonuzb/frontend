import { Filters } from "@/components/reui/filters.jsx";

export const Filter = ({ filterFields, activeFilters, handleFiltersChange, className }) => {
  return (
    <Filters
      fields={filterFields}
      filters={activeFilters}
      onChange={handleFiltersChange}
      className={className}
    />
  );
};
