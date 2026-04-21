import React from "react";
import { useNavigate, Outlet } from "react-router";
import { chain, findIndex, get, isArray, map as lodashMap } from "lodash";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";
import { PlusIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { useBreadcrumbStore } from "@/store";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
  DataGridTableDndRows,
} from "@/components/reui/data-grid";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import {
  BulkActionsBar,
  LifecycleTabs,
  ListHeader,
} from "@/modules/coach/components/data-grid-helpers";
import {
  useCoachPrograms,
  useCoachProgramsMutations,
} from "@/modules/coach/lib/hooks/useCoachPrograms";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useProgramFilters } from "./use-filters.js";
import { SoftDeleteAlert, HardDeleteAlert } from "./delete-alert.jsx";

const ProgramsListPage = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();

  const {
    search,
    lifecycle,
    setLifecycle,
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
  } = useProgramFilters();

  const deferredSearch = React.useDeferredValue(search);

  const queryParams = React.useMemo(
    () => ({
      ...(deferredSearch.trim() ? { q: deferredSearch.trim() } : {}),
      lifecycle,
      sortBy,
      sortDir,
      page: currentPage,
      pageSize,
    }),
    [deferredSearch, lifecycle, sortBy, sortDir, currentPage, pageSize],
  );

  const { data: programsData, isLoading, isFetching, refetch } = useCoachPrograms(queryParams);
  const programs = get(programsData, "data.data", []);
  const meta = get(programsData, "data.meta", {
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  });

  const mutations = useCoachProgramsMutations();

  const [rowSelection, setRowSelection] = React.useState({});
  const [programToSoftDelete, setProgramToSoftDelete] = React.useState(null);
  const [hardDeleteTarget, setHardDeleteTarget] = React.useState(null);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: "Coach" },
      { url: "/coach/programs", title: "Dasturlar" },
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
  }, [search, lifecycle, sortBy, sortDir, currentPage]);

  const paginatedProgramIds = React.useMemo(
    () => lodashMap(programs, (p) => String(p.id)),
    [programs],
  );

  const selectedProgramIds = React.useMemo(
    () =>
      chain(rowSelection)
        .entries()
        .filter(([, selected]) => Boolean(selected))
        .map(([id]) => Number(id))
        .filter((id) => Number.isInteger(id))
        .value(),
    [rowSelection],
  );

  const selectedProgramCount = selectedProgramIds.length;

  const openEditDrawer = React.useCallback(
    (program) => navigate(`edit/${program.id}`),
    [navigate],
  );

  const handleSoftDelete = async () => {
    if (!programToSoftDelete) return;
    try {
      await mutations.removeResource(programToSoftDelete.id);
      toast.success("Dastur trashga yuborildi");
      setProgramToSoftDelete(null);
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message) ? message.join(", ") : message || "O'chirib bo'lmadi",
      );
    }
  };

  const handleRestore = async (program) => {
    try {
      await mutations.restoreResource(program.id);
      toast.success("Dastur tiklandi");
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
          ? "Dastur butunlay o'chirildi"
          : `${hardDeleteTarget.ids.length} ta dastur butunlay o'chirildi`,
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
    if (!selectedProgramIds.length) return;
    try {
      await mutations.bulkTrashResources({ ids: selectedProgramIds });
      toast.success(`${selectedProgramIds.length} ta dastur trashga yuborildi`);
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
    if (!selectedProgramIds.length) return;
    try {
      await mutations.bulkRestoreResources({ ids: selectedProgramIds });
      toast.success(`${selectedProgramIds.length} ta dastur tiklandi`);
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message) ? message.join(", ") : message || "Tiklab bo'lmadi",
      );
    }
  };

  const handleBulkHardDelete = () => {
    if (!selectedProgramIds.length) return;
    setHardDeleteTarget({ ids: selectedProgramIds });
  };

  const handleDragEnd = async (event) => {
    if (!canReorder) return;
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const currentIds = lodashMap(programs, (p) => p.id.toString());
    const oldIndex = currentIds.indexOf(active.id);
    const newIndex = currentIds.indexOf(over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const ordered = [...programs];
    const [movedItem] = ordered.splice(oldIndex, 1);
    ordered.splice(newIndex, 0, movedItem);

    const movedIndex = findIndex(ordered, (p) => p.id === movedItem.id);
    const prevId = movedIndex > 0 ? String(ordered[movedIndex - 1].id) : undefined;
    const nextId =
      movedIndex < ordered.length - 1
        ? String(ordered[movedIndex + 1].id)
        : undefined;

    try {
      await mutations.reorderResources({ movedId: String(movedItem.id), prevId, nextId });
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message) ? message.join(", ") : message || "Tartibni saqlab bo'lmadi",
      );
    }
  };

  const columns = useColumns({
    canReorder,
    currentPage,
    pageSize,
    onEdit: openEditDrawer,
    onSoftDelete: setProgramToSoftDelete,
    onRestore: handleRestore,
    onHardDelete: setHardDeleteTarget,
  });

  const table = useReactTable({
    data: programs,
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
        title="Dasturlar"
        description="Trener dasturlarini boshqaring va tartibga soling"
        actions={[
          {
            key: "create",
            label: "Yangi dastur",
            icon: PlusIcon,
            onClick: () => navigate("create"),
          },
        ]}
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

      {selectedProgramCount > 0 ? (
        <BulkActionsBar
          selectedCount={selectedProgramCount}
          title="Tanlangan dasturlar"
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
              {canReorder ? (
                <DataGridTableDndRows
                  table={table}
                  dataIds={paginatedProgramIds}
                  handleDragEnd={handleDragEnd}
                />
              ) : (
                <DataGridTable />
              )}
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
          {!canReorder && !isLoading ? (
            <div className="px-2 text-xs text-muted-foreground">
              Tartiblash faqat filterlarsiz va standart saralashda ishlaydi.
            </div>
          ) : null}
          <DataGridPagination
            info="{from} - {to} / {count} ta dastur"
            rowsPerPageLabel="Sahifada:"
            sizes={[10, 25, 50]}
          />
        </div>
      </DataGrid>

      <Outlet />

      <SoftDeleteAlert
        program={programToSoftDelete}
        open={Boolean(programToSoftDelete)}
        onOpenChange={(open) => !open && setProgramToSoftDelete(null)}
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

export default ProgramsListPage;
