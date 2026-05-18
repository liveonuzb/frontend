import React from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useLocation, useNavigate } from "react-router";
import CatalogItemActionsMenu from "./catalog-item-actions-menu";
import {
  get,
  map,
  filter as lodashFilter,
  find,
  size,
  isArray,
  join,
  toString,
  trim,
  fromPairs,
  includes,
  toLower,
  toNumber,
  values as lodashValues,
  toPairs,
  slice,
} from "lodash";
import { useBreadcrumbStore, useLanguageStore } from "@/store";
import { useGetQuery } from "@/hooks/api";
import {
  DataGrid,
  DataGridContainer,
  DataGridPagination,
  DataGridTable,
  DataGridTableDndRowHandle,
  DataGridTableDndRows,
} from "@/components/reui/data-grid";
import { Filters } from "@/components/reui/filters.jsx";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  LoaderCircleIcon,
  PlusIcon,
  RotateCcwIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminListSkeletons } from "@/modules/admin/components/admin-list-skeletons.jsx";
import {
  useAdminDrawerCloseNavigation,
  useAdminDrawerListNavigation,
} from "@/modules/admin/lib/admin-drawer-navigation.js";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
import { useLocalizedCatalogFilters } from "./use-localized-catalog-filters.js";
import { LocalizedCatalogDrawers } from "./localized-catalog-drawers.jsx";

const emptyForm = {
  name: "",
  isActive: true,
  isOnboarding: true,
};

const SWITCH_CELL_CLASS_NAME =
  "flex min-h-10 w-full items-center justify-center";

const SWITCH_COLUMN_META = {
  skeleton: adminListSkeletons.status,
  headerClassName: "text-center",
  cellClassName: "text-center",
};

const resolveLabel = (translations, fallback, language) => {
  if (translations && typeof translations === "object") {
    const direct = get(translations, language);
    if (typeof direct === "string" && trim(direct)) {
      return trim(direct);
    }

    const uz = get(translations, "uz");
    if (typeof uz === "string" && trim(uz)) {
      return trim(uz);
    }

    const first = find(
      lodashValues(translations),
      (value) => typeof value === "string" && trim(value),
    );
    if (typeof first === "string" && trim(first)) {
      return trim(first);
    }
  }

  return fallback;
};

const countFilledTranslations = (translations = {}) =>
  size(
    lodashFilter(
      lodashValues(translations),
      (value) => typeof value === "string" && trim(value).length > 0,
    ),
  );

const cleanTranslations = (translations = {}) =>
  fromPairs(lodashFilter(
    map(toPairs(translations), ([key, value]) => [
      trim(key),
      trim(toString(value)),
    ]),
    ([key, value]) => Boolean(key) && Boolean(value),
  ));

const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  const dependencySummary = get(error, "response.data.dependencySummary");
  const baseMessage = isArray(message) ? join(message, ", ") : message;

  return lodashFilter([baseMessage || fallback, dependencySummary], Boolean).join(" ");
};

const createFormFromItem = (item, language) => ({
  name: resolveLabel(
    get(item, "translations"),
    get(item, "name", ""),
    language,
  ),
  isActive: get(item, "isActive", true),
  isOnboarding: get(item, "isOnboarding", true),
});

const LocalizedCatalogManager = ({
  route,
  breadcrumbTitle,
  title,
  description,
  singularLabel,
  pluralSearchPlaceholder,
  items = [],
  endpoint,
  queryKey,
  meta: providedMeta,
  createItem,
  updateItem,
  deleteItem,
  reorderItems,
  isLoading,
  isFetching,
  isCreating,
  isUpdating,
  isDeleting,
  refetch,
}) => {
  const { canManageContent } = useAdminPermissions();
  const navigate = useNavigate();
  const navigateAdminDrawer = useAdminDrawerListNavigation();
  const closeAdminDrawer = useAdminDrawerCloseNavigation(route);
  const location = useLocation();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const languages = get(
    languagesData,
    "data.data",
    get(languagesData, "data", []),
  );

  const {
    activeFilters,
    currentPage,
    deferredSearch,
    filterFields,
    handleFiltersChange,
    isDefaultReorderView,
    onboardingFilter,
    pageSize,
    queryParams,
    setPageQuery,
    setPageSizeQuery,
    setSortBy,
    setSortDir,
    sorting,
    statusFilter,
    translationFilter,
  } = useLocalizedCatalogFilters({ pluralSearchPlaceholder });

  const [editingItem, setEditingItem] = React.useState(null);
  const [translatingItem, setTranslatingItem] = React.useState(null);
  const [itemToDelete, setItemToDelete] = React.useState(null);
  const [form, setForm] = React.useState(emptyForm);
  const [translationForm, setTranslationForm] = React.useState({});
  const relativeDrawerPath = React.useMemo(() => {
    const currentPath = location.pathname.replace(/\/+$/, "");
    const basePath = route.replace(/\/+$/, "");

    if (!currentPath.startsWith(basePath)) return "";

    return currentPath.slice(basePath.length).replace(/^\/+/, "");
  }, [location.pathname, route]);
  const editMatch = relativeDrawerPath.match(/^edit\/([^/]+)$/);
  const translateMatch = relativeDrawerPath.match(/^translate\/([^/]+)$/);
  const routeMode =
    relativeDrawerPath === "create"
      ? "create"
      : editMatch
        ? "edit"
        : translateMatch
          ? "translate"
          : null;
  const routeItemId = editMatch?.[1] || translateMatch?.[1] || null;
  const drawerOpen = routeMode === "create" || routeMode === "edit";
  const translationsDrawerOpen = routeMode === "translate";

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: route, title: breadcrumbTitle },
    ]);
  }, [breadcrumbTitle, route, setBreadcrumbs]);

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

  const serverSide = Boolean(endpoint);
  const serverQuery = useGetQuery({
    url: endpoint || route,
    params: queryParams,
    queryProps: {
      queryKey: [...(queryKey || [route]), queryParams],
      enabled: serverSide,
    },
  });
  const detailQuery = useGetQuery({
    url: `${endpoint || route}/${routeItemId || ""}`,
    queryProps: {
      queryKey: [...(queryKey || [route]), "detail", routeItemId],
      enabled: Boolean(serverSide && routeItemId),
    },
  });
  const effectiveItems = serverSide
    ? get(serverQuery, "data.data.data", [])
    : items;
  const effectiveMeta = serverSide
    ? get(serverQuery, "data.data.meta", null)
    : providedMeta;
  const effectiveIsLoading = serverSide ? serverQuery.isLoading : isLoading;
  const effectiveIsFetching = serverSide ? serverQuery.isFetching : isFetching;
  const effectiveRefetch = serverSide ? serverQuery.refetch : refetch;
  const routeItem = serverSide
    ? get(detailQuery, "data.data")
    : find(items, (item) => toString(get(item, "id")) === routeItemId);
  const isDrawerItemLoading = Boolean(
    serverSide && routeItemId && detailQuery.isLoading,
  );

  React.useEffect(() => {
    if (!effectiveMeta) return;

    const nextTotalPages = Math.max(
      1,
      toNumber(get(effectiveMeta, "totalPages")) || 1,
    );
    if (currentPage > nextTotalPages) {
      void setPageQuery(String(nextTotalPages));
    }
  }, [currentPage, effectiveMeta, setPageQuery]);

  React.useEffect(() => {
    if (routeMode === "create") {
      setEditingItem(null);
      setForm(emptyForm);
      return;
    }

    if (routeMode === "edit" && routeItem) {
      setEditingItem(routeItem);
      setForm(createFormFromItem(routeItem, currentLanguage));
    }
  }, [currentLanguage, routeItem, routeMode]);

  React.useEffect(() => {
    if (routeMode !== "translate" || !routeItem) return;

    setTranslatingItem(routeItem);
    setTranslationForm(
      fromPairs(map(activeLanguages, (language) => [
        get(language, "code"),
        resolveLabel(
          get(routeItem, "translations"),
          get(routeItem, "name", ""),
          get(language, "code"),
        ),
      ])),
    );
  }, [activeLanguages, routeItem, routeMode]);

  const filteredItems = React.useMemo(() => {
    if (serverSide) return effectiveItems;

    const searchValue = toLower(trim(deferredSearch));

    return lodashFilter(effectiveItems, (item) => {
      const localizedName = resolveLabel(
        get(item, "translations"),
        get(item, "name"),
        currentLanguage,
      );
      const matchesSearch =
        !searchValue ||
        includes(toLower(localizedName), searchValue) ||
        includes(toLower(get(item, "name", "")), searchValue);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active"
          ? get(item, "isActive")
          : !get(item, "isActive"));
      const matchesOnboarding =
        onboardingFilter === "all" ||
        (onboardingFilter === "yes"
          ? get(item, "isOnboarding", true)
          : !get(item, "isOnboarding", true));

      if (translationFilter === "all") {
        return matchesSearch && matchesStatus && matchesOnboarding;
      }

      const filledCount = countFilledTranslations(
        get(item, "translations", {}),
      );
      const isComplete =
        activeLanguages.length > 0 && filledCount >= activeLanguages.length;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesOnboarding &&
        (translationFilter === "complete" ? isComplete : !isComplete)
      );
    });
  }, [
    activeLanguages.length,
    currentLanguage,
    deferredSearch,
    effectiveItems,
    onboardingFilter,
    serverSide,
    statusFilter,
    translationFilter,
  ]);

  const isReorderEnabled = canManageContent && isDefaultReorderView;

  const paginatedItems = React.useMemo(() => {
    if (serverSide) return filteredItems;

    const start = (currentPage - 1) * pageSize;
    return slice(filteredItems, start, start + pageSize);
  }, [currentPage, filteredItems, pageSize, serverSide]);

  const totalPages = Math.max(
    1,
    toNumber(get(effectiveMeta, "totalPages")) ||
      Math.ceil(filteredItems.length / pageSize),
  );
  const recordCount =
    toNumber(get(effectiveMeta, "total")) || filteredItems.length;

  const openCreateDrawer = React.useCallback(() => {
    if (!canManageContent) return;
    setEditingItem(null);
    setForm(emptyForm);
    navigateAdminDrawer(`${route}/create`);
  }, [canManageContent, navigateAdminDrawer, route]);

  const openEditDrawer = React.useCallback(
    (item) => {
      if (!canManageContent) return;
      setEditingItem(item);
      setForm(createFormFromItem(item, currentLanguage));
      navigateAdminDrawer(`${route}/edit/${get(item, "id")}`);
    },
    [canManageContent, currentLanguage, navigateAdminDrawer, route],
  );

  const openTranslationsDrawer = React.useCallback(
    (item) => {
      if (!canManageContent) return;
      setTranslatingItem(item);
      setTranslationForm(
        fromPairs(map(activeLanguages, (language) => [
          get(language, "code"),
          resolveLabel(
            get(item, "translations"),
            get(item, "name", ""),
            get(language, "code"),
          ),
        ])),
      );
      navigate(`${route}/translate/${get(item, "id")}`);
    },
    [activeLanguages, canManageContent, navigate, route],
  );

  const submitDrawer = React.useCallback(async () => {
    if (!canManageContent) return;

    const trimmedName = trim(form.name);

    if (!trimmedName) {
      toast.error(`${singularLabel} nomini kiriting`);
      return;
    }

    const payload = {
      name: trimmedName,
      isActive: form.isActive,
      isOnboarding: form.isOnboarding,
      translations: {
        [currentLanguage]: trimmedName,
      },
    };

    try {
      if (editingItem) {
        await updateItem(get(editingItem, "id"), payload);
        toast.success(`${singularLabel} yangilandi`);
      } else {
        await createItem(payload);
        toast.success(`${singularLabel} yaratildi`);
      }

      if (effectiveRefetch) {
        void effectiveRefetch();
      }
      closeAdminDrawer();
      setEditingItem(null);
      setForm(emptyForm);
    } catch (error) {
      toast.error(getErrorMessage(error, `${singularLabel}ni saqlab bo'lmadi`));
    }
  }, [
    createItem,
    canManageContent,
    currentLanguage,
    editingItem,
    effectiveRefetch,
    form,
    closeAdminDrawer,
    singularLabel,
    updateItem,
  ]);

  const submitTranslations = React.useCallback(async () => {
    if (!canManageContent || !translatingItem) {
      return;
    }

    try {
      await updateItem(get(translatingItem, "id"), {
        translations: cleanTranslations(translationForm),
      });
      toast.success("Tarjimalar yangilandi");
      if (effectiveRefetch) {
        void effectiveRefetch();
      }
      navigate(route);
      setTranslatingItem(null);
      setTranslationForm({});
    } catch (error) {
      toast.error(getErrorMessage(error, "Tarjimalarni saqlab bo'lmadi"));
    }
  }, [
    canManageContent,
    effectiveRefetch,
    navigate,
    route,
    translationForm,
    translatingItem,
    updateItem,
  ]);

  const confirmDelete = React.useCallback(async () => {
    if (!canManageContent || !itemToDelete) {
      return;
    }

    try {
      await deleteItem(get(itemToDelete, "id"));
      toast.success(`${singularLabel} o'chirildi`);
      if (effectiveRefetch) {
        void effectiveRefetch();
      }
      setItemToDelete(null);
    } catch (error) {
      toast.error(
        getErrorMessage(error, `${singularLabel}ni o'chirib bo'lmadi`),
      );
    }
  }, [
    canManageContent,
    deleteItem,
    effectiveRefetch,
    itemToDelete,
    singularLabel,
  ]);

  const handleToggleStatus = React.useCallback(
    async (item, checked) => {
      if (!canManageContent) return;

      try {
        await updateItem(get(item, "id"), { isActive: checked });
        toast.success("Status yangilandi");
        if (effectiveRefetch) {
          void effectiveRefetch();
        }
      } catch (error) {
        toast.error(getErrorMessage(error, "Statusni saqlab bo'lmadi"));
      }
    },
    [canManageContent, effectiveRefetch, updateItem],
  );

  const handleToggleOnboarding = React.useCallback(
    async (item, checked) => {
      if (!canManageContent) return;

      try {
        await updateItem(get(item, "id"), { isOnboarding: checked });
        toast.success("Onboarding holati yangilandi");
        if (effectiveRefetch) {
          void effectiveRefetch();
        }
      } catch (error) {
        toast.error(
          getErrorMessage(error, "Onboarding holatini saqlab bo'lmadi"),
        );
      }
    },
    [canManageContent, effectiveRefetch, updateItem],
  );

  const closeDrawer = React.useCallback(() => {
    closeAdminDrawer();
    setEditingItem(null);
    setForm(emptyForm);
  }, [closeAdminDrawer]);

  const closeTranslationsDrawer = React.useCallback(() => {
    navigate(route);
    setTranslatingItem(null);
    setTranslationForm({});
  }, [navigate, route]);

  const columns = React.useMemo(
    () => [
      {
        id: "dnd",
        header: "",
        size: 32,
        cell: () =>
          isReorderEnabled ? (
            <DataGridTableDndRowHandle />
          ) : (
            <span className="block size-4" />
          ),
        meta: { skeleton: adminListSkeletons.action },
      },
      {
        accessorKey: "name",
        header: title,
        enableSorting: true,
        size: 280,
        meta: { skeleton: adminListSkeletons.avatarText },
        cell: (info) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium">
              {resolveLabel(
                get(info, "row.original.translations"),
                get(info, "row.original.name"),
                currentLanguage,
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {get(info, "row.original.name")}
            </span>
          </div>
        ),
      },
      {
        id: "translations",
        header: "Tarjimalar",
        enableSorting: false,
        size: 160,
        meta: { skeleton: adminListSkeletons.translations },
        cell: (info) => {
          const translations = get(info, "row.original.translations", {});

          return (
            <div className="flex items-center gap-1">
              {map(activeLanguages, (language) => (
                <div
                  key={get(language, "id", get(language, "code"))}
                  title={`${get(language, "name", get(language, "code"))}: ${
                    typeof get(translations, get(language, "code")) ===
                      "string" && trim(get(translations, get(language, "code")))
                      ? "Bor"
                      : "Yo'q"
                  }`}
                  className={
                    typeof get(translations, get(language, "code")) ===
                      "string" && trim(get(translations, get(language, "code")))
                      ? "flex size-5 items-center justify-center rounded border border-primary/30 bg-primary/10 text-[10px] text-primary"
                      : "flex size-5 items-center justify-center rounded border border-transparent bg-muted text-[10px] opacity-40"
                  }
                >
                  {get(language, "flag") || get(language, "code")}
                </div>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        enableSorting: true,
        size: 100,
        meta: SWITCH_COLUMN_META,
        cell: (info) => (
          <div className={SWITCH_CELL_CLASS_NAME}>
            <Switch
              checked={Boolean(info.getValue())}
              disabled={!canManageContent}
              onCheckedChange={(checked) =>
                void handleToggleStatus(get(info, "row.original"), checked)
              }
            />
          </div>
        ),
      },
      {
        accessorKey: "isOnboarding",
        header: "Onboardingda",
        enableSorting: true,
        size: 132,
        meta: SWITCH_COLUMN_META,
        cell: (info) => (
          <div className={SWITCH_CELL_CLASS_NAME}>
            <Switch
              checked={Boolean(info.getValue())}
              disabled={!canManageContent}
              onCheckedChange={(checked) =>
                void handleToggleOnboarding(get(info, "row.original"), checked)
              }
            />
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        size: 50,
        meta: { skeleton: adminListSkeletons.action },
        cell: (info) => (
          <div className="flex justify-end">
            <CatalogItemActionsMenu
              item={get(info, "row.original")}
              canManage={canManageContent}
              onEdit={openEditDrawer}
              onDelete={setItemToDelete}
              onTranslations={openTranslationsDrawer}
            />
          </div>
        ),
      },
    ],
    [
      activeLanguages,
      canManageContent,
      currentLanguage,
      handleToggleStatus,
      handleToggleOnboarding,
      isReorderEnabled,
      openEditDrawer,
      openTranslationsDrawer,
      title,
    ],
  );

  const table = useReactTable({
    data: paginatedItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => toString(get(row, "id")),
    manualPagination: true,
    manualSorting: true,
    pageCount: totalPages,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: currentPage - 1, pageSize })
          : updater;

      React.startTransition(() => {
        void setPageQuery(String(get(next, "pageIndex", 0) + 1));
        void setPageSizeQuery(String(get(next, "pageSize", pageSize)));
      });
    },
    onSortingChange: (updater) => {
      const nextSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      const nextSort = nextSorting?.[0];

      React.startTransition(() => {
        void setPageQuery("1");

        if (!nextSort) {
          void setSortBy("orderKey");
          void setSortDir("asc");
          return;
        }

        void setSortBy(nextSort.id);
        void setSortDir(nextSort.desc ? "desc" : "asc");
      });
    },
    state: {
      sorting,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
    },
  });

  const handleDragEnd = React.useCallback(
    async ({ active, over }) => {
      if (
        !canManageContent ||
        !over ||
        active.id === over.id ||
        !isReorderEnabled
      ) {
        return;
      }

      const dataIds = map(paginatedItems, (item) => toString(get(item, "id")));
      const oldIndex = dataIds.indexOf(active.id);
      const newIndex = dataIds.indexOf(over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const moved = paginatedItems[oldIndex];
      const prev = paginatedItems[newIndex - 1];
      const next = paginatedItems[newIndex + 1];

      const prevId = newIndex > oldIndex ? over.id : prev?.id;
      const nextId = newIndex > oldIndex ? next?.id : over.id;

      try {
        await reorderItems({
          movedId: get(moved, "id"),
          prevId: prevId ? toNumber(prevId) : undefined,
          nextId: nextId ? toNumber(nextId) : undefined,
        });
        toast.success("Tartib yangilandi");
        if (effectiveRefetch) {
          void effectiveRefetch();
        }
      } catch (error) {
        toast.error(getErrorMessage(error, "Tartibni saqlab bo'lmadi"));
      }
    },
    [
      canManageContent,
      effectiveRefetch,
      isReorderEnabled,
      paginatedItems,
      reorderItems,
    ],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          {effectiveRefetch ? (
            <Button
              variant="outline"
              size="icon"
              onClick={() => effectiveRefetch()}
              disabled={effectiveIsFetching}
            >
              <RotateCcwIcon
                className={cn("size-4", effectiveIsFetching && "animate-spin")}
              />
            </Button>
          ) : null}
          {canManageContent ? (
            <Button onClick={openCreateDrawer} className="gap-2">
              <PlusIcon />
              Yangi {singularLabel}
            </Button>
          ) : null}
        </div>
      </div>

      <Filters
        fields={filterFields}
        filters={activeFilters}
        onChange={handleFiltersChange}
      />

      <DataGrid
        table={table}
        isLoading={effectiveIsLoading}
        recordCount={recordCount}
      >
        <DataGridContainer>
          <ScrollArea className="w-full">
            {isReorderEnabled ? (
              <DataGridTableDndRows
                table={table}
                dataIds={map(paginatedItems, (item) =>
                  toString(get(item, "id")),
                )}
                handleDragEnd={handleDragEnd}
              />
            ) : (
              <DataGridTable />
            )}
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DataGridContainer>
        {canManageContent && !isReorderEnabled ? (
          <div className="px-2 text-xs text-muted-foreground">
            Tartiblash faqat filterlarsiz, `orderKey` bo'yicha va birinchi
            sahifada ishlaydi.
          </div>
        ) : null}
        <DataGridPagination
          info="{from} - {to} / {count} ta yozuv"
          sizes={[10, 25, 50, 100]}
        />
      </DataGrid>

      <LocalizedCatalogDrawers
        activeLanguages={activeLanguages}
        currentLanguage={currentLanguage}
        currentLanguageMeta={currentLanguageMeta}
        drawerOpen={drawerOpen}
        editingItem={editingItem}
        form={form}
        isCreating={isCreating}
        isDrawerItemLoading={isDrawerItemLoading}
        isUpdating={isUpdating}
        onCloseDrawer={closeDrawer}
        onCloseTranslationsDrawer={closeTranslationsDrawer}
        onSubmitDrawer={submitDrawer}
        onSubmitTranslations={submitTranslations}
        setForm={setForm}
        setTranslationForm={setTranslationForm}
        singularLabel={singularLabel}
        translationForm={translationForm}
        translationsDrawerOpen={translationsDrawerOpen}
      />

      <AlertDialog
        open={Boolean(itemToDelete)}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {singularLabel}ni o'chirmoqchimisiz?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete
                ? `"${get(itemToDelete, "name")}" o'chiriladi va workoutlarda eski qiymat sifatida qolishi mumkin.`
                : "Tanlangan element o'chiriladi."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDelete()}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : null}
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LocalizedCatalogManager;



