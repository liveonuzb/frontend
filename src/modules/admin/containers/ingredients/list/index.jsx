import React from "react";
import { Outlet, useNavigate } from "react-router";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { get, isArray, map, trim } from "lodash";
import dayjs from "dayjs";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { PlusIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
  DataGridTableDndRowHandle,
  DataGridTableDndRows,
} from "@/components/reui/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { Filters } from "@/components/reui/filters.jsx";
import { useDeleteQuery, useGetQuery, usePatchQuery } from "@/hooks/api";
import { cn } from "@/lib/utils";
import { adminListSkeletons } from "@/modules/admin/components/admin-list-skeletons.jsx";
import { useBreadcrumbStore, useLanguageStore } from "@/store";

import {
  budgetTierClassName,
  budgetTierLabel,
  formatMoney,
  getErrorMessage,
  getPayload,
  ITEMS_PER_PAGE,
  QUERY_KEY,
  resolveLabel,
  SELECT_OPERATORS,
  SORT_DIRECTIONS,
  SORT_FIELDS,
  TEXT_OPERATORS,
} from "../components/utils.jsx";
import ActionsMenu from "./actions-menu.jsx";

const ListPage = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const [name, setName] = useQueryState(
    "name",
    parseAsString.withDefault(""),
  );
  const [nameOp, setNameOp] = useQueryState(
    "nameOp",
    parseAsStringEnum(TEXT_OPERATORS).withDefault("contains"),
  );
  const [status, setStatus] = useQueryState(
    "status",
    parseAsStringEnum(["all", "active", "inactive"]).withDefault("all"),
  );
  const [statusOp, setStatusOp] = useQueryState(
    "statusOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [hasImage, setHasImage] = useQueryState(
    "hasImage",
    parseAsStringEnum(["all", "yes", "no"]).withDefault("all"),
  );
  const [hasImageOp, setHasImageOp] = useQueryState(
    "hasImageOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [translations, setTranslations] = useQueryState(
    "translations",
    parseAsStringEnum(["all", "complete", "missing"]).withDefault("all"),
  );
  const [translationsOp, setTranslationsOp] = useQueryState(
    "translationsOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [pageQuery, setPageQuery] = useQueryState(
    "page",
    parseAsString.withDefault("1"),
  );
  const [pageSizeQuery, setPageSizeQuery] = useQueryState(
    "pageSize",
    parseAsString.withDefault(String(ITEMS_PER_PAGE)),
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
    Math.max(1, Number(pageSizeQuery) || ITEMS_PER_PAGE),
  );
  const sorting = React.useMemo(
    () =>
      sortBy === "orderKey" && sortDir === "asc"
        ? []
        : [{ id: sortBy, desc: sortDir === "desc" }],
    [sortBy, sortDir],
  );
  const canReorder =
    trim(name) === "" &&
    nameOp === "contains" &&
    status === "all" &&
    statusOp === "is" &&
    hasImage === "all" &&
    hasImageOp === "is" &&
    translations === "all" &&
    translationsOp === "is" &&
    sortBy === "orderKey" &&
    sortDir === "asc" &&
    currentPage === 1;

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin/ingredients/list", title: "Ingredientlar" },
    ]);
  }, [setBreadcrumbs]);

  const deferredName = React.useDeferredValue(name);
  const params = React.useMemo(
    () => ({
      ...(trim(deferredName) ? { name: trim(deferredName) } : {}),
      ...(trim(deferredName) || nameOp !== "contains" ? { nameOp } : {}),
      ...(status !== "all" ? { status } : {}),
      ...(status !== "all" || statusOp !== "is" ? { statusOp } : {}),
      ...(hasImage !== "all" ? { hasImage } : {}),
      ...(hasImage !== "all" || hasImageOp !== "is" ? { hasImageOp } : {}),
      ...(translations !== "all" ? { translations } : {}),
      ...(translations !== "all" || translationsOp !== "is"
        ? { translationsOp }
        : {}),
      page: currentPage,
      pageSize,
      sortBy,
      sortDir,
    }),
    [
      currentPage,
      deferredName,
      hasImage,
      hasImageOp,
      nameOp,
      pageSize,
      sortBy,
      sortDir,
      status,
      statusOp,
      translations,
      translationsOp,
    ],
  );
  const { data, isLoading, isFetching, refetch } = useGetQuery({
    url: "/admin/ingredients",
    params,
    queryProps: { queryKey: [...QUERY_KEY, params] },
  });
  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const items = get(data, "data.data", []);
  const meta = get(data, "data.meta", { total: 0, totalPages: 1 });
  const activeLanguages = React.useMemo(() => {
    const languages = getPayload(languagesData);
    return isArray(languages)
      ? languages.filter((language) => get(language, "isActive") !== false)
      : [];
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
        accessorKey: "imageUrl",
        header: "Rasm",
        meta: { skeleton: adminListSkeletons.image },
        size: 72,
        cell: (info) =>
          info.getValue() ? (
            <img
              src={info.getValue()}
              alt=""
              className="size-10 rounded-xl object-cover"
            />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-xl border bg-muted text-xs">
              No
            </div>
          ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Nomi" />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.avatarText },
        cell: (info) => (
          <div className="font-medium">
            {resolveLabel(
              info.row.original.translations,
              info.row.original.name,
              currentLanguage,
            )}
          </div>
        ),
      },
      {
        id: "translations",
        header: "Tarjimalar",
        enableSorting: false,
        meta: { skeleton: adminListSkeletons.translations },
        size: 120,
        cell: (info) => (
          <div className="flex items-center gap-1">
            {map(activeLanguages, (language) => {
              const code = get(language, "code");
              const hasTranslation = Boolean(
                trim(get(info.row.original, `translations.${code}`, "")),
              );
              return (
                <div
                  key={get(language, "id", code)}
                  title={`${get(language, "name", code)}: ${
                    hasTranslation ? "Bor" : "Yo'q"
                  }`}
                  className={cn(
                    "flex size-5 items-center justify-center rounded border text-[10px]",
                    hasTranslation
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-transparent bg-muted opacity-40",
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
        accessorKey: "calories",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Kaloriya" />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.text },
        size: 100,
      },
      {
        id: "macros",
        header: "Makrolar",
        meta: { skeleton: adminListSkeletons.text },
        cell: (info) => (
          <span className="text-xs text-muted-foreground">
            P {info.row.original.protein} / C {info.row.original.carbs} / F{" "}
            {info.row.original.fat}
          </span>
        ),
      },
      {
        accessorKey: "servingUnit",
        header: "Birlik",
        meta: { skeleton: adminListSkeletons.text },
        size: 80,
      },
      {
        accessorKey: "pricePer100g",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Narx / 100g" />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.text },
        size: 130,
        cell: (info) => (
          <span className="whitespace-nowrap text-sm">
            {formatMoney(info.getValue(), info.row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "budgetTier",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Budget" />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.badge },
        size: 110,
        cell: (info) =>
          info.getValue() ? (
            <Badge
              variant="outline"
              className={budgetTierClassName(info.getValue())}
            >
              {budgetTierLabel(info.getValue())}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        accessorKey: "priceUpdatedAt",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Narx sanasi" />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.text },
        size: 150,
        cell: (info) =>
          info.getValue() ? (
            <span className="whitespace-nowrap text-sm">
              {dayjs(info.getValue()).format("DD.MM.YYYY HH:mm")}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Status" />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.status },
        size: 90,
        cell: (info) => (
          <Switch
            checked={Boolean(info.getValue())}
            onCheckedChange={(checked) =>
              patchMutation.mutate({
                url: `/admin/ingredients/${info.row.original.id}`,
                attributes: { isActive: checked },
              })
            }
          />
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Yaratilgan" />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.text },
        size: 150,
        cell: (info) =>
          info.getValue() ? (
            <span className="whitespace-nowrap text-sm">
              {dayjs(info.getValue()).format("DD.MM.YYYY HH:mm")}
            </span>
          ) : (
            "-"
          ),
      },
      {
        id: "actions",
        header: "",
        meta: { skeleton: adminListSkeletons.action },
        size: 52,
        cell: (info) => (
          <div className="flex justify-end">
            <ActionsMenu
              row={info.row.original}
              onEdit={(row) => navigate(`edit/${row.id}`)}
              onTranslate={(row) => navigate(`translate/${row.id}`)}
              onPrice={(row) => navigate(`price/${row.id}`)}
              onDelete={async (row) => {
                try {
                  await deleteMutation.mutateAsync({
                    url: `/admin/ingredients/${row.id}`,
                  });
                  toast.success("Ingredient o'chirildi");
                } catch (error) {
                  toast.error(
                    getErrorMessage(
                      error,
                      "Ingredientni o'chirib bo'lmadi",
                    ),
                  );
                }
              }}
            />
          </div>
        ),
      },
    ],
    [
      activeLanguages,
      canReorder,
      currentLanguage,
      deleteMutation,
      navigate,
      patchMutation,
    ],
  );
  const filterFields = React.useMemo(
    () => [
      {
        label: "Nomi",
        key: "name",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Ingredient qidirish",
      },
      {
        label: "Status",
        key: "status",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barchasi" },
          { value: "active", label: "Faol" },
          { value: "inactive", label: "Nofaol" },
        ],
      },
      {
        label: "Rasm",
        key: "hasImage",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barchasi" },
          { value: "yes", label: "Rasmli" },
          { value: "no", label: "Rasmsiz" },
        ],
      },
      {
        label: "Tarjimalar",
        key: "translations",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barchasi" },
          { value: "complete", label: "To'liq" },
          { value: "missing", label: "Kam" },
        ],
      },
    ],
    [],
  );
  const activeFilters = React.useMemo(() => {
    const list = [];
    if (trim(name) || nameOp !== "contains") {
      list.push({
        id: "name",
        field: "name",
        operator: nameOp,
        values: trim(name) ? [name] : [],
      });
    }
    if (status !== "all" || statusOp !== "is") {
      list.push({
        id: "status",
        field: "status",
        operator: statusOp,
        values: status !== "all" ? [status] : [],
      });
    }
    if (hasImage !== "all" || hasImageOp !== "is") {
      list.push({
        id: "hasImage",
        field: "hasImage",
        operator: hasImageOp,
        values: hasImage !== "all" ? [hasImage] : [],
      });
    }
    if (translations !== "all" || translationsOp !== "is") {
      list.push({
        id: "translations",
        field: "translations",
        operator: translationsOp,
        values: translations !== "all" ? [translations] : [],
      });
    }
    return list;
  }, [
    hasImage,
    hasImageOp,
    name,
    nameOp,
    status,
    statusOp,
    translations,
    translationsOp,
  ]);
  const handleFiltersChange = React.useCallback(
    (next) => {
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
    },
    [
      setHasImage,
      setHasImageOp,
      setName,
      setNameOp,
      setPageQuery,
      setStatus,
      setStatusOp,
      setTranslations,
      setTranslationsOp,
    ],
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
        void setPageQuery(
          String(nextPageSize === pageSize ? Number(next.pageIndex) + 1 : 1),
        );
        void setPageSizeQuery(String(nextPageSize));
      });
    },
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
    await patchMutation.mutateAsync({
      url: "/admin/ingredients/reorder",
      attributes: {
        movedId: String(moved.id),
        prevId: ordered[newIndex - 1]
          ? String(ordered[newIndex - 1].id)
          : undefined,
        nextId: ordered[newIndex + 1]
          ? String(ordered[newIndex + 1].id)
          : undefined,
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ingredientlar</h1>
          <p className="text-sm text-muted-foreground">
            100g asosidagi nutrition katalog
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RotateCcwIcon
              className={cn("size-4", isFetching && "animate-spin")}
            />
          </Button>
          <Button onClick={() => navigate("create")}>
            <PlusIcon data-icon="inline-start" />
            Yangi ingredient
          </Button>
        </div>
      </div>
      <Filters
        fields={filterFields}
        filters={activeFilters}
        onChange={handleFiltersChange}
      />
      <DataGrid
        table={table}
        isLoading={isLoading}
        recordCount={get(meta, "total", 0)}
      >
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
          <DataGridPagination
            info="{from} - {to} / {count} ta ingredient"
            rowsPerPageLabel="Sahifada:"
            sizes={[10, 25, 50, 100]}
          />
        </div>
      </DataGrid>
      <Outlet />
    </div>
  );
};

export default ListPage;
