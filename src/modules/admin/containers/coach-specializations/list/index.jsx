import React from "react";
import { useNavigate, Outlet } from "react-router";
import {
  get,
  isArray,
  join,
  map,
  toString,
  trim,
  filter as lodashFilter,
} from "lodash";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";
import { MedalIcon, PlusIcon, RotateCcwIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBreadcrumbStore, useLanguageStore } from "@/store";
import { useGetQuery, usePatchQuery, useDeleteQuery } from "@/hooks/api";
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
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useSpecializationFilters } from "./use-filters.js";
import { DeleteAlert } from "./delete-alert.jsx";
import {
  FALLBACK_LANGUAGE,
  SUPPORTED_TRANSLATION_FIELDS,
} from "../constants.js";

const QUERY_KEY = ["admin", "coach-specializations"];

const resolveLabel = (item, language, withFallback = true) => {
  const value = trim(get(item, `translations.${language}`, ""));

  if (value || !withFallback) {
    return value;
  }

  return (
    trim(get(item, "translations.uz", "")) ||
    trim(get(item, "name", "")) ||
    "-"
  );
};

const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  if (isArray(message)) {
    return join(message, ", ");
  }
  return message || fallback;
};

const getSupportedActiveLanguages = (languages) => {
  const activeLanguages = lodashFilter(
    languages,
    (language) =>
      get(language, "isActive") &&
      Boolean(SUPPORTED_TRANSLATION_FIELDS[get(language, "code")]),
  );

  return activeLanguages.length ? activeLanguages : [FALLBACK_LANGUAGE];
};

const Index = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const {
    nameFilter,
    nameOperator,
    categoryFilter,
    categoryOperator,
    statusFilter,
    statusOperator,
    hasImageFilter,
    hasImageOperator,
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
  } = useSpecializationFilters();

  const deferredName = React.useDeferredValue(nameFilter);
  const queryParams = React.useMemo(
    () => ({
      ...(trim(deferredName) ? { name: trim(deferredName) } : {}),
      ...((trim(deferredName) ||
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

  const {
    data: specializationsData,
    isLoading,
    isFetching,
    refetch,
  } = useGetQuery({
    url: "/admin/coach-specializations",
    params: queryParams,
    queryProps: {
      queryKey: [...QUERY_KEY, queryParams],
    },
  });
  const items = get(specializationsData, "data.data", []);
  const hasMeta = Boolean(get(specializationsData, "data.meta"));
  const meta = get(specializationsData, "data.meta", {
    total: 0,
    page: currentPage,
    pageSize,
    totalPages: currentPage,
  });

  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: {
      queryKey: ["admin", "languages"],
    },
  });
  const activeLanguages = React.useMemo(
    () => getSupportedActiveLanguages(get(languagesData, "data.data", [])),
    [languagesData],
  );

  const { mutateAsync: patchItem, isPending: isUpdating } = usePatchQuery({
    queryKey: QUERY_KEY,
  });
  const { mutateAsync: removeItem, isPending: isDeleting } = useDeleteQuery({
    queryKey: QUERY_KEY,
  });
  const { mutateAsync: patchReorder, isPending: isReordering } = usePatchQuery({
    queryKey: QUERY_KEY,
  });

  const updateItem = React.useCallback(
    async (id, payload) =>
      patchItem({
        url: `/admin/coach-specializations/${id}`,
        attributes: payload,
      }),
    [patchItem],
  );

  const deleteItem = React.useCallback(
    async (id) =>
      removeItem({
        url: `/admin/coach-specializations/${id}`,
      }),
    [removeItem],
  );

  const reorderItems = React.useCallback(
    async (payload) =>
      patchReorder({
        url: "/admin/coach-specializations/reorder",
        attributes: payload,
      }),
    [patchReorder],
  );

  const [itemToDelete, setItemToDelete] = React.useState(null);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/coach-specializations", title: "Sport yo'nalishlari" },
    ]);
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    if (!hasMeta) return;

    const totalPages = get(meta, "totalPages", 1);
    if (currentPage > totalPages) {
      void setPageQuery(String(totalPages));
    }
  }, [currentPage, hasMeta, meta, setPageQuery]);

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteItem(get(itemToDelete, "id"));
      toast.success("Yo'nalish o'chirildi");
      setItemToDelete(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Yo'nalishni o'chirib bo'lmadi"));
    }
  };

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
      await reorderItems({
        movedId: toString(get(movedItem, "id")),
        prevId,
        nextId,
      });
      toast.success("Tartib yangilandi");
    } catch (error) {
      toast.error(getErrorMessage(error, "Tartibni saqlab bo'lmadi"));
    }
  };

  const columns = useColumns({
    activeLanguages,
    canReorder,
    currentLanguage,
    isUpdating: isUpdating || isReordering,
    onToggleActive: handleToggleActive,
    resolveLabel,
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
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MedalIcon className="text-primary" />
            Sport yo'nalishlari
          </h1>
          <p className="text-sm text-muted-foreground">
            Murabbiylar uchun sport yo'nalishlarini qo'shing va boshqaring
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
              Yo'nalish qo'shish
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
              info="{from} - {to} / {count} ta yo'nalish"
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

export default Index;
