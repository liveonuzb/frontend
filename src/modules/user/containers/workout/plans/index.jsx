import React from "react";
import { useTranslation } from "react-i18next";
import find from "lodash/find";
import get from "lodash/get";
import map from "lodash/map";
import orderBy from "lodash/orderBy";
import size from "lodash/size";
import lodashValues from "lodash/values";
import filter from "lodash/filter";
import isArray from "lodash/isArray";
import toNumber from "lodash/toNumber";
import toUpper from "lodash/toUpper";
import trim from "lodash/trim";
import includes from "lodash/includes";
import toLower from "lodash/toLower";
import take from "lodash/take";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ActivityIcon,
  BarChart3Icon,
  CalendarDaysIcon,
  CheckIcon,
  CopyIcon,
  Clock3Icon,
  CrownIcon,
  DumbbellIcon,
  ArrowRightIcon,
  FlameIcon,
  MoreVerticalIcon,
  PlayIcon,
  PlusIcon,
  RouteIcon,
  SparklesIcon,
  SquareIcon,
  TargetIcon,
  Trash2Icon,
  PencilIcon,
  EyeIcon,
} from "lucide-react";
import PageTransition from "@/components/page-transition";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useWorkoutPlan from "@/hooks/app/use-workout-plan";
import { useGetQuery } from "@/hooks/api";
import { useRunningActiveSession } from "@/hooks/app/use-running-sessions";
import { useActiveWorkoutSession } from "@/hooks/app/use-workout-sessions";
import { useLanguageStore, useBreadcrumbStore } from "@/store";
import { cn } from "@/lib/utils";
import {
  formatRunningDistance,
  formatRunningDuration,
  formatRunningPace,
} from "@/lib/running-metrics";
import {
  DASHBOARD_ME_QUERY_KEY,
  getUserFromResponse,
} from "@/modules/user/containers/dashboard/query-helpers.js";
import { WORKOUT_PLAN_STATUS } from "@/hooks/app/use-workout-plans";
import {
  deriveWorkoutPlanMetrics,
  getFirstWorkoutDayIndex,
  getNextStartableDayIndex,
} from "../utils";
import RunMapPanel from "../running/components/run-map-panel.jsx";

const resolveText = (translations, fallback, language) => {
  if (translations && typeof translations === "object") {
    const direct = trim(String(get(translations, language, "")));
    if (direct) return direct;
    const uzText = trim(String(get(translations, "uz", "")));
    if (uzText) return uzText;
    const enText = trim(String(get(translations, "en", "")));
    if (enText) return enText;
    const ruText = trim(String(get(translations, "ru", "")));
    if (ruText) return ruText;
    const firstValue = find(lodashValues(translations), (value) =>
      trim(String(value ?? "")),
    );
    if (firstValue) return trim(String(firstValue));
  }
  return trim(String(fallback ?? ""));
};

const PlanSourceBadge = ({ plan, t }) => {
  const source = get(plan, "source");
  if (source === "ai") {
    return (
      <Badge variant="secondary" className="gap-1">
        <SparklesIcon className="size-3" />
        {t("user.workout.plansList.source.ai")}
      </Badge>
    );
  }
  if (get(plan, "isTemplate")) {
    return (
      <Badge variant="outline">
        {t("user.workout.plansList.source.template")}
      </Badge>
    );
  }
  return null;
};

/* ─────────────────────────────────────────────
   Cover image — uses a deterministic gradient
   based on the plan id so each card looks
   distinct without requiring real images.
   ───────────────────────────────────────────── */
const COVER_GRADIENTS = [
  "from-orange-400 via-red-400 to-pink-500",
  "from-emerald-400 via-teal-500 to-cyan-500",
  "from-purple-500 via-fuchsia-500 to-pink-500",
  "from-blue-500 via-indigo-500 to-violet-500",
  "from-amber-400 via-orange-500 to-red-500",
  "from-sky-400 via-blue-500 to-indigo-600",
];

const PLAN_IMAGE_FALLBACKS = [
  "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=80",
];

const pickGradient = (key) => {
  const str = String(key ?? "default");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return COVER_GRADIENTS[Math.abs(hash) % COVER_GRADIENTS.length];
};

const getDurationWeeks = (plan) =>
  toNumber(get(plan, "durationWeeks")) ||
  Math.max(1, Math.round((toNumber(get(plan, "days")) || 28) / 7));

const getPlanLevel = (plan, t) =>
  get(
    plan,
    "level",
    get(plan, "difficulty", t("user.workout.plansList.defaults.level")),
  );

const getPlanTags = (plan, t) =>
  isArray(get(plan, "tags"))
    ? get(plan, "tags")
    : filter(
        [
          get(plan, "focus", t("user.workout.plansList.defaults.focus")),
          t("user.workout.plansList.defaults.progressTracking"),
          t("user.workout.plansList.defaults.nutritionGuidance"),
        ],
        Boolean,
      );

const PlanMetaItem = ({ icon: Icon, children, className }) => (
  <span
    className={cn(
      "inline-flex min-w-0 items-center gap-1 text-xs font-medium text-muted-foreground",
      className,
    )}
  >
    <Icon className="size-3.5 shrink-0 text-primary" />
    <span className="truncate">{children}</span>
  </span>
);

const PlanTag = ({ children }) => (
  <span className="rounded-full border border-slate-900/10 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground dark:border-white/10 dark:bg-white/[0.06]">
    {children}
  </span>
);

const ProgressBar = ({ value, tone = "bg-primary" }) => (
  <div className="h-2 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10">
    <div
      className={cn("h-full rounded-full transition-all", tone)}
      style={{ width: `${Math.max(0, Math.min(100, toNumber(value) || 0))}%` }}
    />
  </div>
);

const PlanRow = ({
  plan,
  isActive,
  title,
  description,
  onView,
  onStart,
  onEdit,
  onDuplicate,
  onDelete,
  isStartDisabled,
  isDuplicateDisabled,
  isEditable,
  t,
}) => {
  const durationWeeks = getDurationWeeks(plan);
  const dayCount = get(plan, "daysPerWeek") || 0;
  const level = getPlanLevel(plan, t);
  const coverImageUrl = get(plan, "coverImageUrl");
  const tags = getPlanTags(plan, t);

  return (
    <div
      data-testid="plans-compact-row"
      className="workout-glass-card group grid gap-3 overflow-hidden rounded-[1.15rem] border p-3 transition hover:-translate-y-0.5 hover:border-primary/35 sm:grid-cols-[190px_minmax(0,1fr)]"
    >
      <button
        type="button"
        onClick={onView}
        aria-label={t("user.workout.plansList.viewPlanAria", { title })}
        className={cn(
          "relative min-h-[150px] overflow-hidden rounded-[0.9rem] bg-gradient-to-br text-left sm:min-h-[160px]",
          !coverImageUrl && pickGradient(get(plan, "id")),
        )}
      >
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={title}
            className="size-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <DumbbellIcon className="size-10 text-white/85" strokeWidth={2} />
          </div>
        )}
        <div className="workout-media-contrast-scrim absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
      </button>
      <div className="flex min-w-0 flex-col px-1 py-1 sm:px-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {get(plan, "badge") ? (
                <Badge className="rounded-full bg-primary/10 text-primary">
                  {toUpper(String(get(plan, "badge")))}
                </Badge>
              ) : null}
              {isActive ? (
                <Badge variant="secondary" className="gap-1">
                  <CheckIcon className="size-3" />
                  {t("user.workout.plansList.badges.active")}
                </Badge>
              ) : null}
              <PlanSourceBadge plan={plan} t={t} />
            </div>
            <h3 className="truncate text-lg font-black tracking-tight sm:text-xl">
              {title}
            </h3>
            {description ? (
              <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-5 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label={t("user.workout.plansList.actions.more")}
              >
                <MoreVerticalIcon className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onView}>
                <EyeIcon className="size-4" />
                {t("user.workout.plansList.actions.view")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onStart} disabled={isStartDisabled}>
                <PlayIcon className="size-4" />
                {isActive
                  ? t("user.workout.plansList.actions.session")
                  : t("user.workout.plansList.actions.start")}
              </DropdownMenuItem>
              {isEditable ? (
                <>
                  <DropdownMenuItem onClick={onEdit}>
                    <PencilIcon className="size-4" />
                    {t("user.workout.plansList.actions.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDuplicate}
                    disabled={isDuplicateDisabled}
                  >
                    <CopyIcon className="size-4" />
                    {t("user.workout.plansList.actions.duplicate")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={onDelete}>
                    <Trash2Icon className="size-4" />
                    {t("user.workout.plansList.actions.delete")}
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          <PlanMetaItem icon={CalendarDaysIcon}>
            {durationWeeks} {t("user.workout.plansList.metrics.weeks")}
          </PlanMetaItem>
          <PlanMetaItem icon={DumbbellIcon}>
            {dayCount} {t("user.workout.plansList.metrics.daysPerWeek")}
          </PlanMetaItem>
          <PlanMetaItem icon={FlameIcon}>{level}</PlanMetaItem>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {map(take(tags, 3), (tag) => (
            <PlanTag key={tag}>{tag}</PlanTag>
          ))}
        </div>

        <div className="mt-auto grid gap-2 pt-4 sm:grid-cols-2">
          <Button variant="outline" className="rounded-xl" onClick={onView}>
            {t("user.workout.plansList.actions.viewPlan")}
          </Button>
          <Button
            className="rounded-xl"
            onClick={onStart}
            disabled={isStartDisabled}
          >
            {isActive
              ? t("user.workout.plansList.actions.continuePlan")
              : t("user.workout.plansList.actions.selectAsPlan")}
          </Button>
        </div>
      </div>
    </div>
  );
};

const formatHeroDuration = (seconds = 0) => {
  const totalSeconds = toNumber(seconds) || 0;
  return totalSeconds > 0 ? formatRunningDuration(totalSeconds) : "42:00";
};

const formatHeroPace = (secondsPerKm) =>
  formatRunningPace(secondsPerKm).replace(/\s*\/km$/, "");

const getWorkoutDay = (plan, dayIndex = 0) =>
  get(plan, `schedule[${Math.max(0, toNumber(dayIndex) || 0)}]`, null);

const getWorkoutDayExerciseCount = (plan, dayIndex = 0) => {
  const day = getWorkoutDay(plan, dayIndex);
  return (
    toNumber(get(plan, "nextWorkout.exerciseCount")) ||
    size(get(day, "exercises", [])) ||
    toNumber(get(plan, "todayWorkout.exercisesCount")) ||
    toNumber(get(plan, "included.exercises")) ||
    0
  );
};

const getPlanTotalDays = (plan) =>
  toNumber(get(plan, "targetWorkouts")) ||
  toNumber(get(plan, "days")) ||
  getDurationWeeks(plan) * 7;

const getPlanCompletedDays = (plan) =>
  toNumber(get(plan, "completedWorkouts")) ||
  Math.round((toNumber(get(plan, "progress")) || 0) * getPlanTotalDays(plan) / 100) ||
  toNumber(get(plan, "currentDay")) ||
  0;

const getPlanHeroImage = (plan, fallbackIndex = 0) =>
  get(plan, "coverImageUrl") ||
  PLAN_IMAGE_FALLBACKS[fallbackIndex % PLAN_IMAGE_FALLBACKS.length] ||
  PLAN_IMAGE_FALLBACKS[0];

const planMatchesFilter = (plan, filterKey) => {
  if (filterKey === "all") {
    return true;
  }

  const text = toLower(
    [
      get(plan, "category", ""),
      get(plan, "focus", ""),
      get(plan, "goal", ""),
      get(plan, "name", ""),
      get(plan, "description", ""),
      ...(isArray(get(plan, "tags")) ? get(plan, "tags") : []),
    ].join(" "),
  );

  if (filterKey === "running") {
    return includes(text, "running") || includes(text, "run") || includes(text, "бег");
  }

  if (filterKey === "strength") {
    return (
      includes(text, "strength") ||
      includes(text, "muscle") ||
      includes(text, "сила")
    );
  }

  if (filterKey === "weight-loss") {
    return (
      includes(text, "weight") ||
      includes(text, "fat") ||
      includes(text, "loss") ||
      includes(text, "снижение")
    );
  }

  if (filterKey === "home-workout") {
    return includes(text, "home") || includes(text, "домаш");
  }

  if (filterKey === "recovery") {
    return includes(text, "recovery") || includes(text, "mobility") || includes(text, "восстанов");
  }

  return includes(text, filterKey.replace("-", " "));
};

const getActiveWorkoutDurationSeconds = (session) =>
  toNumber(get(session, "elapsedSeconds")) ||
  toNumber(get(session, "durationSeconds")) ||
  0;

const HeroMetric = ({ icon: Icon, value, label, tone = "text-primary" }) => (
  <div className="flex items-center gap-2">
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full bg-white/70 shadow-sm dark:bg-white/10", tone)}>
      <Icon className="size-4" />
    </span>
    <span>
      <span className="block text-sm font-black text-foreground">{value}</span>
      <span className="block text-xs font-medium text-muted-foreground">
        {label}
      </span>
    </span>
  </div>
);

const HeroFeature = ({ icon: Icon, children }) => (
  <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
    <Icon className="size-4 text-primary" />
    {children}
  </span>
);

const HeroImage = ({ src, alt, className }) =>
  src ? (
    <img
      src={src}
      alt={alt}
      className={cn(
        "absolute inset-y-0 right-0 hidden h-full w-[48%] object-cover md:block",
        className,
      )}
      loading="lazy"
    />
  ) : null;

const PlansStateHero = ({
  activePlan,
  recommendedPlan,
  activeWorkoutSession,
  activeRunningSession,
  heroType,
  nextDayIndex,
  onCreatePlan,
  onSelectRecommended,
  onStartTodayWorkout,
  onViewActivePlan,
  onResumeWorkout,
  onOpenRunningLive,
  t,
}) => {
  if (heroType === "live-run") {
    const metrics = get(activeRunningSession, "metrics", {});
    const workoutSessionId = get(activeRunningSession, "workoutSessionId");
    const points = get(activeRunningSession, "points", []);
    const polyline = get(
      activeRunningSession,
      "route.polyline",
      get(activeRunningSession, "routePolyline", null),
    );

    return (
      <section
        data-testid="plans-state-hero-live-run"
        className="workout-glass-card relative overflow-hidden rounded-[1.35rem] border border-blue-500/20 bg-[linear-gradient(110deg,rgba(239,246,255,0.96),rgba(219,234,254,0.82))] p-4 sm:p-6 dark:bg-[linear-gradient(110deg,rgba(15,23,42,0.94),rgba(30,58,138,0.44))]"
      >
        <HeroImage
          src={getPlanHeroImage(recommendedPlan, 1)}
          alt={t("user.workout.plansList.hero.liveRun.title")}
          className="opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/92 to-background/20 dark:from-[#07111d] dark:via-[#07111d]/84 dark:to-[#07111d]/20" />
        <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300">
                {t("user.workout.plansList.hero.liveRun.badge")}
              </Badge>
              <Badge variant="secondary" className="rounded-full bg-blue-500/10 text-blue-600">
                {t("user.workout.plansList.hero.liveRun.live")}
              </Badge>
            </div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              {t("user.workout.plansList.hero.liveRun.title")}
            </h2>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              {t("user.workout.plansList.hero.liveRun.description")}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <HeroMetric
                icon={RouteIcon}
                value={formatRunningDistance(get(metrics, "distanceMeters", 0))}
                label={t("user.workout.plansList.hero.metrics.distance")}
                tone="text-blue-600"
              />
              <HeroMetric
                icon={Clock3Icon}
                value={formatHeroDuration(get(metrics, "durationSeconds", 0))}
                label={t("user.workout.plansList.hero.metrics.time")}
                tone="text-blue-600"
              />
              <HeroMetric
                icon={ActivityIcon}
                value={formatHeroPace(get(metrics, "averagePaceSecondsPerKm"))}
                label={t("user.workout.plansList.hero.metrics.pace")}
                tone="text-blue-600"
              />
              <HeroMetric
                icon={FlameIcon}
                value={toNumber(get(metrics, "caloriesBurned", 0)) || 0}
                label={t("user.workout.plansList.hero.metrics.kcal")}
                tone="text-blue-600"
              />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button className="rounded-xl bg-blue-600 hover:bg-blue-700" onClick={onOpenRunningLive}>
                <PlayIcon className="size-4" />
                {t("user.workout.plansList.hero.liveRun.continue")}
              </Button>
              <Button variant="outline" className="rounded-xl bg-white/80" onClick={onOpenRunningLive}>
                <SquareIcon className="size-4" />
                {t("user.workout.plansList.hero.liveRun.finish")}
              </Button>
            </div>
            {workoutSessionId ? (
              <p className="sr-only">{workoutSessionId}</p>
            ) : null}
          </div>
          <RunMapPanel
            points={points}
            polyline={polyline}
            provider="none"
            variant="preview"
            showQuality={false}
            emptyLabel={t("user.workout.plansList.hero.liveRun.mapEmpty")}
            loadingLabel={t("user.workout.plansList.hero.liveRun.mapLoading")}
            errorLabel={t("user.workout.plansList.hero.liveRun.mapEmpty")}
            className="hidden min-h-[170px] lg:block"
            surfaceClassName="min-h-[170px] rounded-[1rem]"
          />
        </div>
      </section>
    );
  }

  if (heroType === "active-workout") {
    const title =
      get(activeWorkoutSession, "planDayKey") ||
      get(activeWorkoutSession, "title") ||
      t("user.workout.plansList.hero.activeWorkout.defaultTitle");
    const exerciseCount = size(get(activeWorkoutSession, "exercises", []));

    return (
      <section
        data-testid="plans-state-hero-active-workout"
        className="workout-glass-card relative overflow-hidden rounded-[1.35rem] border border-emerald-500/20 bg-[linear-gradient(110deg,rgba(236,253,245,0.96),rgba(220,252,231,0.78))] p-5 sm:p-6 dark:bg-[linear-gradient(110deg,rgba(7,17,29,0.94),rgba(20,83,45,0.34))]"
      >
        <HeroImage src={getPlanHeroImage(activePlan, 3)} alt={title} />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/94 to-background/20 dark:from-[#07111d] dark:via-[#07111d]/86 dark:to-[#07111d]/20" />
        <div className="relative z-10 max-w-2xl">
          <Badge className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
            {t("user.workout.plansList.hero.activeWorkout.badge")}
          </Badge>
          <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
            {t("user.workout.plansList.hero.activeWorkout.title")}
          </h2>
          <p className="mt-2 text-lg font-black">{title}</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {t("user.workout.plansList.hero.activeWorkout.description")}
          </p>
          <div className="mt-5 flex flex-wrap gap-5">
            <HeroMetric
              icon={DumbbellIcon}
              value={exerciseCount || 1}
              label={t("user.workout.plansList.hero.metrics.exercises")}
              tone="text-emerald-600"
            />
            <HeroMetric
              icon={Clock3Icon}
              value={formatHeroDuration(getActiveWorkoutDurationSeconds(activeWorkoutSession))}
              label={t("user.workout.plansList.hero.metrics.time")}
              tone="text-emerald-600"
            />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={onResumeWorkout}>
              <PlayIcon className="size-4" />
              {t("user.workout.plansList.hero.activeWorkout.continue")}
            </Button>
            <Button variant="outline" className="rounded-xl bg-white/80" onClick={onViewActivePlan}>
              {t("user.workout.plansList.actions.viewPlan")}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (heroType === "active-plan") {
    const progress = toNumber(get(activePlan, "progress")) || 0;
    const nextWorkout = get(activePlan, "nextWorkout") || {};
    const todayWorkout = get(activePlan, "todayWorkout") || {};
    const resolvedDayIndex =
      toNumber(get(nextWorkout, "dayIndex")) >= 0
        ? toNumber(get(nextWorkout, "dayIndex"))
        : nextDayIndex;
    const day = getWorkoutDay(activePlan, resolvedDayIndex);
    const workoutTitle =
      get(nextWorkout, "title") ||
      get(activePlan, "todayWorkout.title") ||
      get(day, "title") ||
      get(day, "focus") ||
      get(activePlan, "name");
    const totalDays = getPlanTotalDays(activePlan);
    const completedDays = Math.min(totalDays, getPlanCompletedDays(activePlan));
    const exerciseCount =
      toNumber(get(nextWorkout, "exerciseCount")) ||
      toNumber(get(todayWorkout, "exercisesCount")) ||
      getWorkoutDayExerciseCount(activePlan, resolvedDayIndex) ||
      0;
    const duration =
      get(nextWorkout, "duration") ||
      get(todayWorkout, "duration") ||
      get(day, "duration") ||
      t("user.workout.plansList.hero.metrics.notSet");
    const calories =
      toNumber(get(nextWorkout, "estimatedCalories")) ||
      toNumber(get(todayWorkout, "calories")) ||
      toNumber(get(day, "estimatedCalories")) ||
      toNumber(get(day, "calories")) ||
      0;

    return (
      <section
        data-testid="plans-state-hero-active-plan"
        className="workout-glass-card relative overflow-hidden rounded-[1.35rem] border border-emerald-500/20 bg-[linear-gradient(110deg,rgba(236,253,245,0.98),rgba(220,252,231,0.8))] p-5 sm:p-6 dark:bg-[linear-gradient(110deg,rgba(7,17,29,0.96),rgba(20,83,45,0.34))]"
      >
        <HeroImage src={getPlanHeroImage(activePlan, 3)} alt={workoutTitle} />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/94 to-background/20 dark:from-[#07111d] dark:via-[#07111d]/86 dark:to-[#07111d]/20" />
        <div className="relative z-10 max-w-2xl">
          <Badge className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
            {t("user.workout.plansList.hero.activePlan.badge")}
          </Badge>
          <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
            {t("user.workout.plansList.hero.activePlan.title")}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="text-lg font-black">{get(activePlan, "name")}</p>
            <Badge className="rounded-full bg-emerald-500/10 text-emerald-600">
              {t("user.workout.plansList.badges.active")}
            </Badge>
          </div>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {t("user.workout.plansList.hero.activePlan.description", {
              title: workoutTitle,
            })}
          </p>
          <div className="mt-5 flex flex-wrap gap-5">
            <HeroMetric
              icon={DumbbellIcon}
              value={exerciseCount}
              label={t("user.workout.plansList.hero.metrics.exercises")}
              tone="text-emerald-600"
            />
            <HeroMetric
              icon={Clock3Icon}
              value={duration}
              label={t("user.workout.plansList.hero.metrics.duration")}
              tone="text-emerald-600"
            />
            <HeroMetric
              icon={FlameIcon}
              value={calories}
              label={t("user.workout.plansList.hero.metrics.kcal")}
              tone="text-emerald-600"
            />
          </div>
          <div className="mt-5 max-w-lg">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold">
              <span>
                {t("user.workout.plansList.hero.activePlan.progress", {
                  completed: completedDays,
                  total: totalDays,
                })}
              </span>
              <span>{progress}%</span>
            </div>
            <ProgressBar value={progress} tone="bg-emerald-600" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={onStartTodayWorkout}>
              <PlayIcon className="size-4" />
              {t("user.workout.plansList.hero.activePlan.startToday")}
            </Button>
            <Button variant="outline" className="rounded-xl bg-white/80" onClick={onViewActivePlan}>
              {t("user.workout.plansList.actions.viewPlan")}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      data-testid="plans-state-hero-no-active"
      className="workout-glass-card relative overflow-hidden rounded-[1.35rem] border border-primary/20 bg-[linear-gradient(110deg,rgba(255,247,237,0.98),rgba(255,237,213,0.72))] p-5 sm:p-7 dark:bg-[linear-gradient(110deg,rgba(7,17,29,0.96),rgba(67,34,10,0.38))]"
    >
      <HeroImage
        src={getPlanHeroImage(recommendedPlan, 0)}
        alt={t("user.workout.plansList.hero.noActive.title")}
        className="opacity-85"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/94 to-background/20 dark:from-[#07111d] dark:via-[#07111d]/88 dark:to-[#07111d]/20" />
      <div className="relative z-10 max-w-2xl">
        <Badge className="rounded-full bg-primary/10 text-primary">
          {t("user.workout.plansList.hero.noActive.badge")}
        </Badge>
        <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
          {t("user.workout.plansList.hero.noActive.title")}
        </h2>
        <p className="mt-3 max-w-md text-base leading-7 text-muted-foreground">
          {t("user.workout.plansList.hero.noActive.description")}
        </p>
        <div className="mt-5 flex flex-wrap gap-5">
          <HeroFeature icon={TargetIcon}>
            {t("user.workout.plansList.hero.noActive.goalFit")}
          </HeroFeature>
          <HeroFeature icon={BarChart3Icon}>
            {t("user.workout.plansList.hero.noActive.progress")}
          </HeroFeature>
          <HeroFeature icon={CrownIcon}>
            {t("user.workout.plansList.hero.noActive.results")}
          </HeroFeature>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-[auto_auto] sm:justify-start">
          <Button className="rounded-xl" onClick={onSelectRecommended}>
            <SparklesIcon className="size-4" />
            {t("user.workout.plansList.hero.noActive.aiCta")}
          </Button>
          <Button variant="outline" className="rounded-xl bg-white/80" onClick={onCreatePlan}>
            <PlusIcon className="size-4" />
            {t("user.workout.plansList.actions.createPlan")}
          </Button>
        </div>
      </div>
    </section>
  );
};

const PlanSidebar = ({
  activePlan,
  recommendedPlan,
  currentStreak,
  onCreatePlan,
  onContinuePlan,
  onStartRecommended,
  t,
}) => {
  const activeProgress =
    toNumber(
      get(activePlan, "progress", get(activePlan, "completionPercent", 0)),
    ) || 58;
  const recommendedTitle = get(
    recommendedPlan,
    "name",
    t("user.workout.plansList.sidebar.coachTitle"),
  );
  const recommendedDescription = get(
    recommendedPlan,
    "description",
    t("user.workout.plansList.sidebar.coachDescription"),
  );
  const benefits = ["structured", "trackProgress", "goals", "guidance"];
  const weekDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const streakCount = Math.max(0, toNumber(currentStreak) || 0);

  return (
    <div className="space-y-4">
      <div className="workout-glass-card rounded-3xl p-5">
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-4 text-primary" />
          <h4 className="text-sm font-black">
            {t("user.workout.plansList.sidebar.recommendedForYou")}
          </h4>
        </div>
        <div className="relative mt-4 min-h-[172px] overflow-hidden rounded-[1.25rem] border border-primary/15 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,243,232,0.72))] p-4 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.8),rgba(67,34,10,0.44))]">
          <img
            src={getPlanHeroImage(recommendedPlan, 0)}
            alt={recommendedTitle}
            className="absolute inset-y-0 right-0 h-full w-[46%] object-cover opacity-80"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/10 dark:from-[#07111d] dark:via-[#07111d]/90 dark:to-[#07111d]/20" />
          <div className="relative z-10 max-w-[14rem]">
            <p className="text-xs font-semibold text-muted-foreground">
              {t("user.workout.plansList.sidebar.coachLabel")}
            </p>
            <h5 className="mt-2 text-base font-black">{recommendedTitle}</h5>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {recommendedDescription}
            </p>
            <Button
              className="mt-4 rounded-2xl"
              size="sm"
              onClick={onStartRecommended}
            >
              {t("user.workout.plansList.sidebar.viewRecommendation")}
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </div>
      <div className="workout-glass-card rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-black">
            {t("user.workout.plansList.sidebar.activePlan")}
          </h4>
          {activePlan ? (
            <Badge className="rounded-full bg-green-500/10 text-green-500">
              {t("user.workout.plansList.badges.active")}
            </Badge>
          ) : null}
        </div>
        {activePlan ? (
          <div className="mt-4">
            <div className="flex gap-3">
              <img
                src={getPlanHeroImage(activePlan, 3)}
                alt={get(
                  activePlan,
                  "name",
                  t("user.workout.plansList.sidebar.activePlanAlt"),
                )}
                className="size-16 rounded-2xl object-cover"
                loading="lazy"
              />
              <div className="min-w-0">
                <p className="truncate text-base font-black">
                  {get(
                    activePlan,
                    "name",
                    t("user.workout.plansList.sidebar.defaultActiveName"),
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("user.workout.plansList.sidebar.weekDay", {
                    week: get(activePlan, "currentWeek", 2),
                    day: get(activePlan, "currentDay", 3),
                  })}
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, activeProgress)}%` }}
              />
            </div>
            <p className="mt-2 text-right text-xs text-muted-foreground">
              {t("user.workout.plansList.sidebar.percentComplete", {
                percent: activeProgress,
              })}
            </p>
            <Button
              variant="outline"
              className="mt-4 w-full rounded-2xl"
              onClick={onContinuePlan}
            >
              {t("user.workout.plansList.actions.continuePlan")}
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-900/15 p-4 text-sm text-muted-foreground dark:border-white/10">
            {t("user.workout.plansList.sidebar.emptyActive")}
            <Button onClick={onCreatePlan} className="mt-4 w-full" size="sm">
              <PlusIcon className="size-4" />
              {t("user.workout.plansList.actions.createPlan")}
            </Button>
          </div>
        )}
      </div>
      <div className="workout-glass-card rounded-3xl p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <FlameIcon className="size-5" />
          </span>
          <div>
            <h4 className="text-sm font-black">
              {t("user.workout.plansList.sidebar.streakTitle")}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t("user.workout.plansList.sidebar.daysInRow", {
                count: streakCount,
              })}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {map(weekDays, (day, index) => {
            const completed = index < Math.min(streakCount, weekDays.length);
            return (
              <div key={day} className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {t(`user.workout.plansList.sidebar.weekdays.${day}`)}
                </span>
                <span
                  className={cn(
                    "grid size-6 place-items-center rounded-full border text-[10px] font-bold",
                    completed
                      ? "border-primary bg-primary text-white"
                      : "border-slate-900/10 bg-white/50 text-muted-foreground dark:border-white/10 dark:bg-white/[0.04]",
                  )}
                >
                  {completed ? <CheckIcon className="size-3" /> : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="workout-glass-card rounded-3xl p-5">
        <h4 className="text-sm font-black">
          {t("user.workout.plansList.sidebar.whyFollowPlan")}
        </h4>
        <div className="mt-4 space-y-4">
          {map(benefits, (benefit) => (
            <div key={benefit} className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <DumbbellIcon className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-black">
                  {t(
                    `user.workout.plansList.sidebar.benefits.${benefit}.title`,
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t(
                    `user.workout.plansList.sidebar.benefits.${benefit}.description`,
                  )}
                </span>
              </span>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs font-semibold text-muted-foreground">
          {t("user.workout.plansList.sidebar.footer")}
        </p>
      </div>
    </div>
  );
};

const PLAN_FILTERS = [
  { value: "all", labelKey: "user.workout.plansList.filters.all" },
  { value: "strength", labelKey: "user.workout.plansList.filters.strength" },
  { value: "running", labelKey: "user.workout.plansList.filters.running" },
  {
    value: "weight-loss",
    labelKey: "user.workout.plansList.filters.weightLoss",
  },
  { value: "recovery", labelKey: "user.workout.plansList.filters.recovery" },
  {
    value: "home-workout",
    labelKey: "user.workout.plansList.filters.homeWorkout",
  },
];

const WorkoutPlansPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const { setBreadcrumbs } = useBreadcrumbStore();
  const {
    plans,
    templates,
    activePlan,
    startPlan,
    removePlan,
    duplicatePlan,
    isStartingPlan,
    isRemovingPlan,
    isDuplicatingPlan,
  } = useWorkoutPlan();
  const { activeSession: activeRunningSession } = useRunningActiveSession();
  const { activeWorkoutSession } = useActiveWorkoutSession();

  // /users/me — for streak badge + premium flag.
  const { data: meData } = useGetQuery({
    url: "/users/me",
    queryProps: { queryKey: DASHBOARD_ME_QUERY_KEY },
  });
  const user = getUserFromResponse(meData);
  const currentStreak = get(user, "currentStreak", 0);

  const [filterKey, setFilterKey] = React.useState("all");
  const [deletingPlan, setDeletingPlan] = React.useState(null);

  const normalizedPlans = React.useMemo(
    () => map(plans, (plan) => deriveWorkoutPlanMetrics(plan)),
    [plans],
  );

  const normalizedActivePlan = React.useMemo(
    () => deriveWorkoutPlanMetrics(activePlan),
    [activePlan],
  );

  const normalizedTemplates = React.useMemo(
    () =>
      map(templates, (plan) =>
        deriveWorkoutPlanMetrics({
          ...plan,
          isTemplate: true,
          status: WORKOUT_PLAN_STATUS.template,
        }),
      ),
    [templates],
  );
  const primaryTemplate = normalizedTemplates[0] ?? null;

  const displayPlans = React.useMemo(() => {
    const source = [...normalizedPlans, ...normalizedTemplates];

    const filtered =
      filterKey === "all"
        ? source
        : filter(source, (plan) => planMatchesFilter(plan, filterKey));

    return orderBy(
      filtered,
      [
        (plan) => (get(plan, "status") === WORKOUT_PLAN_STATUS.active ? 0 : 1),
        (plan) => (get(plan, "badge") ? 0 : 1),
        (plan) =>
          new Date(
            get(plan, "updatedAt") || get(plan, "createdAt") || 0,
          ).getTime(),
      ],
      ["asc", "asc", "desc"],
    );
  }, [filterKey, normalizedPlans, normalizedTemplates]);

  const nextActiveDayIndex = React.useMemo(() => {
    if (!normalizedActivePlan) {
      return 0;
    }

    const nextStartableDayIndex = getNextStartableDayIndex(normalizedActivePlan);
    const firstWorkoutDayIndex = getFirstWorkoutDayIndex(
      get(normalizedActivePlan, "schedule", []),
    );

    return nextStartableDayIndex >= 0
      ? nextStartableDayIndex
      : firstWorkoutDayIndex >= 0
        ? firstWorkoutDayIndex
        : 0;
  }, [normalizedActivePlan]);

  const heroType = React.useMemo(() => {
    if (get(activeRunningSession, "workoutSessionId")) {
      return "live-run";
    }

    if (get(activeWorkoutSession, "planId")) {
      return "active-workout";
    }

    if (get(normalizedActivePlan, "id")) {
      return "active-plan";
    }

    return "no-active";
  }, [activeRunningSession, activeWorkoutSession, normalizedActivePlan]);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: t("user.workout.plansList.breadcrumbs.home") },
      {
        url: "/user/workout",
        title: t("user.workout.plansList.breadcrumbs.workout"),
      },
      {
        url: "/user/workout/plans",
        title: t("user.workout.plansList.breadcrumbs.myPlans"),
      },
    ]);
  }, [setBreadcrumbs, t]);

  const handleStartPlan = async (plan) => {
    try {
      await startPlan(plan);
      toast.success(
        t("user.workout.plansList.toasts.startSuccess", {
          name: get(plan, "name", t("user.workout.plansList.defaults.plan")),
        }),
      );
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          t("user.workout.plansList.toasts.startError"),
      );
    }
  };

  const handleDeletePlan = async () => {
    if (!get(deletingPlan, "id")) return;
    try {
      await removePlan(get(deletingPlan, "id"));
      toast.success(t("user.workout.plansList.toasts.deleteSuccess"));
      setDeletingPlan(null);
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          t("user.workout.plansList.toasts.deleteError"),
      );
    }
  };

  const handleDuplicatePlan = async (plan) => {
    if (!get(plan, "id")) return;

    try {
      await duplicatePlan(get(plan, "id"));
      toast.success(t("user.workout.plansList.toasts.duplicateSuccess"));
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          t("user.workout.plansList.toasts.duplicateError"),
      );
    }
  };

  const goToCreate = () => navigate("/user/workout/plans/create");

  const handleStartTodayWorkout = async () => {
    if (!get(normalizedActivePlan, "id")) {
      goToCreate();
      return;
    }

    try {
      if (
        get(normalizedActivePlan, "status") !== WORKOUT_PLAN_STATUS.active &&
        get(normalizedActivePlan, "id")
      ) {
        await startPlan(normalizedActivePlan);
      }

      navigate(
        `/user/workout/plans/${get(normalizedActivePlan, "id")}/days/${nextActiveDayIndex}/session`,
      );
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          t("user.workout.plansList.toasts.startError"),
      );
    }
  };

  const handleResumeWorkout = () => {
    const planId = get(activeWorkoutSession, "planId");
    const dayIndex = toNumber(get(activeWorkoutSession, "planDayIndex"));

    if (planId && Number.isInteger(dayIndex) && dayIndex >= 0) {
      navigate(`/user/workout/plans/${planId}/days/${dayIndex}/session`);
      return;
    }

    if (get(normalizedActivePlan, "id")) {
      navigate(`/user/workout/plans/${get(normalizedActivePlan, "id")}`);
    }
  };

  const handleViewActivePlan = () => {
    const planId =
      get(activeWorkoutSession, "planId") || get(normalizedActivePlan, "id");

    if (planId) {
      navigate(`/user/workout/plans/${planId}`);
      return;
    }

    goToCreate();
  };

  const handleOpenRunningLive = () => {
    const workoutSessionId = get(activeRunningSession, "workoutSessionId");

    if (workoutSessionId) {
      navigate(`/user/workout/running/live/${workoutSessionId}`);
    }
  };

  return (
    <PageTransition mode="slide-up">
      <div className="workout-page-surface grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          <h1 className="sr-only">{t("user.workout.plansList.title")}</h1>

          <div className="flex flex-wrap gap-2">
            {map(PLAN_FILTERS, (filterOption) => {
              const active = filterKey === filterOption.value;
              return (
                <button
                  key={filterOption.value}
                  type="button"
                  onClick={() => setFilterKey(filterOption.value)}
                  className={cn(
                    "rounded-full border px-5 py-2 text-sm font-semibold transition",
                    active
                      ? "border-primary bg-primary/12 text-primary shadow-[0_14px_34px_rgb(var(--accent-rgb)/0.16)]"
                      : "border-slate-900/10 bg-white/50 text-muted-foreground hover:border-primary/30 hover:text-foreground dark:border-white/10 dark:bg-white/[0.04]",
                  )}
                >
                  {t(filterOption.labelKey)}
                </button>
              );
            })}
          </div>

          <PlansStateHero
            activePlan={normalizedActivePlan}
            recommendedPlan={primaryTemplate}
            activeWorkoutSession={activeWorkoutSession}
            activeRunningSession={activeRunningSession}
            heroType={heroType}
            nextDayIndex={nextActiveDayIndex}
            onCreatePlan={goToCreate}
            onSelectRecommended={() =>
              primaryTemplate ? handleStartPlan(primaryTemplate) : goToCreate()
            }
            onStartTodayWorkout={handleStartTodayWorkout}
            onViewActivePlan={handleViewActivePlan}
            onResumeWorkout={handleResumeWorkout}
            onOpenRunningLive={handleOpenRunningLive}
            t={t}
          />

          {size(displayPlans) > 0 ? (
            <div className="grid gap-3">
              <h2 className="text-sm font-black">
                {heroType === "no-active"
                  ? t("user.workout.plansList.sections.allPlans")
                  : t("user.workout.plansList.sections.otherPlans")}
              </h2>
              {map(displayPlans, (plan) => {
                const isTemplate = get(plan, "isTemplate");
                const isActive = get(plan, "id") === get(activePlan, "id");
                const title = isTemplate
                  ? resolveText(
                      get(plan, "translations"),
                      get(plan, "name"),
                      currentLanguage,
                    )
                  : get(plan, "name");
                const description = isTemplate
                  ? resolveText(
                      get(plan, "descriptionTranslations"),
                      get(plan, "description"),
                      currentLanguage,
                    )
                  : get(plan, "description") ||
                    t("user.workout.plansList.defaults.description");

                return (
                  <PlanRow
                    key={`${isTemplate ? "template" : "plan"}-${get(plan, "id")}`}
                    plan={plan}
                    isActive={isActive}
                    title={title}
                    description={description}
                    onView={() =>
                      navigate(`/user/workout/plans/${get(plan, "id")}`)
                    }
                    onStart={() => handleStartPlan(plan)}
                    onEdit={() =>
                      navigate(`/user/workout/plans/edit/${get(plan, "id")}`)
                    }
                    onDuplicate={() => handleDuplicatePlan(plan)}
                    onDelete={() => setDeletingPlan(plan)}
                    isStartDisabled={isStartingPlan}
                    isDuplicateDisabled={isDuplicatingPlan}
                    isEditable={!isTemplate}
                    t={t}
                  />
                );
              })}
            </div>
          ) : (
            <div className="workout-glass-card rounded-3xl border border-dashed px-6 py-12 text-center">
              <DumbbellIcon className="mx-auto size-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">
                {t("user.workout.plansList.empty")}
              </p>
              <Button onClick={goToCreate} className="mt-5">
                <PlusIcon className="size-4" />
                {t("user.workout.plansList.actions.createPlan")}
              </Button>
            </div>
          )}

          {size(displayPlans) > 0 ? (
            <button
              type="button"
              onClick={goToCreate}
              className="flex items-center justify-center gap-2 rounded-3xl border border-dashed border-primary/25 bg-primary/5 py-4 text-sm font-semibold text-primary transition hover:bg-primary/10"
            >
              <PlusIcon className="size-4" />
              {t("user.workout.plansList.actions.createPlan")}
            </button>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <PlanSidebar
            activePlan={activePlan}
            recommendedPlan={primaryTemplate}
            currentStreak={currentStreak}
            onCreatePlan={goToCreate}
            onContinuePlan={() =>
              activePlan?.id
                ? navigate(`/user/workout/plans/${activePlan.id}`)
                : goToCreate()
            }
            onStartRecommended={() =>
              primaryTemplate ? handleStartPlan(primaryTemplate) : goToCreate()
            }
            t={t}
          />
        </aside>
      </div>
      <AlertDialog
        open={Boolean(deletingPlan)}
        onOpenChange={(open) => {
          if (!open) setDeletingPlan(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("user.workout.plansList.deleteConfirm.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {get(deletingPlan, "name")
                ? t("user.workout.plansList.deleteConfirm.description", {
                    name: get(deletingPlan, "name"),
                  })
                : t("user.workout.plansList.deleteConfirm.genericDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingPlan}>
              {t("user.workout.plansList.actions.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isRemovingPlan}
              onClick={handleDeletePlan}
            >
              {t("user.workout.plansList.actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
};

export default WorkoutPlansPage;
