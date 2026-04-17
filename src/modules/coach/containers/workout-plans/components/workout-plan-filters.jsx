import React from "react";
import { RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Filters } from "@/components/reui/filters.jsx";
import { cn } from "@/lib/utils";

const WorkoutPlanFilters = ({ filterFields, activeFilters, onFiltersChange, onRefetch, isFetching }) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Filters
        fields={filterFields}
        filters={activeFilters}
        onChange={onFiltersChange}
        className="flex-1"
      />
      <Button
        variant="outline"
        size="icon"
        onClick={onRefetch}
        className="hidden sm:flex"
        disabled={isFetching}
      >
        <RotateCcwIcon className={cn("size-4", isFetching && "animate-spin")} />
      </Button>
    </div>
  );
};

export default WorkoutPlanFilters;
