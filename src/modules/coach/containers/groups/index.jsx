import {
  filter,
  find,
  get,
  includes,
  join,
  map,
  toLower,
  trim,
} from "lodash";
import React from "react";
import { PlusIcon, SearchIcon, UsersIcon, MoreVerticalIcon, PencilIcon, Trash2Icon, CheckCircle2Icon, XIcon, DumbbellIcon, UtensilsIcon, TrophyIcon, ArrowRightIcon } from "lucide-react";
import CoachErrorState from "../../components/coach-error-state";
import { parseAsString, useQueryState } from "nuqs";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useBreadcrumbStore } from "@/store";
import { useCoachClients, useCoachGroups, useCoachMealPlans, useCoachWorkoutPlans } from "@/hooks/app/use-coach";
import PageTransition from "@/components/page-transition";
import { DataGrid, DataGridContainer, DataGridTable } from "@/components/reui/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Filters } from "@/components/reui/filters";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const createEmptyGroup = () => ({
  name: "",
  description: "",
  clientIds: [],
});

const GroupsPage = () => {
  const { t } = useTranslation();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { groups, isLoading: isGroupsLoading, isError, refetch, addGroup, updateGroup, removeGroup, assignMealPlanToGroup, assignWorkoutPlanToGroup } = useCoachGroups();
  const { mealPlans } = useCoachMealPlans();
  const { workoutPlans } = useCoachWorkoutPlans();
  const { clients, isLoading: isClientsLoading } = useCoachClients();

  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const deferredSearch = React.useDeferredValue(search);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editingGroup, setEditingGroup] = React.useState(null);
  const [groupToDelete, setGroupToDelete] = React.useState(null);
  const [formData, setFormData] = React.useState(createEmptyGroup);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeGroupId, setActiveGroupId] = React.useState(null);
  const [planType, setPlanType] = React.useState(null); // 'meal' or 'workout'
  const [isPlanDrawerOpen, setIsPlanDrawerOpen] = React.useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = React.useState(false);
  const [isClientSelectDrawerOpen, setIsClientSelectDrawerOpen] = React.useState(false);
  const [clientSearch, setClientSearch] = React.useState("");

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: t("coach.groups.breadcrumbs.coach") },
      { url: "/coach/groups", title: t("coach.groups.breadcrumbs.groups") },
    ]);
  }, [setBreadcrumbs, t]);

  const filteredGroups = React.useMemo(() => {
    const query = toLower(trim(deferredSearch));
    return filter(
      groups,
      (g) =>
        !query ||
        toLower(g.name).includes(query) ||
        toLower(g.description).includes(query)
    );
  }, [groups, deferredSearch]);

  const handleOpenDrawer = (group = null) => {
    setClientSearch("");
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        description: group.description,
        clientIds: group.clientIds || [],
      });
    } else {
      setEditingGroup(null);
      setFormData(createEmptyGroup());
    }
    setDrawerOpen(true);
  };

  const handleNextStep = () => {
    if (!trim(formData.name)) {
      toast.error(t("coach.groups.toasts.nameRequired"));
      return;
    }
    setDrawerOpen(false);
    setIsClientSelectDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!trim(formData.name)) {
      toast.error(t("coach.groups.toasts.nameRequired"));
      return;
    }

    if (formData.clientIds.length === 0) {
      toast.error(t("coach.groups.toasts.selectAtLeastOne"));
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingGroup) {
        await updateGroup(editingGroup.id, formData);
        toast.success(t("coach.groups.toasts.updateSuccess"));
      } else {
        await addGroup(formData);
        toast.success(t("coach.groups.toasts.createSuccess"));
      }
      setIsClientSelectDrawerOpen(false);
      setFormData(createEmptyGroup());
      setClientSearch("");
    } catch (error) {
      toast.error(t("coach.groups.toasts.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (groupToDelete) {
      try {
        await removeGroup(groupToDelete.id);
        toast.success(t("coach.groups.toasts.deleteSuccess"));
        setGroupToDelete(null);
      } catch {
        toast.error(t("coach.groups.toasts.error"));
      }
    }
  };

  const filteredClients = React.useMemo(() => {
    const query = toLower(trim(clientSearch));
    return filter(
      clients,
      (c) =>
        !query ||
        toLower(c.name).includes(query) ||
        toLower(c.email).includes(query) ||
        includes(c.phone, query)
    );
  }, [clients, clientSearch]);

  const handleAssignPlan = async (planId) => {
    try {
      if (planType === "meal") {
        await assignMealPlanToGroup(activeGroupId, planId);
        toast.success(t("coach.groups.toasts.mealPlanAssigned"));
      } else {
        await assignWorkoutPlanToGroup(activeGroupId, planId);
        toast.success(t("coach.groups.toasts.workoutPlanAssigned"));
      }
      setIsPlanDrawerOpen(false);
      setActiveGroupId(null);
      setPlanType(null);
    } catch {
      toast.error(t("coach.groups.toasts.error"));
    }
  };

  const columns = React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataGridColumnHeader column={column} title={t("coach.groups.table.columns.name")} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UsersIcon className="size-5" />
            </div>
            <div>
              <p className="font-semibold">{row.original.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-1 truncate w-48 sm:w-64">
                {row.original.description || t("coach.groups.table.noDescription")}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "members",
        accessorFn: (row) => row.get(clientIds, "length") || 0,
        header: ({ column }) => <DataGridColumnHeader column={column} title={t("coach.groups.table.columns.members")} />,
        cell: ({ row }) => {
          const count = row.original.get(clientIds, "length") || 0;
          return (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-lg h-7 px-2.5">
                {t("coach.groups.table.memberCount", { count })}
              </Badge>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreVerticalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => {
                  setActiveGroupId(row.original.id);
                  setPlanType("workout");
                  setIsPlanDrawerOpen(true);
                }}>
                  <DumbbellIcon className="size-4" />
                  {t("coach.groups.actions.workoutPlan")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setActiveGroupId(row.original.id);
                  setPlanType("meal");
                  setIsPlanDrawerOpen(true);
                }}>
                  <UtensilsIcon className="size-4" />
                  {t("coach.groups.actions.mealPlan")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setActiveGroupId(row.original.id);
                  setIsLeaderboardOpen(true);
                }}>
                  <TrophyIcon className="size-4" />
                  {t("coach.groups.actions.leaderboard")}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem onClick={() => {
                  setEditingGroup(row.original);
                  setFormData({
                    name: row.original.name,
                    description: row.original.description || "",
                    clientIds: row.original.clientIds || [],
                  });
                  setIsClientSelectDrawerOpen(true);
                }}>
                  <UsersIcon className="size-4" />
                  {t("coach.groups.actions.editMembers")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenDrawer(row.original)}>
                  <PencilIcon className="size-4" />
                  {t("coach.groups.actions.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setGroupToDelete(row.original)}
                >
                  <Trash2Icon className="size-4" />
                  {t("coach.groups.actions.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [t]
  );

  const [sorting, setSorting] = React.useState([]);
  const table = useReactTable({
    data: filteredGroups,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isError) {
    return (
      <PageTransition>
        <CoachErrorState onRetry={refetch} />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{t("coach.groups.header.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("coach.groups.header.description")}
            </p>
          </div>
          <Button onClick={() => handleOpenDrawer()} className="gap-2 px-6">
            <PlusIcon className="size-5" />
            {t("coach.groups.header.newGroup")}
          </Button>
        </div>

        <Filters
          fields={[{ key: "q", label: t("common.search", { defaultValue: "Search" }), type: "text", placeholder: t("coach.groups.filters.searchPlaceholder") }]}
          onChange={(f) => setSearch(get(find(f, (i) => i.field === "q"), "values[0]", ""))}
          filters={search ? [{ id: "q", field: "q", operator: "contains", values: [search] }] : []}
        />

        <DataGridContainer>
          <DataGrid
            table={table}
            recordCount={filteredGroups.length}
            emptyMessage={t("coach.groups.table.empty")}
            loadingMode="skeleton"
          >
            <DataGridTable />
          </DataGrid>
        </DataGridContainer>
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="bottom">
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
          <DrawerHeader>
            <DrawerTitle>{editingGroup ? t("coach.groups.drawers.meta.editTitle") : t("coach.groups.drawers.meta.createTitle")}</DrawerTitle>
            <DrawerDescription>
              {t("coach.groups.drawers.meta.description")}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            <Field>
              <FieldLabel>{t("coach.groups.drawers.meta.nameLabel")}</FieldLabel>
              <Input
                placeholder={t("coach.groups.drawers.meta.namePlaceholder")}
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                className="rounded-xl h-11"
              />
            </Field>
            <Field>
              <FieldLabel>{t("coach.groups.drawers.meta.descLabel")}</FieldLabel>
              <Textarea
                placeholder={t("coach.groups.drawers.meta.descPlaceholder")}
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                className="rounded-xl min-h-[80px]"
              />
            </Field>
          </DrawerBody>
          <DrawerFooter className="px-6 py-4">
            <Button className="w-full" size="lg" onClick={handleNextStep}>
              {t("coach.groups.drawers.meta.continue")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={isClientSelectDrawerOpen} onOpenChange={setIsClientSelectDrawerOpen} direction="bottom">
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
          <DrawerHeader>
            <DrawerTitle>{t("coach.groups.drawers.selection.title")}</DrawerTitle>
            <DrawerDescription>
              {t("coach.groups.drawers.selection.description")}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("coach.groups.drawers.selection.searchPlaceholder")}
                className="pl-9 rounded-xl h-10"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredClients.map((client) => {
                const isSelected = includes(formData.clientIds, client.id);
                return (
                  <div
                    key={client.id}
                    onClick={() => {
                      setFormData((p) => ({
                        ...p,
                        clientIds: isSelected
                          ? filter(p.clientIds, (id) => id !== client.id)
                          : [...p.clientIds, client.id],
                      }));
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border/50 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 border shadow-sm">
                        <AvatarImage src={client.avatar} alt={client.name} />
                        <AvatarFallback className="font-semibold text-xs text-muted-foreground">
                          {join(map((client.name || "").split(" "), (n) => n[0]), "")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold leading-tight">{client.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {client.email || client.phone || t("coach.groups.drawers.selection.noContact")}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`size-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {isSelected && <CheckCircle2Icon className="size-3" />}
                    </div>
                  </div>
                );
              })}
              {filteredClients.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t("coach.groups.drawers.selection.noClients")}
                </div>
              )}
            </div>
          </DrawerBody>
          <DrawerFooter className="px-6 py-4">
            <Button
              className="w-full"
              size="lg"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {editingGroup ? t("coach.groups.drawers.selection.save") : t("coach.groups.drawers.selection.create")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AlertDialog
        open={Boolean(groupToDelete)}
        onOpenChange={(open) => !open && setGroupToDelete(null)}
      >
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("coach.groups.deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("coach.groups.deleteDialog.description", { name: get(groupToDelete, "name") })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("coach.groups.deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {t("coach.groups.deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Drawer open={isPlanDrawerOpen} onOpenChange={setIsPlanDrawerOpen} direction="bottom">
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
          <DrawerHeader>
            <DrawerTitle>
              {planType === "meal" 
                ? t("coach.groups.drawers.plan.mealTitle") 
                : t("coach.groups.drawers.plan.workoutTitle")}
            </DrawerTitle>
            <DrawerDescription>
              {t("coach.groups.drawers.plan.description")}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            <div className="grid gap-2">
              {(planType === "meal" ? mealPlans : workoutPlans).map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => handleAssignPlan(plan.id)}
                  className="flex items-center justify-between p-4 rounded-2xl border border-border/50 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10">
                      {planType === "meal" ? (
                        <UtensilsIcon className="size-5 text-muted-foreground group-hover:text-primary" />
                      ) : (
                        <DumbbellIcon className="size-5 text-muted-foreground group-hover:text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{plan.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{plan.description}</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </DrawerBody>
          <DrawerFooter className="px-6 py-4">
            {/* Cancel button removed */}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={isLeaderboardOpen} onOpenChange={setIsLeaderboardOpen} direction="bottom">
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
          <DrawerHeader className="px-6">
            <div className="flex items-center gap-3 py-2">
              <div className="size-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <TrophyIcon className="size-5 text-yellow-500" />
              </div>
              <div className="text-left">
                <DrawerTitle className="text-lg font-bold">{t("coach.groups.drawers.leaderboard.title")}</DrawerTitle>
                <DrawerDescription>
                  {t("coach.groups.drawers.leaderboard.description")}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>
          <DrawerBody className="p-0">
            <ScrollArea className="h-[450px]">
              <div className="p-4 space-y-2">
                {find(groups, (g) => g.id === activeGroupId)?.get(clientIds, "map")((clientId, index) => {
                  const client = find(clients, (c) => c.id === clientId);
                  if (!client) return null;
                  
                  // Mock ranking data
                  const score = (100 - (index * 7)) + Math.floor(Math.random() * 5);
                  const rankIcons = ["🥇", "🥈", "🥉"];

                  return (
                    <div
                      key={clientId}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all",
                        index === 0 ? "bg-yellow-50/30 border-yellow-200" : 
                        index === 1 ? "bg-slate-50/30 border-slate-200" :
                        index === 2 ? "bg-orange-50/30 border-orange-200" :
                        "border-border/40"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center size-7 rounded-full bg-background border font-bold text-xs">
                          {rankIcons[index] || index + 1}
                        </div>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10 border-2 border-background shadow-sm">
                            <AvatarImage src={client.avatar} />
                            <AvatarFallback className="font-semibold text-xs">
                              {join(map(client.get(name, "split")(" "), (n) => n[0]), "")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm">{client.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="h-1 w-16 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full rounded-full transition-all duration-1000",
                                    index === 0 ? "bg-yellow-500" : "bg-primary"
                                  )} 
                                  style={{ width: `${score}%` }} 
                                />
                              </div>
                              <span className="text-[10px] font-semibold opacity-60">{score} pts</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="rounded-lg h-6 font-semibold text-[10px] uppercase">
                        {index === 0 ? t("coach.groups.drawers.leaderboard.winner") : t("coach.groups.drawers.leaderboard.player")}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </DrawerBody>
          <DrawerFooter className="px-6 py-4">
            <Button className="w-full" size="lg" onClick={() => setIsLeaderboardOpen(false)}>
              {t("coach.groups.drawers.leaderboard.close")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </PageTransition>
  );
};

export default GroupsPage;
