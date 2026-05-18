import React from "react";
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

const PlanSourceBadge = ({ plan }) => {
  const source = get(plan, "source");
  if (source === "ai") {
    return (
      <Badge variant="secondary" className="gap-1">
        <SparklesIcon className="size-3" />
        AI
      </Badge>
    );
  }
  if (get(plan, "isTemplate")) return <Badge variant="outline">Template</Badge>;
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
}) => {
  const durationWeeks =
    toNumber(get(plan, "durationWeeks")) ||
    Math.max(1, Math.round((toNumber(get(plan, "days")) || 28) / 7));
  const dayCount = get(plan, "daysPerWeek") || 0;
  const level = get(plan, "level", get(plan, "difficulty", "Beginner - Intermediate"));
  const coverImageUrl = get(plan, "coverImageUrl");
  const tags = isArray(get(plan, "tags"))
    ? get(plan, "tags")
    : filter([
        get(plan, "focus", "Strength Focus"),
        "Progress Tracking",
        "Nutrition Guidance",
      ], Boolean);

  return (
    <div className="workout-glass-card group relative grid min-h-[240px] overflow-hidden rounded-[1.6rem] border transition hover:-translate-y-0.5 hover:border-primary/45 md:grid-cols-[minmax(220px,42%)_1fr]">
      <button
        type="button"
        onClick={onView}
        aria-label={`${title} rejani ko'rish`}
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
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/10 via-transparent to-slate-950/60" />
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
                  Active
                </Badge>
              ) : null}
              <PlanSourceBadge plan={plan} />
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
                aria-label="Boshqa amallar"
              >
                <MoreVerticalIcon className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onView}>
                <EyeIcon className="size-4" />
                Ko'rish
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onStart} disabled={isStartDisabled}>
                <PlayIcon className="size-4" />
                {isActive ? "Sessiya" : "Boshlash"}
              </DropdownMenuItem>
              {isEditable ? (
                <>
                  <DropdownMenuItem onClick={onEdit}>
                    <PencilIcon className="size-4" />
                    Tahrirlash
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={onDelete}
                  >
                    <Trash2Icon className="size-4" />
                    O'chirish
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-6 grid gap-4 text-sm font-medium text-muted-foreground sm:grid-cols-3">
          <span className="inline-flex items-center gap-1">
            <CrownIcon className="size-4 text-primary" />
            <span className="text-xl font-black text-foreground">{durationWeeks}</span>
            Weeks
          </span>
          <span className="inline-flex items-center gap-1">
            <DumbbellIcon className="size-4 text-primary" />
            <span className="text-xl font-black text-foreground">{dayCount}</span>
            Days / Week
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
            View Plan
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={onStart}
            disabled={isStartDisabled}
          >
            <PlayIcon data-icon="inline-start" />
            {isActive ? "Continue Plan" : "Start"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const PlanSidebar = ({ activePlan, onCreatePlan, onContinuePlan, onStartRecommended }) => {
  const recommendedPlan = WORKOUT_RECOMMENDED_PLANS[0];
  const activeProgress = toNumber(get(activePlan, "progress", get(activePlan, "completionPercent", 0))) || 58;

  return (
    <div className="space-y-4">
      <div className="workout-glass-card rounded-3xl p-5">
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-4 text-primary" />
          <h4 className="text-sm font-black">Recommended for you</h4>
        </div>
        <div className="relative mt-4 overflow-hidden rounded-3xl border border-primary/20 p-4">
          <img
            src={recommendedPlan.coverImageUrl}
            alt={recommendedPlan.name}
            className="absolute inset-y-0 right-0 h-full w-1/2 object-cover opacity-55"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/20 dark:from-[#07111d] dark:via-[#07111d]/92" />
          <div className="relative z-10 max-w-[13rem]">
            <p className="text-xs font-semibold text-muted-foreground">
              Based on your activity
            </p>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-green-500" />
                You're working out 4 days a week
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-green-500" />
                Strength training is your focus
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-4 text-green-500" />
                You've hit 78% of your goals
              </li>
            </ul>
            <h5 className="mt-5 text-base font-black">
              {recommendedPlan.name}
            </h5>
            <p className="text-xs text-muted-foreground">
              is the perfect next step.
            </p>
            <Button className="mt-4 rounded-2xl" size="sm" onClick={onStartRecommended}>
              Start this plan
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </div>
      <div className="workout-glass-card rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-black">Your active plan</h4>
          {activePlan ? (
            <Badge className="rounded-full bg-green-500/10 text-green-500">
              Active
            </Badge>
          ) : null}
        </div>
        {activePlan ? (
          <div className="mt-4">
            <div className="flex gap-3">
              <img
                src={get(activePlan, "coverImageUrl", WORKOUT_RECOMMENDED_PLANS[3].coverImageUrl)}
                alt={get(activePlan, "name", "Active plan")}
                className="size-16 rounded-2xl object-cover"
                loading="lazy"
              />
              <div className="min-w-0">
                <p className="truncate text-base font-black">
                  {get(activePlan, "name", "Full Body Strength")}
                </p>
                <p className="text-sm text-muted-foreground">
                  Week {get(activePlan, "currentWeek", 2)} / Day {get(activePlan, "currentDay", 3)}
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
              {activeProgress}% complete
            </p>
            <Button
              variant="outline"
              className="mt-4 w-full rounded-2xl"
              onClick={onContinuePlan}
            >
              Continue Plan
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-900/15 p-4 text-sm text-muted-foreground dark:border-white/10">
            Hozircha faol reja yo'q. Reja tanlang yoki o'zingizga mos plan yarating.
            <Button onClick={onCreatePlan} className="mt-4 w-full" size="sm">
              <PlusIcon className="size-4" />
              Yangi plan yaratish
            </Button>
          </div>
        )}
      </div>
      <div className="workout-glass-card rounded-3xl p-5">
        <h4 className="text-sm font-black">Why follow a plan?</h4>
        <div className="mt-4 space-y-4">
          {map([
            ["Structured Workouts", "Stay consistent with a proven plan."],
            ["Track Progress", "Monitor your improvements."],
            ["Reach Your Goals", "Stay motivated and achieve more."],
            ["Expert Guidance", "Workouts designed by professionals."],
          ], ([title, description]) => (
            <div key={title} className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <DumbbellIcon className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-black">{title}</span>
                <span className="text-xs text-muted-foreground">
                  {description}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PLAN_FILTERS = [
  { value: "all", label: "All" },
  { value: "strength", label: "Strength" },
  { value: "running", label: "Running" },
  { value: "weight-loss", label: "Weight Loss" },
  { value: "recovery", label: "Recovery" },
  { value: "home-workout", label: "Home Workout" },
];

const WorkoutPlansPage = () => {
  const navigate = useNavigate();
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
          status: "template",
        }),
      ),
    [templates],
  );

  const displayPlans = React.useMemo(() => {
    const backendPlans = [...normalizedPlans, ...normalizedTemplates];
    const knownKeys = new Set(
      map(backendPlans, (plan) =>
        toLower(String(get(plan, "id", get(plan, "name", ""))))),
    );
    const fallbackPlans = filter(WORKOUT_RECOMMENDED_PLANS, (plan) => {
      const key = toLower(String(get(plan, "id", get(plan, "name", ""))));
      const name = toLower(String(get(plan, "name", "")));
      return !knownKeys.has(key) && !knownKeys.has(name);
    });
    const source = backendPlans.length > 0
      ? [...backendPlans, ...fallbackPlans]
      : WORKOUT_RECOMMENDED_PLANS;

    const filtered =
      filterKey === "all"
        ? source
        : filter(source, (plan) => {
            const category = toLower(String(get(plan, "category", "")));
            const focus = toLower(String(get(plan, "focus", "")));
            const name = toLower(String(get(plan, "name", "")));
            return (category === filterKey ||
            includes(focus, filterKey.replace("-", " ")) || includes(name, filterKey.replace("-", " ")));
          });

    return orderBy(
      filtered,
      [
        (plan) => (get(plan, "status") === "active" ? 0 : 1),
        (plan) => (get(plan, "badge") ? 0 : 1),
        (plan) =>
          new Date(get(plan, "updatedAt") || get(plan, "createdAt") || 0).getTime(),
      ],
      ["asc", "asc", "desc"],
    );
  }, [filterKey, normalizedPlans, normalizedTemplates]);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/workout", title: "Workout" },
      { url: "/user/workout/plans", title: "Mening rejalarim" },
    ]);
  }, [setBreadcrumbs]);

  const handleStartPlan = async (plan) => {
    try {
      await startPlan(plan);
      toast.success(`"${get(plan, "name", "Workout reja")}" boshlandi`);
      navigate("/user/workout/home");
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          "Rejani boshlashda xatolik yuz berdi",
      );
    }
  };

  const handleDeletePlan = async () => {
    if (!get(deletingPlan, "id")) return;
    try {
      await removePlan(get(deletingPlan, "id"));
      toast.success("Workout reja o'chirildi");
      setDeletingPlan(null);
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          "Workout rejani o'chirib bo'lmadi",
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
                Plans
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                Find your plan
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
                    Day streak
                  </span>
                </div>
              ) : null}
              {isPremium ? (
                <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1.5">
                  <CrownIcon className="size-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-600">PRO</span>
                </div>
              ) : null}
              <Button onClick={goToCreate}>
                <PlusIcon className="size-4" />
                Yangi plan yaratish
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
                  {filterOption.label}
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
                  : get(plan, "description") || "Saqlangan workout reja";

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
                  />
                );
              })}
            </div>
          ) : (
            <div className="workout-glass-card rounded-3xl border border-dashed px-6 py-12 text-center">
              <DumbbellIcon className="mx-auto size-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">
                Ushbu filter bo'yicha reja topilmadi
              </p>
              <Button onClick={goToCreate} className="mt-5">
                <PlusIcon className="size-4" />
                Yangi plan yaratish
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
              Yangi plan yaratish
            </button>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <PlanSidebar
            activePlan={activePlan}
            onCreatePlan={goToCreate}
            onContinuePlan={() =>
              activePlan?.id
                ? navigate(`/user/workout/plans/${activePlan.id}`)
                : goToCreate()
            }
            onStartRecommended={() => handleStartPlan(WORKOUT_RECOMMENDED_PLANS[0])}
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
            <AlertDialogTitle>Workout rejani o'chirasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              {get(deletingPlan, "name")
                ? `"${get(deletingPlan, "name")}" rejasi butunlay o'chiriladi.`
                : "Tanlangan workout reja butunlay o'chiriladi."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingPlan}>
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isRemovingPlan}
              onClick={handleDeletePlan}
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
};

export default WorkoutPlansPage;


