import React from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
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
  Trash2Icon,
} from "lucide-react";

const emptyForm = {
  name: "",
  isActive: true,
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
  if (isArray(message)) {
    return join(message, ", ");
  }
  return message || fallback;
};

const createFormFromItem = (item, language) => ({
  name: resolveLabel(
    get(item, "translations"),
    get(item, "name", ""),
    language,
  ),
  isActive: get(item, "isActive", true),
});

const LocalizedCatalogManager = ({
  route,
  breadcrumbTitle,
  title,
  description,
  singularLabel,
  pluralSearchPlaceholder,
  items = [],
  createItem,
  updateItem,
  deleteItem,
  reorderItems,
  isLoading,
  isCreating,
  isUpdating,
  isDeleting,
}) => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const languages = get(languagesData, "data", []);

  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(["all", "active", "inactive"]).withDefault("all"),
  );
  const [translationFilter, setTranslationFilter] = useQueryState(
    "translations",
    parseAsStringEnum(["all", "complete", "incomplete"]).withDefault("all"),
  );

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [translationsDrawerOpen, setTranslationsDrawerOpen] =
    React.useState(false);
  const [editingItem, setEditingItem] = React.useState(null);
  const [translatingItem, setTranslatingItem] = React.useState(null);
  const [itemToDelete, setItemToDelete] = React.useState(null);
  const [form, setForm] = React.useState(emptyForm);
  const [translationForm, setTranslationForm] = React.useState({});

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

  const filteredItems = React.useMemo(() => {
    const searchValue = deferredSearch.trim().toLowerCase();

    return lodashFilter(items, (item) => {
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

      if (translationFilter === "all") {
        return matchesSearch && matchesStatus;
      }

      const filledCount = countFilledTranslations(
        get(item, "translations", {}),
      );
      const isComplete =
        size(activeLanguages) > 0 && filledCount >= size(activeLanguages);

      return (
        matchesSearch &&
        matchesStatus &&
        (translationFilter === "complete" ? isComplete : !isComplete)
      );
    });
  }, [
    activeLanguages.length,
    currentLanguage,
    deferredSearch,
    items,
    statusFilter,
    translationFilter,
  ]);

  const isReorderEnabled =
    deferredSearch.trim() === "" &&
    statusFilter === "all" &&
    translationFilter === "all";

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
        label: "Tarjimalar",
        key: "translations",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha tarjimalar" },
          { value: "complete", label: "Tarjimasi to'liq" },
          { value: "incomplete", label: "Tarjimasi to'liq emas" },
        ],
      },
    ],
    [pluralSearchPlaceholder],
  );

  const activeFilters = React.useMemo(() => {
    const next = [];

    if (search.trim()) {
      next.push({
        id: "q",
        field: "q",
        operator: "contains",
        values: [search],
      });
    }

    if (statusFilter !== "all") {
      next.push({
        id: "status",
        field: "status",
        operator: "is",
        values: [statusFilter],
      });
    }

    if (translationFilter !== "all") {
      next.push({
        id: "translations",
        field: "translations",
        operator: "is",
        values: [translationFilter],
      });
    }

    return next;
  }, [search, statusFilter, translationFilter]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch = get(
        find(nextFilters, (f) => get(f, "field") === "q"),
        "values[0]",
        "",
      );
      const nextStatus = get(
        find(nextFilters, (f) => get(f, "field") === "status"),
        "values[0]",
        "all",
      );
      const nextTranslations = get(
        find(nextFilters, (f) => get(f, "field") === "translations"),
        "values[0]",
        "all",
      );

      React.startTransition(() => {
        void setSearch(nextSearch);
        void setStatusFilter(nextStatus);
        void setTranslationFilter(nextTranslations);
      });
    },
    [setSearch, setStatusFilter, setTranslationFilter],
  );

  const openCreateDrawer = React.useCallback(() => {
    setEditingItem(null);
    setForm(emptyForm);
    setDrawerOpen(true);
  }, []);

  const openEditDrawer = React.useCallback(
    (item) => {
      setEditingItem(item);
      setForm(createFormFromItem(item, currentLanguage));
      setDrawerOpen(true);
    },
    [currentLanguage],
  );

  const openTranslationsDrawer = React.useCallback(
    (item) => {
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
      setTranslationsDrawerOpen(true);
    },
    [activeLanguages],
  );

  const submitDrawer = React.useCallback(async () => {
    const trimmedName = form.name.trim();

    if (!trimmedName) {
      toast.error(`${singularLabel} nomini kiriting`);
      return;
    }

    const payload = {
      name: trimmedName,
      isActive: form.isActive,
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

      setDrawerOpen(false);
      setEditingItem(null);
      setForm(emptyForm);
    } catch (error) {
      toast.error(getErrorMessage(error, `${singularLabel}ni saqlab bo'lmadi`));
    }
  }, [
    createItem,
    currentLanguage,
    editingItem,
    form,
    singularLabel,
    updateItem,
  ]);

  const submitTranslations = React.useCallback(async () => {
    if (!translatingItem) {
      return;
    }

    try {
      await updateItem(get(translatingItem, "id"), {
        translations: cleanTranslations(translationForm),
      });
      toast.success("Tarjimalar yangilandi");
      setTranslationsDrawerOpen(false);
      setTranslatingItem(null);
      setTranslationForm({});
    } catch (error) {
      toast.error(getErrorMessage(error, "Tarjimalarni saqlab bo'lmadi"));
    }
  }, [translationForm, translatingItem, updateItem]);

  const confirmDelete = React.useCallback(async () => {
    if (!itemToDelete) {
      return;
    }

    try {
      await deleteItem(get(itemToDelete, "id"));
      toast.success(`${singularLabel} o'chirildi`);
      setItemToDelete(null);
    } catch (error) {
      toast.error(
        getErrorMessage(error, `${singularLabel}ni o'chirib bo'lmadi`),
      );
    }
  }, [deleteItem, itemToDelete, singularLabel]);

  const handleToggleStatus = React.useCallback(
    async (item, checked) => {
      try {
        await updateItem(get(item, "id"), { isActive: checked });
        toast.success("Status yangilandi");
      } catch (error) {
        toast.error(getErrorMessage(error, "Statusni saqlab bo'lmadi"));
      }
    },
    [updateItem],
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
      },
      {
        accessorKey: "name",
        header: title,
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
        accessorKey: "translations",
        header: "Tarjimalar",
        size: 160,
        cell: (info) => {
          const translations = get(info, "row.original.translations", {});

          return (
            <div className="flex items-center gap-1">
              {map(activeLanguages, (language) => (
                <div
                  key={get(language, "id")}
                  className={
                    typeof get(translations, get(language, "code")) ===
                      "string" && trim(get(translations, get(language, "code")))
                      ? "flex size-5 items-center justify-center rounded border border-primary/30 bg-primary/10 text-[10px] text-primary"
                      : "flex size-5 items-center justify-center rounded border border-transparent bg-muted text-[10px] opacity-40"
                  }
                >
                  {get(language, "flag")}
                </div>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        size: 100,
        cell: (info) => (
          <div className="flex justify-center">
            <Switch
              checked={Boolean(info.getValue())}
              onCheckedChange={(checked) =>
                void handleToggleStatus(get(info, "row.original"), checked)
              }
            />
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: (info) => (
          <div className="flex justify-end">
            <CatalogItemActionsMenu
              item={get(info, "row.original")}
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
      currentLanguage,
      handleToggleStatus,
      isReorderEnabled,
      openEditDrawer,
      openTranslationsDrawer,
      title,
    ],
  );

  const table = useReactTable({
    data: filteredItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => toString(get(row, "id")),
  });

  const handleDragEnd = React.useCallback(
    async ({ active, over }) => {
      if (!over || active.id === over.id || !isReorderEnabled) {
        return;
      }

      const dataIds = map(filteredItems, (item) => toString(get(item, "id")));
      const oldIndex = dataIds.indexOf(active.id);
      const newIndex = dataIds.indexOf(over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const moved = filteredItems[oldIndex];
      const prev = filteredItems[newIndex - 1];
      const next = filteredItems[newIndex + 1];

      const prevId = newIndex > oldIndex ? over.id : prev?.id;
      const nextId = newIndex > oldIndex ? next?.id : over.id;

      try {
        await reorderItems({
          movedId: get(moved, "id"),
          prevId: prevId ? Number(prevId) : undefined,
          nextId: nextId ? Number(nextId) : undefined,
        });
        toast.success("Tartib yangilandi");
      } catch (error) {
        toast.error(getErrorMessage(error, "Tartibni saqlab bo'lmadi"));
      }
    },
    [filteredItems, isReorderEnabled, reorderItems],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button onClick={openCreateDrawer} className="gap-2 self-start">
          <PlusIcon />
          Yangi {singularLabel}
        </Button>
      </div>

      <Filters
        fields={filterFields}
        filters={activeFilters}
        onChange={handleFiltersChange}
      />

      <DataGridContainer>
        <ScrollArea className="w-full">
          <DataGrid
            table={table}
            isLoading={isLoading}
            recordCount={filteredItems.length}
          >
            {isReorderEnabled ? (
              <DataGridTableDndRows
                table={table}
                dataIds={map(filteredItems, (item) =>
                  toString(get(item, "id")),
                )}
                handleDragEnd={handleDragEnd}
              />
            ) : (
              <DataGridTable />
            )}
          </DataGrid>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DataGridContainer>

      <Drawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) {
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
          </DrawerBody>

          <DrawerFooter>
            <Button
              onClick={() => void submitDrawer()}
              disabled={isCreating || isUpdating}
              className="gap-2"
            >
              {isCreating || isUpdating ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <CheckCircle2Icon />
              )}
              Saqlash
            </Button>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              Bekor qilish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={translationsDrawerOpen}
        onOpenChange={(open) => {
          setTranslationsDrawerOpen(open);
          if (!open) {
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
            {map(activeLanguages, (language) => (
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
            ))}
          </DrawerBody>

          <DrawerFooter>
            <Button
              onClick={() => void submitTranslations()}
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
              variant="outline"
              onClick={() => setTranslationsDrawerOpen(false)}
            >
              Bekor qilish
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
