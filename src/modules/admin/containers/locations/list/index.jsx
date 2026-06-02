import React from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import filter from "lodash/filter";
import find from "lodash/find";
import fromPairs from "lodash/fromPairs";
import get from "lodash/get";
import isArray from "lodash/isArray";
import join from "lodash/join";
import map from "lodash/map";
import size from "lodash/size";
import toString from "lodash/toString";
import trim from "lodash/trim";
import forEach from "lodash/forEach";
import toNumber from "lodash/toNumber";
import toUpper from "lodash/toUpper";
import { toast } from "sonner";
import { useMatch, useNavigate } from "react-router";
import {
  CheckCircle2Icon,
  Globe2Icon,
  GlobeIcon,
  MapIcon,
  MapPinnedIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
} from "lucide-react";
import useApi from "@/hooks/api/use-api.js";
import { useBreadcrumbStore, useLanguageStore } from "@/store";
import {
  useGetQuery,
  usePostQuery,
  usePatchQuery,
  useDeleteQuery,
} from "@/hooks/api";
import { cn } from "@/lib/utils";
import { cleanLocationTranslations, resolveTranslatedLocationLabel } from "@/lib/location-translations.js";
import { DataGrid, DataGridContainer, DataGridPagination, DataGridTable } from "@/components/reui/data-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner.jsx";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useLocationFilters } from "./use-filters.js";
import { DeleteAlert } from "./delete-alert.jsx";

const PARENT_TYPE_MAP = { country: null, region: "country", district: "region", city: "district" };
const NEXT_TYPE_MAP = { country: "region", region: "district", district: "city", city: null };
const EMPTY_FORM = { name: "", type: "country", parentId: "", isActive: true };

const LocationStatCard = ({ icon: Icon, label, value, hint }) => (
  <Card className="rounded-[28px] border-border/50 bg-background/75">
    <CardContent className="space-y-3 p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="text-3xl font-black tracking-tight">{value ?? "-"}</div>
      <div className="text-sm text-muted-foreground">{hint}</div>
    </CardContent>
  </Card>
);

const LocationsIndex = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const { request } = useApi();
  const createMatch = useMatch("/admin/locations/create");
  const childCreateMatch = useMatch("/admin/locations/create/:parentId");
  const editMatch = useMatch("/admin/locations/edit/:id");
  const translateMatch = useMatch("/admin/locations/translate/:id");
  const childParentId = get(childCreateMatch, "params.parentId");
  const editingLocationId = get(editMatch, "params.id");
  const translatingLocationId = get(translateMatch, "params.id");
  const drawerOpen = Boolean(createMatch || childParentId || editingLocationId);
  const translationsDrawerOpen = Boolean(translatingLocationId);

  // --- Languages ---
  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const languages = get(languagesData, "data.data", []);

  // --- Stats ---
  const { data: statsData, refetch: refetchStats } = useGetQuery({
    url: "/admin/locations/stats",
    queryProps: { queryKey: ["admin", "locations", "stats"] },
  });
  const stats = get(statsData, "data.data", get(statsData, "data", {
    total: 0, active: 0, inactive: 0, countries: 0, regions: 0, districts: 0, cities: 0,
  }));

  const { data: editingLocationData, isLoading: isEditingLocationLoading } =
    useGetQuery({
      url: `/admin/locations/${editingLocationId || ""}`,
      queryProps: {
        queryKey: ["admin", "locations", "detail", editingLocationId],
        enabled: Boolean(editingLocationId),
      },
    });
  const { data: translatingLocationData, isLoading: isTranslatingLocationLoading } =
    useGetQuery({
      url: `/admin/locations/${translatingLocationId || ""}`,
      queryProps: {
        queryKey: ["admin", "locations", "detail", translatingLocationId],
        enabled: Boolean(translatingLocationId),
      },
    });
  const { data: childParentData, isLoading: isChildParentLoading } = useGetQuery({
    url: `/admin/locations/${childParentId || ""}`,
    queryProps: {
      queryKey: ["admin", "locations", "detail", childParentId],
      enabled: Boolean(childParentId),
    },
  });

  // --- Mutations ---
  const { mutateAsync: createLocationMutation, isPending: isCreating } = usePostQuery({
    queryKey: ["admin", "locations", "root"],
    listKey: ["admin", "locations"],
  });
  const { mutateAsync: updateLocationMutation, isPending: isUpdating } = usePatchQuery({
    queryKey: ["admin", "locations", "root"],
    listKey: ["admin", "locations"],
  });
  const { mutateAsync: deleteLocationMutation, isPending: isDeleting } = useDeleteQuery({
    queryKey: ["admin", "locations", "root"],
    listKey: ["admin", "locations"],
  });

  const createLocation = React.useCallback(
    async (payload) => createLocationMutation({ url: "/admin/locations", attributes: payload }),
    [createLocationMutation],
  );
  const updateLocation = React.useCallback(
    async (id, payload) => updateLocationMutation({ url: `/admin/locations/${id}`, attributes: payload }),
    [updateLocationMutation],
  );
  const deleteLocation = React.useCallback(
    async (id) => deleteLocationMutation({ url: `/admin/locations/${id}` }),
    [deleteLocationMutation],
  );

  // --- Filters ---
  const {
    search,
    searchOperator,
    typeFilter,
    typeOperator,
    statusFilter,
    statusOperator,
    translationFilter,
    translationOperator,
    sortBy,
    sortDir,
    sorting,
    currentPage,
    pageSize,
    setPageQuery,
    setPageSizeQuery,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  } = useLocationFilters();

  const deferredSearch = React.useDeferredValue(search);
  const queryParams = React.useMemo(
    () => ({
      ...(trim(deferredSearch) ? { q: trim(deferredSearch) } : {}),
      ...((trim(deferredSearch) ||
        searchOperator === "empty" ||
        searchOperator === "not_empty") &&
      searchOperator !== "contains"
        ? { qOp: searchOperator }
        : {}),
      ...(typeFilter !== "all" ? { type: typeFilter } : {}),
      ...((typeFilter !== "all" ||
        typeOperator === "empty" ||
        typeOperator === "not_empty") &&
      typeOperator !== "is"
        ? { typeOp: typeOperator }
        : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...((statusFilter !== "all" ||
        statusOperator === "empty" ||
        statusOperator === "not_empty") &&
      statusOperator !== "is"
        ? { statusOp: statusOperator }
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
      sortBy,
      sortDir,
      statusFilter,
      statusOperator,
      translationFilter,
      translationOperator,
      typeFilter,
      typeOperator,
    ],
  );

  const { data: locationsData, isLoading, isFetching, refetch: refetchRoot } =
    useGetQuery({
      url: "/admin/locations",
      params: queryParams,
      queryProps: { queryKey: ["admin", "locations", "list", queryParams] },
    });
  const locations = React.useMemo(() => {
    const items = get(locationsData, "data.data", []);
    return isArray(items) ? items : [];
  }, [locationsData]);
  const meta = get(locationsData, "data.meta", {
    total: 0,
    page: currentPage,
    pageSize,
    totalPages: 1,
  });

  // --- Local UI state ---
  const [editingLocation, setEditingLocation] = React.useState(null);
  const [translatingLocation, setTranslatingLocation] = React.useState(null);
  const [locationToDelete, setLocationToDelete] = React.useState(null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [translationForm, setTranslationForm] = React.useState({});

  // --- Lazy expand state ---
  const [expandedIds, setExpandedIds] = React.useState({});
  const [childrenMap, setChildrenMap] = React.useState({});
  const [loadingIds, setLoadingIds] = React.useState({});

  const activeLanguages = React.useMemo(() => filter(languages, (language) => language.isActive !== false), [languages]);
  const currentLanguageMeta = React.useMemo(() => find(activeLanguages, { code: currentLanguage }) || null, [activeLanguages, currentLanguage]);

  React.useEffect(() => {
    setBreadcrumbs([{ url: "/admin", title: "Admin" }, { url: "/admin/locations", title: "Locations" }]);
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    const nextTotalPages = Math.max(1, toNumber(get(meta, "totalPages")) || 1);
    if (currentPage > nextTotalPages) {
      void setPageQuery(String(nextTotalPages));
    }
  }, [currentPage, meta, setPageQuery]);

  React.useEffect(() => {
    if (!createMatch) return;

    setEditingLocation(null);
    setForm(EMPTY_FORM);
  }, [createMatch]);

  React.useEffect(() => {
    const parent = get(childParentData, "data.data");
    if (!parent) return;

    const nextType = NEXT_TYPE_MAP[parent.type];
    if (!nextType) return;

    setEditingLocation(null);
    setForm({ name: "", type: nextType, parentId: parent.id, isActive: true });
  }, [childParentData]);

  React.useEffect(() => {
    const location = get(editingLocationData, "data.data");
    if (!location) return;

    setEditingLocation(location);
    setForm({
      name: resolveTranslatedLocationLabel(location.translations, location.name || "", currentLanguage),
      type: location.type || "country",
      parentId: location.parentId || "",
      isActive: Boolean(location.isActive),
    });
  }, [currentLanguage, editingLocationData]);

  React.useEffect(() => {
    const location = get(translatingLocationData, "data.data");
    if (!location) return;

    setTranslatingLocation(location);
    setTranslationForm(fromPairs(map(activeLanguages, (language) => [language.code, resolveTranslatedLocationLabel(location.translations, location.name || "", language.code)])));
  }, [activeLanguages, translatingLocationData]);

  // --- Fetch children lazily ---
  const handleExpand = React.useCallback(async (locationId) => {
    if (expandedIds[locationId]) {
      setExpandedIds((prev) => {
        const next = { ...prev };
        delete next[locationId];
        return next;
      });
      return;
    }

    setLoadingIds((prev) => ({ ...prev, [locationId]: true }));
    try {
      const response = await request.get("/admin/locations/children", { params: { parentId: locationId } });
      const children = get(response, "data.data", get(response, "data", []));
      setChildrenMap((prev) => ({ ...prev, [locationId]: children }));
      setExpandedIds((prev) => ({ ...prev, [locationId]: true }));
    } catch {
      toast.error("Bolalarini yuklashda xato");
    } finally {
      setLoadingIds((prev) => {
        const next = { ...prev };
        delete next[locationId];
        return next;
      });
    }
  }, [expandedIds, request]);

  // --- Refetch children for a specific parent (after mutation) ---
  const refetchChildren = React.useCallback(async (parentId) => {
    if (!parentId || !expandedIds[parentId]) return;
    try {
      const response = await request.get("/admin/locations/children", { params: { parentId } });
      const children = get(response, "data.data", get(response, "data", []));
      setChildrenMap((prev) => ({ ...prev, [parentId]: children }));
    } catch {
      // silent
    }
  }, [expandedIds, request]);

  // --- Build flat display list with depth ---
  const displayList = React.useMemo(() => {
    const result = [];
    const addWithChildren = (items, depth = 0, parentPath = []) => {
      forEach(items, (item) => {
        const localizedName = resolveTranslatedLocationLabel(item.translations, item.name, currentLanguage);
        const path = item.path?.length ? item.path : [...parentPath, localizedName];
        const hasChildren = Boolean(item._count?.children > 0 || item.childrenCount > 0 || item.hasChildren);
        result.push({
          ...item,
          depth: item.depth ?? Math.max(path.length - 1, depth),
          name: localizedName,
          path,
          pathLabel: item.pathLabel || path.join(" / "),
          hasChildren,
        });
        if (expandedIds[item.id] && childrenMap[item.id]) {
          addWithChildren(childrenMap[item.id], depth + 1, path);
        }
      });
    };
    addWithChildren(locations);
    return result;
  }, [locations, expandedIds, childrenMap, currentLanguage]);

  const paginatedList = displayList;
  const totalCount = toNumber(get(meta, "total")) || 0;
  const totalPages = Math.max(1, toNumber(get(meta, "totalPages")) || 1);

  // --- Stats cards ---
  const statsCards = React.useMemo(() => [
    { label: "Jami", value: stats.total, hint: "Barcha locationlar soni", icon: Globe2Icon },
    { label: "Faol", value: stats.active, hint: "Faol locationlar", icon: CheckCircle2Icon },
    { label: "Davlatlar", value: stats.countries, hint: "Ildiz darajadagi mamlakatlar", icon: Globe2Icon },
    { label: "Viloyatlar", value: stats.regions, hint: "Country ichidagi regionlar", icon: MapIcon },
    { label: "Tumanlar", value: stats.districts, hint: "Region ichidagi districtlar", icon: MapPinnedIcon },
  ], [stats]);

  // --- Drawer handlers ---
  const openCreateDrawer = React.useCallback(() => {
    setEditingLocation(null);
    setForm(EMPTY_FORM);
    navigate("/admin/locations/create");
  }, [navigate]);

  const openChildDrawer = React.useCallback((location) => {
    const nextType = NEXT_TYPE_MAP[location.type];
    if (!nextType) return;
    setEditingLocation(null);
    setForm({ name: "", type: nextType, parentId: location.id, isActive: true });
    navigate(`/admin/locations/create/${location.id}`);
  }, [navigate]);

  const openEditDrawer = React.useCallback((location) => {
    setEditingLocation(location);
    setForm({
      name: resolveTranslatedLocationLabel(location.translations, location.name || "", currentLanguage),
      type: location.type || "country",
      parentId: location.parentId || "",
      isActive: Boolean(location.isActive),
    });
    navigate(`/admin/locations/edit/${location.id}`);
  }, [currentLanguage, navigate]);

  const openTranslationsDrawer = React.useCallback((location) => {
    setTranslatingLocation(location);
    setTranslationForm(fromPairs(map(activeLanguages, (language) => [language.code, resolveTranslatedLocationLabel(location.translations, location.name || "", language.code)])));
    navigate(`/admin/locations/translate/${location.id}`);
  }, [activeLanguages, navigate]);

  // --- Save handler ---
  const handleSave = React.useCallback(async () => {
    const name = trim(form.name);
    if (!name) { toast.error("Location nomini kiriting"); return; }
    if (PARENT_TYPE_MAP[form.type] && !form.parentId) { toast.error("Parent locationni tanlang"); return; }
    const payload = {
      name,
      translations: cleanLocationTranslations({ ...(editingLocation?.translations || {}), [currentLanguage]: name }),
      type: toUpper(form.type),
      ...(PARENT_TYPE_MAP[form.type] ? { parentId: form.parentId } : {}),
      isActive: form.isActive,
    };
    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, payload);
        toast.success("Location yangilandi");
      } else {
        await createLocation(payload);
        toast.success("Location qo'shildi");
      }
      navigate("/admin/locations");
      setEditingLocation(null);
      setForm(EMPTY_FORM);
      // Refetch relevant data
      refetchRoot();
      refetchStats();
      if (form.parentId) {
        refetchChildren(form.parentId);
      }
      if (editingLocation?.parentId) {
        refetchChildren(editingLocation.parentId);
      }
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(isArray(message) ? join(message, ", ") : message || "Location saqlanmadi");
    }
  }, [createLocation, currentLanguage, editingLocation, form, navigate, updateLocation, refetchRoot, refetchStats, refetchChildren]);

  // --- Translation save handler ---
  const handleTranslationSave = React.useCallback(async () => {
    if (!translatingLocation) return;
    const localizedName = trim(toString(get(translationForm, currentLanguage, "")));
    const cleanedTranslations = cleanLocationTranslations(translationForm);
    try {
      await updateLocation(translatingLocation.id, { ...(localizedName ? { name: localizedName } : {}), translations: cleanedTranslations });
      toast.success("Tarjimalar yangilandi");
      navigate("/admin/locations");
      setTranslatingLocation(null);
      setTranslationForm({});
      refetchRoot();
      if (translatingLocation.parentId) {
        refetchChildren(translatingLocation.parentId);
      }
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(isArray(message) ? join(message, ", ") : message || "Tarjimalarni saqlab bo'lmadi");
    }
  }, [currentLanguage, navigate, translatingLocation, translationForm, updateLocation, refetchRoot, refetchChildren]);

  // --- Delete handler ---
  const handleDelete = React.useCallback(async () => {
    if (!locationToDelete) return;
    try {
      await deleteLocation(locationToDelete.id);
      toast.success("Location o'chirildi");
      const parentId = locationToDelete.parentId;
      setLocationToDelete(null);
      // Remove from children map if present
      if (parentId && childrenMap[parentId]) {
        setChildrenMap((prev) => ({
          ...prev,
          [parentId]: filter(prev[parentId], (c) => c.id !== locationToDelete.id),
        }));
      }
      refetchRoot();
      refetchStats();
      if (parentId) {
        refetchChildren(parentId);
      }
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(isArray(message) ? join(message, ", ") : message || "Locationni o'chirib bo'lmadi");
    }
  }, [deleteLocation, locationToDelete, childrenMap, refetchRoot, refetchStats, refetchChildren]);

  // --- Toggle active handler ---
  const handleToggleActive = React.useCallback(async (location) => {
    try {
      await updateLocation(location.id, { isActive: !location.isActive });
      toast.success(location.isActive ? "Location nofaol qilindi" : "Location faol qilindi");
      refetchRoot();
      refetchStats();
      if (location.parentId) {
        refetchChildren(location.parentId);
      }
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(isArray(message) ? join(message, ", ") : message || "Location statusini o'zgartirib bo'lmadi");
    }
  }, [updateLocation, refetchRoot, refetchStats, refetchChildren]);

  // --- Refetch all ---
  const handleRefresh = React.useCallback(() => {
    refetchRoot();
    refetchStats();
    setExpandedIds({});
    setChildrenMap({});
  }, [refetchRoot, refetchStats]);

  // --- Columns ---
  const columns = useColumns({
    activeLanguages,
    expandedIds,
    loadingIds,
    isUpdating,
    handleToggleActive,
    handleExpand,
    openChildDrawer,
    openEditDrawer,
    openTranslationsDrawer,
    setLocationToDelete,
  });

  // --- React Table (flat, no getExpandedRowModel) ---
  const table = useReactTable({
    data: paginatedList,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => toString(get(row, "id")),
    manualPagination: true,
    manualSorting: true,
    pageCount: totalPages,
    onSortingChange: handleSortingChange,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: currentPage - 1, pageSize })
          : updater;
      const nextPageSize = toNumber(get(next, "pageSize")) || pageSize;

      React.startTransition(() => {
        void setPageQuery(
          String(nextPageSize === pageSize ? get(next, "pageIndex", 0) + 1 : 1),
        );
        void setPageSizeQuery(String(nextPageSize));
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

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Locations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Country, region, district va city ro&apos;yxatini boshqaring. Kengaytirganda child elementlar lazy yuklanadi.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isFetching}>
            <RotateCcwIcon className={cn("size-4", isFetching && "animate-spin")} />
          </Button>
          <Button onClick={openCreateDrawer} className="gap-1.5"><PlusIcon className="size-4" />Location qo&apos;shish</Button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        {map(statsCards, (item) => <LocationStatCard key={item.label} {...item} />)}
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Filter filterFields={filterFields} activeFilters={activeFilters} handleFiltersChange={handleFiltersChange} />
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>{totalCount} ta location ko&apos;rsatilmoqda{currentLanguageMeta ? ` \u2022 ${currentLanguageMeta.flag ? `${currentLanguageMeta.flag} ` : ""}${currentLanguageMeta.name}` : ""}</p>
      </div>
      <DataGrid
        table={table}
        isLoading={isLoading || isFetching}
        recordCount={totalCount}
      >
        <DataGridContainer>
          <ScrollArea className="w-full">
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DataGridContainer>
        <DataGridPagination
          info="{from} - {to} / {count} ta location"
          sizes={[10, 20, 50, 100]}
        />
      </DataGrid>
      {!isLoading && !totalCount ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          {search || typeFilter !== "all" || statusFilter !== "all" || translationFilter !== "all"
            ? "Filterlarga mos location topilmadi."
            : "Hali location qo'shilmagan."
          }
        </div>
      ) : null}
      {/* Create/Edit Drawer */}
      <Drawer
        open={drawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            navigate("/admin/locations");
            setEditingLocation(null);
            setForm(EMPTY_FORM);
          }
        }}
        direction="bottom"
      >
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
          <div className="mx-auto flex w-full min-h-0 flex-1 flex-col">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">{editingLocation ? <PencilIcon className="size-5" /> : <PlusIcon className="size-5" />}{editingLocation ? "Locationni tahrirlash" : "Yangi location"}</DrawerTitle>
              <DrawerDescription>Bu drawer faqat joriy locale nomi va statusni boshqaradi. Tree darajasi qayerdan ochilganiga qarab avtomatik belgilanadi.</DrawerDescription>
            </DrawerHeader>
            {isEditingLocationLoading || isChildParentLoading ? (
              <div className="flex min-h-64 items-center justify-center px-4 py-10">
                <Spinner className="size-8 text-muted-foreground" />
              </div>
            ) : (
              <div className="no-scrollbar flex flex-1 flex-col gap-6 overflow-y-auto p-4">
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
                  <p className="font-medium">Joriy til: {currentLanguageMeta?.flag ? `${currentLanguageMeta.flag} ` : ""}{get(currentLanguageMeta, "name", toUpper(currentLanguage))}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Shu drawer saqlanganda {toUpper(currentLanguage)} nomi `name` va translation qiymati sifatida birga yangilanadi.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Location nomi</Label>
                  <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Masalan, Toshkent" />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/15 px-4 py-3">
                  <div><div className="font-medium">Faol holatda qolsin</div><div className="text-sm text-muted-foreground">Selectorlar faqat faol locationlarni ko&apos;rsatadi.</div></div>
                  <Switch checked={form.isActive} onCheckedChange={(value) => setForm((current) => ({ ...current, isActive: Boolean(value) }))} />
                </div>
              </div>
            )}
            <DrawerFooter className="gap-2 border-t bg-muted/5 px-6 py-4">
              <Button type="button" onClick={handleSave} disabled={isCreating || isUpdating || isDeleting || isEditingLocationLoading || isChildParentLoading}>{editingLocation ? "Saqlash" : "Yaratish"}</Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
      {/* Translations Drawer */}
      <Drawer
        open={translationsDrawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            navigate("/admin/locations");
            setTranslatingLocation(null);
            setTranslationForm({});
          }
        }}
        direction="bottom"
      >
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
          <div className="mx-auto flex w-full min-h-0 flex-1 flex-col">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2"><GlobeIcon className="size-5" />Tarjimalarni boshqarish</DrawerTitle>
              <DrawerDescription>`FoodCategory` oqimidagi kabi, barcha faol tillar shu drawerda tahrirlanadi.</DrawerDescription>
            </DrawerHeader>
            {isTranslatingLocationLoading ? (
              <div className="flex min-h-64 items-center justify-center px-4 py-10">
                <Spinner className="size-8 text-muted-foreground" />
              </div>
            ) : (
              <div className="no-scrollbar flex flex-1 flex-col gap-6 overflow-y-auto p-4">
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
                  <p className="font-medium">{translatingLocation?.pathLabel || translatingLocation?.name || "Location"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Joriy til qiymati saqlansa, asosiy `name` ham yangilanadi.</p>
                </div>
                {activeLanguages.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {map(activeLanguages, (language) => (
                      <div key={language.id} className="flex flex-col gap-2">
                        <Label className="flex items-center gap-2 text-xs font-medium">
                          <span>{language.flag}</span>{language.name}
                          {language.code === currentLanguage ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Asosiy</span> : null}
                        </Label>
                        <div className="relative">
                          <Input value={get(translationForm, language.code, "")} onChange={(event) => setTranslationForm((current) => ({ ...current, [language.code]: event.target.value }))} placeholder={`${language.name} tilidagi tarjima`} className="pr-10" />
                          {get(translationForm, language.code) ? <CheckCircle2Icon className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-emerald-500" /> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">Qo&apos;shimcha faol tillar topilmadi.</div>
                )}
              </div>
            )}
            <DrawerFooter className="gap-2 border-t bg-muted/5 px-6 py-4">
              <Button onClick={handleTranslationSave} disabled={isUpdating || isCreating || isDeleting || isTranslatingLocationLoading || !size(activeLanguages)}>Tarjimalarni saqlash</Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
      <DeleteAlert
        location={locationToDelete}
        open={Boolean(locationToDelete)}
        onOpenChange={(open) => { if (!open) setLocationToDelete(null); }}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default LocationsIndex;
