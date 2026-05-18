import React from "react";
import { useNavigate, Outlet } from "react-router";
import { PlusIcon, UsersIcon } from "lucide-react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";
import { get, includes, some, isArray, join, trim, values as lodashValues } from "lodash";
import { Button } from "@/components/ui/button";
import {
  AdminListDataGrid,
  AdminListHeader,
  AdminListPageShell,
  AdminListRefetchButton,
  AdminListToolbar,
} from "@/modules/admin/components/admin-list-shell.jsx";
import { buildAdminFilterParams } from "@/modules/admin/components/admin-filter-utils.js";
import { useGetQuery, usePatchQuery, useDeleteQuery } from "@/hooks/api";
import { useAuthStore } from "@/store";
import { useAdminDrawerListNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
import { UserBlockAlert } from "@/modules/admin/components/user-block-alert.jsx";
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
  const navigateAdminDrawer = useAdminDrawerListNavigation();
  const {
    canManageSupport,
    canManageGrowth,
    canBlockUsers,
    canDeleteUsers,
    canGiftPremium: canGiftPremiumAction,
  } = useAdminPermissions();
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
      ...(trim(deferredSearch) ? { q: trim(deferredSearch) } : {}),
      ...buildAdminFilterParams([
        { key: "role", value: roleFilter, operator: roleOperator },
        { key: "status", value: statusFilter, operator: statusOperator },
        { key: "premium", value: premiumFilter, operator: premiumOperator },
      ]),
      sortBy,
      sortDir,
      page: currentPage,
      pageSize,
    }),
    [
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
      queryKey: ["admin-users", ...lodashValues(queryParams)],
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

  const { mutateAsync: extendSubscription, isPending: isExtending } =
    usePatchQuery({
      queryKey: ["admin-users"],
    });

  const totalCount = get(meta, "total", 0);

  const isUserActionPending =
    isUpdating || isDeleting || isExtending;

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
      canGiftPremiumAction &&
      canManageUser(user) &&
      !some(user?.roles ?? [user?.role], (role) =>
        includes(PRIVILEGED_ROLES, role),
      ),
    [canGiftPremiumAction, canManageUser],
  );

  const confirmDelete = React.useCallback(async () => {
    if (!canDeleteUsers || !deleteCandidate) return;

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
        isArray(message) ? join(message, ", ") : message || "O'chirib bo'lmadi",
      );
    }
  }, [
    canDeleteUsers,
    canManageUser,
    deleteCandidate,
    deleteUserMutation,
    refetch,
  ]);

  // --- View / Edit / Gift / Ban / CancelPremium ---
  const [giftUser, setGiftUser] = React.useState(null);
  const [blockCandidate, setBlockCandidate] = React.useState(null);

  const handleView = React.useCallback(
    (user) => {
      navigate(`detail/${user.id}`);
    },
    [navigate],
  );

  const handleEditOpen = React.useCallback(
    (user) => {
      if (!canManageUser(user)) {
        toast.error("Admin accountlarni faqat super admin boshqara oladi");
        return;
      }
      navigateAdminDrawer(`edit/${user.id}`);
    },
    [canManageUser, navigateAdminDrawer],
  );

  const handleCreateOpen = React.useCallback(() => {
    if (!canManageSupport) return;
    navigateAdminDrawer("create");
  }, [canManageSupport, navigateAdminDrawer]);

  const handleGiftOpen = React.useCallback(
    (user) => {
      if (!canGiftPremium(user)) {
        toast.error("Premium faqat oddiy user accountga beriladi");
        return;
      }
      setGiftUser(user);
    },
    [canGiftPremium],
  );

  const handleBanToggle = React.useCallback(
    (user) => {
      if (!canBlockUsers || !canManageUser(user)) {
        toast.error("Admin accountlarni faqat super admin boshqara oladi");
        return;
      }

      setBlockCandidate(user);
    },
    [canBlockUsers, canManageUser],
  );

  const confirmBlockToggle = React.useCallback(async () => {
    if (!canBlockUsers || !blockCandidate) return;

    if (!canManageUser(blockCandidate)) {
      toast.error("Admin accountlarni faqat super admin boshqara oladi");
      return;
    }

    const isBlocked = blockCandidate.status === "banned";

    try {
      await updateUser({
        url: `/admin/users/${blockCandidate.id}/${isBlocked ? "unblock" : "block"}`,
        attributes: {},
      });
      toast.success(
        isBlocked
          ? `${blockCandidate.firstName ?? "User"} blokdan chiqarildi`
          : `${blockCandidate.firstName ?? "User"} bloklandi`,
      );
      setBlockCandidate(null);
      refetch();
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Statusni yangilab bo'lmadi",
      );
    }
  }, [blockCandidate, canBlockUsers, canManageUser, refetch, updateUser]);

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
          isArray(message)
            ? message.join(", ")
            : message || "Premiumni uzaytirib bo'lmadi",
        );
      }
    },
    [canManageGrowth, extendSubscription],
  );

  const handleCancelPremium = React.useCallback(() => {
    toast.info("Premium bekor qilish flowi hali tayyor emas");
  }, []);

  const columns = useColumns({
    currentPage,
    pageSize,
    isUserActionPending,
    canManageSupport,
    canManageGrowth,
    canBlockUsers,
    canDeleteUsers,
    canManageUser,
    canGiftPremium,
    onView: handleView,
    onEdit: handleEditOpen,
    onGift: handleGiftOpen,
    onExtendPremium: handleExtendPremium,
    onCancelPremium: handleCancelPremium,
    onBanToggle: handleBanToggle,
    onDelete: setDeleteCandidate,
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

      <UserBlockAlert
        user={blockCandidate}
        open={Boolean(blockCandidate)}
        onOpenChange={(open) => !open && setBlockCandidate(null)}
        onConfirm={confirmBlockToggle}
        isPending={isUpdating}
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


