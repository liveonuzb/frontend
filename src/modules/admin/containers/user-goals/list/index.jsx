import React from "react";
import { Outlet, useNavigate } from "react-router";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { get, isArray, map, trim, filter, find, toNumber } from "lodash";
import dayjs from "dayjs";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { PlusIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";

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
import { useAdminDrawerListNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";
import { useBreadcrumbStore, useLanguageStore } from "@/store";

import {
  getErrorMessage,
  getPayload,
  ITEMS_PER_PAGE,
  QUERY_KEY,
  CALCULATION_MODE_OPTIONS,
  GOAL_TYPE_OPTIONS,
  resolveLabel,
  SELECT_OPERATORS,
  SORT_DIRECTIONS,
  SORT_FIELDS,
  STATUS_OPTIONS,
  TEXT_OPERATORS,
} from "../components/utils.jsx";
import ActionsMenu from "./actions-menu.jsx";

const ListPage = () => {
  const navigate = useNavigate();
  const navigateAdminDrawer = useAdminDrawerListNavigation();
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
  const [translations, setTranslations] = useQueryState(
    "translations",
    parseAsStringEnum(["all", "complete", "missing"]).withDefault("all"),
  );
  const [translationsOp, setTranslationsOp] = useQueryState(
    "translationsOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [goalType, setGoalType] = useQueryState(
    "goalType",
    parseAsStringEnum(["all", "weight", "other"]).withDefault("all"),
  );
  const [goalTypeOp, setGoalTypeOp] = useQueryState(
    "goalTypeOp",
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
  const currentPage = Math.max(1, toNumber(pageQuery) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, toNumber(pageSizeQuery) || ITEMS_PER_PAGE),
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
    translations === "all" &&
    translationsOp === "is" &&
    goalType === "all" &&
    goalTypeOp === "is" &&
    sortBy === "orderKey" &&
    sortDir === "asc" &&
    currentPage === 1;

  React.useEffect(() => {
    setBreadcrumbs([{ url: "/admin/user-goals/list", title: "Maqsadlar" }]);
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
      ...(translations !== "all" ? { translations } : {}),
      ...(translations !== "all" || translationsOp !== "is"
        ? { translationsOp }
        : {}),
      ...(goalType !== "all" ? { goalType } : {}),
      ...(goalType !== "all" || goalTypeOp !== "is" ? { goalTypeOp } : {}),
    }),
    [
      currentPage,
      deferredName,
      nameOp,
      pageSize,
      sortBy,
      sortDir,
      status,
      statusOp,
      translations,
      translationsOp,
      goalType,
      goalTypeOp,
    ],
  );
  const { data, isLoading, isFetching, refetch } = useGetQuery({
    url: "/admin/user-goals",
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
      ? filter(languages, (language) => get(language, "isActive") !== false)
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
        enableSorting: false,
        size: 72,
        meta: { skeleton: adminListSkeletons.image },
        cell: (info) =>
          info.getValue() ? (
            <img
              src={info.getValue()}
              alt={info.row.original.name}
              className="size-11 rounded-xl object-cover"
            />
          ) : (
            <div className="size-11 rounded-xl bg-muted" />
          ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Nomi" />
        ),
        enableSorting: true,
        size: 280,
        meta: { skeleton: adminListSkeletons.avatarText },
        cell: (info) => (
          <div className="min-w-0">
            <p className="truncate font-medium">
              {resolveLabel(
                info.row.original.translations,
                info.row.original.name,
                currentLanguage,
              )}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {info.row.original.key}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "goalType",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Turi" />
        ),
        enableSorting: true,
        size: 140,
        meta: { skeleton: adminListSkeletons.text },
        cell: (info) =>
          find(GOAL_TYPE_OPTIONS, (option) => option.value === info.getValue())
            ?.label || info.getValue(),
      },
      {
        accessorKey: "calculationMode",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Hisoblash" />
        ),
        enableSorting: true,
        size: 130,
        meta: { skeleton: adminListSkeletons.text },
        cell: (info) =>
          info.row.original.goalType === "weight"
            ? find(CALCULATION_MODE_OPTIONS, (option) => option.value === info.getValue())?.label || info.getValue()
            : "-",
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
                Boolean(
                  trim(get(info.row.original, `translations.${code}`, "")),
                ) &&
                Boolean(
                  trim(
                    get(
                      info.row.original,
                      `descriptionTranslations.${code}`,
                      "",
                    ),
                  ),
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
        accessorKey: "isActive",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Status" />
        ),
        enableSorting: true,
        size: 90,
        meta: { skeleton: adminListSkeletons.status },
        cell: (info) => (
          <Switch
            checked={Boolean(info.getValue())}
            onCheckedChange={(checked) =>
              patchMutation.mutate({
                url: `/admin/user-goals/${info.row.original.id}`,
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
              onEdit={(row) => navigateAdminDrawer(`edit/${row.id}`)}
              onTranslate={(row) => navigate(`translate/${row.id}`)}
              onDelete={async (row) => {
                try {
                  await deleteMutation.mutateAsync({
                    url: `/admin/user-goals/${row.id}`,
                  });
                  toast.success("Maqsad o'chirildi");
                } catch (error) {
                  toast.error(
                    getErrorMessage(error, "Maqsadni o'chirib bo'lmadi"),
                  );
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
      const nextPageSize = toNumber(next.pageSize) || pageSize;
      React.startTransition(() => {
        void setPageQuery(
          String(nextPageSize === pageSize ? toNumber(next.pageIndex) + 1 : 1),
        );
        void setPageSizeQuery(String(nextPageSize));
      });
    },
    state: { sorting, pagination: { pageIndex: currentPage - 1, pageSize } },
  });
  const filterFields = React.useMemo(
    () => [
      {
        label: "Nomi",
        key: "name",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Maqsad qidirish",
      },
      {
        label: "Status",
        key: "status",
        type: "select",
        defaultOperator: "is",
        options: STATUS_OPTIONS,
      },
      {
        label: "Turi",
        key: "goalType",
        type: "select",
        defaultOperator: "is",
        options: [{ value: "all", label: "Barchasi" }, ...GOAL_TYPE_OPTIONS],
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
    if (goalType !== "all" || goalTypeOp !== "is") {
      list.push({
        id: "goalType",
        field: "goalType",
        operator: goalTypeOp,
        values: goalType !== "all" ? [goalType] : [],
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
    goalType,
    goalTypeOp,
    name,
    nameOp,
    status,
    statusOp,
    translations,
    translationsOp,
  ]);
  const handleFiltersChange = React.useCallback(
    (next) => {
      const byField = (field) => find(next, (item) => item.field === field);
      React.startTransition(() => {
        void setName(byField("name")?.values?.[0] ?? "");
        void setNameOp(byField("name")?.operator ?? "contains");
        void setStatus(byField("status")?.values?.[0] ?? "all");
        void setStatusOp(byField("status")?.operator ?? "is");
        void setGoalType(byField("goalType")?.values?.[0] ?? "all");
        void setGoalTypeOp(byField("goalType")?.operator ?? "is");
        void setTranslations(byField("translations")?.values?.[0] ?? "all");
        void setTranslationsOp(byField("translations")?.operator ?? "is");
        void setPageQuery("1");
      });
    },
    [
      setName,
      setNameOp,
      setPageQuery,
      setStatus,
      setStatusOp,
      setGoalType,
      setGoalTypeOp,
      setTranslations,
      setTranslationsOp,
    ],
  );
  const handleDragEnd = async ({ active, over }) => {
    if (!canReorder || !active || !over || active.id === over.id) return;
    const ids = map(items, (item) => String(item.id));
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const ordered = [...items];
    const [moved] = ordered.splice(oldIndex, 1);
    ordered.splice(newIndex, 0, moved);
    await patchMutation.mutateAsync({
      url: "/admin/user-goals/reorder",
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Maqsadlar</h1>
          <p className="text-sm text-muted-foreground">
            User onboardingda tanlanadigan asosiy maqsadlar
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
          <Button onClick={() => navigateAdminDrawer("create")}>
            <PlusIcon data-icon="inline-start" />
            Maqsad qo'shish
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
                  dataIds={map(items, (item) => String(item.id))}
                  handleDragEnd={handleDragEnd}
                />
              ) : (
                <DataGridTable />
              )}
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
          <DataGridPagination
            info="{from} - {to} / {count} ta maqsad"
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
