import React from "react";
import { useNavigate, Outlet } from "react-router";
import {
  chain,
  filter as lodashFilter,
  find,
  findIndex,
  get,
  isArray,
  isObject,
  keyBy,
  map as lodashMap,
  trim,
  values,
} from "lodash";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  DownloadIcon,
  PlusIcon,
  RotateCcwIcon,
  TagIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { useBreadcrumbStore, useLanguageStore } from "@/store";
import {
  useGetQuery,
  usePatchQuery,
  useDeleteQuery,
} from "@/hooks/api";
import useApi from "@/hooks/api/use-api.js";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DataGrid,
  DataGridContainer,
  DataGridTableDndRows,
  DataGridTable,
} from "@/components/reui/data-grid";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { cn } from "@/lib/utils";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
import FoodBulkCategoryDrawer from "../components/FoodBulkCategoryDrawer";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useFoodFilters } from "./use-filters.js";
import { DeleteAlert, HardDeleteAlert } from "./delete-alert.jsx";

const resolveLabel = (translations, fallback, language) => {
  if (isObject(translations)) {
    const direct = trim(String(get(translations, language, "")));
    if (direct) return direct;

    const uz = trim(String(get(translations, "uz", "")));
    if (uz) return uz;

    const first = find(values(translations), (value) => trim(String(value)));
    if (first) return trim(String(first));
  }

  return fallback;
};

const getMutationErrorMessage = (error, fallback) => {
  const response = error?.response?.data;
  const message = response?.message;
  const dependencySummary = response?.dependencySummary;
  const baseMessage = isArray(message) ? message.join(", ") : message;

  return [baseMessage || fallback, dependencySummary].filter(Boolean).join(" ");
};

const Index = () => {
  const navigate = useNavigate();
  const { canManageContent, isSuperAdmin } = useAdminPermissions();
  const canHardDelete = canManageContent && isSuperAdmin;
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);

  const { data: categoriesData } = useGetQuery({
    url: "/admin/food-categories",
    params: { pageSize: 100 },
    queryProps: { queryKey: ["admin", "food-categories", "options"] },
  });
  const categories = get(categoriesData, "data.data", []);

  const { data: cuisinesData } = useGetQuery({
    url: "/admin/cuisines",
    params: { pageSize: 100 },
    queryProps: { queryKey: ["admin", "cuisines", "options"] },
  });
  const cuisines = get(cuisinesData, "data.data", []);

  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const languages = get(languagesData, "data.data", []);

  const {
    search,
    searchOp,
    categoryFilter,
    categoryOp,
    cuisineFilter,
    cuisineOp,
    statusFilter,
    statusOp,
    hasImageFilter,
    hasImageOp,
    translationsFilter,
    translationsOp,
    duplicatesFilter,
    sortBy,
    sortDir,
    pageQuery,
    setPageQuery,
    setPageSizeQuery,
    currentPage,
    pageSize,
    sorting,
    canReorder,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  } = useFoodFilters({ categories, cuisines, currentLanguage, resolveLabel });

  const deferredSearch = React.useDeferredValue(search);
  const queryParams = React.useMemo(
    () => ({
      ...(trim(deferredSearch) ? { name: trim(deferredSearch) } : {}),
      ...(trim(deferredSearch) || searchOp !== "contains"
        ? { nameOp: searchOp }
        : {}),
      ...(categoryFilter !== "all" ? { categoryId: categoryFilter } : {}),
      ...(categoryFilter !== "all" || categoryOp !== "is"
        ? { categoryOp }
        : {}),
      ...(cuisineFilter !== "all" ? { cuisineId: cuisineFilter } : {}),
      ...(cuisineFilter !== "all" || cuisineOp !== "is" ? { cuisineOp } : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(statusFilter !== "all" || statusOp !== "is" ? { statusOp } : {}),
      ...(hasImageFilter !== "all" ? { hasImage: hasImageFilter } : {}),
      ...(hasImageFilter !== "all" || hasImageOp !== "is"
        ? { hasImageOp }
        : {}),
      ...(translationsFilter !== "all"
        ? { translations: translationsFilter }
        : {}),
      ...(translationsFilter !== "all" || translationsOp !== "is"
        ? { translationsOp }
        : {}),
      ...(duplicatesFilter !== "all" ? { duplicates: duplicatesFilter } : {}),
      sortBy,
      sortDir,
      page: currentPage,
      pageSize,
    }),
    [
      categoryFilter,
      categoryOp,
      cuisineFilter,
      cuisineOp,
      currentPage,
      deferredSearch,
      duplicatesFilter,
      hasImageFilter,
      hasImageOp,
      pageSize,
      searchOp,
      sortBy,
      sortDir,
      translationsFilter,
      translationsOp,
      statusFilter,
      statusOp,
    ],
  );

  const queryClient = useQueryClient();
  const { request } = useApi();
  const FOODS_QUERY_KEY = ["admin", "foods"];
  const FOOD_CATEGORIES_QUERY_KEY = ["admin", "food-categories"];
  const FOOD_CATEGORY_FOODS_QUERY_KEY = ["admin", "food-category-foods"];

  const { data: foodsData, isLoading, isFetching, refetch } = useGetQuery({
    url: "/admin/foods",
    params: queryParams,
    queryProps: {
      queryKey: [...FOODS_QUERY_KEY, queryParams],
    },
  });
  const foods = get(foodsData, "data.data", []);
  const hasMeta = Boolean(get(foodsData, "data.meta"));
  const meta = get(foodsData, "data.meta", {
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  });

  const invalidateFoodRelated = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: FOOD_CATEGORY_FOODS_QUERY_KEY });
  }, [queryClient]);
  const invalidateFoodAndCategories = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: FOOD_CATEGORY_FOODS_QUERY_KEY });
    await queryClient.invalidateQueries({ queryKey: FOOD_CATEGORIES_QUERY_KEY });
  }, [queryClient]);

  const deleteMutation = useDeleteQuery({
    queryKey: FOODS_QUERY_KEY,
    mutationProps: { onSuccess: invalidateFoodAndCategories },
  });
  const statusMutation = usePatchQuery({
    queryKey: FOODS_QUERY_KEY,
    mutationProps: { onSuccess: invalidateFoodRelated },
  });
  const bulkStatusMutation = usePatchQuery({
    queryKey: FOODS_QUERY_KEY,
    mutationProps: { onSuccess: invalidateFoodRelated },
  });
  const bulkTrashMutation = usePatchQuery({
    queryKey: FOODS_QUERY_KEY,
    mutationProps: { onSuccess: invalidateFoodAndCategories },
  });
  const restoreMutation = usePatchQuery({
    queryKey: FOODS_QUERY_KEY,
    mutationProps: { onSuccess: invalidateFoodAndCategories },
  });
  const bulkRestoreMutation = usePatchQuery({
    queryKey: FOODS_QUERY_KEY,
    mutationProps: { onSuccess: invalidateFoodAndCategories },
  });
  const bulkAssignCategoriesMutation = usePatchQuery({
    queryKey: FOODS_QUERY_KEY,
    mutationProps: { onSuccess: invalidateFoodAndCategories },
  });
  const hardDeleteMutation = usePatchQuery({
    queryKey: FOODS_QUERY_KEY,
    mutationProps: { onSuccess: invalidateFoodAndCategories },
  });
  const reorderMutation = usePatchQuery({ queryKey: FOODS_QUERY_KEY });
  const isDeleting = deleteMutation.isPending;
  const isBulkUpdatingStatus = bulkStatusMutation.isPending;
  const isBulkTrashing = bulkTrashMutation.isPending;
  const isAssigningCategories = bulkAssignCategoriesMutation.isPending;
  const isHardDeleting = hardDeleteMutation.isPending;
  const isRestoring = restoreMutation.isPending || bulkRestoreMutation.isPending;
  const [isImporting, setIsImporting] = React.useState(false);

  const deleteFood = React.useCallback(
    async (id) => deleteMutation.mutateAsync({ url: `/admin/foods/${id}` }),
    [deleteMutation],
  );
  const updateFoodStatus = React.useCallback(
    async (id, isActive) =>
      statusMutation.mutateAsync({ url: `/admin/foods/${id}/status`, attributes: { isActive } }),
    [statusMutation],
  );
  const reorderFoods = React.useCallback(
    async (payload) =>
      reorderMutation.mutateAsync({ url: "/admin/foods/reorder", attributes: payload }),
    [reorderMutation],
  );
  const updateFoodsStatus = React.useCallback(
    async (payload) =>
      bulkStatusMutation.mutateAsync({ url: "/admin/foods/status", attributes: payload }),
    [bulkStatusMutation],
  );
  const trashFoods = React.useCallback(
    async (payload) =>
      bulkTrashMutation.mutateAsync({ url: "/admin/foods/trash", attributes: payload }),
    [bulkTrashMutation],
  );
  const restoreFood = React.useCallback(
    async (id) =>
      restoreMutation.mutateAsync({ url: `/admin/foods/${id}/restore`, attributes: {} }),
    [restoreMutation],
  );
  const restoreFoods = React.useCallback(
    async (payload) =>
      bulkRestoreMutation.mutateAsync({ url: "/admin/foods/restore", attributes: payload }),
    [bulkRestoreMutation],
  );
  const assignFoodCategories = React.useCallback(
    async (payload) =>
      bulkAssignCategoriesMutation.mutateAsync({ url: "/admin/foods/categories", attributes: payload }),
    [bulkAssignCategoriesMutation],
  );
  const hardDeleteFoods = React.useCallback(
    async (payload) =>
      hardDeleteMutation.mutateAsync({ url: "/admin/foods/hard-delete", attributes: payload }),
    [hardDeleteMutation],
  );
  const exportFoods = React.useCallback(async () => {
    const response = await request.post("/admin/foods/export/jobs", null, {
      params: queryParams,
    });
    return get(response, "data.data", get(response, "data"));
  }, [queryParams, request]);

  const importFoods = React.useCallback(
    async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      const previewResponse = await request.post(
        "/admin/foods/import/preview",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const preview = get(previewResponse, "data.data", get(previewResponse, "data"));

      if (get(preview, "invalidCount", 0) > 0) {
        return {
          preview,
          job: null,
        };
      }

      const jobResponse = await request.post("/admin/foods/import/jobs", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return {
        preview,
        job: get(jobResponse, "data.data", get(jobResponse, "data")),
      };
    },
    [request],
  );

  const activeLanguages = React.useMemo(
    () => lodashFilter(languages, (language) => language.isActive),
    [languages],
  );

  const categoryById = React.useMemo(
    () => keyBy(categories, "id"),
    [categories],
  );
  const cuisineById = React.useMemo(
    () => keyBy(cuisines, (cuisine) => cuisine.id),
    [cuisines],
  );
  const assignableCategories = React.useMemo(
    () => lodashFilter(categories, (category) => category.isActive),
    [categories],
  );

  const [bulkCategoryDrawerOpen, setBulkCategoryDrawerOpen] =
    React.useState(false);
  const [rowSelection, setRowSelection] = React.useState({});
  const [bulkCategoryIds, setBulkCategoryIds] = React.useState([]);
  const [foodToDelete, setFoodToDelete] = React.useState(null);
  const [hardDeleteTarget, setHardDeleteTarget] = React.useState(null);
  const importFileInputRef = React.useRef(null);
  const [isExporting, setIsExporting] = React.useState(false);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/foods", title: "Ovqatlar bazasi" },
    ]);
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    if (!hasMeta || isFetching) return;
    const totalPages = get(meta, "totalPages", 1);
    if (currentPage > totalPages) {
      void setPageQuery(String(totalPages));
    }
  }, [currentPage, hasMeta, isFetching, meta, setPageQuery]);

  React.useEffect(() => {
    setRowSelection({});
  }, [
    categoryFilter,
    currentPage,
    duplicatesFilter,
    hasImageFilter,
    pageSize,
    search,
    sortBy,
    sortDir,
    translationsFilter,
    statusFilter,
  ]);

  const paginatedFoodIds = React.useMemo(
    () => lodashMap(foods, (food) => String(food.id)),
    [foods],
  );
  const selectedFoodIds = React.useMemo(
    () =>
      chain(rowSelection)
        .entries()
        .filter(([, selected]) => Boolean(selected))
        .map(([id]) => Number(id))
        .filter((id) => Number.isInteger(id))
        .value(),
    [rowSelection],
  );
  const selectedFoodCount = selectedFoodIds.length;

  const openCreateDrawer = () => {
    if (!canManageContent) return;
    navigate("create");
  };

  const openEditDrawer = (food) => {
    if (!canManageContent) return;
    navigate(`edit/${food.id}`);
  };

  const openTranslationsDrawer = (food) => {
    if (!canManageContent) return;
    navigate(`translate/${food.id}`);
  };
  const openRecipeDrawer = (food) => {
    if (!canManageContent) return;
    navigate(`recipe/${food.id}`);
  };

  const handleDelete = async () => {
    if (!canManageContent || !foodToDelete) return;

    try {
      await deleteFood(foodToDelete.id);
      toast.success("Ovqat trashga yuborildi");
      setFoodToDelete(null);
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "O'chirib bo'lmadi",
      );
    }
  };

  const handleExportFoods = React.useCallback(async () => {
    try {
      setIsExporting(true);
      await exportFoods();
      toast.success("Ovqatlar eksport job sifatida boshlandi");
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Excel eksport qilib bo'lmadi",
      );
    } finally {
      setIsExporting(false);
    }
  }, [exportFoods]);

  const handleImportFoods = React.useCallback(
    async (event) => {
      if (!canManageContent) return;

      const file = event.target.files?.[0];
      if (!file) return;

      try {
        setIsImporting(true);
        const result = await importFoods(file);
        const invalidCount = get(result, "preview.invalidCount", 0);

        if (invalidCount > 0) {
          const firstError = get(result, "preview.errors.0.error");
          toast.error(
            `${invalidCount} ta qatorda xato bor. ${firstError || "Import boshlanmadi."}`,
          );
          return;
        }

        toast.success("Ovqat import job sifatida boshlandi");
      } catch (error) {
        const message = error?.response?.data?.message;
        toast.error(
          Array.isArray(message)
            ? message.join(", ")
            : message || "Excel import qilib bo'lmadi",
        );
      } finally {
        setIsImporting(false);
        event.target.value = "";
      }
    },
    [canManageContent, importFoods],
  );

  const handleToggleStatus = async (food) => {
    if (!canManageContent) return;

    try {
      await updateFoodStatus(food.id, !food.isActive);
      toast.success(
        food.isActive ? "Ovqat nofaol qilindi" : "Ovqat faollashtirildi",
      );
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Statusni o'zgartirib bo'lmadi",
      );
    }
  };

  const handleRestoreFood = async (food) => {
    if (!canManageContent) return;

    try {
      await restoreFood(food.id);
      toast.success("Ovqat trashdan tiklandi");
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Ovqatni tiklab bo'lmadi",
      );
    }
  };

  const handleBulkStatus = async (nextIsActive) => {
    if (!canManageContent || !selectedFoodIds.length) return;

    try {
      await updateFoodsStatus({
        ids: selectedFoodIds,
        isActive: nextIsActive,
      });
      toast.success(
        nextIsActive
          ? `${selectedFoodIds.length} ta ovqat faollashtirildi`
          : `${selectedFoodIds.length} ta ovqat nofaol qilindi`,
      );
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Tanlangan ovqatlarni yangilab bo'lmadi",
      );
    }
  };

  const handleBulkRestore = async () => {
    if (!canManageContent || !selectedFoodIds.length) return;

    try {
      await restoreFoods({ ids: selectedFoodIds });
      toast.success(`${selectedFoodIds.length} ta ovqat trashdan tiklandi`);
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Tanlangan ovqatlarni tiklab bo'lmadi",
      );
    }
  };

  const handleBulkTrash = async () => {
    if (!canManageContent || !selectedFoodIds.length) return;

    try {
      await trashFoods({ ids: selectedFoodIds });
      toast.success(`${selectedFoodIds.length} ta ovqat trashga yuborildi`);
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Tanlangan ovqatlarni trashga yuborib bo'lmadi",
      );
    }
  };

  const handleBulkAssignCategories = async () => {
    if (!canManageContent) return;

    if (!selectedFoodIds.length || !bulkCategoryIds.length) {
      toast.error("Kamida bitta kategoriya tanlang");
      return;
    }

    try {
      await assignFoodCategories({
        ids: selectedFoodIds,
        categoryIds: bulkCategoryIds,
      });
      toast.success(
        `${selectedFoodIds.length} ta ovqatga kategoriyalar biriktirildi`,
      );
      setBulkCategoryDrawerOpen(false);
      setBulkCategoryIds([]);
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Kategoriyalarni biriktirib bo'lmadi",
      );
    }
  };

  const handleHardDelete = async () => {
    if (!canHardDelete || !hardDeleteTarget?.ids?.length) return;

    try {
      await hardDeleteFoods({ ids: hardDeleteTarget.ids });
      toast.success(
        hardDeleteTarget.ids.length === 1
          ? "Ovqat butunlay o'chirildi"
          : `${hardDeleteTarget.ids.length} ta ovqat butunlay o'chirildi`,
      );
      setHardDeleteTarget(null);
      setRowSelection({});
    } catch (error) {
      toast.error(
        getMutationErrorMessage(
          error,
          "Ovqatlarni butunlay o'chirib bo'lmadi",
        ),
      );
    }
  };

  const columns = useColumns({
    activeLanguages,
    canManage: canManageContent,
    canHardDelete,
    canReorder: canManageContent && canReorder,
    categoryById,
    cuisineById,
    currentLanguage,
    currentPage,
    pageSize,
    resolveLabel,
    handleToggleStatus,
    handleRestoreFood,
    openEditDrawer,
    openRecipeDrawer,
    openTranslationsDrawer,
    setFoodToDelete,
    setHardDeleteTarget,
  });

  const table = useReactTable({
    data: foods,
    columns,
    manualSorting: true,
    manualPagination: true,
    pageCount: get(meta, "totalPages", 1),
    enableRowSelection: canManageContent,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id.toString(),
    onRowSelectionChange: setRowSelection,
    onSortingChange: handleSortingChange,
    onPaginationChange: (updater) => {
      const prev = { pageIndex: currentPage - 1, pageSize };
      const next = typeof updater === "function" ? updater(prev) : updater;
      const nextPage = Number(next.pageIndex) + 1;
      const nextPageSize = Number(next.pageSize) || pageSize;
      if (
        (!Number.isFinite(nextPage) || nextPage === currentPage) &&
        nextPageSize === pageSize
      ) {
        return;
      }
      React.startTransition(() => {
        void setPageQuery(String(nextPageSize === pageSize ? nextPage : 1));
        void setPageSizeQuery(String(nextPageSize));
      });
    },
    state: {
      rowSelection,
      sorting,
      pagination: { pageIndex: currentPage - 1, pageSize },
    },
  });

  const handleDragEnd = async (event) => {
    if (!canManageContent || !canReorder) return;

    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const currentIds = lodashMap(foods, (food) => food.id.toString());
    const oldIndex = currentIds.indexOf(active.id);
    const newIndex = currentIds.indexOf(over.id);

    if (oldIndex < 0 || newIndex < 0) return;

    const ordered = [...foods];
    const [movedItem] = ordered.splice(oldIndex, 1);
    ordered.splice(newIndex, 0, movedItem);

    const movedIndex = findIndex(ordered, (food) => food.id === movedItem.id);
    const prevId =
      movedIndex > 0 ? String(ordered[movedIndex - 1].id) : undefined;
    const nextId =
      movedIndex < ordered.length - 1
        ? String(ordered[movedIndex + 1].id)
        : undefined;

    try {
      await reorderFoods({
        movedId: String(movedItem.id),
        prevId,
        nextId,
      });
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Tartibni saqlab bo'lmadi",
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ovqatlar bazasi</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Ovqatlar, tarkib va rasmlarni boshqaring
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canManageContent ? (
            <>
              <input
                ref={importFileInputRef}
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={(event) => void handleImportFoods(event)}
              />
              <Button
                variant="outline"
                onClick={() => importFileInputRef.current?.click()}
                disabled={isImporting}
                className="gap-1.5"
              >
                <UploadIcon className="size-4" />
                <span className="hidden sm:inline">
                  {isImporting ? "Import..." : "Excel import"}
                </span>
              </Button>
            </>
          ) : null}
          <Button
            variant="outline"
            onClick={() => void handleExportFoods()}
            disabled={isExporting}
            className="gap-1.5"
          >
            <DownloadIcon className="size-4" />
            <span className="hidden sm:inline">
              {isExporting ? "Export..." : "Excel export"}
            </span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RotateCcwIcon className={cn("size-4", isFetching && "animate-spin")} />
          </Button>
          {canManageContent ? (
            <Button onClick={openCreateDrawer} className="gap-1.5">
              <PlusIcon className="size-4" />
              <span className="hidden xs:inline">Yangi ovqat</span>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Filter
          filterFields={filterFields}
          activeFilters={activeFilters}
          handleFiltersChange={handleFiltersChange}
        />
      </div>

      <DataGrid
        table={table}
        isLoading={isLoading}
        recordCount={get(meta, "total", 0)}
      >
        <div className="w-full flex flex-col gap-2.5">
          <DataGridContainer>
            <ScrollArea className="w-full">
              {canManageContent && canReorder ? (
                <DataGridTableDndRows
                  table={table}
                  dataIds={paginatedFoodIds}
                  handleDragEnd={handleDragEnd}
                />
              ) : (
                <DataGridTable />
              )}
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
          {isLoading ? (
            <div className="px-2 text-sm text-muted-foreground">
              Yuklanmoqda...
            </div>
          ) : null}
          {canManageContent && !canReorder ? (
            <div className="px-2 text-xs text-muted-foreground">
              Tartiblash faqat filterlarsiz va standart saralashda ishlaydi.
            </div>
          ) : null}
          <DataGridPagination
            info="{from} - {to} / {count} ta ovqat"
            rowsPerPageLabel="Sahifada:"
            sizes={[10, 25, 50, 100]}
          />
        </div>
      </DataGrid>

      {canManageContent && selectedFoodCount > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3">
          <div className="pointer-events-auto flex w-full max-w-6xl flex-wrap items-center gap-2 rounded-2xl border bg-background/95 px-3 py-2.5 shadow-2xl backdrop-blur">
            <Badge variant="secondary">{selectedFoodCount} ta</Badge>
            <>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={isAssigningCategories}
                onClick={() => setBulkCategoryDrawerOpen(true)}
              >
                <TagIcon className="size-4" />
                <span className="hidden sm:inline">Kategoriya biriktirish</span>
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                disabled={isBulkUpdatingStatus}
                onClick={() => void handleBulkStatus(true)}
              >
                <span className="hidden sm:inline">Faollashtirish</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={isBulkUpdatingStatus}
                onClick={() => void handleBulkStatus(false)}
              >
                <span className="hidden sm:inline">Nofaol qilish</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={isBulkTrashing}
                onClick={() => void handleBulkTrash()}
              >
                <Trash2Icon className="size-4" />
                <span className="hidden sm:inline">Trashga yuborish</span>
              </Button>
            </>
            <Button
              size="sm"
              variant="ghost"
              disabled={
                isAssigningCategories || isBulkUpdatingStatus || isBulkTrashing
              }
              onClick={() => setRowSelection({})}
            >
              <span className="hidden sm:inline">Bekor qilish</span>
            </Button>
          </div>
        </div>
      ) : null}

      <Outlet />

      <FoodBulkCategoryDrawer
        open={bulkCategoryDrawerOpen}
        onOpenChange={(open) => {
          setBulkCategoryDrawerOpen(open);
          if (!open) setBulkCategoryIds([]);
        }}
        selectedFoodCount={selectedFoodCount}
        assignableCategories={assignableCategories}
        bulkCategoryIds={bulkCategoryIds}
        setBulkCategoryIds={setBulkCategoryIds}
        currentLanguage={currentLanguage}
        isAssigningCategories={isAssigningCategories}
        onAssign={() => void handleBulkAssignCategories()}
      />

      <DeleteAlert
        food={foodToDelete}
        open={Boolean(foodToDelete)}
        onOpenChange={(open) => !open && setFoodToDelete(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      <HardDeleteAlert
        target={hardDeleteTarget}
        open={Boolean(hardDeleteTarget)}
        onOpenChange={(open) => !open && setHardDeleteTarget(null)}
        onConfirm={handleHardDelete}
        isDeleting={isHardDeleting}
      />
    </div>
  );
};

export default Index;
