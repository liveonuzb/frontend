import React from "react";
import { useNavigate, Outlet } from "react-router";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import lodashFilter from "lodash/filter";
import find from "lodash/find";
import get from "lodash/get";
import toString from "lodash/toString";
import lodashValues from "lodash/values";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import { toast } from "sonner";
import { PlusIcon, RotateCcwIcon } from "lucide-react";
import { useBreadcrumbStore, useLanguageStore } from "@/store";
import { useDeleteQuery, useGetQuery } from "@/hooks/api";
import {
  DataGrid,
  DataGridContainer,
  DataGridPagination,
  DataGridTable,
} from "@/components/reui/data-grid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAdminDrawerListNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useChallengeFilters } from "./use-filters.js";
import { DeleteAlert } from "./delete-alert.jsx";
import {
  CHALLENGES_QUERY_KEY,
  resolveChallengeApiErrorMessage,
} from "../api.js";

const resolveLocalizedText = (translations, fallback, language) => {
  if (translations && typeof translations === "object") {
    const direct = trim(String(translations?.[language] ?? ""));
    if (direct) return direct;

    const uzText = trim(String(translations?.uz ?? ""));
    if (uzText) return uzText;

    const firstValue = find(
      lodashValues(translations),
      (value) => trim(String(value ?? "")).length > 0,
    );
    if (firstValue) return trim(String(firstValue));
  }

  return trim(String(fallback ?? ""));
};

const Index = () => {
  const navigate = useNavigate();
  const navigateAdminDrawer = useAdminDrawerListNavigation();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const languages = get(languagesData, "data.data", []);
  const activeLanguages = React.useMemo(
    () => lodashFilter(languages, (language) => language.isActive),
    [languages],
  );
  const currentLanguageMeta = React.useMemo(
    () => find(activeLanguages, { code: currentLanguage }),
    [activeLanguages, currentLanguage],
  );
  const {
    search,
    statusFilter,
    typeFilter,
    currentPage,
    pageSize,
    setPageQuery,
    setPageSizeQuery,
    filterFields,
    activeFilters,
    handleFiltersChange,
  } = useChallengeFilters();
  const deferredSearch = React.useDeferredValue(search);
  const queryParams = React.useMemo(
    () => ({
      ...(trim(deferredSearch) ? { q: trim(deferredSearch) } : {}),
      ...(typeFilter !== "all" ? { type: typeFilter } : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      page: currentPage,
      pageSize,
    }),
    [currentPage, deferredSearch, pageSize, statusFilter, typeFilter],
  );
  const {
    data: challengesData,
    isLoading,
    isFetching,
    refetch,
  } = useGetQuery({
    url: "/admin/challenges",
    params: queryParams,
    queryProps: { queryKey: [...CHALLENGES_QUERY_KEY, queryParams] },
  });
  const challenges = get(challengesData, "data.data", []);
  const meta = get(challengesData, "data.meta", {
    total: 0,
    page: currentPage,
    pageSize,
    totalPages: 1,
  });

  const [challengeToDelete, setChallengeToDelete] = React.useState(null);
  const deleteMutation = useDeleteQuery({ queryKey: CHALLENGES_QUERY_KEY });
  const isDeleting = deleteMutation.isPending;

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/challenges", title: "Musobaqalar" },
    ]);
  }, [setBreadcrumbs]);

  const openCreateDrawer = React.useCallback(() => {
    navigateAdminDrawer("/admin/challenges/list/create");
  }, [navigateAdminDrawer]);

  const openEditDrawer = React.useCallback(
    (challenge) => {
      navigateAdminDrawer(`/admin/challenges/list/edit/${challenge.id}`);
    },
    [navigateAdminDrawer],
  );

  const openTranslationsDrawer = React.useCallback(
    (challenge) => {
      navigate(`/admin/challenges/list/translate/${challenge.id}`);
    },
    [navigate],
  );

  const handleDelete = React.useCallback(async () => {
    if (!challengeToDelete) return;

    try {
      await deleteMutation.mutateAsync({
        url: `/admin/challenges/${challengeToDelete.id}`,
      });
      toast.success("Musobaqa muvaffaqiyatli o'chirildi");
      setChallengeToDelete(null);
    } catch (error) {
      toast.error(
        resolveChallengeApiErrorMessage(error, "O'chirishda xatolik"),
      );
    }
  }, [challengeToDelete, deleteMutation]);

  const columns = useColumns({
    currentLanguage,
    resolveLocalizedText,
    openEditDrawer,
    openTranslationsDrawer,
    setChallengeToDelete,
  });

  const table = useReactTable({
    data: challenges,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => toString(get(row, "id")),
    manualPagination: true,
    pageCount: Math.max(1, toNumber(get(meta, "totalPages", 1))),
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: currentPage - 1, pageSize })
          : updater;

      React.startTransition(() => {
        void setPageQuery(String(get(next, "pageIndex", 0) + 1));
        void setPageSizeQuery(String(get(next, "pageSize", pageSize)));
      });
    },
    state: {
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
    },
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Musobaqalar</h1>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Filter
          filterFields={filterFields}
          activeFilters={activeFilters}
          handleFiltersChange={handleFiltersChange}
        />
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
          <Button onClick={openCreateDrawer} className="gap-1.5">
            <PlusIcon className="size-4" />
            Musobaqa qo'shish
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          {get(meta, "total", 0)} ta musobaqa
          {currentLanguageMeta
            ? ` \u2022 ${currentLanguageMeta.flag ? `${currentLanguageMeta.flag} ` : ""}${currentLanguageMeta.name}`
            : ""}
        </p>
      </div>

      <DataGrid
        table={table}
        isLoading={isLoading}
        recordCount={get(meta, "total", 0)}
      >
        <DataGridContainer>
          <ScrollArea className="w-full">
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DataGridContainer>
        <DataGridPagination
          info="{from} - {to} / {count} ta musobaqa"
          sizes={[10, 20, 50, 100]}
        />
      </DataGrid>

      {!isLoading && !challenges.length ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          Filtrlarga mos musobaqa topilmadi.
        </div>
      ) : null}

      <DeleteAlert
        challenge={challengeToDelete}
        open={Boolean(challengeToDelete)}
        onOpenChange={(open) => {
          if (!open) setChallengeToDelete(null);
        }}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      <Outlet />
    </div>
  );
};

export default Index;



