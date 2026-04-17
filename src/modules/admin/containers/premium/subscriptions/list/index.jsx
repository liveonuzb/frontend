import React from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { get, isArray, join, toString } from "lodash";
import { toast } from "sonner";
import { RotateCcwIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useBreadcrumbStore } from "@/store";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useSubscriptionFilters } from "./use-filters.js";
import { CancelAlert } from "./cancel-alert.jsx";

const SUBSCRIPTIONS_QUERY_KEY = ["admin", "premium-subscriptions"];

const Index = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const queryClient = useQueryClient();

  const {
    search,
    statusFilter,
    typeFilter,
    autoRenewFilter,
    currentPage,
    pageSize,
    filterFields,
    activeFilters,
    handleFiltersChange,
  } = useSubscriptionFilters();

  const [cancelCandidate, setCancelCandidate] = React.useState(null);
  const [extendDialog, setExtendDialog] = React.useState({
    open: false,
    subscriptionId: null,
  });
  const [extendDays, setExtendDays] = React.useState(30);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/premium", title: "Premium" },
      { url: "/admin/premium/subscriptions", title: "Obunalar" },
    ]);
  }, [setBreadcrumbs]);

  const queryParams = React.useMemo(
    () => ({
      q: get(search, "length") ? search.trim() : undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      type: typeFilter === "all" ? undefined : typeFilter,
      autoRenew:
        autoRenewFilter === "all"
          ? undefined
          : autoRenewFilter === "on"
            ? true
            : false,
      page: currentPage,
      pageSize,
      sortBy: "createdAt",
      sortDir: "desc",
    }),
    [search, statusFilter, typeFilter, autoRenewFilter, currentPage, pageSize],
  );

  const {
    data: subscriptionsData,
    isLoading,
    isFetching,
    refetch,
  } = useGetQuery({
    url: "/admin/premium/subscriptions",
    params: queryParams,
    queryProps: {
      queryKey: [...SUBSCRIPTIONS_QUERY_KEY, queryParams],
    },
  });

  const subscriptions = get(subscriptionsData, "data.data", []);
  const totalItems = get(subscriptionsData, "data.meta.total", 0);

  const cancelMutation = usePatchQuery({
    queryKey: SUBSCRIPTIONS_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: SUBSCRIPTIONS_QUERY_KEY,
        });
      },
    },
  });

  const extendMutation = usePatchQuery({
    queryKey: SUBSCRIPTIONS_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: SUBSCRIPTIONS_QUERY_KEY,
        });
      },
    },
  });

  const toggleAutoRenewMutation = usePatchQuery({
    queryKey: SUBSCRIPTIONS_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: SUBSCRIPTIONS_QUERY_KEY,
        });
      },
    },
  });

  const handleCancel = React.useCallback(async () => {
    if (!cancelCandidate) return;
    try {
      await cancelMutation.mutateAsync({
        url: `/admin/premium/subscriptions/${get(cancelCandidate, "id")}/cancel`,
        attributes: {},
      });
      toast.success("Obuna bekor qilindi");
      setCancelCandidate(null);
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        isArray(message)
          ? join(message, ", ")
          : message || "Xatolik yuz berdi",
      );
    }
  }, [cancelCandidate, cancelMutation]);

  const handleExtend = React.useCallback(async () => {
    if (!extendDialog.subscriptionId) return;
    try {
      const days = Number(extendDays);
      await extendMutation.mutateAsync({
        url: `/admin/premium/subscriptions/${extendDialog.subscriptionId}/extend`,
        attributes: days ? { days } : {},
      });
      toast.success("Obuna muddati uzaytirildi");
      setExtendDialog({ open: false, subscriptionId: null });
      setExtendDays(30);
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        isArray(message)
          ? join(message, ", ")
          : message || "Xatolik yuz berdi",
      );
    }
  }, [extendDialog.subscriptionId, extendDays, extendMutation]);

  const handleToggleAutoRenew = React.useCallback(
    async (subscriptionId) => {
      try {
        await toggleAutoRenewMutation.mutateAsync({
          url: `/admin/premium/subscriptions/${subscriptionId}/toggle-auto-renew`,
          attributes: {},
        });
        toast.success("Auto-renew holati o'zgartirildi");
      } catch (error) {
        const message = get(error, "response.data.message");
        toast.error(
          isArray(message)
            ? join(message, ", ")
            : message || "Auto-renew holatini o'zgartirib bo'lmadi",
        );
      }
    },
    [toggleAutoRenewMutation],
  );

  const columns = useColumns({
    onExtend: (subscription) =>
      setExtendDialog({ open: true, subscriptionId: get(subscription, "id") }),
    onCancel: setCancelCandidate,
    onToggleAutoRenew: handleToggleAutoRenew,
  });

  const table = useReactTable({
    data: subscriptions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => toString(get(row, "id")),
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Obunalar</h1>
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
          <RotateCcwIcon
            className={cn("size-4", isFetching && "animate-spin")}
          />
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {totalItems} ta obuna
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

      {!isLoading && !subscriptions.length ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          Filtrlarga mos obuna topilmadi.
        </div>
      ) : null}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>
      ) : null}

      {/* Extend Dialog */}
      <Dialog
        open={extendDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setExtendDialog({ open: false, subscriptionId: null });
            setExtendDays(30);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Obunani uzaytirish</DialogTitle>
            <DialogDescription>
              Obuna muddatini necha kunga uzaytirmoqchisiz?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-4">
            <Label>Kunlar soni</Label>
            <Input
              type="number"
              value={extendDays}
              onChange={(e) => setExtendDays(get(e, "target.value"))}
              placeholder="30"
              min={1}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setExtendDialog({ open: false, subscriptionId: null });
                setExtendDays(30);
              }}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={handleExtend}
              disabled={extendMutation.isPending}
            >
              Uzaytirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Alert */}
      <CancelAlert
        subscription={cancelCandidate}
        open={Boolean(cancelCandidate)}
        onOpenChange={(open) => {
          if (!open) setCancelCandidate(null);
        }}
        onConfirm={handleCancel}
      />
    </div>
  );
};

export default Index;
