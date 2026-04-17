import React from "react";
import { compact, get, includes, join, map, orderBy, some, take } from "lodash";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeftIcon,
  CalendarRangeIcon,
  CrownIcon,
  FlagIcon,
  MedalIcon,
  TargetIcon,
  TrophyIcon,
  UsersIcon,
  Clock3Icon,
  ZapIcon,
  SparklesIcon,
  LogOutIcon,
  ExternalLinkIcon
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageTransition from "@/components/page-transition";
import { cn } from "@/lib/utils";
import { useAuthStore, useBreadcrumbStore } from "@/store";
import { useChallengeStore } from "@/store/challenges-store";

const METRIC_META = {
  STEPS: { label: "Qadam", unit: "qadam" },
  WORKOUT_MINUTES: { label: "Mashq vaqti", unit: "daqiqa" },
  BURNED_CALORIES: { label: "Yondirilgan kaloriya", unit: "kcal" },
  SLEEP_HOURS: { label: "Uyqu", unit: "soat" },
};

const STATUS_META = {
  UPCOMING: {
    label: "Boshlanmagan",
    className:
      "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  ACTIVE: {
    label: "Faol",
    className:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  COMPLETED: {
    label: "Yakunlangan",
    className:
      "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  },
  CANCELLED: {
    label: "Bekor qilingan",
    className:
      "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
};

const formatDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return format(parsed, "d-MMM", { locale: uz });
};

const formatDateRange = (startDate, endDate) =>
  `${formatDate(startDate)} - ${formatDate(endDate)}`;

const resolveDisplayName = (participant) => {
  const profile = get(participant, "user.profile");
  const fullName = join(
    compact(map([get(profile, "firstName"), get(profile, "lastName")], (v) => String(v ?? "").trim())),
    " ",
  );

  if (fullName) return fullName;
  const username = get(profile, "username");
  if (username) return `@${username}`;
  return "Foydalanuvchi";
};

const initialsFromName = (value) => {
  const parts = take(
    compact(String(value ?? "").trim().split(/\s+/)),
    2,
  );

  if (!parts.length) return "U";
  return join(map(parts, (part) => part[0]?.toUpperCase() ?? ""), "");
};

const resolveRewardPreview = (challenge) => {
  const details = get(challenge, "rewardDetails");
  if (!details) return "Mukofot beriladi";

  if (get(details, "mode") === "FIXED_XP") {
    return `${get(details, "fixedXp", 0)} XP`;
  }

  if (get(details, "mode") === "PERCENT_OF_POOL") {
    return `${get(details, "percent", 0)}% pool`;
  }

  if (get(details, "mode") === "PLACE_XP") {
    return get(details, "placeRewardUnit") === "PERCENT" ? "Top 3 (%)" : "Top 3 (XP)";
  }

  return "Mukofot beriladi";
};

const rankBadgeClass = (rank) => {
  if (rank === 1) {
    return "border-yellow-500/20 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300";
  }
  if (rank === 2) {
    return "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300";
  }
  if (rank === 3) {
    return "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300";
  }
  return "border-border bg-muted/40 text-foreground";
};

const RankBadge = ({ rank }) => {
  if (rank === 1) {
    return (
      <Badge className={cn("border", rankBadgeClass(rank))}>
        <CrownIcon className="mr-1 size-3.5" />
        1-o'rin
      </Badge>
    );
  }
  if (rank === 2) {
    return (
      <Badge className={cn("border", rankBadgeClass(rank))}>
        <MedalIcon className="mr-1 size-3.5" />
        2-o'rin
      </Badge>
    );
  }
  if (rank === 3) {
    return (
      <Badge className={cn("border", rankBadgeClass(rank))}>
        <MedalIcon className="mr-1 size-3.5" />
        3-o'rin
      </Badge>
    );
  }
  return <Badge className={cn("border", rankBadgeClass(rank))}>#{rank}</Badge>;
};

export default function ChallengeDetailContainer() {
  const navigate = useNavigate();
  const { id: challengeId } = useParams();
  const { user } = useAuthStore();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const {
    challengeDetail,
    isDetailLoading,
    actionLoading,
    fetchChallengeDetail,
    clearChallengeDetail,
    joinChallenge,
  } = useChallengeStore();

  React.useEffect(() => {
    if (challengeId) {
      fetchChallengeDetail(challengeId);
    }
    return () => clearChallengeDetail();
  }, [challengeId, fetchChallengeDetail, clearChallengeDetail]);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/challenges", title: "Musobaqalar" },
      {
        url: challengeId ? `/user/challenges/${challengeId}` : "/user/challenges",
        title: challengeDetail?.title || "Challenge detail",
      },
    ]);
  }, [challengeDetail?.title, challengeId, setBreadcrumbs]);

  const ranking = React.useMemo(() => {
    if (!Array.isArray(get(challengeDetail, "participants"))) {
      return [];
    }

    return map(
      orderBy(
        challengeDetail.participants,
        [(p) => Number(get(p, "metricValue", 0)), (p) => Number(get(p, "progress", 0))],
        ["desc", "desc"],
      ),
      (participant, index) => ({ ...participant, rank: index + 1 }),
    );
  }, [challengeDetail?.participants]);

  const metricType =
    get(challengeDetail, "metricDetails.type") || get(challengeDetail, "metricType") || "STEPS";
  const metricMeta = get(METRIC_META, metricType, METRIC_META.STEPS);
  const metricTarget = Number(
    get(challengeDetail, "metricDetails.target") ?? get(challengeDetail, "metricTarget") ?? 0,
  );
  const participantCount =
    Number(get(challengeDetail, "_count.participants") ?? ranking.length) || 0;
  const maxParticipants = Number(get(challengeDetail, "maxParticipants", 0)) || null;
  const isParticipant = Boolean(
    get(challengeDetail, "isJoined") ||
      some(ranking, (item) => item?.userId && item.userId === user?.id),
  );
  const isFull = Boolean(maxParticipants && participantCount >= maxParticipants);
  const isJoinClosed = includes(["COMPLETED", "CANCELLED"], get(challengeDetail, "status"));
  const joinFeeXp = Number(get(challengeDetail, "joinFeeXp", 0));
  const isJoining = Boolean(get(actionLoading, `joiningById.${challengeId}`));

  const handleJoin = React.useCallback(async () => {
    if (!challengeId || isJoining) return;
    try {
      await joinChallenge(challengeId);
      await fetchChallengeDetail(challengeId);
    } catch {
      // store-level toast handles errors
    }
  }, [challengeId, fetchChallengeDetail, isJoining, joinChallenge]);

  if (isDetailLoading && !challengeDetail) {
    return (
      <PageTransition className="space-y-4">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-56 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </PageTransition>
    );
  }

  if (!challengeDetail) {
    return (
      <PageTransition className="space-y-4">
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => navigate("/user/challenges")}
        >
          <ArrowLeftIcon className="mr-2 size-4" />
          Musobaqalarga qaytish
        </Button>
        <Card className="rounded-3xl border-dashed">
          <CardContent className="py-16 text-center text-muted-foreground">
            Challenge topilmadi.
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  const statusMeta = STATUS_META[challengeDetail.status] ?? STATUS_META.UPCOMING;

  return (
    <PageTransition className="pb-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        {/* Navigation & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button
            variant="outline"
            className="group rounded-2xl border-border/50 bg-background/50 backdrop-blur-md transition-all hover:bg-muted"
            onClick={() => navigate("/user/challenges")}
          >
            <ArrowLeftIcon className="mr-2 size-4 transition-transform group-hover:-translate-x-1" />
            Musobaqalarga qaytish
          </Button>
          <div className="flex items-center gap-3">
            <Button
              size="lg"
              onClick={handleJoin}
              disabled={isJoining || isDetailLoading || isParticipant || isFull || isJoinClosed || challengeDetail.type === "COACH"}
              className={cn(
                "h-11 rounded-2xl font-black shadow-lg transition-all active:scale-95",
                isParticipant || challengeDetail.type === "COACH"
                  ? "bg-muted text-foreground border border-border/50 shadow-none hover:bg-muted/80" 
                  : "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
              )}
            >
              {isParticipant || challengeDetail.type === "COACH"
                ? "Qatnashyapsiz"
                : isFull
                  ? "Joy qolmagan"
                  : isJoinClosed
                    ? "Yopilgan"
                    : isJoining
                      ? "Kutilmoqda..."
                    : joinFeeXp > 0
                      ? `Qo'shilish (${joinFeeXp} XP)`
                      : "Tekin qo'shilish"}
            </Button>
          </div>
        </div>

        {/* Hero + Stats Unified Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="group relative overflow-hidden rounded-[2.5rem] border-none bg-zinc-950 p-px shadow-2xl"
        >
          {/* Mesh Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-primary/10 to-transparent opacity-50 transition-opacity group-hover:opacity-70" />
          <div className="absolute -left-20 -top-20 size-64 rounded-full bg-primary/20 blur-[100px] animate-pulse-slow" />
          <div className="absolute -right-20 -bottom-20 size-64 rounded-full bg-orange-600/20 blur-[100px] animate-pulse-slow" />

          <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-900/40 backdrop-blur-3xl">
            {/* Top: Image + Info */}
            <div className="flex flex-col sm:flex-row items-stretch">
              {/* Thumbnail */}
              <div className="relative w-full sm:w-36 h-36 sm:h-auto shrink-0 overflow-hidden border-b border-white/5 sm:border-b-0 sm:border-r sm:rounded-l-[2.5rem]">
                {challengeDetail?.image?.url ? (
                  <img
                    src={challengeDetail.image.url}
                    alt={challengeDetail.title}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/30 to-primary/5">
                    <TrophyIcon className="size-9 text-primary/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent sm:bg-gradient-to-r sm:from-transparent" />
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col justify-center gap-2.5 px-6 py-5 sm:px-8">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn("border-white/10 uppercase font-black text-[8px] tracking-widest px-2 py-0.5 backdrop-blur-sm", statusMeta.className)}>
                    <FlagIcon className="mr-1 size-2.5" />
                    {statusMeta.label}
                  </Badge>
                  <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-300 uppercase font-black text-[8px] tracking-widest px-2 py-0.5">
                    <TrophyIcon className="mr-1 size-2.5 text-amber-400" />
                    {resolveRewardPreview(challengeDetail)}
                  </Badge>
                </div>

                {/* Title & Description */}
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
                    {challengeDetail.title}
                  </h1>
                  <p className="mt-0.5 line-clamp-2 max-w-xl text-sm font-medium text-zinc-400">
                    {challengeDetail.description || "Ushbu musobaqada o'z mahoratingizni ko'rsatib, g'oliblar qatoridan joy oling!"}
                  </p>
                </div>

                {/* Personal Progress */}
                {isParticipant && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-1.5 pt-0.5"
                  >
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-500">
                      <span>Sizning progress</span>
                      <span className="text-primary">
                        {Number(challengeDetail.myMetricValue ?? 0).toLocaleString()} / {metricTarget.toLocaleString()} {metricMeta.unit}
                      </span>
                    </div>
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Number(challengeDetail.myProgress ?? 0)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-orange-400"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/5" />

            {/* Bottom: Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {[
                { label: "Muddati", value: formatDateRange(challengeDetail.startDate, challengeDetail.endDate), icon: Clock3Icon, color: "text-blue-400", bg: "bg-blue-400/10" },
                { label: "Qatnashchilar", value: `${participantCount}${maxParticipants ? ` / ${maxParticipants}` : " (Cheksiz)"}`, icon: UsersIcon, color: "text-orange-400", bg: "bg-orange-400/10" },
                { label: "Metrika", value: metricMeta.label, icon: ZapIcon, color: "text-primary", bg: "bg-primary/10" },
                { label: "Maqsad", value: `${metricTarget.toLocaleString()} ${metricMeta.unit}`, icon: TargetIcon, color: "text-emerald-400", bg: "bg-emerald-400/10" },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className={cn(
                    "flex items-center gap-3 px-6 py-4 transition-colors hover:bg-white/5",
                    i < 3 && "border-r border-white/5",
                    i >= 2 && "border-t border-white/5 sm:border-t-0"
                  )}
                >
                  <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-2xl", stat.bg)}>
                    <stat.icon className={cn("size-4", stat.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500">{stat.label}</p>
                    <p className="truncate text-sm font-black text-white">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Ranking Hall of Fame */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-6"
        >
          <div className="flex items-center justify-between px-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <TrophyIcon className="size-6 text-amber-500" />
                Ishtirokchilar reytingi
              </h2>
              <p className="text-sm font-medium text-muted-foreground/80">
                Peshqadamlar va ularning real vaqt rejimisadigi natijalari
              </p>
            </div>
            <Badge variant="secondary" className="rounded-xl h-10 px-4 font-bold bg-muted/50 border-none">
              <UsersIcon className="mr-2 size-4" />
              {participantCount} ta ishtirokchi
            </Badge>
          </div>

          {ranking.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 py-14 bg-card/30 backdrop-blur-sm">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full" />
                <div className="relative size-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                  <TrophyIcon className="size-6 text-primary/40" />
                </div>
              </div>
              <p className="text-sm font-bold text-muted-foreground">Hozircha ishtirokchilar yo&apos;q</p>
              <p className="text-xs text-muted-foreground/60">Birinchi bo&apos;lib qo&apos;shiling va peshqadam bo&apos;ling!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ranking.map((participant, i) => {
                const name = resolveDisplayName(participant);
                const avatarUrl = participant?.user?.profile?.avatarUrl ?? null;
                const metricValue = Number(participant?.metricValue ?? 0);
                const progress = Number(participant?.progress ?? 0);
                const isTop3 = participant.rank <= 3;

                return (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    whileHover={{ scale: 1.005, x: 3 }}
                    className={cn(
                      "group relative grid gap-3 rounded-2xl border p-3 transition-all sm:grid-cols-[auto,1fr,auto,auto] items-center",
                      isTop3
                        ? "border-primary/20 bg-gradient-to-r from-primary/10 via-background to-background shadow-md shadow-primary/5"
                        : "border-border/40 bg-card/40 backdrop-blur-sm hover:border-primary/20 hover:bg-card/60"
                    )}
                  >
                    {/* Rank Badge */}
                    <div className="flex justify-center sm:px-1">
                      <RankBadge rank={participant.rank} />
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <Avatar className={cn("size-9 ring-2 ring-background", isTop3 ? "ring-primary/30" : "")}>
                          <AvatarImage src={avatarUrl || undefined} alt={name} />
                          <AvatarFallback className="bg-muted text-[10px] font-black">{initialsFromName(name)}</AvatarFallback>
                        </Avatar>
                        {isTop3 && (
                          <div className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-amber-400 text-[8px] font-black text-amber-950 shadow">
                            {participant.rank === 1 ? <CrownIcon className="size-2.5" /> : <SparklesIcon className="size-2.5" />}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black tracking-tight text-foreground">{name}</p>
                        <p className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                          {participant?.user?.profile?.username ? `@${participant.user.profile.username}` : "Ishtirokchi"}
                        </p>
                      </div>
                    </div>

                    {/* Result */}
                    <div className="flex flex-col items-center sm:items-end justify-center rounded-xl bg-muted/30 px-3 py-2 border border-border/20 group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Natija</p>
                      <p className="text-sm font-black text-foreground">
                        {metricValue.toLocaleString()} <span className="text-[10px] text-muted-foreground">{metricMeta.unit}</span>
                      </p>
                    </div>

                    {/* Progress */}
                    <div className="flex flex-col gap-1.5 min-w-[150px]">
                      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                        <span className="text-muted-foreground/60">Progress</span>
                        <span className={cn(isTop3 ? "text-primary" : "text-foreground")}>{progress}%</span>
                      </div>
                      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 + i * 0.05 }}
                          className={cn(
                            "absolute inset-y-0 left-0 bg-gradient-to-r",
                            isTop3 ? "from-primary to-orange-400" : "from-muted-foreground/30 to-muted-foreground"
                          )}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
