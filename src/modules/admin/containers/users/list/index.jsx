import React from "react";
import { useNavigate, Outlet } from "react-router";
import { PlusIcon, UsersIcon } from "lucide-react";
import {
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { get, includes, some, isArray, join } from "lodash";
import { Button } from "@/components/ui/button";
import {
  AdminListDataGrid,
  AdminListHeader,
  AdminListPageShell,
  AdminListRefetchButton,
  AdminListToolbar,
} from "@/modules/admin/components/admin-list-shell.jsx";
import { buildAdminFilterParams } from "@/modules/admin/components/admin-filter-utils.js";
import {
  useGetQuery,
  usePostQuery,
  usePatchQuery,
  useDeleteQuery,
} from "@/hooks/api";
import { useAuthStore } from "@/store";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
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
  const { canManageSupport, canManageGrowth } = useAdminPermissions();
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
      ...buildAdminFilterParams([
        {
          key: "name",
          value: deferredName,
          operator: nameOperator,
          defaultOperator: "contains",
          emptyValue: "",
          trim: true,
        },
      ]),
      ...(deferredSearch.trim() ? { q: deferredSearch.trim() } : {}),
      ...buildAdminFilterParams([
        { key: "role", value: roleFilter, operator: roleOperator },
        { key: "status", value: statusFilter, operator: statusOperator },
        { key: "premium", value: premiumFilter, operator: premiumOperator },
        {
          key: "coachStatus",
          value: coachStatusFilter,
          operator: coachStatusOperator,
        },
      ]),
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
      canManageSupport &&
      (isSuperAdmin ||
        !some(user?.roles ?? [user?.role], (role) =>
          includes(PRIVILEGED_ROLES, role),
        )),
    [canManageSupport, isSuperAdmin],
  );

  const canGiftPremium = React.useCallback(
    (user) =>
      canManageGrowth &&
      canManageUser(user) &&
      !some(user?.roles ?? [user?.role], (role) =>
        includes(PRIVILEGED_ROLES, role),
      ),
    [canManageGrowth, canManageUser],
  );

  const confirmDelete = React.useCallback(async () => {
    if (!canManageSupport || !deleteCandidate) return;

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
  }, [canManageSupport, canManageUser, deleteCandidate, deleteUserMutation, refetch]);

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
    if (!canManageSupport) return;
    navigate("create");
  }, [canManageSupport, navigate]);

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
      if (!canManageGrowth) return;

      if (!user?.premium?.id) {
        toast.error("Foydalanuvchida premium obuna yo'q");
        return;
      }

      try {
        await extendSubscription({
          url: `/admin/premium/subscriptions/${user.premium.id}/extend`,
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
    [canManageGrowth, extendSubscription],
  );

  const handleCoachStatusUpdate = React.useCallback(
    async (user, nextStatus) => {
      if (!canManageSupport) return;

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
    [canManageSupport, updateCoachStatus],
  );

  const columns = useColumns({
    currentPage,
    pageSize,
    isUserActionPending,
    canManageSupport,
    canManageGrowth,
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
    <AdminListPageShell>
      <AdminListHeader
        icon={UsersIcon}
        title="Foydalanuvchilar"
        description="Real user accountlar va rollarni boshqaring"
      />

      <AdminListToolbar
        filters={
          <Filter
            filterFields={filterFields}
            activeFilters={activeFilters}
            handleFiltersChange={handleFiltersChange}
          />
        }
        actions={
          <>
            <AdminListRefetchButton
              onClick={() => refetch()}
              isFetching={isFetching}
            />
            {canManageSupport ? (
              <Button onClick={handleCreateOpen} className="gap-1.5">
                <PlusIcon className="size-4" />
                Foydalanuvchi qo'shish
              </Button>
            ) : null}
          </>
        }
      />

      <AdminListDataGrid
        table={table}
        isLoading={isLoading || isFetching}
        recordCount={totalCount}
        paginationProps={{ table }}
      />

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
    </AdminListPageShell>
  );
};

export default Index;
