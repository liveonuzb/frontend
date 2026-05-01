import React from "react";
import { Outlet, useNavigate } from "react-router";
import { get, isArray, join, trim } from "lodash";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";
import { ShieldCheckIcon, RotateCcwIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import { useBreadcrumbStore } from "@/store";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useCoachFilters } from "./use-filters.js";

const Index = () => {
  const navigate = useNavigate();
  const { canManageSupport } = useAdminPermissions();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const {
    currentPage,
    pageSize,
    filterFields,
    activeFilters,
    handleFiltersChange,
    search,
    coachStatusFilter,
  } = useCoachFilters();

  const queryParams = React.useMemo(
    () => ({
      role: "COACH",
      coachStatus: coachStatusFilter === "all" ? undefined : coachStatusFilter,
      q: trim(search) || undefined,
      page: currentPage,
      pageSize,
      sortBy: "createdAt",
      sortDir: "desc",
    }),
    [coachStatusFilter, currentPage, pageSize, search],
  );

  const {
    data: usersData,
    isLoading,
    isFetching,
    refetch,
  } = useGetQuery({
    url: "/admin/users",
    params: queryParams,
    queryProps: {
      queryKey: ["admin", "users", queryParams],
    },
  });
  const coaches = get(usersData, "data.data", []);

  const { mutateAsync: patchCoachStatus } = usePatchQuery({
    queryKey: ["admin", "users"],
    listKey: ["admin", "dashboard"],
  });
  const { mutateAsync: patchMarketplaceStatus } = usePatchQuery({
    queryKey: ["admin", "users"],
    listKey: ["admin", "dashboard"],
  });

  const updateCoachStatus = React.useCallback(
    async (userId, status) =>
      patchCoachStatus({
        url: `/admin/coaches/${userId}/status`,
        attributes: { status },
      }),
    [patchCoachStatus],
  );

  const updateCoachMarketplaceStatus = React.useCallback(
    async (userId, status, note) =>
      patchMarketplaceStatus({
        url: `/admin/coaches/${userId}/marketplace-status`,
        attributes: {
          status,
          ...(note ? { note } : {}),
        },
      }),
    [patchMarketplaceStatus],
  );
  const [pendingCoachIds, setPendingCoachIds] = React.useState({});

  const setCoachPendingState = React.useCallback((coachId, isPending) => {
    if (!coachId) return;

    setPendingCoachIds((current) => {
      if (isPending) {
        if (get(current, coachId)) return current;
        return { ...current, [coachId]: true };
      }

      if (!get(current, coachId)) return current;
      const next = { ...current };
      delete next[coachId];
      return next;
    });
  }, []);

  const isCoachActionPending = React.useCallback(
    (coachId) => Boolean(coachId && get(pendingCoachIds, coachId)),
    [pendingCoachIds],
  );

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/coaches", title: "Murabbiylar" },
    ]);
  }, [setBreadcrumbs]);

  const handleStatusUpdate = React.useCallback(
    async (coachId, status) => {
      if (!canManageSupport) return;

      setCoachPendingState(coachId, true);
      try {
        await updateCoachStatus(coachId, status);
        toast.success(
          status === "approved"
            ? "Murabbiy tasdiqlandi"
            : "Murabbiy rad etildi",
        );
      } catch (error) {
        const message = get(error, "response.data.message");
        toast.error(
          isArray(message)
            ? join(message, ", ")
            : message || "Xatolik yuz berdi",
        );
      } finally {
        setCoachPendingState(coachId, false);
      }
    },
    [canManageSupport, setCoachPendingState, updateCoachStatus],
  );

  const handleMarketplaceStatusUpdate = React.useCallback(
    async (coachId, status, successText) => {
      if (!canManageSupport) return;

      setCoachPendingState(coachId, true);
      try {
        await updateCoachMarketplaceStatus(coachId, status);
        toast.success(successText);
      } catch (error) {
        const message = get(error, "response.data.message");
        toast.error(
          isArray(message)
            ? join(message, ", ")
            : message || "Marketplace holatini yangilab bo'lmadi",
        );
      } finally {
        setCoachPendingState(coachId, false);
      }
    },
    [canManageSupport, setCoachPendingState, updateCoachMarketplaceStatus],
  );

  const handleViewCoach = React.useCallback(
    (coach) => {
      const coachId = get(coach, "id");
      if (coachId) {
        navigate(`detail/${coachId}`);
      }
    },
    [navigate],
  );

  const columns = useColumns({
    canManageSupport,
    isCoachActionPending,
    onView: handleViewCoach,
    onStatusUpdate: handleStatusUpdate,
    onMarketplaceUpdate: handleMarketplaceStatusUpdate,
  });

  const table = useReactTable({
    data: coaches || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <ShieldCheckIcon className="text-primary" />
            Murabbiylarni boshqarish
          </h1>
          <p className="text-sm text-muted-foreground">
            Platformaga qo'shilish uchun ariza topshirgan mutaxassislarni ko'rib
            chiqing va tasdiqlang.
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
            className="hidden sm:flex"
            disabled={isFetching}
          >
            <RotateCcwIcon
              className={cn("size-4", isFetching && "animate-spin")}
            />
          </Button>
        </div>

        <DataGridContainer>
          <ScrollArea className="w-full">
            <DataGrid table={table} isLoading={isLoading}>
              <DataGridTable />
            </DataGrid>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DataGridContainer>

        <Outlet />
      </div>
    </PageTransition>
  );
};

export default Index;
