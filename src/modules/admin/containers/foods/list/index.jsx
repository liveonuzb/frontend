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
  pickBy,
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
  usePostQuery,
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
import FoodTranslationsDrawer from "../components/FoodTranslationsDrawer";
import FoodBulkCategoryDrawer from "../components/FoodBulkCategoryDrawer";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useFoodFilters } from "./use-filters.js";
import { DeleteAlert, HardDeleteAlert } from "./delete-alert.jsx";

const ITEMS_PER_PAGE = 10;

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


const Index = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);

  const { data: categoriesData } = useGetQuery({
    url: "/admin/food-categories",
    queryProps: { queryKey: ["admin", "food-categories"] },
  });
  const categories = get(categoriesData, "data.data", []);

  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const languages = get(languagesData, "data.data", []);

  const {
    search,
    categoryFilter,
    statusFilter,
    hasImageFilter,
    translationsFilter,
    duplicatesFilter,
    sortBy,
    sortDir,
    pageQuery,
    setPageQuery,
    currentPage,
    pageSize,
    sorting,
    canReorder,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  } = useFoodFilters({ categories, currentLanguage, resolveLabel });

  const deferredSearch = React.useDeferredValue(search);
  const queryParams = React.useMemo(
    () => ({
      ...(trim(deferredSearch) ? { q: trim(deferredSearch) } : {}),
      ...(categoryFilter !== "all" ? { categoryId: categoryFilter } : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(hasImageFilter !== "all" ? { hasImage: hasImageFilter } : {}),
      ...(translationsFilter !== "all"
        ? { translations: translationsFilter }
        : {}),
      ...(duplicatesFilter !== "all" ? { duplicates: duplicatesFilter } : {}),
      sortBy,
      sortDir,
      page: currentPage,
      pageSize: ITEMS_PER_PAGE,
    }),
    [
      categoryFilter,
      currentPage,
      deferredSearch,
      duplicatesFilter,
      hasImageFilter,
      sortBy,
      sortDir,
      translationsFilter,
      statusFilter,
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
  const importMutation = usePostQuery({
    queryKey: FOODS_QUERY_KEY,
    mutationProps: { onSuccess: invalidateFoodAndCategories },
  });

  const isUpdating =
    statusMutation.isPending ||
    bulkStatusMutation.isPending ||
    bulkTrashMutation.isPending ||
    restoreMutation.isPending ||
    bulkRestoreMutation.isPending ||
    bulkAssignCategoriesMutation.isPending ||
    hardDeleteMutation.isPending ||
    reorderMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const isBulkUpdatingStatus = bulkStatusMutation.isPending;
  const isBulkTrashing = bulkTrashMutation.isPending;
  const isAssigningCategories = bulkAssignCategoriesMutation.isPending;
  const isHardDeleting = hardDeleteMutation.isPending;
  const isRestoring = restoreMutation.isPending || bulkRestoreMutation.isPending;
  const isImporting = importMutation.isPending;

  const updateFood = React.useCallback(
    async (id, payload, config = {}) =>
      statusMutation.mutateAsync({ url: `/admin/foods/${id}`, attributes: payload, config }),
    [statusMutation],
  );
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
    const response = await request.get("/admin/foods/export", {
      params: queryParams,
      responseType: "blob",
    });
    return {
      blob: get(response, "data"),
      fileName:
        response.headers?.["content-disposition"]?.match(/filename="?([^"]+)"?/)?.[1] || "foods.xlsx",
    };
  }, [queryParams, request]);
  const importFoods = React.useCallback(
    async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await importMutation.mutateAsync({
        url: "/admin/foods/import",
        attributes: formData,
        config: { headers: { "Content-Type": "multipart/form-data" } },
      });
      return get(response, "data");
    },
    [importMutation],
  );

  const activeLanguages = React.useMemo(
    () => lodashFilter(languages, (language) => language.isActive),
    [languages],
  );

  const categoryById = React.useMemo(
    () => keyBy(categories, "id"),
    [categories],
  );
  const assignableCategories = React.useMemo(
    () => lodashFilter(categories, (category) => category.isActive),
    [categories],
  );

  const currentLanguageMeta = React.useMemo(
    () =>
      find(activeLanguages, (language) => language.code === currentLanguage),
    [activeLanguages, currentLanguage],
  );

  const [translationsDrawerOpen, setTranslationsDrawerOpen] =
    React.useState(false);
  const [bulkCategoryDrawerOpen, setBulkCategoryDrawerOpen] =
    React.useState(false);
  const [translatingFood, setTranslatingFood] = React.useState(null);
  const [rowSelection, setRowSelection] = React.useState({});
  const [translationForm, setTranslationForm] = React.useState({});
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
    const totalPages = get(meta, "totalPages", 1);
    if (currentPage > totalPages) {
      void setPageQuery(String(totalPages));
    }
  }, [currentPage, meta, setPageQuery]);

  React.useEffect(() => {
    setRowSelection({});
  }, [
    categoryFilter,
    currentPage,
    duplicatesFilter,
    hasImageFilter,
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
    navigate("create");
  };

  const openEditDrawer = (food) => {
    navigate(`edit/${food.id}`);
  };

  const openTranslationsDrawer = (food) => {
    setTranslatingFood(food);
    setTranslationForm(
      Object.fromEntries(
        lodashMap(activeLanguages, (language) => [
          language.code,
          resolveLabel(food?.translations, food?.name ?? "", language.code),
        ]),
      ),
    );
    setTranslationsDrawerOpen(true);
  };

  const handleTranslationSave = async () => {
    if (!translatingFood) return;

    const localizedName = trim(
      String(get(translationForm, currentLanguage, "")),
    );
    const cleanedTranslations = pickBy(
      Object.fromEntries(
        lodashMap(translationForm || {}, (value, code) => [
          code,
          trim(String(value ?? "")),
        ]),
      ),
      Boolean,
    );
    const payload = {
      translations: cleanedTranslations,
      ...(localizedName ? { name: localizedName } : {}),
    };

    try {
      await updateFood(translatingFood.id, payload);
      toast.success("Tarjimalar yangilandi");
      setTranslationsDrawerOpen(false);
      setTranslatingFood(null);
      setTranslationForm({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Tarjimalarni saqlab bo'lmadi",
      );
    }
  };

  const handleDelete = async () => {
    if (!foodToDelete) return;

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
      const { blob, fileName } = await exportFoods();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName || "foods.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Ovqatlar Excel faylga eksport qilindi");
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
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const result = await importFoods(file);
        toast.success(
          `${get(result, "importedCount", 0)} ta ovqat Excel orqali import qilindi`,
        );
      } catch (error) {
        const message = error?.response?.data?.message;
        toast.error(
          Array.isArray(message)
            ? message.join(", ")
            : message || "Excel import qilib bo'lmadi",
        );
      } finally {
        event.target.value = "";
      }
    },
    [importFoods],
  );

  const handleToggleStatus = async (food) => {
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
    if (!selectedFoodIds.length) return;

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
    if (!selectedFoodIds.length) return;

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
    if (!selectedFoodIds.length) return;

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
    if (!hardDeleteTarget?.ids?.length) return;

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
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Ovqatlarni butunlay o'chirib bo'lmadi",
      );
    }
  };

  const columns = useColumns({
    activeLanguages,
    canReorder,
    categoryById,
    currentLanguage,
    currentPage,
    pageSize,
    resolveLabel,
    handleToggleStatus,
    handleRestoreFood,
    openEditDrawer,
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
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id.toString(),
    onRowSelectionChange: setRowSelection,
    onSortingChange: handleSortingChange,
    onPaginationChange: (updater) => {
      const prev = { pageIndex: currentPage - 1, pageSize: ITEMS_PER_PAGE };
      const next = typeof updater === "function" ? updater(prev) : updater;
      React.startTransition(() => {
        void setPageQuery(String(next.pageIndex + 1));
      });
    },
    state: {
      rowSelection,
      sorting,
      pagination: { pageIndex: currentPage - 1, pageSize: ITEMS_PER_PAGE },
    },
  });

  const handleDragEnd = async (event) => {
    if (!canReorder) return;

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
          <Button onClick={openCreateDrawer} className="gap-1.5">
            <PlusIcon className="size-4" />
            <span className="hidden xs:inline">Yangi ovqat</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Filter
          filterFields={filterFields}
          activeFilters={activeFilters}
          handleFiltersChange={handleFiltersChange}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          className="hidden xl:flex"
          disabled={isFetching}
        >
          <RotateCcwIcon className={cn("size-4", isFetching && "animate-spin")} />
        </Button>
      </div>

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
          {!canReorder ? (
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

      {selectedFoodCount > 0 ? (
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

      <FoodTranslationsDrawer
        open={translationsDrawerOpen}
        onOpenChange={(open) => {
          setTranslationsDrawerOpen(open);
          if (!open) {
            setTranslatingFood(null);
            setTranslationForm({});
          }
        }}
        translatingFood={translatingFood}
        translationForm={translationForm}
        setTranslationForm={setTranslationForm}
        activeLanguages={activeLanguages}
        currentLanguage={currentLanguage}
        currentLanguageMeta={currentLanguageMeta}
        isUpdating={isUpdating}
        onSave={handleTranslationSave}
      />

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
