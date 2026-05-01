import React from "react";
import { Outlet, useNavigate } from "react-router";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { get, isArray, map, trim } from "lodash";
import {
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  RotateCcwIcon,
} from "lucide-react";
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
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
import { useBreadcrumbStore, useLanguageStore } from "@/store";

import CuisineFoodsGrid from "../components/cuisine-foods-grid.jsx";
import {
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
  const { canManageContent } = useAdminPermissions();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const [expanded, setExpanded] = React.useState({});
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
    canManageContent &&
    trim(name) === "" &&
    nameOp === "contains" &&
    status === "all" &&
    statusOp === "is" &&
    translations === "all" &&
    translationsOp === "is" &&
    sortBy === "orderKey" &&
    sortDir === "asc" &&
    currentPage === 1;

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
    url: "/admin/cuisines",
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
            {info.row.getIsExpanded() ? (
              <ChevronUpIcon className="size-4" />
            ) : (
              <ChevronDownIcon className="size-4" />
            )}
          </Button>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Nomi" />
        ),
        enableSorting: true,
        meta: {
          skeleton: adminListSkeletons.avatarText,
          expandedContent: (row) => (
            <CuisineFoodsGrid
              canManage={canManageContent}
              cuisineId={row.id}
              currentLanguage={currentLanguage}
            />
          ),
        },
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
            disabled={!canManageContent}
            onCheckedChange={(checked) =>
              patchMutation.mutate({
                url: `/admin/cuisines/${info.row.original.id}`,
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
        cell: (info) =>
          info.getValue() ? (
            <span className="whitespace-nowrap text-sm">
              {new Intl.DateTimeFormat("uz-UZ", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(info.getValue()))}
            </span>
          ) : (
            "-"
          ),
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
              canManage={canManageContent}
              onEdit={(row) => navigate(`edit/${row.id}`)}
              onTranslate={(row) => navigate(`translate/${row.id}`)}
              onDelete={async (row) => {
                try {
                  if (!canManageContent) return;
                  await deleteMutation.mutateAsync({
                    url: `/admin/cuisines/${row.id}`,
                  });
                  toast.success("Oshxona o'chirildi");
                } catch (error) {
                  toast.error(
                    getErrorMessage(error, "Oshxonani o'chirib bo'lmadi"),
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
      canManageContent,
      canReorder,
      currentLanguage,
      deleteMutation,
      navigate,
      patchMutation,
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
    onExpandedChange: setExpanded,
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    state: {
      sorting,
      expanded,
      pagination: { pageIndex: currentPage - 1, pageSize },
    },
  });
  const filterFields = React.useMemo(
    () => [
      {
        label: "Nomi",
        key: "name",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Oshxona qidirish",
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
    if (translations !== "all" || translationsOp !== "is") {
      list.push({
        id: "translations",
        field: "translations",
        operator: translationsOp,
        values: translations !== "all" ? [translations] : [],
      });
    }
    return list;
  }, [name, nameOp, status, statusOp, translations, translationsOp]);
  const handleFiltersChange = React.useCallback(
    (next) => {
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
    },
    [
      setName,
      setNameOp,
      setPageQuery,
      setStatus,
      setStatusOp,
      setTranslations,
      setTranslationsOp,
    ],
  );
  const handleDragEnd = async ({ active, over }) => {
    if (
      !canManageContent ||
      !canReorder ||
      !active ||
      !over ||
      active.id === over.id
    ) {
      return;
    }
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
          <h1 className="text-2xl font-bold">Oshxonalar</h1>
          <p className="text-sm text-muted-foreground">
            O'zbek, turk, rus kabi oshxona turlarini boshqaring
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
          {canManageContent ? (
            <Button onClick={() => navigate("create")}>
              <PlusIcon data-icon="inline-start" />
              Yangi oshxona
            </Button>
          ) : null}
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
            info="{from} - {to} / {count} ta oshxona"
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
