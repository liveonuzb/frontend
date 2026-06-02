import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Outlet, useMatch } from "react-router";
import toPairs from "lodash/toPairs";
import lodashFilter from "lodash/filter";
import find from "lodash/find";
import findIndex from "lodash/findIndex";
import get from "lodash/get";
import includes from "lodash/includes";
import isArray from "lodash/isArray";
import isObject from "lodash/isObject";
import keyBy from "lodash/keyBy";
import lodashMap from "lodash/map";
import pickBy from "lodash/pickBy";
import trim from "lodash/trim";
import values from "lodash/values";
import forEach from "lodash/forEach";
import fromPairs from "lodash/fromPairs";
import take from "lodash/take";
import toUpper from "lodash/toUpper";
import toNumber from "lodash/toNumber";
import { useBreadcrumbStore, useLanguageStore } from "@/store";
import {
  useGetQuery,
  usePatchQuery,
  useDeleteQuery,
} from "@/hooks/api";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
import useApi from "@/hooks/api/use-api.js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Drawer,
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
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import {
  DownloadIcon,
  GlobeIcon,
  PlusIcon,
  RotateCcwIcon,
  TagIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminDrawerListNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner.jsx";
import useColumns from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useWorkoutFilters } from "./use-filters.js";
import { DeleteAlert, HardDeleteAlert } from "./delete-alert.jsx";

const getMutationErrorMessage = (error, fallback) => {
  const response = error?.response?.data;
  const message = response?.message;
  const dependencySummary = response?.dependencySummary;
  const baseMessage = isArray(message) ? message.join(", ") : message;

  return lodashFilter([baseMessage || fallback, dependencySummary], Boolean).join(" ");
};

const WORKOUTS_QUERY_KEY = ["admin-workouts"];

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const navigateAdminDrawer = useAdminDrawerListNavigation();
  const { request } = useApi();
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useAdminPermissions();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const canHardDelete = isSuperAdmin;
  const translateMatch = useMatch("/admin/workouts/list/translate/:id");
  const translatingWorkoutId = get(translateMatch, "params.id");
  const translationsDrawerOpen = Boolean(translatingWorkoutId);

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
    onboardingFilter,
    hasImageFilter,
    translationsFilter,
    duplicatesFilter,
    lifecycleFilter,
    currentPage,
    pageSize,
    sortBy,
    sortDir,
    sorting,
    queryParams,
    setPageQuery,
    setPageSizeQuery,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  } = useWorkoutFilters({ categories, currentLanguage });

  const apiParams = React.useMemo(() => {
    const p = {};
    forEach(toPairs(queryParams), ([key, value]) => {
      if (value === "" || value === null || value === undefined || value === "all") return;
      if (key === "pageSize") { p.pageSize = value; }
      else if (key === "q" || key === "search") { p.query = value; }
      else if (key === "sortDir") { p.sortOrder = value; }
      else if (key === "sortBy") { p.sortBy = value; }
      else if (key === "categoryId") { p.categoryId = value; }
      else if (key === "page") { p.page = value; }
      else if (key === "onboarding") { p.onboarding = value; }
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

  const { data: workoutsData, isLoading, isFetching } = useGetQuery({
    url: "/admin/workouts",
    params: apiParams,
    queryProps: {
      queryKey: [...WORKOUTS_QUERY_KEY, apiParams],
    },
  });

  const workouts = get(workoutsData, "data.data", []);
  const meta = get(workoutsData, "data.meta", {});

  const {
    data: translatingWorkoutData,
    isLoading: isTranslatingLoading,
  } = useGetQuery({
    url: `/admin/workouts/${translatingWorkoutId || ""}`,
    queryProps: {
      queryKey: [...WORKOUTS_QUERY_KEY, "detail", translatingWorkoutId],
      enabled: Boolean(translatingWorkoutId),
    },
  });
  const translatingWorkout = get(translatingWorkoutData, "data.data");

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
  const hardDeleteMutation = usePatchQuery({
    queryKey: WORKOUTS_QUERY_KEY,
  });

  const exportWorkouts = React.useCallback(async () => {
    const response = await request.get("/admin/workouts/export", {
      params: apiParams,
      responseType: "blob",
    });

    return {
      blob: get(response, "data"),
      fileName:
        response.headers?.["content-disposition"]?.match(
          /filename="?([^"]+)"?/,
        )?.[1] || "workouts.xlsx",
    };
  }, [apiParams, request]);
  const importWorkouts = React.useCallback(
    async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      const previewResponse = await request.post(
        "/admin/workouts/import/preview",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const preview = get(
        previewResponse,
        "data.data",
        get(previewResponse, "data"),
      );

      if (get(preview, "invalidCount", 0) > 0) {
        return { preview, result: null };
      }

      const importResponse = await request.post(
        "/admin/workouts/import",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      return {
        preview,
        result: get(importResponse, "data.data", get(importResponse, "data")),
      };
    },
    [request],
  );

  const isUpdating = updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const isBulkUpdatingStatus = bulkStatusMutation.isPending;
  const isBulkTrashing = trashMutation.isPending;
  const isAssigningCategories = assignCategoriesMutation.isPending;
  const isHardDeleting = hardDeleteMutation.isPending;
  const isRestoring = restoreMutation.isPending || bulkRestoreMutation.isPending;

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

  const [bulkCategoryDrawerOpen, setBulkCategoryDrawerOpen] =
    React.useState(false);
  const [rowSelection, setRowSelection] = React.useState({});
  const [translationForm, setTranslationForm] = React.useState({});
  const [bulkCategoryIds, setBulkCategoryIds] = React.useState([]);
  const [workoutToDelete, setWorkoutToDelete] = React.useState(null);
  const [hardDeleteTarget, setHardDeleteTarget] = React.useState(null);
  const importFileInputRef = React.useRef(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [importPreview, setImportPreview] = React.useState(null);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/workouts", title: t("admin.workouts.list.title") },
    ]);
  }, [setBreadcrumbs, t]);

  const canReorder =
    trim(search) === "" &&
    categoryFilter === "all" &&
    statusFilter === "all" &&
    onboardingFilter === "all" &&
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
    pageSize,
    statusFilter,
  ]);

  const paginatedWorkoutIds = React.useMemo(
    () => lodashMap(workouts, (workout) => String(workout.id)),
    [workouts],
  );
  const selectedWorkoutIds = React.useMemo(
    () =>
      lodashFilter(lodashMap(lodashFilter(toPairs(rowSelection), ([, selected]) => Boolean(selected)), ([id]) => toNumber(id)), (id) => Number.isInteger(id)),
    [rowSelection],
  );
  const selectedWorkoutCount = selectedWorkoutIds.length;

  const openCreateDrawer = () => {
    navigateAdminDrawer("create");
  };

  const openEditDrawer = (workout) => {
    navigateAdminDrawer(`edit/${workout.id}`);
  };

  React.useEffect(() => {
    if (!translatingWorkout) return;

    setTranslationForm(
      fromPairs(lodashMap(activeLanguages, (language) => [
        language.code,
        resolveLabel(
          translatingWorkout?.translations,
          translatingWorkout?.name ?? "",
          language.code,
        ),
      ])),
    );
  }, [activeLanguages, translatingWorkout]);

  const openTranslationsDrawer = (workout) => {
    setTranslationForm(
      fromPairs(lodashMap(activeLanguages, (language) => [
        language.code,
        resolveLabel(
          workout?.translations,
          workout?.name ?? "",
          language.code,
        ),
      ])),
    );
    navigate(`translate/${workout.id}`);
  };

  const handleTranslationSave = async () => {
    if (!translatingWorkout) return;

    const localizedName = trim(
      String(get(translationForm, currentLanguage, "")),
    );
    const cleanedTranslations = pickBy(
      fromPairs(lodashMap(translationForm || {}, (value, code) => [
        code,
        trim(String(value ?? "")),
      ])),
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
      toast.success(t("admin.workouts.messages.translationsUpdated"));
      setTranslationForm({});
      navigate("/admin/workouts/list");
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || t("admin.workouts.messages.translationSaveError"),
      );
    }
  };

  const handleDelete = async () => {
    if (!workoutToDelete) return;

    try {
      await deleteMutation.mutateAsync({
        url: `/admin/workouts/${workoutToDelete.id}`,
      });
      toast.success(t("admin.workouts.messages.movedToTrash"));
      setWorkoutToDelete(null);
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || t("admin.workouts.messages.deleteError"),
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
      toast.success(t("admin.workouts.messages.exported"));
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || t("admin.workouts.messages.exportError"),
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
        setIsImporting(true);
        const result = await importWorkouts(file);
        const invalidCount = get(result, "preview.invalidCount", 0);

        if (invalidCount > 0) {
          setImportPreview(get(result, "preview"));
          const firstError = get(result, "preview.errors.0.error");
          toast.error(
            t("admin.workouts.messages.importPreviewError", {
              count: invalidCount,
              error: firstError || t("admin.workouts.messages.importNotStarted"),
            }),
          );
          return;
        }

        const importedCount = get(result, "result.importedCount", 0);
        toast.success(
          t("admin.workouts.messages.imported", { count: importedCount }),
        );
        void queryClient.invalidateQueries({ queryKey: WORKOUTS_QUERY_KEY });
      } catch (error) {
        const message = error?.response?.data?.message;
        toast.error(
          isArray(message)
            ? message.join(", ")
            : message || t("admin.workouts.messages.importError"),
        );
      } finally {
        setIsImporting(false);
        event.target.value = "";
      }
    },
    [importWorkouts, queryClient],
  );

  const handleToggleStatus = async (workout) => {
    try {
      await statusMutation.mutateAsync({
        url: `/admin/workouts/${workout.id}`,
        attributes: { isActive: !workout.isActive },
      });
      toast.success(
        workout.isActive
          ? t("admin.workouts.messages.deactivated")
          : t("admin.workouts.messages.activated"),
      );
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || t("admin.workouts.messages.statusUpdateError"),
      );
    }
  };

  const handleToggleOnboarding = async (workout) => {
    try {
      await updateMutation.mutateAsync({
        url: `/admin/workouts/${workout.id}`,
        attributes: { isOnboarding: !workout.isOnboarding },
      });
      toast.success(
        workout.isOnboarding
          ? t("admin.workouts.messages.removedFromOnboarding")
          : t("admin.workouts.messages.addedToOnboarding"),
      );
    } catch (error) {
      toast.error(
        getMutationErrorMessage(
          error,
          t("admin.workouts.messages.onboardingUpdateError"),
        ),
      );
    }
  };

  const handleRestoreWorkout = async (workout) => {
    try {
      await restoreMutation.mutateAsync({
        url: `/admin/workouts/${workout.id}/restore`,
        attributes: {},
      });
      toast.success(t("admin.workouts.messages.restored"));
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || t("admin.workouts.messages.restoreError"),
      );
    }
  };

  const handleBulkStatus = async (nextIsActive) => {
    if (!selectedWorkoutIds.length) return;
    try {
      await bulkStatusMutation.mutateAsync({
        url: "/admin/workouts/status",
        attributes: {
          ids: selectedWorkoutIds,
          isActive: nextIsActive,
        },
      });
      toast.success(
        nextIsActive
          ? t("admin.workouts.messages.bulkActivated", {
              count: selectedWorkoutIds.length,
            })
          : t("admin.workouts.messages.bulkDeactivated", {
              count: selectedWorkoutIds.length,
            }),
      );
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || t("admin.workouts.messages.bulkStatusError"),
      );
    }
  };

  const handleBulkRestore = async () => {
    if (!selectedWorkoutIds.length) return;
    try {
      await bulkRestoreMutation.mutateAsync({
        url: "/admin/workouts/restore",
        attributes: { ids: selectedWorkoutIds },
      });
      toast.success(
        t("admin.workouts.messages.bulkRestored", {
          count: selectedWorkoutIds.length,
        }),
      );
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || t("admin.workouts.messages.bulkRestoreError"),
      );
    }
  };

  const handleBulkTrash = async () => {
    if (!selectedWorkoutIds.length) return;
    try {
      await trashMutation.mutateAsync({
        url: "/admin/workouts/trash",
        attributes: { ids: selectedWorkoutIds },
      });
      toast.success(
        t("admin.workouts.messages.bulkMovedToTrash", {
          count: selectedWorkoutIds.length,
        }),
      );
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || t("admin.workouts.messages.bulkTrashError"),
      );
    }
  };

  const handleBulkAssignCategories = async () => {
    if (!selectedWorkoutIds.length || !bulkCategoryIds.length) {
      toast.error(t("admin.workouts.messages.selectCategoryRequired"));
      return;
    }
    try {
      await assignCategoriesMutation.mutateAsync({
        url: "/admin/workouts/categories",
        attributes: {
          ids: selectedWorkoutIds,
          categoryIds: bulkCategoryIds,
        },
      });
      toast.success(
        t("admin.workouts.messages.categoriesAssigned", {
          count: selectedWorkoutIds.length,
        }),
      );
      setBulkCategoryDrawerOpen(false);
      setBulkCategoryIds([]);
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || t("admin.workouts.messages.categoriesAssignError"),
      );
    }
  };

  const handleHardDelete = async () => {
    if (!canHardDelete || !hardDeleteTarget?.ids?.length) return;
    try {
      await hardDeleteMutation.mutateAsync({
        url: "/admin/workouts/hard-delete",
        attributes: { ids: hardDeleteTarget.ids },
      });
      toast.success(
        hardDeleteTarget.ids.length === 1
          ? t("admin.workouts.messages.hardDeleted")
          : t("admin.workouts.messages.hardDeletedMany", {
              count: hardDeleteTarget.ids.length,
            }),
      );
      setHardDeleteTarget(null);
      setRowSelection({});
    } catch (error) {
      toast.error(
        getMutationErrorMessage(
          error,
          t("admin.workouts.messages.hardDeleteError"),
        ),
      );
    }
  };

  const columns = useColumns({
    activeLanguages,
    canHardDelete,
    canReorder,
    categoryById,
    currentLanguage,
    currentPage,
    handleToggleOnboarding,
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
      const nextPage = String(get(next, "pageIndex", 0) + 1);
      const nextPageSize = String(get(next, "pageSize", pageSize));

      void setPageQuery(nextPage);
      if (nextPageSize !== String(pageSize)) {
        void setPageSizeQuery(nextPageSize);
      }
    },
    state: {
      rowSelection,
      sorting,
      pagination: { pageIndex: currentPage - 1, pageSize },
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
          : message || t("admin.workouts.messages.reorderError"),
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("admin.workouts.list.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("admin.workouts.list.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={importFileInputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            aria-label="Mashqlarni import qilish faylini tanlash"
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
            {isImporting
              ? t("admin.workouts.list.importing")
              : t("admin.workouts.list.importExcel")}
          </Button>
          <Button
            variant="outline"
            onClick={() => void handleExportWorkouts()}
            disabled={isExporting}
            className="gap-1.5"
          >
            <DownloadIcon className="size-4" />
            {isExporting
              ? t("admin.workouts.list.exporting")
              : t("admin.workouts.list.exportExcel")}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => queryClient.invalidateQueries({ queryKey: WORKOUTS_QUERY_KEY })}
            disabled={isFetching}
          >
            <RotateCcwIcon className={cn("size-4", isFetching && "animate-spin")} />
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
                table={table}
                dataIds={paginatedWorkoutIds}
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
              Tartiblash faqat filterlarsiz va standart saralashda ishlaydi.
            </div>
          ) : null}
          <DataGridPagination
            info="{from} - {to} / {count} ta mashg'ulot"
            rowsPerPageLabel="Sahifada:"
            sizes={[10, 25, 50, 100]}
          />
        </div>
      </DataGrid>
      {selectedWorkoutCount > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
          <div className="pointer-events-auto flex w-full max-w-6xl flex-wrap items-center gap-2 rounded-2xl border bg-background/95 px-4 py-3 shadow-2xl backdrop-blur">
            <Badge variant="secondary">
              {t("admin.workouts.list.selectedCount", {
                count: selectedWorkoutCount,
              })}
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
                  {t("admin.workouts.list.restore")}
                </Button>
                {canHardDelete ? (
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
                    {t("admin.workouts.delete.hardDeleteAction")}
                  </Button>
                ) : null}
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
                  {t("admin.workouts.list.assignCategory")}
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={isBulkUpdatingStatus}
                  onClick={() => void handleBulkStatus(true)}
                >
                  {t("admin.workouts.list.activate")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={isBulkUpdatingStatus}
                  onClick={() => void handleBulkStatus(false)}
                >
                  {t("admin.workouts.list.deactivate")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={isBulkTrashing}
                  onClick={() => void handleBulkTrash()}
                >
                  <Trash2Icon className="size-4" />
                  {t("admin.workouts.delete.moveToTrashAction")}
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
              {t("admin.common.cancel")}
            </Button>
          </div>
        </div>
      ) : null}
      <Outlet />
      <Drawer
        open={Boolean(importPreview)}
        onOpenChange={(open) => {
          if (!open) setImportPreview(null);
        }}
        direction="bottom"
      >
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
          <DrawerHeader>
            <DrawerTitle>{t("admin.workouts.list.importPreviewTitle")}</DrawerTitle>
            <DrawerDescription>
              {t("admin.workouts.list.importPreviewDescription", {
                total: get(importPreview, "totalRows", 0),
                invalid: get(importPreview, "invalidCount", 0),
              })}
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-3 overflow-y-auto px-4 pb-4">
            {lodashMap(take(get(importPreview, "errors", []) ?? [], 20), (error, index) => (
              <div
                key={`${error.rowNumber}-${index}`}
                className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm"
              >
                <p className="font-medium">
                  Row {error.rowNumber}: {error.name || error.id || "-"}
                </p>
                <p className="text-muted-foreground">{error.error}</p>
              </div>
            ))}
            {get(importPreview, "errors", []).length > 20 ? (
              <p className="text-xs text-muted-foreground">
                {t("admin.workouts.list.hiddenErrors", {
                  count: get(importPreview, "errors", []).length - 20,
                })}
              </p>
            ) : null}
          </div>
          <DrawerFooter>
            <Button variant="outline" onClick={() => setImportPreview(null)}>
              {t("admin.common.close")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <Drawer
        open={translationsDrawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            setTranslationForm({});
            navigate("/admin/workouts/list");
          }
        }}
        direction="bottom"
      >
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
          <div className="mx-auto w-full">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <GlobeIcon className="size-5" />
                {t("admin.workouts.translations.title")}
              </DrawerTitle>
              <DrawerDescription>
                {t("admin.workouts.translations.description")}
              </DrawerDescription>
            </DrawerHeader>

            {isTranslatingLoading ? (
              <div className="flex min-h-64 items-center justify-center px-6 py-10">
                <Spinner className="size-8 text-muted-foreground" />
              </div>
            ) : (
              <div className="px-6 py-4 space-y-5">
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
                  <p className="font-medium">
                    {translatingWorkout
                      ? resolveLabel(
                          translatingWorkout.translations,
                          translatingWorkout.name,
                          currentLanguage,
                        )
                      : t("admin.workouts.delete.workoutFallback")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("admin.workouts.form.currentLanguage")}{" "}
                    {currentLanguageMeta?.flag
                      ? `${currentLanguageMeta.flag} `
                      : ""}
                    {currentLanguageMeta?.name ??
                      toUpper(currentLanguage)}
                    {t("admin.workouts.translations.currentLanguageNote")}
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
                              {t("admin.workouts.translations.primary")}
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
                          placeholder={t("admin.workouts.translations.placeholder", {
                            language: language.name,
                          })}
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            <DrawerFooter className="border-t bg-muted/5 gap-2 px-6 py-4">
              <Button
                onClick={handleTranslationSave}
                disabled={
                  isUpdating || isTranslatingLoading || !activeLanguages.length
                }
              >
                {t("admin.workouts.translations.save")}
              </Button>
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
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
          <div className="mx-auto w-full">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <TagIcon className="size-5" />
                {t("admin.workouts.bulkCategories.title")}
              </DrawerTitle>
              <DrawerDescription>
                {t("admin.workouts.bulkCategories.description", {
                  count: selectedWorkoutCount,
                })}
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
                  {t("admin.workouts.bulkCategories.empty")}
                </p>
              )}
            </div>

            <DrawerFooter className="border-t bg-muted/5 gap-2 px-6 py-4">
              <Button
                onClick={() => void handleBulkAssignCategories()}
                disabled={!bulkCategoryIds.length || isAssigningCategories}
              >
                {t("admin.workouts.bulkCategories.submit")}
              </Button>
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
