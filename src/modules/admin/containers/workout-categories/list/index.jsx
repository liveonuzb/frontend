import React from "react";
import { useNavigate, Outlet, useMatch } from "react-router";
import {
  find as lodashFind,
  filter as lodashFilter,
  get,
  isArray,
  map as lodashMap,
  trim,
  values,
} from "lodash";
import {
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
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
  DataGridTableDndRowHandle,
  DataGridTableDndRows,
} from "@/components/reui/data-grid";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminListSkeletons } from "@/modules/admin/components/admin-list-skeletons.jsx";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useCategoryFilters } from "./use-filters.js";
import { DeleteAlert } from "./delete-alert.jsx";

const resolveLabel = (translations, fallback, language) => {
  if (translations && typeof translations === "object") {
    const direct = trim(String(get(translations, language, "")));
    if (direct) return direct;

    const uz = trim(String(get(translations, "uz", "")));
    if (uz) return uz;

    const first = lodashFind(values(translations), (value) =>
      trim(String(value)),
    );
    if (first) return trim(String(first));
  }

  return fallback;
};

const CategoryWorkoutsGrid = ({ categoryId, currentLanguage }) => {
  const { data: workoutsData, isLoading, isFetching } = useGetQuery({
    url: `/admin/workout-categories/${categoryId}/workouts`,
    queryProps: {
      queryKey: ["admin", "workout-category-workouts", categoryId],
      enabled: Boolean(categoryId),
    },
  });
  const workouts = get(workoutsData, "data.data", []);

  const reorderMutation = usePatchQuery({
    queryKey: ["admin", "workout-category-workouts", categoryId],
  });
  const isUpdating = reorderMutation.isPending;

  const reorderWorkouts = React.useCallback(
    async (payload) =>
      reorderMutation.mutateAsync({
        url: `/admin/workout-categories/${categoryId}/workouts/reorder`,
        attributes: payload,
      }),
    [categoryId, reorderMutation],
  );

  const columns = React.useMemo(
    () => [
      {
        id: "dnd",
        header: "",
        cell: () => <DataGridTableDndRowHandle />,
        meta: { skeleton: adminListSkeletons.action },
        size: 32,
      },
      {
        accessorKey: "name",
        header: "Mashg'ulot",
        meta: {
          skeleton: adminListSkeletons.avatarText,
          cellClassName: "w-[32%]",
        },
        cell: (info) => {
          const workout = info.row.original;

          return (
            <div className="flex items-center gap-3">
              {workout.youtubeUrl ? (
                <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-[10px] text-red-500">
                  YT
                </div>
              ) : (
                <div className="flex size-10 items-center justify-center rounded-xl border bg-muted text-[10px] text-muted-foreground">
                  No
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {resolveLabel(
                    workout.translations,
                    workout.name,
                    currentLanguage,
                  )}
                </p>
                {workout.youtubeUrl && (
                  <p className="text-xs text-muted-foreground truncate w-40">
                    {workout.youtubeUrl}
                  </p>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        size: 96,
        meta: { skeleton: adminListSkeletons.badge },
        cell: (info) =>
          info.getValue() ? (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            >
              Faol
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-slate-500/10 text-slate-700 dark:text-slate-300"
            >
              Nofaol
            </Badge>
          ),
      },
    ],
    [currentLanguage],
  );

  const table = useReactTable({
    data: workouts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
  });

  const handleDragEnd = React.useCallback(
    async ({ active, over }) => {
      if (!active || !over || active.id === over.id) {
        return;
      }

      const dataIds = lodashMap(workouts, (workout) => String(workout.id));
      const oldIndex = dataIds.indexOf(active.id);
      const newIndex = dataIds.indexOf(over.id);

      if (oldIndex < 0 || newIndex < 0) {
        return;
      }

      const ordered = [...workouts];
      const [movedWorkout] = ordered.splice(oldIndex, 1);
      ordered.splice(newIndex, 0, movedWorkout);

      try {
        await reorderWorkouts({
          movedId: String(movedWorkout.id),
          prevId: ordered[newIndex - 1]
            ? String(ordered[newIndex - 1].id)
            : undefined,
          nextId: ordered[newIndex + 1]
            ? String(ordered[newIndex + 1].id)
            : undefined,
        });
      } catch (error) {
        const message = error?.response?.data?.message;
        toast.error(
          isArray(message)
            ? message.join(", ")
            : message || "Mashg'ulotlar tartibini saqlab bo'lmadi",
        );
      }
    },
    [workouts, reorderWorkouts],
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
        <LoaderCircleIcon className="size-4 animate-spin" />
        Kategoriya ichidagi mashg'ulotlar yuklanmoqda...
      </div>
    );
  }

  if (!workouts.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
        Bu kategoriyada hozircha mashg'ulot yo'q.
      </div>
    );
  }

  return (
    <div className="space-y-3 px-4 pb-4">
      <DataGridContainer>
        <ScrollArea className="w-full">
          <DataGrid
            table={table}
            tableLayout={{
              rowsDraggable: true,
              width: "auto",
            }}
            isLoading={isLoading}
          >
            <DataGridTableDndRows
              dataIds={lodashMap(workouts, (workout) => String(workout.id))}
              handleDragEnd={handleDragEnd}
            />
          </DataGrid>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DataGridContainer>

      {isFetching || isUpdating ? (
        <p className="text-xs text-muted-foreground">
          O'zgarishlar yangilanmoqda...
        </p>
      ) : null}
    </div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const {
    search,
    searchOperator,
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
    canReorder,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  } = useCategoryFilters();

  const CATEGORIES_QUERY_KEY = ["admin", "workout-categories"];
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
    ],
  );

  const { data: categoriesData, isLoading, isFetching, refetch } = useGetQuery({
    url: "/admin/workout-categories",
    params: queryParams,
    queryProps: { queryKey: [...CATEGORIES_QUERY_KEY, queryParams] },
  });
  const categories = get(categoriesData, "data.data", []);
  const meta = get(categoriesData, "data.meta", {
    total: 0,
    page: currentPage,
    pageSize,
    totalPages: 1,
  });

  const patchMutation = usePatchQuery({ queryKey: CATEGORIES_QUERY_KEY });
  const deleteMutation = useDeleteQuery({ queryKey: CATEGORIES_QUERY_KEY });
  const reorderMutation = usePatchQuery({ queryKey: CATEGORIES_QUERY_KEY });

  const isUpdating = patchMutation.isPending || reorderMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  const updateCategory = React.useCallback(
    async (id, payload) =>
      patchMutation.mutateAsync({
        url: `/admin/workout-categories/${id}`,
        attributes: payload,
      }),
    [patchMutation],
  );

  const deleteCategory = React.useCallback(
    async (id) =>
      deleteMutation.mutateAsync({
        url: `/admin/workout-categories/${id}`,
      }),
    [deleteMutation],
  );

  const reorderCategories = React.useCallback(
    async (payload) =>
      reorderMutation.mutateAsync({
        url: "/admin/workout-categories/reorder",
        attributes: payload,
      }),
    [reorderMutation],
  );

  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const languages = get(languagesData, "data.data", []);

  const translateMatch = useMatch(
    "/admin/workout-categories/list/translate/:id",
  );
  const translatingCategoryId = get(translateMatch, "params.id");
  const translationsDrawerOpen = Boolean(translatingCategoryId);
  const { data: translatingCategoryData, isLoading: isTranslatingLoading } =
    useGetQuery({
      url: `/admin/workout-categories/${translatingCategoryId || ""}`,
      queryProps: {
        queryKey: [
          ...CATEGORIES_QUERY_KEY,
          "detail",
          translatingCategoryId,
        ],
        enabled: Boolean(translatingCategoryId),
      },
    });
  const [translatingCategory, setTranslatingCategory] = React.useState(null);
  const [categoryToDelete, setCategoryToDelete] = React.useState(null);
  const [expanded, setExpanded] = React.useState({});
  const [translationForm, setTranslationForm] = React.useState({});

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/workout-categories", title: "Kategoriyalar" },
    ]);
  }, [setBreadcrumbs]);

  const activeLanguages = React.useMemo(
    () => lodashFilter(languages, (language) => language.isActive),
    [languages],
  );

  React.useEffect(() => {
    const category = get(translatingCategoryData, "data.data");
    if (!category) return;

    setTranslatingCategory(category);
    setTranslationForm(
      Object.fromEntries(
        lodashMap(activeLanguages, (language) => [
          language.code,
          resolveLabel(
            category?.translations,
            category?.name ?? "",
            language.code,
          ),
        ]),
      ),
    );
  }, [activeLanguages, translatingCategoryData]);

  const currentLanguageMeta = React.useMemo(
    () =>
      lodashFind(activeLanguages, (language) => language.code === currentLanguage),
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
    (category) => {
      setTranslatingCategory(category);
      setTranslationForm(
        Object.fromEntries(
          lodashMap(activeLanguages, (language) => [
            language.code,
            resolveLabel(
              category?.translations,
              category?.name ?? "",
              language.code,
            ),
          ]),
        ),
      );
      navigate(`translate/${category.id}`);
    },
    [activeLanguages, navigate],
  );

  const handleTranslationSave = React.useCallback(async () => {
    if (!translatingCategory) return;

    const localizedName = trim(String(get(translationForm, currentLanguage, "")));
    const cleanedTranslations = Object.fromEntries(
      Object.entries(translationForm || {})
        .map(([code, value]) => [code, trim(String(value ?? ""))])
        .filter(([, value]) => Boolean(value)),
    );

    try {
      await updateCategory(translatingCategory.id, {
        ...(localizedName ? { name: localizedName } : {}),
        translations: cleanedTranslations,
      });
      toast.success("Tarjimalar yangilandi");
      navigate("/admin/workout-categories/list");
      setTranslatingCategory(null);
      setTranslationForm({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Tarjimalarni saqlab bo'lmadi",
      );
    }
  }, [
    currentLanguage,
    navigate,
    translatingCategory,
    translationForm,
    updateCategory,
  ]);

  const handleDelete = React.useCallback(async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory(categoryToDelete.id);
      toast.success("Kategoriya o'chirildi");
      setExpanded((current) => {
        const next = { ...current };
        delete next[categoryToDelete.id];
        return next;
      });
      setCategoryToDelete(null);
    } catch (error) {
      const message = error?.response?.data?.message;
      const dependencySummary = error?.response?.data?.dependencySummary;
      const baseMessage = isArray(message) ? message.join(", ") : message;
      toast.error(
        [baseMessage || "Kategoriyani o'chirib bo'lmadi", dependencySummary]
          .filter(Boolean)
          .join(" "),
      );
    }
  }, [categoryToDelete, deleteCategory]);

  const handleToggleActive = React.useCallback(
    async (category) => {
      try {
        await updateCategory(category.id, {
          isActive: !category.isActive,
        });
        toast.success(
          !category.isActive
            ? "Kategoriya faol qilindi"
            : "Kategoriya nofaol qilindi",
        );
      } catch (error) {
        const message = error?.response?.data?.message;
        toast.error(
          isArray(message)
            ? message.join(", ")
            : message || "Kategoriya statusini o'zgartirib bo'lmadi",
        );
      }
    },
    [updateCategory],
  );

  const columns = useColumns({
    activeLanguages,
    currentLanguage,
    isReorderEnabled,
    isUpdating,
    handleToggleActive,
    openEditDrawer: (category) => navigate(`edit/${category.id}`),
    openTranslationsDrawer,
    setCategoryToDelete,
    CategoryWorkoutsGrid,
  });

  const table = useReactTable({
    data: categories,
    columns,
    manualPagination: true,
    manualSorting: true,
    pageCount: get(meta, "totalPages", 1),
    state: {
      expanded,
      sorting,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
    },
    onExpandedChange: setExpanded,
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
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    getRowId: (row) => String(row.id),
  });

  const handleCategoryDragEnd = React.useCallback(
    async ({ active, over }) => {
      if (!active || !over || active.id === over.id) return;
      if (!isReorderEnabled) return;

      const dataIds = lodashMap(categories, (category) => String(category.id));
      const oldIndex = dataIds.indexOf(active.id);
      const newIndex = dataIds.indexOf(over.id);

      if (oldIndex < 0 || newIndex < 0) return;

      const ordered = [...categories];
      const [movedCategory] = ordered.splice(oldIndex, 1);
      ordered.splice(newIndex, 0, movedCategory);

      try {
        await reorderCategories({
          movedId: String(movedCategory.id),
          prevId: ordered[newIndex - 1]
            ? String(ordered[newIndex - 1].id)
            : undefined,
          nextId: ordered[newIndex + 1]
            ? String(ordered[newIndex + 1].id)
            : undefined,
        });
      } catch (error) {
        const message = error?.response?.data?.message;
        toast.error(
          isArray(message)
            ? message.join(", ")
            : message || "Kategoriya tartibini saqlab bo'lmadi",
        );
      }
    },
    [categories, isReorderEnabled, reorderCategories],
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Mashg'ulot kategoriyalari
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RotateCcwIcon className={cn("size-4", isFetching && "animate-spin")} />
          </Button>
          <Button onClick={() => navigate("create")} className="gap-1.5">
            <PlusIcon className="size-4" />
            Kategoriya qo'shish
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
          {get(meta, "total", 0)} ta kategoriya
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
                dataIds={lodashMap(categories, (category) =>
                  String(category.id),
                )}
                handleDragEnd={handleCategoryDragEnd}
              />
            ) : (
              <DataGridTable />
            )}
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DataGridContainer>
        <DataGridPagination
          info="{from} - {to} / {count} ta kategoriya"
          rowsPerPageLabel="Sahifada:"
          sizes={[10, 25, 50, 100]}
        />
      </DataGrid>

      {!isLoading && !categories.length ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          Filtrlarga mos kategoriya topilmadi.
        </div>
      ) : null}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>
      ) : null}

      <Drawer
        open={translationsDrawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            navigate("/admin/workout-categories/list");
            setTranslatingCategory(null);
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
                Barcha faol tillar shu yerdan tahrirlanadi. Istasangiz joriy
                locale nomini ham shu drawerda yangilashingiz mumkin.
              </DrawerDescription>
            </DrawerHeader>

            <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4 space-y-6">
              <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
                <p className="font-medium">
                  {translatingCategory
                    ? resolveLabel(
                        translatingCategory.translations,
                        translatingCategory.name,
                        currentLanguage,
                      )
                    : "Kategoriya"}
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

              {isTranslatingLoading ? (
                <div className="flex min-h-48 items-center justify-center">
                  <LoaderCircleIcon className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : activeLanguages.length > 0 ? (
                <div className="space-y-4">
                  {lodashMap(activeLanguages, (language) => (
                    <div key={language.id} className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs font-medium">
                        <span>{language.flag}</span>
                        {language.name}
                        {language.code === currentLanguage ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                            Asosiy
                          </span>
                        ) : null}
                      </Label>
                      <div className="relative">
                        <Input
                          value={translationForm[language.code] || ""}
                          onChange={(event) =>
                            setTranslationForm((current) => ({
                              ...current,
                              [language.code]: event.target.value,
                            }))
                          }
                          placeholder={`${language.name} tilidagi tarjima`}
                          className="pr-10"
                        />
                        {translationForm[language.code] ? (
                          <CheckCircle2Icon className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-emerald-500" />
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
                  Qo'shimcha faol tillar topilmadi.
                </div>
              )}
            </div>

            <DrawerFooter className="gap-2 border-t bg-muted/5 px-6 py-4">
              <Button
                onClick={handleTranslationSave}
                disabled={
                  isUpdating ||
                  isDeleting ||
                  isTranslatingLoading ||
                  !activeLanguages.length
                }
              >
                Tarjimalarni saqlash
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      <DeleteAlert
        category={categoryToDelete}
        open={Boolean(categoryToDelete)}
        onOpenChange={(open) => {
          if (!open) setCategoryToDelete(null);
        }}
        onConfirm={handleDelete}
        currentLanguage={currentLanguage}
      />

      <Outlet />
    </div>
  );
};

export default Index;
