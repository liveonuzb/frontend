import React from "react";
import { useNavigate } from "react-router";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { get, toString, trim } from "lodash";
import { useBreadcrumbStore } from "@/store";
import { useGetQuery } from "@/hooks/api";
import {
  AdminListDataGrid,
  AdminListHeader,
  AdminListPageShell,
  AdminListRefetchButton,
  AdminListToolbar,
} from "@/modules/admin/components/admin-list-shell.jsx";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useFamilyFilters } from "./use-filters.js";

const QUERY_KEY = ["admin", "premium-families"];

const Index = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();

  const {
    search,
    currentPage,
    pageSize,
    setPageQuery,
    setPageSizeQuery,
    filterFields,
    activeFilters,
    handleFiltersChange,
  } = useFamilyFilters();
  const deferredSearch = React.useDeferredValue(search);
  const queryParams = React.useMemo(
    () => ({
      ...(trim(deferredSearch) ? { search: trim(deferredSearch) } : {}),
      page: currentPage,
      pageSize,
    }),
    [currentPage, deferredSearch, pageSize],
  );
  const { data: familiesData, isLoading, isFetching, refetch } = useGetQuery({
    url: "/admin/premium/families",
    params: queryParams,
    queryProps: { queryKey: [...QUERY_KEY, queryParams] },
  });
  const families = get(familiesData, "data.data", []);
  const meta = get(familiesData, "data.meta", {
    total: 0,
    totalPages: 1,
  });

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/premium", title: "Premium" },
      { url: "/admin/premium/families", title: "Oilalar" },
    ]);
  }, [setBreadcrumbs]);

  const columns = useColumns();

  const table = useReactTable({
    data: families,
    columns,
    manualPagination: true,
    pageCount: get(meta, "totalPages", 1),
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => toString(get(row, "id")),
    onPaginationChange: (updater) => {
      const prev = { pageIndex: currentPage - 1, pageSize };
      const next = typeof updater === "function" ? updater(prev) : updater;
      const nextPage = String(get(next, "pageIndex", 0) + 1);
      const nextPageSize = String(get(next, "pageSize", pageSize));
      void setPageQuery(nextPage);
      if (nextPageSize !== String(pageSize)) {
        void setPageSizeQuery(nextPageSize);
      }
    },
    state: {
      pagination: { pageIndex: currentPage - 1, pageSize },
    },
  });

  const handleRowClick = React.useCallback(
    (rowOriginal) => {
      navigate(`/admin/premium/families/${get(rowOriginal, "id")}`);
    },
    [navigate],
  );

  return (
    <AdminListPageShell>
      <AdminListHeader title="Oilalar" />

      <AdminListToolbar
        filters={
          <Filter
            filterFields={filterFields}
            activeFilters={activeFilters}
            handleFiltersChange={handleFiltersChange}
          />
        }
        actions={
          <AdminListRefetchButton
            onClick={() => refetch()}
            isFetching={isFetching}
          />
        }
      />

      <p className="text-sm text-muted-foreground">
        {get(meta, "total", 0)} ta oila
      </p>

      <AdminListDataGrid
        table={table}
        tableLayout={{ width: "auto" }}
        isLoading={isLoading}
        recordCount={get(meta, "total", 0)}
        onRowClick={handleRowClick}
        paginationInfo="{from} - {to} / {count} ta oila"
      />

      {!isLoading && !families.length ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          Filtrlarga mos oila topilmadi.
        </div>
      ) : null}
    </AdminListPageShell>
  );
};

export default Index;
