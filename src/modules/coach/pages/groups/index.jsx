import React from "react";
import {
  PlusIcon,
  SearchIcon,
  UsersIcon,
  MoreVerticalIcon,
  PencilIcon,
  Trash2Icon,
  CheckCircle2Icon,
  DumbbellIcon,
  UtensilsIcon,
  TrophyIcon,
  ArrowRightIcon,
  BotIcon,
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { get, toLower, trim } from "lodash";
import { cn } from "@/lib/utils";
import CoachErrorState from "@/modules/coach/components/coach-error-state";
import { toast } from "sonner";
import { useBreadcrumbStore } from "@/store";
import {
  useCoachClients,
  useCoachGroups,
  useCoachMealPlans,
  useCoachWorkoutPlans,
} from "@/hooks/app/use-coach";
import { useGetQuery } from "@/hooks/api";
import PageTransition from "@/components/page-transition";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
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
import TelegramBotContainer from "@/modules/coach/containers/telegram-bot/components/telegram-bot-container.jsx";

const createEmptyGroup = () => ({
  name: "",
  description: "",
  clientIds: [],
});

const GroupsPage = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const {
    groups,
    isLoading: isGroupsLoading,
    isError,
    refetch,
    addGroup,
    updateGroup,
    removeGroup,
    assignMealPlanToGroup,
    assignWorkoutPlanToGroup,
  } = useCoachGroups();
  const { mealPlans } = useCoachMealPlans();
  const { workoutPlans } = useCoachWorkoutPlans();
  const { clients } = useCoachClients();
  const { data: botData } = useGetQuery({
    url: "/coach/telegram",
    queryProps: {
      queryKey: ["coach", "telegram", "bot"],
    },
  });

  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const deferredSearch = React.useDeferredValue(search);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [isBotDrawerOpen, setIsBotDrawerOpen] = React.useState(false);
  const [editingGroup, setEditingGroup] = React.useState(null);
  const [groupToDelete, setGroupToDelete] = React.useState(null);
  const [formData, setFormData] = React.useState(createEmptyGroup);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeGroupId, setActiveGroupId] = React.useState(null);
  const [planType, setPlanType] = React.useState(null); // 'meal' or 'workout'
  const [isPlanDrawerOpen, setIsPlanDrawerOpen] = React.useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = React.useState(false);
  const [isClientSelectDrawerOpen, setIsClientSelectDrawerOpen] =
    React.useState(false);
  const [clientSearch, setClientSearch] = React.useState("");

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: "Coach" },
      { url: "/coach/telegram-groups", title: "Telegram guruhlari" },
    ]);
  }, [setBreadcrumbs]);

  const botSummary = get(botData, "data", null);
  const botConnected = Boolean(get(botSummary, "botUsername"));
  const botStatus = get(botSummary, "status", "INACTIVE");

  const filteredGroups = React.useMemo(() => {
    const query = toLower(trim(deferredSearch));
    return groups.filter(
      (g) =>
        !query ||
        toLower(g.name).includes(query) ||
        toLower(g.description).includes(query),
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
      toast.error("Guruh nomini kiriting");
      return;
    }
    setDrawerOpen(false);
    setIsClientSelectDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!trim(formData.name)) {
      toast.error("Guruh nomini kiriting");
      return;
    }

    if (formData.clientIds.length === 0) {
      toast.error("Kamida bitta mijozni tanlang");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingGroup) {
        await updateGroup(editingGroup.id, formData);
        toast.success("Guruh muvaffaqiyatli tahrirlandi");
      } else {
        await addGroup(formData);
        toast.success("Yangi guruh yaratildi");
      }
      setIsClientSelectDrawerOpen(false);
      setFormData(createEmptyGroup());
      setClientSearch("");
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (groupToDelete) {
      await removeGroup(groupToDelete.id);
      toast.success("Guruh o'chirildi");
      setGroupToDelete(null);
    }
  };

  const filteredClients = React.useMemo(() => {
    const query = toLower(trim(clientSearch));
    return clients.filter(
      (c) =>
        !query ||
        toLower(get(c, "name", "")).includes(query) ||
        toLower(get(c, "email", "")).includes(query) ||
        toLower(get(c, "phone", "")).includes(query),
    );
  }, [clients, clientSearch]);

  const handleAssignPlan = async (planId) => {
    if (planType === "meal") {
      await assignMealPlanToGroup(activeGroupId, planId);
      toast.success("Ovqatlanish rejasi guruhga biriktirildi");
    } else {
      await assignWorkoutPlanToGroup(activeGroupId, planId);
      toast.success("Mashg'ulot rejasi guruhga biriktirildi");
    }
    setIsPlanDrawerOpen(false);
    setActiveGroupId(null);
    setPlanType(null);
  };

  const columns = React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Guruh nomi" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UsersIcon className="size-5" />
            </div>
            <div>
              <p className="font-semibold">{row.original.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-1 truncate w-48 sm:w-64">
                {row.original.description || "Ta'rifsiz"}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "members",
        accessorFn: (row) => (row.clientIds || []).length,
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="A'zolar" />
        ),
        cell: ({ row }) => {
          const count = (row.original.clientIds || []).length;
          return (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-lg h-7 px-2.5">
                {count} ta mijoz
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
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => {
                    setActiveGroupId(row.original.id);
                    setPlanType("workout");
                    setIsPlanDrawerOpen(true);
                  }}
                >
                  <DumbbellIcon className="size-4" />
                  Mashg'ulot rejasi
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setActiveGroupId(row.original.id);
                    setPlanType("meal");
                    setIsPlanDrawerOpen(true);
                  }}
                >
                  <UtensilsIcon className="size-4" />
                  Ovqatlanish rejasi
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setActiveGroupId(row.original.id);
                    setIsLeaderboardOpen(true);
                  }}
                >
                  <TrophyIcon className="size-4" />
                  Leaderboard
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem
                  onClick={() => {
                    setEditingGroup(row.original);
                    setFormData({
                      name: row.original.name,
                      description: row.original.description || "",
                      clientIds: row.original.clientIds || [],
                    });
                    setIsClientSelectDrawerOpen(true);
                  }}
                >
                  <UsersIcon className="size-4" />
                  A&apos;zolarni tahrirlash
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleOpenDrawer(row.original)}
                >
                  <PencilIcon className="size-4" />
                  Tahrirlash
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setGroupToDelete(row.original)}
                >
                  <Trash2Icon className="size-4" />
                  O'chirish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [],
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
            <h1 className="text-2xl font-bold tracking-tight">
              Telegram guruhlari
            </h1>
            <p className="text-sm text-muted-foreground">
              Mijozlaringizni Telegram guruhlarga ajrating, planlarni ulang va
              bot holatini kuzating.
            </p>
          </div>
          <Button onClick={() => handleOpenDrawer()} className="gap-2 px-6">
            <PlusIcon className="size-5" />
            Yangi Telegram guruh
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-background to-background px-5 py-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                  <BotIcon className="size-3.5" />
                  Telegram access
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    Bot va guruhlar bir joyda
                  </h2>
                  <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                    Bot ulanishi, guruh a&apos;zolari va biriktirilgan meal/workout
                    planlar shu workspace ichida boshqariladi.
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  botConnected &&
                    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
                  !botConnected &&
                    "border-border/70 bg-background text-foreground/70",
                )}
              >
                {botConnected ? `Ulangan • ${botStatus}` : "Bot ulanmagan"}
              </Badge>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3">
                <p className="text-xs text-muted-foreground">Bot username</p>
                <p className="mt-1 text-sm font-semibold">
                  {botConnected ? `@${botSummary.botUsername}` : "Bot ulash kerak"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3">
                <p className="text-xs text-muted-foreground">A&apos;zolar</p>
                <p className="mt-1 text-sm font-semibold">
                  {get(botSummary, "stats.userCount", 0).toLocaleString()} ta
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3">
                <p className="text-xs text-muted-foreground">Faol guruhlar</p>
                <p className="mt-1 text-sm font-semibold">
                  {filteredGroups.length.toLocaleString()} ta
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => setIsBotDrawerOpen(true)}
                className="rounded-2xl"
              >
                {botConnected ? "Bot sozlamalari" : "Bot ulash"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={() =>
                  window.open(
                    "https://t.me/BotFather",
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
              >
                BotFather
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/70 px-5 py-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Ishlash tartibi
            </h3>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3">
                1. Telegram botni ulang va guruhga admin qilib qo&apos;ying.
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3">
                2. Guruhga kerakli mijozlarni qo&apos;shing.
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3">
                3. Meal yoki workout rejani guruhning barcha a&apos;zolariga
                biriktiring.
              </div>
            </div>
          </div>
        </div>

        <Filters
          fields={[
            {
              key: "q",
              label: "Qidiruv",
              type: "text",
              placeholder: "Guruh nomi...",
            },
          ]}
          onChange={(f) =>
            setSearch(f.find((i) => i.field === "q")?.values?.[0] || "")
          }
          filters={
            search
              ? [
                  {
                    id: "q",
                    field: "q",
                    operator: "contains",
                    values: [search],
                  },
                ]
              : []
          }
        />

        <DataGridContainer>
          <DataGrid
            table={table}
            isLoading={isGroupsLoading}
            recordCount={filteredGroups.length}
            emptyMessage="Guruhlar topilmadi."
            loadingMode="skeleton"
          >
            <DataGridTable />
          </DataGrid>
        </DataGridContainer>
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="bottom">
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
          <DrawerHeader>
            <DrawerTitle>
              {editingGroup ? "Guruhni tahrirlash" : "Yangi guruh"}
            </DrawerTitle>
            <DrawerDescription>
              Guruh ma&apos;lumotlarini kiriting va mijozlarni tanlang.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            <Field>
              <FieldLabel>Guruh nomi</FieldLabel>
              <Input
                placeholder="Masalan: Erkaklar (Vazn yo'qotish)"
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                className="rounded-xl h-11"
              />
            </Field>
            <Field>
              <FieldLabel>Ta&apos;rif</FieldLabel>
              <Textarea
                placeholder="Guruh haqida batafsil..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                className="rounded-xl min-h-[80px]"
              />
            </Field>
          </DrawerBody>
          <DrawerFooter className="px-6 py-4">
            <Button className="w-full" size="lg" onClick={handleNextStep}>
              Davom etish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={isBotDrawerOpen}
        onOpenChange={setIsBotDrawerOpen}
        direction="bottom"
      >
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-5xl">
          <DrawerHeader>
            <DrawerTitle>Telegram bot boshqaruvi</DrawerTitle>
            <DrawerDescription>
              Botni ulang, welcome message ni yangilang va Telegram foydalanuvchi
              oqimini shu yerdan kuzating.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="max-h-[78vh] overflow-y-auto pb-6">
            <TelegramBotContainer
              config={{
                apiBase: "coach",
                apiBasePath: "/coach/telegram",
                embedded: true,
              }}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={isClientSelectDrawerOpen}
        onOpenChange={setIsClientSelectDrawerOpen}
        direction="bottom"
      >
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
          <DrawerHeader>
            <DrawerTitle>Mijozlarni tanlang</DrawerTitle>
            <DrawerDescription>
              Guruhga qo&apos;shish uchun mijozlarni tanlang.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Mijozni qidirish..."
                className="pl-9 rounded-xl h-10"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredClients.map((client) => {
                const isSelected = formData.clientIds.includes(client.id);
                return (
                  <div
                    key={client.id}
                    onClick={() => {
                      setFormData((p) => ({
                        ...p,
                        clientIds: isSelected
                          ? p.clientIds.filter((id) => id !== client.id)
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
                          {(client.name || "")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold leading-tight">
                          {client.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {client.email || client.phone || "Kontakt yo'q"}
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
                  Mijozlar topilmadi.
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
              {editingGroup ? "Saqlash" : "Guruh yaratish"}
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
            <AlertDialogTitle>Guruhni o&apos;chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham &quot;{get(groupToDelete, "name")}&quot; guruhini
              o&apos;chirib tashlamoqchimisiz? Bu amalni ortga qaytarib
              bo&apos;lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              O&apos;chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Drawer
        open={isPlanDrawerOpen}
        onOpenChange={setIsPlanDrawerOpen}
        direction="bottom"
      >
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
          <DrawerHeader>
            <DrawerTitle>
              {planType === "meal" ? "Ovqatlanish" : "Mashg'ulot"} rejasini
              tanlang
            </DrawerTitle>
            <DrawerDescription>
              Ushbu reja guruhning barcha a'zolariga biriktiriladi.
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
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {plan.description}
                      </p>
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

      <Drawer
        open={isLeaderboardOpen}
        onOpenChange={setIsLeaderboardOpen}
        direction="bottom"
      >
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
          <DrawerHeader className="px-6">
            <div className="flex items-center gap-3 py-2">
              <div className="size-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <TrophyIcon className="size-5 text-yellow-500" />
              </div>
              <div className="text-left">
                <DrawerTitle className="text-lg font-bold">
                  Leaderboard
                </DrawerTitle>
                <DrawerDescription>
                  Guruh a&apos;zolarining haftalik natijalari
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>
          <DrawerBody className="p-0">
            <ScrollArea className="h-[450px]">
              <div className="p-4 space-y-2">
                {(
                  groups.find((g) => g.id === activeGroupId)?.clientIds || []
                ).map((clientId, index) => {
                  const client = clients.find((c) => c.id === clientId);
                  if (!client) return null;

                  // Mock ranking data
                  const score = 100 - index * 7 + Math.floor(Math.random() * 5);
                  const rankIcons = ["🥇", "🥈", "🥉"];

                  return (
                    <div
                      key={clientId}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all",
                        index === 0
                          ? "bg-yellow-50/30 border-yellow-200"
                          : index === 1
                            ? "bg-slate-50/30 border-slate-200"
                            : index === 2
                              ? "bg-orange-50/30 border-orange-200"
                              : "border-border/40",
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
                              {String(client.name || "")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm">
                              {client.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="h-1 w-16 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-1000",
                                    index === 0
                                      ? "bg-yellow-500"
                                      : "bg-primary",
                                  )}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-semibold opacity-60">
                                {score} pts
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="rounded-lg h-6 font-semibold text-[10px] uppercase"
                      >
                        {index === 0 ? "Winner" : "Player"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </DrawerBody>
          <DrawerFooter className="px-6 py-4">
            <Button
              className="w-full"
              size="lg"
              onClick={() => setIsLeaderboardOpen(false)}
            >
              Yopish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </PageTransition>
  );
};

export default GroupsPage;
