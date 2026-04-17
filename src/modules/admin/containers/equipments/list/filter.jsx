import { Filters } from "@/components/reui/filters.jsx";

export const Filter = ({ filterFields, activeFilters, handleFiltersChange }) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <Filters
        fields={filterFields}
        filters={activeFilters}
        onChange={handleFiltersChange}
        allowMultiple={false}
      />
    </div>
  );
};
