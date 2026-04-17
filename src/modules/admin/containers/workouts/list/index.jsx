import React from "react";
import { useNavigate, Outlet } from "react-router";
import {
  chain,
  filter as lodashFilter,
  find,
  findIndex,
  get,
  includes,
  isArray,
  isObject,
  keyBy,
  map as lodashMap,
  pickBy,
  trim,
  values,
} from "lodash";
import { useBreadcrumbStore, useLanguageStore } from "@/store";
import {
  useGetQuery,
  usePatchQuery,
  useDeleteQuery,
} from "@/hooks/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DataGrid,
  DataGridContainer,
  DataGridTableDndRows,
  DataGridTable,
} from "@/components/reui/data-grid";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  GlobeIcon,
  PlusIcon,
  RotateCcwIcon,
  TagIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useWorkoutFilters } from "./use-filters.js";
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
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);

  const { data: categoriesData } = useGetQuery({
    url: "/admin/workout-categories",
    queryProps: { queryKey: ["admin", "workout-categories"] },
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
    lifecycleFilter,
    currentPage,
    sortBy,
    sortDir,
    sorting,
    queryParams,
    setPageQuery,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  } = useWorkoutFilters({ categories, currentLanguage });

  const apiParams = React.useMemo(() => {
    const p = {};
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined || value === "all") return;
      if (key === "pageSize") { p.limit = value; }
      else if (key === "q" || key === "search") { p.query = value; }
      else if (key === "sortDir") { p.sortOrder = value; }
      else if (key === "sortBy") { p.sortBy = value; }
      else if (key === "categoryId") { p.categoryId = value; }
      else if (key === "page") { p.page = value; }
      else if (key === "status") {
        if (value === "active") p.isActive = "true";
        if (value === "inactive") p.isActive = "false";
      } else if (key === "lifecycle") {
        if (value === "trash") p.isTrashed = "true";
        if (value === "active") p.isTrashed = "false";
      }
    });
    return p;
  }, [queryParams]);

  const WORKOUTS_QUERY_KEY = ["admin-workouts"];

  const { data: workoutsData, isLoading, isFetching } = useGetQuery({
    url: "/admin/workouts",
    params: apiParams,
    queryProps: {
      queryKey: [...WORKOUTS_QUERY_KEY, apiParams],
    },
  });

  const workouts = get(workoutsData, "data.data", []);
  const meta = get(workoutsData, "data.meta", {});

  const updateMutation = usePatchQuery({
    queryKey: WORKOUTS_QUERY_KEY,
  });
  const deleteMutation = useDeleteQuery({
    queryKey: WORKOUTS_QUERY_KEY,
  });
  const statusMutation = usePatchQuery({
    queryKey: WORKOUTS_QUERY_KEY,
  });
  const bulkStatusMutation = usePatchQuery({
    queryKey: WORKOUTS_QUERY_KEY,
  });
  const reorderMutation = usePatchQuery({
    queryKey: WORKOUTS_QUERY_KEY,
  });
  const trashMutation = usePatchQuery({
    queryKey: WORKOUTS_QUERY_KEY,
  });
  const restoreMutation = usePatchQuery({
    queryKey: WORKOUTS_QUERY_KEY,
  });
  const bulkRestoreMutation = usePatchQuery({
    queryKey: WORKOUTS_QUERY_KEY,
  });
  const assignCategoriesMutation = usePatchQuery({
    queryKey: WORKOUTS_QUERY_KEY,
  });
  const hardDeleteMutation = useDeleteQuery({
    queryKey: WORKOUTS_QUERY_KEY,
  });

  const exportWorkouts = async () => ({
    blob: new Blob(),
    fileName: "workouts.xlsx",
  });
  const importWorkouts = async () => ({ importedCount: 0 });

  const isUpdating = updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const isBulkUpdatingStatus = bulkStatusMutation.isPending;
  const isBulkTrashing = trashMutation.isPending;
  const isAssigningCategories = assignCategoriesMutation.isPending;
  const isHardDeleting = hardDeleteMutation.isPending;
  const isRestoring = restoreMutation.isPending || bulkRestoreMutation.isPending;
  const isImporting = false;

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
  const [translatingWorkout, setTranslatingWorkout] = React.useState(null);
  const [rowSelection, setRowSelection] = React.useState({});
  const [translationForm, setTranslationForm] = React.useState({});
  const [bulkCategoryIds, setBulkCategoryIds] = React.useState([]);
  const [workoutToDelete, setWorkoutToDelete] = React.useState(null);
  const [hardDeleteTarget, setHardDeleteTarget] = React.useState(null);
  const importFileInputRef = React.useRef(null);
  const [isExporting, setIsExporting] = React.useState(false);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/workouts", title: "Mashg'ulotlar bazasi" },
    ]);
  }, [setBreadcrumbs]);

  const canReorder =
    trim(search) === "" &&
    categoryFilter === "all" &&
    statusFilter === "all" &&
    hasImageFilter === "all" &&
    translationsFilter === "all" &&
    duplicatesFilter === "all" &&
    lifecycleFilter === "active" &&
    sortBy === "orderKey" &&
    sortDir === "asc" &&
    currentPage === 1 &&
    get(meta, "totalPages", 1) === 1;

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
    lifecycleFilter,
    search,
    sortBy,
    sortDir,
    translationsFilter,
    statusFilter,
  ]);

  const paginatedWorkoutIds = React.useMemo(
    () => lodashMap(workouts, (workout) => String(workout.id)),
    [workouts],
  );
  const selectedWorkoutIds = React.useMemo(
    () =>
      chain(rowSelection)
        .entries()
        .filter(([, selected]) => Boolean(selected))
        .map(([id]) => Number(id))
        .filter((id) => Number.isInteger(id))
        .value(),
    [rowSelection],
  );
  const selectedWorkoutCount = selectedWorkoutIds.length;

  const openCreateDrawer = () => {
    navigate("create");
  };

  const openEditDrawer = (workout) => {
    navigate(`edit/${workout.id}`);
  };

  const openTranslationsDrawer = (workout) => {
    setTranslatingWorkout(workout);
    setTranslationForm(
      Object.fromEntries(
        lodashMap(activeLanguages, (language) => [
          language.code,
          resolveLabel(
            workout?.translations,
            workout?.name ?? "",
            language.code,
          ),
        ]),
      ),
    );
    setTranslationsDrawerOpen(true);
  };

  const handleTranslationSave = async () => {
    if (!translatingWorkout) return;

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
      await updateMutation.mutateAsync({
        url: `/admin/workouts/${translatingWorkout.id}`,
        attributes: payload,
      });
      toast.success("Tarjimalar yangilandi");
      setTranslationsDrawerOpen(false);
      setTranslatingWorkout(null);
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
    if (!workoutToDelete) return;

    try {
      await deleteMutation.mutateAsync({
        url: `/admin/workouts/${workoutToDelete.id}`,
      });
      toast.success("Mashg'ulot trashga yuborildi");
      setWorkoutToDelete(null);
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "O'chirib bo'lmadi",
      );
    }
  };

  const handleExportWorkouts = React.useCallback(async () => {
    try {
      setIsExporting(true);
      const { blob, fileName } = await exportWorkouts();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "workouts.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Mashg'ulotlar Excel faylga eksport qilindi");
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
  }, [exportWorkouts]);

  const handleImportWorkouts = React.useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const result = await importWorkouts(file);
        toast.success(
          `${get(result, "importedCount", 0)} ta mashg'ulot Excel orqali import qilindi`,
        );
      } catch (error) {
        const message = error?.response?.data?.message;
        toast.error(
          isArray(message)
            ? message.join(", ")
            : message || "Excel import qilib bo'lmadi",
        );
      } finally {
        event.target.value = "";
      }
    },
    [importWorkouts],
  );

  const handleToggleStatus = async (workout) => {
    try {
      await statusMutation.mutateAsync({
        url: `/admin/workouts/${workout.id}/status`,
        attributes: { isActive: !workout.isActive },
      });
      toast.success(
        workout.isActive
          ? "Mashg'ulot nofaol qilindi"
          : "Mashg'ulot faollashtirildi",
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

  const handleRestoreWorkout = async (workout) => {
    try {
      await restoreMutation.mutateAsync({
        url: `/admin/workouts/${workout.id}/restore`,
        attributes: {},
      });
      toast.success("Mashg'ulot trashdan tiklandi");
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Mashg'ulotni tiklab bo'lmadi",
      );
    }
  };

  const handleBulkStatus = async (nextIsActive) => {
    if (!selectedWorkoutIds.length) return;
    try {
      await bulkStatusMutation.mutateAsync({
        url: "/admin/workouts/status",
        attributes: {
          workoutIds: selectedWorkoutIds,
          isActive: nextIsActive,
        },
      });
      toast.success(
        nextIsActive
          ? `${selectedWorkoutIds.length} ta mashg'ulot faollashtirildi`
          : `${selectedWorkoutIds.length} ta mashg'ulot nofaol qilindi`,
      );
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Tanlangan mashg'ulotlarni yangilab bo'lmadi",
      );
    }
  };

  const handleBulkRestore = async () => {
    if (!selectedWorkoutIds.length) return;
    try {
      await bulkRestoreMutation.mutateAsync({
        url: "/admin/workouts/restore",
        attributes: { workoutIds: selectedWorkoutIds },
      });
      toast.success(
        `${selectedWorkoutIds.length} ta mashg'ulot trashdan tiklandi`,
      );
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Tanlangan mashg'ulotlarni tiklab bo'lmadi",
      );
    }
  };

  const handleBulkTrash = async () => {
    if (!selectedWorkoutIds.length) return;
    try {
      await trashMutation.mutateAsync({
        url: "/admin/workouts/trash",
        attributes: { workoutIds: selectedWorkoutIds },
      });
      toast.success(
        `${selectedWorkoutIds.length} ta mashg'ulot trashga yuborildi`,
      );
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Tanlangan mashg'ulotlarni trashga yuborib bo'lmadi",
      );
    }
  };

  const handleBulkAssignCategories = async () => {
    if (!selectedWorkoutIds.length || !bulkCategoryIds.length) {
      toast.error("Kamida bitta kategoriya tanlang");
      return;
    }
    try {
      await assignCategoriesMutation.mutateAsync({
        url: "/admin/workouts/assign-categories",
        attributes: {
          workoutIds: selectedWorkoutIds,
          categoryIds: bulkCategoryIds,
        },
      });
      toast.success(
        `${selectedWorkoutIds.length} ta mashg'ulotga kategoriyalar biriktirildi`,
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
      await hardDeleteMutation.mutateAsync({
        url: "/admin/workouts/hard-delete",
        attributes: { data: { workoutIds: hardDeleteTarget.ids } },
      });
      toast.success(
        hardDeleteTarget.ids.length === 1
          ? "Mashg'ulot butunlay o'chirildi"
          : `${hardDeleteTarget.ids.length} ta mashg'ulot butunlay o'chirildi`,
      );
      setHardDeleteTarget(null);
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Mashg'ulotlarni butunlay o'chirib bo'lmadi",
      );
    }
  };

  const columns = useColumns({
    activeLanguages,
    canReorder,
    categoryById,
    currentLanguage,
    currentPage,
    handleToggleStatus,
    handleRestoreWorkout,
    openEditDrawer,
    openTranslationsDrawer,
    setWorkoutToDelete,
    setHardDeleteTarget,
  });

  const table = useReactTable({
    data: workouts,
    columns,
    manualSorting: true,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id.toString(),
    onRowSelectionChange: setRowSelection,
    onSortingChange: handleSortingChange,
    state: {
      rowSelection,
      sorting,
    },
  });

  const handleDragEnd = async (event) => {
    if (!canReorder) return;
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const currentIds = lodashMap(workouts, (workout) => workout.id.toString());
    const oldIndex = currentIds.indexOf(active.id);
    const newIndex = currentIds.indexOf(over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const ordered = [...workouts];
    const [movedItem] = ordered.splice(oldIndex, 1);
    ordered.splice(newIndex, 0, movedItem);

    const movedIndex = findIndex(
      ordered,
      (workout) => workout.id === movedItem.id,
    );
    const prevId =
      movedIndex > 0 ? String(ordered[movedIndex - 1].id) : undefined;
    const nextId =
      movedIndex < ordered.length - 1
        ? String(ordered[movedIndex + 1].id)
        : undefined;

    try {
      await reorderMutation.mutateAsync({
        url: "/admin/workouts/reorder",
        attributes: {
          movedId: String(movedItem.id),
          prevId,
          nextId,
        },
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Mashg'ulotlar bazasi
          </h1>
          <p className="text-muted-foreground">
            Mashg'ulotlar, tarkib va rasmlarni boshqaring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={importFileInputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="hidden"
            onChange={(event) => void handleImportWorkouts(event)}
          />
          <Button
            variant="outline"
            onClick={() => importFileInputRef.current?.click()}
            disabled={isImporting}
            className="gap-1.5"
          >
            <UploadIcon className="size-4" />
            {isImporting ? "Import..." : "Excel import"}
          </Button>
          <Button
            variant="outline"
            onClick={() => void handleExportWorkouts()}
            disabled={isExporting}
            className="gap-1.5"
          >
            <DownloadIcon className="size-4" />
            {isExporting ? "Export..." : "Excel export"}
          </Button>
          <Button onClick={openCreateDrawer} className="gap-1.5">
            <PlusIcon className="size-4" />
            Yangi mashg'ulot
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Filter
          filterFields={filterFields}
          activeFilters={activeFilters}
          handleFiltersChange={handleFiltersChange}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => queryClient.invalidateQueries({ queryKey: WORKOUTS_QUERY_KEY })}
          className="hidden xl:flex"
          disabled={isLoading}
        >
          <RotateCcwIcon className={cn("size-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      <DataGridContainer>
        <ScrollArea className="w-full">
          <DataGrid
            table={table}
            isLoading={isLoading}
            recordCount={workouts.length}
          >
            {canReorder ? (
              <DataGridTableDndRows
                table={table}
                dataIds={paginatedWorkoutIds}
                handleDragEnd={handleDragEnd}
              />
            ) : (
              <DataGridTable />
            )}
          </DataGrid>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        {isLoading ? (
          <div className="px-4 pb-4 text-sm text-muted-foreground">
            Yuklanmoqda...
          </div>
        ) : null}
        {!canReorder ? (
          <div className="px-4 pb-4 text-xs text-muted-foreground">
            Tartiblash faqat filterlarsiz va standart saralashda ishlaydi.
          </div>
        ) : null}
      </DataGridContainer>

      {get(meta, "total", 0) > ITEMS_PER_PAGE ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {get(meta, "total", 0)} ta mashg'ulotdan{" "}
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
            {Math.min(currentPage * ITEMS_PER_PAGE, get(meta, "total", 0))}{" "}
            ko'rsatilmoqda
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={currentPage === 1}
              onClick={() => void setPageQuery(String(currentPage - 1))}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="text-sm font-medium px-2">
              {currentPage} / {get(meta, "totalPages", 1)}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={currentPage === get(meta, "totalPages", 1)}
              onClick={() => void setPageQuery(String(currentPage + 1))}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {selectedWorkoutCount > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
          <div className="pointer-events-auto flex w-full max-w-6xl flex-wrap items-center gap-2 rounded-2xl border bg-background/95 px-4 py-3 shadow-2xl backdrop-blur">
            <Badge variant="secondary">
              {selectedWorkoutCount} ta tanlandi
            </Badge>
            {lifecycleFilter === "trash" ? (
              <>
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={isRestoring}
                  onClick={() => void handleBulkRestore()}
                >
                  <RotateCcwIcon className="size-4" />
                  Tiklash
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-destructive"
                  disabled={isHardDeleting}
                  onClick={() =>
                    setHardDeleteTarget({
                      ids: selectedWorkoutIds,
                    })
                  }
                >
                  <Trash2Icon className="size-4" />
                  Butunlay o'chirish
                </Button>
              </>
            ) : lifecycleFilter === "active" ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={isAssigningCategories}
                  onClick={() => setBulkCategoryDrawerOpen(true)}
                >
                  <TagIcon className="size-4" />
                  Kategoriya biriktirish
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={isBulkUpdatingStatus}
                  onClick={() => void handleBulkStatus(true)}
                >
                  Faollashtirish
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={isBulkUpdatingStatus}
                  onClick={() => void handleBulkStatus(false)}
                >
                  Nofaol qilish
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={isBulkTrashing}
                  onClick={() => void handleBulkTrash()}
                >
                  <Trash2Icon className="size-4" />
                  Trashga yuborish
                </Button>
              </>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              disabled={
                isAssigningCategories ||
                isBulkUpdatingStatus ||
                isBulkTrashing ||
                isHardDeleting ||
                isRestoring
              }
              onClick={() => setRowSelection({})}
            >
              Bekor qilish
            </Button>
          </div>
        </div>
      ) : null}

      <Outlet />

      <Drawer
        open={translationsDrawerOpen}
        onOpenChange={(open) => {
          setTranslationsDrawerOpen(open);
          if (!open) {
            setTranslatingWorkout(null);
            setTranslationForm({});
          }
        }}
        direction="bottom"
      >
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-md mx-auto">
          <div className="mx-auto w-full">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <GlobeIcon className="size-5" />
                Tarjimalarni boshqarish
              </DrawerTitle>
              <DrawerDescription>
                Barcha faol tillar shu yerdan tahrirlanadi. Istasangiz joriy
                locale nomini ham shu drawerda yangilashingiz mumkin.
              </DrawerDescription>
            </DrawerHeader>

            <div className="px-6 py-4 space-y-5">
              <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
                <p className="font-medium">
                  {translatingWorkout
                    ? resolveLabel(
                        translatingWorkout.translations,
                        translatingWorkout.name,
                        currentLanguage,
                      )
                    : "Mashg'ulot"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Joriy til:{" "}
                  {currentLanguageMeta?.flag
                    ? `${currentLanguageMeta.flag} `
                    : ""}
                  {currentLanguageMeta?.name ?? currentLanguage.toUpperCase()}.
                  Shu til qiymati saqlansa, asosiy nom ham yangilanadi.
                </p>
              </div>

              {activeLanguages.length > 0 ? (
                <div className="space-y-4">
                  {lodashMap(activeLanguages, (language) => (
                    <div key={language.id} className="space-y-2">
                      <Label className="text-xs font-medium flex items-center gap-2">
                        <span>{language.flag}</span>
                        {language.name}
                        {language.code === currentLanguage ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                            Asosiy
                          </span>
                        ) : null}
                      </Label>
                      <Input
                        value={translationForm[language.code] || ""}
                        onChange={(event) =>
                          setTranslationForm((current) => ({
                            ...current,
                            [language.code]: event.target.value,
                          }))
                        }
                        placeholder={`${language.name} tilidagi tarjima`}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <DrawerFooter className="border-t bg-muted/5 gap-2 px-6 py-4">
              <Button
                onClick={handleTranslationSave}
                disabled={isUpdating || !activeLanguages.length}
              >
                Tarjimalarni saqlash
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Bekor qilish</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={bulkCategoryDrawerOpen}
        onOpenChange={(open) => {
          setBulkCategoryDrawerOpen(open);
          if (!open) {
            setBulkCategoryIds([]);
          }
        }}
        direction="bottom"
      >
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-md mx-auto">
          <div className="mx-auto w-full">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <TagIcon className="size-5" />
                Bulk kategoriya biriktirish
              </DrawerTitle>
              <DrawerDescription>
                Tanlangan {selectedWorkoutCount} ta mashg'ulotga qo'shimcha
                kategoriyalar biriktiriladi.
              </DrawerDescription>
            </DrawerHeader>

            <div className="px-6 py-4 space-y-3">
              {assignableCategories.length ? (
                lodashMap(assignableCategories, (category) => (
                  <label
                    key={category.id}
                    className="flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {resolveLabel(
                          category.translations,
                          category.name,
                          currentLanguage,
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ID: {category.id}
                      </p>
                    </div>
                    <Checkbox
                      checked={includes(bulkCategoryIds, category.id)}
                      onCheckedChange={(checked) =>
                        setBulkCategoryIds((current) =>
                          checked
                            ? [...current, category.id]
                            : lodashFilter(
                                current,
                                (item) => item !== category.id,
                              ),
                        )
                      }
                    />
                  </label>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Faol kategoriyalar topilmadi.
                </p>
              )}
            </div>

            <DrawerFooter className="border-t bg-muted/5 gap-2 px-6 py-4">
              <Button
                onClick={() => void handleBulkAssignCategories()}
                disabled={!bulkCategoryIds.length || isAssigningCategories}
              >
                Kategoriyalarni biriktirish
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Bekor qilish</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      <DeleteAlert
        workout={workoutToDelete}
        open={Boolean(workoutToDelete)}
        onOpenChange={(open) => !open && setWorkoutToDelete(null)}
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
