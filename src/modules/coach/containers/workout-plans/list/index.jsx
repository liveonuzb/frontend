import {
  filter,
  get,
  includes,
  size,
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
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { RotateCcwIcon } from "lucide-react";
import CoachErrorState from "../../../components/coach-error-state";
import { useBreadcrumbStore } from "@/store";
import { useCoachWorkoutPlans } from "@/hooks/app/use-coach.js";
import PageTransition from "@/components/page-transition";
import WorkoutPlanBuilder from "@/components/workout-plan-builder/index.jsx";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import { cn } from "@/lib/utils";
import WorkoutPlanHeader from "@/modules/coach/containers/workout-plans/components/workout-plan-header.jsx";
import WorkoutPlanMetaDrawer from "@/modules/coach/containers/workout-plans/components/workout-plan-meta-drawer.jsx";
import WorkoutPlanAssignDrawer from "@/modules/coach/containers/workout-plans/components/workout-plan-assign-drawer.jsx";
import { useColumns } from "./columns.jsx";
import { Filter, useWorkoutPlanFilters } from "./filter.jsx";
import { DeleteAlert } from "./delete-alert.jsx";

const WorkoutPlansListIndex = () => {
  const { t } = useTranslation();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const {
    workoutPlans,
    clients,
    isLoading,
    isFetching,
    isError,
    refetch,
    createWorkoutPlan,
    updateWorkoutPlan,
    assignWorkoutPlan,
    deleteWorkoutPlan,
    isAssigning,
  } = useCoachWorkoutPlans();

  const {
    search,
    assignmentFilter,
    sorting,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  } = useWorkoutPlanFilters();

  const [builderOpen, setBuilderOpen] = React.useState(false);
  const [builderInitialData, setBuilderInitialData] = React.useState(null);
  const [editingPlan, setEditingPlan] = React.useState(null);
  const [nameDrawerOpen, setNameDrawerOpen] = React.useState(false);
  const [newPlanName, setNewPlanName] = React.useState("");
  const [newPlanDescription, setNewPlanDescription] = React.useState("");
  const [planMetaMode, setPlanMetaMode] = React.useState("create");
  const [assignDrawerOpen, setAssignDrawerOpen] = React.useState(false);
  const [assigningPlan, setAssigningPlan] = React.useState(null);
  const [selectedClientIds, setSelectedClientIds] = React.useState([]);
  const [clientSearch, setClientSearch] = React.useState("");
  const [deleteCandidate, setDeleteCandidate] = React.useState(null);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: t("coach.sidebar.main") },
      {
        url: "/coach/workout-plans",
        title: t("coach.sidebar.workoutPlans"),
      },
    ]);
  }, [setBreadcrumbs, t]);

  const deferredSearch = React.useDeferredValue(search);

  const filteredPlans = React.useMemo(() => {
    return filter(workoutPlans, (plan) => {
      const searchLower = toLower(trim(deferredSearch));
      if (searchLower) {
        const matchesName = includes(
          toLower(get(plan, "name", "")),
          searchLower,
        );
        const matchesClient = some(
          get(plan, "assignedClients", []),
          (c) => includes(toLower(get(c, "name", "")), searchLower),
        );
        if (!matchesName && !matchesClient) return false;
      }

      if (assignmentFilter !== "all") {
        const isAssigned = size(get(plan, "assignedClients", [])) > 0;
        if (assignmentFilter === "assigned" && !isAssigned) return false;
        if (assignmentFilter === "unassigned" && isAssigned) return false;
      }

      return true;
    });
  }, [assignmentFilter, deferredSearch, workoutPlans]);

  const openNewPlan = React.useCallback(() => {
    setEditingPlan(null);
    setBuilderInitialData(null);
    setPlanMetaMode("create");
    setNewPlanName("");
    setNewPlanDescription("");
    setNameDrawerOpen(true);
  }, []);

  const handleInitialCreate = React.useCallback(async () => {
    if (!trim(newPlanName)) {
      toast.error(t("coach.workoutPlans.toasts.nameRequired"));
      return;
    }
    try {
      const payload = {
        name: trim(newPlanName),
        description: trim(newPlanDescription),
        schedule: [],
      };
      const newPlan = await createWorkoutPlan(payload);
      setEditingPlan(newPlan);
      setBuilderInitialData(newPlan);
      setNameDrawerOpen(false);
      setBuilderOpen(true);
      toast.success(t("coach.workoutPlans.toasts.createSuccess"));
    } catch (error) {
      toast.error(t("coach.workoutPlans.toasts.createError"));
    }
  }, [newPlanName, newPlanDescription, createWorkoutPlan, t]);

  const handleSaveMetadata = React.useCallback(async () => {
    if (!trim(newPlanName)) {
      toast.error(t("coach.workoutPlans.toasts.nameRequired"));
      return;
    }
    if (!get(editingPlan, "id")) return;
    try {
      const payload = {
        name: trim(newPlanName),
        description: trim(newPlanDescription),
        schedule: get(editingPlan, "schedule", []),
      };
      await updateWorkoutPlan(get(editingPlan, "id"), payload);
      setNameDrawerOpen(false);
      setEditingPlan(null);
      setNewPlanName("");
      setNewPlanDescription("");
      toast.success(t("coach.workoutPlans.toasts.updateSuccess"));
    } catch (error) {
      toast.error(t("coach.workoutPlans.toasts.updateError"));
    }
  }, [newPlanName, newPlanDescription, editingPlan, updateWorkoutPlan, t]);

  const continueMetaFlow = React.useCallback(() => {
    if (!trim(newPlanName)) {
      toast.error(t("coach.workoutPlans.toasts.nameRequired"));
      return;
    }
    setBuilderInitialData({
      ...get(editingPlan, {}, {}),
      name: trim(newPlanName),
      description: trim(newPlanDescription),
      schedule: get(editingPlan, "schedule", []),
    });
    setNameDrawerOpen(false);
    setBuilderOpen(true);
  }, [editingPlan, newPlanName, newPlanDescription, t]);

  const openEdit = React.useCallback((plan) => {
    setEditingPlan(plan);
    setPlanMetaMode("edit");
    setNewPlanName(get(plan, "name", ""));
    setNewPlanDescription(get(plan, "description", ""));
    setNameDrawerOpen(true);
  }, []);

  const handleBuilderSave = React.useCallback(
    async (plan) => {
      const payload = {
        name: get(plan, "name"),
        description: get(plan, "description"),
        schedule: get(plan, "schedule"),
      };
      if (get(editingPlan, "id")) {
        await updateWorkoutPlan(get(editingPlan, "id"), payload);
        toast.success(t("coach.workoutPlans.toasts.saveSuccess"));
      }
      setBuilderOpen(false);
      setEditingPlan(null);
      setBuilderInitialData(null);
      setNewPlanName("");
      setNewPlanDescription("");
    },
    [editingPlan, updateWorkoutPlan, t],
  );

  const openAssign = React.useCallback((plan) => {
    setAssigningPlan(plan);
    setSelectedClientIds(
      (get(plan, "assignedClients", []) || []).map((item) =>
        get(item, "id"),
      ),
    );
    setAssignDrawerOpen(true);
  }, []);

  const toggleClient = React.useCallback((clientId) => {
    setSelectedClientIds((current) =>
      includes(current, clientId)
        ? filter(current, (item) => item !== clientId)
        : [...current, clientId],
    );
  }, []);

  const handleSaveAssign = React.useCallback(async () => {
    if (!assigningPlan) return;
    await assignWorkoutPlan(get(assigningPlan, "id"), selectedClientIds);
    toast.success(t("coach.workoutPlans.toasts.assignSuccess"));
    setAssignDrawerOpen(false);
  }, [assignWorkoutPlan, assigningPlan, selectedClientIds, t]);

  const handleDeleteConfirm = React.useCallback(() => {
    if (!get(deleteCandidate, "id")) return;
    deleteWorkoutPlan(get(deleteCandidate, "id"));
    setDeleteCandidate(null);
  }, [deleteCandidate, deleteWorkoutPlan]);

  const columns = useColumns({
    onEdit: openEdit,
    onAssign: openAssign,
    onDelete: setDeleteCandidate,
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
          <WorkoutPlanHeader onNewPlan={openNewPlan} />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Filter
              filterFields={filterFields}
              activeFilters={activeFilters}
              handleFiltersChange={handleFiltersChange}
            />
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
          </div>

          <DataGridContainer>
            <ScrollArea className="w-full">
              <DataGrid
                table={table}
                isLoading={isLoading}
                recordCount={size(filteredPlans)}
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

      <WorkoutPlanMetaDrawer
        open={nameDrawerOpen}
        onOpenChange={setNameDrawerOpen}
        mode={planMetaMode}
        name={newPlanName}
        setName={setNewPlanName}
        description={newPlanDescription}
        setDescription={setNewPlanDescription}
        onPrimaryAction={
          planMetaMode === "create" ? handleInitialCreate : continueMetaFlow
        }
        onSecondaryAction={
          planMetaMode === "edit" ? handleSaveMetadata : undefined
        }
      />

      <WorkoutPlanAssignDrawer
        open={assignDrawerOpen}
        onOpenChange={setAssignDrawerOpen}
        clients={clients}
        selectedClientIds={selectedClientIds}
        onToggleClient={toggleClient}
        onSave={handleSaveAssign}
        isAssigning={isAssigning}
        search={clientSearch}
        onSearchChange={setClientSearch}
      />

      <WorkoutPlanBuilder
        open={builderOpen}
        onOpenChange={(open) => {
          setBuilderOpen(open);
          if (!open) {
            setEditingPlan(null);
            setBuilderInitialData(null);
          }
        }}
        initialData={builderInitialData}
        onSave={handleBuilderSave}
        onClose={() => {
          setBuilderOpen(false);
          setEditingPlan(null);
          setBuilderInitialData(null);
        }}
        fullscreen
        lockWeekDays
      />

      <DeleteAlert
        open={!!deleteCandidate}
        onOpenChange={() => setDeleteCandidate(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default WorkoutPlansListIndex;
