import React from "react";
import { useNavigate, Outlet } from "react-router";
import {
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  filter as lodashFilter,
  get,
  isArray,
  join,
  toString,
} from "lodash";
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
  DataGridTable,
} from "@/components/reui/data-grid";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { usePlanFilters } from "./use-filters.js";
import { DeleteAlert } from "./delete-alert.jsx";

const PLANS_QUERY_KEY = ["admin", "premium-plans"];

const Index = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();

  const { data: plansData, isLoading, isFetching, refetch } = useGetQuery({
    url: "/admin/premium/plans",
    queryProps: { queryKey: PLANS_QUERY_KEY },
  });
  const plans = get(plansData, "data.data", get(plansData, "data", []));

  const patchMutation = usePatchQuery({ queryKey: PLANS_QUERY_KEY });
  const deleteMutation = useDeleteQuery({ queryKey: PLANS_QUERY_KEY });

  const {
    search,
    typeFilter,
    statusFilter,
    filterFields,
    activeFilters,
    handleFiltersChange,
  } = usePlanFilters();

  const [planToDelete, setPlanToDelete] = React.useState(null);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/premium", title: "Premium" },
      { url: "/admin/premium/plans", title: "Planlar" },
    ]);
  }, [setBreadcrumbs]);

  const handleToggleActive = React.useCallback(
    async (plan) => {
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
    [patchMutation],
  );

  const handleDelete = React.useCallback(async () => {
    if (!planToDelete) return;

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
  }, [planToDelete, deleteMutation]);

  const deferredSearch = React.useDeferredValue(search);

  const filteredPlans = React.useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return lodashFilter(plans, (plan) => {
      if (query) {
        const name = toString(get(plan, "name")).toLowerCase();
        const slug = toString(get(plan, "slug")).toLowerCase();
        if (!name.includes(query) && !slug.includes(query)) return false;
      }

      if (typeFilter !== "all") {
        if (get(plan, "type") !== typeFilter) return false;
      }

      if (statusFilter !== "all") {
        const isActive = get(plan, "isActive");
        if (statusFilter === "active" ? !isActive : isActive) return false;
      }

      return true;
    });
  }, [plans, deferredSearch, typeFilter, statusFilter]);

  const columns = useColumns({
    handleToggleActive,
    onEdit: (plan) => navigate(`edit/${get(plan, "id")}`),
    onDelete: setPlanToDelete,
  });

  const table = useReactTable({
    data: filteredPlans,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => toString(get(row, "id")),
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Planlar</h1>
        <Button onClick={() => navigate("create")} className="gap-1.5">
          <PlusIcon />
          Plan qo'shish
        </Button>
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
        {filteredPlans.length} ta plan
      </p>

      <DataGridContainer>
        <ScrollArea className="w-full">
          <DataGrid
            table={table}
            tableLayout={{ width: "auto" }}
            loadingMode="none"
            isLoading={isLoading}
          >
            <DataGridTable />
          </DataGrid>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DataGridContainer>

      {!isLoading && !filteredPlans.length ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          Filtrlarga mos plan topilmadi.
        </div>
      ) : null}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>
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
