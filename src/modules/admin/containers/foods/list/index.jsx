import React from "react";
import { useNavigate, Outlet } from "react-router";
import toPairs from "lodash/toPairs";
import lodashFilter from "lodash/filter";
import find from "lodash/find";
import findIndex from "lodash/findIndex";
import get from "lodash/get";
import isArray from "lodash/isArray";
import isObject from "lodash/isObject";
import keyBy from "lodash/keyBy";
import lodashMap from "lodash/map";
import trim from "lodash/trim";
import lodashValues from "lodash/values";
import toNumber from "lodash/toNumber";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  DownloadIcon,
  Globe2Icon,
  ImageOffIcon,
  PlusIcon,
  RotateCcwIcon,
  RefreshCwIcon,
  TagIcon,
  Trash2Icon,
  Undo2Icon,
  UploadIcon,
} from "lucide-react";
import { useBreadcrumbStore, useLanguageStore } from "@/store";
import {
  useGetQuery,
  usePatchQuery,
  useDeleteQuery,
  usePostQuery,
  usePostFileQuery,
} from "@/hooks/api";
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
import { useAdminDrawerListNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
import FoodBulkCategoryDrawer from "../components/FoodBulkCategoryDrawer";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useFoodFilters } from "./use-filters.js";
import { DeleteAlert, HardDeleteAlert } from "./delete-alert.jsx";
import FoodImportPreviewDialog from "./import-preview-dialog.jsx";
import FoodImageCleanupDialog from "./image-cleanup-dialog.jsx";

const resolveLabel = (translations, fallback, language) => {
  if (isObject(translations)) {
    const direct = trim(String(get(translations, language, "")));
    if (direct) return direct;

    const uz = trim(String(get(translations, "uz", "")));
    if (uz) return uz;

    const first = find(lodashValues(translations), (value) =>
      trim(String(value)),
    );
    if (first) return trim(String(first));
  }

  return fallback;
};

const getMutationErrorMessage = (error, fallback) => {
  const response = error?.response?.data;
  const message = response?.message;
  const dependencySummary = response?.dependencySummary;
  const baseMessage = isArray(message) ? message.join(", ") : message;

  return lodashFilter(
    [baseMessage || fallback, dependencySummary],
    Boolean,
  ).join(" ");
};

const buildFoodImportFormData = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return formData;
};

export const buildFoodBulkStatusPayload = (ids, isActive) => ({
  ids,
  isActive,
});

const Index = () => {
  const navigate = useNavigate();
  const navigateAdminDrawer = useAdminDrawerListNavigation();
  const { canManageContent, isSuperAdmin } = useAdminPermissions();
  const canHardDelete = canManageContent && isSuperAdmin;
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);

  const { data: categoriesData } = useGetQuery({
    url: "/admin/nutrition/food-categories",
    params: { pageSize: 100 },
    queryProps: { queryKey: ["admin", "food-categories", "options"] },
  });
  const categories = get(categoriesData, "data.data", []);

  const { data: cuisinesData } = useGetQuery({
    url: "/admin/nutrition/cuisines",
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
    onboardingFilter,
    onboardingOp,
    hasImageFilter,
    hasImageOp,
    lifecycle,
    nutritionMode,
    recipeStatus,
    qualityIssue,
    dietaryTag,
    dietaryTagOp,
    allergenTag,
    allergenTagOp,
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
    savedFilterViews,
    applySavedFilterView,
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
      ...(onboardingFilter !== "all" ? { onboarding: onboardingFilter } : {}),
      ...(onboardingFilter !== "all" || onboardingOp !== "is"
        ? { onboardingOp }
        : {}),
      ...(hasImageFilter !== "all" ? { hasImage: hasImageFilter } : {}),
      ...(hasImageFilter !== "all" || hasImageOp !== "is"
        ? { hasImageOp }
        : {}),
      ...(lifecycle !== "active" ? { lifecycle } : {}),
      ...(nutritionMode !== "all" ? { nutritionMode } : {}),
      ...(recipeStatus !== "all" ? { recipeStatus } : {}),
      ...(qualityIssue !== "all" ? { qualityIssue } : {}),
      ...(dietaryTag !== "all" ? { dietaryTag } : {}),
      ...(dietaryTag !== "all" || dietaryTagOp !== "is"
        ? { dietaryTagOp }
        : {}),
      ...(allergenTag !== "all" ? { allergenTag } : {}),
      ...(allergenTag !== "all" || allergenTagOp !== "is"
        ? { allergenTagOp }
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
      allergenTag,
      allergenTagOp,
      cuisineFilter,
      cuisineOp,
      dietaryTag,
      dietaryTagOp,
      currentPage,
      deferredSearch,
      duplicatesFilter,
      hasImageFilter,
      hasImageOp,
      lifecycle,
      nutritionMode,
      onboardingFilter,
      onboardingOp,
      pageSize,
      qualityIssue,
      recipeStatus,
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
  const FOODS_QUERY_KEY = ["admin", "foods"];
  const FOOD_CATEGORIES_QUERY_KEY = ["admin", "food-categories"];
  const FOOD_CATEGORY_FOODS_QUERY_KEY = ["admin", "food-category-foods"];
  const FOOD_IMAGE_ORPHANS_QUERY_KEY = ["admin", "food-images", "orphans"];
  const [imageCleanupOpen, setImageCleanupOpen] = React.useState(false);

  const {
    data: foodsData,
    isLoading,
    isFetching,
    refetch,
  } = useGetQuery({
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
  const {
    data: imageCleanupData,
    isFetching: isLoadingImageCleanup,
    refetch: refetchImageCleanup,
  } = useGetQuery({
    url: "/admin/food-images/orphans",
    queryProps: {
      queryKey: FOOD_IMAGE_ORPHANS_QUERY_KEY,
      enabled: imageCleanupOpen,
    },
  });
  const imageCleanupPreview = get(
    imageCleanupData,
    "data.data",
    get(imageCleanupData, "data", null),
  );

  const invalidateFoodRelated = React.useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: FOOD_CATEGORY_FOODS_QUERY_KEY,
    });
  }, [queryClient]);
  const invalidateFoodAndCategories = React.useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: FOOD_CATEGORY_FOODS_QUERY_KEY,
    });
    await queryClient.invalidateQueries({
      queryKey: FOOD_CATEGORIES_QUERY_KEY,
    });
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
  const bulkAssignCuisinesMutation = usePatchQuery({
    queryKey: FOODS_QUERY_KEY,
    mutationProps: { onSuccess: invalidateFoodRelated },
  });
  const bulkRecalculateRecipeMutation = usePatchQuery({
    queryKey: FOODS_QUERY_KEY,
    mutationProps: { onSuccess: invalidateFoodRelated },
  });
  const hardDeleteMutation = usePatchQuery({
    queryKey: FOODS_QUERY_KEY,
    mutationProps: { onSuccess: invalidateFoodAndCategories },
  });
  const reorderMutation = usePatchQuery({ queryKey: FOODS_QUERY_KEY });
  const {
    mutateAsync: createExportJob,
    isPending: isCreatingExportJob,
  } = usePostQuery({});
  const {
    mutateAsync: previewFoodImportFile,
    isPending: isPreviewingImport,
  } = usePostFileQuery({});
  const {
    mutateAsync: createImportJob,
    isPending: isCreatingImportJob,
  } = usePostFileQuery({ queryKey: FOODS_QUERY_KEY });
  const { mutateAsync: fetchDeletionImpact } = usePostQuery({});
  const {
    mutateAsync: cleanupFoodImages,
    isPending: isCleaningFoodImages,
  } = usePostQuery({ queryKey: FOOD_IMAGE_ORPHANS_QUERY_KEY });
  const isDeleting = deleteMutation.isPending;
  const isBulkUpdatingStatus = bulkStatusMutation.isPending;
  const isBulkTrashing = bulkTrashMutation.isPending;
  const isAssigningCategories = bulkAssignCategoriesMutation.isPending;
  const isAssigningCuisines = bulkAssignCuisinesMutation.isPending;
  const isRecalculatingRecipes = bulkRecalculateRecipeMutation.isPending;
  const isHardDeleting = hardDeleteMutation.isPending;
  const isRestoring =
    restoreMutation.isPending || bulkRestoreMutation.isPending;
  const [isImporting, setIsImporting] = React.useState(false);
  const [pendingImportFile, setPendingImportFile] = React.useState(null);
  const [importPreview, setImportPreview] = React.useState(null);
  const [importPreviewOpen, setImportPreviewOpen] = React.useState(false);

  const deleteFood = React.useCallback(
    async (id) => deleteMutation.mutateAsync({ url: `/admin/foods/${id}` }),
    [deleteMutation],
  );
  const updateFoodStatus = React.useCallback(
    async (id, isActive) =>
      statusMutation.mutateAsync({
        url: `/admin/foods/${id}/status`,
        attributes: { isActive },
      }),
    [statusMutation],
  );
  const reorderFoods = React.useCallback(
    async (payload) =>
      reorderMutation.mutateAsync({
        url: "/admin/foods/reorder",
        attributes: payload,
      }),
    [reorderMutation],
  );
  const updateFoodsStatus = React.useCallback(
    async (payload) =>
      bulkStatusMutation.mutateAsync({
        url: "/admin/foods/status",
        attributes: payload,
      }),
    [bulkStatusMutation],
  );
  const trashFoods = React.useCallback(
    async (payload) =>
      bulkTrashMutation.mutateAsync({
        url: "/admin/foods/trash",
        attributes: payload,
      }),
    [bulkTrashMutation],
  );
  const restoreFood = React.useCallback(
    async (id) =>
      restoreMutation.mutateAsync({
        url: `/admin/foods/${id}/restore`,
        attributes: {},
      }),
    [restoreMutation],
  );
  const restoreFoods = React.useCallback(
    async (payload) =>
      bulkRestoreMutation.mutateAsync({
        url: "/admin/foods/restore",
        attributes: payload,
      }),
    [bulkRestoreMutation],
  );
  const assignFoodCategories = React.useCallback(
    async (payload) =>
      bulkAssignCategoriesMutation.mutateAsync({
        url: "/admin/foods/categories",
        attributes: payload,
      }),
    [bulkAssignCategoriesMutation],
  );
  const assignFoodCuisines = React.useCallback(
    async (payload) =>
      bulkAssignCuisinesMutation.mutateAsync({
        url: "/admin/foods/cuisines",
        attributes: payload,
      }),
    [bulkAssignCuisinesMutation],
  );
  const recalculateFoodRecipes = React.useCallback(
    async (payload) =>
      bulkRecalculateRecipeMutation.mutateAsync({
        url: "/admin/foods/recalculate-recipes",
        attributes: payload,
      }),
    [bulkRecalculateRecipeMutation],
  );
  const hardDeleteFoods = React.useCallback(
    async (payload) =>
      hardDeleteMutation.mutateAsync({
        url: "/admin/foods/hard-delete",
        attributes: payload,
      }),
    [hardDeleteMutation],
  );
  const exportFoods = React.useCallback(async () => {
    const response = await createExportJob({
      url: "/admin/nutrition/foods/export/jobs",
      attributes: null,
      config: {
        params: queryParams,
      },
    });
    return get(response, "data.data", get(response, "data"));
  }, [createExportJob, queryParams]);

  const previewImportFoods = React.useCallback(
    async (file) => {
      const response = await previewFoodImportFile({
        url: "/admin/nutrition/foods/import/preview",
        attributes: buildFoodImportFormData(file),
        config: { headers: { "Content-Type": "multipart/form-data" } },
      });

      return get(response, "data.data", get(response, "data"));
    },
    [previewFoodImportFile],
  );

  const startImportFoodsJob = React.useCallback(
    async (file) => {
      const response = await createImportJob({
        url: "/admin/nutrition/foods/import/jobs",
        attributes: buildFoodImportFormData(file),
        config: { headers: { "Content-Type": "multipart/form-data" } },
      });

      await invalidateFoodAndCategories();
      return get(response, "data.data", get(response, "data"));
    },
    [createImportJob, invalidateFoodAndCategories],
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
  const assignableCuisines = React.useMemo(
    () => lodashFilter(cuisines, (cuisine) => cuisine.isActive),
    [cuisines],
  );

  const [bulkCategoryDrawerOpen, setBulkCategoryDrawerOpen] =
    React.useState(false);
  const [bulkCuisineDrawerOpen, setBulkCuisineDrawerOpen] =
    React.useState(false);
  const [rowSelection, setRowSelection] = React.useState({});
  const [bulkCategoryIds, setBulkCategoryIds] = React.useState([]);
  const [bulkCuisineIds, setBulkCuisineIds] = React.useState([]);
  const [foodToDelete, setFoodToDelete] = React.useState(null);
  const [hardDeleteTarget, setHardDeleteTarget] = React.useState(null);
  const [deleteImpact, setDeleteImpact] = React.useState(null);
  const [isLoadingDeleteImpact, setIsLoadingDeleteImpact] =
    React.useState(false);
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

  const deletionImpactIds = React.useMemo(() => {
    if (foodToDelete?.id) {
      return [foodToDelete.id];
    }

    if (hardDeleteTarget?.ids?.length) {
      return hardDeleteTarget.ids;
    }

    return [];
  }, [foodToDelete, hardDeleteTarget]);
  const deletionImpactKey = React.useMemo(
    () => deletionImpactIds.join(","),
    [deletionImpactIds],
  );

  React.useEffect(() => {
    let cancelled = false;

    if (!deletionImpactIds.length) {
      setDeleteImpact(null);
      setIsLoadingDeleteImpact(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoadingDeleteImpact(true);
    fetchDeletionImpact({
      url: "/admin/foods/deletion-impact",
      attributes: { ids: deletionImpactIds },
    })
      .then((response) => {
        if (cancelled) return;
        setDeleteImpact(get(response, "data.data", get(response, "data", null)));
      })
      .catch(() => {
        if (cancelled) return;
        setDeleteImpact(null);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingDeleteImpact(false);
      });

    return () => {
      cancelled = true;
    };
  }, [deletionImpactIds, deletionImpactKey, fetchDeletionImpact]);

  React.useEffect(() => {
    setRowSelection({});
  }, [
    categoryFilter,
    currentPage,
    duplicatesFilter,
    hasImageFilter,
    lifecycle,
    nutritionMode,
    onboardingFilter,
    pageSize,
    qualityIssue,
    recipeStatus,
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
      lodashFilter(
        lodashMap(
          lodashFilter(toPairs(rowSelection), ([, selected]) =>
            Boolean(selected),
          ),
          ([id]) => toNumber(id),
        ),
        (id) => Number.isInteger(id),
      ),
    [rowSelection],
  );
  const selectedFoodCount = selectedFoodIds.length;

  const openCreateDrawer = () => {
    if (!canManageContent) return;
    navigateAdminDrawer("create");
  };

  const openEditDrawer = (food) => {
    if (!canManageContent) return;
    navigateAdminDrawer(`edit/${food.id}`);
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
        isArray(message) ? message.join(", ") : message || "O'chirib bo'lmadi",
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
        setPendingImportFile(file);
        const preview = await previewImportFoods(file);
        setImportPreview(preview);
        setImportPreviewOpen(true);

        const invalidCount = get(preview, "invalidCount", 0);

        if (invalidCount > 0) {
          const firstError = get(preview, "errors.0.error");
          const firstQualityTitle = get(preview, "quality.groups.0.title");
          toast.error(
            `${invalidCount} ta qatorda xato bor. ${
              firstQualityTitle ? `${firstQualityTitle}: ` : ""
            }${firstError || "Import job bloklandi."}`,
          );
          return;
        }

        const warningCount = get(preview, "quality.warnCount", 0);
        if (warningCount > 0) {
          toast.warning(
            `${warningCount} ta Content Quality ogohlantirishi bor. Tasdiqlasangiz import job boshlanadi.`,
          );
          return;
        }

        toast.success("Preview tayyor. Import jobni boshlash mumkin");
      } catch (error) {
        setPendingImportFile(null);
        setImportPreview(null);
        setImportPreviewOpen(false);
        const message = error?.response?.data?.message;
        toast.error(
          isArray(message)
            ? message.join(", ")
            : message || "Excel import qilib bo'lmadi",
        );
      } finally {
        setIsImporting(false);
        event.target.value = "";
      }
    },
    [canManageContent, previewImportFoods],
  );

  const handleConfirmImportFoods = React.useCallback(async () => {
    if (!canManageContent || !pendingImportFile) return;

    try {
      await startImportFoodsJob(pendingImportFile);
      toast.success("Ovqat import job sifatida boshlandi");
      setImportPreviewOpen(false);
      setPendingImportFile(null);
      setImportPreview(null);
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Excel import jobni boshlab bo'lmadi",
      );
    }
  }, [canManageContent, pendingImportFile, startImportFoodsJob]);

  const handleImportPreviewOpenChange = React.useCallback((open) => {
    setImportPreviewOpen(open);
    if (!open) {
      setPendingImportFile(null);
      setImportPreview(null);
    }
  }, []);

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

  const handleToggleOnboarding = async (food) => {
    if (!canManageContent) return;

    try {
      await statusMutation.mutateAsync({
        url: `/admin/foods/${food.id}`,
        attributes: { isOnboarding: !food.isOnboarding },
      });
      toast.success(
        food.isOnboarding
          ? "Ovqat onboarding ro'yxatidan olindi"
          : "Ovqat onboarding ro'yxatiga qo'shildi",
      );
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Onboarding holatini o'zgartirib bo'lmadi",
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
      await updateFoodsStatus(
        buildFoodBulkStatusPayload(selectedFoodIds, nextIsActive),
      );
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

  const handleBulkAssignCuisines = async () => {
    if (!canManageContent) return;

    if (!selectedFoodIds.length || !bulkCuisineIds.length) {
      toast.error("Kamida bitta oshxona tanlang");
      return;
    }

    try {
      await assignFoodCuisines({
        ids: selectedFoodIds,
        cuisineIds: bulkCuisineIds,
      });
      toast.success(
        `${selectedFoodIds.length} ta ovqatga oshxonalar biriktirildi`,
      );
      setBulkCuisineDrawerOpen(false);
      setBulkCuisineIds([]);
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Oshxonalarni biriktirib bo'lmadi",
      );
    }
  };

  const handleBulkRecalculateRecipes = async () => {
    if (!canManageContent || !selectedFoodIds.length) return;

    try {
      const response = await recalculateFoodRecipes({ ids: selectedFoodIds });
      const result = get(response, "data.data", get(response, "data", {}));
      const updatedCount = get(result, "updatedCount", 0);
      const skippedCount = get(result, "skippedCount", 0);
      toast.success(
        skippedCount
          ? `${updatedCount} ta recipe qayta hisoblandi, ${skippedCount} ta o'tkazildi`
          : `${updatedCount} ta recipe nutrition qayta hisoblandi`,
      );
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Recipe nutrition qayta hisoblab bo'lmadi",
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
        getMutationErrorMessage(error, "Ovqatlarni butunlay o'chirib bo'lmadi"),
      );
    }
  };

  const handleCleanupFoodImages = React.useCallback(async () => {
    if (!canManageContent) return;

    try {
      const response = await cleanupFoodImages({
        url: "/admin/food-images/cleanup",
        attributes: {},
      });
      const result = get(response, "data.data", get(response, "data", {}));
      const removed = get(result, "removed", 0);
      const errors = get(result, "errors", 0);

      if (errors > 0) {
        toast.warning(
          `${removed} ta orphan rasm tozalandi, ${errors} ta xato bor`,
        );
      } else {
        toast.success(`${removed} ta orphan rasm tozalandi`);
      }

      await refetchImageCleanup();
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Orphan rasmlarni tozalab bo'lmadi",
      );
    }
  }, [canManageContent, cleanupFoodImages, refetchImageCleanup]);

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
    handleToggleOnboarding,
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
      const nextPage = toNumber(next.pageIndex) + 1;
      const nextPageSize = toNumber(next.pageSize) || pageSize;
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

  const isTrashView = lifecycle === "trash";
  const isBulkActionBusy =
    isAssigningCategories ||
    isAssigningCuisines ||
    isRecalculatingRecipes ||
    isBulkUpdatingStatus ||
    isBulkTrashing ||
    isRestoring ||
    isHardDeleting;

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
                aria-label="Ovqatlarni import qilish faylini tanlash"
                className="hidden"
                onChange={(event) => void handleImportFoods(event)}
              />
              <Button
                variant="outline"
                onClick={() => importFileInputRef.current?.click()}
                disabled={
                  isImporting || isPreviewingImport || isCreatingImportJob
                }
                className="gap-1.5"
              >
                <UploadIcon className="size-4" />
                <span className="hidden sm:inline">
                  {isImporting || isPreviewingImport
                    ? "Preview..."
                    : isCreatingImportJob
                      ? "Import..."
                      : "Excel import"}
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setImageCleanupOpen(true)}
                disabled={isCleaningFoodImages}
                className="gap-1.5"
              >
                <ImageOffIcon className="size-4" />
                <span className="hidden sm:inline">Rasm cleanup</span>
              </Button>
            </>
          ) : null}
          <Button
            variant="outline"
            onClick={() => void handleExportFoods()}
            disabled={isExporting || isCreatingExportJob}
            className="gap-1.5"
          >
            <DownloadIcon className="size-4" />
            <span className="hidden sm:inline">
              {isExporting || isCreatingExportJob
                ? "Export..."
                : "Excel export"}
            </span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RotateCcwIcon
              className={cn("size-4", isFetching && "animate-spin")}
            />
          </Button>
          {canManageContent ? (
            <Button onClick={openCreateDrawer} className="gap-1.5">
              <PlusIcon className="size-4" />
              <span className="hidden xs:inline">Yangi ovqat</span>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <ScrollArea className="w-full">
          <div className="flex w-max items-center gap-2 pb-1">
            {lodashMap(savedFilterViews, (view) => (
              <Button
                key={view.id}
                type="button"
                size="xs"
                variant={view.active ? "secondary" : "outline"}
                onClick={() => applySavedFilterView(view.id)}
              >
                {view.label}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
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
            {isTrashView ? (
              <>
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={isRestoring}
                  onClick={() => void handleBulkRestore()}
                >
                  <Undo2Icon className="size-4" />
                  <span className="hidden sm:inline">Tiklash</span>
                </Button>
                {canHardDelete ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1.5"
                    disabled={isHardDeleting}
                    onClick={() =>
                      setHardDeleteTarget({
                        ids: selectedFoodIds,
                        label: `${selectedFoodIds.length} ta ovqat`,
                      })
                    }
                  >
                    <Trash2Icon className="size-4" />
                    <span className="hidden sm:inline">Butunlay o'chirish</span>
                  </Button>
                ) : null}
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={isAssigningCategories}
                  onClick={() => setBulkCategoryDrawerOpen(true)}
                >
                  <TagIcon className="size-4" />
                  <span className="hidden sm:inline">
                    Kategoriya biriktirish
                  </span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={isAssigningCuisines}
                  onClick={() => setBulkCuisineDrawerOpen(true)}
                >
                  <Globe2Icon className="size-4" />
                  <span className="hidden sm:inline">Oshxona biriktirish</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={isRecalculatingRecipes}
                  onClick={() => void handleBulkRecalculateRecipes()}
                >
                  <RefreshCwIcon
                    className={cn(
                      "size-4",
                      isRecalculatingRecipes && "animate-spin",
                    )}
                  />
                  <span className="hidden sm:inline">
                    Recipe qayta hisoblash
                  </span>
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
            )}
            <Button
              size="sm"
              variant="ghost"
              disabled={isBulkActionBusy}
              onClick={() => setRowSelection({})}
            >
              <span className="hidden sm:inline">Bekor qilish</span>
            </Button>
          </div>
        </div>
      ) : null}

      <Outlet />

      <FoodImportPreviewDialog
        open={importPreviewOpen}
        onOpenChange={handleImportPreviewOpenChange}
        preview={importPreview}
        isStarting={isCreatingImportJob}
        onStartImport={() => void handleConfirmImportFoods()}
      />

      <FoodImageCleanupDialog
        open={imageCleanupOpen}
        onOpenChange={setImageCleanupOpen}
        preview={imageCleanupPreview}
        isLoading={isLoadingImageCleanup}
        isCleaning={isCleaningFoodImages}
        onCleanup={() => void handleCleanupFoodImages()}
        onRefresh={() => void refetchImageCleanup()}
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

      <FoodBulkCategoryDrawer
        open={bulkCuisineDrawerOpen}
        onOpenChange={(open) => {
          setBulkCuisineDrawerOpen(open);
          if (!open) setBulkCuisineIds([]);
        }}
        selectedFoodCount={selectedFoodCount}
        assignableItems={assignableCuisines}
        selectedIds={bulkCuisineIds}
        setSelectedIds={setBulkCuisineIds}
        currentLanguage={currentLanguage}
        isSaving={isAssigningCuisines}
        onAssign={() => void handleBulkAssignCuisines()}
        title="Bulk oshxona biriktirish"
        description={`Tanlangan ${selectedFoodCount} ta ovqatga qo'shimcha oshxonalar biriktiriladi.`}
        emptyLabel="Faol oshxonalar topilmadi."
        saveLabel="Oshxonalarni biriktirish"
      />

      <DeleteAlert
        food={foodToDelete}
        open={Boolean(foodToDelete)}
        onOpenChange={(open) => !open && setFoodToDelete(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        impact={deleteImpact}
        isLoadingImpact={isLoadingDeleteImpact}
      />

      <HardDeleteAlert
        target={hardDeleteTarget}
        open={Boolean(hardDeleteTarget)}
        onOpenChange={(open) => !open && setHardDeleteTarget(null)}
        onConfirm={handleHardDelete}
        isDeleting={isHardDeleting}
        impact={deleteImpact}
        isLoadingImpact={isLoadingDeleteImpact}
      />
    </div>
  );
};

export default Index;
