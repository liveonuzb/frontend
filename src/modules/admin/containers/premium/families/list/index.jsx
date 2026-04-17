import React from "react";
import { useNavigate } from "react-router";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { get, filter as lodashFilter, toString } from "lodash";
import { RotateCcwIcon } from "lucide-react";
import { useBreadcrumbStore } from "@/store";
import { useGetQuery } from "@/hooks/api";
import {
  DataGrid,
  DataGridContainer,
} from "@/components/reui/data-grid";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useFamilyFilters } from "./use-filters.js";

const QUERY_KEY = ["admin", "premium-families"];

const Index = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();

  const { data: familiesData, isLoading, isFetching, refetch } = useGetQuery({
    url: "/admin/premium/families",
    queryProps: { queryKey: QUERY_KEY },
  });
  const families = get(familiesData, "data.data", []);

  const {
    search,
    filterFields,
    activeFilters,
    handleFiltersChange,
  } = useFamilyFilters();

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/premium", title: "Premium" },
      { url: "/admin/premium/families", title: "Oilalar" },
    ]);
  }, [setBreadcrumbs]);

  const deferredSearch = React.useDeferredValue(search);

  const filteredFamilies = React.useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return families;

    return lodashFilter(families, (family) => {
      const owner = get(family, "owner", {});
      const searchableValues = [
        get(owner, "firstName"),
        get(owner, "lastName"),
        get(owner, "email"),
        get(owner, "phone"),
      ];

      return searchableValues.some((value) =>
        toString(value).toLowerCase().includes(query),
      );
    });
  }, [families, deferredSearch]);

  const columns = useColumns();

  const table = useReactTable({
    data: filteredFamilies,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => toString(get(row, "id")),
  });

  const handleRowClick = React.useCallback(
    (rowOriginal) => {
      navigate(`/admin/premium/families/${get(rowOriginal, "id")}`);
    },
    [navigate],
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Oilalar</h1>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Filter
          filterFields={filterFields}
          activeFilters={activeFilters}
          handleFiltersChange={handleFiltersChange}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          className="hidden sm:flex"
          disabled={isFetching}
        >
          <RotateCcwIcon className={cn("size-4", isFetching && "animate-spin")} />
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {filteredFamilies.length} ta oila
      </p>

      <DataGridContainer>
        <ScrollArea className="w-full">
          <DataGrid
            table={table}
            tableLayout={{ width: "auto" }}
            loadingMode="none"
            isLoading={isLoading}
            onRowClick={handleRowClick}
          />
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DataGridContainer>

      {!isLoading && !filteredFamilies.length ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          Filtrlarga mos oila topilmadi.
        </div>
      ) : null}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>
      ) : null}
    </div>
  );
};

export default Index;
