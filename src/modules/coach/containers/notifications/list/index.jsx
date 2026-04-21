import React from "react";
import { chain, get, isArray, map as lodashMap } from "lodash";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";
import { CheckCheckIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { useBreadcrumbStore } from "@/store";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import {
  BulkActionsBar,
  LifecycleTabs,
  ListHeader,
} from "@/modules/coach/components/data-grid-helpers";
import {
  useCoachNotifications,
  useCoachNotificationsMutations,
} from "@/modules/coach/lib/hooks/useCoachNotifications";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useNotificationFilters } from "./use-filters.js";
import { SoftDeleteAlert, HardDeleteAlert } from "./delete-alert.jsx";

const NotificationsListPage = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();

  const {
    search,
    type,
    read,
    lifecycle,
    setLifecycle,
    sortBy,
    sortDir,
    currentPage,
    pageSize,
    setPageQuery,
    sorting,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  } = useNotificationFilters();

  const deferredSearch = React.useDeferredValue(search);

  const queryParams = React.useMemo(
    () => ({
      ...(deferredSearch.trim() ? { q: deferredSearch.trim() } : {}),
      ...(type !== "all" ? { type } : {}),
      ...(read !== "all" ? { read } : {}),
      lifecycle,
      sortBy,
      sortDir,
      page: currentPage,
      pageSize,
    }),
    [deferredSearch, type, read, lifecycle, sortBy, sortDir, currentPage, pageSize],
  );

  const { data, isLoading, isFetching } = useCoachNotifications(queryParams);
  const notifications = get(data, "data.data", []);
  const meta = get(data, "data.meta", { total: 0, page: 1, pageSize: 10, totalPages: 1 });

  const mutations = useCoachNotificationsMutations();

  const [rowSelection, setRowSelection] = React.useState({});
  const [notificationToSoftDelete, setNotificationToSoftDelete] = React.useState(null);
  const [hardDeleteTarget, setHardDeleteTarget] = React.useState(null);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: "Coach" },
      { url: "/coach/notifications", title: "Bildirishnomalar" },
    ]);
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    const totalPages = get(meta, "totalPages", 1);
    if (currentPage > totalPages) {
      void setPageQuery(String(totalPages));
    }
  }, [currentPage, meta, setPageQuery]);

  React.useEffect(() => {
    setRowSelection({});
  }, [search, type, read, lifecycle, sortBy, sortDir, currentPage]);

  const selectedIds = React.useMemo(
    () =>
      chain(rowSelection)
        .entries()
        .filter(([, selected]) => Boolean(selected))
        .map(([id]) => Number(id))
        .filter((id) => Number.isInteger(id))
        .value(),
    [rowSelection],
  );

  const selectedCount = selectedIds.length;

  const handleMarkRead = async (notification) => {
    try {
      await mutations.updateResourceStatus(notification.id, { read: true });
      toast.success("Bildirishnoma o'qilgan deb belgilandi");
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(isArray(message) ? message.join(", ") : message || "Belgilab bo'lmadi");
    }
  };

  const handleSoftDelete = async () => {
    if (!notificationToSoftDelete) return;
    try {
      await mutations.removeResource(notificationToSoftDelete.id);
      toast.success("Bildirishnoma trashga yuborildi");
      setNotificationToSoftDelete(null);
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(isArray(message) ? message.join(", ") : message || "O'chirib bo'lmadi");
    }
  };

  const handleRestore = async (notification) => {
    try {
      await mutations.restoreResource(notification.id);
      toast.success("Bildirishnoma tiklandi");
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(isArray(message) ? message.join(", ") : message || "Tiklab bo'lmadi");
    }
  };

  const handleHardDelete = async () => {
    if (!hardDeleteTarget?.ids?.length) return;
    try {
      await mutations.bulkHardDeleteResources({ ids: hardDeleteTarget.ids });
      toast.success(
        hardDeleteTarget.ids.length === 1
          ? "Bildirishnoma butunlay o'chirildi"
          : `${hardDeleteTarget.ids.length} ta bildirishnoma butunlay o'chirildi`,
      );
      setHardDeleteTarget(null);
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(isArray(message) ? message.join(", ") : message || "O'chirib bo'lmadi");
    }
  };

  const handleBulkMarkRead = async () => {
    if (!selectedIds.length) return;
    try {
      await mutations.bulkUpdateStatus({ ids: selectedIds, read: true });
      toast.success(`${selectedIds.length} ta bildirishnoma o'qilgan deb belgilandi`);
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(isArray(message) ? message.join(", ") : message || "Belgilab bo'lmadi");
    }
  };

  const handleBulkTrash = async () => {
    if (!selectedIds.length) return;
    try {
      await mutations.bulkTrashResources({ ids: selectedIds });
      toast.success(`${selectedIds.length} ta bildirishnoma trashga yuborildi`);
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(isArray(message) ? message.join(", ") : message || "Trashga yuborib bo'lmadi");
    }
  };

  const handleBulkRestore = async () => {
    if (!selectedIds.length) return;
    try {
      await mutations.bulkRestoreResources({ ids: selectedIds });
      toast.success(`${selectedIds.length} ta bildirishnoma tiklandi`);
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(isArray(message) ? message.join(", ") : message || "Tiklab bo'lmadi");
    }
  };

  const handleBulkHardDelete = () => {
    if (!selectedIds.length) return;
    setHardDeleteTarget({ ids: selectedIds });
  };

  const columns = useColumns({
    currentPage,
    pageSize,
    onMarkRead: handleMarkRead,
    onSoftDelete: setNotificationToSoftDelete,
    onRestore: handleRestore,
    onHardDelete: setHardDeleteTarget,
  });

  const table = useReactTable({
    data: notifications,
    columns,
    manualSorting: true,
    manualPagination: true,
    pageCount: get(meta, "totalPages", 1),
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id.toString(),
    onRowSelectionChange: setRowSelection,
    onSortingChange: handleSortingChange,
    onPaginationChange: (updater) => {
      const prev = { pageIndex: currentPage - 1, pageSize };
      const next = typeof updater === "function" ? updater(prev) : updater;
      React.startTransition(() => {
        void setPageQuery(String(next.pageIndex + 1));
      });
    },
    state: {
      rowSelection,
      sorting,
      pagination: { pageIndex: currentPage - 1, pageSize },
    },
  });

  const isTrashed = lifecycle === "trash";

  return (
    <div className="flex flex-col gap-6 w-full">
      <ListHeader
        title="Bildirishnomalar"
        description="Trener bildirishnomalarini boshqaring"
      >
        <LifecycleTabs
          value={lifecycle}
          onValueChange={(value) => {
            void setLifecycle(value);
            void setPageQuery("1");
            setRowSelection({});
          }}
        />
      </ListHeader>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Filter
          filterFields={filterFields}
          activeFilters={activeFilters}
          handleFiltersChange={handleFiltersChange}
        />
      </div>

      {selectedCount > 0 ? (
        <BulkActionsBar
          selectedCount={selectedCount}
          title="Tanlangan bildirishnomalar"
          onClear={() => setRowSelection({})}
          actions={
            isTrashed
              ? [
                  {
                    key: "restore",
                    label: "Tiklash",
                    icon: RotateCcwIcon,
                    onClick: () => void handleBulkRestore(),
                    disabled: mutations.isMutating,
                  },
                  {
                    key: "hard-delete",
                    label: "Butunlay o'chirish",
                    icon: Trash2Icon,
                    variant: "destructive",
                    onClick: handleBulkHardDelete,
                    disabled: mutations.isMutating,
                  },
                ]
              : [
                  {
                    key: "mark-read",
                    label: "O'qilgan deb belgilash",
                    icon: CheckCheckIcon,
                    onClick: () => void handleBulkMarkRead(),
                    disabled: mutations.isMutating,
                  },
                  {
                    key: "trash",
                    label: "Trashga yuborish",
                    icon: Trash2Icon,
                    onClick: () => void handleBulkTrash(),
                    disabled: mutations.isMutating,
                  },
                ]
          }
        />
      ) : null}

      <DataGrid
        table={table}
        isLoading={isLoading}
        recordCount={get(meta, "total", 0)}
      >
        <div className="w-full flex flex-col gap-2.5">
          <DataGridContainer>
            <ScrollArea className="w-full">
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
          <DataGridPagination
            info="{from} - {to} / {count} ta bildirishnoma"
            rowsPerPageLabel="Sahifada:"
            sizes={[10, 25, 50]}
          />
        </div>
      </DataGrid>

      <SoftDeleteAlert
        notification={notificationToSoftDelete}
        open={Boolean(notificationToSoftDelete)}
        onOpenChange={(open) => !open && setNotificationToSoftDelete(null)}
        onConfirm={() => void handleSoftDelete()}
        isDeleting={mutations.removeMutation.isPending}
      />

      <HardDeleteAlert
        target={hardDeleteTarget}
        open={Boolean(hardDeleteTarget)}
        onOpenChange={(open) => !open && setHardDeleteTarget(null)}
        onConfirm={() => void handleHardDelete()}
        isDeleting={mutations.bulkHardDeleteMutation.isPending}
      />
    </div>
  );
};

export default NotificationsListPage;
