import React from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { get } from "lodash";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useBreadcrumbStore, useLanguageStore } from "@/store";
import {
  useGetQuery,
  usePostQuery,
  usePatchQuery,
  useDeleteQuery,
} from "@/hooks/api";
import PageTransition from "@/components/page-transition";
import WorkoutPlanBuilder from "@/components/workout-plan-builder";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  RotateCcwIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { usePlanFilters } from "./use-filters.js";
import { DeleteAlert } from "./delete-alert.jsx";

const ITEMS_PER_PAGE = 10;
const DIFFICULTY_OPTIONS = ["Boshlang'ich", "O'rta", "Yuqori"];

const emptyForm = {
  name: "",
  description: "",
  difficulty: "O'rta",
  isActive: true,
};

function resolveText(translations, fallback, language) {
  if (translations && typeof translations === "object") {
    const direct = String(translations?.[language] ?? "").trim();
    if (direct) return direct;

    const uzText = String(translations?.uz ?? "").trim();
    if (uzText) return uzText;

    const firstValue = Object.values(translations).find((value) =>
      String(value ?? "").trim(),
    );
    if (firstValue) {
      return String(firstValue).trim();
    }
  }

  return String(fallback ?? "").trim();
}

function cleanTranslations(translations = {}) {
  return Object.fromEntries(
    Object.entries(translations)
      .map(([code, value]) => [code, String(value ?? "").trim()])
      .filter(([code, value]) => Boolean(code) && Boolean(value)),
  );
}

function countFilledTranslations(translations = {}) {
  return Object.values(translations).filter((value) =>
    String(value ?? "").trim(),
  ).length;
}

function resolveErrorMessage(error, fallback) {
  const message = error?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  return message || fallback;
}

function createFormFromTemplate(template, language) {
  return {
    name: resolveText(template?.translations, template?.name ?? "", language),
    description: resolveText(
      template?.descriptionTranslations,
      template?.description ?? "",
      language,
    ),
    difficulty: template?.difficulty || "O'rta",
    isActive: template?.isActive ?? true,
  };
}

const createTranslationForm = (template, languages = []) => ({
  titles: Object.fromEntries(
    (Array.isArray(languages) ? languages : []).map((language) => [
      language.code,
      resolveText(template?.translations, template?.name ?? "", language.code),
    ]),
  ),
  descriptions: Object.fromEntries(
    (Array.isArray(languages) ? languages : []).map((language) => [
      language.code,
      resolveText(
        template?.descriptionTranslations,
        template?.description ?? "",
        language.code,
      ),
    ]),
  ),
});

function hasCompleteTranslations(template, languageCount) {
  const titleCount = countFilledTranslations(template?.translations || {});
  const descriptionCount = countFilledTranslations(
    template?.descriptionTranslations || {},
  );
  const requiresDescription = Boolean(
    String(template?.description ?? "").trim(),
  );

  return (
    titleCount >= languageCount &&
    (!requiresDescription || descriptionCount >= languageCount)
  );
}

function sortTemplates(templates, sortBy, sortDir, currentLanguage) {
  const collator = new Intl.Collator("uz", {
    sensitivity: "base",
    numeric: true,
  });
  const factor = sortDir === "desc" ? -1 : 1;
  const source = Array.isArray(templates) ? templates : [];

  return [...source].sort((left, right) => {
    let result;

    switch (sortBy) {
      case "name":
        result = collator.compare(
          resolveText(left.translations, left.name, currentLanguage),
          resolveText(right.translations, right.name, currentLanguage),
        );
        break;
      case "difficulty":
        result = collator.compare(
          String(left.difficulty ?? ""),
          String(right.difficulty ?? ""),
        );
        break;
      case "daysPerWeek":
        result = Number(left.daysPerWeek ?? 0) - Number(right.daysPerWeek ?? 0);
        break;
      case "days":
        result = Number(left.days ?? 0) - Number(right.days ?? 0);
        break;
      case "totalExercises":
        result =
          Number(left.totalExercises ?? 0) - Number(right.totalExercises ?? 0);
        break;
      case "isActive":
        result =
          Number(Boolean(left.isActive)) - Number(Boolean(right.isActive));
        break;
      case "updatedAt":
      default:
        result =
          new Date(left.updatedAt ?? 0).getTime() -
          new Date(right.updatedAt ?? 0).getTime();
        break;
    }

    if (result === 0) {
      result =
        new Date(left.updatedAt ?? 0).getTime() -
        new Date(right.updatedAt ?? 0).getTime();
    }

    return result * factor;
  });
}

const Index = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const languages = get(languagesData, "data.data", []);

  const queryClient = useQueryClient();
  const TEMPLATES_QUERY_KEY = ["admin", "workout-plan-templates"];

  const mutationProps = {
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ["workout-plan"] }),
      ]);
    },
  };

  const {
    data: templatesData,
    isLoading,
    isFetching,
    refetch,
  } = useGetQuery({
    url: "/admin/workout-plans",
    queryProps: { queryKey: TEMPLATES_QUERY_KEY },
  });
  const templates = get(templatesData, "data.data", []);

  const createMutation = usePostQuery({ queryKey: TEMPLATES_QUERY_KEY, mutationProps });
  const updateMutation = usePatchQuery({ queryKey: TEMPLATES_QUERY_KEY, mutationProps });
  const deleteMutation = useDeleteQuery({ queryKey: TEMPLATES_QUERY_KEY, mutationProps });

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  const createTemplate = React.useCallback(
    async (payload) =>
      createMutation.mutateAsync({
        url: "/admin/workout-plans",
        attributes: payload,
      }),
    [createMutation],
  );

  const updateTemplate = React.useCallback(
    async (id, payload) =>
      updateMutation.mutateAsync({
        url: `/admin/workout-plans/${id}`,
        attributes: payload,
      }),
    [updateMutation],
  );

  const deleteTemplate = React.useCallback(
    async (id) =>
      deleteMutation.mutateAsync({
        url: `/admin/workout-plans/${id}`,
      }),
    [deleteMutation],
  );

  const {
    search,
    statusFilter,
    translationsFilter,
    difficultyFilter,
    sortBy,
    sortDir,
    sorting,
    currentPage,
    setPageQuery,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  } = usePlanFilters();

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

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [translationsDrawerOpen, setTranslationsDrawerOpen] =
    React.useState(false);
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

  const deferredSearch = React.useDeferredValue(search.trim().toLowerCase());

  const filteredTemplates = React.useMemo(() => {
    return safeTemplates.filter((template) => {
      const localizedName = resolveText(
        template.translations,
        template.name,
        currentLanguage,
      );
      const localizedDescription = resolveText(
        template.descriptionTranslations,
        template.description,
        currentLanguage,
      );

      const matchesSearch =
        !deferredSearch ||
        localizedName.toLowerCase().includes(deferredSearch) ||
        localizedDescription.toLowerCase().includes(deferredSearch) ||
        Object.values(template.translations || {}).some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(deferredSearch),
        );
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && template.isActive) ||
        (statusFilter === "inactive" && !template.isActive);
      const matchesDifficulty =
        difficultyFilter === "all" || template.difficulty === difficultyFilter;
      const complete = hasCompleteTranslations(template, languageCount);
      const matchesTranslations =
        translationsFilter === "all" ||
        (translationsFilter === "complete" && complete) ||
        (translationsFilter === "missing" && !complete);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDifficulty &&
        matchesTranslations
      );
    });
  }, [
    currentLanguage,
    deferredSearch,
    difficultyFilter,
    languageCount,
    statusFilter,
    safeTemplates,
    translationsFilter,
  ]);

  const sortedTemplates = React.useMemo(
    () => sortTemplates(filteredTemplates, sortBy, sortDir, currentLanguage),
    [currentLanguage, filteredTemplates, sortBy, sortDir],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(sortedTemplates.length / ITEMS_PER_PAGE),
  );

  React.useEffect(() => {
    if (currentPage > totalPages) {
      void setPageQuery(String(totalPages));
    }
  }, [currentPage, setPageQuery, totalPages]);

  const paginatedTemplates = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedTemplates.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, sortedTemplates]);

  const resetDraftState = React.useCallback(() => {
    setEditingTemplate(null);
    setBuilderInitialData(null);
    setForm(emptyForm);
  }, []);

  const openCreateDrawer = React.useCallback(() => {
    setEditingTemplate(null);
    setBuilderInitialData(null);
    setForm(emptyForm);
    setDrawerOpen(true);
  }, []);

  const openEditDrawer = React.useCallback(
    (template) => {
      setEditingTemplate(template);
      setBuilderInitialData(null);
      setForm(createFormFromTemplate(template, currentLanguage));
      setDrawerOpen(true);
    },
    [currentLanguage],
  );

  const openTranslationsDrawer = React.useCallback(
    (template) => {
      setTranslatingTemplate(template);
      setTranslationForm(createTranslationForm(template, activeLanguages));
      setTranslationsDrawerOpen(true);
    },
    [activeLanguages],
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
    setDrawerOpen(false);
    setBuilderOpen(true);
  }, [editingTemplate, form]);

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
      setTranslationsDrawerOpen(false);
      setTranslatingTemplate(null);
      setTranslationForm({ titles: {}, descriptions: {} });
    } catch (error) {
      toast.error(
        resolveErrorMessage(error, "Tarjimalarni saqlashda xatolik yuz berdi"),
      );
    }
  }, [currentLanguage, translatingTemplate, translationForm, updateTemplate]);

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

  const columns = useColumns({
    currentLanguage,
    currentPage,
    languageCount,
    openEditDrawer,
    openTranslationsDrawer,
    setDeleteCandidate,
  });

  const table = useReactTable({
    data: paginatedTemplates,
    columns,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    onSortingChange: handleSortingChange,
    state: {
      sorting,
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

          <Button onClick={openCreateDrawer}>
            <PlusIcon className="mr-2 size-4" />
            Yangi shablon
          </Button>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Filter
              filterFields={filterFields}
              activeFilters={activeFilters}
              handleFiltersChange={handleFiltersChange}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              className="hidden sm:flex"
              disabled={isFetching}
            >
              <RotateCcwIcon className={cn("size-4", isFetching && "animate-spin")} />
            </Button>
          </div>

          <DataGrid table={table} recordCount={sortedTemplates.length}>
            <div className="w-full space-y-2.5">
              <DataGridContainer>
                <ScrollArea>
                  <DataGridTable />
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </DataGridContainer>
            </div>
          </DataGrid>

          {isLoading ? (
            <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>
          ) : null}

          {sortedTemplates.length > ITEMS_PER_PAGE ? (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {sortedTemplates.length} ta shablondan{" "}
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(currentPage * ITEMS_PER_PAGE, sortedTemplates.length)}{" "}
                ko'rsatilmoqda
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={currentPage === 1}
                  onClick={() => void setPageQuery(String(currentPage - 1))}
                >
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <span className="px-2 text-sm font-medium">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={currentPage === totalPages}
                  onClick={() => void setPageQuery(String(currentPage + 1))}
                >
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <Drawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open && !builderOpen) {
            resetDraftState();
          }
        }}
        direction="bottom"
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {editingTemplate
                ? "Workout shablonini tahrirlash"
                : "Yangi workout shablon"}
            </DrawerTitle>
            <DrawerDescription>
              Asosiy ma'lumotlarni kiriting. Tarjimalar keyin alohida amalda
              qo'shiladi.
            </DrawerDescription>
          </DrawerHeader>

          <div className="grid gap-4 px-4 pb-4 sm:px-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workout-plan-name">Reja nomi</Label>
                <Input
                  id="workout-plan-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Masalan: Yog' yoqish uchun 4 haftalik plan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workout-plan-description">Tavsif</Label>
                <Textarea
                  id="workout-plan-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Shablon haqida qisqa tavsif"
                  className="min-h-28"
                />
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border bg-muted/20 p-4">
              <div className="space-y-2">
                <Label>Qiyinchilik</Label>
                <Select
                  value={form.difficulty}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      difficulty: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Qiyinchilikni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-background px-4 py-3">
                <div>
                  <p className="font-medium">Userga ko'rsatish</p>
                  <p className="text-sm text-muted-foreground">
                    Faol bo'lsa ready template sifatida chiqadi.
                  </p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      isActive: Boolean(checked),
                    }))
                  }
                />
              </div>

              <div className="rounded-2xl border bg-background p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Preview
                </p>
                <p className="mt-3 text-lg font-black">
                  {String(form.name ?? "").trim() || "Nomi kiritilmagan"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {String(form.description ?? "").trim() ||
                    "Tavsif kiritilmagan"}
                </p>
              </div>
            </div>
          </div>

          <DrawerFooter>
            <Button onClick={handleContinueToBuilder} disabled={isSaving}>
              Builderga o'tish
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDrawerOpen(false);
                if (!builderOpen) {
                  resetDraftState();
                }
              }}
            >
              Bekor qilish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={translationsDrawerOpen}
        onOpenChange={(open) => {
          setTranslationsDrawerOpen(open);
          if (!open) {
            setTranslatingTemplate(null);
            setTranslationForm({ titles: {}, descriptions: {} });
          }
        }}
        direction="bottom"
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Workout shablon tarjimalari</DrawerTitle>
            <DrawerDescription>
              Nom va tavsifni barcha faol tillar uchun alohida boshqaring.
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-4 px-4 pb-4 sm:px-6 overflow-y-auto no-scrollbar">
            {activeLanguages.map((language) => (
              <div
                key={language.code}
                className="space-y-3 rounded-2xl border bg-card p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{language.flag || "🌐"}</span>
                  <div>
                    <p className="font-medium">{language.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {language.code.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nomi</Label>
                  <Input
                    value={translationForm.titles?.[language.code] || ""}
                    onChange={(event) =>
                      setTranslationForm((current) => ({
                        ...current,
                        titles: {
                          ...current.titles,
                          [language.code]: event.target.value,
                        },
                      }))
                    }
                    placeholder="Tarjima qilingan nom"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tavsif</Label>
                  <Textarea
                    value={translationForm.descriptions?.[language.code] || ""}
                    onChange={(event) =>
                      setTranslationForm((current) => ({
                        ...current,
                        descriptions: {
                          ...current.descriptions,
                          [language.code]: event.target.value,
                        },
                      }))
                    }
                    placeholder="Tarjima qilingan tavsif"
                    className="min-h-24"
                  />
                </div>
              </div>
            ))}
          </div>

          <DrawerFooter>
            <Button onClick={handleTranslationSave} disabled={isSaving}>
              Tarjimalarni saqlash
            </Button>
            <Button
              variant="outline"
              onClick={() => setTranslationsDrawerOpen(false)}
            >
              Bekor qilish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

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
    </PageTransition>
  );
};

export default Index;
