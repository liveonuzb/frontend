import React from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { get, isEqual } from "lodash";
import { toast } from "sonner";
import { useMatch, useNavigate } from "react-router";
import { useBreadcrumbStore, useLanguageStore } from "@/store";
import { useGetQuery } from "@/hooks/api";
import PageTransition from "@/components/page-transition";
import WorkoutPlanBuilder from "@/components/workout-plan-builder";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PlusIcon, RotateCcwIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  UnsavedChangesAlert,
  useUnsavedChangesGuard,
} from "@/modules/admin/components/unsaved-changes-guard.jsx";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { usePlanFilters } from "./use-filters.js";
import { DeleteAlert } from "./delete-alert.jsx";
import { WorkoutPlanFormDrawer } from "./workout-plan-form-drawer.jsx";
import { WorkoutPlanTranslationsDrawer } from "./workout-plan-translations-drawer.jsx";
import {
  useWorkoutPlanTemplateMutations,
  WORKOUT_PLAN_TEMPLATES_QUERY_KEY,
} from "./use-workout-plan-template-mutations.js";
import {
  cleanTranslations,
  createFormFromTemplate,
  createTranslationForm,
  emptyForm,
  resolveErrorMessage,
  resolveText,
} from "./workout-plan-utils.js";

const Index = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const createMatch = useMatch("/admin/workout-plans/create");
  const editMatch = useMatch("/admin/workout-plans/edit/:id");
  const translateMatch = useMatch("/admin/workout-plans/translate/:id");
  const editingTemplateId = get(editMatch, "params.id");
  const translatingTemplateId = get(translateMatch, "params.id");
  const formDrawerOpen = Boolean(createMatch || editingTemplateId);
  const translationsDrawerOpen = Boolean(translatingTemplateId);
  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const languages = get(languagesData, "data.data", []);

  const {
    sorting,
    currentPage,
    pageSize,
    queryParams,
    setPageQuery,
    setPageSizeQuery,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  } = usePlanFilters();

  const {
    data: templatesData,
    isLoading,
    isFetching,
    refetch,
  } = useGetQuery({
    url: "/admin/workout-plans",
    params: queryParams,
    queryProps: {
      queryKey: [...WORKOUT_PLAN_TEMPLATES_QUERY_KEY, queryParams],
    },
  });
  const templates = get(templatesData, "data.data", []);
  const meta = get(templatesData, "data.meta", {
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  });
  const { data: editingTemplateData, isLoading: isEditingTemplateLoading } =
    useGetQuery({
      url: `/admin/workout-plans/${editingTemplateId || ""}`,
      queryProps: {
        queryKey: [
          ...WORKOUT_PLAN_TEMPLATES_QUERY_KEY,
          "detail",
          editingTemplateId,
        ],
        enabled: Boolean(editingTemplateId),
      },
    });
  const {
    data: translatingTemplateData,
    isLoading: isTranslatingTemplateLoading,
  } = useGetQuery({
    url: `/admin/workout-plans/${translatingTemplateId || ""}`,
    queryProps: {
      queryKey: [
        ...WORKOUT_PLAN_TEMPLATES_QUERY_KEY,
        "detail",
        translatingTemplateId,
      ],
      enabled: Boolean(translatingTemplateId),
    },
  });

  const {
    createTemplate,
    deleteTemplate,
    isDeleting,
    isSaving,
    updateTemplate,
  } = useWorkoutPlanTemplateMutations();

  const safeLanguages = React.useMemo(
    () => (Array.isArray(languages) ? languages : []),
    [languages],
  );
  const safeTemplates = React.useMemo(
    () => (Array.isArray(templates) ? templates : []),
    [templates],
  );

  const activeLanguages = React.useMemo(
    () => safeLanguages.filter((language) => language.isActive !== false),
    [safeLanguages],
  );
  const languageCount = Math.max(activeLanguages.length, 1);

  const [builderOpen, setBuilderOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState(null);
  const [translatingTemplate, setTranslatingTemplate] = React.useState(null);
  const [builderInitialData, setBuilderInitialData] = React.useState(null);
  const [form, setForm] = React.useState(emptyForm);
  const [translationForm, setTranslationForm] = React.useState({
    titles: {},
    descriptions: {},
  });
  const [deleteCandidate, setDeleteCandidate] = React.useState(null);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/workout-plans", title: "Workout rejalari" },
    ]);
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    if (!createMatch) return;

    setEditingTemplate(null);
    setBuilderInitialData(null);
    setForm(emptyForm);
  }, [createMatch]);

  React.useEffect(() => {
    const template = get(editingTemplateData, "data.data");
    if (!template) return;

    setEditingTemplate(template);
    setBuilderInitialData(null);
    setForm(createFormFromTemplate(template, currentLanguage));
  }, [currentLanguage, editingTemplateData]);

  React.useEffect(() => {
    const template = get(translatingTemplateData, "data.data");
    if (!template) return;

    setTranslatingTemplate(template);
    setTranslationForm(createTranslationForm(template, activeLanguages));
  }, [activeLanguages, translatingTemplateData]);

  React.useEffect(() => {
    const totalPages = get(meta, "totalPages", 1);
    if (currentPage > totalPages) {
      void setPageQuery(String(totalPages));
    }
  }, [currentPage, meta, setPageQuery]);

  const resetDraftState = React.useCallback(() => {
    setEditingTemplate(null);
    setBuilderInitialData(null);
    setForm(emptyForm);
  }, []);
  const formBaseline = React.useMemo(
    () =>
      editingTemplate
        ? createFormFromTemplate(editingTemplate, currentLanguage)
        : emptyForm,
    [currentLanguage, editingTemplate],
  );
  const formUnsavedChanges = useUnsavedChangesGuard({
    when:
      formDrawerOpen &&
      !isSaving &&
      !isEditingTemplateLoading &&
      !isEqual(form, formBaseline),
  });
  const closeFormDrawer = React.useCallback(() => {
    navigate("/admin/workout-plans");
    resetDraftState();
  }, [navigate, resetDraftState]);

  const openCreateDrawer = React.useCallback(() => {
    setEditingTemplate(null);
    setBuilderInitialData(null);
    setForm(emptyForm);
    navigate("/admin/workout-plans/create");
  }, [navigate]);

  const openEditDrawer = React.useCallback(
    (template) => {
      setEditingTemplate(template);
      setBuilderInitialData(null);
      setForm(createFormFromTemplate(template, currentLanguage));
      navigate(`/admin/workout-plans/edit/${template.id}`);
    },
    [currentLanguage, navigate],
  );

  const openTranslationsDrawer = React.useCallback(
    (template) => {
      setTranslatingTemplate(template);
      setTranslationForm(createTranslationForm(template, activeLanguages));
      navigate(`/admin/workout-plans/translate/${template.id}`);
    },
    [activeLanguages, navigate],
  );

  const handleContinueToBuilder = React.useCallback(() => {
    const nextName = String(form.name ?? "").trim();

    if (!nextName) {
      toast.error("Reja nomini kiriting");
      return;
    }

    setBuilderInitialData({
      id: editingTemplate?.id || `admin-workout-template-${Date.now()}`,
      name: nextName,
      description: String(form.description ?? "").trim(),
      difficulty: form.difficulty,
      days: editingTemplate?.days ?? 28,
      daysPerWeek: editingTemplate?.daysPerWeek ?? 0,
      source: "admin",
      schedule: editingTemplate?.schedule ?? [],
    });
    formUnsavedChanges.runWithoutGuard(() => {
      navigate("/admin/workout-plans");
      setBuilderOpen(true);
    });
  }, [editingTemplate, form, formUnsavedChanges, navigate]);

  const handleBuilderSave = React.useCallback(
    async (plan) => {
      const payload = {
        name: String(plan.name ?? "").trim(),
        description: String(plan.description ?? "").trim() || undefined,
        difficulty: form.difficulty,
        days: plan.days,
        daysPerWeek: plan.daysPerWeek,
        schedule: plan.schedule,
        source: "admin",
        isActive: form.isActive,
        approvalStatus: form.approvalStatus,
        approvalReason: String(form.approvalReason ?? "").trim() || undefined,
      };

      try {
        if (editingTemplate?.id) {
          await updateTemplate(editingTemplate.id, payload);
          toast.success("Workout shabloni yangilandi");
        } else {
          await createTemplate(payload);
          toast.success("Workout shabloni yaratildi");
        }

        setBuilderOpen(false);
        resetDraftState();
        navigate("/admin/workout-plans");
      } catch (error) {
        toast.error(
          resolveErrorMessage(
            error,
            "Workout shablonini saqlashda xatolik yuz berdi",
          ),
        );
      }
    },
    [
      createTemplate,
      editingTemplate?.id,
      form.difficulty,
      form.isActive,
      form.approvalReason,
      form.approvalStatus,
      navigate,
      resetDraftState,
      updateTemplate,
    ],
  );

  const handleTranslationSave = React.useCallback(async () => {
    if (!translatingTemplate?.id) {
      return;
    }

    const nextTitles = cleanTranslations(translationForm.titles);
    const nextDescriptions = cleanTranslations(translationForm.descriptions);
    const localizedName =
      String(nextTitles[currentLanguage] ?? "").trim() ||
      resolveText(
        translatingTemplate.translations,
        translatingTemplate.name,
        currentLanguage,
      );
    const localizedDescription =
      String(nextDescriptions[currentLanguage] ?? "").trim() ||
      resolveText(
        translatingTemplate.descriptionTranslations,
        translatingTemplate.description,
        currentLanguage,
      );

    if (!Object.keys(nextTitles).length) {
      toast.error("Kamida bitta til uchun nom kiriting");
      return;
    }

    try {
      await updateTemplate(translatingTemplate.id, {
        name: localizedName,
        description: localizedDescription || undefined,
        translations: nextTitles,
        descriptionTranslations: nextDescriptions,
      });
      toast.success("Tarjimalar yangilandi");
      setTranslatingTemplate(null);
      setTranslationForm({ titles: {}, descriptions: {} });
      navigate("/admin/workout-plans");
    } catch (error) {
      toast.error(
        resolveErrorMessage(error, "Tarjimalarni saqlashda xatolik yuz berdi"),
      );
    }
  }, [
    currentLanguage,
    navigate,
    translatingTemplate,
    translationForm,
    updateTemplate,
  ]);

  const handleDelete = React.useCallback(async () => {
    if (!deleteCandidate?.id) {
      return;
    }

    try {
      await deleteTemplate(deleteCandidate.id);
      toast.success("Workout shabloni o'chirildi");
      setDeleteCandidate(null);
    } catch (error) {
      toast.error(
        resolveErrorMessage(
          error,
          "Workout shablonini o'chirishda xatolik yuz berdi",
        ),
      );
    }
  }, [deleteCandidate?.id, deleteTemplate]);

  const handleToggleStatus = React.useCallback(
    async (template) => {
      try {
        await updateTemplate(template.id, { isActive: !template.isActive });
        toast.success("Status yangilandi");
      } catch (error) {
        toast.error(
          resolveErrorMessage(error, "Statusni yangilashda xatolik yuz berdi"),
        );
      }
    },
    [updateTemplate],
  );

  const columns = useColumns({
    currentLanguage,
    currentPage,
    languageCount,
    isSaving,
    onToggleStatus: handleToggleStatus,
    openEditDrawer,
    openTranslationsDrawer,
    setDeleteCandidate,
  });

  const table = useReactTable({
    data: safeTemplates,
    columns,
    manualSorting: true,
    manualPagination: true,
    pageCount: get(meta, "totalPages", 1),
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
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
    state: {
      sorting,
      pagination: { pageIndex: currentPage - 1, pageSize },
    },
  });

  return (
    <PageTransition mode="slide-up">
      <div className="flex flex-col gap-6 pb-12">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge
              variant="outline"
              className="border-primary/20 bg-primary/10 text-primary"
            >
              Admin template'lar
            </Badge>
            <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
              Workout shablonlari
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Admin yaratgan workout rejalari user tarafidagi
              <span className="font-medium text-foreground">
                {" "}
                Tayyor shablonlar{" "}
              </span>
              bo'limiga chiqadi. Asosiy ma'lumotni avval yaratasiz, tarjimalar
              esa alohida amalda boshqariladi.
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
            <Button onClick={openCreateDrawer}>
              <PlusIcon className="mr-2 size-4" />
              Yangi shablon
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Filter
              filterFields={filterFields}
              activeFilters={activeFilters}
              handleFiltersChange={handleFiltersChange}
              className="flex-1"
            />
          </div>

          <DataGrid
            table={table}
            isLoading={isLoading}
            recordCount={get(meta, "total", 0)}
          >
            <div className="w-full space-y-2.5">
              <DataGridContainer>
                <ScrollArea>
                  <DataGridTable />
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </DataGridContainer>
              <DataGridPagination
                info="{from} - {to} / {count} ta shablon"
                rowsPerPageLabel="Sahifada:"
                sizes={[10, 25, 50, 100]}
              />
            </div>
          </DataGrid>
        </section>
      </div>

      <WorkoutPlanFormDrawer
        open={formDrawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            formUnsavedChanges.requestLeave(closeFormDrawer);
          }
        }}
        editingTemplate={editingTemplate}
        form={form}
        setForm={setForm}
        isSaving={isSaving}
        isLoading={Boolean(editingTemplateId) && isEditingTemplateLoading}
        onContinue={handleContinueToBuilder}
        onCancel={() => formUnsavedChanges.requestLeave(closeFormDrawer)}
      />

      <WorkoutPlanTranslationsDrawer
        open={translationsDrawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            navigate("/admin/workout-plans");
            setTranslatingTemplate(null);
            setTranslationForm({ titles: {}, descriptions: {} });
          }
        }}
        activeLanguages={activeLanguages}
        translationForm={translationForm}
        setTranslationForm={setTranslationForm}
        isSaving={isSaving}
        isLoading={isTranslatingTemplateLoading}
        onSave={handleTranslationSave}
      />

      <WorkoutPlanBuilder
        open={builderOpen}
        onOpenChange={(open) => {
          setBuilderOpen(open);
          if (!open) {
            setBuilderInitialData(null);
            setEditingTemplate(null);
            setForm(emptyForm);
          }
        }}
        initialData={builderInitialData}
        onSave={handleBuilderSave}
        onClose={() => {
          setBuilderOpen(false);
          setBuilderInitialData(null);
          resetDraftState();
        }}
        fullscreen
        lockWeekDays
      />

      <DeleteAlert
        template={deleteCandidate}
        open={Boolean(deleteCandidate)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteCandidate(null);
          }
        }}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
      <UnsavedChangesAlert
        open={formUnsavedChanges.confirmOpen}
        onCancel={formUnsavedChanges.cancelLeave}
        onConfirm={formUnsavedChanges.confirmLeave}
      />
    </PageTransition>
  );
};

export default Index;
