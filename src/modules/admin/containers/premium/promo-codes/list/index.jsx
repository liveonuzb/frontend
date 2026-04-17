import React from "react";
import { useNavigate, Outlet } from "react-router";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { get, filter as lodashFilter, isArray, join, toString } from "lodash";
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
} from "@/components/reui/data-grid";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { usePromoCodeFilters } from "./use-filters.js";

const QUERY_KEY = ["admin", "promo-codes"];

const Index = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();

  const { data: promoData, isLoading, isFetching, refetch } = useGetQuery({
    url: "/admin/premium/promo-codes",
    queryProps: { queryKey: QUERY_KEY },
  });
  const promoCodes = get(promoData, "data.data", []);

  const patchMutation = usePatchQuery({ queryKey: QUERY_KEY });
  const deleteMutation = useDeleteQuery({ queryKey: QUERY_KEY });

  const {
    search,
    statusFilter,
    filterFields,
    activeFilters,
    handleFiltersChange,
  } = usePromoCodeFilters();

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/premium", title: "Premium" },
      { url: "/admin/premium/promo-codes", title: "Promo kodlar" },
    ]);
  }, [setBreadcrumbs]);

  const deferredSearch = React.useDeferredValue(search);

  const filteredCodes = React.useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return lodashFilter(promoCodes, (code) => {
      if (query) {
        const codeStr = toString(get(code, "code")).toLowerCase();
        const desc = toString(get(code, "description")).toLowerCase();
        if (!codeStr.includes(query) && !desc.includes(query)) return false;
      }

      if (statusFilter !== "all") {
        const isActive = get(code, "isActive");
        if (statusFilter === "active" ? !isActive : isActive) return false;
      }

      return true;
    });
  }, [promoCodes, deferredSearch, statusFilter]);

  const handleToggleActive = React.useCallback(
    async (promoCode) => {
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
    [patchMutation],
  );

  const handleDelete = React.useCallback(
    async (promoCode) => {
      if (!window.confirm(`"${get(promoCode, "code")}" promo kodni o'chirmoqchimisiz?`))
        return;

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
    [deleteMutation],
  );

  const columns = useColumns({
    handleToggleActive,
    onEdit: (promoCode) => navigate(`edit/${get(promoCode, "id")}`),
    onDelete: handleDelete,
  });

  const table = useReactTable({
    data: filteredCodes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => toString(get(row, "id")),
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Promo kodlar</h1>
        <Button onClick={() => navigate("create")} className="gap-1.5">
          <PlusIcon />
          Promo kod qo'shish
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
        {filteredCodes.length} ta promo kod
      </p>

      <DataGridContainer>
        <ScrollArea className="w-full">
          <DataGrid
            table={table}
            tableLayout={{ width: "auto" }}
            loadingMode="none"
            isLoading={isLoading}
          />
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DataGridContainer>

      {!isLoading && !filteredCodes.length ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          Filtrlarga mos promo kod topilmadi.
        </div>
      ) : null}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>
      ) : null}

      <Outlet />
    </div>
  );
};

export default Index;
