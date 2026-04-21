import React from "react";
import { get } from "lodash";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useBreadcrumbStore } from "@/store";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { ListHeader } from "@/modules/coach/components/data-grid-helpers";
import { useCoachAuditLogs } from "@/modules/coach/lib/hooks";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useAuditFilters } from "./use-filters.js";

const AuditLogsListPage = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();

  const {
    search,
    entityType,
    action,
    sortBy,
    sortDir,
    currentPage,
    pageSize,
    setPageQuery,
    sorting,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  } = useAuditFilters();

  const deferredSearch = React.useDeferredValue(search);

  const queryParams = React.useMemo(
    () => ({
      ...(deferredSearch.trim() ? { q: deferredSearch.trim() } : {}),
      ...(entityType !== "all" ? { entityType } : {}),
      ...(action !== "all" ? { action } : {}),
      sortBy,
      sortDir,
      page: currentPage,
      pageSize,
    }),
    [deferredSearch, entityType, action, sortBy, sortDir, currentPage, pageSize],
  );

  const { data, isLoading } = useCoachAuditLogs(queryParams);
  const logs = get(data, "data.data", []);
  const meta = get(data, "data.meta", { total: 0, page: 1, pageSize: 10, totalPages: 1 });

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: "Coach" },
      { url: "/coach/audit-logs", title: "Audit loglari" },
    ]);
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    const totalPages = get(meta, "totalPages", 1);
    if (currentPage > totalPages) {
      void setPageQuery(String(totalPages));
    }
  }, [currentPage, meta, setPageQuery]);

  const columns = useColumns({ currentPage, pageSize });

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: logs,
    columns,
    manualSorting: true,
    manualPagination: true,
    pageCount: get(meta, "totalPages", 1),
    enableRowSelection: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id.toString(),
    onSortingChange: handleSortingChange,
    onPaginationChange: (updater) => {
      const prev = { pageIndex: currentPage - 1, pageSize };
      const next = typeof updater === "function" ? updater(prev) : updater;
      React.startTransition(() => {
        void setPageQuery(String(next.pageIndex + 1));
      });
    },
    state: {
      sorting,
      pagination: { pageIndex: currentPage - 1, pageSize },
    },
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      <ListHeader
        title="Audit loglari"
        description="Trener harakatlari tarixi"
      />

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Filter
          filterFields={filterFields}
          activeFilters={activeFilters}
          handleFiltersChange={handleFiltersChange}
        />
      </div>

      <DataGrid
        table={table}
        isLoading={isLoading}
        recordCount={get(meta, "total", 0)}
      >
        <div className="w-full flex flex-col gap-2.5">
          <DataGridContainer>
            <ScrollArea className="w-full">
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
          <DataGridPagination
            info="{from} - {to} / {count} ta log"
            rowsPerPageLabel="Sahifada:"
            sizes={[10, 25, 50]}
          />
        </div>
      </DataGrid>
    </div>
  );
};

export default AuditLogsListPage;
