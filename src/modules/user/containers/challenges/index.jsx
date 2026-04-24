import React from "react";
import {
  find,
  get,
  includes,
  keys,
  some,
  trim,
} from "lodash";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ActivityIcon,
  ArrowRightIcon,
  BellIcon,
  CheckCircle2Icon,
  CircleOffIcon,
  Clock3Icon,
  FlagIcon,
  MailPlusIcon,
  SearchIcon,
  SparklesIcon,
  TrophyIcon,
  UserIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";
import { useChallengeStore } from "@/store/challenges-store";
import { useAuthStore, useBreadcrumbStore } from "@/store";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const CHALLENGE_STATUS_META = {
  UPCOMING: {
    label: "Boshlanmagan",
    className:
      "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    icon: Clock3Icon,
  },
  ACTIVE: {
    label: "Faol",
    className:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    icon: FlagIcon,
  },
  COMPLETED: {
    label: "Yakunlangan",
    className:
      "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    icon: CheckCircle2Icon,
  },
  CANCELLED: {
    label: "Bekor qilingan",
    className:
      "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    icon: CircleOffIcon,
  },
};

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "Barcha holatlar" },
  { value: "UPCOMING", label: "Boshlanmagan" },
  { value: "ACTIVE", label: "Faol" },
  { value: "COMPLETED", label: "Yakunlangan" },
  { value: "CANCELLED", label: "Bekor qilingan" },
];

const METRIC_TYPE_OPTIONS = [
  { value: "STEPS", label: "Qadam", unit: "qadam" },
  { value: "WORKOUT_MINUTES", label: "Mashq vaqti", unit: "daqiqa" },
  { value: "BURNED_CALORIES", label: "Yondirilgan kaloriya", unit: "kcal" },
  { value: "SLEEP_HOURS", label: "Uyqu", unit: "soat" },
];

const formatChallengeDateRange = (startDate, endDate) => {
  try {
    return `${format(new Date(startDate), "dd MMM", { locale: uz })} - ${format(
      new Date(endDate),
      "dd MMM",
      { locale: uz },
    )}`;
  } catch {
    return "Sana belgilanmagan";
  }
};

const formatRewardText = (challenge) => {
  const details = challenge?.rewardDetails;
  if (
    get(details, "mode") === "PERCENT_OF_POOL" &&
    get(details, "percent") != null
  ) {
    return `${get(details, "percent")}% pool`;
  }

  if (
    get(details, "mode") === "PLACE_XP" &&
    get(details, "placeRewardPreview") &&
    typeof get(details, "placeRewardPreview") === "object"
  ) {
    const places = keys(get(details, "placeRewardPreview"));
    if (places.length) {
      return `Top ${places.length} o'rin`;
    }
    return "O'rin bo'yicha";
  }

  const previewRewardXp = details?.previewRewardXp ?? challenge?.rewardXp ?? 0;
  if (previewRewardXp > 0) {
    return `${new Intl.NumberFormat("uz-UZ").format(previewRewardXp)} XP`;
  }
  return "Mukofot yo'q";
};

const getMetricMeta = (type) =>
  find(METRIC_TYPE_OPTIONS, { value: type }) || METRIC_TYPE_OPTIONS[0];

const ChallengeCard = ({
  challenge,
  userId,
  isBusy,
  onJoin,
  onInvite,
  onViewDetail,
}) => {
  const statusMeta = get(
    CHALLENGE_STATUS_META,
    challenge.status,
    CHALLENGE_STATUS_META.UPCOMING,
  );
  const StatusIcon = statusMeta.icon;

  const participantCount =
    get(challenge, "_count.participants") ??
    get(challenge, "participants.length") ??
    0;
  const isParticipant = Boolean(
    challenge.isJoined ||
    some(
      challenge.participants,
      (participant) => participant.userId === userId,
    ),
  );

  const maxParticipants = Number(get(challenge, "maxParticipants", 0)) || null;
  const isFull = Boolean(
    maxParticipants && participantCount >= maxParticipants,
  );
  const isJoinClosed = includes(["COMPLETED", "CANCELLED"], challenge.status);

  const joinFeeXp = Number(get(challenge, "joinFeeXp", 0));
  const metricType =
    get(challenge, "metricDetails.type") || challenge.metricType || "STEPS";
  const metricTarget = Number(
    get(challenge, "metricDetails.target") ?? challenge.metricTarget ?? 0,
  );
  const metricMeta = getMetricMeta(metricType);

  const buttonLabel = isParticipant
    ? "Qatnashyapsiz"
    : isFull
      ? "Joy qolmagan"
      : isJoinClosed
        ? "Yopilgan"
        : isBusy
          ? "Kutilmoqda..."
          : joinFeeXp > 0
            ? `Qo'shilish (${joinFeeXp} XP)`
            : "Tekin qo'shilish";

  return (
    <motion.div
      layout
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-border/50 bg-card/60 backdrop-blur-md transition-shadow hover:shadow-2xl hover:shadow-primary/10"
    >
      {/* Card Image Wrapper */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {challenge?.image?.url ? (
          <img loading="lazy"
            src={challenge.image.url}
            alt={challenge.title}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-primary/30 via-primary/5 to-background transition-colors group-hover:from-primary/40" />
        )}

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Badges Overlay */}
        <div className="absolute left-4 top-4">
          <Badge
            variant="outline"
            className={cn(
              "backdrop-blur-md text-[10px] uppercase font-bold tracking-widest px-2.5 py-1",
              statusMeta.className,
            )}
          >
            <StatusIcon className="mr-1.5 size-3" />
            {statusMeta.label}
          </Badge>
        </div>

        {/* Reward Badge */}
        <div className="absolute right-4 top-4">
          <div className="flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black text-amber-950 shadow-lg shadow-amber-400/20">
            <TrophyIcon className="size-3.5" />
            {formatRewardText(challenge)}
          </div>
        </div>

        {/* Bottom Title overlay */}
        <div className="absolute bottom-0 inset-x-0 p-5">
          <h3 className="line-clamp-1 text-lg font-black tracking-tight text-white drop-shadow-md">
            {challenge.title}
          </h3>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col p-5">
        <p className="line-clamp-2 text-sm font-medium text-muted-foreground leading-relaxed h-10 mb-4">
          {challenge.description || "Ta'rif kiritilmagan"}
        </p>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl bg-muted/30 p-3 ring-1 ring-inset ring-white/5">
            <div className="flex items-center gap-2 mb-1.5">
              <Clock3Icon className="size-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                Muddat
              </span>
            </div>
            <p className="text-xs font-bold text-foreground">
              {formatChallengeDateRange(challenge.startDate, challenge.endDate)}
            </p>
          </div>
          <div className="rounded-2xl bg-muted/30 p-3 ring-1 ring-inset ring-white/5">
            <div className="flex items-center gap-2 mb-1.5">
              <UsersIcon className="size-3.5 text-orange-500" />
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                A&apos;zolar
              </span>
            </div>
            <p className="text-xs font-bold text-foreground">
              {participantCount}
              {maxParticipants ? ` / ${maxParticipants}` : " (Cheksiz)"}
            </p>
          </div>
        </div>

        {/* Metric Target Row */}
        <div className="mb-6 rounded-2xl border border-primary/10 bg-primary/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm shadow-primary/30">
              <ZapIcon className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">
                {metricMeta.label}
              </p>
              <p className="text-sm font-black text-foreground">
                {metricTarget.toLocaleString()} {metricMeta.unit}
              </p>
            </div>
          </div>
          {maxParticipants && (
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                {Math.round((participantCount / maxParticipants) * 100)}%
                to&apos;lgan
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-auto flex items-center gap-2.5">
          <Button
            size="lg"
            className={cn(
              "h-12 flex-1 rounded-2xl font-bold shadow-lg transition-all active:scale-95",
              isParticipant
                ? "bg-muted text-foreground border border-border/50 shadow-none hover:bg-muted/80"
                : "bg-primary hover:bg-primary/90 text-white shadow-primary/20",
            )}
            onClick={() => onJoin(challenge.id)}
            disabled={isParticipant || isFull || isJoinClosed || isBusy}
          >
            {buttonLabel}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12 w-12 rounded-2xl border-border/50 bg-background/50 p-0 shadow-sm transition-all hover:bg-muted active:scale-90"
            onClick={() => onViewDetail(challenge.id)}
            title="Batafsil ko'rish"
          >
            <ArrowRightIcon className="size-5 text-muted-foreground" />
          </Button>
          {isParticipant && !isJoinClosed && (
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-12 rounded-2xl border-border/50 bg-background/50 p-0 shadow-sm transition-all hover:bg-muted active:scale-90"
              onClick={() => onInvite(challenge)}
              title="Taklif qilish"
            >
              <MailPlusIcon className="size-5 text-primary" />
            </Button>
          )}
        </div>
      </CardContent>
    </motion.div>
  );
};

export default function ChallengesContainer() {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { user } = useAuthStore();
  const {
    challenges,
    challengeInvitations,
    inviteCandidates,
    isLoading,
    actionLoading,
    fetchChallenges,
    joinChallenge,
    fetchMyInvitations,
    searchInviteCandidates,
    inviteFriends,
    respondToInvitation,
  } = useChallengeStore();
  const challengeList = React.useMemo(
    () => (Array.isArray(challenges) ? challenges : []),
    [challenges],
  );
  const challengeInvitationList = React.useMemo(
    () => (Array.isArray(challengeInvitations) ? challengeInvitations : []),
    [challengeInvitations],
  );

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [isInviteDrawerOpen, setIsInviteDrawerOpen] = React.useState(false);
  const [inviteSearch, setInviteSearch] = React.useState("");
  const [inviteChallenge, setInviteChallenge] = React.useState(null);
  const [selectedInvitees, setSelectedInvitees] = React.useState([]);
  const [inviteMessage, setInviteMessage] = React.useState("");

  const deferredSearch = React.useDeferredValue(search);
  const deferredInviteSearch = React.useDeferredValue(inviteSearch);
  const joiningById = get(actionLoading, "joiningById", {});
  const respondingById = get(actionLoading, "respondingById", {});
  const isInvitingFriends = Boolean(actionLoading?.inviting);

  React.useEffect(() => {
    fetchChallenges();
    fetchMyInvitations();
  }, [fetchChallenges, fetchMyInvitations]);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/challenges", title: "Musobaqalar" },
    ]);
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    if (!isInviteDrawerOpen || !inviteChallenge?.id) {
      return;
    }
    searchInviteCandidates(inviteChallenge.id, deferredInviteSearch);
  }, [
    deferredInviteSearch,
    inviteChallenge?.id,
    isInviteDrawerOpen,
    searchInviteCandidates,
  ]);

  const filteredChallenges = React.useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return challengeList.filter((challenge) => {
      if (statusFilter !== "ALL" && challenge.status !== statusFilter)
        return false;

      if (!query) return true;

      const title = String(get(challenge, "title", "")).toLowerCase();
      const description = String(
        get(challenge, "description", ""),
      ).toLowerCase();
      const creatorName = String(
        get(challenge, "creator.profile.firstName", ""),
      ).toLowerCase();
      return (
        includes(title, query) ||
        includes(description, query) ||
        includes(creatorName, query)
      );
    });
  }, [challengeList, deferredSearch, statusFilter]);

  const stats = React.useMemo(() => {
    const total = challengeList.length;
    const active = challengeList.filter(
      (item) => item.status === "ACTIVE",
    ).length;
    const joined = challengeList.filter(
      (item) =>
        item.isJoined ||
        some(
          item.participants,
          (participant) => participant.userId === user?.id,
        ),
    ).length;

    return { total, active, joined };
  }, [challengeList, user?.id]);

  const pendingInvitations = React.useMemo(
    () =>
      challengeInvitationList.filter(
        (invitation) => get(invitation, "status") === "PENDING",
      ),
    [challengeInvitationList],
  );

  const handleJoin = async (challengeId) => {
    if (joiningById[challengeId]) {
      return;
    }
    try {
      await joinChallenge(challengeId);
    } catch {
      // store-level toast handles errors
    }
  };

  const openInviteDrawer = React.useCallback(
    async (challenge) => {
      setInviteChallenge(challenge);
      setInviteSearch("");
      setSelectedInvitees([]);
      setInviteMessage("");
      setIsInviteDrawerOpen(true);
      await searchInviteCandidates(challenge.id, "");
    },
    [searchInviteCandidates],
  );

  const toggleInvitee = React.useCallback((userId) => {
    setSelectedInvitees((current) =>
      includes(current, userId)
        ? current.filter((item) => item !== userId)
        : [...current, userId],
    );
  }, []);

  const handleSendInvites = React.useCallback(async () => {
    if (
      !inviteChallenge?.id ||
      selectedInvitees.length === 0 ||
      isInvitingFriends
    ) {
      return;
    }

    try {
      await inviteFriends(
        inviteChallenge.id,
        {
          userIds: selectedInvitees,
          ...(inviteMessage.trim() ? { message: inviteMessage.trim() } : {}),
        },
        () => {
          setIsInviteDrawerOpen(false);
          setInviteChallenge(null);
          setSelectedInvitees([]);
          setInviteMessage("");
        },
      );
    } catch {
      // store-level toast handles errors
    }
  }, [
    inviteChallenge?.id,
    inviteFriends,
    inviteMessage,
    isInvitingFriends,
    selectedInvitees,
  ]);

  const handleInvitationResponse = React.useCallback(
    async (invitationId, action) => {
      if (respondingById[invitationId]) {
        return;
      }
      try {
        await respondToInvitation(invitationId, action);
      } catch {
        // store-level toast handles errors
      }
    },
    [respondToInvitation, respondingById],
  );

  return (
    <PageTransition>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-24">
        <AnimatePresence>
          {pendingInvitations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-1 shadow-xl shadow-primary/5"
            >
              <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -left-12 -bottom-12 size-40 rounded-full bg-orange-500/10 blur-3xl" />

              <div className="relative flex flex-col gap-4 p-5 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20 ring-4 ring-primary/10">
                    <BellIcon className="size-6 text-white animate-bounce-subtle" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-foreground">
                      Challenge takliflari
                    </h2>
                    <p className="text-sm text-muted-foreground font-medium">
                      Do&apos;stlaringiz sizni musobaqaga chorlamoqda
                    </p>
                  </div>
                </div>

                <div className="flex -space-x-3 overflow-hidden">
                  {pendingInvitations.slice(0, 3).map((invitation, i) => (
                    <div
                      key={invitation.id}
                      className="size-10 rounded-full border-2 border-background bg-muted flex items-center justify-center transition-transform hover:-translate-y-1 hover:z-10 cursor-help"
                      title={invitation.inviter?.name}
                    >
                      <UserIcon className="size-5 text-muted-foreground" />
                    </div>
                  ))}
                  {pendingInvitations.length > 3 && (
                    <div className="flex size-10 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-[10px] font-bold text-primary">
                      +{pendingInvitations.length - 3}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-3 p-3 pt-0 sm:p-6 sm:pt-0">
                {pendingInvitations.slice(0, 2).map((invitation) => (
                  <motion.div
                    key={invitation.id}
                    layout
                    className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/50 p-4 transition-all hover:border-primary/30 hover:bg-card/80"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-colors">
                          <TrophyIcon className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-bold text-foreground">
                            {invitation.challenge?.title || "Challenge"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                              {invitation.inviter?.name || "Foydalanuvchi"} dan
                            </span>
                            {invitation.message && (
                              <span className="text-[11px] text-muted-foreground line-clamp-1 italic italic-muted tracking-tight">
                                &quot;{invitation.message}&quot;
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 rounded-xl px-4 font-semibold hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={() =>
                            handleInvitationResponse(invitation.id, "DECLINE")
                          }
                          disabled={Boolean(respondingById[invitation.id])}
                        >
                          {respondingById[invitation.id] ? "..." : "Rad etish"}
                        </Button>
                        <Button
                          size="sm"
                          className="h-9 rounded-xl px-5 font-bold shadow-md shadow-primary/20"
                          onClick={() =>
                            handleInvitationResponse(invitation.id, "ACCEPT")
                          }
                          disabled={Boolean(respondingById[invitation.id])}
                        >
                          {respondingById[invitation.id]
                            ? "..."
                            : "Qabul qilish"}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {pendingInvitations.length > 2 && (
                  <button className="text-xs font-bold text-primary/70 hover:text-primary transition-colors py-1">
                    Barcha {pendingInvitations.length} ta taklifni ko&apos;rish
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="group relative overflow-hidden rounded-[2.5rem] border-none bg-zinc-950 p-px shadow-2xl"
        >
          {/* Mesh Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-primary/10 to-transparent opacity-50 transition-opacity group-hover:opacity-70" />
          <div className="absolute -left-20 -top-20 size-64 rounded-full bg-primary/20 blur-[100px] animate-pulse-slow" />
          <div className="absolute -right-20 -bottom-20 size-64 rounded-full bg-orange-600/20 blur-[100px] animate-pulse-slow" />

          <div className="relative flex flex-col gap-8 rounded-[2.5rem] bg-zinc-900/40 backdrop-blur-3xl px-6 py-8 sm:px-10 sm:py-10 md:flex-row md:items-end md:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-primary">
                <div className="size-1.5 rounded-full bg-primary animate-ping" />
                <SparklesIcon className="size-3" />
                Challenges Hub
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Musobaqalarda <br />{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
                    g&apos;olib bo&apos;ling
                  </span>
                </h1>
                <p className="max-w-xl text-balance text-base font-medium text-zinc-400 leading-relaxed">
                  Global turnirlarda qatnashing, do&apos;stlaringizni taklif
                  qiling va maxsus mukofotlarni qo&apos;lga kiriting.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Jami",
                  value: stats.total,
                  icon: TrophyIcon,
                  color: "text-amber-400",
                  bg: "bg-amber-400/10",
                },
                {
                  label: "Faol",
                  value: stats.active,
                  icon: ActivityIcon,
                  color: "text-primary",
                  bg: "bg-primary/10",
                },
                {
                  label: "Sizniki",
                  value: stats.joined,
                  icon: ZapIcon,
                  color: "text-orange-400",
                  bg: "bg-orange-400/10",
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="flex flex-col items-center justify-center gap-2.5 rounded-3xl border border-white/5 bg-white/5 p-4 min-w-[90px] backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/10"
                >
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-2xl shadow-inner",
                      stat.bg,
                    )}
                  >
                    <stat.icon className={cn("size-5", stat.color)} />
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black tracking-tighter text-white">
                      {stat.value}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nomi yoki ta'rif bo'yicha qidirish..."
              className="h-12 w-full rounded-2xl border-border/50 bg-background/50 pl-11 text-sm shadow-sm focus-visible:ring-primary/20 focus-visible:bg-background transition-all font-semibold"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-12 w-full rounded-2xl border-border/50 bg-background/50 text-sm font-bold shadow-sm focus:ring-primary/20 sm:w-48">
              <SelectValue placeholder="Barcha holatlar" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border/50 shadow-2xl">
              {STATUS_FILTER_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="rounded-xl focus:bg-primary/10 focus:text-primary font-medium"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="aspect-[16/20] rounded-[2rem] bg-muted/50"
                />
              ))}
            </motion.div>
          ) : filteredChallenges.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-border/60 py-24 bg-card/30 backdrop-blur-sm"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full" />
                <div className="relative size-24 rounded-[2rem] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-inner">
                  <TrophyIcon className="size-10 text-primary animate-pulse-slow" />
                </div>
              </div>
              <div className="space-y-3 text-center max-w-sm px-6">
                <h3 className="text-2xl font-black tracking-tight text-foreground">
                  Musobaqalar yo'q
                </h3>
                <p className="text-sm font-medium text-muted-foreground/80 leading-relaxed">
                  Admin yangi musobaqalar e'lon qilmaguncha bu bo'limda
                  kutishingiz mumkin.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 },
                },
              }}
              className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
            >
              {filteredChallenges.map((challenge) => (
                <motion.div
                  key={challenge.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 },
                  }}
                >
                  <ChallengeCard
                    challenge={challenge}
                    userId={user?.id}
                    isBusy={Boolean(joiningById[challenge.id])}
                    onJoin={handleJoin}
                    onInvite={openInviteDrawer}
                    onViewDetail={(id) => navigate(`/user/challenges/${id}`)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Drawer
        open={isInviteDrawerOpen}
        onOpenChange={(open) => {
          setIsInviteDrawerOpen(open);
          if (!open) {
            setInviteChallenge(null);
            setSelectedInvitees([]);
            setInviteSearch("");
            setInviteMessage("");
          }
        }}
        direction="bottom"
      >
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-2xl outline-none">
          <DrawerHeader className="border-b border-border/40 pb-4 pt-5">
            <DrawerTitle className="text-foreground text-xl font-bold text-center">
              Do&apos;stlarni taklif qilish
            </DrawerTitle>
            <DrawerDescription className="text-center">
              {inviteChallenge?.title
                ? `"${inviteChallenge.title}" challenge&apos;iga qatnashuvchilarni tanlang`
                : "Taklif yuborish uchun do&apos;stlaringizni tanlang"}
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="flex flex-col gap-5 py-5">
            {/* Search */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase px-1">
                Qidirish
              </span>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={inviteSearch}
                  onChange={(event) => setInviteSearch(event.target.value)}
                  className="pl-9 rounded-xl"
                  placeholder="Ism, username yoki telefon"
                />
              </div>
            </div>

            {/* Candidates */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase px-1">
                Do&apos;stlar
                {selectedInvitees.length > 0 && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold">
                    {selectedInvitees.length} tanlandi
                  </span>
                )}
              </span>
              {inviteCandidates.length === 0 ? (
                <Card className="border-dashed rounded-2xl">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    <UserIcon className="size-8 mx-auto mb-2 opacity-30" />
                    <p>Taklif uchun mos do&apos;st topilmadi.</p>
                    <Button variant="link" className="h-auto px-0 mt-1" asChild>
                      <Link to="/user/friends">
                        Do&apos;st qo&apos;shish sahifasiga o&apos;tish
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col gap-2">
                  {inviteCandidates.map((candidate) => {
                    const checked = selectedInvitees.includes(candidate.id);
                    return (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => toggleInvitee(candidate.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                          checked
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-card hover:bg-muted/40",
                        )}
                      >
                        <Checkbox checked={checked} className="shrink-0" />
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <UserIcon className="size-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-semibold">
                            {candidate.name}
                          </p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {candidate.username
                              ? `@${candidate.username}`
                              : candidate.phone || "Foydalanuvchi"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Message */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase px-1">
                Xabar (ixtiyoriy)
              </span>
              <Textarea
                id="invite-message"
                value={inviteMessage}
                onChange={(event) => setInviteMessage(event.target.value)}
                placeholder="Do'stingizga challenge haqida qisqa xabar qoldiring"
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
          </DrawerBody>
          <DrawerFooter>
            <Button
              type="button"
              disabled={selectedInvitees.length === 0 || isInvitingFriends}
              onClick={handleSendInvites}
            >
              {isInvitingFriends
                ? "Yuborilmoqda..."
                : selectedInvitees.length > 0
                  ? `${selectedInvitees.length} do&apos;stni taklif qilish`
                  : "Taklif qilish"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </PageTransition>
  );
}
