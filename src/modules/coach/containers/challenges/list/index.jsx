import React from "react";
import { useNavigate, Outlet } from "react-router";
import { chain, get, isArray, map as lodashMap } from "lodash";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";
import { PlusIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
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
  useCoachChallenges,
  useCoachChallengesMutations,
} from "@/modules/coach/lib/hooks/useCoachChallenges";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useChallengeFilters } from "./use-filters.js";
import { SoftDeleteAlert, HardDeleteAlert } from "./delete-alert.jsx";

const ChallengesListPage = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();

  const {
    search,
    lifecycle,
    setLifecycle,
    statusFilter,
    sortBy,
    sortDir,
    currentPage,
    pageSize,
    setPageQuery,
    sorting,
    canReorder,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  } = useChallengeFilters();

  const deferredSearch = React.useDeferredValue(search);

  const queryParams = React.useMemo(
    () => ({
      ...(deferredSearch.trim() ? { q: deferredSearch.trim() } : {}),
      lifecycle,
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      sortBy,
      sortDir,
      page: currentPage,
      pageSize,
    }),
    [deferredSearch, lifecycle, statusFilter, sortBy, sortDir, currentPage, pageSize],
  );

  const {
    data: challengesData,
    isLoading,
    isFetching,
    refetch,
  } = useCoachChallenges(queryParams);

  const challenges = get(challengesData, "data.data", []);
  const meta = get(challengesData, "data.meta", {
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  });

  const mutations = useCoachChallengesMutations();

  const [rowSelection, setRowSelection] = React.useState({});
  const [challengeToSoftDelete, setChallengeToSoftDelete] = React.useState(null);
  const [hardDeleteTarget, setHardDeleteTarget] = React.useState(null);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: "Coach" },
      { url: "/coach/challenges", title: "Musobaqalar" },
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
  }, [search, lifecycle, statusFilter, sortBy, sortDir, currentPage]);

  const selectedChallengeIds = React.useMemo(
    () =>
      chain(rowSelection)
        .entries()
        .filter(([, selected]) => Boolean(selected))
        .map(([id]) => Number(id))
        .filter((id) => Number.isInteger(id))
        .value(),
    [rowSelection],
  );

  const selectedCount = selectedChallengeIds.length;

  const openEditDrawer = React.useCallback(
    (challenge) => navigate(`edit/${challenge.id}`),
    [navigate],
  );

  const handleSoftDelete = async () => {
    if (!challengeToSoftDelete) return;
    try {
      await mutations.removeResource(challengeToSoftDelete.id);
      toast.success("Musobaqa trashga yuborildi");
      setChallengeToSoftDelete(null);
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message) ? message.join(", ") : message || "O'chirib bo'lmadi",
      );
    }
  };

  const handleRestore = async (challenge) => {
    try {
      await mutations.restoreResource(challenge.id);
      toast.success("Musobaqa tiklandi");
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message) ? message.join(", ") : message || "Tiklab bo'lmadi",
      );
    }
  };

  const handleHardDelete = async () => {
    if (!hardDeleteTarget?.ids?.length) return;
    try {
      await mutations.bulkHardDeleteResources({ ids: hardDeleteTarget.ids });
      toast.success(
        hardDeleteTarget.ids.length === 1
          ? "Musobaqa butunlay o'chirildi"
          : `${hardDeleteTarget.ids.length} ta musobaqa butunlay o'chirildi`,
      );
      setHardDeleteTarget(null);
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message) ? message.join(", ") : message || "O'chirib bo'lmadi",
      );
    }
  };

  const handleBulkTrash = async () => {
    if (!selectedChallengeIds.length) return;
    try {
      await mutations.bulkTrashResources({ ids: selectedChallengeIds });
      toast.success(
        `${selectedChallengeIds.length} ta musobaqa trashga yuborildi`,
      );
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Trashga yuborib bo'lmadi",
      );
    }
  };

  const handleBulkRestore = async () => {
    if (!selectedChallengeIds.length) return;
    try {
      await mutations.bulkRestoreResources({ ids: selectedChallengeIds });
      toast.success(`${selectedChallengeIds.length} ta musobaqa tiklandi`);
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message) ? message.join(", ") : message || "Tiklab bo'lmadi",
      );
    }
  };

  const handleBulkHardDelete = () => {
    if (!selectedChallengeIds.length) return;
    setHardDeleteTarget({ ids: selectedChallengeIds });
  };

  const columns = useColumns({
    currentPage,
    pageSize,
    onEdit: openEditDrawer,
    onSoftDelete: setChallengeToSoftDelete,
    onRestore: handleRestore,
    onHardDelete: setHardDeleteTarget,
  });

  const table = useReactTable({
    data: challenges,
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
        title="Musobaqalar"
        description="Musobaqalarni boshqaring va ishtirokchilarni kuzating"
        actions={
          !isTrashed
            ? [
                {
                  key: "create",
                  label: "Yangi musobaqa",
                  icon: PlusIcon,
                  onClick: () => navigate("create"),
                },
              ]
            : []
        }
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
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="hidden xl:flex items-center justify-center size-9 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
          aria-label="Yangilash"
        >
          <RotateCcwIcon
            className={`size-4 ${isFetching ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {selectedCount > 0 ? (
        <BulkActionsBar
          selectedCount={selectedCount}
          title="Tanlangan musobaqalar"
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
                    key: "trash",
                    label: "Trashga",
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
            info="{from} - {to} / {count} ta musobaqa"
            rowsPerPageLabel="Sahifada:"
            sizes={[10, 25, 50]}
          />
        </div>
      </DataGrid>

      <Outlet />

      <SoftDeleteAlert
        challenge={challengeToSoftDelete}
        open={Boolean(challengeToSoftDelete)}
        onOpenChange={(open) => !open && setChallengeToSoftDelete(null)}
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

export default ChallengesListPage;
