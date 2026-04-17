import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  HistoryIcon,
  UtensilsCrossedIcon,
  RotateCcwIcon,
  SearchIcon,
  FlameIcon,
} from "lucide-react";
import {
  find,
  forEach,
  get,
  includes,
  slice,
  some,
  toLower,
  trim,
} from "lodash";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import MealPlanActionsMenu from "./components/meal-plan-actions-menu";
import { useBreadcrumbStore } from "@/store";
import { useCoachMealPlans } from "@/hooks/app/use-coach.js";
import PageTransition from "@/components/page-transition";
import MealPlanBuilder from "@/components/meal-plan-builder/index.jsx";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

const MEAL_PLAN_SORT_FIELDS = [
  "title",
  "source",
  "folder",
  "mealsCount",
  "daysWithMeals",
  "assignedClientsCount",
  "totalCalories",
  "updatedAt",
];
const MEAL_PLAN_SORT_DIRECTIONS = ["asc", "desc"];
const SERVER_MEAL_PLAN_SORT_FIELDS = [
  "title",
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

const calculateTotalCalories = (weeklyKanban) => {
  if (!weeklyKanban) return 0;
  let total = 0;
  forEach(Object.values(weeklyKanban), (columns) => {
    forEach(columns, (column) => {
      forEach(column.items || [], (item) => {
        total += item.cal || 0;
      });
    });
  });
  return total;
};

const parseTags = (value) =>
  trim(value)
    ? trim(value)
        .split(",")
        .map((item) => trim(item))
        .filter(Boolean)
    : [];

export default function CoachMealPlansContainer() {
  const { setBreadcrumbs } = useBreadcrumbStore();

  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [sourceFilter, setSourceFilter] = useQueryState(
    "source",
    parseAsStringEnum(["all", "manual", "ai"]).withDefault("all"),
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
    parseAsStringEnum(MEAL_PLAN_SORT_FIELDS).withDefault("updatedAt"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(MEAL_PLAN_SORT_DIRECTIONS).withDefault("desc"),
  );
  const queryParams = React.useMemo(
    () => ({
      q: trim(search) || undefined,
      source: sourceFilter !== "all" ? sourceFilter : undefined,
      folder: folderFilter !== "all" ? folderFilter : undefined,
      tag: tagFilter !== "all" ? tagFilter : undefined,
      sortBy: SERVER_MEAL_PLAN_SORT_FIELDS.includes(sortBy)
        ? sortBy
        : "updatedAt",
      sortDir,
    }),
    [folderFilter, search, sortBy, sortDir, sourceFilter, tagFilter],
  );
  const {
    mealPlans,
    clients,
    folders,
    tags,
    isLoading,
    isFetching,
    refetch,
    createMealPlan,
    updateMealPlan,
    duplicateMealPlan,
    assignMealPlan,
    previewMealPlanAssignment,
    getMealPlanVersions,
    rollbackMealPlanVersion,
    deleteMealPlan,
    isAssigning,
    isPreviewingAssignment,
    isRollingBack,
    isDeleting,
  } = useCoachMealPlans(queryParams);

  const [builderOpen, setBuilderOpen] = React.useState(false);
  const [builderInitialData, setBuilderInitialData] = React.useState({});
  const [editingPlan, setEditingPlan] = React.useState(null);
  const [metaDrawerOpen, setMetaDrawerOpen] = React.useState(false);
  const [planMetaMode, setPlanMetaMode] = React.useState("create");
  const [planMetaTitle, setPlanMetaTitle] = React.useState("");
  const [planMetaDescription, setPlanMetaDescription] = React.useState("");
  const [planMetaFolder, setPlanMetaFolder] = React.useState("");
  const [planMetaTags, setPlanMetaTags] = React.useState("");
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
      { url: "/coach/meal-plans", title: "Ovqatlanish rejalari" },
    ]);
  }, [setBreadcrumbs]);

  const deferredSearch = React.useDeferredValue(search);

  const filteredPlans = React.useMemo(() => {
    if (!mealPlans) return [];

    const plans = mealPlans.map((plan) => ({
      ...plan,
      totalCalories: calculateTotalCalories(plan.weeklyKanban),
    }));

    return plans.filter((plan) => {
      const searchLower = toLower(trim(deferredSearch));
      if (searchLower) {
        const matchesTitle = includes(toLower(plan.title), searchLower);
        const matchesFolder = includes(toLower(plan.folder), searchLower);
        const matchesTag = some(plan.tags, (tag) =>
          includes(toLower(tag), searchLower),
        );
        const matchesClient = some(plan.assignedClients, (c) =>
          includes(toLower(c.name), searchLower),
        );
        if (!matchesTitle && !matchesFolder && !matchesTag && !matchesClient) {
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
  }, [
    assignmentFilter,
    deferredSearch,
    folderFilter,
    mealPlans,
    sourceFilter,
    tagFilter,
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
          { value: "all", label: "Barcha template'lar" },
          { value: "assigned", label: "Mijozga biriktirilgan" },
          { value: "unassigned", label: "Bo'sh template" },
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

    if (assignmentFilter !== "all") {
      items.push({
        id: "assigned",
        field: "assigned",
        operator: "is",
        values: [assignmentFilter],
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
    setPlanMetaMode("create");
    setPlanMetaTitle(
      `Yangi template ${new Date().toLocaleDateString("uz-UZ")}`,
    );
    setPlanMetaDescription("");
    setPlanMetaFolder("");
    setPlanMetaTags("");
    setMetaDrawerOpen(true);
  }, []);

  const continueMetaFlow = React.useCallback(() => {
    if (!trim(planMetaTitle)) {
      toast.error("Reja nomini kiriting");
      return;
    }

    setBuilderInitialData(get(editingPlan, "weeklyKanban") || {});
    setMetaDrawerOpen(false);
    setBuilderOpen(true);
  }, [editingPlan, planMetaTitle]);

  const handleSaveMetadata = React.useCallback(async () => {
    if (!trim(planMetaTitle)) {
      toast.error("Reja nomini kiriting");
      return;
    }

    if (!get(editingPlan, "id")) return;

    try {
      const payload = {
        title: trim(planMetaTitle),
        description: trim(planMetaDescription),
        folder: trim(planMetaFolder),
        weeklyKanban: editingPlan.weeklyKanban || {},
        tags: parseTags(planMetaTags),
        source: editingPlan.source || "manual",
      };

      await updateMealPlan(editingPlan.id, payload);
      setMetaDrawerOpen(false);
      setEditingPlan(null);
      setPlanMetaTitle("");
      setPlanMetaDescription("");
      setPlanMetaFolder("");
      setPlanMetaTags("");
      toast.success("Reja ma'lumotlari yangilandi");
    } catch (error) {
      toast.error("Ma'lumotlarni saqlashda xatolik yuz berdi");
    }
  }, [
    planMetaTitle,
    planMetaDescription,
    planMetaFolder,
    planMetaTags,
    editingPlan,
    updateMealPlan,
  ]);

  const openEdit = React.useCallback((plan) => {
    setEditingPlan(plan);
    setPlanMetaMode("edit");
    setPlanMetaTitle(plan.title || "");
    setPlanMetaDescription(plan.description || "");
    setPlanMetaFolder(plan.folder || "");
    setPlanMetaTags((plan.tags || []).join(", "));
    setMetaDrawerOpen(true);
  }, []);

  const handleBuilderSave = React.useCallback(
    async (weeklyKanban) => {
      const payload = {
        title: trim(planMetaTitle),
        description: trim(planMetaDescription),
        folder: trim(planMetaFolder),
        weeklyKanban,
        tags: parseTags(planMetaTags),
        source: get(editingPlan, "source") || "manual",
      };

      if (!payload.title) {
        toast.error("Reja nomini kiriting");
        return;
      }

      if (editingPlan) {
        await updateMealPlan(editingPlan.id, payload);
        toast.success("Meal plan yangilandi");
      } else {
        await createMealPlan(payload);
        toast.success("Meal plan yaratildi");
      }

      setBuilderOpen(false);
      setEditingPlan(null);
      setBuilderInitialData({});
      setPlanMetaMode("create");
      setPlanMetaTitle("");
      setPlanMetaDescription("");
      setPlanMetaFolder("");
      setPlanMetaTags("");
    },
    [
      createMealPlan,
      editingPlan,
      planMetaDescription,
      planMetaFolder,
      planMetaTags,
      planMetaTitle,
      updateMealPlan,
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
    if (!assigningPlan) {
      return;
    }
    await assignMealPlan(assigningPlan.id, selectedClientIds);
    toast.success("Mijozlar yangilandi");
    setAssignDrawerOpen(false);
  }, [assignMealPlan, assigningPlan, selectedClientIds]);

  const handleDuplicate = React.useCallback(
    async (planId) => {
      await duplicateMealPlan(planId);
      toast.success("Plan nusxalandi");
    },
    [duplicateMealPlan],
  );

  const handleDelete = React.useCallback(async () => {
    if (!deleteCandidate) {
      return;
    }

    await deleteMealPlan(deleteCandidate.id);
    toast.success("Plan o'chirildi");
    setDeleteCandidate(null);
  }, [deleteCandidate, deleteMealPlan]);

  const openVersions = React.useCallback(
    async (plan) => {
      setVersionPlan(plan);
      setVersionLibrary(null);
      setVersionDrawerOpen(true);
      setVersionsLoading(true);

      try {
        const versions = await getMealPlanVersions(plan.id);
        setVersionLibrary(versions);
      } catch (error) {
        toast.error("Version tarixini olishda xatolik yuz berdi");
      } finally {
        setVersionsLoading(false);
      }
    },
    [getMealPlanVersions],
  );

  const handleRollbackVersion = React.useCallback(
    async (versionId) => {
      if (!versionPlan) {
        return;
      }

      await rollbackMealPlanVersion(versionPlan.id, versionId);
      toast.success("Template version rollback qilindi");
      await openVersions(versionPlan);
    },
    [openVersions, rollbackMealPlanVersion, versionPlan],
  );

  React.useEffect(() => {
    let active = true;

    if (!assignDrawerOpen || !assigningPlan || selectedClientIds.length === 0) {
      setAssignPreview(null);
      return () => {
        active = false;
      };
    }

    previewMealPlanAssignment(assigningPlan.id, selectedClientIds)
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
    previewMealPlanAssignment,
    selectedClientIds,
  ]);

  const columns = React.useMemo(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Template" />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const plan = row.original;

          return (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{plan.title}</p>
                <Badge variant="outline">
                  {plan.source === "ai" ? "AI" : "Manual"}
                </Badge>
                {plan.folder ? (
                  <Badge variant="secondary">{plan.folder}</Badge>
                ) : null}
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {plan.description || "Tavsif kiritilmagan"}
              </p>
              {plan.tags?.length ? (
                <div className="flex flex-wrap gap-1">
                  {plan.tags.slice(0, 3).map((tag) => (
                    <Badge key={`${plan.id}-${tag}`} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "mealsCount",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Ovqat" />
        ),
        enableSorting: true,
        cell: ({ row }) => `${row.original.mealsCount} ta`,
      },
      {
        accessorKey: "daysWithMeals",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Kun" />
        ),
        enableSorting: true,
        cell: ({ row }) => `${row.original.daysWithMeals} kun`,
      },
      {
        accessorKey: "totalCalories",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Kaloriya" />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const totalCal = row.getValue("totalCalories") || 0;
          return (
            <Badge
              variant="secondary"
              className="font-bold bg-orange-500/10 text-orange-600 border-orange-500/20"
            >
              <FlameIcon className="mr-1 size-3" />
              {totalCal} kkal
            </Badge>
          );
        },
      },
      {
        id: "assignedClientsCount",
        accessorFn: (row) => row.assignedClients.length,
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Biriktirilgan" />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const assignedClients = row.original.assignedClients;

          if (!assignedClients.length) {
            return <span className="text-muted-foreground">Yo'q</span>;
          }

          return (
            <div className="flex flex-wrap gap-1">
              {slice(assignedClients, 0, 2).map((client) => (
                <Badge
                  key={`${row.original.id}-${client.id}`}
                  variant="secondary"
                >
                  {client.name}
                </Badge>
              ))}
              {assignedClients.length > 2 ? (
                <Badge variant="outline">+{assignedClients.length - 2}</Badge>
              ) : null}
            </div>
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
        enableSorting: false,
        cell: ({ row }) => {
          const plan = row.original;

          return (
            <div
              className="flex items-center justify-end"
              onClick={(event) => event.stopPropagation()}
            >
              <MealPlanActionsMenu
                plan={plan}
                onEdit={openEdit}
                onAssign={openAssign}
                onVersions={openVersions}
                onDuplicate={handleDuplicate}
                onDelete={setDeleteCandidate}
                isDeleting={isDeleting}
              />
            </div>
          );
        },
      },
    ],
    [handleDuplicate, isDeleting, openAssign, openEdit, openVersions],
  );

  const table = useReactTable({
    data: filteredPlans,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: handleSortingChange,
    state: {
      sorting,
    },
  });

  return (
    <>
      <PageTransition>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                <UtensilsCrossedIcon className="size-6" />
                Ovqatlanish rejalari
              </h1>
              <p className="text-muted-foreground">
                Template yaratish, tahrirlash va clientlarga biriktirish.
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
            {!isLoading && filteredPlans.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                Template topilmadi.
              </div>
            ) : null}
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
            setPlanMetaFolder("");
            setPlanMetaTags("");
          }
        }}
        direction="bottom"
      >
        <DrawerContent className="mx-auto max-w-lg rounded-t-[2.5rem]">
          <DrawerHeader className="px-6 py-5 text-left">
            <DrawerTitle>
              {planMetaMode === "edit"
                ? "Template ma'lumotlari"
                : "Yangi template"}
            </DrawerTitle>
            <DrawerDescription>
              {planMetaMode === "edit"
                ? "Nom va izohni yangilang, keyin builderda tarkibni tahrir qiling."
                : "Avval template nomi va izohini kiriting, keyin builder ochiladi."}
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coach-plan-name">Template nomi</Label>
              <Input
                id="coach-plan-name"
                autoFocus
                value={planMetaTitle}
                onChange={(event) => setPlanMetaTitle(event.target.value)}
                placeholder="Masalan: Vazn yo'qotish rejasi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coach-plan-description">Izoh</Label>
              <Textarea
                id="coach-plan-description"
                value={planMetaDescription}
                onChange={(event) => setPlanMetaDescription(event.target.value)}
                placeholder="Template maqsadi yoki qisqacha tavsifini yozing"
                className="min-h-[120px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coach-plan-folder">Folder</Label>
              <Input
                id="coach-plan-folder"
                value={planMetaFolder}
                onChange={(event) => setPlanMetaFolder(event.target.value)}
                placeholder="Masalan: Fat loss, Premium, Boshlovchi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coach-plan-tags">Taglar</Label>
              <Input
                id="coach-plan-tags"
                value={planMetaTags}
                onChange={(event) => setPlanMetaTags(event.target.value)}
                placeholder="Vergul bilan: vazn, 7-kun, low-carb"
              />
            </div>
          </div>
          <DrawerFooter className="px-6 py-4 flex flex-col gap-2">
            <Button onClick={continueMetaFlow} className="w-full">
              {planMetaMode === "edit"
                ? "Saqlash va tahrirlash"
                : "Saqlash va davom etish"}
            </Button>
            {planMetaMode === "edit" && (
              <Button
                variant="secondary"
                onClick={handleSaveMetadata}
                className="w-full"
              >
                Faqat ma&apos;lumotlarni saqlash
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
            <DrawerTitle>Mijozlarga biriktirish</DrawerTitle>
            <DrawerDescription>
              {get(assigningPlan, "title") || "Template"} uchun client tanlang.
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
          <div className="max-h-[55vh] space-y-3 overflow-y-auto px-6 py-6 pt-2">
            {clients.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                Biriktirish uchun client yo'q.
              </div>
            ) : (
              clients
                .filter((client) =>
                  toLower(client.name).includes(toLower(clientSearch)),
                )
                .map((client) => {
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
                        <p className="font-bold text-sm tracking-tight">
                          {client.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {client.status === "active"
                            ? "Faol"
                            : client.status === "paused"
                              ? "Pauza"
                              : "Faolsiz"}
                        </p>
                      </div>
                      <Badge
                        variant={selected ? "default" : "outline"}
                        className="rounded-full px-3"
                      >
                        {selected ? "Tanlangan" : "Tanlash"}
                      </Badge>
                    </button>
                  );
                })
            )}
          </div>
          <DrawerFooter className="px-6 py-4 flex flex-col gap-2">
            <Button
              disabled={isAssigning}
              onClick={handleSaveAssign}
              className="w-full"
            >
              Saqlash
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

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
              {get(versionPlan, "title") || "Template"} uchun oxirgi 20 ta
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
                      "current.title",
                      get(versionPlan, "title", ""),
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
                            v{version.version}: {version.title}
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
                        {version.compareToCurrent?.titleChanged ? (
                          <Badge variant="secondary">nom o'zgargan</Badge>
                        ) : null}
                        {version.compareToCurrent?.folderChanged ? (
                          <Badge variant="secondary">folder o'zgargan</Badge>
                        ) : null}
                        {version.compareToCurrent?.tagsChanged ? (
                          <Badge variant="secondary">tag o'zgargan</Badge>
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
        open={Boolean(deleteCandidate)}
        onOpenChange={(open) => !open && setDeleteCandidate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Template'ni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              {get(deleteCandidate, "title")} o'chiriladi. Bu amalni ortga
              qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          setPlanMetaFolder("");
          setPlanMetaTags("");
        }}
      />
    </>
  );
}
