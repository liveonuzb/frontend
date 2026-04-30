import React from "react";
import { Navigate, Outlet, Route, Routes, useNavigate, useParams } from "react-router";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { get, isArray, join, map, trim } from "lodash";
import dayjs from "dayjs";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { GlobeIcon, MoreVerticalIcon, PencilIcon, PlusIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { useDeleteQuery, useGetQuery, usePatchQuery, usePostQuery } from "@/hooks/api";
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
import OptionDrawerPicker from "@/components/option-drawer-picker";
import { DataGrid, DataGridContainer, DataGridTable, DataGridTableDndRowHandle, DataGridTableDndRows } from "@/components/reui/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { Filters } from "@/components/reui/filters.jsx";
import { cn } from "@/lib/utils";
import { adminListSkeletons } from "@/modules/admin/components/admin-list-skeletons.jsx";

const QUERY_KEY = ["admin", "health-constraints"];
const ITEMS_PER_PAGE = 10;
const TEXT_OPERATORS = ["contains", "not_contains", "starts_with", "ends_with", "is", "empty", "not_empty"];
const SELECT_OPERATORS = ["is", "is_not", "empty", "not_empty"];
const SORT_FIELDS = ["orderKey", "name", "type", "genderScope", "createdAt", "isActive"];
const SORT_DIRECTIONS = ["asc", "desc"];
const TYPE_OPTIONS = [
  { value: "injury", label: "Jarohat" },
  { value: "medical_condition", label: "Kasallik" },
  { value: "mobility_limitation", label: "Harakat cheklovi" },
  { value: "preference", label: "Boshqa" },
];
const GENDER_SCOPE_OPTIONS = [
  { value: "all", label: "Hamma" },
  { value: "male", label: "Erkak" },
  { value: "female", label: "Ayol" },
];
const STATUS_OPTIONS = [
  { value: "all", label: "Barchasi" },
  { value: "active", label: "Faol" },
  { value: "inactive", label: "Nofaol" },
];
const schema = z.object({
  name: z.string().trim().min(1, "Nom kiriting"),
  description: z.string().optional(),
  key: z.string().optional(),
  type: z.enum(["injury", "medical_condition", "mobility_limitation", "preference"]),
  genderScope: z.enum(["all", "male", "female"]),
});
const translateSchema = z.object({}).catchall(
  z.object({
    name: z.string().optional(),
    description: z.string().optional(),
  }),
);
const resolveLabel = (translations, fallback, language) =>
  trim(get(translations, language, "")) ||
  trim(get(translations, "uz", "")) ||
  fallback ||
  "";
const getPayload = (response) => get(response, "data.data", get(response, "data", response));
const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  return isArray(message) ? join(message, ", ") : message || fallback;
};
const optionLabel = (options, value) =>
  get(options.find((option) => option.value === value), "label", value || "-");

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

const ListPage = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const [name, setName] = useQueryState("name", parseAsString.withDefault(""));
  const [nameOp, setNameOp] = useQueryState("nameOp", parseAsStringEnum(TEXT_OPERATORS).withDefault("contains"));
  const [status, setStatus] = useQueryState("status", parseAsStringEnum(["all", "active", "inactive"]).withDefault("all"));
  const [statusOp, setStatusOp] = useQueryState("statusOp", parseAsStringEnum(SELECT_OPERATORS).withDefault("is"));
  const [genderScope, setGenderScope] = useQueryState("genderScope", parseAsStringEnum(["all", "male", "female"]).withDefault("all"));
  const [genderScopeOp, setGenderScopeOp] = useQueryState("genderScopeOp", parseAsStringEnum(SELECT_OPERATORS).withDefault("is"));
  const [type, setType] = useQueryState("type", parseAsStringEnum(["all", "injury", "medical_condition", "mobility_limitation", "preference"]).withDefault("all"));
  const [typeOp, setTypeOp] = useQueryState("typeOp", parseAsStringEnum(SELECT_OPERATORS).withDefault("is"));
  const [translations, setTranslations] = useQueryState("translations", parseAsStringEnum(["all", "complete", "missing"]).withDefault("all"));
  const [translationsOp, setTranslationsOp] = useQueryState("translationsOp", parseAsStringEnum(SELECT_OPERATORS).withDefault("is"));
  const [pageQuery, setPageQuery] = useQueryState("page", parseAsString.withDefault("1"));
  const [pageSizeQuery, setPageSizeQuery] = useQueryState("pageSize", parseAsString.withDefault(String(ITEMS_PER_PAGE)));
  const [sortBy, setSortBy] = useQueryState("sortBy", parseAsStringEnum(SORT_FIELDS).withDefault("orderKey"));
  const [sortDir, setSortDir] = useQueryState("sortDir", parseAsStringEnum(SORT_DIRECTIONS).withDefault("asc"));
  const currentPage = Math.max(1, Number(pageQuery) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(pageSizeQuery) || ITEMS_PER_PAGE));
  const sorting = React.useMemo(() => (sortBy === "orderKey" && sortDir === "asc" ? [] : [{ id: sortBy, desc: sortDir === "desc" }]), [sortBy, sortDir]);
  const canReorder = trim(name) === "" && nameOp === "contains" && status === "all" && statusOp === "is" && genderScope === "all" && genderScopeOp === "is" && type === "all" && typeOp === "is" && translations === "all" && translationsOp === "is" && sortBy === "orderKey" && sortDir === "asc" && currentPage === 1;

  React.useEffect(() => {
    setBreadcrumbs([{ url: "/admin/health-constraints/list", title: "Health Constraints" }]);
  }, [setBreadcrumbs]);

  const deferredName = React.useDeferredValue(name);
  const params = React.useMemo(
    () => ({
      page: currentPage,
      pageSize,
      sortBy,
      sortDir,
      ...(trim(deferredName) ? { name: trim(deferredName) } : {}),
      ...(trim(deferredName) || nameOp !== "contains" ? { nameOp } : {}),
      ...(status !== "all" ? { status } : {}),
      ...(status !== "all" || statusOp !== "is" ? { statusOp } : {}),
      ...(genderScope !== "all" ? { genderScope } : {}),
      ...(genderScope !== "all" || genderScopeOp !== "is" ? { genderScopeOp } : {}),
      ...(type !== "all" ? { type } : {}),
      ...(type !== "all" || typeOp !== "is" ? { typeOp } : {}),
      ...(translations !== "all" ? { translations } : {}),
      ...(translations !== "all" || translationsOp !== "is" ? { translationsOp } : {}),
    }),
    [currentPage, deferredName, genderScope, genderScopeOp, nameOp, pageSize, sortBy, sortDir, status, statusOp, translations, translationsOp, type, typeOp],
  );
  const { data, isLoading, isFetching, refetch } = useGetQuery({
    url: "/admin/health-constraints",
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
        accessorKey: "name",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Nomi" />,
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.avatarText },
        cell: (info) => (
          <div className="min-w-0">
            <p className="truncate font-medium">
              {resolveLabel(info.row.original.translations, info.row.original.name, currentLanguage)}
            </p>
            <p className="truncate text-xs text-muted-foreground">{info.row.original.key}</p>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Turi" />,
        enableSorting: true,
        size: 150,
        meta: { skeleton: adminListSkeletons.text },
        cell: (info) => optionLabel(TYPE_OPTIONS, info.getValue()),
      },
      {
        accessorKey: "genderScope",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Jins" />,
        enableSorting: true,
        size: 110,
        meta: { skeleton: adminListSkeletons.badge },
        cell: (info) => <Badge variant="outline">{optionLabel(GENDER_SCOPE_OPTIONS, info.getValue())}</Badge>,
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
              const hasTranslation =
                Boolean(trim(get(info.row.original, `translations.${code}`, ""))) &&
                Boolean(trim(get(info.row.original, `descriptionTranslations.${code}`, "")));
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
              patchMutation.mutate({
                url: `/admin/health-constraints/${info.row.original.id}`,
                attributes: { isActive: checked },
              })
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
        cell: (info) => dayjs(info.getValue()).format("DD.MM.YYYY HH:mm"),
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
                  await deleteMutation.mutateAsync({ url: `/admin/health-constraints/${row.id}` });
                  toast.success("Health constraint o'chirildi");
                } catch (error) {
                  toast.error(getErrorMessage(error, "Health constraintni o'chirib bo'lmadi"));
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
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: currentPage - 1, pageSize })
          : updater;
      const nextPageSize = Number(next.pageSize) || pageSize;
      React.startTransition(() => {
        void setPageQuery(String(nextPageSize === pageSize ? Number(next.pageIndex) + 1 : 1));
        void setPageSizeQuery(String(nextPageSize));
      });
    },
    state: { sorting, pagination: { pageIndex: currentPage - 1, pageSize } },
  });
  const filterFields = React.useMemo(() => [
    { label: "Nomi", key: "name", type: "text", defaultOperator: "contains", placeholder: "Constraint qidirish" },
    { label: "Status", key: "status", type: "select", defaultOperator: "is", options: STATUS_OPTIONS },
    { label: "Jins", key: "genderScope", type: "select", defaultOperator: "is", options: [{ value: "all", label: "Barchasi" }, ...GENDER_SCOPE_OPTIONS] },
    { label: "Turi", key: "type", type: "select", defaultOperator: "is", options: [{ value: "all", label: "Barchasi" }, ...TYPE_OPTIONS] },
    { label: "Tarjimalar", key: "translations", type: "select", defaultOperator: "is", options: [{ value: "all", label: "Barchasi" }, { value: "complete", label: "To'liq" }, { value: "missing", label: "Kam" }] },
  ], []);
  const activeFilters = React.useMemo(() => {
    const list = [];
    if (trim(name) || nameOp !== "contains") list.push({ id: "name", field: "name", operator: nameOp, values: trim(name) ? [name] : [] });
    if (status !== "all" || statusOp !== "is") list.push({ id: "status", field: "status", operator: statusOp, values: status !== "all" ? [status] : [] });
    if (genderScope !== "all" || genderScopeOp !== "is") list.push({ id: "genderScope", field: "genderScope", operator: genderScopeOp, values: genderScope !== "all" ? [genderScope] : [] });
    if (type !== "all" || typeOp !== "is") list.push({ id: "type", field: "type", operator: typeOp, values: type !== "all" ? [type] : [] });
    if (translations !== "all" || translationsOp !== "is") list.push({ id: "translations", field: "translations", operator: translationsOp, values: translations !== "all" ? [translations] : [] });
    return list;
  }, [genderScope, genderScopeOp, name, nameOp, status, statusOp, translations, translationsOp, type, typeOp]);
  const handleFiltersChange = React.useCallback((next) => {
    const byField = (field) => next.find((item) => item.field === field);
    React.startTransition(() => {
      void setName(byField("name")?.values?.[0] ?? "");
      void setNameOp(byField("name")?.operator ?? "contains");
      void setStatus(byField("status")?.values?.[0] ?? "all");
      void setStatusOp(byField("status")?.operator ?? "is");
      void setGenderScope(byField("genderScope")?.values?.[0] ?? "all");
      void setGenderScopeOp(byField("genderScope")?.operator ?? "is");
      void setType(byField("type")?.values?.[0] ?? "all");
      void setTypeOp(byField("type")?.operator ?? "is");
      void setTranslations(byField("translations")?.values?.[0] ?? "all");
      void setTranslationsOp(byField("translations")?.operator ?? "is");
      void setPageQuery("1");
    });
  }, [setGenderScope, setGenderScopeOp, setName, setNameOp, setPageQuery, setStatus, setStatusOp, setTranslations, setTranslationsOp, setType, setTypeOp]);
  const handleDragEnd = async ({ active, over }) => {
    if (!canReorder || !active || !over || active.id === over.id) return;
    const ids = items.map((item) => String(item.id));
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const ordered = [...items];
    const [moved] = ordered.splice(oldIndex, 1);
    ordered.splice(newIndex, 0, moved);
    await patchMutation.mutateAsync({
      url: "/admin/health-constraints/reorder",
      attributes: {
        movedId: String(moved.id),
        prevId: ordered[newIndex - 1] ? String(ordered[newIndex - 1].id) : undefined,
        nextId: ordered[newIndex + 1] ? String(ordered[newIndex + 1].id) : undefined,
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Health Constraints</h1>
          <p className="text-sm text-muted-foreground">Onboarding va workout reja uchun sog'liq cheklovlari</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RotateCcwIcon className={cn("size-4", isFetching && "animate-spin")} />
          </Button>
          <Button onClick={() => navigate("create")}>
            <PlusIcon data-icon="inline-start" />
            Yangi constraint
          </Button>
        </div>
      </div>
      <Filters fields={filterFields} filters={activeFilters} onChange={handleFiltersChange} />
      <DataGrid table={table} isLoading={isLoading} recordCount={get(meta, "total", 0)}>
        <div className="flex flex-col gap-2.5">
          <DataGridContainer>
            <ScrollArea className="w-full">
              {canReorder ? (
                <DataGridTableDndRows
                  table={table}
                  dataIds={items.map((item) => String(item.id))}
                  handleDragEnd={handleDragEnd}
                />
              ) : (
                <DataGridTable />
              )}
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
          <DataGridPagination info="{from} - {to} / {count} ta constraint" rowsPerPageLabel="Sahifada:" sizes={[10, 25, 50, 100]} />
        </div>
      </DataGrid>
      <Outlet />
    </div>
  );
};

const FormDrawer = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const isEdit = mode === "edit";
  const { data, isLoading } = useGetQuery({
    url: `/admin/health-constraints/${id}`,
    queryProps: { queryKey: ["admin", "health-constraints", id], enabled: isEdit && Boolean(id) },
  });
  const item = getPayload(data);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      key: "",
      type: "injury",
      genderScope: "all",
    },
  });
  const postMutation = usePostQuery({ queryKey: QUERY_KEY });
  const patchMutation = usePatchQuery({ queryKey: QUERY_KEY });

  React.useEffect(() => {
    if (!item) return;
    form.reset({
      name: resolveLabel(item.translations, item.name, currentLanguage),
      description: resolveLabel(item.descriptionTranslations, item.description, currentLanguage),
      key: item.key || "",
      type: item.type || "injury",
      genderScope: item.genderScope || "all",
    });
  }, [currentLanguage, form, item]);

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      translations: { ...(item?.translations ?? {}), [currentLanguage]: values.name },
      descriptionTranslations: {
        ...(item?.descriptionTranslations ?? {}),
        [currentLanguage]: values.description || "",
      },
    };
    await (isEdit ? patchMutation : postMutation).mutateAsync({
      url: isEdit ? `/admin/health-constraints/${id}` : "/admin/health-constraints",
      attributes: payload,
    });
    toast.success(isEdit ? "Health constraint yangilandi" : "Health constraint yaratildi");
    navigate("/admin/health-constraints/list");
  };

  return (
    <Drawer open onOpenChange={(open) => !open && navigate("/admin/health-constraints/list")} direction="bottom">
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
        <DrawerHeader className="items-center text-center">
          <DrawerTitle>{isEdit ? "Constraintni tahrirlash" : "Yangi constraint"}</DrawerTitle>
          <DrawerDescription>Gender scope onboardingda ko'rinishni boshqaradi</DrawerDescription>
        </DrawerHeader>
        {isEdit && isLoading ? (
          <div className="flex min-h-72 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <>
            <DrawerBody>
              <Form {...form}>
                <form id="health-constraint-form" className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
                  <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Nomi ({currentLanguage.toUpperCase()})</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Tavsif</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="key" render={({ field }) => <FormItem><FormLabel>Key</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="Avtomatik yaratiladi" /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="type" render={({ field }) => <FormItem><FormLabel>Turi</FormLabel><FormControl><OptionDrawerPicker value={field.value} onChange={field.onChange} options={TYPE_OPTIONS} title="Constraint turi" placeholder="Tanlang" /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="genderScope" render={({ field }) => <FormItem><FormLabel>Jins bo'yicha ko'rinish</FormLabel><FormControl><OptionDrawerPicker value={field.value} onChange={field.onChange} options={GENDER_SCOPE_OPTIONS} title="Jins bo'yicha ko'rinish" placeholder="Tanlang" /></FormControl><FormMessage /></FormItem>} />
                </form>
              </Form>
            </DrawerBody>
            <DrawerFooter>
              <Button form="health-constraint-form" type="submit" disabled={postMutation.isPending || patchMutation.isPending}>
                Saqlash
              </Button>
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
  const { data, isLoading } = useGetQuery({
    url: `/admin/health-constraints/${id}`,
    queryProps: { queryKey: ["admin", "health-constraints", id], enabled: Boolean(id) },
  });
  const item = getPayload(data);
  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const languages = get(languagesData, "data.data", []).filter((language) => language.isActive);
  const form = useForm({ resolver: zodResolver(translateSchema), defaultValues: {} });
  const mutation = usePatchQuery({ queryKey: QUERY_KEY });

  React.useEffect(() => {
    if (!item) return;
    form.reset(
      Object.fromEntries(
        languages.map((language) => [
          language.code,
          {
            name: get(item, `translations.${language.code}`, ""),
            description: get(item, `descriptionTranslations.${language.code}`, ""),
          },
        ]),
      ),
    );
  }, [form, item, languagesData]);

  const onSubmit = async (values) => {
    const translations = Object.fromEntries(
      Object.entries(values).map(([language, value]) => [language, value?.name || ""]),
    );
    const descriptionTranslations = Object.fromEntries(
      Object.entries(values).map(([language, value]) => [language, value?.description || ""]),
    );
    await mutation.mutateAsync({
      url: `/admin/health-constraints/${id}`,
      attributes: {
        translations,
        descriptionTranslations,
        name: trim(Object.values(translations).find(Boolean) || item?.name || ""),
        description: trim(Object.values(descriptionTranslations).find(Boolean) || item?.description || ""),
      },
    });
    toast.success("Tarjimalar saqlandi");
    navigate("/admin/health-constraints/list");
  };

  return (
    <Drawer open onOpenChange={(open) => !open && navigate("/admin/health-constraints/list")} direction="bottom">
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
        <DrawerHeader className="items-center text-center">
          <DrawerTitle>Tarjimalar</DrawerTitle>
          <DrawerDescription>Faol tillar uchun nom va tavsif kiriting</DrawerDescription>
        </DrawerHeader>
        {isLoading ? (
          <div className="flex min-h-72 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <>
            <DrawerBody>
              <Form {...form}>
                <form id="health-constraint-translate-form" className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
                  {map(languages, (language) => (
                    <div key={language.code} className="flex flex-col gap-3 rounded-2xl border p-3">
                      <FormField control={form.control} name={`${language.code}.name`} render={({ field }) => <FormItem><FormLabel>{language.flag} {language.name} nomi</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl></FormItem>} />
                      <FormField control={form.control} name={`${language.code}.description`} render={({ field }) => <FormItem><FormLabel>Tavsif</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl></FormItem>} />
                    </div>
                  ))}
                </form>
              </Form>
            </DrawerBody>
            <DrawerFooter>
              <Button form="health-constraint-translate-form" type="submit" disabled={mutation.isPending}>
                Saqlash
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};

const HealthConstraintsIndex = () => (
  <Routes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<ListPage />}>
      <Route path="create" element={<FormDrawer mode="create" />} />
      <Route path="edit/:id" element={<FormDrawer mode="edit" />} />
      <Route path="translate/:id" element={<TranslateDrawer />} />
    </Route>
  </Routes>
);

export default HealthConstraintsIndex;
