import React from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { clamp, get, find } from "lodash";
import { useBreadcrumbStore } from "@/store";
import { useGetQuery } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import PageTransition from "@/components/page-transition";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FileClockIcon,
} from "lucide-react";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useAuditLogFilters } from "./use-filters.js";

const ITEMS_PER_PAGE = 10;

const Index = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();

  const {
    search,
    deferredSearch,
    actionFilter,
    entityFilter,
    currentPage,
    sortBy,
    sortDir,
    sorting,
    handleSortingChange,
    setPageQuery,
  } = useAuditLogFilters({ actions: [], entityTypes: [] });

  const queryParams = React.useMemo(
    () => ({
      ...(search.trim() ? { q: deferredSearch.trim() } : {}),
      ...(actionFilter !== "all" ? { action: actionFilter } : {}),
      ...(entityFilter !== "all" ? { entityType: entityFilter } : {}),
      sortBy,
      sortDir,
      page: currentPage,
      pageSize: ITEMS_PER_PAGE,
    }),
    [
      actionFilter,
      currentPage,
      deferredSearch,
      entityFilter,
      search,
      sortBy,
      sortDir,
    ],
  );

  const { data: auditLogsData, isLoading } = useGetQuery({
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
  const {
    filterFields,
    activeFilters,
    handleFiltersChange,
  } = useAuditLogFilters({ actions, entityTypes });

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

  const columns = useColumns({ currentPage, pageSize: ITEMS_PER_PAGE });

  const table = useReactTable({
    data: auditLogs,
    columns,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: handleSortingChange,
    state: {
      sorting,
    },
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

        <Filter
          filterFields={filterFields}
          activeFilters={activeFilters}
          handleFiltersChange={handleFiltersChange}
        />

        <DataGridContainer>
          <ScrollArea className="w-full">
            <DataGrid
              table={table}
              isLoading={isLoading}
              recordCount={auditLogs.length}
            >
              <DataGridTable />
            </DataGrid>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          {isLoading ? (
            <div className="px-4 pb-4 text-sm text-muted-foreground">
              Yuklanmoqda...
            </div>
          ) : null}
        </DataGridContainer>

        {get(meta, "total", 0) > ITEMS_PER_PAGE ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
              {clamp(currentPage * ITEMS_PER_PAGE, 0, get(meta, "total", 0))}{" "}
              / {get(meta, "total", 0)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() =>
                  void setPageQuery(String(clamp(currentPage - 1, 1, get(meta, "totalPages", 1))))
                }
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon />
              </Button>
              <span className="px-2 text-sm font-medium">
                {currentPage} / {get(meta, "totalPages", 1)}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() =>
                  void setPageQuery(
                    String(
                      clamp(currentPage + 1, 1, get(meta, "totalPages", 1)),
                    ),
                  )
                }
                disabled={currentPage === get(meta, "totalPages", 1)}
              >
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </PageTransition>
  );
};

export default Index;
