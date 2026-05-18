import React from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { get, toNumber, trim } from "lodash";
import { useBreadcrumbStore } from "@/store";
import { useGetQuery } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DataGrid,
  DataGridContainer,
  DataGridPagination,
  DataGridTable,
} from "@/components/reui/data-grid";
import PageTransition from "@/components/page-transition";
import { FileClockIcon, RotateCcwIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useAuditLogFilters } from "./use-filters.js";

const Index = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();

  const {
    search,
    deferredSearch,
    actionFilter,
    entityFilter,
    adminId,
    entityId,
    dateFrom,
    dateTo,
    currentPage,
    pageSize,
    sortBy,
    sortDir,
    sorting,
    handleSortingChange,
    setPageQuery,
    setPageSizeQuery,
  } = useAuditLogFilters({ actions: [], entityTypes: [] });

  const queryParams = React.useMemo(
    () => ({
      ...(trim(search) ? { q: trim(deferredSearch) } : {}),
      ...(actionFilter !== "all" ? { action: actionFilter } : {}),
      ...(entityFilter !== "all" ? { entityType: entityFilter } : {}),
      ...(trim(adminId) ? { adminId: trim(adminId) } : {}),
      ...(trim(entityId) ? { entityId: trim(entityId) } : {}),
      ...(trim(dateFrom) ? { dateFrom: trim(dateFrom) } : {}),
      ...(trim(dateTo) ? { dateTo: trim(dateTo) } : {}),
      sortBy,
      sortDir,
      page: currentPage,
      pageSize,
    }),
    [
      actionFilter,
      adminId,
      currentPage,
      dateFrom,
      deferredSearch,
      entityFilter,
      entityId,
      sortBy,
      sortDir,
      pageSize,
      search,
    ],
  );

  const {
    data: auditLogsData,
    isLoading,
    isFetching,
    refetch,
  } = useGetQuery({
    url: "/admin/audit-logs",
    params: queryParams,
    queryProps: {
      queryKey: ["admin", "audit-logs", queryParams],
    },
  });
  const auditLogs = get(auditLogsData, "data.data", []);
  const meta = get(auditLogsData, "data.meta", {
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  });
  const actions = get(auditLogsData, "data.meta.actions", []);
  const entityTypes = get(auditLogsData, "data.meta.entityTypes", []);

  // Rebuild filter fields with real actions/entityTypes from the API
  const { filterFields, activeFilters, handleFiltersChange } =
    useAuditLogFilters({ actions, entityTypes });

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/audit-logs", title: "Audit log" },
    ]);
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    const totalPages = get(meta, "totalPages", 1);

    if (currentPage > totalPages) {
      void setPageQuery(String(totalPages));
    }
  }, [currentPage, get(meta, "totalPages"), setPageQuery]);

  const columns = useColumns({ currentPage, pageSize });

  const table = useReactTable({
    data: auditLogs,
    columns,
    manualSorting: true,
    manualPagination: true,
    pageCount: get(meta, "totalPages", 1),
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: handleSortingChange,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: currentPage - 1, pageSize })
          : updater;
      const nextPageSize = toNumber(get(next, "pageSize")) || pageSize;

      React.startTransition(() => {
        void setPageQuery(
          String(nextPageSize === pageSize ? toNumber(get(next, "pageIndex", 0)) + 1 : 1),
        );
        void setPageSizeQuery(String(nextPageSize));
      });
    },
    state: {
      sorting,
      pagination: { pageIndex: currentPage - 1, pageSize },
    },
    rowCount: get(meta, "total", 0),
  });

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <FileClockIcon className="text-primary" />
            Audit log
          </h1>
          <p className="text-muted-foreground">
            Admin actionlari va tizimdagi muhim o'zgarishlar tarixi
          </p>
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
            disabled={isFetching}
            className="self-start sm:self-auto"
          >
            <RotateCcwIcon
              className={cn("size-4", isFetching && "animate-spin")}
            />
          </Button>
        </div>

        <DataGrid
          table={table}
          isLoading={isLoading || isFetching}
          recordCount={get(meta, "total", 0)}
        >
          <DataGridContainer>
            <ScrollArea className="w-full">
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
          <DataGridPagination table={table} />
        </DataGrid>
      </div>
    </PageTransition>
  );
};

export default Index;
