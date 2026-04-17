import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Filters } from "@/components/reui/filters.jsx";
import { UsersIcon, UserPlusIcon, RotateCcwIcon } from "lucide-react";

const ClientFilterBar = ({
  filterFields,
  activeFilters,
  onFiltersChange,
  isFetching,
  onRefetch,
  onInviteClick,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <UsersIcon className="size-6" />
            Mijozlar
          </h1>
          <p className="text-muted-foreground">
            Biriktirilgan userlar, status va faol rejalari.
          </p>
        </div>
        <Button onClick={onInviteClick}>
          <UserPlusIcon data-icon="inline-start" />
          Client qo'shish
        </Button>
      </div>

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
          <RotateCcwIcon
            className={cn("size-4", isFetching && "animate-spin")}
          />
        </Button>
      </div>
    </div>
  );
};

export default ClientFilterBar;
