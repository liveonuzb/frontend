import React from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useLocation, useNavigate } from "react-router";
import CatalogItemActionsMenu from "./catalog-item-actions-menu";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
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
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CheckCircle2Icon,
  GlobeIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminListSkeletons } from "@/modules/admin/components/admin-list-skeletons.jsx";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";

const emptyForm = {
  name: "",
  isActive: true,
  isOnboarding: true,
};

const DEFAULT_PAGE_SIZE = 20;
const TEXT_OPERATORS = [
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "is",
  "empty",
  "not_empty",
];
const SELECT_OPERATORS = ["is", "is_not", "empty", "not_empty"];
const SORT_FIELDS = ["orderKey", "name", "createdAt", "isActive", "isOnboarding"];
const SORT_DIRECTIONS = ["asc", "desc"];

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
      Object.values(translations),
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
      Object.values(translations),
      (value) => typeof value === "string" && trim(value).length > 0,
    ),
  );

const cleanTranslations = (translations = {}) =>
  Object.fromEntries(
    lodashFilter(
      map(Object.entries(translations), ([key, value]) => [
        trim(key),
        trim(toString(value)),
      ]),
      ([key, value]) => Boolean(key) && Boolean(value),
    ),
  );

const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  const dependencySummary = get(error, "response.data.dependencySummary");
  const baseMessage = isArray(message) ? join(message, ", ") : message;

  return [baseMessage || fallback, dependencySummary].filter(Boolean).join(" ");
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
  const location = useLocation();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const languages = get(languagesData, "data.data", get(languagesData, "data", []));

  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [searchOperator, setSearchOperator] = useQueryState(
    "qOp",
    parseAsStringEnum(TEXT_OPERATORS).withDefault("contains"),
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(["all", "active", "inactive"]).withDefault("all"),
  );
  const [statusOperator, setStatusOperator] = useQueryState(
    "statusOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [onboardingFilter, setOnboardingFilter] = useQueryState(
    "onboarding",
    parseAsStringEnum(["all", "yes", "no"]).withDefault("all"),
  );
  const [onboardingOperator, setOnboardingOperator] = useQueryState(
    "onboardingOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [translationFilter, setTranslationFilter] = useQueryState(
    "translations",
    parseAsStringEnum(["all", "complete", "missing"]).withDefault("all"),
  );
  const [translationOperator, setTranslationOperator] = useQueryState(
    "translationsOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [pageQuery, setPageQuery] = useQueryState(
    "page",
    parseAsString.withDefault("1"),
  );
  const [pageSizeQuery, setPageSizeQuery] = useQueryState(
    "pageSize",
    parseAsString.withDefault(String(DEFAULT_PAGE_SIZE)),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringEnum(SORT_FIELDS).withDefault("orderKey"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(SORT_DIRECTIONS).withDefault("asc"),
  );
  const currentPage = Math.max(1, Number(pageQuery) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(pageSizeQuery) || DEFAULT_PAGE_SIZE),
  );
  const sorting = React.useMemo(
    () =>
      sortBy === "orderKey" && sortDir === "asc"
        ? []
        : [{ id: sortBy, desc: sortDir === "desc" }],
    [sortBy, sortDir],
  );

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

  const deferredSearch = React.useDeferredValue(search);
  const serverSide = Boolean(endpoint);
  const queryParams = React.useMemo(
    () => ({
      ...(deferredSearch.trim() ? { q: deferredSearch.trim() } : {}),
      ...((deferredSearch.trim() ||
        searchOperator === "empty" ||
        searchOperator === "not_empty") &&
      searchOperator !== "contains"
        ? { qOp: searchOperator }
        : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...((statusFilter !== "all" ||
        statusOperator === "empty" ||
        statusOperator === "not_empty") &&
      statusOperator !== "is"
        ? { statusOp: statusOperator }
        : {}),
      ...(onboardingFilter !== "all" ? { onboarding: onboardingFilter } : {}),
      ...((onboardingFilter !== "all" ||
        onboardingOperator === "empty" ||
        onboardingOperator === "not_empty") &&
      onboardingOperator !== "is"
        ? { onboardingOp: onboardingOperator }
        : {}),
      ...(translationFilter !== "all"
        ? { translations: translationFilter }
        : {}),
      ...((translationFilter !== "all" ||
        translationOperator === "empty" ||
        translationOperator === "not_empty") &&
      translationOperator !== "is"
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
      onboardingFilter,
      onboardingOperator,
      sortBy,
      sortDir,
      statusFilter,
      statusOperator,
      translationFilter,
      translationOperator,
    ],
  );
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
  const isDrawerItemLoading = Boolean(serverSide && routeItemId && detailQuery.isLoading);

  React.useEffect(() => {
    if (!effectiveMeta) return;

    const nextTotalPages = Math.max(1, Number(get(effectiveMeta, "totalPages")) || 1);
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
      Object.fromEntries(
        map(activeLanguages, (language) => [
          get(language, "code"),
          resolveLabel(
            get(routeItem, "translations"),
            get(routeItem, "name", ""),
            get(language, "code"),
          ),
        ]),
      ),
    );
  }, [activeLanguages, routeItem, routeMode]);

  const filteredItems = React.useMemo(() => {
    if (serverSide) return effectiveItems;

    const searchValue = deferredSearch.trim().toLowerCase();

    return lodashFilter(effectiveItems, (item) => {
      const localizedName = resolveLabel(
        get(item, "translations"),
        get(item, "name"),
        currentLanguage,
      );
      const matchesSearch =
        !searchValue ||
        localizedName.toLowerCase().includes(searchValue) ||
        get(item, "name", "").toLowerCase().includes(searchValue);
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
        size(activeLanguages) > 0 && filledCount >= size(activeLanguages);

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

  const isReorderEnabled =
    canManageContent &&
    deferredSearch.trim() === "" &&
    searchOperator === "contains" &&
    statusFilter === "all" &&
    statusOperator === "is" &&
    onboardingFilter === "all" &&
    onboardingOperator === "is" &&
    translationFilter === "all" &&
    translationOperator === "is" &&
    sortBy === "orderKey" &&
    sortDir === "asc" &&
    currentPage === 1;

  const paginatedItems = React.useMemo(() => {
    if (serverSide) return filteredItems;

    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [currentPage, filteredItems, pageSize, serverSide]);

  const totalPages = Math.max(
    1,
    Number(get(effectiveMeta, "totalPages")) ||
      Math.ceil(filteredItems.length / pageSize),
  );
  const recordCount =
    Number(get(effectiveMeta, "total")) || filteredItems.length;

  const filterFields = React.useMemo(
    () => [
      {
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: pluralSearchPlaceholder,
      },
      {
        label: "Status",
        key: "status",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha statuslar" },
          { value: "active", label: "Faqat faol" },
          { value: "inactive", label: "Faqat nofaol" },
        ],
      },
      {
        label: "Onboarding",
        key: "onboarding",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barchasi" },
          { value: "yes", label: "Onboarding uchun" },
          { value: "no", label: "Qo'shimcha" },
        ],
      },
      {
        label: "Tarjimalar",
        key: "translations",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha tarjimalar" },
          { value: "complete", label: "Tarjimasi to'liq" },
          { value: "missing", label: "Tarjimasi to'liq emas" },
        ],
      },
    ],
    [pluralSearchPlaceholder],
  );

  const activeFilters = React.useMemo(() => {
    const next = [];

    if (
      search.trim() ||
      searchOperator === "empty" ||
      searchOperator === "not_empty"
    ) {
      next.push({
        id: "q",
        field: "q",
        operator: searchOperator,
        values:
          searchOperator === "empty" || searchOperator === "not_empty"
            ? []
            : [search],
      });
    }

    if (
      statusFilter !== "all" ||
      statusOperator === "empty" ||
      statusOperator === "not_empty"
    ) {
      next.push({
        id: "status",
        field: "status",
        operator: statusOperator,
        values:
          statusOperator === "empty" || statusOperator === "not_empty"
            ? []
            : [statusFilter],
      });
    }

    if (
      onboardingFilter !== "all" ||
      onboardingOperator === "empty" ||
      onboardingOperator === "not_empty"
    ) {
      next.push({
        id: "onboarding",
        field: "onboarding",
        operator: onboardingOperator,
        values:
          onboardingOperator === "empty" ||
          onboardingOperator === "not_empty"
            ? []
            : [onboardingFilter],
      });
    }

    if (
      translationFilter !== "all" ||
      translationOperator === "empty" ||
      translationOperator === "not_empty"
    ) {
      next.push({
        id: "translations",
        field: "translations",
        operator: translationOperator,
        values:
          translationOperator === "empty" || translationOperator === "not_empty"
            ? []
            : [translationFilter],
      });
    }

    return next;
  }, [
    search,
    searchOperator,
    onboardingFilter,
    onboardingOperator,
    statusFilter,
    statusOperator,
    translationFilter,
    translationOperator,
  ]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch = get(
        find(nextFilters, (f) => get(f, "field") === "q"),
        "values[0]",
        "",
      );
      const nextSearchOperator = get(
        find(nextFilters, (f) => get(f, "field") === "q"),
        "operator",
        "contains",
      );
      const nextStatus = get(
        find(nextFilters, (f) => get(f, "field") === "status"),
        "values[0]",
        "all",
      );
      const nextStatusOperator = get(
        find(nextFilters, (f) => get(f, "field") === "status"),
        "operator",
        "is",
      );
      const nextOnboarding = get(
        find(nextFilters, (f) => get(f, "field") === "onboarding"),
        "values[0]",
        "all",
      );
      const nextOnboardingOperator = get(
        find(nextFilters, (f) => get(f, "field") === "onboarding"),
        "operator",
        "is",
      );
      const nextTranslations = get(
        find(nextFilters, (f) => get(f, "field") === "translations"),
        "values[0]",
        "all",
      );
      const nextTranslationsOperator = get(
        find(nextFilters, (f) => get(f, "field") === "translations"),
        "operator",
        "is",
      );

      React.startTransition(() => {
        void setSearch(nextSearch);
        void setSearchOperator(nextSearchOperator);
        void setStatusFilter(nextStatus);
        void setStatusOperator(nextStatusOperator);
        void setOnboardingFilter(nextOnboarding);
        void setOnboardingOperator(nextOnboardingOperator);
        void setTranslationFilter(nextTranslations);
        void setTranslationOperator(nextTranslationsOperator);
        void setPageQuery("1");
      });
    },
    [
      setPageQuery,
      setSearch,
      setSearchOperator,
      setOnboardingFilter,
      setOnboardingOperator,
      setStatusFilter,
      setStatusOperator,
      setTranslationFilter,
      setTranslationOperator,
    ],
  );

  const openCreateDrawer = React.useCallback(() => {
    if (!canManageContent) return;
    setEditingItem(null);
    setForm(emptyForm);
    navigate(`${route}/create`);
  }, [canManageContent, navigate, route]);

  const openEditDrawer = React.useCallback(
    (item) => {
      if (!canManageContent) return;
      setEditingItem(item);
      setForm(createFormFromItem(item, currentLanguage));
      navigate(`${route}/edit/${get(item, "id")}`);
    },
    [canManageContent, currentLanguage, navigate, route],
  );

  const openTranslationsDrawer = React.useCallback(
    (item) => {
      if (!canManageContent) return;
      setTranslatingItem(item);
      setTranslationForm(
        Object.fromEntries(
          map(activeLanguages, (language) => [
            get(language, "code"),
            resolveLabel(
              get(item, "translations"),
              get(item, "name", ""),
              get(language, "code"),
            ),
          ]),
        ),
      );
      navigate(`${route}/translate/${get(item, "id")}`);
    },
    [activeLanguages, canManageContent, navigate, route],
  );

  const submitDrawer = React.useCallback(async () => {
    if (!canManageContent) return;

    const trimmedName = form.name.trim();

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
      navigate(route);
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
    navigate,
    route,
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
                    typeof get(translations, get(language, "code")) === "string" &&
                    trim(get(translations, get(language, "code")))
                      ? "Bor"
                      : "Yo'q"
                  }`}
                  className={
                    typeof get(translations, get(language, "code")) === "string" &&
                    trim(get(translations, get(language, "code")))
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
        meta: { skeleton: adminListSkeletons.status },
        cell: (info) => (
          <div className="flex justify-center">
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
        header: "Onboarding",
        enableSorting: true,
        size: 132,
        meta: { skeleton: adminListSkeletons.status },
        cell: (info) => (
          <div className="flex justify-center">
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
      if (!canManageContent || !over || active.id === over.id || !isReorderEnabled) {
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
          prevId: prevId ? Number(prevId) : undefined,
          nextId: nextId ? Number(nextId) : undefined,
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

      <Drawer
        open={drawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            navigate(route);
            setEditingItem(null);
            setForm(emptyForm);
          }
        }}
        direction="bottom"
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {editingItem
                ? `${singularLabel}ni tahrirlash`
                : `Yangi ${singularLabel}`}
            </DrawerTitle>
            <DrawerDescription>
              Joriy til uchun asosiy ma'lumotlarni kiriting.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="flex flex-col gap-4">
            {isDrawerItemLoading ? (
              <div className="flex min-h-48 items-center justify-center">
                <LoaderCircleIcon className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="rounded-2xl border px-4 py-3 text-sm">
                  <p className="font-medium">
                    Joriy til:{" "}
                    {get(currentLanguageMeta, "flag")
                      ? `${get(currentLanguageMeta, "flag")} `
                      : ""}
                    {get(
                      currentLanguageMeta,
                      "name",
                      currentLanguage.toUpperCase(),
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Qo'shimcha tarjimalar alohida drawerda boshqariladi.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Nomi ({currentLanguage.toUpperCase()})</Label>
                  <Input
                    value={get(form, "name")}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: get(event, "target.value"),
                      }))
                    }
                    placeholder={`${singularLabel} nomini kiriting`}
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
                  <div>
                    <Label>Status</Label>
                    <p className="text-xs text-muted-foreground">
                      Faol bo'lsa workout formida ko'rinadi.
                    </p>
                  </div>
                  <Switch
                    checked={get(form, "isActive")}
                    onCheckedChange={(checked) =>
                      setForm((current) => ({
                        ...current,
                        isActive: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
                  <div>
                    <Label>Onboarding</Label>
                    <p className="text-xs text-muted-foreground">
                      Yoqilgan bo'lsa onboarding ro'yxatlarida birinchi chiqadi.
                    </p>
                  </div>
                  <Switch
                    checked={get(form, "isOnboarding")}
                    onCheckedChange={(checked) =>
                      setForm((current) => ({
                        ...current,
                        isOnboarding: checked,
                      }))
                    }
                  />
                </div>
              </>
            )}
          </DrawerBody>

          <DrawerFooter>
            <Button
              onClick={() => void submitDrawer()}
              disabled={isCreating || isUpdating || isDrawerItemLoading}
              className="gap-2"
            >
              {isCreating || isUpdating ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <CheckCircle2Icon />
              )}
              Saqlash
            </Button>
            <Button variant="outline" onClick={() => navigate(route)}>
              Bekor qilish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={translationsDrawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            navigate(route);
            setTranslatingItem(null);
            setTranslationForm({});
          }
        }}
        direction="bottom"
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Tarjimalarni boshqarish</DrawerTitle>
            <DrawerDescription>
              Har bir faol til uchun alohida tarjima kiriting.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="flex flex-col gap-4">
            {isDrawerItemLoading ? (
              <div className="flex min-h-48 items-center justify-center">
                <LoaderCircleIcon className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              map(activeLanguages, (language) => (
                <div key={get(language, "id")} className="flex flex-col gap-2">
                  <Label>
                    {get(language, "flag")} {get(language, "name")}
                  </Label>
                  <Input
                    value={get(translationForm, get(language, "code"), "")}
                    onChange={(event) =>
                      setTranslationForm((current) => ({
                        ...current,
                        [language.code]: event.target.value,
                      }))
                    }
                    placeholder={`${language.name} tarjimasi`}
                  />
                </div>
              ))
            )}
          </DrawerBody>

          <DrawerFooter>
            <Button
              onClick={() => void submitTranslations()}
              disabled={isUpdating || isDrawerItemLoading}
              className="gap-2"
            >
              {isUpdating ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <CheckCircle2Icon />
              )}
              Tarjimalarni saqlash
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

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
