import React from "react";
import { Outlet, useNavigate } from "react-router";
import { filter, get, isArray, join, map, toString } from "lodash";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";
import { AwardIcon, PlusIcon, RotateCcwIcon } from "lucide-react";
import { useBreadcrumbStore, useAppModeStore, useLanguageStore } from "@/store";
import { useDeleteQuery, useGetQuery, usePatchQuery } from "@/hooks/api";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
  DataGridTableDndRows,
} from "@/components/reui/data-grid";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/page-transition";
import { cn } from "@/lib/utils";
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
      ...(deferredName.trim() ? { name: deferredName.trim() } : {}),
      ...((deferredName.trim() ||
        nameOperator === "empty" ||
        nameOperator === "not_empty") &&
      nameOperator !== "contains"
        ? { nameOp: nameOperator }
        : {}),
      ...(categoryFilter !== "all" ? { category: categoryFilter } : {}),
      ...((categoryFilter !== "all" ||
        categoryOperator === "empty" ||
        categoryOperator === "not_empty") &&
      categoryOperator !== "is"
        ? { categoryOp: categoryOperator }
        : {}),
      ...(metricFilter !== "all" ? { metric: metricFilter } : {}),
      ...((metricFilter !== "all" ||
        metricOperator === "empty" ||
        metricOperator === "not_empty") &&
      metricOperator !== "is"
        ? { metricOp: metricOperator }
        : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...((statusFilter !== "all" ||
        statusOperator === "empty" ||
        statusOperator === "not_empty") &&
      statusOperator !== "is"
        ? { statusOp: statusOperator }
        : {}),
      ...(hasImageFilter !== "all" ? { hasImage: hasImageFilter } : {}),
      ...((hasImageFilter !== "all" ||
        hasImageOperator === "empty" ||
        hasImageOperator === "not_empty") &&
      hasImageOperator !== "is"
        ? { hasImageOp: hasImageOperator }
        : {}),
      ...(imageModeFilter !== "any" ? { imageMode: imageModeFilter } : {}),
      ...(translationsFilter !== "all"
        ? { translations: translationsFilter }
        : {}),
      ...((translationsFilter !== "all" ||
        translationsOperator === "empty" ||
        translationsOperator === "not_empty") &&
      translationsOperator !== "is"
        ? { translationsOp: translationsOperator }
        : {}),
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
    if (!itemToDelete) return;

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
    if (!canReorder) return;

    const { active, over } = event;

    if (!active || !over || active.id === over.id) {
      return;
    }

    const currentIds = map(items, (item) => toString(get(item, "id")));
    const oldIndex = currentIds.indexOf(active.id);
    const newIndex = currentIds.indexOf(over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const ordered = [...items];
    const [movedItem] = ordered.splice(oldIndex, 1);
    ordered.splice(newIndex, 0, movedItem);

    const movedIndex = ordered.findIndex(
      (item) => get(item, "id") === get(movedItem, "id"),
    );
    const prevId =
      movedIndex > 0
        ? toString(get(ordered, `${movedIndex - 1}.id`))
        : undefined;
    const nextId =
      movedIndex < ordered.length - 1
        ? toString(get(ordered, `${movedIndex + 1}.id`))
        : undefined;

    try {
      await patchReorder({
        url: "/admin/achievements/reorder",
        attributes: {
          movedId: toString(get(movedItem, "id")),
          prevId,
          nextId,
        },
      });
      toast.success("Tartib yangilandi");
    } catch (error) {
      toast.error(getErrorMessage(error, "Tartibni saqlab bo'lmadi"));
    }
  };

  const columns = useColumns({
    activeLanguages,
    canReorder,
    currentMode,
    currentLanguage,
    isUpdating: isUpdating || isReordering,
    onToggleActive: handleToggleActive,
    onImages: (item) => navigate(`images/${get(item, "id")}`),
    onTranslate: (item) => navigate(`translate/${get(item, "id")}`),
    onEdit: (item) => navigate(`edit/${get(item, "id")}`),
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
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <AwardIcon className="text-primary" />
            Achievements
          </h1>
          <p className="text-sm text-muted-foreground">
            Foydalanuvchi yutuqlarini qo'shing va boshqaring
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
              <RotateCcwIcon
                className={cn("size-4", isFetching && "animate-spin")}
              />
            </Button>
            <Button onClick={() => navigate("create")} className="gap-1.5">
              <PlusIcon />
              Achievement qo'shish
            </Button>
          </div>
        </div>

        <DataGrid
          table={table}
          isLoading={isLoading}
          recordCount={get(meta, "total", 0)}
        >
          <div className="flex w-full flex-col gap-2.5">
            <DataGridContainer>
              <ScrollArea className="w-full">
                {canReorder ? (
                  <DataGridTableDndRows
                    dataIds={map(items, (item) => toString(get(item, "id")))}
                    handleDragEnd={handleDragEnd}
                  />
                ) : (
                  <DataGridTable />
                )}
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </DataGridContainer>
            {!canReorder ? (
              <div className="px-2 text-xs text-muted-foreground">
                Tartiblash faqat filterlarsiz va birinchi sahifada ishlaydi.
              </div>
            ) : null}
            <DataGridPagination
              info="{from} - {to} / {count} ta achievement"
              rowsPerPageLabel="Sahifada:"
              sizes={[10, 25, 50, 100]}
            />
          </div>
        </DataGrid>

        <DeleteAlert
          item={itemToDelete}
          open={!!itemToDelete}
          onOpenChange={(open) => !open && setItemToDelete(null)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />

        <Outlet />
      </div>
    </PageTransition>
  );
};

export default AchievementsListPage;
