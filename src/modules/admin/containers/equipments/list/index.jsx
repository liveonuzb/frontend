import React from "react";
import { useNavigate, Outlet } from "react-router";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  filter as lodashFilter,
  find,
  get,
  map,
  size,
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
  WrenchIcon,
} from "lucide-react";
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
    statusFilter,
    imageFilter,
    translationFilter,
    filterFields,
    activeFilters,
    handleFiltersChange,
  } = useEquipmentFilters();

  const EQUIPMENTS_QUERY_KEY = ["admin", "workout-equipments"];

  const { data: equipmentsData, isLoading } = useGetQuery({
    url: "/admin/workout-equipments",
    queryProps: { queryKey: EQUIPMENTS_QUERY_KEY },
  });
  const equipments = get(equipmentsData, "data.data", []);

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

  const [translationsDrawerOpen, setTranslationsDrawerOpen] =
    React.useState(false);
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

  const currentLanguageMeta = React.useMemo(
    () => activeLanguages.find((language) => language.code === currentLanguage),
    [activeLanguages, currentLanguage],
  );

  const deferredSearch = React.useDeferredValue(search);

  const filteredEquipments = React.useMemo(() => {
    const searchValue = deferredSearch.trim().toLowerCase();

    return equipments.filter((equipment) => {
      const localizedName = resolveLabel(
        equipment.translations,
        equipment.name,
        currentLanguage,
      );
      const matchesSearch =
        !searchValue ||
        localizedName.toLowerCase().includes(searchValue) ||
        equipment.name.toLowerCase().includes(searchValue);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? equipment.isActive : !equipment.isActive);
      const hasImage = Boolean(equipment.imageUrl);
      const matchesImage =
        imageFilter === "all" ||
        (imageFilter === "with-image" ? hasImage : !hasImage);

      if (translationFilter === "all") {
        return matchesSearch && matchesStatus && matchesImage;
      }

      const filledCount = countFilledTranslations(equipment.translations || {});
      const isComplete =
        activeLanguages.length > 0 && filledCount >= activeLanguages.length;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesImage &&
        (translationFilter === "complete" ? isComplete : !isComplete)
      );
    });
  }, [
    activeLanguages.length,
    currentLanguage,
    deferredSearch,
    equipments,
    imageFilter,
    statusFilter,
    translationFilter,
  ]);

  const isReorderEnabled =
    deferredSearch.trim() === "" &&
    statusFilter === "all" &&
    imageFilter === "all" &&
    translationFilter === "all";

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
      setTranslationsDrawerOpen(true);
    },
    [activeLanguages],
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
      setTranslationsDrawerOpen(false);
      setTranslatingEquipment(null);
      setTranslationForm({});
    } catch (error) {
      toast.error(getErrorMessage(error, "Tarjimalarni saqlab bo'lmadi"));
    }
  }, [translationForm, translatingEquipment, updateEquipment]);

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
    data: filteredEquipments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
  });

  const handleEquipmentDragEnd = React.useCallback(
    async ({ active, over }) => {
      if (!active || !over || active.id === over.id || !isReorderEnabled) {
        return;
      }

      const dataIds = filteredEquipments.map((equipment) =>
        String(equipment.id),
      );
      const oldIndex = dataIds.indexOf(active.id);
      const newIndex = dataIds.indexOf(over.id);

      if (oldIndex < 0 || newIndex < 0) {
        return;
      }

      const ordered = [...filteredEquipments];
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
    [filteredEquipments, isReorderEnabled, reorderEquipments],
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <WrenchIcon className="text-primary" />
          Mashg'ulot jihozlari
        </h1>
        <Button onClick={() => navigate("create")} className="gap-1.5">
          <PlusIcon />
          Jihoz qo'shish
        </Button>
      </div>

      <Filter
        filterFields={filterFields}
        activeFilters={activeFilters}
        handleFiltersChange={handleFiltersChange}
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          {filteredEquipments.length} ta jihoz
          {currentLanguageMeta
            ? ` • ${currentLanguageMeta.flag ? `${currentLanguageMeta.flag} ` : ""}${currentLanguageMeta.name}`
            : ""}
        </p>
        {!isReorderEnabled ? (
          <p>Filter yoqilganda drag and drop o'chadi</p>
        ) : null}
      </div>

      <DataGridContainer>
        <ScrollArea className="w-full">
          <DataGrid
            table={table}
            tableLayout={{
              rowsDraggable: isReorderEnabled,
              width: "auto",
            }}
            loadingMode="none"
            isLoading={isLoading}
          >
            <DataGridTableDndRows
              dataIds={map(filteredEquipments, (equipment) =>
                toString(get(equipment, "id")),
              )}
              handleDragEnd={handleEquipmentDragEnd}
            />
          </DataGrid>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DataGridContainer>

      {!isLoading && !filteredEquipments.length ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          Filtrlarga mos jihoz topilmadi.
        </div>
      ) : null}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>
      ) : null}

      <Drawer
        open={translationsDrawerOpen}
        onOpenChange={setTranslationsDrawerOpen}
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
              {map(activeLanguages, (language) => (
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
              ))}
            </div>

            <DrawerFooter className="px-6 pb-6 pt-2">
              <Button
                onClick={submitTranslations}
                disabled={isUpdating}
                className="gap-2"
              >
                {isUpdating ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : (
                  <CheckCircle2Icon />
                )}
                Tarjimalarni saqlash
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTranslationsDrawerOpen(false)}
              >
                Bekor qilish
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
