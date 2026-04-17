import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  filter,
  find,
  get,
  includes,
  map,
  size,
  some,
  toLower,
  trim,
} from "lodash";
import {
  HistoryIcon,
  ZapIcon,
  CheckIcon,
  RotateCcwIcon,
  SearchIcon,
} from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { toast } from "sonner";
import WorkoutPlanActionsMenu from "./components/workout-plan-actions-menu";
import { useBreadcrumbStore } from "@/store";
import { useCoachWorkoutPlans } from "@/hooks/app/use-coach.js";
import PageTransition from "@/components/page-transition";
import WorkoutPlanBuilder from "@/components/workout-plan-builder/index.jsx";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DataGrid,
  DataGridColumnHeader,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import { Filters } from "@/components/reui/filters.jsx";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const WORKOUT_PLAN_SORT_FIELDS = [
  "name",
  "source",
  "folder",
  "totalExercises",
  "daysWithWorkouts",
  "assignedClientsCount",
  "updatedAt",
];
const WORKOUT_PLAN_SORT_DIRECTIONS = ["asc", "desc"];
const SERVER_WORKOUT_PLAN_SORT_FIELDS = [
  "name",
  "source",
  "folder",
  "updatedAt",
  "createdAt",
];

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("uz-UZ", {
        dateStyle: "medium",
      }).format(new Date(value))
    : "—";

const parseTags = (value) =>
  trim(value)
    ? trim(value)
        .split(",")
        .map((item) => trim(item))
        .filter(Boolean)
    : [];

export default function CoachWorkoutPlansContainer() {
  const { setBreadcrumbs } = useBreadcrumbStore();

  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [sourceFilter, setSourceFilter] = useQueryState(
    "source",
    parseAsStringEnum(["all", "manual", "ai", "rollback"]).withDefault("all"),
  );
  const [assignmentFilter, setAssignmentFilter] = useQueryState(
    "assigned",
    parseAsStringEnum(["all", "assigned", "unassigned"]).withDefault("all"),
  );
  const [folderFilter, setFolderFilter] = useQueryState(
    "folder",
    parseAsString.withDefault("all"),
  );
  const [tagFilter, setTagFilter] = useQueryState(
    "tag",
    parseAsString.withDefault("all"),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringEnum(WORKOUT_PLAN_SORT_FIELDS).withDefault("updatedAt"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(WORKOUT_PLAN_SORT_DIRECTIONS).withDefault("desc"),
  );
  const queryParams = React.useMemo(
    () => ({
      q: trim(search) || undefined,
      source: sourceFilter !== "all" ? sourceFilter : undefined,
      folder: folderFilter !== "all" ? folderFilter : undefined,
      tag: tagFilter !== "all" ? tagFilter : undefined,
      sortBy: SERVER_WORKOUT_PLAN_SORT_FIELDS.includes(sortBy)
        ? sortBy
        : "updatedAt",
      sortDir,
    }),
    [folderFilter, search, sortBy, sortDir, sourceFilter, tagFilter],
  );
  const {
    workoutPlans,
    clients,
    folders,
    tags,
    isLoading,
    isFetching,
    refetch,
    createWorkoutPlan,
    updateWorkoutPlan,
    assignWorkoutPlan,
    previewWorkoutPlanAssignment,
    getWorkoutPlanVersions,
    rollbackWorkoutPlanVersion,
    deleteWorkoutPlan,
    isAssigning,
    isPreviewingAssignment,
    isRollingBack,
    isDeleting,
  } = useCoachWorkoutPlans(queryParams);

  const [builderOpen, setBuilderOpen] = React.useState(false);
  const [builderInitialData, setBuilderInitialData] = React.useState(null);
  const [editingPlan, setEditingPlan] = React.useState(null);
  const [nameDrawerOpen, setNameDrawerOpen] = React.useState(false);
  const [newPlanName, setNewPlanName] = React.useState("");
  const [newPlanDescription, setNewPlanDescription] = React.useState("");
  const [newPlanFolder, setNewPlanFolder] = React.useState("");
  const [newPlanTags, setNewPlanTags] = React.useState("");
  const [planMetaMode, setPlanMetaMode] = React.useState("create");
  const [assignDrawerOpen, setAssignDrawerOpen] = React.useState(false);
  const [assigningPlan, setAssigningPlan] = React.useState(null);
  const [selectedClientIds, setSelectedClientIds] = React.useState([]);
  const [clientSearch, setClientSearch] = React.useState("");
  const [assignPreview, setAssignPreview] = React.useState(null);
  const [versionDrawerOpen, setVersionDrawerOpen] = React.useState(false);
  const [versionPlan, setVersionPlan] = React.useState(null);
  const [versionLibrary, setVersionLibrary] = React.useState(null);
  const [versionsLoading, setVersionsLoading] = React.useState(false);
  const [deleteCandidate, setDeleteCandidate] = React.useState(null);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: "Coach" },
      { url: "/coach/workout-plans", title: "Workout rejalari" },
    ]);
  }, [setBreadcrumbs]);

  const deferredSearch = React.useDeferredValue(search);

  const filteredPlans = React.useMemo(() => {
    return filter(workoutPlans, (plan) => {
      const searchLower = toLower(trim(deferredSearch));
      if (searchLower) {
        const matchesName = includes(toLower(plan.name), searchLower);
        const matchesFolder = includes(toLower(plan.folder), searchLower);
        const matchesTag = some(plan.tags, (tag) =>
          includes(toLower(tag), searchLower),
        );
        const matchesClient = some(plan.assignedClients, (c) =>
          includes(toLower(c.name), searchLower),
        );
        if (!matchesName && !matchesFolder && !matchesTag && !matchesClient) {
          return false;
        }
      }

      if (sourceFilter !== "all" && plan.source !== sourceFilter) {
        return false;
      }

      if (folderFilter !== "all" && plan.folder !== folderFilter) {
        return false;
      }

      if (tagFilter !== "all" && !includes(plan.tags, tagFilter)) {
        return false;
      }

      if (assignmentFilter !== "all") {
        const isAssigned = size(plan.assignedClients) > 0;
        if (assignmentFilter === "assigned" && !isAssigned) return false;
        if (assignmentFilter === "unassigned" && isAssigned) return false;
      }

      return true;
    });
  }, [
    assignmentFilter,
    deferredSearch,
    folderFilter,
    sourceFilter,
    tagFilter,
    workoutPlans,
  ]);

  const sorting = React.useMemo(
    () => [{ id: sortBy, desc: sortDir === "desc" }],
    [sortBy, sortDir],
  );

  const filterFields = React.useMemo(
    () => [
      {
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Reja nomi bo'yicha qidiring",
      },
      {
        label: "Manba",
        key: "source",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha manbalar" },
          { value: "manual", label: "Manual" },
          { value: "ai", label: "AI" },
          { value: "rollback", label: "Rollback" },
        ],
      },
      {
        label: "Folder",
        key: "folder",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha folderlar" },
          ...folders.map((folder) => ({ value: folder, label: folder })),
        ],
      },
      {
        label: "Tag",
        key: "tag",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha taglar" },
          ...tags.map((tag) => ({ value: tag, label: tag })),
        ],
      },
      {
        label: "Biriktirish",
        key: "assigned",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barchasi" },
          { value: "assigned", label: "Mijozga biriktirilgan" },
          { value: "unassigned", label: "Bo'sh" },
        ],
      },
    ],
    [folders, tags],
  );

  const activeFilters = React.useMemo(() => {
    const items = [];
    if (trim(search)) {
      items.push({
        id: "q",
        field: "q",
        operator: "contains",
        values: [search],
      });
    }
    if (sourceFilter !== "all") {
      items.push({
        id: "source",
        field: "source",
        operator: "is",
        values: [sourceFilter],
      });
    }
    if (folderFilter !== "all") {
      items.push({
        id: "folder",
        field: "folder",
        operator: "is",
        values: [folderFilter],
      });
    }
    if (tagFilter !== "all") {
      items.push({
        id: "tag",
        field: "tag",
        operator: "is",
        values: [tagFilter],
      });
    }
    if (assignmentFilter !== "all") {
      items.push({
        id: "assigned",
        field: "assigned",
        operator: "is",
        values: [assignmentFilter],
      });
    }
    return items;
  }, [assignmentFilter, folderFilter, search, sourceFilter, tagFilter]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch = get(
        find(nextFilters, { field: "q" }),
        "values[0]",
        "",
      );
      const nextSource = get(
        find(nextFilters, { field: "source" }),
        "values[0]",
        "all",
      );
      const nextFolder = get(
        find(nextFilters, { field: "folder" }),
        "values[0]",
        "all",
      );
      const nextTag = get(
        find(nextFilters, { field: "tag" }),
        "values[0]",
        "all",
      );
      const nextAssigned = get(
        find(nextFilters, { field: "assigned" }),
        "values[0]",
        "all",
      );

      React.startTransition(() => {
        void setSearch(nextSearch);
        void setSourceFilter(nextSource);
        void setFolderFilter(nextFolder);
        void setTagFilter(nextTag);
        void setAssignmentFilter(nextAssigned);
      });
    },
    [
      setAssignmentFilter,
      setFolderFilter,
      setSearch,
      setSourceFilter,
      setTagFilter,
    ],
  );

  const handleSortingChange = React.useCallback(
    (updater) => {
      const nextSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      const nextSort = get(nextSorting, "[0]");
      React.startTransition(() => {
        if (!nextSort) {
          void setSortBy("updatedAt");
          void setSortDir("desc");
          return;
        }
        void setSortBy(nextSort.id);
        void setSortDir(nextSort.desc ? "desc" : "asc");
      });
    },
    [setSortBy, setSortDir, sorting],
  );

  const openNewPlan = React.useCallback(() => {
    setEditingPlan(null);
    setBuilderInitialData(null);
    setPlanMetaMode("create");
    setNewPlanName("");
    setNewPlanDescription("");
    setNewPlanFolder("");
    setNewPlanTags("");
    setNameDrawerOpen(true);
  }, []);

  const handleInitialCreate = React.useCallback(async () => {
    if (!trim(newPlanName)) {
      toast.error("Reja nomini kiriting");
      return;
    }

    try {
      const payload = {
        name: trim(newPlanName),
        description: trim(newPlanDescription),
        folder: trim(newPlanFolder),
        tags: parseTags(newPlanTags),
        schedule: [],
      };

      const newPlan = await createWorkoutPlan(payload);

      setEditingPlan(newPlan);
      setBuilderInitialData(newPlan);
      setNameDrawerOpen(false);
      setBuilderOpen(true);
      toast.success("Workout reja yaratildi");
    } catch (error) {
      toast.error("Reja yaratishda xatolik yuz berdi");
    }
  }, [
    newPlanName,
    newPlanDescription,
    newPlanFolder,
    newPlanTags,
    createWorkoutPlan,
  ]);

  const handleSaveMetadata = React.useCallback(async () => {
    if (!trim(newPlanName)) {
      toast.error("Reja nomini kiriting");
      return;
    }

    if (!get(editingPlan, "id")) return;

    try {
      const payload = {
        name: trim(newPlanName),
        description: trim(newPlanDescription),
        folder: trim(newPlanFolder),
        tags: parseTags(newPlanTags),
        schedule: editingPlan.schedule || [],
      };

      await updateWorkoutPlan(editingPlan.id, payload);
      setNameDrawerOpen(false);
      setEditingPlan(null);
      setNewPlanName("");
      setNewPlanDescription("");
      setNewPlanFolder("");
      setNewPlanTags("");
      toast.success("Reja ma'lumotlari yangilandi");
    } catch (error) {
      toast.error("Ma'lumotlarni saqlashda xatolik yuz berdi");
    }
  }, [
    newPlanName,
    newPlanDescription,
    newPlanFolder,
    newPlanTags,
    editingPlan,
    updateWorkoutPlan,
  ]);

  const continueMetaFlow = React.useCallback(() => {
    if (!trim(newPlanName)) {
      toast.error("Reja nomini kiriting");
      return;
    }

    setBuilderInitialData({
      ...(editingPlan || {}),
      name: trim(newPlanName),
      description: trim(newPlanDescription),
      folder: trim(newPlanFolder),
      tags: parseTags(newPlanTags),
      schedule: get(editingPlan, "schedule") || [],
    });
    setNameDrawerOpen(false);
    setBuilderOpen(true);
  }, [
    editingPlan,
    newPlanDescription,
    newPlanFolder,
    newPlanName,
    newPlanTags,
  ]);

  const openEdit = React.useCallback((plan) => {
    setEditingPlan(plan);
    setPlanMetaMode("edit");
    setNewPlanName(plan.name || "");
    setNewPlanDescription(plan.description || "");
    setNewPlanFolder(plan.folder || "");
    setNewPlanTags((plan.tags || []).join(", "));
    setNameDrawerOpen(true);
  }, []);

  const handleBuilderSave = React.useCallback(
    async (plan) => {
      const payload = {
        name: plan.name,
        description: plan.description,
        folder: trim(newPlanFolder),
        tags: parseTags(newPlanTags),
        schedule: plan.schedule,
      };

      if (get(editingPlan, "id")) {
        await updateWorkoutPlan(editingPlan.id, payload);
        toast.success("Workout reja saqlandi");
      }

      setBuilderOpen(false);
      setEditingPlan(null);
      setBuilderInitialData(null);
      setNewPlanName("");
      setNewPlanDescription("");
      setNewPlanFolder("");
      setNewPlanTags("");
    },
    [editingPlan, newPlanFolder, newPlanTags, updateWorkoutPlan],
  );

  const openAssign = React.useCallback((plan) => {
    setAssigningPlan(plan);
    setSelectedClientIds(map(plan.assignedClients, (item) => item.id));
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
    await assignWorkoutPlan(assigningPlan.id, selectedClientIds);
    toast.success("Mijozlar yangilandi");
    setAssignDrawerOpen(false);
  }, [assignWorkoutPlan, assigningPlan, selectedClientIds]);

  const handleDelete = React.useCallback(async () => {
    if (!deleteCandidate) {
      return;
    }

    await deleteWorkoutPlan(deleteCandidate.id);
    toast.success("Workout template o'chirildi");
    setDeleteCandidate(null);
  }, [deleteCandidate, deleteWorkoutPlan]);

  const openVersions = React.useCallback(
    async (plan) => {
      setVersionPlan(plan);
      setVersionLibrary(null);
      setVersionDrawerOpen(true);
      setVersionsLoading(true);

      try {
        const versions = await getWorkoutPlanVersions(plan.id);
        setVersionLibrary(versions);
      } catch (error) {
        toast.error("Version tarixini olishda xatolik yuz berdi");
      } finally {
        setVersionsLoading(false);
      }
    },
    [getWorkoutPlanVersions],
  );

  const handleRollbackVersion = React.useCallback(
    async (versionId) => {
      if (!versionPlan) {
        return;
      }

      await rollbackWorkoutPlanVersion(versionPlan.id, versionId);
      toast.success("Workout template version rollback qilindi");
      await openVersions(versionPlan);
    },
    [openVersions, rollbackWorkoutPlanVersion, versionPlan],
  );

  React.useEffect(() => {
    let active = true;

    if (!assignDrawerOpen || !assigningPlan || selectedClientIds.length === 0) {
      setAssignPreview(null);
      return () => {
        active = false;
      };
    }

    previewWorkoutPlanAssignment(assigningPlan.id, selectedClientIds)
      .then((preview) => {
        if (active) {
          setAssignPreview(preview);
        }
      })
      .catch(() => {
        if (active) {
          setAssignPreview(null);
        }
      });

    return () => {
      active = false;
    };
  }, [
    assignDrawerOpen,
    assigningPlan,
    previewWorkoutPlanAssignment,
    selectedClientIds,
  ]);

  const columns = React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Template" />
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold tracking-tight">{row.original.name}</p>
              <Badge variant="outline">{row.original.source || "manual"}</Badge>
              {row.original.folder ? (
                <Badge variant="secondary">{row.original.folder}</Badge>
              ) : null}
            </div>
            {row.original.description && (
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {row.original.description}
              </p>
            )}
            {row.original.tags?.length ? (
              <div className="flex flex-wrap gap-1">
                {row.original.tags.slice(0, 3).map((tag) => (
                  <Badge key={`${row.original.id}-${tag}`} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "totalExercises",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Mashqlar" />
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className="bg-primary/5 text-primary border-primary/10 font-bold"
          >
            <ZapIcon className="mr-1 size-3" />
            {row.original.totalExercises} ta
          </Badge>
        ),
      },
      {
        accessorKey: "daysWithWorkouts",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Kunlar" />
        ),
        enableSorting: true,
        cell: ({ row }) => `${row.original.daysWithWorkouts} kun`,
      },
      {
        id: "assignedClientsCount",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Mijozlar" />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const count = size(row.original.assignedClients);
          return count > 0 ? (
            <Badge
              variant="secondary"
              className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold"
            >
              {count} ta mijoz
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs italic">
              Biriktirilmagan
            </span>
          );
        },
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Yangilandi" />
        ),
        enableSorting: true,
        cell: ({ row }) => formatDate(row.original.updatedAt),
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: ({ row }) => {
          const plan = row.original;

          return (
            <div
              className="flex items-center justify-end"
              onClick={(event) => event.stopPropagation()}
            >
              <WorkoutPlanActionsMenu
                plan={plan}
                onEdit={openEdit}
                onAssign={openAssign}
                onVersions={openVersions}
                onDelete={setDeleteCandidate}
                isDeleting={isDeleting}
              />
            </div>
          );
        },
      },
    ],
    [isDeleting, openAssign, openEdit, openVersions],
  );

  const table = useReactTable({
    data: filteredPlans,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: handleSortingChange,
    state: { sorting },
  });

  return (
    <>
      <PageTransition>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                <ZapIcon className="size-6 text-primary" />
                Workout rejalari
              </h1>
              <p className="text-muted-foreground">
                Mashg'ulot template'larini boshqarish.
              </p>
            </div>
            <Button onClick={openNewPlan}>Yangi template</Button>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Filters
              fields={filterFields}
              filters={activeFilters}
              onChange={handleFiltersChange}
              className="flex-1"
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
                recordCount={filteredPlans.length}
                onRowClick={openEdit}
              >
                <DataGridTable />
              </DataGrid>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
        </div>
      </PageTransition>

      {/* Name & Description Drawer */}
      <Drawer
        open={nameDrawerOpen}
        onOpenChange={setNameDrawerOpen}
        direction="bottom"
      >
        <DrawerContent className="mx-auto max-w-lg rounded-t-[2.5rem]">
          <DrawerHeader className="px-6 py-5 text-left">
            <DrawerTitle>Reja yaratish</DrawerTitle>
            <DrawerDescription>
              Reja nomi va qisqacha tavsifini kiriting. Keyin haftalik builder
              ochiladi.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Reja nomi</Label>
              <Input
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                placeholder="Masalan: Full Body A"
              />
            </div>

            <div className="space-y-2">
              <Label>Tavsif (ixtiyoriy)</Label>
              <Textarea
                value={newPlanDescription}
                onChange={(e) => setNewPlanDescription(e.target.value)}
                placeholder="Ushbu reja haqida batafsil ma'lumot..."
                className="min-h-[100px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Folder</Label>
              <Input
                value={newPlanFolder}
                onChange={(event) => setNewPlanFolder(event.target.value)}
                placeholder="Masalan: Hypertrophy, Starter, Premium"
              />
            </div>
            <div className="space-y-2">
              <Label>Taglar</Label>
              <Input
                value={newPlanTags}
                onChange={(event) => setNewPlanTags(event.target.value)}
                placeholder="Vergul bilan: strength, 4-week, home"
              />
            </div>
          </div>
          <DrawerFooter className="px-6 py-4 flex flex-col gap-2">
            <Button
              onClick={
                planMetaMode === "create"
                  ? handleInitialCreate
                  : continueMetaFlow
              }
              className="w-full"
            >
              {planMetaMode === "create" ? "Yaratish" : "Saqlash va tahrirlash"}
            </Button>
            {planMetaMode === "edit" && (
              <Button
                variant="secondary"
                onClick={handleSaveMetadata}
                className="w-full"
              >
                Faqat ma'lumotlarni saqlash
              </Button>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Assign Drawer */}
      <Drawer
        open={assignDrawerOpen}
        onOpenChange={setAssignDrawerOpen}
        direction="bottom"
      >
        <DrawerContent className="mx-auto max-w-lg rounded-t-[2.5rem]">
          <DrawerHeader className="px-6 py-5 text-left">
            <DrawerTitle>Mijozlarga biriktirish</DrawerTitle>
            <DrawerDescription>
              Ushbu rejani qaysi mijozlarga biriktirmoqchisiz?
            </DrawerDescription>
            <div className="mt-4">
              <InputGroup>
                <InputGroupAddon>
                  <SearchIcon className="size-4 text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Mijoz qidirish..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
              </InputGroup>
            </div>
          </DrawerHeader>
          <div className="px-6 pb-2">
            <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">Assign preview</span>
                <Badge variant="secondary">
                  {isPreviewingAssignment
                    ? "Hisoblanmoqda"
                    : `${selectedClientIds.length} tanlangan`}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-background p-2">
                  <p className="font-bold">
                    {get(
                      assignPreview,
                      "summary.total",
                      selectedClientIds.length,
                    )}
                  </p>
                  <p className="text-muted-foreground">Jami</p>
                </div>
                <div className="rounded-xl bg-background p-2">
                  <p className="font-bold">
                    {get(
                      assignPreview,
                      "summary.newAssignments",
                      selectedClientIds.length,
                    )}
                  </p>
                  <p className="text-muted-foreground">Yangi</p>
                </div>
                <div className="rounded-xl bg-background p-2">
                  <p className="font-bold">
                    {get(assignPreview, "summary.alreadyAssigned", 0)}
                  </p>
                  <p className="text-muted-foreground">Bor edi</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-3 max-h-[50vh] overflow-y-auto pt-2">
            {size(
              filter(clients, (client) =>
                includes(toLower(client.name), toLower(clientSearch)),
              ),
            ) === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                Mijoz topilmadi.
              </div>
            ) : (
              map(
                filter(clients, (client) =>
                  includes(toLower(client.name), toLower(clientSearch)),
                ),
                (client) => (
                  <button
                    key={client.id}
                    onClick={() => toggleClient(client.id)}
                    className={cn(
                      "flex w-full items-center justify-between p-4 transition-all rounded-2xl border",
                      includes(selectedClientIds, client.id)
                        ? "border-primary bg-primary/5 shadow-sm scale-[1.01]"
                        : "hover:bg-muted/50 border-transparent bg-muted/20 hover:scale-[1.01] active:scale-[0.99]",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "size-4 rounded-full border-2 flex items-center justify-center transition-all",
                          includes(selectedClientIds, client.id)
                            ? "bg-primary border-primary scale-110"
                            : "border-muted-foreground/30",
                        )}
                      >
                        {includes(selectedClientIds, client.id) && (
                          <CheckIcon className="size-2.5 text-white stroke-[4]" />
                        )}
                      </div>
                      <div className="text-left min-w-0">
                        <p className="font-bold text-sm truncate tracking-tight">
                          {client.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                          {client.status === "active"
                            ? "Faol"
                            : client.status === "paused"
                              ? "Pauza"
                              : "Faolsiz"}
                        </p>
                      </div>
                    </div>
                  </button>
                ),
              )
            )}
          </div>
          <DrawerFooter className="px-6 py-4">
            <Button
              onClick={handleSaveAssign}
              disabled={isAssigning}
              className="w-full"
            >
              Saqlash
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

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

      <Drawer
        open={versionDrawerOpen}
        onOpenChange={setVersionDrawerOpen}
        direction="right"
      >
        <DrawerContent className="ml-auto h-full max-w-xl rounded-none">
          <DrawerHeader className="px-6 py-5 text-left">
            <DrawerTitle className="flex items-center gap-2">
              <HistoryIcon className="size-5" />
              Version tarixi
            </DrawerTitle>
            <DrawerDescription>
              {get(versionPlan, "name") || "Template"} uchun oxirgi 20 ta
              snapshot va rollback.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-4 px-6">
            {versionsLoading ? (
              <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Versionlar yuklanmoqda...
              </div>
            ) : (
              <>
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-sm font-bold">
                    Current v
                    {get(
                      versionLibrary,
                      "currentVersion",
                      get(versionPlan, "version", 1),
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {get(
                      versionLibrary,
                      "current.name",
                      get(versionPlan, "name", ""),
                    )}
                  </p>
                </div>
                {get(versionLibrary, "versions", []).length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Oldingi version yo'q.
                  </div>
                ) : (
                  get(versionLibrary, "versions", []).map((version) => (
                    <div key={version.id} className="rounded-2xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">
                            v{version.version}: {version.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(version.createdAt)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isRollingBack}
                          onClick={() => handleRollbackVersion(version.id)}
                        >
                          Rollback
                        </Button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {version.compareToCurrent?.nameChanged ? (
                          <Badge variant="secondary">nom o'zgargan</Badge>
                        ) : null}
                        {version.compareToCurrent?.folderChanged ? (
                          <Badge variant="secondary">folder o'zgargan</Badge>
                        ) : null}
                        {version.compareToCurrent?.tagsChanged ? (
                          <Badge variant="secondary">tag o'zgargan</Badge>
                        ) : null}
                        {version.compareToCurrent?.difficultyChanged ? (
                          <Badge variant="secondary">
                            difficulty o'zgargan
                          </Badge>
                        ) : null}
                        <Badge variant="outline">
                          {get(
                            version,
                            "compareToCurrent.content.changedKeysCount",
                            0,
                          )}{" "}
                          kun farq
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <AlertDialog
        open={!!deleteCandidate}
        onOpenChange={() => setDeleteCandidate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>O'chirishni tasdiqlang</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-white"
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
