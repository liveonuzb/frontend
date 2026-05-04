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
  GENDER_SCOPE_OPTIONS,
  getErrorMessage,
  getPayload,
  ITEMS_PER_PAGE,
  ONBOARDING_OPTIONS,
  optionLabel,
  QUERY_KEY,
  resolveLabel,
  SELECT_OPERATORS,
  SORT_DIRECTIONS,
  SORT_FIELDS,
  STATUS_OPTIONS,
  TEXT_OPERATORS,
  TYPE_OPTIONS,
} from "../components/utils.jsx";
import ActionsMenu from "./actions-menu.jsx";

const SWITCH_CELL_CLASS_NAME =
  "flex min-h-10 w-full items-center justify-center";

const SWITCH_COLUMN_META = {
  skeleton: adminListSkeletons.status,
  headerClassName: "text-center",
  cellClassName: "text-center",
};

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
  const [onboarding, setOnboarding] = useQueryState(
    "onboarding",
    parseAsStringEnum(["all", "yes", "no"]).withDefault("all"),
  );
  const [onboardingOp, setOnboardingOp] = useQueryState(
    "onboardingOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [genderScope, setGenderScope] = useQueryState(
    "genderScope",
    parseAsStringEnum(["all", "male", "female"]).withDefault("all"),
  );
  const [genderScopeOp, setGenderScopeOp] = useQueryState(
    "genderScopeOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [type, setType] = useQueryState(
    "type",
    parseAsStringEnum([
      "all",
      "injury",
      "medical_condition",
      "mobility_limitation",
      "preference",
    ]).withDefault("all"),
  );
  const [typeOp, setTypeOp] = useQueryState(
    "typeOp",
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
    onboarding === "all" &&
    onboardingOp === "is" &&
    genderScope === "all" &&
    genderScopeOp === "is" &&
    type === "all" &&
    typeOp === "is" &&
    translations === "all" &&
    translationsOp === "is" &&
    sortBy === "orderKey" &&
    sortDir === "asc" &&
    currentPage === 1;

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin/health-constraints/list", title: "Health Constraints" },
    ]);
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
      ...(onboarding !== "all" ? { onboarding } : {}),
      ...(onboarding !== "all" || onboardingOp !== "is"
        ? { onboardingOp }
        : {}),
      ...(genderScope !== "all" ? { genderScope } : {}),
      ...(genderScope !== "all" || genderScopeOp !== "is"
        ? { genderScopeOp }
        : {}),
      ...(type !== "all" ? { type } : {}),
      ...(type !== "all" || typeOp !== "is" ? { typeOp } : {}),
      ...(translations !== "all" ? { translations } : {}),
      ...(translations !== "all" || translationsOp !== "is"
        ? { translationsOp }
        : {}),
    }),
    [
      currentPage,
      deferredName,
      genderScope,
      genderScopeOp,
      nameOp,
      onboarding,
      onboardingOp,
      pageSize,
      sortBy,
      sortDir,
      status,
      statusOp,
      translations,
      translationsOp,
      type,
      typeOp,
    ],
  );
  const { data, isLoading, isFetching, refetch } = useGetQuery({
    url: "/admin/health-constraints",
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
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Nomi" />
        ),
        enableSorting: true,
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
        accessorKey: "type",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Turi" />
        ),
        enableSorting: true,
        size: 150,
        meta: { skeleton: adminListSkeletons.text },
        cell: (info) => optionLabel(TYPE_OPTIONS, info.getValue()),
      },
      {
        accessorKey: "genderScope",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Jins" />
        ),
        enableSorting: true,
        size: 110,
        meta: { skeleton: adminListSkeletons.badge },
        cell: (info) => (
          <Badge variant="outline">
            {optionLabel(GENDER_SCOPE_OPTIONS, info.getValue())}
          </Badge>
        ),
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
        accessorKey: "isOnboarding",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Onboarding" />
        ),
        enableSorting: true,
        size: 120,
        meta: SWITCH_COLUMN_META,
        cell: (info) => (
          <div className={SWITCH_CELL_CLASS_NAME}>
            <Switch
              checked={Boolean(info.getValue())}
              onCheckedChange={(checked) =>
                patchMutation.mutate({
                  url: `/admin/health-constraints/${info.row.original.id}`,
                  attributes: { isOnboarding: checked },
                })
              }
            />
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
        meta: SWITCH_COLUMN_META,
        cell: (info) => (
          <div className={SWITCH_CELL_CLASS_NAME}>
            <Switch
              checked={Boolean(info.getValue())}
              onCheckedChange={(checked) =>
                patchMutation.mutate({
                  url: `/admin/health-constraints/${info.row.original.id}`,
                  attributes: { isActive: checked },
                })
              }
            />
          </div>
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
              onEdit={(row) => navigate(`edit/${row.id}`)}
              onTranslate={(row) => navigate(`translate/${row.id}`)}
              onDelete={async (row) => {
                try {
                  await deleteMutation.mutateAsync({
                    url: `/admin/health-constraints/${row.id}`,
                  });
                  toast.success("Health constraint o'chirildi");
                } catch (error) {
                  toast.error(
                    getErrorMessage(
                      error,
                      "Health constraintni o'chirib bo'lmadi",
                    ),
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
  const filterFields = React.useMemo(
    () => [
      {
        label: "Nomi",
        key: "name",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Constraint qidirish",
      },
      {
        label: "Status",
        key: "status",
        type: "select",
        defaultOperator: "is",
        options: STATUS_OPTIONS,
      },
      {
        label: "Onboarding",
        key: "onboarding",
        type: "select",
        defaultOperator: "is",
        options: ONBOARDING_OPTIONS,
      },
      {
        label: "Jins",
        key: "genderScope",
        type: "select",
        defaultOperator: "is",
        options: [{ value: "all", label: "Barchasi" }, ...GENDER_SCOPE_OPTIONS],
      },
      {
        label: "Turi",
        key: "type",
        type: "select",
        defaultOperator: "is",
        options: [{ value: "all", label: "Barchasi" }, ...TYPE_OPTIONS],
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
    if (onboarding !== "all" || onboardingOp !== "is") {
      list.push({
        id: "onboarding",
        field: "onboarding",
        operator: onboardingOp,
        values: onboarding !== "all" ? [onboarding] : [],
      });
    }
    if (genderScope !== "all" || genderScopeOp !== "is") {
      list.push({
        id: "genderScope",
        field: "genderScope",
        operator: genderScopeOp,
        values: genderScope !== "all" ? [genderScope] : [],
      });
    }
    if (type !== "all" || typeOp !== "is") {
      list.push({
        id: "type",
        field: "type",
        operator: typeOp,
        values: type !== "all" ? [type] : [],
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
    genderScope,
    genderScopeOp,
    name,
    nameOp,
    onboarding,
    onboardingOp,
    status,
    statusOp,
    translations,
    translationsOp,
    type,
    typeOp,
  ]);
  const handleFiltersChange = React.useCallback(
    (next) => {
      const byField = (field) => next.find((item) => item.field === field);
      React.startTransition(() => {
        void setName(byField("name")?.values?.[0] ?? "");
        void setNameOp(byField("name")?.operator ?? "contains");
        void setStatus(byField("status")?.values?.[0] ?? "all");
        void setStatusOp(byField("status")?.operator ?? "is");
        void setOnboarding(byField("onboarding")?.values?.[0] ?? "all");
        void setOnboardingOp(byField("onboarding")?.operator ?? "is");
        void setGenderScope(byField("genderScope")?.values?.[0] ?? "all");
        void setGenderScopeOp(byField("genderScope")?.operator ?? "is");
        void setType(byField("type")?.values?.[0] ?? "all");
        void setTypeOp(byField("type")?.operator ?? "is");
        void setTranslations(byField("translations")?.values?.[0] ?? "all");
        void setTranslationsOp(byField("translations")?.operator ?? "is");
        void setPageQuery("1");
      });
    },
    [
      setGenderScope,
      setGenderScopeOp,
      setName,
      setNameOp,
      setOnboarding,
      setOnboardingOp,
      setPageQuery,
      setStatus,
      setStatusOp,
      setTranslations,
      setTranslationsOp,
      setType,
      setTypeOp,
    ],
  );
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
          <h1 className="text-2xl font-bold">Health Constraints</h1>
          <p className="text-sm text-muted-foreground">
            Onboarding va workout reja uchun sog'liq cheklovlari
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
            Yangi constraint
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
            info="{from} - {to} / {count} ta constraint"
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
