import React from "react";
import { useNavigate, Outlet } from "react-router";
import {
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  filter as lodashFilter,
  find,
  get,
  isArray,
  join,
  map,
  size,
  toString,
  trim,
  values,
} from "lodash";
import { toast } from "sonner";
import {
  LoaderCircleIcon,
  PlusIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useBreadcrumbStore, useLanguageStore } from "@/store";
import {
  useGetQuery,
  usePatchQuery,
  useDeleteQuery,
} from "@/hooks/api";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
  DataGridTableDndRowHandle,
  DataGridTableDndRows,
} from "@/components/reui/data-grid";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
import {
  getCategoryBadgeAppearance,
} from "@/lib/category-badge";
import { adminListSkeletons } from "@/modules/admin/components/admin-list-skeletons.jsx";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useCategoryFilters } from "./use-filters.js";
import { DeleteAlert } from "./delete-alert.jsx";

const resolveLabel = (translations, fallback, language) => {
  if (translations && typeof translations === "object") {
    const direct = get(translations, language);
    if (typeof direct === "string" && trim(direct)) return trim(direct);

    const uz = get(translations, "uz");
    if (typeof uz === "string" && trim(uz)) return trim(uz);

    const first = find(
      values(translations),
      (value) => typeof value === "string" && trim(value),
    );
    if (typeof first === "string" && trim(first)) return trim(first);
  }

  return fallback;
};

const countFilledTranslations = (translations = {}) =>
  size(
    lodashFilter(
      values(translations),
      (value) => typeof value === "string" && trim(value).length > 0,
    ),
  );

const CategoryFoodsGrid = ({ canManage, categoryId, currentLanguage }) => {
  const { data: foodsData, isLoading, isFetching } = useGetQuery({
    url: `/admin/food-categories/${categoryId}/foods`,
    queryProps: {
      queryKey: ["admin", "food-category-foods", categoryId],
      enabled: Boolean(categoryId),
    },
  });
  const foods = get(foodsData, "data.data", []);

  const reorderMutation = usePatchQuery({
    queryKey: ["admin", "food-category-foods", categoryId],
  });
  const isUpdating = reorderMutation.isPending;

  const reorderFoods = React.useCallback(
    async (payload) =>
      reorderMutation.mutateAsync({
        url: `/admin/food-categories/${categoryId}/foods/reorder`,
        attributes: payload,
      }),
    [categoryId, reorderMutation],
  );

  const columns = React.useMemo(
    () => [
      ...(canManage
        ? [
            {
              id: "dnd",
              header: "",
              cell: () => <DataGridTableDndRowHandle />,
              meta: { skeleton: adminListSkeletons.action },
              size: 32,
            },
          ]
        : []),
      {
        accessorKey: "name",
        header: "Ovqat",
        meta: { skeleton: adminListSkeletons.avatarText, cellClassName: "w-[32%]" },
        cell: (info) => {
          const food = get(info, "row.original");

          return (
            <div className="flex items-center gap-3">
              {get(food, "imageUrl") ? (
                <img loading="lazy"
                  src={get(food, "imageUrl")}
                  alt={get(food, "name")}
                  className="size-10 rounded-xl border object-cover"
                />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-xl border bg-muted text-[10px] text-muted-foreground">
                  No
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {resolveLabel(
                    get(food, "translations"),
                    get(food, "name"),
                    currentLanguage,
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {get(food, "calories")} kcal
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: "macros",
        header: "Makrolar",
        meta: { skeleton: adminListSkeletons.text },
        cell: (info) => {
          const food = get(info, "row.original");
          return (
            <div className="text-xs text-muted-foreground">
              P {get(food, "protein")} • C {get(food, "carbs")} • F{" "}
              {get(food, "fat")}
            </div>
          );
        },
      },
      {
        id: "serving",
        header: "Birlik",
        size: 96,
        meta: { skeleton: adminListSkeletons.text },
        cell: (info) => (
          <div className="text-xs text-muted-foreground">
            {get(info, "row.original.servingSize")}{" "}
            {get(info, "row.original.servingUnit")}
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        size: 96,
        meta: { skeleton: adminListSkeletons.badge },
        cell: (info) =>
          info.getValue() ? (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            >
              Faol
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-slate-500/10 text-slate-700 dark:text-slate-300"
            >
              Nofaol
            </Badge>
          ),
      },
    ],
    [canManage, currentLanguage],
  );

  const table = useReactTable({
    data: foods,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => toString(get(row, "id")),
  });

  const handleDragEnd = React.useCallback(
    async ({ active, over }) => {
      if (!canManage || !active || !over || active.id === over.id) return;

      const dataIds = map(foods, (food) => toString(get(food, "id")));
      const oldIndex = dataIds.indexOf(active.id);
      const newIndex = dataIds.indexOf(over.id);

      if (oldIndex < 0 || newIndex < 0) return;

      const ordered = [...foods];
      const [movedFood] = ordered.splice(oldIndex, 1);
      ordered.splice(newIndex, 0, movedFood);

      try {
        await reorderFoods({
          movedId: toString(get(movedFood, "id")),
          prevId: ordered[newIndex - 1]
            ? toString(get(ordered[newIndex - 1], "id"))
            : undefined,
          nextId: ordered[newIndex + 1]
            ? toString(get(ordered[newIndex + 1], "id"))
            : undefined,
        });
      } catch (error) {
        const message = get(error, "response.data.message");
        toast.error(
          isArray(message)
            ? join(message, ", ")
            : message || "Ovqatlar tartibini saqlab bo'lmadi",
        );
      }
    },
    [canManage, foods, reorderFoods],
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
        <LoaderCircleIcon className="animate-spin" />
        Kategoriya ichidagi ovqatlar yuklanmoqda...
      </div>
    );
  }

  if (!size(foods)) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
        Bu kategoriyada hozircha ovqat yo'q.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      <DataGridContainer>
        <ScrollArea className="w-full">
          <DataGrid
            table={table}
            tableLayout={{ rowsDraggable: canManage, width: "auto" }}
            isLoading={isLoading}
          >
            {canManage ? (
              <DataGridTableDndRows
                dataIds={map(foods, (food) => toString(get(food, "id")))}
                handleDragEnd={handleDragEnd}
              />
            ) : (
              <DataGridTable />
            )}
          </DataGrid>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DataGridContainer>

      {isFetching || isUpdating ? (
        <p className="text-xs text-muted-foreground">
          O'zgarishlar yangilanmoqda...
        </p>
      ) : null}
    </div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const { canManageContent } = useAdminPermissions();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const CATEGORIES_QUERY_KEY = ["admin", "food-categories"];

  const patchMutation = usePatchQuery({ queryKey: CATEGORIES_QUERY_KEY });
  const deleteMutation = useDeleteQuery({ queryKey: CATEGORIES_QUERY_KEY });
  const reorderMutation = usePatchQuery({ queryKey: CATEGORIES_QUERY_KEY });

  const isUpdating = patchMutation.isPending || reorderMutation.isPending;

  const updateCategory = React.useCallback(
    async (id, payload) =>
      patchMutation.mutateAsync({
        url: `/admin/food-categories/${id}`,
        attributes: payload,
      }),
    [patchMutation],
  );

  const deleteCategory = React.useCallback(
    async (id) =>
      deleteMutation.mutateAsync({
        url: `/admin/food-categories/${id}`,
      }),
    [deleteMutation],
  );

  const reorderCategories = React.useCallback(
    async (payload) =>
      reorderMutation.mutateAsync({
        url: "/admin/food-categories/reorder",
        attributes: payload,
      }),
    [reorderMutation],
  );

  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const languages = get(languagesData, "data.data", []);

  const {
    search,
    searchOperator,
    statusFilter,
    statusOperator,
    translationFilter,
    translationOperator,
    currentPage,
    pageSize,
    setPageQuery,
    setPageSizeQuery,
    sortBy,
    sortDir,
    sorting,
    canReorder,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  } = useCategoryFilters();

  const deferredSearch = React.useDeferredValue(search);
  const queryParams = React.useMemo(
    () => ({
      ...(trim(deferredSearch) ? { name: trim(deferredSearch) } : {}),
      ...(trim(deferredSearch) || searchOperator !== "contains"
        ? { nameOp: searchOperator }
        : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(statusFilter !== "all" || statusOperator !== "is"
        ? { statusOp: statusOperator }
        : {}),
      ...(translationFilter !== "all" ? { translations: translationFilter } : {}),
      ...(translationFilter !== "all" || translationOperator !== "is"
        ? { translationsOp: translationOperator }
        : {}),
      sortBy,
      sortDir,
      page: currentPage,
      pageSize,
    }),
    [
      currentPage,
      deferredSearch,
      pageSize,
      searchOperator,
      sortBy,
      sortDir,
      statusFilter,
      statusOperator,
      translationFilter,
      translationOperator,
    ],
  );

  const { data: categoriesData, isLoading, isFetching, refetch } = useGetQuery({
    url: "/admin/food-categories",
    params: queryParams,
    queryProps: { queryKey: [...CATEGORIES_QUERY_KEY, queryParams] },
  });
  const categories = get(categoriesData, "data.data", []);
  const meta = get(categoriesData, "data.meta", {
    total: 0,
    page: 1,
    pageSize,
    totalPages: 1,
  });

  const [categoryToDelete, setCategoryToDelete] = React.useState(null);
  const [expanded, setExpanded] = React.useState({});

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/food-categories", title: "Kategoriyalar" },
    ]);
  }, [setBreadcrumbs]);

  const activeLanguages = React.useMemo(
    () => lodashFilter(languages, (language) => get(language, "isActive")),
    [languages],
  );

  const currentLanguageMeta = React.useMemo(
    () =>
      find(
        activeLanguages,
        (language) => get(language, "code") === currentLanguage,
      ),
    [activeLanguages, currentLanguage],
  );

  const isReorderEnabled = canManageContent && canReorder;

  const openTranslationsDrawer = React.useCallback(
    (category) => {
      if (!canManageContent) return;
      navigate(`translate/${get(category, "id")}`);
    },
    [canManageContent, navigate],
  );

  const handleDelete = React.useCallback(async () => {
    if (!canManageContent || !categoryToDelete) return;

    try {
      await deleteCategory(get(categoryToDelete, "id"));
      toast.success("Kategoriya o'chirildi");
      setExpanded((current) => {
        const next = { ...current };
        delete next[get(categoryToDelete, "id")];
        return next;
      });
      setCategoryToDelete(null);
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        isArray(message)
          ? join(message, ", ")
          : message || "Kategoriyani o'chirib bo'lmadi",
      );
    }
  }, [canManageContent, categoryToDelete, deleteCategory]);

  const handleToggleActive = React.useCallback(
    async (category) => {
      if (!canManageContent) return;

      try {
        await updateCategory(get(category, "id"), {
          isActive: !get(category, "isActive"),
        });
        toast.success(
          !get(category, "isActive")
            ? "Kategoriya faol qilindi"
            : "Kategoriya nofaol qilindi",
        );
      } catch (error) {
        const message = get(error, "response.data.message");
        toast.error(
          isArray(message)
            ? join(message, ", ")
            : message || "Kategoriya statusini o'zgartirib bo'lmadi",
        );
      }
    },
    [canManageContent, updateCategory],
  );

  const columns = useColumns({
    activeLanguages,
    canManage: canManageContent,
    currentLanguage,
    isReorderEnabled,
    isUpdating,
    resolveLabel,
    handleToggleActive,
    openEditDrawer: (category) => {
      if (!canManageContent) return;
      navigate(`edit/${get(category, "id")}`);
    },
    openTranslationsDrawer,
    setCategoryToDelete,
    CategoryFoodsGrid,
  });

  const table = useReactTable({
    data: categories,
    columns,
    manualSorting: true,
    manualPagination: true,
    pageCount: get(meta, "totalPages", 1),
    state: {
      expanded,
      sorting,
      pagination: { pageIndex: currentPage - 1, pageSize },
    },
    onExpandedChange: setExpanded,
    onSortingChange: handleSortingChange,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: currentPage - 1, pageSize })
          : updater;
      const nextPage = Number(next.pageIndex) + 1;
      const nextPageSize = Number(next.pageSize) || pageSize;
      React.startTransition(() => {
        void setPageQuery(String(nextPageSize === pageSize ? nextPage : 1));
        void setPageSizeQuery(String(nextPageSize));
      });
    },
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    getRowId: (row) => toString(get(row, "id")),
  });

  const handleCategoryDragEnd = React.useCallback(
    async ({ active, over }) => {
      if (!canManageContent) return;
      if (!active || !over || active.id === over.id) return;
      if (!isReorderEnabled) return;

      const dataIds = map(categories, (category) =>
        toString(get(category, "id")),
      );
      const oldIndex = dataIds.indexOf(active.id);
      const newIndex = dataIds.indexOf(over.id);

      if (oldIndex < 0 || newIndex < 0) return;

      const ordered = [...categories];
      const [movedCategory] = ordered.splice(oldIndex, 1);
      ordered.splice(newIndex, 0, movedCategory);

      try {
        await reorderCategories({
          movedId: toString(get(movedCategory, "id")),
          prevId: ordered[newIndex - 1]
            ? toString(get(ordered[newIndex - 1], "id"))
            : undefined,
          nextId: ordered[newIndex + 1]
            ? toString(get(ordered[newIndex + 1], "id"))
            : undefined,
        });
      } catch (error) {
        const message = get(error, "response.data.message");
        toast.error(
          isArray(message)
            ? join(message, ", ")
            : message || "Kategoriya tartibini saqlab bo'lmadi",
        );
      }
    },
    [canManageContent, categories, isReorderEnabled, reorderCategories],
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Ovqat kategoriyalari
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RotateCcwIcon className={cn("size-4", isFetching && "animate-spin")} />
          </Button>
          {canManageContent ? (
            <Button onClick={() => navigate("create")} className="gap-1.5">
              <PlusIcon />
              Kategoriya qo'shish
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Filter
          filterFields={filterFields}
          activeFilters={activeFilters}
          handleFiltersChange={handleFiltersChange}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          {get(meta, "total", 0)} ta kategoriya
          {currentLanguageMeta
            ? ` \u2022 ${get(currentLanguageMeta, "flag") ? `${get(currentLanguageMeta, "flag")} ` : ""}${get(currentLanguageMeta, "name")}`
            : ""}
        </p>
        {canManageContent && !isReorderEnabled ? (
          <p>Filter yoqilganda drag and drop o'chadi</p>
        ) : null}
      </div>

      <DataGrid
        table={table}
        recordCount={get(meta, "total", 0)}
        tableLayout={{
          rowsDraggable: isReorderEnabled,
          width: "auto",
        }}
        isLoading={isLoading}
      >
        <div className="flex flex-col gap-2.5">
          <DataGridContainer>
            <ScrollArea className="w-full">
              {isReorderEnabled ? (
                <DataGridTableDndRows
                  dataIds={map(categories, (category) =>
                    toString(get(category, "id")),
                  )}
                  handleDragEnd={handleCategoryDragEnd}
                />
              ) : (
                <DataGridTable />
              )}
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
          <DataGridPagination
            info="{from} - {to} / {count} ta kategoriya"
            rowsPerPageLabel="Sahifada:"
            sizes={[10, 25, 50, 100]}
          />
        </div>
      </DataGrid>

      {!isLoading && !categories.length ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          Filtrlarga mos kategoriya topilmadi.
        </div>
      ) : null}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>
      ) : null}

      <DeleteAlert
        category={categoryToDelete}
        open={Boolean(categoryToDelete)}
        onOpenChange={(open) => {
          if (!open) setCategoryToDelete(null);
        }}
        onConfirm={handleDelete}
        resolveLabel={resolveLabel}
        currentLanguage={currentLanguage}
      />

      <Outlet />
    </div>
  );
};

export default Index;
