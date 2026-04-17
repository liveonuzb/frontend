import {
  filter,
  get,
  includes,
  some,
  toLower,
  trim,
} from "lodash";
import React from "react";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { UtensilsCrossedIcon, RotateCcwIcon, SparklesIcon } from "lucide-react";
import CoachErrorState from "../../../components/coach-error-state";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useBreadcrumbStore } from "@/store";
import { useCoachMealPlans } from "@/hooks/app/use-coach.js";
import useFoodCatalog from "@/hooks/app/use-food-catalog";
import PageTransition from "@/components/page-transition";
import MealPlanBuilder from "@/components/meal-plan-builder/index.jsx";
import AiGeneratorDrawer from "@/components/meal-plan-builder/ai-generator-drawer.jsx";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { SearchIcon } from "lucide-react";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import { cn } from "@/lib/utils";
import { useColumns } from "./columns.jsx";
import { Filter, useMealPlanFilters } from "./filter.jsx";
import { DeleteAlert } from "./delete-alert.jsx";

const MealPlansListIndex = () => {
  const { t, i18n } = useTranslation();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const locale = i18n.language || "uz-UZ";
  const {
    mealPlans,
    clients,
    isLoading,
    isFetching,
    isError,
    refetch,
    createMealPlan,
    updateMealPlan,
    duplicateMealPlan,
    assignMealPlan,
    deleteMealPlan,
    isAssigning,
    isDeleting,
  } = useCoachMealPlans();

  const { foods } = useFoodCatalog();

  const {
    search,
    sourceFilter,
    assignmentFilter,
    sorting,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  } = useMealPlanFilters();

  const [builderOpen, setBuilderOpen] = React.useState(false);
  const [builderInitialData, setBuilderInitialData] = React.useState({});
  const [editingPlan, setEditingPlan] = React.useState(null);
  const [metaDrawerOpen, setMetaDrawerOpen] = React.useState(false);
  const [planMetaMode, setPlanMetaMode] = React.useState("create");
  const [planMetaTitle, setPlanMetaTitle] = React.useState("");
  const [planMetaDescription, setPlanMetaDescription] = React.useState("");
  const [assignDrawerOpen, setAssignDrawerOpen] = React.useState(false);
  const [assigningPlan, setAssigningPlan] = React.useState(null);
  const [selectedClientIds, setSelectedClientIds] = React.useState([]);
  const [clientSearch, setClientSearch] = React.useState("");
  const [deleteCandidate, setDeleteCandidate] = React.useState(null);
  const [aiGeneratorOpen, setAiGeneratorOpen] = React.useState(false);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: t("coach.clients.breadcrumbs.coach") },
      { url: "/coach/meal-plans", title: t("coach.mealPlans.header.title") },
    ]);
  }, [setBreadcrumbs, t]);

  const deferredSearch = React.useDeferredValue(search);

  const filteredPlans = React.useMemo(() => {
    if (!mealPlans) return [];

    return mealPlans.filter((plan) => {
      const searchLower = toLower(trim(deferredSearch));
      if (searchLower) {
        const matchesTitle = includes(toLower(plan.title), searchLower);
        const matchesClient = some(plan.assignedClients, (c) =>
          includes(toLower(c.name), searchLower),
        );
        if (!matchesTitle && !matchesClient) return false;
      }

      if (sourceFilter !== "all" && plan.source !== sourceFilter) {
        return false;
      }

      if (
        assignmentFilter === "assigned" &&
        plan.assignedClients.length === 0
      ) {
        return false;
      }

      if (
        assignmentFilter === "unassigned" &&
        plan.assignedClients.length > 0
      ) {
        return false;
      }

      return true;
    });
  }, [assignmentFilter, deferredSearch, mealPlans, sourceFilter]);

  const openNewPlan = React.useCallback(() => {
    setEditingPlan(null);
    setPlanMetaMode("create");
    setPlanMetaTitle(
      t("coach.mealPlans.defaultNewName", {
        date: new Date().toLocaleDateString(locale),
      }),
    );
    setPlanMetaDescription("");
    setMetaDrawerOpen(true);
  }, [locale, t]);

  const handleAiGenerate = React.useCallback(
    (weeklyKanban) => {
      setAiGeneratorOpen(false);
      setEditingPlan(null);
      setPlanMetaMode("create");
      setPlanMetaTitle(
        t("coach.mealPlans.defaultNewName", {
          date: new Date().toLocaleDateString(locale),
        }),
      );
      setPlanMetaDescription("");
      setBuilderInitialData(weeklyKanban);
      setBuilderOpen(true);
    },
    [locale, t],
  );

  const continueMetaFlow = React.useCallback(() => {
    if (!trim(planMetaTitle)) {
      toast.error(t("coach.mealPlans.toasts.nameRequired"));
      return;
    }
    setBuilderInitialData(get(editingPlan, "weeklyKanban") || {});
    setMetaDrawerOpen(false);
    setBuilderOpen(true);
  }, [editingPlan, planMetaTitle, t]);

  const handleSaveMetadata = React.useCallback(async () => {
    if (!trim(planMetaTitle)) {
      toast.error(t("coach.mealPlans.toasts.nameRequired"));
      return;
    }
    if (!get(editingPlan, "id")) return;

    try {
      const payload = {
        title: trim(planMetaTitle),
        description: trim(planMetaDescription),
        weeklyKanban: editingPlan.weeklyKanban || {},
        tags: editingPlan.tags || [],
        source: editingPlan.source || "manual",
      };
      await updateMealPlan(editingPlan.id, payload);
      setMetaDrawerOpen(false);
      setEditingPlan(null);
      setPlanMetaTitle("");
      setPlanMetaDescription("");
      toast.success(t("coach.mealPlans.toasts.saveSuccess"));
    } catch (error) {
      toast.error(t("coach.mealPlans.toasts.saveError"));
    }
  }, [planMetaTitle, planMetaDescription, editingPlan, updateMealPlan, t]);

  const openEdit = React.useCallback((plan) => {
    setEditingPlan(plan);
    setPlanMetaMode("edit");
    setPlanMetaTitle(plan.title || "");
    setPlanMetaDescription(plan.description || "");
    setMetaDrawerOpen(true);
  }, []);

  const handleBuilderSave = React.useCallback(
    async (weeklyKanban) => {
      const payload = {
        title: trim(planMetaTitle),
        description: trim(planMetaDescription),
        weeklyKanban,
        tags: get(editingPlan, "tags") || [],
        source: get(editingPlan, "source") || "manual",
      };

      if (!payload.title) {
        toast.error(t("coach.mealPlans.toasts.nameRequired"));
        return;
      }

      if (editingPlan) {
        await updateMealPlan(editingPlan.id, payload);
        toast.success(t("coach.mealPlans.toasts.updateSuccess"));
      } else {
        await createMealPlan(payload);
        toast.success(t("coach.mealPlans.toasts.createSuccess"));
      }

      setBuilderOpen(false);
      setEditingPlan(null);
      setBuilderInitialData({});
      setPlanMetaMode("create");
      setPlanMetaTitle("");
      setPlanMetaDescription("");
    },
    [
      createMealPlan,
      editingPlan,
      planMetaDescription,
      planMetaTitle,
      updateMealPlan,
      t,
    ],
  );

  const openAssign = React.useCallback((plan) => {
    setAssigningPlan(plan);
    setSelectedClientIds(plan.assignedClients.map((item) => item.id));
    setAssignDrawerOpen(true);
  }, []);

  const toggleClient = React.useCallback((clientId) => {
    setSelectedClientIds((current) =>
      current.includes(clientId)
        ? current.filter((item) => item !== clientId)
        : [...current, clientId],
    );
  }, []);

  const handleSaveAssign = React.useCallback(async () => {
    if (!assigningPlan) return;
    await assignMealPlan(assigningPlan.id, selectedClientIds);
    toast.success(t("coach.mealPlans.toasts.assignSuccess"));
    setAssignDrawerOpen(false);
  }, [assignMealPlan, assigningPlan, selectedClientIds, t]);

  const handleDuplicate = React.useCallback(
    async (planId) => {
      await duplicateMealPlan(planId);
      toast.success(t("coach.mealPlans.toasts.duplicateSuccess"));
    },
    [duplicateMealPlan, t],
  );

  const handleDelete = React.useCallback(async () => {
    if (!deleteCandidate) return;
    await deleteMealPlan(deleteCandidate.id);
    toast.success(t("coach.mealPlans.toasts.deleteSuccess"));
    setDeleteCandidate(null);
  }, [deleteCandidate, deleteMealPlan, t]);

  const columns = useColumns({
    locale,
    onEdit: openEdit,
    onAssign: openAssign,
    onDuplicate: handleDuplicate,
    onDelete: setDeleteCandidate,
    isDeleting,
  });

  const table = useReactTable({
    data: filteredPlans,
    columns,
    initialState: {
      columnPinning: { right: ["actions"] },
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: handleSortingChange,
    state: { sorting },
  });

  if (isError) {
    return (
      <PageTransition>
        <CoachErrorState onRetry={refetch} />
      </PageTransition>
    );
  }

  return (
    <>
      <PageTransition>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                <UtensilsCrossedIcon className="size-6" />
                {t("coach.mealPlans.header.title")}
              </h1>
              <p className="text-muted-foreground">
                {t("coach.mealPlans.header.description")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                className="hidden sm:flex"
                disabled={isFetching}
              >
                <RotateCcwIcon
                  className={cn("size-4", isFetching && "animate-spin")}
                />
              </Button>
              <Button
                variant="outline"
                onClick={() => setAiGeneratorOpen(true)}
                className="gap-1.5 border-violet-500/30 text-violet-600 hover:bg-violet-500/5 hover:text-violet-700"
              >
                <SparklesIcon className="size-4" />
                AI bilan
              </Button>
              <Button onClick={openNewPlan}>
                {t("coach.mealPlans.header.newTemplate")}
              </Button>
            </div>
          </div>

          <Filter
            filterFields={filterFields}
            activeFilters={activeFilters}
            handleFiltersChange={handleFiltersChange}
          />

          <DataGridContainer>
            <ScrollArea className="w-full">
              <DataGrid
                table={table}
                isLoading={isLoading}
                recordCount={filteredPlans.length}
                onRowClick={openEdit}
                tableLayout={{ columnsPinnable: true }}
              >
                <DataGridTable />
              </DataGrid>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
        </div>
      </PageTransition>

      <Drawer
        open={metaDrawerOpen}
        onOpenChange={(open) => {
          setMetaDrawerOpen(open);
          if (!open && !builderOpen) {
            setEditingPlan(null);
            setPlanMetaMode("create");
            setPlanMetaTitle("");
            setPlanMetaDescription("");
          }
        }}
        direction="bottom"
      >
        <DrawerContent className="mx-auto max-w-lg rounded-t-[2.5rem]">
          <DrawerHeader className="px-6 py-5 text-left">
            <DrawerTitle>
              {planMetaMode === "edit"
                ? t("coach.mealPlans.drawers.meta.editTitle")
                : t("coach.mealPlans.drawers.meta.createTitle")}
            </DrawerTitle>
            <DrawerDescription>
              {planMetaMode === "edit"
                ? t("coach.mealPlans.drawers.meta.description.edit")
                : t("coach.mealPlans.drawers.meta.description.create")}
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="coach-plan-name">
                {t("coach.mealPlans.drawers.meta.nameLabel")}
              </Label>
              <Input
                id="coach-plan-name"
                autoFocus
                value={planMetaTitle}
                onChange={(event) => setPlanMetaTitle(event.target.value)}
                placeholder={t(
                  "coach.mealPlans.drawers.meta.namePlaceholder",
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coach-plan-description">
                {t("coach.mealPlans.drawers.meta.descLabel")}
              </Label>
              <Textarea
                id="coach-plan-description"
                value={planMetaDescription}
                onChange={(event) =>
                  setPlanMetaDescription(event.target.value)
                }
                placeholder={t(
                  "coach.mealPlans.drawers.meta.descPlaceholder",
                )}
                className="min-h-[120px] resize-none"
              />
            </div>
          </div>
          <DrawerFooter className="flex flex-col gap-2 px-6 py-4">
            <Button onClick={continueMetaFlow} className="w-full">
              {planMetaMode === "edit"
                ? t("coach.mealPlans.drawers.meta.saveEdit")
                : t("coach.mealPlans.drawers.meta.continue")}
            </Button>
            {planMetaMode === "edit" && (
              <Button
                variant="secondary"
                onClick={handleSaveMetadata}
                className="w-full"
              >
                {t("coach.mealPlans.drawers.meta.saveOnly")}
              </Button>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={assignDrawerOpen}
        onOpenChange={setAssignDrawerOpen}
        direction="bottom"
      >
        <DrawerContent className="mx-auto max-w-lg rounded-t-[2.5rem]">
          <DrawerHeader className="px-6 py-5 text-left">
            <DrawerTitle>
              {t("coach.mealPlans.drawers.assign.title")}
            </DrawerTitle>
            <DrawerDescription>
              {t("coach.mealPlans.drawers.assign.description", {
                title: get(assigningPlan, "title") || "Template",
              })}
            </DrawerDescription>
            <div className="mt-4">
              <InputGroup>
                <InputGroupAddon>
                  <SearchIcon className="size-4 text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder={t(
                    "coach.mealPlans.drawers.assign.searchPlaceholder",
                  )}
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
              </InputGroup>
            </div>
          </DrawerHeader>
          <div className="max-h-[55vh] space-y-3 overflow-y-auto px-6 py-6 pt-2">
            {clients.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                {t("coach.mealPlans.drawers.assign.noClients")}
              </div>
            ) : (
              filter(clients, (client) =>
                  toLower(client.name).includes(toLower(clientSearch)),
                ).map((client) => {
                  const selected = selectedClientIds.includes(client.id);
                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => toggleClient(client.id)}
                      className={
                        selected
                          ? "flex w-full items-center justify-between rounded-2xl border border-primary bg-primary/5 px-4 py-3 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                          : "flex w-full items-center justify-between rounded-2xl border border-transparent bg-muted/20 px-4 py-3 text-left transition-all hover:bg-muted/30 hover:scale-[1.01] active:scale-[0.99]"
                      }
                    >
                      <div>
                        <p className="text-sm font-bold tracking-tight">
                          {client.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {client.status === "active"
                            ? t(
                                "coach.mealPlans.drawers.assign.status.active",
                              )
                            : client.status === "paused"
                              ? t(
                                  "coach.mealPlans.drawers.assign.status.paused",
                                )
                              : t(
                                  "coach.mealPlans.drawers.assign.status.inactive",
                                )}
                        </p>
                      </div>
                      <Badge
                        variant={selected ? "default" : "outline"}
                        className="rounded-full px-3"
                      >
                        {selected
                          ? t(
                              "coach.mealPlans.drawers.assign.selection.selected",
                            )
                          : t(
                              "coach.mealPlans.drawers.assign.selection.unselected",
                            )}
                      </Badge>
                    </button>
                  );
                })
            )}
          </div>
          <DrawerFooter className="flex flex-col gap-2 px-6 py-4">
            <Button
              disabled={isAssigning}
              onClick={handleSaveAssign}
              className="w-full"
            >
              {t("coach.mealPlans.drawers.assign.submit")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <DeleteAlert
        plan={deleteCandidate}
        open={Boolean(deleteCandidate)}
        onOpenChange={(open) => !open && setDeleteCandidate(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      <AiGeneratorDrawer
        open={aiGeneratorOpen}
        onOpenChange={setAiGeneratorOpen}
        foods={foods}
        onGenerate={handleAiGenerate}
      />

      <MealPlanBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        initialData={builderInitialData}
        onSave={handleBuilderSave}
        onClose={() => {
          setBuilderOpen(false);
          setEditingPlan(null);
          setBuilderInitialData({});
          setPlanMetaMode("create");
          setPlanMetaTitle("");
          setPlanMetaDescription("");
        }}
      />
    </>
  );
};

export default MealPlansListIndex;
