import React from "react";
import { Outlet, useNavigate } from "react-router";
import { filter, get, isArray, join, map, toString } from "lodash";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";
import { AwardIcon, PlusIcon } from "lucide-react";
import { useBreadcrumbStore, useAppModeStore, useLanguageStore } from "@/store";
import { useDeleteQuery, useGetQuery, usePatchQuery } from "@/hooks/api";
import {
  AdminListDataGrid,
  AdminListHeader,
  AdminListPageShell,
  AdminListRefetchButton,
  AdminListToolbar,
} from "@/modules/admin/components/admin-list-shell.jsx";
import { buildAdminFilterParams } from "@/modules/admin/components/admin-filter-utils.js";
import { buildAdminReorderPayload } from "@/modules/admin/components/admin-list-reorder.js";
import { Button } from "@/components/ui/button";
import { useAdminDrawerListNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
import {
  ADMIN_ACHIEVEMENTS_QUERY_KEY,
  resolveAchievementApiErrorMessage,
} from "../api";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useAchievementFilters } from "./use-filters.js";
import { DeleteAlert } from "./delete-alert.jsx";

const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  return isArray(message) ? join(message, ", ") : message || fallback;
};

const AchievementsListPage = () => {
  const navigate = useNavigate();
  const navigateAdminDrawer = useAdminDrawerListNavigation();
  const { canManageContent } = useAdminPermissions();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentMode = useAppModeStore((state) => state.mode) || "madagascar";
  const currentLanguage = useLanguageStore((state) => state.currentLanguage) || "uz";
  const {
    nameFilter,
    nameOperator,
    categoryFilter,
    categoryOperator,
    metricFilter,
    metricOperator,
    statusFilter,
    statusOperator,
    hasImageFilter,
    hasImageOperator,
    imageModeFilter,
    translationsFilter,
    translationsOperator,
    setPageQuery,
    setPageSizeQuery,
    currentPage,
    pageSize,
    canReorder,
    sortBy,
    sortDir,
    sorting,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  } = useAchievementFilters();

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/achievements", title: "Achievements" },
    ]);
  }, [setBreadcrumbs]);

  const deferredName = React.useDeferredValue(nameFilter);
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
        {
          key: "category",
          value: categoryFilter,
          operator: categoryOperator,
        },
        { key: "metric", value: metricFilter, operator: metricOperator },
        { key: "status", value: statusFilter, operator: statusOperator },
        {
          key: "hasImage",
          value: hasImageFilter,
          operator: hasImageOperator,
        },
      ]),
      ...(imageModeFilter !== "any" ? { imageMode: imageModeFilter } : {}),
      ...buildAdminFilterParams([
        {
          key: "translations",
          value: translationsFilter,
          operator: translationsOperator,
        },
      ]),
      sortBy,
      sortDir,
      page: currentPage,
      pageSize,
    }),
    [
      categoryFilter,
      categoryOperator,
      currentPage,
      deferredName,
      hasImageFilter,
      hasImageOperator,
      imageModeFilter,
      metricFilter,
      metricOperator,
      nameOperator,
      pageSize,
      sortBy,
      sortDir,
      statusFilter,
      statusOperator,
      translationsFilter,
      translationsOperator,
    ],
  );

  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: {
      queryKey: ["admin", "languages"],
    },
  });
  const activeLanguages = React.useMemo(
    () => filter(get(languagesData, "data.data", []), (language) => language.isActive),
    [languagesData],
  );

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useGetQuery({
    url: "/admin/achievements",
    params: queryParams,
    queryProps: {
      queryKey: [...ADMIN_ACHIEVEMENTS_QUERY_KEY, queryParams],
    },
  });

  const items = get(data, "data.data", []);
  const hasMeta = Boolean(get(data, "data.meta"));
  const meta = get(data, "data.meta", {
    total: 0,
    page: currentPage,
    pageSize,
    totalPages: currentPage,
  });

  const { mutateAsync: patchItem, isPending: isUpdating } = usePatchQuery({
    queryKey: ADMIN_ACHIEVEMENTS_QUERY_KEY,
  });
  const { mutateAsync: removeItem, isPending: isDeleting } = useDeleteQuery({
    queryKey: ADMIN_ACHIEVEMENTS_QUERY_KEY,
  });
  const { mutateAsync: patchReorder, isPending: isReordering } = usePatchQuery({
    queryKey: ADMIN_ACHIEVEMENTS_QUERY_KEY,
  });
  const [itemToDelete, setItemToDelete] = React.useState(null);

  React.useEffect(() => {
    if (!hasMeta) return;

    const totalPages = get(meta, "totalPages", 1);
    if (currentPage > totalPages) {
      void setPageQuery(String(totalPages));
    }
  }, [currentPage, hasMeta, meta, setPageQuery]);

  const updateItem = React.useCallback(
    async (id, payload) =>
      patchItem({
        url: `/admin/achievements/${id}`,
        attributes: payload,
      }),
    [patchItem],
  );

  const handleToggleActive = async (item) => {
    if (!canManageContent) return;

    try {
      await updateItem(get(item, "id"), {
        isActive: !get(item, "isActive"),
      });
      toast.success("Status yangilandi");
    } catch (error) {
      toast.error(getErrorMessage(error, "Statusni yangilab bo'lmadi"));
    }
  };

  const handleDelete = async () => {
    if (!canManageContent || !itemToDelete) return;

    try {
      await removeItem({
        url: `/admin/achievements/${get(itemToDelete, "id")}`,
      });
      toast.success("Achievement o'chirildi");
      setItemToDelete(null);
    } catch (error) {
      toast.error(
        resolveAchievementApiErrorMessage(
          error,
          "Achievementni o'chirib bo'lmadi.",
        ),
      );
    }
  };

  const handleDragEnd = async (event) => {
    if (!canManageContent || !canReorder) return;

    const { active, over } = event;

    if (!active || !over || active.id === over.id) {
      return;
    }

    const reorderPayload = buildAdminReorderPayload({
      items,
      activeId: active.id,
      overId: over.id,
      getId: (item) => get(item, "id"),
    });

    if (!reorderPayload) return;

    try {
      await patchReorder({
        url: "/admin/achievements/reorder",
        attributes: {
          movedId: reorderPayload.movedId,
          prevId: reorderPayload.prevId,
          nextId: reorderPayload.nextId,
        },
      });
      toast.success("Tartib yangilandi");
    } catch (error) {
      toast.error(getErrorMessage(error, "Tartibni saqlab bo'lmadi"));
    }
  };

  const columns = useColumns({
    activeLanguages,
    canManage: canManageContent,
    canReorder: canManageContent && canReorder,
    currentMode,
    currentLanguage,
    isUpdating: isUpdating || isReordering,
    onToggleActive: handleToggleActive,
    onImages: (item) => navigate(`images/${get(item, "id")}`),
    onTranslate: (item) => navigate(`translate/${get(item, "id")}`),
    onEdit: (item) => navigateAdminDrawer(`edit/${get(item, "id")}`),
    onDelete: setItemToDelete,
  });

  const table = useReactTable({
    data: items,
    columns,
    manualSorting: true,
    manualPagination: true,
    pageCount: get(meta, "totalPages", 1),
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => toString(get(row, "id")),
    onSortingChange: handleSortingChange,
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
      sorting,
      pagination: { pageIndex: currentPage - 1, pageSize },
    },
  });

  return (
    <AdminListPageShell>
      <AdminListHeader
        icon={AwardIcon}
        title="Achievements"
        description="Foydalanuvchi yutuqlarini qo'shing va boshqaring"
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
            {canManageContent ? (
              <Button onClick={() => navigateAdminDrawer("create")} className="gap-1.5">
                <PlusIcon />
                Achievement qo'shish
              </Button>
            ) : null}
          </>
        }
      />

      <AdminListDataGrid
        table={table}
        isLoading={isLoading}
        recordCount={get(meta, "total", 0)}
        canUseDnd={canManageContent && canReorder}
        dataIds={map(items, (item) => toString(get(item, "id")))}
        onDragEnd={handleDragEnd}
        reorderHint={
          canManageContent && !canReorder
            ? "Tartiblash faqat filterlarsiz va birinchi sahifada ishlaydi."
            : null
        }
        paginationInfo="{from} - {to} / {count} ta achievement"
      />

      <DeleteAlert
        item={itemToDelete}
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      <Outlet />
    </AdminListPageShell>
  );
};

export default AchievementsListPage;
