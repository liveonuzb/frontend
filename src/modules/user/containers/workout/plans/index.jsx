import React from "react";
import { useTranslation } from "react-i18next";
import {
  find,
  get,
  map,
  orderBy,
  size,
  values as lodashValues,
  filter,
  isArray,
  toNumber,
  toUpper,
  trim,
  includes,
  toLower,
  take,
} from "lodash";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  CheckIcon,
  CrownIcon,
  DumbbellIcon,
  ArrowRightIcon,
  FlameIcon,
  MoreVerticalIcon,
  PlayIcon,
  PlusIcon,
  SparklesIcon,
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
import { useLanguageStore, useBreadcrumbStore } from "@/store";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_ME_QUERY_KEY,
  getUserFromResponse,
} from "@/modules/user/containers/dashboard/query-helpers.js";
import { WORKOUT_PLAN_STATUS } from "@/hooks/app/use-workout-plans";
import { deriveWorkoutPlanMetrics } from "../utils";
import { WORKOUT_RECOMMENDED_PLANS } from "../workout-showcase-data.js";

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

const pickGradient = (key) => {
  const str = String(key ?? "default");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return COVER_GRADIENTS[Math.abs(hash) % COVER_GRADIENTS.length];
};

const PlanCard = ({
  plan,
  isActive,
  title,
  description,
  onView,
  onStart,
  onEdit,
  onDelete,
  isStartDisabled,
  isEditable,
  t,
}) => {
  const durationWeeks =
    toNumber(get(plan, "durationWeeks")) ||
    Math.max(1, Math.round((toNumber(get(plan, "days")) || 28) / 7));
  const dayCount = get(plan, "daysPerWeek") || 0;
  const level = get(
    plan,
    "level",
    get(plan, "difficulty", t("user.workout.plansList.defaults.level")),
  );
  const coverImageUrl = get(plan, "coverImageUrl");
  const tags = isArray(get(plan, "tags"))
    ? get(plan, "tags")
    : filter(
        [
          get(plan, "focus", t("user.workout.plansList.defaults.focus")),
          t("user.workout.plansList.defaults.progressTracking"),
          t("user.workout.plansList.defaults.nutritionGuidance"),
        ],
        Boolean,
      );

  return (
    <div className="workout-glass-card group relative grid min-h-[240px] overflow-hidden rounded-[1.6rem] border transition hover:-translate-y-0.5 hover:border-primary/45 md:grid-cols-[minmax(220px,42%)_1fr]">
      <button
        type="button"
        onClick={onView}
        aria-label={t("user.workout.plansList.viewPlanAria", { title })}
        className={cn(
          "relative min-h-[220px] overflow-hidden bg-gradient-to-br text-left",
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
        <div className="workout-media-contrast-scrim absolute inset-0 bg-gradient-to-r from-slate-950/55 via-slate-950/25 to-slate-950/70 dark:from-slate-950/70 dark:via-slate-950/35 dark:to-slate-950/80" />
      </button>
      <div className="flex min-w-0 flex-col p-5 sm:p-7">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
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
            <h3 className="text-2xl font-black tracking-tight">{title}</h3>
            {description ? (
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
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

        <div className="mt-6 grid gap-4 text-sm font-medium text-muted-foreground sm:grid-cols-3">
          <span className="inline-flex items-center gap-1">
            <CrownIcon className="size-4 text-primary" />
            <span className="text-xl font-black text-foreground">
              {durationWeeks}
            </span>
            {t("user.workout.plansList.metrics.weeks")}
          </span>
          <span className="inline-flex items-center gap-1">
            <DumbbellIcon className="size-4 text-primary" />
            <span className="text-xl font-black text-foreground">
              {dayCount}
            </span>
            {t("user.workout.plansList.metrics.daysPerWeek")}
          </span>
          <span className="inline-flex items-center gap-1">
            <FlameIcon className="size-4 text-primary" />
            <span className="font-black text-foreground">{level}</span>
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {map(take(tags, 3), (tag) => (
            <span
              key={tag}
              className="rounded-xl border border-slate-900/10 bg-white/45 px-3 py-1 text-xs font-medium text-muted-foreground dark:border-white/10 dark:bg-white/[0.04]"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex flex-wrap gap-2 pt-6">
          <Button className="rounded-2xl px-5" onClick={onView}>
            {t("user.workout.plansList.actions.viewPlan")}
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={onStart}
            disabled={isStartDisabled}
          >
            <PlayIcon data-icon="inline-start" />
            {isActive
              ? t("user.workout.plansList.actions.continuePlan")
              : t("user.workout.plansList.actions.start")}
          </Button>
        </div>
      </div>
    </div>
  );
};

const PlanSidebar = ({
  activePlan,
  currentStreak,
  onCreatePlan,
  onContinuePlan,
  onStartRecommended,
  t,
}) => {
  const recommendedPlan = WORKOUT_RECOMMENDED_PLANS[0];
  const activeProgress =
    toNumber(
      get(activePlan, "progress", get(activePlan, "completionPercent", 0)),
    ) || 58;
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
            src={recommendedPlan.coverImageUrl}
            alt={t("user.workout.plansList.sidebar.coachTitle")}
            className="absolute inset-y-0 right-0 h-full w-[46%] object-cover opacity-80"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/10 dark:from-[#07111d] dark:via-[#07111d]/90 dark:to-[#07111d]/20" />
          <div className="relative z-10 max-w-[14rem]">
            <p className="text-xs font-semibold text-muted-foreground">
              {t("user.workout.plansList.sidebar.coachLabel")}
            </p>
            <h5 className="mt-2 text-base font-black">
              {t("user.workout.plansList.sidebar.coachTitle")}
            </h5>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {t("user.workout.plansList.sidebar.coachDescription")}
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
                src={get(
                  activePlan,
                  "coverImageUrl",
                  WORKOUT_RECOMMENDED_PLANS[3].coverImageUrl,
                )}
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
    isStartingPlan,
    isRemovingPlan,
  } = useWorkoutPlan();

  // /users/me — for streak badge + premium flag.
  const { data: meData } = useGetQuery({
    url: "/users/me",
    queryProps: { queryKey: DASHBOARD_ME_QUERY_KEY },
  });
  const user = getUserFromResponse(meData);
  const currentStreak = get(user, "currentStreak", 0);
  const isPremium = Boolean(get(user, "premium.isActive"));

  const [filterKey, setFilterKey] = React.useState("all");
  const [deletingPlan, setDeletingPlan] = React.useState(null);

  const normalizedPlans = React.useMemo(
    () => map(plans, (plan) => deriveWorkoutPlanMetrics(plan)),
    [plans],
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

  const displayPlans = React.useMemo(() => {
    const backendPlans = [...normalizedPlans, ...normalizedTemplates];
    const knownKeys = new Set(
      map(backendPlans, (plan) =>
        toLower(String(get(plan, "id", get(plan, "name", "")))),
      ),
    );
    const fallbackPlans = filter(WORKOUT_RECOMMENDED_PLANS, (plan) => {
      const key = toLower(String(get(plan, "id", get(plan, "name", ""))));
      const name = toLower(String(get(plan, "name", "")));
      return !knownKeys.has(key) && !knownKeys.has(name);
    });
    const source =
      backendPlans.length > 0
        ? [...backendPlans, ...fallbackPlans]
        : WORKOUT_RECOMMENDED_PLANS;

    const filtered =
      filterKey === "all"
        ? source
        : filter(source, (plan) => {
            const category = toLower(String(get(plan, "category", "")));
            const focus = toLower(String(get(plan, "focus", "")));
            const name = toLower(String(get(plan, "name", "")));
            return (
              category === filterKey ||
              includes(focus, filterKey.replace("-", " ")) ||
              includes(name, filterKey.replace("-", " "))
            );
          });

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
      navigate("/user/workout/home");
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

  const goToCreate = () => navigate("/user/workout/plans/create");

  return (
    <PageTransition mode="slide-up">
      <div className="workout-page-surface grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                {t("user.workout.plansList.title")}
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                {t("user.workout.plansList.subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {currentStreak > 0 ? (
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5">
                  <FlameIcon className="size-4 text-primary" />
                  <span className="text-sm font-bold tabular-nums text-primary">
                    {currentStreak}
                  </span>
                  <span className="text-[11px] font-medium text-primary/80">
                    {t("user.workout.plansList.dayStreak")}
                  </span>
                </div>
              ) : null}
              {isPremium ? (
                <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1.5">
                  <CrownIcon className="size-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-600">
                    {t("user.workout.plansList.pro")}
                  </span>
                </div>
              ) : null}
              <Button onClick={goToCreate}>
                <PlusIcon className="size-4" />
                {t("user.workout.plansList.actions.createPlan")}
              </Button>
            </div>
          </div>

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

          {size(displayPlans) > 0 ? (
            <div className="grid gap-5">
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
                  <PlanCard
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
                    onDelete={() => setDeletingPlan(plan)}
                    isStartDisabled={isStartingPlan}
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
            currentStreak={currentStreak}
            onCreatePlan={goToCreate}
            onContinuePlan={() =>
              activePlan?.id
                ? navigate(`/user/workout/plans/${activePlan.id}`)
                : goToCreate()
            }
            onStartRecommended={() =>
              handleStartPlan(WORKOUT_RECOMMENDED_PLANS[0])
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
