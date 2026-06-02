import React from "react";
import { useNavigate, Outlet } from "react-router";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAdminDrawerListNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { usePromoCodeFilters } from "./use-filters.js";

const QUERY_KEY = ["admin", "promo-codes"];

const Index = () => {
  const navigate = useNavigate();
  const navigateAdminDrawer = useAdminDrawerListNavigation();
  const { canManageGrowth } = useAdminPermissions();
  const { setBreadcrumbs } = useBreadcrumbStore();

  const {
    search,
    statusFilter,
    currentPage,
    pageSize,
    setPageQuery,
    setPageSizeQuery,
    filterFields,
    activeFilters,
    handleFiltersChange,
  } = usePromoCodeFilters();
  const deferredSearch = React.useDeferredValue(search);
  const queryParams = React.useMemo(
    () => ({
      ...(trim(deferredSearch) ? { q: trim(deferredSearch) } : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      page: currentPage,
      pageSize,
    }),
    [currentPage, deferredSearch, pageSize, statusFilter],
  );

  const { data: promoData, isLoading, isFetching, refetch } = useGetQuery({
    url: "/admin/premium/promo-codes",
    params: queryParams,
    queryProps: { queryKey: [...QUERY_KEY, queryParams] },
  });
  const promoCodes = get(promoData, "data.data", []);
  const meta = get(promoData, "data.meta", {
    total: 0,
    page: currentPage,
    pageSize,
    totalPages: 1,
  });

  const patchMutation = usePatchQuery({ queryKey: QUERY_KEY });
  const deleteMutation = useDeleteQuery({ queryKey: QUERY_KEY });
  const [promoCodeToDelete, setPromoCodeToDelete] = React.useState(null);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/premium", title: "Premium" },
      { url: "/admin/premium/promo-codes", title: "Promo kodlar" },
    ]);
  }, [setBreadcrumbs]);

  const handleToggleActive = React.useCallback(
    async (promoCode) => {
      if (!canManageGrowth) return;

      try {
        await patchMutation.mutateAsync({
          url: `/admin/premium/promo-codes/${get(promoCode, "id")}`,
          attributes: { isActive: !get(promoCode, "isActive") },
        });
        toast.success(
          !get(promoCode, "isActive")
            ? "Promo kod faol qilindi"
            : "Promo kod nofaol qilindi",
        );
      } catch (error) {
        const message = get(error, "response.data.message");
        toast.error(
          isArray(message)
            ? join(message, ", ")
            : message || "Promo kod statusini o'zgartirib bo'lmadi",
        );
      }
    },
    [canManageGrowth, patchMutation],
  );

  const handleDelete = React.useCallback(
    async (promoCode) => {
      if (!canManageGrowth) return;

      try {
        await deleteMutation.mutateAsync({
          url: `/admin/premium/promo-codes/${get(promoCode, "id")}`,
        });
        toast.success("Promo kod o'chirildi");
      } catch (error) {
        const message = get(error, "response.data.message");
        toast.error(
          isArray(message)
            ? join(message, ", ")
            : message || "Promo kodni o'chirib bo'lmadi",
        );
      }
    },
    [canManageGrowth, deleteMutation],
  );

  const columns = useColumns({
    canManage: canManageGrowth,
    handleToggleActive,
    onEdit: (promoCode) => {
      if (!canManageGrowth) return;
      navigateAdminDrawer(`edit/${get(promoCode, "id")}`);
    },
    onDelete: (promoCode) => {
      if (!canManageGrowth) return;
      setPromoCodeToDelete(promoCode);
    },
  });

  const table = useReactTable({
    data: promoCodes,
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
        <h1 className="text-2xl font-bold tracking-tight">Promo kodlar</h1>
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
              Promo kod qo'shish
            </Button>
          ) : null}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {get(meta, "total", 0)} ta promo kod
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
          info="{from} - {to} / {count} ta promo kod"
          sizes={[10, 20, 50, 100]}
        />
      </DataGrid>

      {!isLoading && !promoCodes.length ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          Filtrlarga mos promo kod topilmadi.
        </div>
      ) : null}

      <AlertDialog
        open={Boolean(promoCodeToDelete)}
        onOpenChange={(open) => {
          if (!open) setPromoCodeToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promo kodni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              {promoCodeToDelete
                ? `"${get(promoCodeToDelete, "code")}" promo kodni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.`
                : "Bu promo kodni o'chirmoqchimisiz?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={async () => {
                await handleDelete(promoCodeToDelete);
                setPromoCodeToDelete(null);
              }}
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Outlet />
    </div>
  );
};

export default Index;
