import React from "react";
import { useNavigate, Outlet } from "react-router";
import { PlusIcon, RotateCcwIcon, UsersIcon } from "lucide-react";
import {
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { get, includes, some, isArray, join } from "lodash";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DataGrid,
  DataGridContainer,
  DataGridPagination,
  DataGridTable,
} from "@/components/reui/data-grid";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  useGetQuery,
  usePostQuery,
  usePatchQuery,
  useDeleteQuery,
} from "@/hooks/api";
import { useAuthStore } from "@/store";
import { PRIVILEGED_ROLES } from "../config";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useUserFilters } from "./use-filters.js";
import { DeleteAlert } from "./delete-alert.jsx";
import GiftPremiumDrawer from "../components/gift-premium-drawer.jsx";

const DEFAULT_PAGE_SIZE = 10;
const EMPTY_ROLES = [];

const Index = () => {
  const navigate = useNavigate();
  const currentUserRoles = useAuthStore((state) => state.roles ?? EMPTY_ROLES);
  const isSuperAdmin = includes(currentUserRoles, "SUPER_ADMIN");

  const {
    nameFilter,
    nameOperator,
    search,
    roleFilter,
    roleOperator,
    statusFilter,
    statusOperator,
    premiumFilter,
    premiumOperator,
    coachStatusFilter,
    coachStatusOperator,
    sortBy,
    sortDir,
    sorting,
    setPageQuery,
    setPageSizeQuery,
    currentPage,
    pageSize,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  } = useUserFilters();

  const deferredName = React.useDeferredValue(nameFilter);
  const deferredSearch = React.useDeferredValue(search);

  const queryParams = React.useMemo(
    () => ({
      ...(deferredName.trim() ? { name: deferredName.trim() } : {}),
      ...((deferredName.trim() ||
        nameOperator === "empty" ||
        nameOperator === "not_empty") &&
      nameOperator !== "contains"
        ? { nameOp: nameOperator }
        : {}),
      ...(deferredSearch.trim() ? { q: deferredSearch.trim() } : {}),
      ...(roleFilter !== "all" ? { role: roleFilter } : {}),
      ...((roleFilter !== "all" ||
        roleOperator === "empty" ||
        roleOperator === "not_empty") &&
      roleOperator !== "is"
        ? { roleOp: roleOperator }
        : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...((statusFilter !== "all" ||
        statusOperator === "empty" ||
        statusOperator === "not_empty") &&
      statusOperator !== "is"
        ? { statusOp: statusOperator }
        : {}),
      ...(premiumFilter !== "all" ? { premium: premiumFilter } : {}),
      ...((premiumFilter !== "all" ||
        premiumOperator === "empty" ||
        premiumOperator === "not_empty") &&
      premiumOperator !== "is"
        ? { premiumOp: premiumOperator }
        : {}),
      ...(coachStatusFilter !== "all"
        ? { coachStatus: coachStatusFilter }
        : {}),
      ...((coachStatusFilter !== "all" ||
        coachStatusOperator === "empty" ||
        coachStatusOperator === "not_empty") &&
      coachStatusOperator !== "is"
        ? { coachStatusOp: coachStatusOperator }
        : {}),
      sortBy,
      sortDir,
      page: currentPage,
      pageSize,
    }),
    [
      coachStatusFilter,
      coachStatusOperator,
      currentPage,
      deferredName,
      deferredSearch,
      nameOperator,
      pageSize,
      premiumFilter,
      premiumOperator,
      roleFilter,
      roleOperator,
      sortBy,
      sortDir,
      statusFilter,
      statusOperator,
    ],
  );

  // --- Data fetching (direct API hooks) ---
  const {
    data: usersData,
    isLoading,
    isFetching,
    refetch,
  } = useGetQuery({
    url: "/admin/users",
    params: queryParams,
    queryProps: {
      queryKey: ["admin-users", ...Object.values(queryParams)],
    },
  });

  const users = get(usersData, "data.data", []);
  const meta = get(usersData, "data.meta", {});

  // --- Mutations ---
  const { mutateAsync: updateUser, isPending: isUpdating } = usePatchQuery({
    queryKey: ["admin-users"],
  });

  const { mutateAsync: deleteUserMutation, isPending: isDeleting } =
    useDeleteQuery({
      queryKey: ["admin-users"],
    });

  const { mutateAsync: giftPremium, isPending: isGiftingPremium } =
    usePostQuery({
      queryKey: ["admin-users"],
    });

  const { mutateAsync: extendSubscription, isPending: isExtending } =
    usePatchQuery({
      queryKey: ["admin-users"],
    });

  const { mutateAsync: cancelSubscription } = usePatchQuery({
    queryKey: ["admin-users"],
  });

  const { mutateAsync: updateCoachStatus, isPending: isUpdatingCoachStatus } =
    usePatchQuery({
      queryKey: ["admin-users"],
    });

  const totalCount = get(meta, "total", 0);

  const isUserActionPending =
    isUpdating ||
    isDeleting ||
    isGiftingPremium ||
    isExtending ||
    isUpdatingCoachStatus;

  // --- Delete ---
  const [deleteCandidate, setDeleteCandidate] = React.useState(null);

  const canManageUser = React.useCallback(
    (user) =>
      isSuperAdmin ||
      !some(user?.roles ?? [user?.role], (role) =>
        includes(PRIVILEGED_ROLES, role),
      ),
    [isSuperAdmin],
  );

  const canGiftPremium = React.useCallback(
    (user) =>
      canManageUser(user) &&
      !some(user?.roles ?? [user?.role], (role) =>
        includes(PRIVILEGED_ROLES, role),
      ),
    [canManageUser],
  );

  const confirmDelete = React.useCallback(async () => {
    if (!deleteCandidate) return;

    if (!canManageUser(deleteCandidate)) {
      toast.error("Admin accountlarni faqat super admin o'chira oladi");
      return;
    }

    try {
      await deleteUserMutation({
        url: `/admin/users/${deleteCandidate.id}`,
      });
      toast.success("Foydalanuvchi o'chirildi");
      setDeleteCandidate(null);
      refetch();
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        isArray(message)
          ? join(message, ", ")
          : message || "O'chirib bo'lmadi",
      );
    }
  }, [canManageUser, deleteCandidate, deleteUserMutation, refetch]);

  // --- View / Edit / Gift / Ban / CoachStatus / CancelPremium ---
  const [viewUser, setViewUser] = React.useState(null);
  const [giftUser, setGiftUser] = React.useState(null);
  const [cancelPremiumUser, setCancelPremiumUser] = React.useState(null);

  const handleView = React.useCallback((user) => {
    setViewUser(user);
  }, []);

  const handleEditOpen = React.useCallback(
    (user) => {
      if (!canManageUser(user)) {
        toast.error("Admin accountlarni faqat super admin boshqara oladi");
        return;
      }
      navigate(`edit/${user.id}`);
    },
    [canManageUser, navigate],
  );

  const handleCreateOpen = React.useCallback(() => {
    navigate("create");
  }, [navigate]);

  const handleGiftOpen = React.useCallback(
    (user) => {
      if (!canGiftPremium(user)) {
        toast.error("Premium faqat oddiy user yoki coach accountga beriladi");
        return;
      }
      setGiftUser(user);
    },
    [canGiftPremium],
  );

  const handleBanToggle = React.useCallback(
    async (user) => {
      if (!canManageUser(user)) {
        toast.error("Admin accountlarni faqat super admin boshqara oladi");
        return;
      }

      try {
        const nextStatus = user.status === "banned" ? "active" : "banned";
        await updateUser({
          url: `/admin/users/${user.id}`,
          attributes: { status: nextStatus },
        });
        toast.success(
          nextStatus === "banned"
            ? `${user.firstName ?? "User"} bloklandi`
            : `${user.firstName ?? "User"} blokdan chiqarildi`,
        );
      } catch (error) {
        const message = get(error, "response.data.message");
        toast.error(
          Array.isArray(message)
            ? message.join(", ")
            : message || "Statusni yangilab bo'lmadi",
        );
      }
    },
    [canManageUser, updateUser],
  );

  const handleExtendPremium = React.useCallback(
    async (user) => {
      if (!user?.premium?.id) {
        toast.error("Foydalanuvchida premium obuna yo'q");
        return;
      }

      try {
        await extendSubscription({
          url: `/admin/subscriptions/${user.premium.id}/extend`,
          attributes: {},
        });
        toast.success("Premium uzaytirildi");
      } catch (error) {
        const message = get(error, "response.data.message");
        toast.error(
          Array.isArray(message)
            ? message.join(", ")
            : message || "Premiumni uzaytirib bo'lmadi",
        );
      }
    },
    [extendSubscription],
  );

  const handleCoachStatusUpdate = React.useCallback(
    async (user, nextStatus) => {
      try {
        await updateCoachStatus({
          url: `/admin/coaches/${user.id}/status`,
          attributes: { status: nextStatus },
        });
        toast.success(
          nextStatus === "approved"
            ? `${user.firstName ?? "User"} coach sifatida tasdiqlandi`
            : `${user.firstName ?? "User"} coach arizasi rad etildi`,
        );
      } catch (error) {
        const message = get(error, "response.data.message");
        toast.error(
          Array.isArray(message)
            ? message.join(", ")
            : message || "Coach holatini yangilab bo'lmadi",
        );
      }
    },
    [updateCoachStatus],
  );

  const columns = useColumns({
    currentPage,
    pageSize,
    isUserActionPending,
    canManageUser,
    canGiftPremium,
    onView: handleView,
    onEdit: handleEditOpen,
    onGift: handleGiftOpen,
    onExtendPremium: handleExtendPremium,
    onCancelPremium: setCancelPremiumUser,
    onBanToggle: handleBanToggle,
    onDelete: setDeleteCandidate,
    onCoachStatusUpdate: handleCoachStatusUpdate,
  });

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting, pagination: { pageIndex: currentPage - 1, pageSize } },
    onSortingChange: handleSortingChange,
    onPaginationChange: (updater) => {
      const previous = { pageIndex: currentPage - 1, pageSize };
      const next = typeof updater === "function" ? updater(previous) : updater;
      React.startTransition(() => {
        void setPageQuery(String(get(next, "pageIndex", 0) + 1));
        void setPageSizeQuery(String(get(next, "pageSize", DEFAULT_PAGE_SIZE)));
      });
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    rowCount: totalCount,
    getRowId: (row) => String(row.id),
  });

  return (
    <PageTransition>
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UsersIcon className="size-6" />
            Foydalanuvchilar
          </h1>
          <p className="text-sm text-muted-foreground">
            Real user accountlar va rollarni boshqaring
          </p>
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
              className="hidden sm:flex"
              disabled={isFetching}
            >
              <RotateCcwIcon className={cn("size-4", isFetching && "animate-spin")} />
            </Button>
            <Button onClick={handleCreateOpen} className="gap-1.5">
              <PlusIcon className="size-4" />
              Foydalanuvchi qo'shish
            </Button>
          </div>
        </div>

        <DataGrid
          table={table}
          isLoading={isLoading || isFetching}
          recordCount={totalCount}
        >
          <DataGridContainer>
            <ScrollArea className="w-full">
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
          <DataGridPagination table={table} />
        </DataGrid>

        <DeleteAlert
          user={deleteCandidate}
          open={Boolean(deleteCandidate)}
          onOpenChange={(open) => !open && setDeleteCandidate(null)}
          onConfirm={confirmDelete}
        />

        <GiftPremiumDrawer
          user={giftUser}
          open={Boolean(giftUser)}
          onOpenChange={(open) => {
            if (!open) setGiftUser(null);
          }}
        />

        <Outlet />
      </div>
    </PageTransition>
  );
};

export default Index;
