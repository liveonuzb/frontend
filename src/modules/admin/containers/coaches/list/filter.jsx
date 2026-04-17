import { Filters } from "@/components/reui/filters.jsx";

export const Filter = ({
  filterFields,
  activeFilters,
  handleFiltersChange,
  refetch,
  isFetching,
}) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <Filters
        fields={filterFields}
        filters={activeFilters}
        onChange={handleFiltersChange}
        className="flex-1"
      />
    </div>
  );
};
