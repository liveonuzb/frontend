import { Filters } from "@/components/reui/filters.jsx";

export const Filter = ({
  filterFields,
  activeFilters,
  handleFiltersChange,
}) => {
  return (
    <Filters
      fields={filterFields}
      filters={activeFilters}
      onChange={handleFiltersChange}
    />
  );
};
