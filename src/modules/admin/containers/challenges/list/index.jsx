import React from "react";
import { useNavigate, Outlet } from "react-router";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { filter as lodashFilter, find, get, values } from "lodash";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { useBreadcrumbStore, useLanguageStore } from "@/store";
import { useDeleteQuery, useGetQuery } from "@/hooks/api";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
    const direct = String(translations?.[language] ?? "").trim();
    if (direct) return direct;

    const uzText = String(translations?.uz ?? "").trim();
    if (uzText) return uzText;

    const firstValue = find(
      values(translations),
      (value) => String(value ?? "").trim().length > 0,
    );
    if (firstValue) return String(firstValue).trim();
  }

  return String(fallback ?? "").trim();
};

const Index = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const { data: challengesData, isLoading } = useGetQuery({
    url: "/admin/challenges",
    queryProps: { queryKey: CHALLENGES_QUERY_KEY },
  });
  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const challenges = get(challengesData, "data.items", []);
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
    filterFields,
    activeFilters,
    handleFiltersChange,
  } = useChallengeFilters();

  const [challengeToDelete, setChallengeToDelete] = React.useState(null);
  const deleteMutation = useDeleteQuery({ queryKey: CHALLENGES_QUERY_KEY });
  const isDeleting = deleteMutation.isPending;

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/challenges", title: "Musobaqalar" },
    ]);
  }, [setBreadcrumbs]);

  const deferredSearch = React.useDeferredValue(search);

  const filteredChallenges = React.useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return lodashFilter(challenges, (challenge) => {
      const localizedTitle = resolveLocalizedText(
        challenge.translations,
        challenge.title,
        currentLanguage,
      );
      const localizedDescription = resolveLocalizedText(
        challenge.descriptionTranslations,
        challenge.description,
        currentLanguage,
      );
      const matchesSearch =
        !query ||
        localizedTitle.toLowerCase().includes(query) ||
        localizedDescription.toLowerCase().includes(query);
      const matchesType = typeFilter === "all" || challenge.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" || challenge.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [challenges, currentLanguage, deferredSearch, statusFilter, typeFilter]);

  const openCreateDrawer = React.useCallback(() => {
    navigate("create");
  }, [navigate]);

  const openEditDrawer = React.useCallback(
    (challenge) => {
      navigate(`edit/${challenge.id}`);
    },
    [navigate],
  );

  const openTranslationsDrawer = React.useCallback(
    (challenge) => {
      navigate(`edit/${challenge.id}`);
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
    data: filteredChallenges,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Musobaqalar</h1>
        <Button onClick={openCreateDrawer} className="gap-1.5">
          <PlusIcon className="size-4" />
          Musobaqa qo'shish
        </Button>
      </div>

      <Filter
        filterFields={filterFields}
        activeFilters={activeFilters}
        handleFiltersChange={handleFiltersChange}
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          {filteredChallenges.length} ta musobaqa
          {currentLanguageMeta
            ? ` \u2022 ${currentLanguageMeta.flag ? `${currentLanguageMeta.flag} ` : ""}${currentLanguageMeta.name}`
            : ""}
        </p>
      </div>

      <DataGridContainer>
        <ScrollArea className="w-full">
          <DataGrid
            table={table}
            loadingMode="none"
            isLoading={isLoading}
            recordCount={filteredChallenges.length}
          >
            <DataGridTable />
          </DataGrid>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DataGridContainer>

      {!isLoading && !filteredChallenges.length ? (
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
