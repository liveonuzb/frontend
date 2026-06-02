import React from "react";
import { useNavigate, Outlet } from "react-router";
import {
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import get from "lodash/get";
import isArray from "lodash/isArray";
import join from "lodash/join";
import toString from "lodash/toString";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import { toast } from "sonner";
import { PlusIcon, RotateCcwIcon } from "lucide-react";
import { useBreadcrumbStore } from "@/store";
import {
  useGetQuery,
  usePatchQuery,
  useDeleteQuery,
} from "@/hooks/api";
import {
  DataGrid,
  DataGridContainer,
  DataGridPagination,
  DataGridTable,
} from "@/components/reui/data-grid";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAdminDrawerListNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { usePlanFilters } from "./use-filters.js";
import { DeleteAlert } from "./delete-alert.jsx";

const PLANS_QUERY_KEY = ["admin", "premium-plans"];

const Index = () => {
  const navigate = useNavigate();
  const navigateAdminDrawer = useAdminDrawerListNavigation();
  const { canManageGrowth } = useAdminPermissions();
  const { setBreadcrumbs } = useBreadcrumbStore();

  const {
    search,
    typeFilter,
    statusFilter,
    currentPage,
    pageSize,
    setPageQuery,
    setPageSizeQuery,
    filterFields,
    activeFilters,
    handleFiltersChange,
  } = usePlanFilters();

  const [planToDelete, setPlanToDelete] = React.useState(null);
  const deferredSearch = React.useDeferredValue(search);

  const queryParams = React.useMemo(
    () => ({
      ...(trim(deferredSearch) ? { q: trim(deferredSearch) } : {}),
      ...(typeFilter !== "all" ? { type: typeFilter } : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      page: currentPage,
      pageSize,
    }),
    [currentPage, deferredSearch, pageSize, statusFilter, typeFilter],
  );

  const { data: plansData, isLoading, isFetching, refetch } = useGetQuery({
    url: "/admin/premium/plans",
    params: queryParams,
    queryProps: { queryKey: [...PLANS_QUERY_KEY, queryParams] },
  });
  const plans = get(plansData, "data.data", []);
  const meta = get(plansData, "data.meta", {
    total: 0,
    page: currentPage,
    pageSize,
    totalPages: 1,
  });

  const patchMutation = usePatchQuery({ queryKey: PLANS_QUERY_KEY });
  const deleteMutation = useDeleteQuery({ queryKey: PLANS_QUERY_KEY });

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/premium", title: "Premium" },
      { url: "/admin/premium/plans", title: "Planlar" },
    ]);
  }, [setBreadcrumbs]);

  const handleToggleActive = React.useCallback(
    async (plan) => {
      if (!canManageGrowth) return;

      try {
        await patchMutation.mutateAsync({
          url: `/admin/premium/plans/${get(plan, "id")}`,
          attributes: { isActive: !get(plan, "isActive") },
        });
        toast.success(
          !get(plan, "isActive")
            ? "Plan faol qilindi"
            : "Plan nofaol qilindi",
        );
      } catch (error) {
        const message = get(error, "response.data.message");
        toast.error(
          isArray(message)
            ? join(message, ", ")
            : message || "Plan statusini o'zgartirib bo'lmadi",
        );
      }
    },
    [canManageGrowth, patchMutation],
  );

  const handleDelete = React.useCallback(async () => {
    if (!canManageGrowth || !planToDelete) return;

    try {
      await deleteMutation.mutateAsync({
        url: `/admin/premium/plans/${get(planToDelete, "id")}`,
      });
      toast.success("Plan o'chirildi");
      setPlanToDelete(null);
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        isArray(message)
          ? join(message, ", ")
          : message || "Planni o'chirib bo'lmadi",
      );
    }
  }, [canManageGrowth, planToDelete, deleteMutation]);

  const columns = useColumns({
    canManage: canManageGrowth,
    handleToggleActive,
    onEdit: (plan) => {
      if (!canManageGrowth) return;
      navigateAdminDrawer(`edit/${get(plan, "id")}`);
    },
    onDelete: setPlanToDelete,
  });

  const table = useReactTable({
    data: plans,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => toString(get(row, "id")),
    manualPagination: true,
    pageCount: Math.max(1, toNumber(get(meta, "totalPages", 1))),
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: currentPage - 1, pageSize })
          : updater;

      React.startTransition(() => {
        void setPageQuery(String(get(next, "pageIndex", 0) + 1));
        void setPageSizeQuery(String(get(next, "pageSize", pageSize)));
      });
    },
    state: {
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
    },
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Planlar</h1>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Filter
          filterFields={filterFields}
          activeFilters={activeFilters}
          handleFiltersChange={handleFiltersChange}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RotateCcwIcon
              className={cn("size-4", isFetching && "animate-spin")}
            />
          </Button>
          {canManageGrowth ? (
            <Button onClick={() => navigateAdminDrawer("create")} className="gap-1.5">
              <PlusIcon />
              Plan qo'shish
            </Button>
          ) : null}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {get(meta, "total", 0)} ta plan
      </p>

      <DataGrid
        table={table}
        tableLayout={{ width: "auto" }}
        isLoading={isLoading}
        recordCount={get(meta, "total", 0)}
      >
        <DataGridContainer>
          <ScrollArea className="w-full">
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DataGridContainer>
        <DataGridPagination
          info="{from} - {to} / {count} ta plan"
          sizes={[10, 20, 50, 100]}
        />
      </DataGrid>

      {!isLoading && !plans.length ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          Filtrlarga mos plan topilmadi.
        </div>
      ) : null}

      <DeleteAlert
        plan={planToDelete}
        open={Boolean(planToDelete)}
        onOpenChange={(open) => {
          if (!open) setPlanToDelete(null);
        }}
        onConfirm={handleDelete}
      />

      <Outlet />
    </div>
  );
};

export default Index;
