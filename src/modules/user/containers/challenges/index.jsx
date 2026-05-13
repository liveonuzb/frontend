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
  ArrowRightIcon,
  BellIcon,
  CheckCircle2Icon,
  CircleOffIcon,
  Clock3Icon,
  FlagIcon,
  MailPlusIcon,
  PlusIcon,
  SearchIcon,
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ── constants ────────────────────────────────────────────────────────────────

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
    if (places.length) return `Top ${places.length} o'rin`;
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

// ── ChallengeCard ────────────────────────────────────────────────────────────

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
  const isFull = Boolean(maxParticipants && participantCount >= maxParticipants);
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
      <div className="relative aspect-[16/10] overflow-hidden">
        {challenge?.image?.url ? (
          <img
            loading="lazy"
            src={challenge.image.url}
            alt={challenge.title}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-primary/30 via-primary/5 to-background transition-colors group-hover:from-primary/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
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
        <div className="absolute right-4 top-4">
          <div className="flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black text-amber-950 shadow-lg shadow-amber-400/20">
            <TrophyIcon className="size-3.5" />
            {formatRewardText(challenge)}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="line-clamp-1 text-lg font-black tracking-tight text-white drop-shadow-md">
            {challenge.title}
          </h3>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col p-5">
        <p className="mb-4 line-clamp-2 h-10 text-sm font-medium leading-relaxed text-muted-foreground">
          {challenge.description || "Ta'rif kiritilmagan"}
        </p>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-muted/30 p-3 ring-1 ring-inset ring-white/5">
            <div className="mb-1.5 flex items-center gap-2">
              <Clock3Icon className="size-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Muddat
              </span>
            </div>
            <p className="text-xs font-bold text-foreground">
              {formatChallengeDateRange(challenge.startDate, challenge.endDate)}
            </p>
          </div>
          <div className="rounded-2xl bg-muted/30 p-3 ring-1 ring-inset ring-white/5">
            <div className="mb-1.5 flex items-center gap-2">
              <UsersIcon className="size-3.5 text-orange-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                A&apos;zolar
              </span>
            </div>
            <p className="text-xs font-bold text-foreground">
              {participantCount}
              {maxParticipants ? ` / ${maxParticipants}` : " (Cheksiz)"}
            </p>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between rounded-2xl border border-primary/10 bg-primary/5 p-4">
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
              <p className="text-[10px] font-bold uppercase text-muted-foreground">
                {Math.round((participantCount / maxParticipants) * 100)}%
                to&apos;lgan
              </p>
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center gap-2.5">
          <Button
            size="lg"
            className={cn(
              "h-12 flex-1 rounded-2xl font-bold shadow-lg transition-all active:scale-95",
              isParticipant
                ? "border border-border/50 bg-muted text-foreground shadow-none hover:bg-muted/80"
                : "bg-primary text-white shadow-primary/20 hover:bg-primary/90",
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

// ── empty states ─────────────────────────────────────────────────────────────

const ShaxsiyEmptyState = ({ onCreateClick }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center gap-5 py-24 text-center"
  >
    <button
      type="button"
      onClick={onCreateClick}
      className="flex size-20 items-center justify-center rounded-full bg-primary shadow-2xl shadow-primary/40 transition-all hover:scale-105 hover:shadow-primary/50 active:scale-95"
    >
      <PlusIcon className="size-10 text-primary-foreground" />
    </button>
    <div className="space-y-2">
      <h3 className="text-2xl font-black uppercase tracking-tight">
        Chellenj yaratish
      </h3>
      <p className="max-w-xs text-sm text-muted-foreground">
        Do&apos;stlaringizni taklif qiling va guruhli chellenjlarda qatnashing.
      </p>
    </div>
  </motion.div>
);

const OmmabopEmptyState = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-border/60 bg-card/30 py-24 backdrop-blur-sm"
  >
    <div className="relative mb-8">
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-[60px]" />
      <div className="relative flex size-24 items-center justify-center rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/20 to-primary/5 shadow-inner">
        <TrophyIcon className="size-10 animate-pulse text-primary" />
      </div>
    </div>
    <div className="max-w-sm space-y-3 px-6 text-center">
      <h3 className="text-2xl font-black tracking-tight text-foreground">
        Musobaqalar yo&apos;q
      </h3>
      <p className="text-sm font-medium leading-relaxed text-muted-foreground/80">
        Admin yangi musobaqalar e&apos;lon qilmaguncha bu bo&apos;limda
        kutishingiz mumkin.
      </p>
    </div>
  </motion.div>
);

// ── main container ────────────────────────────────────────────────────────────

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

  // ── tab + search state ──
  const [activeTab, setActiveTab] = React.useState("shaxsiy");
  const [search, setSearch] = React.useState("");
  const openCreateFlow = React.useCallback(() => {
    navigate("/user/challenges/create");
  }, [navigate]);

  // ── invite drawer state ──
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
      { url: "/user/challenges", title: "Chellenjlar" },
    ]);
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    if (!isInviteDrawerOpen || !inviteChallenge?.id) return;
    searchInviteCandidates(inviteChallenge.id, deferredInviteSearch);
  }, [
    deferredInviteSearch,
    inviteChallenge?.id,
    isInviteDrawerOpen,
    searchInviteCandidates,
  ]);

  // ── derived lists ──

  const shaxsiyChallenges = React.useMemo(() => {
    const q = trim(deferredSearch).toLowerCase();
    return challengeList.filter((c) => {
      const isPersonal =
        c.type === "CUSTOM" ||
        get(c, "creator.id") === user?.id ||
        get(c, "creator.userId") === user?.id;
      if (!isPersonal) return false;
      if (!q) return true;
      return (
        includes(String(get(c, "title", "")).toLowerCase(), q) ||
        includes(String(get(c, "description", "")).toLowerCase(), q)
      );
    });
  }, [challengeList, deferredSearch, user?.id]);

  const ommabopChallenges = React.useMemo(() => {
    const q = trim(deferredSearch).toLowerCase();
    return challengeList.filter((c) => {
      const isPublic = c.type !== "CUSTOM" || get(c, "creator.id") !== user?.id;
      if (!isPublic) return false;
      if (!q) return true;
      return (
        includes(String(get(c, "title", "")).toLowerCase(), q) ||
        includes(String(get(c, "description", "")).toLowerCase(), q) ||
        includes(
          String(get(c, "creator.profile.firstName", "")).toLowerCase(),
          q,
        )
      );
    });
  }, [challengeList, deferredSearch, user?.id]);

  const pendingInvitations = React.useMemo(
    () =>
      challengeInvitationList.filter(
        (inv) => get(inv, "status") === "PENDING",
      ),
    [challengeInvitationList],
  );

  // ── handlers ──

  const handleJoin = async (challengeId) => {
    if (joiningById[challengeId]) return;
    try {
      await joinChallenge(challengeId);
    } catch {
      // store-level toast
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

  const toggleInvitee = React.useCallback((id) => {
    setSelectedInvitees((curr) =>
      includes(curr, id) ? curr.filter((x) => x !== id) : [...curr, id],
    );
  }, [setSelectedInvitees]);

  const handleSendInvites = React.useCallback(async () => {
    if (!inviteChallenge?.id || selectedInvitees.length === 0 || isInvitingFriends)
      return;
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
      // store-level toast
    }
  }, [
    inviteChallenge,
    inviteFriends,
    inviteMessage,
    isInvitingFriends,
    selectedInvitees,
    setInviteChallenge,
    setInviteMessage,
    setIsInviteDrawerOpen,
    setSelectedInvitees,
  ]);

  const handleInvitationResponse = React.useCallback(
    async (invitationId, action) => {
      if (respondingById[invitationId]) return;
      try {
        await respondToInvitation(invitationId, action);
      } catch {
        // store-level toast
      }
    },
    [respondToInvitation, respondingById],
  );

  // ── render ─────────────────────────────────────────────────────────────────

  const activeList = activeTab === "shaxsiy" ? shaxsiyChallenges : ommabopChallenges;

  return (
    <PageTransition>
      <div className="relative flex w-full flex-col gap-5 pb-28">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-black tracking-tight">Chellenjlar</h1>
          {/* Create FAB — visible on desktop in header area */}
          <Button
            size="icon"
            className="hidden size-11 rounded-2xl shadow-lg shadow-primary/20 sm:flex"
            onClick={openCreateFlow}
          >
            <PlusIcon className="size-5" />
          </Button>
        </div>

        {/* ── Segmented control ── */}
        <div className="flex gap-1 rounded-2xl border bg-muted/40 p-1">
          {[
            { key: "shaxsiy", label: "Shaxsiy" },
            { key: "ommabop", label: "Ommabop" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 rounded-xl py-2.5 text-sm font-bold transition-all",
                activeTab === tab.key
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Pending invitations banner ── */}
        <AnimatePresence>
          {pendingInvitations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-1 shadow-xl shadow-primary/5"
            >
              <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -bottom-12 -left-12 size-40 rounded-full bg-orange-500/10 blur-3xl" />

              <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20 ring-4 ring-primary/10">
                    <BellIcon className="size-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight">
                      Challenge takliflari
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground">
                      Do&apos;stlaringiz sizni musobaqaga chorlamoqda
                    </p>
                  </div>
                </div>
                <div className="flex -space-x-3 overflow-hidden">
                  {pendingInvitations.slice(0, 3).map((inv) => (
                    <div
                      key={inv.id}
                      className="flex size-10 cursor-help items-center justify-center rounded-full border-2 border-background bg-muted transition-transform hover:z-10 hover:-translate-y-1"
                      title={inv.inviter?.name}
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
                {pendingInvitations.slice(0, 2).map((inv) => (
                  <motion.div
                    key={inv.id}
                    layout
                    className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/50 p-4 transition-all hover:border-primary/30 hover:bg-card/80"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 transition-colors group-hover:bg-primary/10">
                          <TrophyIcon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-bold">
                            {inv.challenge?.title || "Challenge"}
                          </p>
                          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                            {inv.inviter?.name || "Foydalanuvchi"} dan
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 rounded-xl px-4 font-semibold hover:bg-destructive/10 hover:text-destructive"
                          onClick={() =>
                            handleInvitationResponse(inv.id, "DECLINE")
                          }
                          disabled={Boolean(respondingById[inv.id])}
                        >
                          {respondingById[inv.id] ? "..." : "Rad etish"}
                        </Button>
                        <Button
                          size="sm"
                          className="h-9 rounded-xl px-5 font-bold shadow-md shadow-primary/20"
                          onClick={() =>
                            handleInvitationResponse(inv.id, "ACCEPT")
                          }
                          disabled={Boolean(respondingById[inv.id])}
                        >
                          {respondingById[inv.id] ? "..." : "Qabul qilish"}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {pendingInvitations.length > 2 && (
                  <button className="py-1 text-xs font-bold text-primary/70 transition-colors hover:text-primary">
                    Barcha {pendingInvitations.length} ta taklifni ko&apos;rish
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Search (Ommabop only) ── */}
        {activeTab === "ommabop" && (
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nomi yoki ta'rif bo'yicha qidirish..."
              className="h-12 w-full rounded-2xl border-border/50 bg-background/50 pl-11 text-sm font-semibold shadow-sm transition-all focus-visible:bg-background focus-visible:ring-primary/20"
            />
          </div>
        )}

        {/* ── Content ── */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="aspect-[16/20] rounded-[2rem] bg-muted/50"
                />
              ))}
            </motion.div>
          ) : activeTab === "shaxsiy" && activeList.length === 0 ? (
            <ShaxsiyEmptyState
              key="shaxsiy-empty"
              onCreateClick={openCreateFlow}
            />
          ) : activeList.length === 0 ? (
            <OmmabopEmptyState key="ommabop-empty" />
          ) : (
            <motion.div
              key={`grid-${activeTab}`}
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.08 } },
              }}
              className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
            >
              {activeList.map((challenge) => (
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

      {/* ── Floating create button (mobile) ── */}
      <button
        type="button"
        onClick={openCreateFlow}
        className="fixed bottom-24 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40 transition-all hover:scale-105 hover:shadow-primary/50 active:scale-95 sm:hidden"
      >
        <PlusIcon className="size-7" />
      </button>

      {/* ── Invite friends drawer (for existing challenges) ── */}
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
            <DrawerTitle className="text-center text-xl font-bold">
              Do&apos;stlarni taklif qilish
            </DrawerTitle>
            <DrawerDescription className="text-center">
              {inviteChallenge?.title
                ? `"${inviteChallenge.title}" challengeiga qatnashuvchilarni tanlang`
                : "Taklif yuborish uchun do'stlaringizni tanlang"}
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="flex flex-col gap-5 py-5">
            <div className="flex flex-col gap-3">
              <span className="px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Qidirish
              </span>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={inviteSearch}
                  onChange={(e) => setInviteSearch(e.target.value)}
                  className="rounded-xl pl-9"
                  placeholder="Ism, username yoki telefon"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Do&apos;stlar
                {selectedInvitees.length > 0 && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                    {selectedInvitees.length} tanlandi
                  </span>
                )}
              </span>
              {inviteCandidates.length === 0 ? (
                <Card className="rounded-2xl border-dashed">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    <UserIcon className="mx-auto mb-2 size-8 opacity-30" />
                    <p>Taklif uchun mos do&apos;st topilmadi.</p>
                    <Button variant="link" className="mt-1 h-auto px-0" asChild>
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
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
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

            <div className="flex flex-col gap-3">
              <span className="px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Xabar (ixtiyoriy)
              </span>
              <Textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Do'stingizga challenge haqida qisqa xabar qoldiring"
                className="resize-none rounded-xl"
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
                  ? `${selectedInvitees.length} do'stni taklif qilish`
                  : "Taklif qilish"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </PageTransition>
  );
}
