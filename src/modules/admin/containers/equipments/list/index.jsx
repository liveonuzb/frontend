import React from "react";
import { useNavigate, Outlet, useMatch } from "react-router";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  find,
  get,
  map,
  trim,
  toString,
} from "lodash";
import { useBreadcrumbStore, useLanguageStore } from "@/store";
import {
  useGetQuery,
  usePatchQuery,
  useDeleteQuery,
} from "@/hooks/api";
import {
  DataGrid,
  DataGridContainer,
  DataGridPagination,
  DataGridTable,
  DataGridTableDndRows,
} from "@/components/reui/data-grid";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import {
  CheckCircle2Icon,
  GlobeIcon,
  LoaderCircleIcon,
  PlusIcon,
  RotateCcwIcon,
  WrenchIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useEquipmentFilters } from "./use-filters.js";
import { DeleteAlert } from "./delete-alert.jsx";

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

const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  if (Array.isArray(message)) {
    return message.join(", ");
  }
  return message || fallback;
};

const cleanTranslations = (translations = {}) =>
  Object.fromEntries(
    Object.entries(translations)
      .map(([key, value]) => [key.trim(), String(value ?? "").trim()])
      .filter(([key, value]) => Boolean(key) && Boolean(value)),
  );

const Index = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const {
    search,
    searchOperator,
    statusFilter,
    statusOperator,
    imageFilter,
    imageOperator,
    translationFilter,
    translationOperator,
    sortBy,
    sortDir,
    sorting,
    currentPage,
    pageSize,
    setPageQuery,
    setPageSizeQuery,
    canReorder,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  } = useEquipmentFilters();

  const EQUIPMENTS_QUERY_KEY = ["admin", "workout-equipments"];
  const deferredSearch = React.useDeferredValue(search);
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
      ...(imageFilter !== "all" ? { hasImage: imageFilter } : {}),
      ...((imageFilter !== "all" ||
        imageOperator === "empty" ||
        imageOperator === "not_empty") &&
      imageOperator !== "is"
        ? { hasImageOp: imageOperator }
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
      imageFilter,
      imageOperator,
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

  const { data: equipmentsData, isLoading, isFetching, refetch } = useGetQuery({
    url: "/admin/workout-equipments",
    params: queryParams,
    queryProps: { queryKey: [...EQUIPMENTS_QUERY_KEY, queryParams] },
  });
  const equipments = get(equipmentsData, "data.data", []);
  const meta = get(equipmentsData, "data.meta", {
    total: 0,
    page: currentPage,
    pageSize,
    totalPages: 1,
  });

  const patchMutation = usePatchQuery({ queryKey: EQUIPMENTS_QUERY_KEY });
  const deleteMutation = useDeleteQuery({ queryKey: EQUIPMENTS_QUERY_KEY });
  const reorderMutation = usePatchQuery({ queryKey: EQUIPMENTS_QUERY_KEY });

  const isUpdating = patchMutation.isPending || reorderMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  const updateEquipment = React.useCallback(
    async (id, payload, config = {}) =>
      patchMutation.mutateAsync({
        url: `/admin/workout-equipments/${id}`,
        attributes: payload,
        config,
      }),
    [patchMutation],
  );

  const deleteEquipment = React.useCallback(
    async (id) =>
      deleteMutation.mutateAsync({
        url: `/admin/workout-equipments/${id}`,
      }),
    [deleteMutation],
  );

  const reorderEquipments = React.useCallback(
    async (payload) =>
      reorderMutation.mutateAsync({
        url: "/admin/workout-equipments/reorder",
        attributes: payload,
      }),
    [reorderMutation],
  );

  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const languages = get(languagesData, "data.data", []);

  const translateMatch = useMatch("/admin/equipments/list/translate/:id");
  const translatingEquipmentId = get(translateMatch, "params.id");
  const translationsDrawerOpen = Boolean(translatingEquipmentId);
  const { data: translatingEquipmentData, isLoading: isTranslatingLoading } =
    useGetQuery({
      url: `/admin/workout-equipments/${translatingEquipmentId || ""}`,
      queryProps: {
        queryKey: [
          ...EQUIPMENTS_QUERY_KEY,
          "detail",
          translatingEquipmentId,
        ],
        enabled: Boolean(translatingEquipmentId),
      },
    });
  const [translatingEquipment, setTranslatingEquipment] = React.useState(null);
  const [equipmentToDelete, setEquipmentToDelete] = React.useState(null);
  const [translationForm, setTranslationForm] = React.useState({});

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/equipments", title: "Jihozlar" },
    ]);
  }, [setBreadcrumbs]);

  const activeLanguages = React.useMemo(
    () => languages.filter((language) => language.isActive),
    [languages],
  );

  React.useEffect(() => {
    const equipment = get(translatingEquipmentData, "data.data");
    if (!equipment) return;

    setTranslatingEquipment(equipment);
    setTranslationForm(
      Object.fromEntries(
        activeLanguages.map((language) => [
          language.code,
          resolveLabel(
            equipment?.translations,
            equipment?.name ?? "",
            language.code,
          ),
        ]),
      ),
    );
  }, [activeLanguages, translatingEquipmentData]);

  const currentLanguageMeta = React.useMemo(
    () => activeLanguages.find((language) => language.code === currentLanguage),
    [activeLanguages, currentLanguage],
  );

  React.useEffect(() => {
    const totalPages = Math.max(1, Number(get(meta, "totalPages")) || 1);
    if (currentPage > totalPages) {
      void setPageQuery(String(totalPages));
    }
  }, [currentPage, meta, setPageQuery]);

  const isReorderEnabled = canReorder;

  const openTranslationsDrawer = React.useCallback(
    (equipment) => {
      setTranslatingEquipment(equipment);
      setTranslationForm(
        Object.fromEntries(
          activeLanguages.map((language) => [
            language.code,
            resolveLabel(
              equipment?.translations,
              equipment?.name ?? "",
              language.code,
            ),
          ]),
        ),
      );
      navigate(`translate/${equipment.id}`);
    },
    [activeLanguages, navigate],
  );

  const submitTranslations = React.useCallback(async () => {
    if (!translatingEquipment) {
      return;
    }

    try {
      await updateEquipment(translatingEquipment.id, {
        translations: cleanTranslations(translationForm),
      });
      toast.success("Tarjimalar yangilandi");
      navigate("/admin/equipments/list");
      setTranslatingEquipment(null);
      setTranslationForm({});
    } catch (error) {
      toast.error(getErrorMessage(error, "Tarjimalarni saqlab bo'lmadi"));
    }
  }, [navigate, translationForm, translatingEquipment, updateEquipment]);

  const confirmDelete = React.useCallback(async () => {
    if (!equipmentToDelete) {
      return;
    }

    try {
      await deleteEquipment(equipmentToDelete.id);
      toast.success("Jihoz o'chirildi");
      setEquipmentToDelete(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Jihozni o'chirib bo'lmadi"));
    }
  }, [deleteEquipment, equipmentToDelete]);

  const handleToggleStatus = React.useCallback(
    async (equipment, checked) => {
      try {
        await updateEquipment(equipment.id, { isActive: checked });
        toast.success("Status yangilandi");
      } catch (error) {
        toast.error(getErrorMessage(error, "Statusni saqlab bo'lmadi"));
      }
    },
    [updateEquipment],
  );

  const columns = useColumns({
    activeLanguages,
    currentLanguage,
    isReorderEnabled,
    handleToggleStatus,
    openEditDrawer: (equipment) => navigate(`edit/${equipment.id}`),
    openTranslationsDrawer,
    setEquipmentToDelete,
  });

  const table = useReactTable({
    data: equipments,
    columns,
    manualPagination: true,
    manualSorting: true,
    pageCount: get(meta, "totalPages", 1),
    getCoreRowModel: getCoreRowModel(),
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
    getRowId: (row) => String(row.id),
    state: {
      sorting,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
    },
  });

  const handleEquipmentDragEnd = React.useCallback(
    async ({ active, over }) => {
      if (!active || !over || active.id === over.id || !isReorderEnabled) {
        return;
      }

      const dataIds = equipments.map((equipment) =>
        String(equipment.id),
      );
      const oldIndex = dataIds.indexOf(active.id);
      const newIndex = dataIds.indexOf(over.id);

      if (oldIndex < 0 || newIndex < 0) {
        return;
      }

      const ordered = [...equipments];
      const [movedEquipment] = ordered.splice(oldIndex, 1);
      ordered.splice(newIndex, 0, movedEquipment);

      try {
        await reorderEquipments({
          movedId: String(movedEquipment.id),
          prevId: ordered[newIndex - 1]
            ? String(ordered[newIndex - 1].id)
            : undefined,
          nextId: ordered[newIndex + 1]
            ? String(ordered[newIndex + 1].id)
            : undefined,
        });
      } catch (error) {
        toast.error(getErrorMessage(error, "Jihoz tartibini saqlab bo'lmadi"));
      }
    },
    [equipments, isReorderEnabled, reorderEquipments],
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <WrenchIcon className="text-primary" />
          Mashg'ulot jihozlari
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RotateCcwIcon className={cn("size-4", isFetching && "animate-spin")} />
          </Button>
          <Button onClick={() => navigate("create")} className="gap-1.5">
            <PlusIcon />
            Jihoz qo'shish
          </Button>
        </div>
      </div>

      <Filter
        filterFields={filterFields}
        activeFilters={activeFilters}
        handleFiltersChange={handleFiltersChange}
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          {get(meta, "total", 0)} ta jihoz
          {currentLanguageMeta
            ? ` • ${currentLanguageMeta.flag ? `${currentLanguageMeta.flag} ` : ""}${currentLanguageMeta.name}`
            : ""}
        </p>
        {!isReorderEnabled ? (
          <p>Filter yoqilganda drag and drop o'chadi</p>
        ) : null}
      </div>

      <DataGrid
        table={table}
        isLoading={isLoading}
        recordCount={get(meta, "total", 0)}
      >
        <DataGridContainer>
          <ScrollArea className="w-full">
            {isReorderEnabled ? (
              <DataGridTableDndRows
                dataIds={map(equipments, (equipment) =>
                  toString(get(equipment, "id")),
                )}
                handleDragEnd={handleEquipmentDragEnd}
              />
            ) : (
              <DataGridTable />
            )}
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DataGridContainer>
        <DataGridPagination
          info="{from} - {to} / {count} ta jihoz"
          rowsPerPageLabel="Sahifada:"
          sizes={[10, 25, 50, 100]}
        />
      </DataGrid>

      {!isLoading && !equipments.length ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          Filtrlarga mos jihoz topilmadi.
        </div>
      ) : null}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>
      ) : null}

      <Drawer
        open={translationsDrawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            navigate("/admin/equipments/list");
            setTranslatingEquipment(null);
            setTranslationForm({});
          }
        }}
        direction="bottom"
      >
        <DrawerContent className="mx-auto max-h-[90vh] data-[vaul-drawer-direction=bottom]:md:max-w-lg">
          <div className="mx-auto flex w-full min-h-0 flex-1 flex-col">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <GlobeIcon className="size-5" />
                Tarjimalarni boshqarish
              </DrawerTitle>
              <DrawerDescription>
                {translatingEquipment
                  ? `${translatingEquipment.name} uchun barcha aktiv tillardagi nomlar`
                  : "Jihoz tarjimalari"}
              </DrawerDescription>
            </DrawerHeader>

            <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
              {isTranslatingLoading ? (
                <div className="flex min-h-48 items-center justify-center">
                  <LoaderCircleIcon className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                map(activeLanguages, (language) => (
                  <div
                    key={get(language, "code")}
                    className="flex flex-col gap-2"
                  >
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <span>{get(language, "flag", "Lang")}</span>
                      {get(language, "name")}
                    </Label>
                    <Input
                      value={get(translationForm, get(language, "code"), "")}
                      onChange={(event) =>
                        setTranslationForm((current) => ({
                          ...current,
                          [language.code]: event.target.value,
                        }))
                      }
                      placeholder={`${language.name} tilida nom`}
                    />
                  </div>
                ))
              )}
            </div>

            <DrawerFooter className="px-6 pb-6 pt-2">
              <Button
                onClick={submitTranslations}
                disabled={isUpdating || isTranslatingLoading}
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
          </div>
        </DrawerContent>
      </Drawer>

      <DeleteAlert
        equipment={equipmentToDelete}
        open={Boolean(equipmentToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setEquipmentToDelete(null);
          }
        }}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />

      <Outlet />
    </div>
  );
};

export default Index;
