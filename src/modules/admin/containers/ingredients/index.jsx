import React, { useRef } from "react";
import { Navigate, Outlet, Route, Routes, useNavigate, useParams } from "react-router";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { get, isArray, join, map, startsWith, trim } from "lodash";
import dayjs from "dayjs";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { BadgeDollarSignIcon, ImageIcon, LoaderCircleIcon, MoreVerticalIcon, PencilIcon, PlusIcon, RotateCcwIcon, Trash2Icon, GlobeIcon, UploadIcon } from "lucide-react";
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
import OptionDrawerPicker from "@/components/option-drawer-picker";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DataGrid, DataGridContainer, DataGridTable, DataGridTableDndRowHandle, DataGridTableDndRows } from "@/components/reui/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { Filters } from "@/components/reui/filters.jsx";
import { NumberField, NumberFieldDecrement, NumberFieldGroup, NumberFieldIncrement, NumberFieldInput } from "@/components/reui/number-field";
import { cn } from "@/lib/utils";
import { adminListSkeletons } from "@/modules/admin/components/admin-list-skeletons.jsx";

const QUERY_KEY = ["admin", "ingredients"];
const ITEMS_PER_PAGE = 10;
const TEXT_OPERATORS = ["contains", "not_contains", "starts_with", "ends_with", "is", "empty", "not_empty"];
const SELECT_OPERATORS = ["is", "is_not", "empty", "not_empty"];
const SORT_FIELDS = ["orderKey", "name", "calories", "pricePer100g", "budgetTier", "priceUpdatedAt", "createdAt", "isActive"];
const SORT_DIRECTIONS = ["asc", "desc"];
const SERVING_UNITS = [
  { value: "g", label: "Gram" },
  { value: "ml", label: "mL" },
  { value: "dona", label: "Dona" },
  { value: "qoshiq", label: "Qoshiq" },
];
const PRICE_UNITS = [
  { value: "kg", label: "Kilogram" },
  { value: "100g", label: "100 gramm" },
  { value: "g", label: "Gramm" },
  { value: "litr", label: "Litr" },
  { value: "ml", label: "Millilitr" },
  { value: "dona", label: "Dona" },
];
const BUDGET_TIERS = [
  { value: "auto", label: "Auto" },
  { value: "cheap", label: "Arzon" },
  { value: "medium", label: "O'rtacha" },
  { value: "expensive", label: "Qimmat" },
];
const schema = z.object({
  name: z.string().trim().min(1, "Nom kiriting"),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  servingUnit: z.enum(["g", "ml", "dona", "qoshiq"]),
});
const priceSchema = z.object({
  priceAmount: z.number().min(0, "Narx 0 dan kichik bo'lmasin"),
  priceUnit: z.enum(["kg", "100g", "g", "litr", "ml", "dona"]),
  currency: z.string().trim().min(1, "Valyuta kiriting").max(8),
  budgetTier: z.enum(["auto", "cheap", "medium", "expensive"]),
});
const resolveLabel = (translations, fallback, language) =>
  trim(get(translations, language, "")) ||
  trim(get(translations, "uz", "")) ||
  fallback;
const getPayload = (response) => get(response, "data.data", get(response, "data", response));
const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  return isArray(message) ? join(message, ", ") : message || fallback;
};
const formatMoney = (value, currency = "UZS") =>
  value === null || value === undefined
    ? "-"
    : `${Number(value).toLocaleString("uz-UZ", { maximumFractionDigits: 2 })} ${currency || "UZS"}`;
const budgetTierLabel = (value) => get(BUDGET_TIERS.find((item) => item.value === value), "label", "-");
const budgetTierClassName = (value) =>
  ({
    cheap: "border-emerald-200 bg-emerald-50 text-emerald-700",
    medium: "border-amber-200 bg-amber-50 text-amber-700",
    expensive: "border-rose-200 bg-rose-50 text-rose-700",
  })[value] || "";

const NumberInput = ({ value, onChange, step = 1 }) => (
  <NumberField value={value ?? 0} onValueChange={(next) => onChange(next ?? 0)} minValue={0} step={step}>
    <NumberFieldGroup className="h-10 rounded-xl bg-background w-full">
      <NumberFieldDecrement className="px-3 rounded-s-xl" />
      <NumberFieldInput className="px-3 text-sm flex-1" />
      <NumberFieldIncrement className="px-3 rounded-e-xl" />
    </NumberFieldGroup>
  </NumberField>
);

const IngredientImagePicker = ({ value, uploadedImageId, onChange, onRemove, disabled }) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = React.useState(value || "");
  const [isUploading, setIsUploading] = React.useState(false);
  const { mutateAsync } = usePostQuery();
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview(value || "");
  }, [value]);
  React.useEffect(() => () => {
    if (startsWith(preview, "blob:")) URL.revokeObjectURL(preview);
  }, [preview]);
  const handleUpload = async (file) => {
    if (!file.type?.startsWith("image/")) {
      toast.error("Faqat rasm yuklash mumkin");
      return;
    }
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await mutateAsync({
        url: "/admin/ingredient-images",
        attributes: formData,
        config: { headers: { "Content-Type": "multipart/form-data" } },
      });
      const uploaded = getPayload(response);
      onChange?.({ imageId: get(uploaded, "id"), imageUrl: get(uploaded, "url"), previousUploadedImageId: uploadedImageId });
      setPreview(get(uploaded, "url"));
      URL.revokeObjectURL(localPreview);
    } catch (error) {
      URL.revokeObjectURL(localPreview);
      setPreview(value || "");
      toast.error(getErrorMessage(error, "Rasmni yuklab bo'lmadi"));
    } finally {
      setIsUploading(false);
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <FormLabel>Ingredient rasmi</FormLabel>
        {preview ? <Button type="button" variant="ghost" size="sm" disabled={disabled || isUploading} onClick={() => { setPreview(""); onRemove?.(); }}><Trash2Icon data-icon="inline-start" />Olib tashlash</Button> : null}
      </div>
      <button type="button" disabled={disabled || isUploading} onClick={() => inputRef.current?.click()} className="group relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-3xl border border-dashed bg-muted/30">
        {preview ? <img src={preview} alt="Ingredient rasmi" className="size-full object-cover" /> : <span className="flex flex-col items-center gap-2 text-muted-foreground">{isUploading ? <LoaderCircleIcon className="animate-spin" /> : <ImageIcon />}<span className="text-sm font-semibold">{isUploading ? "Yuklanmoqda..." : "Rasm yuklash"}</span></span>}
        {preview ? <span className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 transition group-hover:opacity-100"><UploadIcon /></span> : null}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void handleUpload(file);
        event.target.value = "";
      }} />
    </div>
  );
};

const ActionsMenu = ({ row, onEdit, onTranslate, onPrice, onDelete }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreVerticalIcon /></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => onTranslate(row)}><GlobeIcon />Tarjimalar</DropdownMenuItem>
      <DropdownMenuItem onClick={() => onPrice(row)}><BadgeDollarSignIcon />Narx</DropdownMenuItem>
      <DropdownMenuItem onClick={() => onEdit(row)}><PencilIcon />Tahrirlash</DropdownMenuItem>
      <DropdownMenuItem variant="destructive" onClick={() => onDelete(row)}><Trash2Icon />O'chirish</DropdownMenuItem>
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
  const [hasImage, setHasImage] = useQueryState("hasImage", parseAsStringEnum(["all", "yes", "no"]).withDefault("all"));
  const [hasImageOp, setHasImageOp] = useQueryState("hasImageOp", parseAsStringEnum(SELECT_OPERATORS).withDefault("is"));
  const [translations, setTranslations] = useQueryState("translations", parseAsStringEnum(["all", "complete", "missing"]).withDefault("all"));
  const [translationsOp, setTranslationsOp] = useQueryState("translationsOp", parseAsStringEnum(SELECT_OPERATORS).withDefault("is"));
  const [pageQuery, setPageQuery] = useQueryState("page", parseAsString.withDefault("1"));
  const [pageSizeQuery, setPageSizeQuery] = useQueryState("pageSize", parseAsString.withDefault(String(ITEMS_PER_PAGE)));
  const [sortBy, setSortBy] = useQueryState("sortBy", parseAsStringEnum(SORT_FIELDS).withDefault("orderKey"));
  const [sortDir, setSortDir] = useQueryState("sortDir", parseAsStringEnum(SORT_DIRECTIONS).withDefault("asc"));
  const currentPage = Math.max(1, Number(pageQuery) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(pageSizeQuery) || ITEMS_PER_PAGE));
  const sorting = React.useMemo(() => (sortBy === "orderKey" && sortDir === "asc" ? [] : [{ id: sortBy, desc: sortDir === "desc" }]), [sortBy, sortDir]);
  const canReorder = trim(name) === "" && nameOp === "contains" && status === "all" && statusOp === "is" && hasImage === "all" && hasImageOp === "is" && translations === "all" && translationsOp === "is" && sortBy === "orderKey" && sortDir === "asc" && currentPage === 1;
  React.useEffect(() => {
    setBreadcrumbs([{ url: "/admin/ingredients/list", title: "Ingredientlar" }]);
  }, [setBreadcrumbs]);
  const deferredName = React.useDeferredValue(name);
  const params = React.useMemo(() => ({
    ...(trim(deferredName) ? { name: trim(deferredName) } : {}),
    ...(trim(deferredName) || nameOp !== "contains" ? { nameOp } : {}),
    ...(status !== "all" ? { status } : {}),
    ...(status !== "all" || statusOp !== "is" ? { statusOp } : {}),
    ...(hasImage !== "all" ? { hasImage } : {}),
    ...(hasImage !== "all" || hasImageOp !== "is" ? { hasImageOp } : {}),
    ...(translations !== "all" ? { translations } : {}),
    ...(translations !== "all" || translationsOp !== "is" ? { translationsOp } : {}),
    page: currentPage,
    pageSize,
    sortBy,
    sortDir,
  }), [currentPage, deferredName, hasImage, hasImageOp, nameOp, pageSize, sortBy, sortDir, status, statusOp, translations, translationsOp]);
  const { data, isLoading, isFetching, refetch } = useGetQuery({ url: "/admin/ingredients", params, queryProps: { queryKey: [...QUERY_KEY, params] } });
  const { data: languagesData } = useGetQuery({ url: "/admin/languages", queryProps: { queryKey: ["admin", "languages"] } });
  const items = get(data, "data.data", []);
  const meta = get(data, "data.meta", { total: 0, totalPages: 1 });
  const activeLanguages = React.useMemo(() => {
    const languages = getPayload(languagesData);
    return isArray(languages) ? languages.filter((language) => get(language, "isActive") !== false) : [];
  }, [languagesData]);
  const patchMutation = usePatchQuery({ queryKey: QUERY_KEY });
  const deleteMutation = useDeleteQuery({ queryKey: QUERY_KEY });
  const columns = React.useMemo(() => [
    { id: "dnd", header: "", cell: () => (canReorder ? <DataGridTableDndRowHandle /> : null), meta: { skeleton: adminListSkeletons.action }, size: 36 },
    { accessorKey: "imageUrl", header: "Rasm", meta: { skeleton: adminListSkeletons.image }, size: 72, cell: (info) => info.getValue() ? <img src={info.getValue()} alt="" className="size-10 rounded-xl object-cover" /> : <div className="flex size-10 items-center justify-center rounded-xl border bg-muted text-xs">No</div> },
    { accessorKey: "name", header: ({ column }) => <DataGridColumnHeader column={column} title="Nomi" />, enableSorting: true, meta: { skeleton: adminListSkeletons.avatarText }, cell: (info) => <div className="font-medium">{resolveLabel(info.row.original.translations, info.row.original.name, currentLanguage)}</div> },
    { id: "translations", header: "Tarjimalar", enableSorting: false, meta: { skeleton: adminListSkeletons.translations }, size: 120, cell: (info) => <div className="flex items-center gap-1">{map(activeLanguages, (language) => { const code = get(language, "code"); const hasTranslation = Boolean(trim(get(info.row.original, `translations.${code}`, ""))); return <div key={get(language, "id", code)} title={`${get(language, "name", code)}: ${hasTranslation ? "Bor" : "Yo'q"}`} className={cn("flex size-5 items-center justify-center rounded border text-[10px]", hasTranslation ? "border-primary/30 bg-primary/10 text-primary" : "border-transparent bg-muted opacity-40")}>{get(language, "flag") || code}</div>; })}</div> },
    { accessorKey: "calories", header: ({ column }) => <DataGridColumnHeader column={column} title="Kaloriya" />, enableSorting: true, meta: { skeleton: adminListSkeletons.text }, size: 100 },
    { id: "macros", header: "Makrolar", meta: { skeleton: adminListSkeletons.text }, cell: (info) => <span className="text-xs text-muted-foreground">P {info.row.original.protein} / C {info.row.original.carbs} / F {info.row.original.fat}</span> },
    { accessorKey: "servingUnit", header: "Birlik", meta: { skeleton: adminListSkeletons.text }, size: 80 },
    { accessorKey: "pricePer100g", header: ({ column }) => <DataGridColumnHeader column={column} title="Narx / 100g" />, enableSorting: true, meta: { skeleton: adminListSkeletons.text }, size: 130, cell: (info) => <span className="whitespace-nowrap text-sm">{formatMoney(info.getValue(), info.row.original.currency)}</span> },
    { accessorKey: "budgetTier", header: ({ column }) => <DataGridColumnHeader column={column} title="Budget" />, enableSorting: true, meta: { skeleton: adminListSkeletons.badge }, size: 110, cell: (info) => info.getValue() ? <Badge variant="outline" className={budgetTierClassName(info.getValue())}>{budgetTierLabel(info.getValue())}</Badge> : <span className="text-muted-foreground">-</span> },
    { accessorKey: "priceUpdatedAt", header: ({ column }) => <DataGridColumnHeader column={column} title="Narx sanasi" />, enableSorting: true, meta: { skeleton: adminListSkeletons.text }, size: 150, cell: (info) => info.getValue() ? <span className="whitespace-nowrap text-sm">{dayjs(info.getValue()).format("DD.MM.YYYY HH:mm")}</span> : <span className="text-muted-foreground">-</span> },
    { accessorKey: "isActive", header: ({ column }) => <DataGridColumnHeader column={column} title="Status" />, enableSorting: true, meta: { skeleton: adminListSkeletons.status }, size: 90, cell: (info) => <Switch checked={Boolean(info.getValue())} onCheckedChange={(checked) => patchMutation.mutate({ url: `/admin/ingredients/${info.row.original.id}`, attributes: { isActive: checked } })} /> },
    { accessorKey: "createdAt", header: ({ column }) => <DataGridColumnHeader column={column} title="Yaratilgan" />, enableSorting: true, meta: { skeleton: adminListSkeletons.text }, size: 150, cell: (info) => info.getValue() ? <span className="whitespace-nowrap text-sm">{dayjs(info.getValue()).format("DD.MM.YYYY HH:mm")}</span> : "-" },
    { id: "actions", header: "", meta: { skeleton: adminListSkeletons.action }, size: 52, cell: (info) => <div className="flex justify-end"><ActionsMenu row={info.row.original} onEdit={(row) => navigate(`edit/${row.id}`)} onTranslate={(row) => navigate(`translate/${row.id}`)} onPrice={(row) => navigate(`price/${row.id}`)} onDelete={async (row) => { try { await deleteMutation.mutateAsync({ url: `/admin/ingredients/${row.id}` }); toast.success("Ingredient o'chirildi"); } catch (error) { toast.error(getErrorMessage(error, "Ingredientni o'chirib bo'lmadi")); } }} /></div> },
  ], [activeLanguages, canReorder, currentLanguage, deleteMutation, navigate, patchMutation]);
  const filterFields = React.useMemo(() => [
    { label: "Nomi", key: "name", type: "text", defaultOperator: "contains", placeholder: "Ingredient qidirish" },
    { label: "Status", key: "status", type: "select", defaultOperator: "is", options: [{ value: "all", label: "Barchasi" }, { value: "active", label: "Faol" }, { value: "inactive", label: "Nofaol" }] },
    { label: "Rasm", key: "hasImage", type: "select", defaultOperator: "is", options: [{ value: "all", label: "Barchasi" }, { value: "yes", label: "Rasmli" }, { value: "no", label: "Rasmsiz" }] },
    { label: "Tarjimalar", key: "translations", type: "select", defaultOperator: "is", options: [{ value: "all", label: "Barchasi" }, { value: "complete", label: "To'liq" }, { value: "missing", label: "Kam" }] },
  ], []);
  const activeFilters = React.useMemo(() => {
    const list = [];
    if (trim(name) || nameOp !== "contains") list.push({ id: "name", field: "name", operator: nameOp, values: trim(name) ? [name] : [] });
    if (status !== "all" || statusOp !== "is") list.push({ id: "status", field: "status", operator: statusOp, values: status !== "all" ? [status] : [] });
    if (hasImage !== "all" || hasImageOp !== "is") list.push({ id: "hasImage", field: "hasImage", operator: hasImageOp, values: hasImage !== "all" ? [hasImage] : [] });
    if (translations !== "all" || translationsOp !== "is") list.push({ id: "translations", field: "translations", operator: translationsOp, values: translations !== "all" ? [translations] : [] });
    return list;
  }, [hasImage, hasImageOp, name, nameOp, status, statusOp, translations, translationsOp]);
  const handleFiltersChange = React.useCallback((next) => {
    const byField = (field) => next.find((item) => item.field === field);
    React.startTransition(() => {
      void setName(byField("name")?.values?.[0] ?? "");
      void setNameOp(byField("name")?.operator ?? "contains");
      void setStatus(byField("status")?.values?.[0] ?? "all");
      void setStatusOp(byField("status")?.operator ?? "is");
      void setHasImage(byField("hasImage")?.values?.[0] ?? "all");
      void setHasImageOp(byField("hasImage")?.operator ?? "is");
      void setTranslations(byField("translations")?.values?.[0] ?? "all");
      void setTranslationsOp(byField("translations")?.operator ?? "is");
      void setPageQuery("1");
    });
  }, [setHasImage, setHasImageOp, setName, setNameOp, setPageQuery, setStatus, setStatusOp, setTranslations, setTranslationsOp]);
  const table = useReactTable({
    data: items,
    columns,
    manualPagination: true,
    manualSorting: true,
    pageCount: get(meta, "totalPages", 1),
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
    onSortingChange: (updater) => { const next = typeof updater === "function" ? updater(sorting) : updater; const nextSort = next?.[0]; React.startTransition(() => { void setPageQuery("1"); if (!nextSort) { void setSortBy("orderKey"); void setSortDir("asc"); return; } void setSortBy(nextSort.id); void setSortDir(nextSort.desc ? "desc" : "asc"); }); },
    onPaginationChange: (updater) => { const next = typeof updater === "function" ? updater({ pageIndex: currentPage - 1, pageSize }) : updater; const nextPageSize = Number(next.pageSize) || pageSize; React.startTransition(() => { void setPageQuery(String(nextPageSize === pageSize ? Number(next.pageIndex) + 1 : 1)); void setPageSizeQuery(String(nextPageSize)); }); },
    state: { sorting, pagination: { pageIndex: currentPage - 1, pageSize } },
  });
  const handleDragEnd = async ({ active, over }) => {
    if (!canReorder || !active || !over || active.id === over.id) return;
    const ids = items.map((item) => String(item.id));
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    const ordered = [...items];
    const [moved] = ordered.splice(oldIndex, 1);
    ordered.splice(newIndex, 0, moved);
    await patchMutation.mutateAsync({ url: "/admin/ingredients/reorder", attributes: { movedId: String(moved.id), prevId: ordered[newIndex - 1] ? String(ordered[newIndex - 1].id) : undefined, nextId: ordered[newIndex + 1] ? String(ordered[newIndex + 1].id) : undefined } });
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Ingredientlar</h1><p className="text-sm text-muted-foreground">100g asosidagi nutrition katalog</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RotateCcwIcon className={cn("size-4", isFetching && "animate-spin")} />
          </Button>
          <Button onClick={() => navigate("create")}><PlusIcon data-icon="inline-start" />Yangi ingredient</Button>
        </div>
      </div>
      <Filters fields={filterFields} filters={activeFilters} onChange={handleFiltersChange} />
      <DataGrid table={table} isLoading={isLoading} recordCount={get(meta, "total", 0)}>
        <div className="flex flex-col gap-2.5">
          <DataGridContainer><ScrollArea className="w-full">{canReorder ? <DataGridTableDndRows table={table} dataIds={items.map((item) => String(item.id))} handleDragEnd={handleDragEnd} /> : <DataGridTable />}<ScrollBar orientation="horizontal" /></ScrollArea></DataGridContainer>
          <DataGridPagination info="{from} - {to} / {count} ta ingredient" rowsPerPageLabel="Sahifada:" sizes={[10, 25, 50, 100]} />
        </div>
      </DataGrid>
      <Outlet />
    </div>
  );
};

const IngredientFormDrawer = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const isEdit = mode === "edit";
  const { data, isLoading } = useGetQuery({ url: `/admin/ingredients/${id}`, queryProps: { queryKey: ["admin", "ingredients", id], enabled: isEdit && Boolean(id) } });
  const item = getPayload(data);
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { name: "", calories: 0, protein: 0, carbs: 0, fat: 0, servingUnit: "g" } });
  const postMutation = usePostQuery({ queryKey: QUERY_KEY });
  const patchMutation = usePatchQuery({ queryKey: QUERY_KEY });
  const deleteImageMutation = useDeleteQuery();
  const [uploadedImageId, setUploadedImageId] = React.useState(null);
  const [imagePreview, setImagePreview] = React.useState(null);
  const [removeImage, setRemoveImage] = React.useState(false);
  React.useEffect(() => {
    if (item) {
      form.reset({ name: resolveLabel(item.translations, item.name, currentLanguage), calories: Number(item.calories) || 0, protein: Number(item.protein) || 0, carbs: Number(item.carbs) || 0, fat: Number(item.fat) || 0, servingUnit: item.servingUnit || "g" });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImagePreview(item.imageUrl || null);
    }
  }, [currentLanguage, form, item]);
  const cleanupImage = React.useCallback(async (imageId) => {
    if (!imageId) return;
    await deleteImageMutation.mutateAsync({ url: `/admin/ingredient-images/${imageId}` }).catch(() => {});
  }, [deleteImageMutation]);
  const onSubmit = async (values) => {
    const payload = { ...values, translations: { ...(item?.translations ?? {}), [currentLanguage]: values.name }, ...(uploadedImageId ? { imageId: uploadedImageId } : {}), ...(removeImage ? { removeImage: true } : {}) };
    const mutation = isEdit ? patchMutation : postMutation;
    await mutation.mutateAsync({ url: isEdit ? `/admin/ingredients/${id}` : "/admin/ingredients", attributes: payload });
    toast.success(isEdit ? "Ingredient yangilandi" : "Ingredient yaratildi");
    navigate("/admin/ingredients/list");
  };
  return (
    <Drawer open onOpenChange={(open) => { if (!open) { void cleanupImage(uploadedImageId); navigate("/admin/ingredients/list"); } }} direction="bottom">
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
        <DrawerHeader className="items-center text-center"><DrawerTitle>{isEdit ? "Ingredientni tahrirlash" : "Yangi ingredient"}</DrawerTitle><DrawerDescription>Nutrition qiymatlari 100g uchun kiritiladi</DrawerDescription></DrawerHeader>
        {isEdit && isLoading ? <div className="flex min-h-72 items-center justify-center"><Spinner /></div> : (
          <>
            <DrawerBody>
              <Form {...form}>
                <form id="ingredient-form" className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
                  <IngredientImagePicker value={imagePreview} uploadedImageId={uploadedImageId} onChange={({ imageId, imageUrl, previousUploadedImageId }) => { setUploadedImageId(imageId); setImagePreview(imageUrl); setRemoveImage(false); if (previousUploadedImageId) void cleanupImage(previousUploadedImageId); }} onRemove={() => { setImagePreview(null); setRemoveImage(Boolean(item?.imageUrl)); if (uploadedImageId) void cleanupImage(uploadedImageId); setUploadedImageId(null); }} />
                  <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Nomi ({currentLanguage.toUpperCase()})</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                  {["calories", "protein", "carbs", "fat"].map((name) => <FormField key={name} control={form.control} name={name} render={({ field }) => <FormItem><FormLabel>{name}</FormLabel><FormControl><NumberInput value={field.value} onChange={field.onChange} step={name === "calories" ? 1 : 0.1} /></FormControl><FormMessage /></FormItem>} />)}
                  <FormField control={form.control} name="servingUnit" render={({ field }) => <FormItem><FormLabel>O'lchov birligi</FormLabel><FormControl><OptionDrawerPicker value={field.value} onChange={field.onChange} options={SERVING_UNITS} title="O'lchov birligi" placeholder="Tanlang" /></FormControl><FormMessage /></FormItem>} />
                </form>
              </Form>
            </DrawerBody>
            <DrawerFooter><Button form="ingredient-form" type="submit" disabled={postMutation.isPending || patchMutation.isPending}>Saqlash</Button></DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};

const PriceDrawer = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, isLoading } = useGetQuery({ url: `/admin/ingredients/${id}`, queryProps: { queryKey: ["admin", "ingredients", id], enabled: Boolean(id) } });
  const item = getPayload(data);
  const form = useForm({
    resolver: zodResolver(priceSchema),
    defaultValues: { priceAmount: 0, priceUnit: "kg", currency: "UZS", budgetTier: "auto" },
  });
  const mutation = usePatchQuery({ queryKey: QUERY_KEY });
  React.useEffect(() => {
    if (!item) return;
    form.reset({
      priceAmount: Number(item.priceAmount) || 0,
      priceUnit: PRICE_UNITS.some((unit) => unit.value === item.priceUnit) ? item.priceUnit : "kg",
      currency: item.currency || "UZS",
      budgetTier: item.budgetTier || "auto",
    });
  }, [form, item]);
  const onSubmit = async (values) => {
    await mutation.mutateAsync({
      url: `/admin/ingredients/${id}/price`,
      attributes: values,
    });
    toast.success("Ingredient narxi saqlandi");
    navigate("/admin/ingredients/list");
  };
  const amount = form.watch("priceAmount");
  const unit = form.watch("priceUnit");
  const previewPer100g = React.useMemo(() => {
    if (unit === "dona") return null;
    if (unit === "kg" || unit === "litr") return amount / 10;
    if (unit === "100g") return amount;
    return amount * 100;
  }, [amount, unit]);
  return (
    <Drawer open onOpenChange={(open) => !open && navigate("/admin/ingredients/list")} direction="bottom">
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
        <DrawerHeader className="items-center text-center">
          <DrawerTitle>Narx</DrawerTitle>
          <DrawerDescription>Budget hisobida 100g uchun narx ishlatiladi</DrawerDescription>
        </DrawerHeader>
        {isLoading ? <div className="flex min-h-72 items-center justify-center"><Spinner /></div> : (
          <>
            <DrawerBody>
              <Form {...form}>
                <form id="ingredient-price-form" className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
                  <FormField control={form.control} name="priceAmount" render={({ field }) => <FormItem><FormLabel>Narx</FormLabel><FormControl><NumberInput value={field.value} onChange={field.onChange} step={100} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="priceUnit" render={({ field }) => <FormItem><FormLabel>Narx birligi</FormLabel><FormControl><OptionDrawerPicker value={field.value} onChange={field.onChange} options={PRICE_UNITS} title="Narx birligi" placeholder="Tanlang" /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="currency" render={({ field }) => <FormItem><FormLabel>Valyuta</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="budgetTier" render={({ field }) => <FormItem><FormLabel>Budget turi</FormLabel><FormControl><OptionDrawerPicker value={field.value} onChange={field.onChange} options={BUDGET_TIERS} title="Budget turi" placeholder="Tanlang" /></FormControl><FormMessage /></FormItem>} />
                  <div className="rounded-2xl border bg-muted/30 p-3 text-sm">
                    <div className="text-muted-foreground">Taxminiy 100g narx</div>
                    <div className="mt-1 font-semibold">{formatMoney(previewPer100g, form.watch("currency"))}</div>
                  </div>
                </form>
              </Form>
            </DrawerBody>
            <DrawerFooter><Button form="ingredient-price-form" type="submit" disabled={mutation.isPending}>Saqlash</Button></DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};

const TranslateDrawer = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, isLoading } = useGetQuery({ url: `/admin/ingredients/${id}`, queryProps: { queryKey: ["admin", "ingredients", id], enabled: Boolean(id) } });
  const item = getPayload(data);
  const { data: languagesData } = useGetQuery({ url: "/admin/languages", queryProps: { queryKey: ["admin", "languages"] } });
  const languages = get(languagesData, "data.data", []).filter((language) => language.isActive);
  const form = useForm({ resolver: zodResolver(z.object({}).catchall(z.string().optional())), defaultValues: {} });
  React.useEffect(() => {
    if (item) form.reset(Object.fromEntries(languages.map((language) => [language.code, get(item, `translations.${language.code}`, "")])));
  }, [form, item, languagesData]);
  const mutation = usePatchQuery({ queryKey: QUERY_KEY });
  const onSubmit = async (values) => {
    await mutation.mutateAsync({ url: `/admin/ingredients/${id}`, attributes: { translations: values, name: trim(Object.values(values).find(Boolean) || item?.name || "") } });
    toast.success("Tarjimalar saqlandi");
    navigate("/admin/ingredients/list");
  };
  return (
    <Drawer open onOpenChange={(open) => !open && navigate("/admin/ingredients/list")} direction="bottom">
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
        <DrawerHeader className="items-center text-center"><DrawerTitle>Tarjimalar</DrawerTitle><DrawerDescription>Ingredient nomlarini faol tillarda kiriting</DrawerDescription></DrawerHeader>
        {isLoading ? <div className="flex min-h-72 items-center justify-center"><Spinner /></div> : (
          <>
            <DrawerBody><Form {...form}><form id="ingredient-translate-form" className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>{map(languages, (language) => <FormField key={language.code} control={form.control} name={language.code} render={({ field }) => <FormItem><FormLabel>{language.flag} {language.name}</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl></FormItem>} />)}</form></Form></DrawerBody>
            <DrawerFooter><Button form="ingredient-translate-form" type="submit" disabled={mutation.isPending}>Saqlash</Button></DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};

const IngredientsIndex = () => (
  <Routes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<ListPage />}>
      <Route path="create" element={<IngredientFormDrawer mode="create" />} />
      <Route path="edit/:id" element={<IngredientFormDrawer mode="edit" />} />
      <Route path="price/:id" element={<PriceDrawer />} />
      <Route path="translate/:id" element={<TranslateDrawer />} />
    </Route>
  </Routes>
);

export default IngredientsIndex;
