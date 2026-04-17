import React from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import ChallengeActionsMenu from "./components/challenge-actions-menu";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { get, toLower, trim } from "lodash";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { toast } from "sonner";
import { useBreadcrumbStore, useChatStore } from "@/store";
import { useCoachChallengeStore } from "@/store/coach-challenge-store";
import { useCoachClients } from "@/hooks/app/use-coach";
import { Filters } from "@/components/reui/filters.jsx";
import ForwardDialog from "@/components/chat/forward-dialog";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  CheckCircle2Icon,
  Clock3Icon,
  LoaderCircleIcon,
  PlusIcon,
  StopCircleIcon,
  ImagePlusIcon,
  XIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";

const STATUS_META = {
  UPCOMING: {
    label: "Boshlanmagan",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    icon: Clock3Icon,
  },
  ACTIVE: {
    label: "Faol",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2Icon,
  },
  COMPLETED: {
    label: "Yakunlangan",
    className: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
    icon: TrophyIcon,
  },
  CANCELLED: {
    label: "Bekor qilingan",
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
    icon: StopCircleIcon,
  },
};

const REWARD_MODE_META = {
  FIXED_XP: {
    label: "Fixed XP",
    description: "Doimiy XP beriladi",
  },
  PERCENT_OF_POOL: {
    label: "Pool foizi",
    description: "Yig'ilgan XP havzasidan foiz",
  },
  PLACE_XP: {
    label: "O'rinlar bo'yicha",
    description: "1-2-3 o'rinlar uchun alohida XP",
  },
};

const METRIC_TYPE_META = {
  STEPS: {
    label: "Qadam",
    unit: "qadam",
  },
  WORKOUT_MINUTES: {
    label: "Mashq vaqti",
    unit: "daqiqa",
  },
  BURNED_CALORIES: {
    label: "Yondirilgan kaloriya",
    unit: "kcal",
  },
  SLEEP_HOURS: {
    label: "Uyqu",
    unit: "soat",
  },
};

const METRIC_AGGREGATION_META = {
  SUM: "Yig'indi",
  AVERAGE: "O'rtacha",
};

const createEmptyForm = () => {
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    title: "",
    description: "",
    status: "UPCOMING",
    startDate: format(startDate, "yyyy-MM-dd'T'HH:mm"),
    endDate: format(endDate, "yyyy-MM-dd'T'HH:mm"),
    joinFeeXp: "0",
    rewardMode: "FIXED_XP",
    rewardXp: "0",
    rewardPercent: "",
    firstPlaceXp: "",
    secondPlaceXp: "",
    thirdPlaceXp: "",
    maxParticipants: "",
    metricType: "STEPS",
    metricAggregation: "SUM",
    metricTarget: "10000",
    imageFile: null,
    imagePreviewUrl: "",
    imageId: null,
    removeImage: false,
    participantIds: [],
  };
};

const formatDateTimeInput = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return format(parsed, "yyyy-MM-dd'T'HH:mm");
};

const getChallengeRewardMode = (challenge) =>
  challenge.rewardMode || get(challenge.rewardDetails, "mode") || "FIXED_XP";

const getChallengeImageUrl = (challenge) =>
  get(challenge.image, "url") || challenge.imageUrl || "";

const getRewardSummary = (challenge) => {
  const mode = getChallengeRewardMode(challenge);

  if (mode === "FIXED_XP") {
    const fixedXp =
      get(challenge.rewardDetails, "fixedXp") ?? challenge.rewardXp ?? 0;
    return {
      title: `Mukofot: ${fixedXp} XP`,
      subtitle: REWARD_MODE_META.FIXED_XP.description,
    };
  }

  if (mode === "PERCENT_OF_POOL") {
    const percent =
      get(challenge.rewardDetails, "percent") ?? challenge.rewardPercent ?? 0;
    const preview = get(challenge.rewardDetails, "previewRewardXp") ?? 0;
    return {
      title: `Mukofot: ${percent}% (≈ ${preview} XP)`,
      subtitle: REWARD_MODE_META.PERCENT_OF_POOL.description,
    };
  }

  const placeRewards = challenge.placeRewards || {};
  const placeLabel = Object.entries(placeRewards)
    .slice(0, 3)
    .map(([place, value]) => `${place}-o'rin ${value} XP`)
    .join(" · ");

  return {
    title: `Mukofot: ${placeLabel || "O'rin mukofotlari"}`,
    subtitle: REWARD_MODE_META.PLACE_XP.description,
  };
};

const getMetricSummary = (challenge) => {
  const type =
    get(challenge.metricDetails, "type") || challenge.metricType || "STEPS";
  const aggregation =
    get(challenge.metricDetails, "aggregation") ||
    challenge.metricAggregation ||
    "SUM";
  const target =
    get(challenge.metricDetails, "target") ?? challenge.metricTarget ?? 0;
  const typeMeta = METRIC_TYPE_META[type] || METRIC_TYPE_META.STEPS;
  const aggregationLabel =
    METRIC_AGGREGATION_META[aggregation] || METRIC_AGGREGATION_META.SUM;

  return `${typeMeta.label}: ${target} ${typeMeta.unit} (${aggregationLabel})`;
};

const Index = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();

  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum([
      "all",
      "UPCOMING",
      "ACTIVE",
      "COMPLETED",
      "CANCELLED",
    ]).withDefault("all"),
  );

  const {
    challenges,
    isLoading,
    fetchChallenges,
    createChallenge,
    updateChallenge,
    deleteChallenge,
  } = useCoachChallengeStore();

  const { clients, isLoading: isClientsLoading } = useCoachClients();

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editingChallenge, setEditingChallenge] = React.useState(null);
  const [challengeToDelete, setChallengeToDelete] = React.useState(null);
  const [formData, setFormData] = React.useState(createEmptyForm);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [challengeToShare, setChallengeToShare] = React.useState(null);
  const { contacts, sendSharedContent, fetchRooms } = useChatStore();

  const isPlacePercentInput =
    formData.rewardMode === "PLACE_XP" && Number(formData.joinFeeXp || 0) > 0;

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: "Coach" },
      { url: "/coach/challenges", title: "Musobaqalar" },
    ]);
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    fetchChallenges();
    fetchRooms();
  }, [fetchChallenges, fetchRooms]);

  React.useEffect(
    () => () => {
      if (String(formData.imagePreviewUrl || "").startsWith("blob:")) {
        URL.revokeObjectURL(formData.imagePreviewUrl);
      }
    },
    [formData.imagePreviewUrl],
  );

  const deferredSearch = React.useDeferredValue(search);

  const filteredChallenges = React.useMemo(() => {
    const query = toLower(trim(deferredSearch));

    return challenges.filter((challenge) => {
      const matchesSearch =
        !query ||
        toLower(challenge.title).includes(query) ||
        challenge.description?.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || challenge.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [challenges, deferredSearch, statusFilter]);

  const filterFields = React.useMemo(
    () => [
      {
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Nomi yoki ta'rifi",
      },
      {
        label: "Holati",
        key: "status",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha holatlar" },
          { value: "UPCOMING", label: "Boshlanmagan" },
          { value: "ACTIVE", label: "Faol" },
          { value: "COMPLETED", label: "Yakunlangan" },
          { value: "CANCELLED", label: "Bekor qilingan" },
        ],
      },
    ],
    [],
  );

  const activeFilters = React.useMemo(() => {
    const filters = [];
    if (trim(search)) {
      filters.push({
        id: "q",
        field: "q",
        operator: "contains",
        values: [search],
      });
    }
    if (statusFilter !== "all") {
      filters.push({
        id: "status",
        field: "status",
        operator: "is",
        values: [statusFilter],
      });
    }
    return filters;
  }, [search, statusFilter]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch =
        nextFilters.find((item) => item.field === "q")?.get(values, "[0]") ??
        "";
      const nextStatus =
        nextFilters
          .find((item) => item.field === "status")
          ?.get(values, "[0]") ?? "all";

      React.startTransition(() => {
        void setSearch(nextSearch);
        void setStatusFilter(nextStatus);
      });
    },
    [setSearch, setStatusFilter],
  );

  const openCreateDrawer = React.useCallback(() => {
    setEditingChallenge(null);
    setFormData(createEmptyForm());
    setDrawerOpen(true);
  }, []);

  const openEditDrawer = React.useCallback((challenge) => {
    const rewardMode = getChallengeRewardMode(challenge);
    const placeRewards = challenge.placeRewards || {};

    setEditingChallenge(challenge);
    setFormData({
      title: challenge.title ?? "",
      description: challenge.description ?? "",
      status: challenge.status ?? "UPCOMING",
      startDate: formatDateTimeInput(challenge.startDate),
      endDate: formatDateTimeInput(challenge.endDate),
      joinFeeXp: String(challenge.joinFeeXp ?? 0),
      rewardMode,
      rewardXp: String(
        challenge.rewardDetails?.fixedXp ?? challenge.rewardXp ?? 0,
      ),
      rewardPercent: String(
        challenge.rewardDetails?.percent ?? challenge.rewardPercent ?? "",
      ),
      firstPlaceXp: String(placeRewards["1"] ?? ""),
      secondPlaceXp: String(placeRewards["2"] ?? ""),
      thirdPlaceXp: String(placeRewards["3"] ?? ""),
      maxParticipants:
        challenge.maxParticipants === null ||
        challenge.maxParticipants === undefined
          ? ""
          : String(challenge.maxParticipants),
      metricType:
        challenge.metricDetails?.type ?? challenge.metricType ?? "STEPS",
      metricAggregation:
        challenge.metricDetails?.aggregation ??
        challenge.metricAggregation ??
        "SUM",
      metricTarget: String(
        challenge.metricDetails?.target ?? challenge.metricTarget ?? 10000,
      ),
      imageFile: null,
      imagePreviewUrl: getChallengeImageUrl(challenge),
      imageId: challenge.imageId ?? challenge.image?.id ?? null,
      removeImage: false,
      participantIds: (challenge.participants || []).map((p) => p.id),
    });
    setDrawerOpen(true);
  }, []);

  const handleSave = React.useCallback(async () => {
    if (!trim(formData.title)) {
      toast.error("Sarlavha kiritilishi shart");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        // For the mock store, we map participantIds to participant objects
        participants: clients
          .filter((c) => formData.participantIds.includes(c.id))
          .map((c) => ({
            id: c.id,
            userId: c.userId || c.user?.id || c.id,
            name: c.name,
            metricValue: 0,
          })),
      };

      if (editingChallenge) {
        await updateChallenge(
          editingChallenge.id,
          payload,
          formData.imageFile,
          (updated) => {
            const currentParticipantIds = (
              editingChallenge.participants || []
            ).map((p) => p.id);
            const newParticipantIds = formData.participantIds.filter(
              (id) => !currentParticipantIds.includes(id),
            );

            if (newParticipantIds.length > 0) {
              newParticipantIds.forEach((id) => {
                const room = contacts.find(
                  (c) =>
                    c.id === id ||
                    c.id === `g${id}` ||
                    c.userId === id ||
                    (c.participants || []).some(
                      (p) => p.id === id || p.userId === id,
                    ),
                );
                if (room) {
                  sendSharedContent(
                    room.id,
                    "challenge",
                    editingChallenge.id,
                    updated.title,
                    updated.description,
                  );
                } else {
                  console.warn(`Room not found for participant ${id}`);
                }
              });
            }

            setDrawerOpen(false);
            setEditingChallenge(null);
            toast.success("Musobaqa yangilandi");
          },
        );
      } else {
        await createChallenge(payload, formData.imageFile, (newChallenge) => {
          if (formData.participantIds.length > 0) {
            formData.participantIds.forEach((id) => {
              const room = contacts.find(
                (c) =>
                  c.id === id ||
                  c.id === `g${id}` ||
                  c.userId === id ||
                  (c.participants || []).some(
                    (p) => p.id === id || p.userId === id,
                  ),
              );
              if (room) {
                sendSharedContent(
                  room.id,
                  "challenge",
                  newChallenge.id,
                  newChallenge.title,
                  newChallenge.description,
                );
              } else {
                console.warn(`Room not found for participant ${id}`);
              }
            });
          }

          setDrawerOpen(false);
          setEditingChallenge(null);
          toast.success("Musobaqa yaratildi va taklifnomalar yuborildi");
          fetchChallenges();
        });
      }
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    contacts,
    sendSharedContent,
    createChallenge,
    editingChallenge,
    formData,
    updateChallenge,
    fetchChallenges,
    fetchRooms,
  ]);

  const handleDelete = React.useCallback(async () => {
    if (!challengeToDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteChallenge(challengeToDelete.id);
      setChallengeToDelete(null);
      toast.success("Musobaqa o'chirildi");
    } catch (error) {
      toast.error("O'chirishda xatolik");
    } finally {
      setIsDeleting(false);
    }
  }, [challengeToDelete, deleteChallenge]);

  const handleShare = React.useCallback((challenge) => {
    setChallengeToShare(challenge);
    setShareDialogOpen(true);
  }, []);

  const confirmShare = React.useCallback(
    (chatId) => {
      if (!challengeToShare) return;

      sendSharedContent(
        chatId,
        "challenge",
        challengeToShare.id,
        challengeToShare.title,
        challengeToShare.description || challengeToShare.title,
      );

      toast.success("Musobaqa chatga yuborildi");
      setShareDialogOpen(false);
      setChallengeToShare(null);
    },
    [challengeToShare, sendSharedContent],
  );

  const handleImageChange = React.useCallback((event) => {
    const file = get(event.target.files, "[0]");

    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFormData((current) => {
      if (current.imagePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(current.imagePreviewUrl);
      }

      return {
        ...current,
        imageFile: file,
        imagePreviewUrl: previewUrl,
        removeImage: false,
      };
    });
  }, []);

  const handleImageRemove = React.useCallback(() => {
    setFormData((current) => {
      if (current.imagePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(current.imagePreviewUrl);
      }

      return {
        ...current,
        imageFile: null,
        imagePreviewUrl: "",
        removeImage: Boolean(current.imageId),
      };
    });
  }, []);

  const columns = React.useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Musobaqa",
        meta: {
          cellClassName: "w-[34%]",
        },
        cell: (info) => {
          const challenge = info.row.original;
          const imageUrl = getChallengeImageUrl(challenge);

          return (
            <div className="flex min-w-0 items-start gap-3">
              <div className="size-12 shrink-0 overflow-hidden rounded-xl border bg-muted/30">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={challenge.title || "Challenge"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <ImagePlusIcon className="size-4" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {challenge.title || "Nomsiz"}
                </p>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {challenge.description || "Ta'rif kiritilmagan"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Holati",
        size: 130,
        cell: (info) => {
          const status = info.getValue();
          const meta = STATUS_META[status] || STATUS_META.UPCOMING;
          const Icon = meta.icon;

          return (
            <Badge variant="outline" className={meta.className}>
              <Icon className="mr-1 size-3" />
              {meta.label}
            </Badge>
          );
        },
      },
      {
        id: "period",
        header: "Muddati",
        size: 180,
        cell: (info) => {
          const challenge = info.row.original;

          return (
            <div className="text-sm">
              <p className="font-medium">
                {format(new Date(challenge.startDate), "dd MMM yyyy, HH:mm", {
                  locale: uz,
                })}
              </p>
              <p className="text-muted-foreground">
                {format(new Date(challenge.endDate), "dd MMM yyyy, HH:mm", {
                  locale: uz,
                })}
              </p>
            </div>
          );
        },
      },
      {
        id: "stats",
        header: "Statistika",
        size: 170,
        cell: (info) => {
          const challenge = info.row.original;
          const rewardSummary = getRewardSummary(challenge);
          const metricSummary = getMetricSummary(challenge);

          return (
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-1 text-muted-foreground">
                <UsersIcon className="size-3.5" />
                {challenge.participants?.length ||
                  challenge._count?.participants ||
                  0}
                {challenge.maxParticipants && challenge.maxParticipants > 0
                  ? ` / ${challenge.maxParticipants}`
                  : ""}
              </p>
              <p className="text-emerald-600 dark:text-emerald-400">
                {rewardSummary.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {rewardSummary.subtitle}
              </p>
              <p className="text-xs text-muted-foreground">{metricSummary}</p>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: (info) => (
          <div className="flex justify-end">
            <ChallengeActionsMenu
              challenge={info.row.original}
              onEdit={openEditDrawer}
              onDelete={setChallengeToDelete}
              onShare={handleShare}
            />
          </div>
        ),
      },
    ],
    [openEditDrawer],
  );

  const table = useReactTable({
    data: filteredChallenges,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Shaxsiy Musobaqalar
        </h1>
        <Button onClick={openCreateDrawer} className="gap-1.5">
          <PlusIcon className="size-4" />
          Musobaqa qo'shish
        </Button>
      </div>

      <Filters
        fields={filterFields}
        filters={activeFilters}
        onChange={handleFiltersChange}
        allowMultiple={false}
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>{filteredChallenges.length} ta musobaqa</p>
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

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="bottom">
        <DrawerContent className="outline-none">
          <DrawerHeader className="border-b border-border/40 pb-4 pt-5">
            <DrawerTitle className="text-foreground text-xl font-bold text-center">
              {editingChallenge ? "Musobaqani tahrirlash" : "Yangi musobaqa"}
            </DrawerTitle>
            <DrawerDescription className="text-center">
              Mijozlaringiz uchun musobaqa sozlamalarini boshqaring.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="flex flex-col gap-8 py-6">
            <div className="flex flex-col gap-3">
              <span className="text-sm font-bold text-muted-foreground tracking-wide px-2 uppercase">
                Asosiy ma'lumotlar
              </span>
              <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col gap-4 p-4">
                <Field>
                  <FieldLabel className="flex items-center gap-2 font-semibold">
                    <ImagePlusIcon className="size-4 text-primary" />
                    Cover rasmi
                  </FieldLabel>
                  <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-muted/15 p-4">
                    <div className="size-20 shrink-0 overflow-hidden rounded-xl border bg-muted/30">
                      {formData.imagePreviewUrl ? (
                        <img
                          src={formData.imagePreviewUrl}
                          alt="Challenge cover"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ImagePlusIcon className="size-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="button" variant="outline" asChild>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                          />
                          Rasm tanlash
                        </label>
                      </Button>
                      {formData.imagePreviewUrl ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleImageRemove}
                        >
                          <XIcon className="mr-1 size-4" />
                          Olib tashlash
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </Field>

                <Field>
                  <FieldLabel className="font-semibold">Sarlavha</FieldLabel>
                  <Input
                    value={formData.title}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Masalan: 30 kunlik fitness marafon"
                    className="rounded-xl"
                  />
                </Field>

                <Field>
                  <FieldLabel className="font-semibold">Ta'rif</FieldLabel>
                  <Input
                    value={formData.description}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Musobaqa haqida qisqacha ma'lumot"
                    className="rounded-xl"
                  />
                </Field>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-bold text-muted-foreground tracking-wide px-2 uppercase">
                Vaqt va holat
              </span>
              <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col gap-4 p-4">
                <Field>
                  <FieldLabel className="font-semibold">Holati</FieldLabel>
                  <ToggleGroup
                    type="single"
                    value={formData.status}
                    onValueChange={(value) => {
                      if (value) {
                        setFormData((current) => ({
                          ...current,
                          status: value,
                        }));
                      }
                    }}
                    className="w-full justify-start rounded-xl border p-1"
                  >
                    <ToggleGroupItem
                      value="UPCOMING"
                      className="flex-1 rounded-lg text-xs md:text-sm"
                    >
                      Boshlanmagan
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="ACTIVE"
                      className="flex-1 rounded-lg text-xs md:text-sm"
                    >
                      Faol
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="COMPLETED"
                      className="flex-1 rounded-lg text-xs md:text-sm"
                    >
                      Yakunlangan
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="CANCELLED"
                      className="flex-1 rounded-lg text-xs md:text-sm"
                    >
                      Bekor qilingan
                    </ToggleGroupItem>
                  </ToggleGroup>
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel className="font-semibold">
                      Boshlanish vaqti
                    </FieldLabel>
                    <Input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          startDate: event.target.value,
                        }))
                      }
                      className="rounded-xl"
                    />
                  </Field>
                  <Field>
                    <FieldLabel className="font-semibold">
                      Tugash vaqti
                    </FieldLabel>
                    <Input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          endDate: event.target.value,
                        }))
                      }
                      className="rounded-xl"
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-bold text-muted-foreground tracking-wide px-2 uppercase">
                Musobaqa sozlamalari
              </span>
              <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col gap-4 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel className="font-semibold">
                      Kirish narxi (XP)
                    </FieldLabel>
                    <NumberField
                      value={
                        formData.joinFeeXp !== ""
                          ? Number(formData.joinFeeXp)
                          : undefined
                      }
                      onValueChange={(val) =>
                        setFormData((current) => ({
                          ...current,
                          joinFeeXp: val !== undefined ? String(val) : "",
                        }))
                      }
                      step={10}
                      minValue={0}
                      formatOptions={{
                        signDisplay: "never",
                        maximumFractionDigits: 0,
                      }}
                    >
                      <NumberFieldGroup>
                        <NumberFieldDecrement />
                        <NumberFieldInput placeholder="0" />
                        <NumberFieldIncrement />
                      </NumberFieldGroup>
                    </NumberField>
                  </Field>
                  <Field>
                    <FieldLabel className="font-semibold">
                      Maks ishtirokchilar
                    </FieldLabel>
                    <NumberField
                      value={
                        formData.maxParticipants !== ""
                          ? Number(formData.maxParticipants)
                          : undefined
                      }
                      onValueChange={(val) =>
                        setFormData((current) => ({
                          ...current,
                          maxParticipants: val !== undefined ? String(val) : "",
                        }))
                      }
                      step={1}
                      minValue={1}
                      formatOptions={{
                        signDisplay: "never",
                        maximumFractionDigits: 0,
                      }}
                    >
                      <NumberFieldGroup>
                        <NumberFieldDecrement />
                        <NumberFieldInput placeholder="Cheksiz" />
                        <NumberFieldIncrement />
                      </NumberFieldGroup>
                    </NumberField>
                  </Field>
                </div>

                <Field>
                  <FieldLabel className="font-semibold">
                    Mukofot rejimi
                  </FieldLabel>
                  <ToggleGroup
                    type="single"
                    value={formData.rewardMode}
                    onValueChange={(value) => {
                      if (value) {
                        setFormData((current) => ({
                          ...current,
                          rewardMode: value,
                        }));
                      }
                    }}
                    className="w-full justify-start rounded-xl border p-1"
                  >
                    <ToggleGroupItem
                      value="FIXED_XP"
                      className="flex-1 rounded-lg text-xs md:text-sm"
                    >
                      Fixed XP
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="PERCENT_OF_POOL"
                      className="flex-1 rounded-lg text-xs md:text-sm"
                    >
                      Pool foizi
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="PLACE_XP"
                      className="flex-1 rounded-lg text-xs md:text-sm"
                    >
                      O'rinlar bo'yicha
                    </ToggleGroupItem>
                  </ToggleGroup>
                </Field>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field>
                    <FieldLabel className="font-semibold">
                      Challenge metrikasi
                    </FieldLabel>
                    <Select
                      value={formData.metricType}
                      onValueChange={(value) =>
                        setFormData((current) => ({
                          ...current,
                          metricType: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(METRIC_TYPE_META).map(
                          ([value, meta]) => (
                            <SelectItem key={value} value={value}>
                              {meta.label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel className="font-semibold">
                      Hisoblash usuli
                    </FieldLabel>
                    <Select
                      value={formData.metricAggregation}
                      onValueChange={(value) =>
                        setFormData((current) => ({
                          ...current,
                          metricAggregation: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(METRIC_AGGREGATION_META).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel className="font-semibold">
                      Maqsad (
                      {METRIC_TYPE_META[formData.metricType]?.unit || "unit"})
                    </FieldLabel>
                    <NumberField
                      value={
                        formData.metricTarget !== ""
                          ? Number(formData.metricTarget)
                          : undefined
                      }
                      onValueChange={(val) =>
                        setFormData((current) => ({
                          ...current,
                          metricTarget: val !== undefined ? String(val) : "",
                        }))
                      }
                      step={0.01}
                      minValue={0.01}
                      formatOptions={{
                        signDisplay: "never",
                        maximumFractionDigits: 2,
                      }}
                    >
                      <NumberFieldGroup>
                        <NumberFieldDecrement />
                        <NumberFieldInput placeholder="0" />
                        <NumberFieldIncrement />
                      </NumberFieldGroup>
                    </NumberField>
                  </Field>
                </div>

                {formData.rewardMode === "FIXED_XP" && (
                  <Field>
                    <FieldLabel className="font-semibold">
                      Umumiy mukofot (XP)
                    </FieldLabel>
                    <NumberField
                      value={
                        formData.rewardXp !== ""
                          ? Number(formData.rewardXp)
                          : undefined
                      }
                      onValueChange={(val) =>
                        setFormData((current) => ({
                          ...current,
                          rewardXp: val !== undefined ? String(val) : "",
                        }))
                      }
                      step={10}
                      minValue={0}
                      formatOptions={{
                        signDisplay: "never",
                        maximumFractionDigits: 0,
                      }}
                    >
                      <NumberFieldGroup>
                        <NumberFieldDecrement />
                        <NumberFieldInput placeholder="0" />
                        <NumberFieldIncrement />
                      </NumberFieldGroup>
                    </NumberField>
                  </Field>
                )}

                {formData.rewardMode === "PERCENT_OF_POOL" && (
                  <Field>
                    <FieldLabel className="font-semibold">
                      Mukofot foizi (%)
                    </FieldLabel>
                    <NumberField
                      value={
                        formData.rewardPercent !== ""
                          ? Number(formData.rewardPercent)
                          : undefined
                      }
                      onValueChange={(val) =>
                        setFormData((current) => ({
                          ...current,
                          rewardPercent: val !== undefined ? String(val) : "",
                        }))
                      }
                      step={0.01}
                      minValue={0.01}
                      maxValue={100}
                      formatOptions={{
                        signDisplay: "never",
                        maximumFractionDigits: 2,
                      }}
                    >
                      <NumberFieldGroup>
                        <NumberFieldDecrement />
                        <NumberFieldInput placeholder="0" />
                        <NumberFieldIncrement />
                      </NumberFieldGroup>
                    </NumberField>
                  </Field>
                )}

                {formData.rewardMode === "PLACE_XP" && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {isPlacePercentInput
                        ? "Kirish narxi mavjud: o'rinlar uchun foiz kiriting (masalan 50, 30, 20)."
                        : "Kirish narxi 0: o'rinlar uchun to'g'ridan-to'g'ri XP kiriting."}
                    </p>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field>
                        <FieldLabel className="font-semibold">{`1-o'rin (${isPlacePercentInput ? "%" : "XP"})`}</FieldLabel>
                        <NumberField
                          value={
                            formData.firstPlaceXp !== ""
                              ? Number(formData.firstPlaceXp)
                              : undefined
                          }
                          onValueChange={(val) =>
                            setFormData((current) => ({
                              ...current,
                              firstPlaceXp:
                                val !== undefined ? String(val) : "",
                            }))
                          }
                          step={1}
                          minValue={0}
                          maxValue={isPlacePercentInput ? 100 : 1000000}
                        >
                          <NumberFieldGroup>
                            <NumberFieldDecrement />
                            <NumberFieldInput placeholder="0" />
                            <NumberFieldIncrement />
                          </NumberFieldGroup>
                        </NumberField>
                      </Field>
                      <Field>
                        <FieldLabel className="font-semibold">{`2-o'rin (${isPlacePercentInput ? "%" : "XP"})`}</FieldLabel>
                        <NumberField
                          value={
                            formData.secondPlaceXp !== ""
                              ? Number(formData.secondPlaceXp)
                              : undefined
                          }
                          onValueChange={(val) =>
                            setFormData((current) => ({
                              ...current,
                              secondPlaceXp:
                                val !== undefined ? String(val) : "",
                            }))
                          }
                          step={1}
                          minValue={0}
                          maxValue={isPlacePercentInput ? 100 : 1000000}
                        >
                          <NumberFieldGroup>
                            <NumberFieldDecrement />
                            <NumberFieldInput placeholder="0" />
                            <NumberFieldIncrement />
                          </NumberFieldGroup>
                        </NumberField>
                      </Field>
                      <Field>
                        <FieldLabel className="font-semibold">{`3-o'rin (${isPlacePercentInput ? "%" : "XP"})`}</FieldLabel>
                        <NumberField
                          value={
                            formData.thirdPlaceXp !== ""
                              ? Number(formData.thirdPlaceXp)
                              : undefined
                          }
                          onValueChange={(val) =>
                            setFormData((current) => ({
                              ...current,
                              thirdPlaceXp:
                                val !== undefined ? String(val) : "",
                            }))
                          }
                          step={1}
                          minValue={0}
                          maxValue={isPlacePercentInput ? 100 : 1000000}
                        >
                          <NumberFieldGroup>
                            <NumberFieldDecrement />
                            <NumberFieldInput placeholder="0" />
                            <NumberFieldIncrement />
                          </NumberFieldGroup>
                        </NumberField>
                      </Field>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-bold text-muted-foreground tracking-wide px-2 uppercase">
                Ishtirokchilar
              </span>
              <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col gap-2 p-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Ushbu musobaqada qatnashadigan mijozlaringizni tanlang.
                </p>
                <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-2">
                  {clients.map((client) => {
                    const isSelected = formData.participantIds.includes(
                      client.id,
                    );
                    return (
                      <div
                        key={client.id}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            participantIds: isSelected
                              ? prev.participantIds.filter(
                                  (id) => id !== client.id,
                                )
                              : [...prev.participantIds, client.id],
                          }));
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border/50 hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarImage
                              src={client.avatar}
                              alt={client.name}
                            />
                            <AvatarFallback className="text-[10px]">
                              {(client.name || "")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{client.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {client.email || client.phone}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`size-5 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {isSelected && (
                            <CheckCircle2Icon className="size-3" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {clients.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Hozircha mijozlaringiz yo'q.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </DrawerBody>

          <DrawerFooter className="mt-5">
            <Button
              onClick={handleSave}
              disabled={isSubmitting || isLoading}
              className="gap-2"
            >
              {isSubmitting ? (
                <LoaderCircleIcon className="size-4 animate-spin" />
              ) : (
                <CheckCircle2Icon className="size-4" />
              )}
              {editingChallenge ? "Saqlash" : "Yaratish"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDrawerOpen(false)}
            >
              Bekor qilish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AlertDialog
        open={Boolean(challengeToDelete)}
        onOpenChange={(open) => {
          if (!open) setChallengeToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Musobaqani o'chirmoqchimisiz?</AlertDialogTitle>
            <AlertDialogDescription>
              {challengeToDelete
                ? `${challengeToDelete.title} butunlay o'chiriladi.`
                : "Musobaqa butunlay o'chiriladi."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "O'chirilmoqda..." : "O'chirish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ForwardDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        onForward={confirmShare}
        message={
          challengeToShare
            ? { text: `Musobaqa: ${challengeToShare.title}` }
            : null
        }
      />

      <div className="mt-20 p-5 border-2 border-dashed rounded-3xl bg-muted/5 space-y-4">
        <p className="text-sm font-bold font-mono text-muted-foreground uppercase tracking-wider">
          DEBUG: Coach Context
        </p>
        <div className="grid gap-3">
          <div className="p-3 rounded-2xl bg-background border text-[10px] font-mono space-y-2">
            <p className="text-primary font-bold text-sm">
              Store Contents (
              {useCoachChallengeStore.getState().challenges?.length || 0}):
            </p>
            <div className="bg-black/5 p-2 rounded max-h-40 overflow-auto">
              {JSON.stringify(
                useCoachChallengeStore.getState().challenges,
                null,
                2,
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem("coach-challenges-storage");
                window.location.reload();
              }}
              className="w-full text-[8px] h-6 mt-2"
            >
              Reset Store
            </Button>
          </div>

          <div className="p-3 rounded-2xl bg-background border text-[10px] font-mono space-y-2">
            <p className="text-primary font-bold text-sm">
              Available Clients ({clients?.length || 0}):
            </p>
            <div className="grid gap-2">
              {(clients || []).map((c) => (
                <div key={c.id} className="p-2 border rounded-xl bg-muted/10">
                  <p className="font-bold">Name: {c.name}</p>
                  <p>Client ID: {c.id}</p>
                  <p>
                    User ID:{" "}
                    <span className="text-orange-600 font-bold">
                      {c.userId || c.user?.id || "MISSING"}
                    </span>
                  </p>
                  <p className="text-[8px] opacity-30 mt-1">
                    {JSON.stringify(c)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
