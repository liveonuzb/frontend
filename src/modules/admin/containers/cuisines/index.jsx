import React from "react";
import { Navigate, Outlet, Route, Routes, useNavigate, useParams } from "react-router";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { get, isArray, join, map, size, toString, trim } from "lodash";
import { getCoreRowModel, getExpandedRowModel, useReactTable } from "@tanstack/react-table";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ChevronDownIcon, ChevronUpIcon, GlobeIcon, LoaderCircleIcon, MoreVerticalIcon, PencilIcon, PlusIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { useGetQuery, usePostQuery, usePatchQuery, useDeleteQuery } from "@/hooks/api";
import { useBreadcrumbStore, useLanguageStore } from "@/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner.jsx";
import { Switch } from "@/components/ui/switch";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DataGrid, DataGridContainer, DataGridTable, DataGridTableDndRowHandle, DataGridTableDndRows } from "@/components/reui/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { Filters } from "@/components/reui/filters.jsx";
import { cn } from "@/lib/utils";
import { adminListSkeletons } from "@/modules/admin/components/admin-list-skeletons.jsx";

const QUERY_KEY = ["admin", "cuisines"];
const ITEMS_PER_PAGE = 10;
const TEXT_OPERATORS = ["contains", "not_contains", "starts_with", "ends_with", "is", "empty", "not_empty"];
const SELECT_OPERATORS = ["is", "is_not", "empty", "not_empty"];
const SORT_FIELDS = ["orderKey", "name", "createdAt", "isActive"];
const SORT_DIRECTIONS = ["asc", "desc"];
const schema = z.object({ name: z.string().trim().min(1, "Nom kiriting") });
const resolveLabel = (translations, fallback, language) =>
  trim(get(translations, language, "")) ||
  trim(get(translations, "uz", "")) ||
  fallback;
const getPayload = (response) => get(response, "data.data", get(response, "data", response));
const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  return isArray(message) ? join(message, ", ") : message || fallback;
};

const ActionsMenu = ({ row, onEdit, onTranslate, onDelete }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon-sm" aria-label="Amallar">
        <MoreVerticalIcon />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => onTranslate(row)}>
        <GlobeIcon />
        Tarjimalar
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onEdit(row)}>
        <PencilIcon />
        Tahrirlash
      </DropdownMenuItem>
      <DropdownMenuItem variant="destructive" onClick={() => onDelete(row)}>
        <Trash2Icon />
        O'chirish
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const CuisineFoodsGrid = ({ cuisineId, currentLanguage }) => {
  const { data, isLoading, isFetching } = useGetQuery({
    url: `/admin/cuisines/${cuisineId}/foods`,
    queryProps: {
      queryKey: ["admin", "cuisine-foods", cuisineId],
      enabled: Boolean(cuisineId),
    },
  });
  const foods = get(data, "data.data", []);
  const reorderMutation = usePatchQuery({
    queryKey: ["admin", "cuisine-foods", cuisineId],
  });
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
        header: "Ovqat",
        meta: { skeleton: adminListSkeletons.avatarText, cellClassName: "min-w-[260px]" },
        cell: (info) => {
          const food = info.row.original;
          return (
            <div className="flex items-center gap-3">
              {food.imageUrl ? (
                <img loading="lazy" src={food.imageUrl} alt={food.name} className="size-10 rounded-xl border object-cover" />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-xl border bg-muted text-[10px] text-muted-foreground">No</div>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">{resolveLabel(food.translations, food.name, currentLanguage)}</p>
                <p className="text-xs text-muted-foreground">{food.calories} kcal</p>
              </div>
            </div>
          );
        },
      },
      {
        id: "macros",
        header: "Makrolar",
        meta: { skeleton: adminListSkeletons.text },
        cell: (info) => {
          const food = info.row.original;
          return <span className="text-xs text-muted-foreground">P {food.protein} / C {food.carbs} / F {food.fat}</span>;
        },
      },
      {
        id: "serving",
        header: "Birlik",
        size: 96,
        meta: { skeleton: adminListSkeletons.text },
        cell: (info) => <span className="text-xs text-muted-foreground">{get(info, "row.original.servingSize")} {get(info, "row.original.servingUnit")}</span>,
      },
      {
        accessorKey: "isActive",
        header: "Status",
        size: 96,
        meta: { skeleton: adminListSkeletons.badge },
        cell: (info) => info.getValue() ? <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700">Faol</Badge> : <Badge variant="outline" className="bg-slate-500/10 text-slate-700">Nofaol</Badge>,
      },
    ],
    [currentLanguage],
  );
  const table = useReactTable({
    data: foods,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => toString(row.id),
  });
  const handleDragEnd = React.useCallback(
    async ({ active, over }) => {
      if (!active || !over || active.id === over.id) return;
      const dataIds = map(foods, (food) => toString(food.id));
      const oldIndex = dataIds.indexOf(active.id);
      const newIndex = dataIds.indexOf(over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const ordered = [...foods];
      const [movedFood] = ordered.splice(oldIndex, 1);
      ordered.splice(newIndex, 0, movedFood);
      try {
        await reorderMutation.mutateAsync({
          url: `/admin/cuisines/${cuisineId}/foods/reorder`,
          attributes: {
            movedId: toString(movedFood.id),
            prevId: ordered[newIndex - 1] ? toString(ordered[newIndex - 1].id) : undefined,
            nextId: ordered[newIndex + 1] ? toString(ordered[newIndex + 1].id) : undefined,
          },
        });
      } catch (error) {
        toast.error(getErrorMessage(error, "Ovqatlar tartibini saqlab bo'lmadi"));
      }
    },
    [cuisineId, foods, reorderMutation],
  );

  if (isLoading) {
    return <div className="flex items-center gap-2 rounded-2xl border border-dashed bg-muted/20 px-4 py-4 text-sm text-muted-foreground"><LoaderCircleIcon className="animate-spin" />Oshxona ichidagi ovqatlar yuklanmoqda...</div>;
  }

  if (!size(foods)) {
    return <div className="rounded-2xl border border-dashed bg-muted/20 px-4 py-4 text-sm text-muted-foreground">Bu oshxonada hozircha ovqat yo'q.</div>;
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      <DataGridContainer>
        <ScrollArea className="w-full">
          <DataGrid table={table} tableLayout={{ rowsDraggable: true, width: "auto" }} isLoading={isLoading}>
            <DataGridTableDndRows dataIds={map(foods, (food) => toString(food.id))} handleDragEnd={handleDragEnd} />
          </DataGrid>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DataGridContainer>
      {isFetching || reorderMutation.isPending ? <p className="text-xs text-muted-foreground">O'zgarishlar yangilanmoqda...</p> : null}
    </div>
  );
};

const ListPage = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const [expanded, setExpanded] = React.useState({});
  const [name, setName] = useQueryState("name", parseAsString.withDefault(""));
  const [nameOp, setNameOp] = useQueryState("nameOp", parseAsStringEnum(TEXT_OPERATORS).withDefault("contains"));
  const [status, setStatus] = useQueryState("status", parseAsStringEnum(["all", "active", "inactive"]).withDefault("all"));
  const [statusOp, setStatusOp] = useQueryState("statusOp", parseAsStringEnum(SELECT_OPERATORS).withDefault("is"));
  const [translations, setTranslations] = useQueryState("translations", parseAsStringEnum(["all", "complete", "missing"]).withDefault("all"));
  const [translationsOp, setTranslationsOp] = useQueryState("translationsOp", parseAsStringEnum(SELECT_OPERATORS).withDefault("is"));
  const [pageQuery, setPageQuery] = useQueryState("page", parseAsString.withDefault("1"));
  const [pageSizeQuery, setPageSizeQuery] = useQueryState("pageSize", parseAsString.withDefault(String(ITEMS_PER_PAGE)));
  const [sortBy, setSortBy] = useQueryState("sortBy", parseAsStringEnum(SORT_FIELDS).withDefault("orderKey"));
  const [sortDir, setSortDir] = useQueryState("sortDir", parseAsStringEnum(SORT_DIRECTIONS).withDefault("asc"));
  const currentPage = Math.max(1, Number(pageQuery) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(pageSizeQuery) || ITEMS_PER_PAGE));
  const sorting = React.useMemo(() => (sortBy === "orderKey" && sortDir === "asc" ? [] : [{ id: sortBy, desc: sortDir === "desc" }]), [sortBy, sortDir]);
  const canReorder = trim(name) === "" && nameOp === "contains" && status === "all" && statusOp === "is" && translations === "all" && translationsOp === "is" && sortBy === "orderKey" && sortDir === "asc" && currentPage === 1;

  React.useEffect(() => {
    setBreadcrumbs([{ url: "/admin/cuisines/list", title: "Oshxonalar" }]);
  }, [setBreadcrumbs]);

  const deferredName = React.useDeferredValue(name);
  const params = React.useMemo(
    () => ({
      ...(trim(deferredName) ? { name: trim(deferredName) } : {}),
      ...(trim(deferredName) || nameOp !== "contains" ? { nameOp } : {}),
      ...(status !== "all" ? { status } : {}),
      ...(status !== "all" || statusOp !== "is" ? { statusOp } : {}),
      ...(translations !== "all" ? { translations } : {}),
      ...(translations !== "all" || translationsOp !== "is" ? { translationsOp } : {}),
      page: currentPage,
      pageSize,
      sortBy,
      sortDir,
    }),
    [currentPage, deferredName, nameOp, pageSize, sortBy, sortDir, status, statusOp, translations, translationsOp],
  );
  const { data, isLoading, isFetching, refetch } = useGetQuery({
    url: "/admin/cuisines",
    params,
    queryProps: { queryKey: [...QUERY_KEY, params] },
  });
  const { data: languagesData } = useGetQuery({ url: "/admin/languages", queryProps: { queryKey: ["admin", "languages"] } });
  const items = get(data, "data.data", []);
  const meta = get(data, "data.meta", { total: 0, totalPages: 1 });
  const activeLanguages = React.useMemo(() => {
    const languages = getPayload(languagesData);
    return isArray(languages) ? languages.filter((language) => get(language, "isActive") !== false) : [];
  }, [languagesData]);
  const patchMutation = usePatchQuery({ queryKey: QUERY_KEY });
  const deleteMutation = useDeleteQuery({ queryKey: QUERY_KEY });

  const columns = React.useMemo(
    () => [
      {
        id: "dnd",
        header: "",
        cell: () => (canReorder ? <DataGridTableDndRowHandle /> : null),
        meta: { skeleton: adminListSkeletons.action },
        size: 36,
      },
      {
        id: "expand",
        header: "",
        size: 52,
        meta: { skeleton: adminListSkeletons.action },
        cell: (info) => (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(event) => {
              event.stopPropagation();
              info.row.toggleExpanded();
            }}
          >
            {info.row.getIsExpanded() ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
          </Button>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Nomi" />,
        enableSorting: true,
        meta: {
          skeleton: adminListSkeletons.avatarText,
          expandedContent: (row) => <CuisineFoodsGrid cuisineId={row.id} currentLanguage={currentLanguage} />,
        },
        cell: (info) => (
          <div className="font-medium">
            {resolveLabel(info.row.original.translations, info.row.original.name, currentLanguage)}
          </div>
        ),
      },
      {
        accessorKey: "foodCount",
        header: "Ovqatlar",
        size: 100,
        meta: { skeleton: adminListSkeletons.text },
        cell: (info) => `${info.getValue() ?? 0} ta`,
      },
      {
        id: "translations",
        header: "Tarjimalar",
        enableSorting: false,
        size: 120,
        meta: { skeleton: adminListSkeletons.translations },
        cell: (info) => (
          <div className="flex items-center gap-1">
            {map(activeLanguages, (language) => {
              const code = get(language, "code");
              const hasTranslation = Boolean(trim(get(info.row.original, `translations.${code}`, "")));
              return (
                <div
                  key={get(language, "id", code)}
                  title={`${get(language, "name", code)}: ${hasTranslation ? "Bor" : "Yo'q"}`}
                  className={cn(
                    "flex size-5 items-center justify-center rounded border text-[10px]",
                    hasTranslation ? "border-primary/30 bg-primary/10 text-primary" : "border-transparent bg-muted opacity-40",
                  )}
                >
                  {get(language, "flag") || code}
                </div>
              );
            })}
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Status" />,
        enableSorting: true,
        size: 90,
        meta: { skeleton: adminListSkeletons.status },
        cell: (info) => (
          <Switch
            checked={Boolean(info.getValue())}
            onCheckedChange={(checked) =>
              patchMutation.mutate({ url: `/admin/cuisines/${info.row.original.id}`, attributes: { isActive: checked } })
            }
          />
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Yaratilgan" />,
        enableSorting: true,
        size: 150,
        meta: { skeleton: adminListSkeletons.text },
        cell: (info) => info.getValue() ? <span className="whitespace-nowrap text-sm">{new Intl.DateTimeFormat("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(info.getValue()))}</span> : "-",
      },
      {
        id: "actions",
        header: "",
        size: 52,
        meta: { skeleton: adminListSkeletons.action },
        cell: (info) => (
          <div className="flex justify-end">
            <ActionsMenu
              row={info.row.original}
              onEdit={(row) => navigate(`edit/${row.id}`)}
              onTranslate={(row) => navigate(`translate/${row.id}`)}
              onDelete={async (row) => {
                try {
                  await deleteMutation.mutateAsync({ url: `/admin/cuisines/${row.id}` });
                  toast.success("Oshxona o'chirildi");
                } catch (error) {
                  toast.error(getErrorMessage(error, "Oshxonani o'chirib bo'lmadi"));
                }
              }}
            />
          </div>
        ),
      },
    ],
    [activeLanguages, canReorder, currentLanguage, deleteMutation, navigate, patchMutation],
  );
  const table = useReactTable({
    data: items,
    columns,
    manualPagination: true,
    manualSorting: true,
    pageCount: get(meta, "totalPages", 1),
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const nextSort = next?.[0];
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
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater({ pageIndex: currentPage - 1, pageSize }) : updater;
      const nextPageSize = Number(next.pageSize) || pageSize;
      React.startTransition(() => {
        void setPageQuery(String(nextPageSize === pageSize ? Number(next.pageIndex) + 1 : 1));
        void setPageSizeQuery(String(nextPageSize));
      });
    },
    onExpandedChange: setExpanded,
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    state: { sorting, expanded, pagination: { pageIndex: currentPage - 1, pageSize } },
  });
  const filterFields = React.useMemo(() => [
    { label: "Nomi", key: "name", type: "text", defaultOperator: "contains", placeholder: "Oshxona qidirish" },
    { label: "Status", key: "status", type: "select", defaultOperator: "is", options: [{ value: "all", label: "Barchasi" }, { value: "active", label: "Faol" }, { value: "inactive", label: "Nofaol" }] },
    { label: "Tarjimalar", key: "translations", type: "select", defaultOperator: "is", options: [{ value: "all", label: "Barchasi" }, { value: "complete", label: "To'liq" }, { value: "missing", label: "Kam" }] },
  ], []);
  const activeFilters = React.useMemo(() => {
    const list = [];
    if (trim(name) || nameOp !== "contains") list.push({ id: "name", field: "name", operator: nameOp, values: trim(name) ? [name] : [] });
    if (status !== "all" || statusOp !== "is") list.push({ id: "status", field: "status", operator: statusOp, values: status !== "all" ? [status] : [] });
    if (translations !== "all" || translationsOp !== "is") list.push({ id: "translations", field: "translations", operator: translationsOp, values: translations !== "all" ? [translations] : [] });
    return list;
  }, [name, nameOp, status, statusOp, translations, translationsOp]);
  const handleFiltersChange = React.useCallback((next) => {
    const byField = (field) => next.find((item) => item.field === field);
    React.startTransition(() => {
      void setName(byField("name")?.values?.[0] ?? "");
      void setNameOp(byField("name")?.operator ?? "contains");
      void setStatus(byField("status")?.values?.[0] ?? "all");
      void setStatusOp(byField("status")?.operator ?? "is");
      void setTranslations(byField("translations")?.values?.[0] ?? "all");
      void setTranslationsOp(byField("translations")?.operator ?? "is");
      void setPageQuery("1");
    });
  }, [setName, setNameOp, setPageQuery, setStatus, setStatusOp, setTranslations, setTranslationsOp]);
  const handleDragEnd = async ({ active, over }) => {
    if (!canReorder || !active || !over || active.id === over.id) return;
    const ids = items.map((item) => String(item.id));
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    const ordered = [...items];
    const [moved] = ordered.splice(oldIndex, 1);
    ordered.splice(newIndex, 0, moved);
    await patchMutation.mutateAsync({
      url: "/admin/cuisines/reorder",
      attributes: {
        movedId: String(moved.id),
        prevId: ordered[newIndex - 1] ? String(ordered[newIndex - 1].id) : undefined,
        nextId: ordered[newIndex + 1] ? String(ordered[newIndex + 1].id) : undefined,
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Oshxonalar</h1>
          <p className="text-sm text-muted-foreground">O'zbek, turk, rus kabi oshxona turlarini boshqaring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RotateCcwIcon className={cn("size-4", isFetching && "animate-spin")} />
          </Button>
          <Button onClick={() => navigate("create")}>
            <PlusIcon data-icon="inline-start" />
            Yangi oshxona
          </Button>
        </div>
      </div>
      <Filters fields={filterFields} filters={activeFilters} onChange={handleFiltersChange} />
      <DataGrid table={table} isLoading={isLoading} recordCount={get(meta, "total", 0)}>
        <div className="flex flex-col gap-2.5">
          <DataGridContainer>
            <ScrollArea className="w-full">
              {canReorder ? (
                <DataGridTableDndRows table={table} dataIds={items.map((item) => String(item.id))} handleDragEnd={handleDragEnd} />
              ) : (
                <DataGridTable />
              )}
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
          <DataGridPagination info="{from} - {to} / {count} ta oshxona" rowsPerPageLabel="Sahifada:" sizes={[10, 25, 50, 100]} />
        </div>
      </DataGrid>
      <Outlet />
    </div>
  );
};

const CuisineFormDrawer = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const isEdit = mode === "edit";
  const { data, isLoading } = useGetQuery({
    url: `/admin/cuisines/${id}`,
    queryProps: { queryKey: ["admin", "cuisines", id], enabled: isEdit && Boolean(id) },
  });
  const item = getPayload(data);
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { name: "" } });
  React.useEffect(() => {
    if (item) form.reset({ name: resolveLabel(item.translations, item.name, currentLanguage) });
  }, [currentLanguage, form, item]);
  const postMutation = usePostQuery({ queryKey: QUERY_KEY });
  const patchMutation = usePatchQuery({ queryKey: QUERY_KEY });
  const mutation = isEdit ? patchMutation : postMutation;
  const onSubmit = async (values) => {
    await mutation.mutateAsync({
      url: isEdit ? `/admin/cuisines/${id}` : "/admin/cuisines",
      attributes: { name: values.name, translations: { ...(item?.translations ?? {}), [currentLanguage]: values.name } },
    });
    toast.success(isEdit ? "Oshxona yangilandi" : "Oshxona yaratildi");
    navigate("/admin/cuisines/list");
  };
  return (
    <Drawer open onOpenChange={(open) => !open && navigate("/admin/cuisines/list")} direction="bottom">
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
        <DrawerHeader className="items-center text-center">
          <DrawerTitle>{isEdit ? "Oshxonani tahrirlash" : "Yangi oshxona"}</DrawerTitle>
          <DrawerDescription>Joriy faol til uchun nom kiriting</DrawerDescription>
        </DrawerHeader>
        {isEdit && isLoading ? (
          <div className="flex min-h-72 items-center justify-center"><Spinner /></div>
        ) : (
          <>
            <DrawerBody>
              <Form {...form}>
                <form id="cuisine-form" className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomi ({currentLanguage.toUpperCase()})</FormLabel>
                      <FormControl><Input {...field} placeholder="Masalan: O'zbek oshxonasi" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </form>
              </Form>
            </DrawerBody>
            <DrawerFooter>
              <Button form="cuisine-form" type="submit" disabled={mutation.isPending}>Saqlash</Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};

const TranslateDrawer = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, isLoading } = useGetQuery({ url: `/admin/cuisines/${id}`, queryProps: { queryKey: ["admin", "cuisines", id], enabled: Boolean(id) } });
  const item = getPayload(data);
  const { data: languagesData } = useGetQuery({ url: "/admin/languages", queryProps: { queryKey: ["admin", "languages"] } });
  const languages = get(languagesData, "data.data", []).filter((language) => language.isActive);
  const form = useForm({ resolver: zodResolver(z.object({}).catchall(z.string().optional())), defaultValues: {} });
  React.useEffect(() => {
    if (item) form.reset(Object.fromEntries(languages.map((language) => [language.code, get(item, `translations.${language.code}`, "")])));
  }, [form, item, languagesData]);
  const mutation = usePatchQuery({ queryKey: QUERY_KEY });
  const onSubmit = async (values) => {
    await mutation.mutateAsync({ url: `/admin/cuisines/${id}`, attributes: { translations: values, name: trim(Object.values(values).find(Boolean) || item?.name || "") } });
    toast.success("Tarjimalar saqlandi");
    navigate("/admin/cuisines/list");
  };
  return (
    <Drawer open onOpenChange={(open) => !open && navigate("/admin/cuisines/list")} direction="bottom">
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
        <DrawerHeader className="items-center text-center">
          <DrawerTitle>Tarjimalar</DrawerTitle>
          <DrawerDescription>Oshxona nomlarini faol tillarda kiriting</DrawerDescription>
        </DrawerHeader>
        {isLoading ? <div className="flex min-h-72 items-center justify-center"><Spinner /></div> : (
          <>
            <DrawerBody>
              <Form {...form}>
                <form id="cuisine-translate-form" className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
                  {map(languages, (language) => (
                    <FormField key={language.code} control={form.control} name={language.code} render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language.flag} {language.name}</FormLabel>
                        <FormControl><Input {...field} value={field.value || ""} /></FormControl>
                      </FormItem>
                    )} />
                  ))}
                </form>
              </Form>
            </DrawerBody>
            <DrawerFooter><Button form="cuisine-translate-form" type="submit" disabled={mutation.isPending}>Saqlash</Button></DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};

const CuisinesIndex = () => (
  <Routes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<ListPage />}>
      <Route path="create" element={<CuisineFormDrawer mode="create" />} />
      <Route path="edit/:id" element={<CuisineFormDrawer mode="edit" />} />
      <Route path="translate/:id" element={<TranslateDrawer />} />
    </Route>
  </Routes>
);

export default CuisinesIndex;
