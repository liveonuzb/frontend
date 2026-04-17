import { find, get, toLower, trim } from "lodash";
import React from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import ChallengeActionsMenu from "./components/challenge-actions-menu";
import ChallengeFormDrawer from "./components/challenge-form-drawer";
import ChallengeTable from "./components/challenge-table";
import { format } from "date-fns";
import { uz, enUS, ru } from "date-fns/locale";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useBreadcrumbStore, useChatStore } from "@/store";
import { useCoachClients, useCoachGroups } from "@/hooks/app/use-coach";
import useGetQuery from "@/hooks/api/use-get-query";
import usePostQuery from "@/hooks/api/use-post-query";
import usePatchQuery from "@/hooks/api/use-patch-query";
import useDeleteQuery from "@/hooks/api/use-delete-query";
import usePostFileQuery from "@/hooks/api/use-post-file-query";
import { api } from "@/hooks/api/use-api";

const COACH_CHALLENGES_QUERY_KEY = ["coach-challenges"];
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

const getStatusMeta = (t) => ({
  UPCOMING: {
    label: t("coach.challenges.status.upcoming"),
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    icon: Clock3Icon,
  },
  ACTIVE: {
    label: t("coach.challenges.status.active"),
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2Icon,
  },
  COMPLETED: {
    label: t("coach.challenges.status.completed"),
    className: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
    icon: TrophyIcon,
  },
  CANCELLED: {
    label: t("coach.challenges.status.cancelled"),
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
    icon: StopCircleIcon,
  },
});

const getRewardModeMeta = (t) => ({
  FIXED_XP: {
    label: t("coach.challenges.rewardModes.fixedXp.label"),
    description: t("coach.challenges.rewardModes.fixedXp.description"),
  },
  PERCENT_OF_POOL: {
    label: t("coach.challenges.rewardModes.percentOfPool.label"),
    description: t("coach.challenges.rewardModes.percentOfPool.description"),
  },
  PLACE_XP: {
    label: t("coach.challenges.rewardModes.placeXp.label"),
    description: t("coach.challenges.rewardModes.placeXp.description"),
  },
});

const getMetricTypeMeta = (t) => ({
  STEPS: {
    label: t("coach.challenges.metricTypes.steps.label"),
    unit: t("coach.challenges.metricTypes.steps.unit"),
  },
  WORKOUT_MINUTES: {
    label: t("coach.challenges.metricTypes.workoutMinutes.label"),
    unit: t("coach.challenges.metricTypes.workoutMinutes.unit"),
  },
  BURNED_CALORIES: {
    label: t("coach.challenges.metricTypes.burnedCalories.label"),
    unit: t("coach.challenges.metricTypes.burnedCalories.unit"),
  },
  SLEEP_HOURS: {
    label: t("coach.challenges.metricTypes.sleepHours.label"),
    unit: t("coach.challenges.metricTypes.sleepHours.unit"),
  },
});

const getMetricAggregationMeta = (t) => ({
  SUM: t("coach.challenges.aggregations.sum"),
  AVERAGE: t("coach.challenges.aggregations.average"),
});

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
    coachGroupId: "",
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
  challenge.rewardMode || get(challenge, "rewardDetails.mode") || "FIXED_XP";

const getChallengeImageUrl = (challenge) =>
  get(challenge, "image.url") || challenge.imageUrl || "";

const getRewardSummary = (challenge, t) => {
  const mode = getChallengeRewardMode(challenge);
  const rewardModeMeta = getRewardModeMeta(t);

  if (mode === "FIXED_XP") {
    const fixedXp =
      get(challenge, "rewardDetails.fixedXp") ?? challenge.rewardXp ?? 0;
    return {
      title: `${t("coach.challenges.table.rewardPrefix")}${fixedXp} XP`,
      subtitle: rewardModeMeta.FIXED_XP.description,
    };
  }

  if (mode === "PERCENT_OF_POOL") {
    const percent =
      get(challenge, "rewardDetails.percent") ?? challenge.rewardPercent ?? 0;
    const preview = get(challenge, "rewardDetails.previewRewardXp") ?? 0;
    return {
      title: `${t("coach.challenges.table.rewardPrefix")}${percent}% (≈ ${preview} XP)`,
      subtitle: rewardModeMeta.PERCENT_OF_POOL.description,
    };
  }

  const placeRewards = challenge.placeRewards || {};
  const placeLabel = Object.entries(placeRewards)
    .slice(0, 3)
    .map(
      ([place, value]) =>
        `${place}${t("coach.challenges.table.placeSuffix")} ${value} XP`,
    )
    .join(" · ");

  return {
    title: `${t("coach.challenges.table.rewardPrefix")}${placeLabel || t("coach.challenges.table.placeRewardsLabel")}`,
    subtitle: rewardModeMeta.PLACE_XP.description,
  };
};

const getMetricSummary = (challenge, t) => {
  const type =
    get(challenge, "metricDetails.type") || challenge.metricType || "STEPS";
  const aggregation =
    get(challenge, "metricDetails.aggregation") ||
    challenge.metricAggregation ||
    "SUM";
  const target =
    get(challenge, "metricDetails.target") ?? challenge.metricTarget ?? 0;

  const metricTypeMeta = getMetricTypeMeta(t);
  const metricAggregationMeta = getMetricAggregationMeta(t);

  const typeMeta = metricTypeMeta[type] || metricTypeMeta.STEPS;
  const aggregationLabel =
    metricAggregationMeta[aggregation] || metricAggregationMeta.SUM;

  return `${typeMeta.label}: ${target} ${typeMeta.unit} (${aggregationLabel})`;
};

const Index = () => {
  const { t, i18n } = useTranslation();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLocale =
    i18n.language === "uz" ? uz : i18n.language === "ru" ? ru : enUS;

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

  // --- Data fetching via API hooks ---
  const { data: challengesData, isLoading } = useGetQuery({
    url: "/coach/challenges",
    queryProps: {
      queryKey: COACH_CHALLENGES_QUERY_KEY,
    },
  });
  const challenges = get(challengesData, "data.data", []);

  const { mutateAsync: createChallengeMutation } = usePostQuery({
    queryKey: COACH_CHALLENGES_QUERY_KEY,
  });

  const { mutateAsync: createChallengeWithFileMutation } = usePostFileQuery({
    queryKey: COACH_CHALLENGES_QUERY_KEY,
  });

  const { mutateAsync: updateChallengeMutation } = usePatchQuery({
    queryKey: COACH_CHALLENGES_QUERY_KEY,
  });

  const { mutateAsync: deleteChallengeMutation } = useDeleteQuery({
    queryKey: COACH_CHALLENGES_QUERY_KEY,
  });

  const { clients, isLoading: isClientsLoading } = useCoachClients();
  const { groups = [] } = useCoachGroups();

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
      { url: "/coach", title: t("coach.clients.breadcrumbs.coach") },
      { url: "/coach/challenges", title: t("coach.challenges.title") },
    ]);
  }, [setBreadcrumbs, t]);

  React.useEffect(() => {
    // Challenges are now fetched automatically via useGetQuery above.
    fetchRooms();
  }, [fetchRooms]);

  React.useEffect(
    () => () => {
      if (formData.imagePreviewUrl?.startsWith("blob:")) {
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
        toLower(challenge.description).includes(query);
      const matchesStatus =
        statusFilter === "all" || challenge.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [challenges, deferredSearch, statusFilter]);

  const filterFields = React.useMemo(
    () => [
      {
        label: t("coach.challenges.filters.search.label"),
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: t("coach.challenges.filters.search.placeholder"),
      },
      {
        label: t("coach.challenges.filters.status.label"),
        key: "status",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: t("coach.challenges.filters.status.all") },
          { value: "UPCOMING", label: t("coach.challenges.status.upcoming") },
          { value: "ACTIVE", label: t("coach.challenges.status.active") },
          { value: "COMPLETED", label: t("coach.challenges.status.completed") },
          { value: "CANCELLED", label: t("coach.challenges.status.cancelled") },
        ],
      },
    ],
    [t],
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
      const nextSearch = get(
        find(nextFilters, (item) => item.field === "q"),
        "values[0]",
        "",
      );
      const nextStatus = get(
        find(nextFilters, (item) => item.field === "status"),
        "values[0]",
        "all",
      );

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
        get(challenge, "rewardDetails.fixedXp") ?? challenge.rewardXp ?? 0,
      ),
      rewardPercent: String(
        get(challenge, "rewardDetails.percent") ??
          challenge.rewardPercent ??
          "",
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
        get(challenge, "metricDetails.type") ?? challenge.metricType ?? "STEPS",
      metricAggregation:
        get(challenge, "metricDetails.aggregation") ??
        challenge.metricAggregation ??
        "SUM",
      metricTarget: String(
        get(challenge, "metricDetails.target") ??
          challenge.metricTarget ??
          10000,
      ),
      imageFile: null,
      imagePreviewUrl: getChallengeImageUrl(challenge),
      imageId: challenge.imageId ?? get(challenge, "image.id") ?? null,
      removeImage: false,
      coachGroupId: challenge.coachGroupId ?? "",
      participantIds: (challenge.participants || []).map((p) => p.id),
    });
    setDrawerOpen(true);
  }, []);

  const handleSave = React.useCallback(async () => {
    if (!trim(formData.title)) {
      toast.error(t("coach.challenges.toasts.titleRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        startDate: formData.startDate,
        endDate: formData.endDate,
        joinFeeXp: formData.joinFeeXp,
        rewardMode: formData.rewardMode,
        rewardXp: formData.rewardXp,
        rewardPercent: formData.rewardPercent,
        firstPlaceXp: formData.firstPlaceXp,
        secondPlaceXp: formData.secondPlaceXp,
        thirdPlaceXp: formData.thirdPlaceXp,
        maxParticipants: formData.maxParticipants,
        metricType: formData.metricType,
        metricAggregation: formData.metricAggregation,
        metricTarget: formData.metricTarget,
        removeImage: formData.removeImage,
        coachGroupId: formData.coachGroupId || undefined,
        participantIds: formData.participantIds,
      };

      const notifyNewParticipants = (
        challengeId,
        challengeTitle,
        challengeDescription,
        previousParticipantIds = [],
      ) => {
        const newParticipantIds = formData.participantIds.filter(
          (id) => !previousParticipantIds.includes(id),
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
                challengeId,
                challengeTitle,
                challengeDescription,
              );
            } else {
              console.warn(`Room not found for participant ${id}`);
            }
          });
        }
      };

      if (editingChallenge) {
        let mutationFn;
        let mutationArgs;

        if (formData.imageFile) {
          const formDataObj = new FormData();
          Object.entries(payload).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              if (Array.isArray(value)) {
                value.forEach((v) => formDataObj.append(key, v));
              } else {
                formDataObj.append(key, value);
              }
            }
          });
          formDataObj.append("image", formData.imageFile);
          mutationFn = updateChallengeMutation;
          mutationArgs = {
            url: `/coach/challenges/${editingChallenge.id}`,
            attributes: formDataObj,
            config: { headers: { "Content-Type": "multipart/form-data" } },
          };
        } else {
          mutationFn = updateChallengeMutation;
          mutationArgs = {
            url: `/coach/challenges/${editingChallenge.id}`,
            attributes: payload,
          };
        }

        const response = await mutationFn(mutationArgs);
        const updated = get(
          response,
          "data.data",
          get(response, "data", payload),
        );
        const currentParticipantIds = (editingChallenge.participants || []).map(
          (p) => p.id,
        );
        notifyNewParticipants(
          editingChallenge.id,
          updated.title || formData.title,
          updated.description || formData.description,
          currentParticipantIds,
        );

        setDrawerOpen(false);
        setEditingChallenge(null);
        toast.success(t("coach.challenges.toasts.updateSuccess"));
      } else {
        let response;

        if (formData.imageFile) {
          const formDataObj = new FormData();
          Object.entries(payload).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              if (Array.isArray(value)) {
                value.forEach((v) => formDataObj.append(key, v));
              } else {
                formDataObj.append(key, value);
              }
            }
          });
          formDataObj.append("image", formData.imageFile);
          response = await createChallengeWithFileMutation({
            url: "/coach/challenges",
            attributes: formDataObj,
            config: { headers: { "Content-Type": "multipart/form-data" } },
          });
        } else {
          response = await createChallengeMutation({
            url: "/coach/challenges",
            attributes: payload,
          });
        }

        const newChallenge = get(
          response,
          "data.data",
          get(response, "data", {}),
        );
        notifyNewParticipants(
          newChallenge.id,
          newChallenge.title || formData.title,
          newChallenge.description || formData.description,
        );

        setDrawerOpen(false);
        setEditingChallenge(null);
        toast.success(t("coach.challenges.toasts.createSuccess"));
      }
    } catch (error) {
      toast.error(t("coach.challenges.toasts.error"));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    t,
    contacts,
    sendSharedContent,
    createChallengeMutation,
    createChallengeWithFileMutation,
    editingChallenge,
    formData,
    updateChallengeMutation,
  ]);

  const handleDelete = React.useCallback(async () => {
    if (!challengeToDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteChallengeMutation({
        url: `/coach/challenges/${challengeToDelete.id}`,
      });
      setChallengeToDelete(null);
      toast.success(t("coach.challenges.toasts.deleteSuccess"));
    } catch (error) {
      toast.error(t("coach.challenges.toasts.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  }, [t, challengeToDelete, deleteChallengeMutation]);

  const handleShare = React.useCallback(async (challenge) => {
    try {
      const response = await api.get(
        `/coach/challenges/${challenge.id}/share-link`,
      );
      const share = get(response, "data.data", get(response, "data", {}));
      setChallengeToShare({ ...challenge, shareUrl: share.shareUrl });
      setShareDialogOpen(true);
    } catch {
      setChallengeToShare(challenge);
      setShareDialogOpen(true);
    }
  }, []);

  const handleRunIntegrity = React.useCallback(async (challenge) => {
    try {
      const response = await api.post(
        `/coach/challenges/${challenge.id}/integrity/run`,
        {},
      );
      const flags = get(
        response,
        "data.data.items",
        get(response, "data.items", []),
      );
      toast.success(`Anti-cheat tekshiruv yakunlandi: ${flags.length} flag`);
    } catch {
      toast.error("Anti-cheat tekshiruv bajarilmadi");
    }
  }, []);

  const confirmShare = React.useCallback(
    (chatId) => {
      if (!challengeToShare) return;

      sendSharedContent(
        chatId,
        "challenge",
        challengeToShare.id,
        challengeToShare.title,
        [
          challengeToShare.description || challengeToShare.title,
          challengeToShare.shareUrl,
        ]
          .filter(Boolean)
          .join("\n"),
      );

      toast.success(t("coach.challenges.toasts.shareSuccess"));
      setShareDialogOpen(false);
      setChallengeToShare(null);
    },
    [t, challengeToShare, sendSharedContent],
  );

  const handleImageChange = React.useCallback((event) => {
    const file = get(event, "target.files[0]");

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
        header: t("coach.challenges.table.columns.challenge"),
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
                  {challenge.title || t("coach.challenges.table.unnamed")}
                </p>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {challenge.description ||
                    t("coach.challenges.table.noDescription")}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: t("coach.challenges.table.columns.status"),
        size: 130,
        cell: (info) => {
          const status = info.getValue();
          const statusMeta = getStatusMeta(t);
          const meta = statusMeta[status] || statusMeta.UPCOMING;
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
        header: t("coach.challenges.table.columns.period"),
        size: 180,
        cell: (info) => {
          const challenge = info.row.original;

          return (
            <div className="text-sm">
              <p className="font-medium">
                {format(new Date(challenge.startDate), "dd MMM yyyy, HH:mm", {
                  locale: currentLocale,
                })}
              </p>
              <p className="text-muted-foreground">
                {format(new Date(challenge.endDate), "dd MMM yyyy, HH:mm", {
                  locale: currentLocale,
                })}
              </p>
            </div>
          );
        },
      },
      {
        id: "stats",
        header: t("coach.challenges.table.columns.stats"),
        size: 170,
        cell: (info) => {
          const challenge = info.row.original;
          const rewardSummary = getRewardSummary(challenge, t);
          const metricSummary = getMetricSummary(challenge, t);

          return (
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-1 text-muted-foreground">
                <UsersIcon className="size-3.5" />
                {get(challenge, "participants.length") ||
                  get(challenge, "_count.participants") ||
                  get(challenge, "participantCount", 0)}
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
              onRunIntegrity={handleRunIntegrity}
            />
          </div>
        ),
      },
    ],
    [t, currentLocale, openEditDrawer, handleShare, handleRunIntegrity],
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
          {t("coach.challenges.title")}
        </h1>
        <Button onClick={openCreateDrawer} className="gap-1.5">
          <PlusIcon className="size-4" />
          {t("coach.challenges.addChallenge")}
        </Button>
      </div>

      <Filters
        fields={filterFields}
        filters={activeFilters}
        onChange={handleFiltersChange}
        allowMultiple={false}
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          {filteredChallenges.length} {t("coach.challenges.countSuffix")}
        </p>
      </div>

      <ChallengeTable
        table={table}
        isLoading={isLoading}
        filteredChallenges={filteredChallenges}
      />

      <ChallengeFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        editingChallenge={editingChallenge}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        isLoading={isLoading}
        clients={clients}
        groups={groups}
        onSave={handleSave}
        onImageChange={handleImageChange}
        onImageRemove={handleImageRemove}
      />

      {/* Legacy drawer content - replaced by ChallengeFormDrawer above */}
      {false && <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="bottom">
        <DrawerContent className="outline-none">
          <DrawerHeader className="border-b border-border/40 pb-4 pt-5">
            <DrawerTitle className="text-foreground text-xl font-bold text-center">
              {editingChallenge
                ? t("coach.challenges.drawer.editTitle")
                : t("coach.challenges.drawer.newTitle")}
            </DrawerTitle>
            <DrawerDescription className="text-center">
              {t("coach.challenges.drawer.description")}
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="flex flex-col gap-8 py-6">
            <div className="flex flex-col gap-3">
              <span className="text-sm font-bold text-muted-foreground tracking-wide px-2 uppercase">
                {t("coach.challenges.drawer.sections.basicInfo")}
              </span>
              <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col gap-4 p-4">
                <Field>
                  <FieldLabel className="flex items-center gap-2 font-semibold">
                    <ImagePlusIcon className="size-4 text-primary" />
                    {t("coach.challenges.drawer.fields.coverImage")}
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
                          {t("coach.challenges.drawer.fields.selectImage")}
                        </label>
                      </Button>
                      {formData.imagePreviewUrl ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleImageRemove}
                        >
                          <XIcon className="mr-1 size-4" />
                          {t("coach.challenges.drawer.fields.removeImage")}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </Field>

                <Field>
                  <FieldLabel className="font-semibold">
                    {t("coach.challenges.drawer.fields.title")}
                  </FieldLabel>
                  <Input
                    value={formData.title}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder={t(
                      "coach.challenges.drawer.fields.titlePlaceholder",
                    )}
                    className="rounded-xl"
                  />
                </Field>

                <Field>
                  <FieldLabel className="font-semibold">
                    {t("coach.challenges.drawer.fields.descriptionLabel")}
                  </FieldLabel>
                  <Input
                    value={formData.description}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder={t(
                      "coach.challenges.drawer.fields.descriptionPlaceholder",
                    )}
                    className="rounded-xl"
                  />
                </Field>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-bold text-muted-foreground tracking-wide px-2 uppercase">
                {t("coach.challenges.drawer.sections.timeAndStatus")}
              </span>
              <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col gap-4 p-4">
                <Field>
                  <FieldLabel className="font-semibold">
                    {t("coach.challenges.drawer.fields.status")}
                  </FieldLabel>
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
                      {t("coach.challenges.status.upcoming")}
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="ACTIVE"
                      className="flex-1 rounded-lg text-xs md:text-sm"
                    >
                      {t("coach.challenges.status.active")}
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="COMPLETED"
                      className="flex-1 rounded-lg text-xs md:text-sm"
                    >
                      {t("coach.challenges.status.completed")}
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="CANCELLED"
                      className="flex-1 rounded-lg text-xs md:text-sm"
                    >
                      {t("coach.challenges.status.cancelled")}
                    </ToggleGroupItem>
                  </ToggleGroup>
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel className="font-semibold">
                      {t("coach.challenges.drawer.fields.startTime")}
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
                      {t("coach.challenges.drawer.fields.endTime")}
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
                {t("coach.challenges.drawer.sections.settings")}
              </span>
              <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col gap-4 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel className="font-semibold">
                      {t("coach.challenges.drawer.fields.joinFee")}
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
                      {t("coach.challenges.drawer.fields.maxParticipants")}
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
                        <NumberFieldInput
                          placeholder={t(
                            "coach.challenges.drawer.fields.infinite",
                          )}
                        />
                        <NumberFieldIncrement />
                      </NumberFieldGroup>
                    </NumberField>
                  </Field>
                </div>

                <Field>
                  <FieldLabel className="font-semibold">
                    {t("coach.challenges.drawer.fields.rewardMode")}
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
                      {t("coach.challenges.rewardModes.fixedXp.label")}
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="PERCENT_OF_POOL"
                      className="flex-1 rounded-lg text-xs md:text-sm"
                    >
                      {t("coach.challenges.rewardModes.percentOfPool.label")}
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="PLACE_XP"
                      className="flex-1 rounded-lg text-xs md:text-sm"
                    >
                      {t("coach.challenges.rewardModes.placeXp.label")}
                    </ToggleGroupItem>
                  </ToggleGroup>
                </Field>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field>
                    <FieldLabel className="font-semibold">
                      {t("coach.challenges.drawer.fields.metric")}
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
                        {Object.entries(getMetricTypeMeta(t)).map(
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
                      {t("coach.challenges.drawer.fields.aggregation")}
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
                        {Object.entries(getMetricAggregationMeta(t)).map(
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
                      {t("coach.challenges.drawer.fields.target")} (
                      {getMetricTypeMeta(t)[formData.metricType]?.unit ||
                        "unit"}
                      )
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
                      {t("coach.challenges.drawer.fields.totalReward")}
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
                      {t("coach.challenges.drawer.fields.rewardPercent")}
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
                        ? t("coach.challenges.drawer.fields.placeInfoPercent")
                        : t("coach.challenges.drawer.fields.placeInfoFixed")}
                    </p>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field>
                        <FieldLabel className="font-semibold">
                          {t("coach.challenges.drawer.fields.placeLabel", {
                            place: 1,
                          })}{" "}
                          ({isPlacePercentInput ? "%" : "XP"})
                        </FieldLabel>
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
                        <FieldLabel className="font-semibold">
                          {t("coach.challenges.drawer.fields.placeLabel", {
                            place: 2,
                          })}{" "}
                          ({isPlacePercentInput ? "%" : "XP"})
                        </FieldLabel>
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
                        <FieldLabel className="font-semibold">
                          {t("coach.challenges.drawer.fields.placeLabel", {
                            place: 3,
                          })}{" "}
                          ({isPlacePercentInput ? "%" : "XP"})
                        </FieldLabel>
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
                {t("coach.challenges.drawer.sections.participants")}
              </span>
              <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col gap-2 p-4">
                {groups.length > 0 ? (
                  <Field className="mb-3">
                    <FieldLabel className="font-semibold">
                      Group challenge
                    </FieldLabel>
                    <Select
                      value={formData.coachGroupId || "none"}
                      onValueChange={(value) => {
                        const groupId = value === "none" ? "" : value;
                        const group = groups.find(
                          (item) => item.id === groupId,
                        );
                        setFormData((current) => ({
                          ...current,
                          coachGroupId: groupId,
                          participantIds: groupId
                            ? get(group, "clientIds", [])
                            : current.participantIds,
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Guruh tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Guruhsiz</SelectItem>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name} ({group.memberCount || 0})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                ) : null}
                <p className="text-xs text-muted-foreground mb-2">
                  {t("coach.challenges.drawer.fields.participantsDescription")}
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
                      {t("coach.challenges.drawer.fields.noClients")}
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
              {editingChallenge
                ? t("coach.challenges.actions.save")
                : t("coach.challenges.actions.create")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDrawerOpen(false)}
            >
              {t("coach.challenges.actions.cancel")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>}

      <AlertDialog
        open={Boolean(challengeToDelete)}
        onOpenChange={(open) => {
          if (!open) setChallengeToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("coach.challenges.deleteDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {challengeToDelete
                ? t("coach.challenges.deleteDialog.description", {
                    title: challengeToDelete.title,
                  })
                : t("coach.challenges.deleteDialog.description", {
                    title: t("coach.challenges.title"),
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("coach.challenges.actions.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting
                ? t("coach.challenges.deleteDialog.deleting")
                : t("coach.challenges.deleteDialog.confirm")}
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
            ? {
                text: [
                  `${t("coach.challenges.shareDialog.prefix")}${challengeToShare.title}`,
                  challengeToShare.shareUrl,
                ]
                  .filter(Boolean)
                  .join("\n"),
              }
            : null
        }
      />
    </div>
  );
};

export default Index;
