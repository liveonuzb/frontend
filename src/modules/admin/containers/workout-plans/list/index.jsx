import React from "react";
import { useTranslation } from "react-i18next";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import get from "lodash/get";
import isEqual from "lodash/isEqual";
import filter from "lodash/filter";
import isArray from "lodash/isArray";
import keys from "lodash/keys";
import trim from "lodash/trim";
import { toast } from "sonner";
import { useMatch, useNavigate } from "react-router";
import { useBreadcrumbStore, useLanguageStore } from "@/store";
import { useGetQuery, usePostQuery } from "@/hooks/api";
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
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
import { AssignWorkoutTemplateDrawer } from "./assign-workout-template-drawer.jsx";
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

const WORKOUT_ASSIGNMENTS_QUERY_KEY = ["admin", "workout-assignments"];

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canManageContent } = useAdminPermissions();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const createMatch = useMatch("/admin/workout-plans/create");
  const editMatch = useMatch("/admin/workout-plans/edit/:id");
  const translateMatch = useMatch("/admin/workout-plans/translate/:id");
  const editingTemplateId = get(editMatch, "params.id");
  const translatingTemplateId = get(translateMatch, "params.id");
  const formDrawerOpen = Boolean(createMatch || editingTemplateId);
  const translationsDrawerOpen = Boolean(translatingTemplateId);
  const [assigningTemplate, setAssigningTemplate] = React.useState(null);
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
  const { data: assignableUsersData, isLoading: isAssignableUsersLoading } =
    useGetQuery({
      url: "/admin/workout-assignments/users",
      params: { limit: 50 },
      queryProps: {
        queryKey: [
          ...WORKOUT_ASSIGNMENTS_QUERY_KEY,
          "users",
          assigningTemplate?.id,
        ],
        enabled: Boolean(assigningTemplate?.id && canManageContent),
      },
    });

  const {
    createTemplate,
    deleteTemplate,
    isDeleting,
    isSaving,
    updateTemplate,
  } = useWorkoutPlanTemplateMutations();
  const { mutateAsync: assignWorkoutTemplate, isPending: isAssigningWorkout } =
    usePostQuery({
      queryKey: WORKOUT_ASSIGNMENTS_QUERY_KEY,
      listKey: WORKOUT_PLAN_TEMPLATES_QUERY_KEY,
    });

  const safeLanguages = React.useMemo(
    () => (isArray(languages) ? languages : []),
    [languages],
  );
  const safeTemplates = React.useMemo(
    () => (isArray(templates) ? templates : []),
    [templates],
  );
  const assignableUsers = React.useMemo(() => {
    const responseData = get(assignableUsersData, "data.data", []);

    if (isArray(responseData)) {
      return responseData;
    }

    return get(responseData, "data", []);
  }, [assignableUsersData]);

  const activeLanguages = React.useMemo(
    () => filter(safeLanguages, (language) => language.isActive !== false),
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
      { url: "/admin/workout-plans", title: t("admin.workoutPlans.title") },
    ]);
  }, [setBreadcrumbs, t]);

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
  const openAssignDrawer = React.useCallback(
    (template) => {
      if (!canManageContent) {
        return;
      }

      setAssigningTemplate(template);
    },
    [canManageContent],
  );

  const handleContinueToBuilder = React.useCallback(() => {
    const nextName = trim(String(form.name ?? ""));

    if (!nextName) {
      toast.error(t("admin.workoutPlans.messages.nameRequired"));
      return;
    }

    setBuilderInitialData({
      id: editingTemplate?.id || `admin-workout-template-${Date.now()}`,
      name: nextName,
      description: trim(String(form.description ?? "")),
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
        name: trim(String(plan.name ?? "")),
        description: trim(String(plan.description ?? "")) || undefined,
        difficulty: form.difficulty,
        days: plan.days,
        daysPerWeek: plan.daysPerWeek,
        schedule: plan.schedule,
        source: "admin",
        isActive: form.isActive,
        approvalStatus: form.approvalStatus,
        approvalReason: trim(String(form.approvalReason ?? "")) || undefined,
      };

      try {
        if (editingTemplate?.id) {
          await updateTemplate(editingTemplate.id, payload);
          toast.success(t("admin.workoutPlans.messages.updated"));
        } else {
          await createTemplate(payload);
          toast.success(t("admin.workoutPlans.messages.created"));
        }

        setBuilderOpen(false);
        resetDraftState();
        navigate("/admin/workout-plans");
      } catch (error) {
        toast.error(
          resolveErrorMessage(
            error,
            t("admin.workoutPlans.messages.saveError"),
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
      trim(String(nextTitles[currentLanguage] ?? "")) ||
      resolveText(
        translatingTemplate.translations,
        translatingTemplate.name,
        currentLanguage,
      );
    const localizedDescription =
      trim(String(nextDescriptions[currentLanguage] ?? "")) ||
      resolveText(
        translatingTemplate.descriptionTranslations,
        translatingTemplate.description,
        currentLanguage,
      );

    if (!keys(nextTitles).length) {
      toast.error(t("admin.workoutPlans.messages.translationNameRequired"));
      return;
    }

    try {
      await updateTemplate(translatingTemplate.id, {
        name: localizedName,
        description: localizedDescription || undefined,
        translations: nextTitles,
        descriptionTranslations: nextDescriptions,
      });
      toast.success(t("admin.workoutPlans.messages.translationsUpdated"));
      setTranslatingTemplate(null);
      setTranslationForm({ titles: {}, descriptions: {} });
      navigate("/admin/workout-plans");
    } catch (error) {
      toast.error(
        resolveErrorMessage(error, t("admin.workoutPlans.messages.translationSaveError")),
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
      toast.success(t("admin.workoutPlans.messages.deleted"));
      setDeleteCandidate(null);
    } catch (error) {
      toast.error(
        resolveErrorMessage(
          error,
          t("admin.workoutPlans.messages.deleteError"),
        ),
      );
    }
  }, [deleteCandidate?.id, deleteTemplate]);

  const handleToggleStatus = React.useCallback(
    async (template) => {
      try {
        await updateTemplate(template.id, { isActive: !template.isActive });
        toast.success(t("admin.workoutPlans.messages.statusUpdated"));
      } catch (error) {
        toast.error(
          resolveErrorMessage(error, t("admin.workoutPlans.messages.statusUpdateError")),
        );
      }
    },
    [updateTemplate],
  );
  const handleAssignWorkout = React.useCallback(
    async (payload) => {
      if (!canManageContent) {
        return;
      }

      try {
        await assignWorkoutTemplate({
          url: "/admin/workout-assignments",
          attributes: payload,
        });
        toast.success(t("admin.workoutPlans.messages.assigned"));
        setAssigningTemplate(null);
      } catch (error) {
        toast.error(
          resolveErrorMessage(
            error,
            t("admin.workoutPlans.messages.assignError"),
          ),
        );
      }
    },
    [assignWorkoutTemplate, canManageContent],
  );

  const columns = useColumns({
    currentLanguage,
    currentPage,
    languageCount,
    isSaving,
    canAssignTemplates: canManageContent,
    onToggleStatus: handleToggleStatus,
    openAssignDrawer,
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
              {t("admin.workoutPlans.list.badge")}
            </Badge>
            <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
              {t("admin.workoutPlans.list.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {t("admin.workoutPlans.list.subtitlePrefix")}
              <span className="font-medium text-foreground">
                {" "}
                {t("admin.workoutPlans.list.subtitleHighlight")}{" "}
              </span>
              {t("admin.workoutPlans.list.subtitleSuffix")}
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
              {t("admin.workoutPlans.list.create")}
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

      <AssignWorkoutTemplateDrawer
        open={Boolean(assigningTemplate)}
        onOpenChange={(open) => {
          if (!open) {
            setAssigningTemplate(null);
          }
        }}
        template={assigningTemplate}
        users={assignableUsers}
        isLoadingUsers={isAssignableUsersLoading}
        isAssigning={isAssigningWorkout}
        onAssign={handleAssignWorkout}
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
