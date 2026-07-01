import { useEffect, useMemo, useState } from "react";
import {
  ActivityIcon,
  BotIcon,
  CalendarCheckIcon,
  CheckCircle2Icon,
  DropletsIcon,
  DumbbellIcon,
  FlameIcon,
  LineChartIcon,
  TargetIcon,
  UtensilsIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AnimatedWaterWidget from "@/components/animated-water-widget";
import CalorieGaugeWidget from "@/components/calorie-gauge-widget";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { MoodWidgetView } from "@/modules/user/containers/dashboard/mood-widget.jsx";
import map from "lodash/map";
import take from "lodash/take";

const defaultDashboardCopy = {
  eyebrow: "Today's result",
  title: "Daily balance",
  summary: "A plan tuned for your weight goal",
  calories: {
    label: "Calories",
    value: "1,420",
    target: "1,850 target",
    progress: 76,
  },
  mealsLabel: "Meals",
  meals: [
    ["Breakfast", "420 kcal", "Ready"],
    ["Lunch", "560 kcal", "Planned"],
    ["Dinner", "440 kcal", "Adapts"],
  ],
  workout: {
    label: "Workout",
    title: "35 min walk",
    meta: "220 kcal plan",
  },
  water: {
    label: "Water",
    value: "1.8 L",
    target: "2.5 L",
    progress: 72,
  },
  mood: {
    label: "Mood",
    value: "Steady",
  },
  progress: {
    label: "10 days",
    value: "-1.4 kg",
    delta: "pace is strong",
  },
};

const defaultStepCopy = {
  goal: {
    id: "goal",
    kicker: "01",
    title: "Goal setup",
    body: "Weight, height, habits, and training level define the starting point.",
    highlights: ["Goal weight", "Calorie range", "Habits"],
  },
  ai: {
    id: "ai",
    kicker: "02",
    title: "AI daily plan",
    body: "Meals, workouts, and water tasks are combined into one daily plan.",
    highlights: ["Meal plans", "Workout guidance", "Water rhythm"],
  },
  daily: {
    id: "daily",
    kicker: "03",
    title: "Daily execution",
    body: "Adding meals, starting a workout, and logging water or mood stay fast.",
    highlights: ["Meal log", "Workout status", "Mood"],
  },
  progress: {
    id: "progress",
    kicker: "04",
    title: "Progress and next recommendation",
    body: "Reports show your rhythm and suggest tomorrow's most useful action.",
    highlights: ["10-day report", "Weight trend", "Next step"],
  },
};

const defaultHeroPreviewCopy = {
  ariaLabel: "LiveOn app previews",
  calories: {
    title: "Today's calories",
    eatenLabel: "Eaten",
    value: "2,160",
    unit: "kcal",
    progress: 78,
    macros: [
      ["Carbs", "235", "260g", 86, "lime"],
      ["Protein", "140", "150g", 82, "orange"],
      ["Fat", "64", "80g", 76, "violet"],
    ],
  },
  tracking: {
    eyebrow: "Daily tracking",
    title: "Water and mood side by side",
    body: "LiveOn keeps your daily rhythm, not only calories.",
    water: {
      label: "Water",
      value: "2100",
      target: "2500 ml",
      progress: 78,
    },
    mood: {
      label: "Mood",
      value: "Good",
    },
  },
};

const aiProgressValues = [86, 72, 64];
const resultBars = [
  { id: "day-1", height: 42 },
  { id: "day-2", height: 58 },
  { id: "day-3", height: 72 },
  { id: "day-4", height: 68 },
  { id: "day-5", height: 84 },
  { id: "day-6", height: 76 },
];

const TextPill = ({ children, className }) => (
  <span
    className={cn(
      "min-w-0 break-words rounded-md border border-border/80 bg-background px-2 py-1 text-xs font-medium leading-4 text-muted-foreground",
      className,
    )}
  >
    {children}
  </span>
);

const resolveMacroRows = (macros) =>
  map(defaultHeroPreviewCopy.calories.macros, (fallbackMacro, index) => {
    const macro = macros?.[index] || [];

    return [
      macro[0] ?? fallbackMacro[0],
      macro[1] ?? fallbackMacro[1],
      macro[2] ?? fallbackMacro[2],
      macro[3] ?? fallbackMacro[3],
      macro[4] ?? fallbackMacro[4],
    ];
  });

const resolveHeroPreviewCopy = (copy = {}) => ({
  ariaLabel: copy.ariaLabel ?? defaultHeroPreviewCopy.ariaLabel,
  calories: {
    title: copy.calories?.title ?? defaultHeroPreviewCopy.calories.title,
    eatenLabel:
      copy.calories?.eatenLabel ?? defaultHeroPreviewCopy.calories.eatenLabel,
    value: copy.calories?.value ?? defaultHeroPreviewCopy.calories.value,
    unit: copy.calories?.unit ?? defaultHeroPreviewCopy.calories.unit,
    progress:
      copy.calories?.progress ?? defaultHeroPreviewCopy.calories.progress,
    macros: resolveMacroRows(copy.calories?.macros),
  },
  tracking: {
    eyebrow: copy.tracking?.eyebrow ?? defaultHeroPreviewCopy.tracking.eyebrow,
    title: copy.tracking?.title ?? defaultHeroPreviewCopy.tracking.title,
    body: copy.tracking?.body ?? defaultHeroPreviewCopy.tracking.body,
    water: {
      label:
        copy.tracking?.water?.label ??
        defaultHeroPreviewCopy.tracking.water.label,
      value:
        copy.tracking?.water?.value ??
        defaultHeroPreviewCopy.tracking.water.value,
      target:
        copy.tracking?.water?.target ??
        defaultHeroPreviewCopy.tracking.water.target,
      progress:
        copy.tracking?.water?.progress ??
        defaultHeroPreviewCopy.tracking.water.progress,
    },
    mood: {
      label:
        copy.tracking?.mood?.label ??
        defaultHeroPreviewCopy.tracking.mood.label,
      value:
        copy.tracking?.mood?.value ??
        defaultHeroPreviewCopy.tracking.mood.value,
    },
  },
});

const parsePreviewNumber = (value, fallback = 0) => {
  const parsed = Number(String(value ?? "").replace(/[^\d.-]/g, ""));

  return Number.isFinite(parsed) ? parsed : fallback;
};

const resolveCalorieGoal = (copy) => {
  const consumed = parsePreviewNumber(copy.value, 2160);
  const progress = parsePreviewNumber(copy.progress, 78);

  if (progress <= 0) return 2760;

  return Math.round((consumed / progress) * 100);
};

const buildCalorieWidgetProps = (copy) => {
  const [carbs = [], protein = [], fat = []] = copy.macros;
  const consumed = parsePreviewNumber(copy.value, 2160);
  const goal = resolveCalorieGoal(copy);

  return {
    consumed,
    goal,
    labels: {
      title: copy.title,
      eaten: copy.eatenLabel,
      kcal: copy.unit,
      carbs: carbs[0],
      protein: protein[0],
      fat: fat[0],
      ariaLabel: `${copy.title}: ${consumed} / ${goal} ${copy.unit}`,
    },
    macros: {
      carbs: {
        current: parsePreviewNumber(carbs[1], 235),
        target: parsePreviewNumber(carbs[2], 260),
      },
      protein: {
        current: parsePreviewNumber(protein[1], 140),
        target: parsePreviewNumber(protein[2], 150),
      },
      fat: {
        current: parsePreviewNumber(fat[1], 64),
        target: parsePreviewNumber(fat[2], 80),
      },
    },
  };
};

const CaloriesPreviewSlide = ({ copy }) => {
  const calorieWidget = buildCalorieWidgetProps(copy);

  return (
    <div
      className="h-full rounded-[2rem] border border-border/70 bg-muted/35 p-3 shadow-[0_24px_70px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-white/[0.05] sm:p-4"
    >
      <CalorieGaugeWidget
        className="h-full min-h-0 w-full [&_[data-slot=card]]:rounded-[1.35rem] [&_[data-slot=card]]:border-border/80 [&_[data-slot=card]]:bg-card [&_[data-slot=card]]:shadow-none"
        compact
        consumed={calorieWidget.consumed}
        defaultCalorieMode="eaten"
        goal={calorieWidget.goal}
        labels={calorieWidget.labels}
        macros={calorieWidget.macros}
        showBurnedSummary={false}
      />
    </div>
  );
};

const WaterMoodPreviewSlide = ({ copy }) => {
  const currentMl = parsePreviewNumber(copy.water.value, 2100);
  const maxMl = parsePreviewNumber(copy.water.target, 2500);

  return (
    <div
      className="grid h-full grid-rows-[minmax(0,1fr)_minmax(0,0.82fr)] gap-3 rounded-[2rem] border border-border/70 bg-muted/35 p-3 shadow-[0_24px_70px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-white/[0.05] sm:p-4"
    >
      <AnimatedWaterWidget
        amountClassName="text-4xl sm:text-5xl"
        ariaLabel={copy.title}
        className="h-full min-h-0 rounded-[1.5rem] shadow-none ring-1 ring-border/70 dark:ring-white/10 [&_.h-11]:h-9"
        currentMl={currentMl}
        hideAdd
        hideHeaderActions
        maxMl={maxMl}
        title={copy.water.label}
      />
      <MoodWidgetView
        className="h-full min-h-0 rounded-[1.5rem] border-border/80 bg-card py-4 shadow-none dark:border-white/10 dark:bg-card [&_.size-14]:size-9 sm:[&_.size-14]:size-10 [&_[data-slot=card-content]]:gap-3 [&_[data-slot=card-content]]:px-4 [&_[data-slot=card-header]]:px-4"
        labels={{
          title: copy.mood.label,
          moods: {
            good: copy.mood.value,
          },
        }}
        readOnly
        selectedMood="good"
      />
    </div>
  );
};

const mealPreviewTypes = [
  { type: "breakfast", progress: 74 },
  { type: "lunch", progress: 68 },
  { type: "dinner", progress: 52 },
];
const mealProgressRingRadius = 21;
const mealProgressRingCircumference = 2 * Math.PI * mealProgressRingRadius;

const MealPreviewProgressIcon = ({ type, label, progress }) => {
  const safeProgress = Math.max(0, Math.min(100, progress || 0));
  const strokeDashoffset =
    mealProgressRingCircumference -
    (safeProgress / 100) * mealProgressRingCircumference;

  return (
    <span
      className="relative flex size-14 shrink-0 items-center justify-center"
    >
      <svg
        role="progressbar"
        aria-label={`${label} kaloriya progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeProgress}
        className="absolute inset-0 size-full -rotate-90"
        viewBox="0 0 48 48"
        focusable="false"
      >
        <circle
          cx="24"
          cy="24"
          r={mealProgressRingRadius}
          className="stroke-current text-primary/10"
          fill="none"
          strokeWidth="4"
        />
        <circle
          cx="24"
          cy="24"
          r={mealProgressRingRadius}
          className="stroke-current text-primary transition-all duration-300"
          fill="none"
          strokeLinecap="round"
          strokeWidth="4"
          strokeDasharray={mealProgressRingCircumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <span className="relative flex size-11 items-center justify-center overflow-hidden rounded-full bg-background/50 shadow-sm ring-1 ring-border/60">
        <span
          className={cn(
            type,
            "size-8 bg-contain bg-center bg-no-repeat",
          )}
        />
      </span>
    </span>
  );
};

const MealsPreviewSlide = ({ copy }) => (
  <div
    className="meals-widget h-full rounded-[2rem] border border-border/70 bg-muted/35 p-3 shadow-[0_24px_70px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-white/[0.05] sm:p-4"
  >
    <div className="flex h-full min-h-0 flex-col gap-3 rounded-[1.5rem] bg-card p-4 text-card-foreground ring-1 ring-border/80 dark:ring-white/10">
      <div className="flex items-start justify-between gap-4 px-1">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-primary">
            {copy.mealsLabel}
          </p>
          <h3 className="mt-1 truncate text-2xl font-black leading-tight">
            {copy.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">
            {copy.summary}
          </p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <UtensilsIcon className="size-5" />
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-2.5">
        {map(take(copy.meals, 3), ([meal, amount, status], index) => {
          const config = mealPreviewTypes[index] ?? mealPreviewTypes[0];

          return (
            <div
              key={`${meal}-${amount}-${status}`}
              className="overflow-hidden rounded-2xl bg-background text-sm text-foreground shadow-sm ring-1 ring-border/70 dark:ring-white/10"
            >
              <div className="flex items-center gap-2.5 px-3 py-2.5">
                <MealPreviewProgressIcon
                  label={meal}
                  progress={config.progress}
                  type={config.type}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{meal}</p>
                  <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <FlameIcon className="size-3 text-primary" />
                    <span className="truncate">{amount}</span>
                  </p>
                </div>
                <TextPill className="shrink-0 border-primary/20 bg-primary/10 text-primary">
                  {status}
                </TextPill>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

export const HeroProductSwiper = ({
  copy,
  dashboardCopy,
  className,
}) => {
  const previewCopy = useMemo(() => resolveHeroPreviewCopy(copy), [copy]);
  const mealsCopy = useMemo(
    () => resolveDashboardCopy(dashboardCopy),
    [dashboardCopy],
  );
  const [activeSlide, setActiveSlide] = useState(0);
  const shouldAutoplay = useMemo(() => {
    if (typeof window === "undefined") return false;

    return !window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  }, []);
  const slides = useMemo(
    () => [
      {
        id: "calories",
        label: previewCopy.calories.title,
        node: <CaloriesPreviewSlide copy={previewCopy.calories} />,
      },
      {
        id: "tracking",
        label: previewCopy.tracking.title,
        node: <WaterMoodPreviewSlide copy={previewCopy.tracking} />,
      },
      {
        id: "meals",
        label: mealsCopy.mealsLabel,
        node: <MealsPreviewSlide copy={mealsCopy} />,
      },
    ],
    [mealsCopy, previewCopy],
  );
  const activePreviewSlide = slides[activeSlide] ?? slides[0];

  useEffect(() => {
    if (!shouldAutoplay) return void 0;

    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5200);

    return () => window.clearInterval(intervalId);
  }, [shouldAutoplay, slides.length]);

  return (
    <div
      aria-label={previewCopy.ariaLabel}
      aria-roledescription="carousel"
      className={cn("relative min-w-0 w-full max-w-full", className)}
    >
      <div
        className="grid h-[34rem] min-h-[34rem] w-full max-w-full overflow-hidden rounded-[2rem] sm:h-[36rem] lg:h-[38rem]"
      >
        <div
          key={activePreviewSlide.id}
          className="h-full animate-in fade-in-0 slide-in-from-right-4 duration-500"
        >
          {activePreviewSlide.node}
        </div>
      </div>

      <div
        className="absolute right-4 top-4 z-10 flex items-center justify-center gap-2 md:static md:mt-4"
        aria-label="Hero preview controls"
      >
        {map(slides, ({ id, label }, index) => (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-current={activeSlide === index}
            onClick={() => setActiveSlide(index)}
            className={cn(
              "h-2.5 rounded-full bg-muted-foreground/35 transition-all hover:bg-[rgb(var(--accent-rgb)/0.8)]",
              activeSlide === index
                ? "w-10 bg-[rgb(var(--accent-rgb))]"
                : "w-2.5",
            )}
          />
        ))}
      </div>
    </div>
  );
};

const resolveMealRows = (meals) =>
  map(defaultDashboardCopy.meals, (fallbackMeal, index) => {
    const meal = meals?.[index] || [];

    return [
      meal[0] ?? fallbackMeal[0],
      meal[1] ?? fallbackMeal[1],
      meal[2] ?? fallbackMeal[2],
    ];
  });

const resolveDashboardCopy = (copy) => {
  const source = copy || {};

  return {
    eyebrow: source.eyebrow ?? defaultDashboardCopy.eyebrow,
    title: source.title ?? defaultDashboardCopy.title,
    summary: source.summary ?? defaultDashboardCopy.summary,
    calories: {
      label: source.calories?.label ?? defaultDashboardCopy.calories.label,
      value: source.calories?.value ?? defaultDashboardCopy.calories.value,
      target: source.calories?.target ?? defaultDashboardCopy.calories.target,
      progress:
        source.calories?.progress ?? defaultDashboardCopy.calories.progress,
    },
    mealsLabel: source.mealsLabel ?? defaultDashboardCopy.mealsLabel,
    meals: resolveMealRows(source.meals),
    workout: {
      label: source.workout?.label ?? defaultDashboardCopy.workout.label,
      title: source.workout?.title ?? defaultDashboardCopy.workout.title,
      meta: source.workout?.meta ?? defaultDashboardCopy.workout.meta,
    },
    water: {
      label: source.water?.label ?? defaultDashboardCopy.water.label,
      value: source.water?.value ?? defaultDashboardCopy.water.value,
      target: source.water?.target ?? defaultDashboardCopy.water.target,
      progress: source.water?.progress ?? defaultDashboardCopy.water.progress,
    },
    mood: {
      label: source.mood?.label ?? defaultDashboardCopy.mood.label,
      value: source.mood?.value ?? defaultDashboardCopy.mood.value,
    },
    progress: {
      label: source.progress?.label ?? defaultDashboardCopy.progress.label,
      value: source.progress?.value ?? defaultDashboardCopy.progress.value,
      delta: source.progress?.delta ?? defaultDashboardCopy.progress.delta,
    },
  };
};

const resolveHighlights = (highlights, fallbackHighlights) =>
  map(
    fallbackHighlights,
    (fallbackHighlight, index) => highlights?.[index] ?? fallbackHighlight,
  );

const resolveStepCopy = (step, fallback) => ({
  id: step?.id ?? fallback.id,
  kicker: step?.kicker ?? fallback.kicker,
  title: step?.title ?? fallback.title,
  body: step?.body ?? fallback.body,
  highlights: resolveHighlights(step?.highlights, fallback.highlights),
});

const MiniMetric = ({
  icon: Icon,
  label,
  value,
  meta,
  progress,
  compact = false,
  className,
}) => (
  <div
    className={cn(
      "rounded-xl border border-border/80 bg-background",
      compact ? "p-2.5" : "p-3",
      className,
    )}
  >
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground",
          "bg-[rgb(var(--accent-rgb)/0.12)] text-[rgb(var(--accent-strong-rgb))] dark:bg-[rgb(var(--accent-rgb)/0.14)] dark:text-[rgb(var(--accent-rgb))]",
          compact ? "size-8" : "size-9",
        )}
      >
        <Icon className={compact ? "size-3.5" : "size-4"} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-foreground">
          {value}
        </p>
      </div>
      {meta && !compact ? (
        <TextPill className="max-w-28 text-right">{meta}</TextPill>
      ) : null}
    </div>
    {typeof progress === "number" ? (
      <Progress
        value={progress}
        className="mt-3 h-1.5 bg-[rgb(var(--accent-rgb)/0.12)] [&>div]:bg-[rgb(var(--accent-strong-rgb))] dark:bg-[rgb(var(--accent-rgb)/0.14)] dark:[&>div]:bg-[rgb(var(--accent-rgb))]"
      />
    ) : null}
  </div>
);

const StepHeader = ({ step, icon: Icon }) => (
  <CardHeader>
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-3">
        {step.kicker ? (
          <Badge variant="outline" className="w-fit">
            {step.kicker}
          </Badge>
        ) : null}
        <div className="flex flex-col gap-2">
          <CardTitle className="text-xl leading-tight">{step.title}</CardTitle>
          <CardDescription className="leading-6">{step.body}</CardDescription>
        </div>
      </div>
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
    </div>
  </CardHeader>
);

export const DashboardResultMockup = ({ copy, className, compact = false }) => {
  const dashboardCopy = resolveDashboardCopy(copy);
  const { calories, workout, water, mood, progress } = dashboardCopy;
  const mealPreview = map(take(dashboardCopy.meals, 2), ([meal]) => meal).join(
    " / ",
  );

  return (
    <Card
      size={compact ? "sm" : "default"}
      className={cn("border-border/80 bg-card shadow-sm", className)}
    >
      <CardHeader className={cn(compact && "gap-1.5")}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-3">
            <TextPill className="w-fit max-w-full text-foreground">
              {dashboardCopy.eyebrow}
            </TextPill>
            <div className="flex flex-col gap-2">
              <CardTitle
                className={cn(
                  "leading-tight",
                  compact ? "text-xl lg:text-2xl" : "text-2xl",
                )}
              >
                {dashboardCopy.title}
              </CardTitle>
              <CardDescription
                className={cn(
                  "leading-6",
                  compact && "hidden sm:block lg:max-w-sm",
                )}
              >
                {dashboardCopy.summary}
              </CardDescription>
            </div>
          </div>
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
            <FlameIcon className="size-5 text-[rgb(var(--accent-strong-rgb))] dark:text-[rgb(var(--accent-rgb))]" />
          </span>
        </div>
      </CardHeader>

      <CardContent className={cn("flex flex-col", compact ? "gap-3" : "gap-4")}>
        <div
          className={cn(
            "rounded-lg border border-border bg-background",
            "rounded-2xl border-border/80",
            compact ? "p-3 lg:p-4" : "p-4",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {calories.label}
              </p>
              <p
                className={cn(
                  "mt-1 font-semibold text-foreground",
                  compact ? "text-2xl lg:text-3xl" : "text-3xl",
                )}
              >
                {calories.value}
              </p>
            </div>
            <TextPill className="max-w-32 text-right">
              {calories.target}
            </TextPill>
          </div>
          <Progress
            value={calories.progress}
            className={cn(
              "bg-[rgb(var(--accent-rgb)/0.12)] [&>div]:bg-[rgb(var(--accent-strong-rgb))] dark:bg-[rgb(var(--accent-rgb)/0.14)] dark:[&>div]:bg-[rgb(var(--accent-rgb))]",
              compact ? "mt-3" : "mt-4",
            )}
          />
        </div>

        {compact ? (
          <div className="grid grid-cols-2 gap-2 lg:hidden">
            <MiniMetric
              compact
              icon={UtensilsIcon}
              label={dashboardCopy.mealsLabel}
              value={mealPreview}
            />
            <MiniMetric
              compact
              icon={DumbbellIcon}
              label={workout.label}
              value={workout.title}
            />
            <MiniMetric
              compact
              className="hidden sm:block"
              icon={DropletsIcon}
              label={water.label}
              value={water.value}
            />
            <MiniMetric
              compact
              className="hidden sm:block"
              icon={LineChartIcon}
              label={progress.label}
              value={progress.value}
            />
          </div>
        ) : null}

        <div className={cn("flex flex-col gap-3", compact && "hidden lg:flex")}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">
              {dashboardCopy.mealsLabel}
            </p>
            <UtensilsIcon className="size-4 text-muted-foreground" />
          </div>
          <div className="grid gap-2">
            {map(take(dashboardCopy.meals, 3), ([meal, amount, status]) => (
              <div
                key={`${meal}-${amount}-${status}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {meal}
                  </p>
                  <p className="text-xs text-muted-foreground">{amount}</p>
                </div>
                <TextPill className="max-w-24 text-right text-foreground">
                  {status}
                </TextPill>
              </div>
            ))}
          </div>
        </div>

        <Separator className={cn(compact && "hidden lg:block")} />

        <div
          className={cn(
            "grid gap-3 sm:grid-cols-2",
            compact && "hidden lg:grid",
          )}
        >
          <MiniMetric
            icon={DumbbellIcon}
            label={workout.label}
            value={workout.title}
            meta={workout.meta}
          />
          <MiniMetric
            icon={DropletsIcon}
            label={water.label}
            value={water.value}
            meta={water.target}
            progress={water.progress}
          />
          <MiniMetric
            icon={ActivityIcon}
            label={mood.label}
            value={mood.value}
          />
          <MiniMetric
            icon={LineChartIcon}
            label={progress.label}
            value={progress.value}
            meta={progress.delta}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export const GoalSetupMockup = ({ step }) => {
  const stepCopy = resolveStepCopy(step, defaultStepCopy.goal);
  const { highlights } = stepCopy;

  return (
    <Card className="border-border bg-card">
      <StepHeader step={stepCopy} icon={TargetIcon} />
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {highlights[1]}
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                1,850
              </p>
            </div>
            <TextPill className="max-w-40 text-right text-foreground">
              {highlights[0]}
            </TextPill>
          </div>
          <Separator className="my-4" />
          <div className="grid gap-2 sm:grid-cols-3">
            {map(highlights, (highlight) => (
              <div
                key={highlight}
                className="rounded-lg border border-border bg-muted/45 p-3 text-sm font-medium text-foreground"
              >
                <span className="mb-2 block size-2 rounded-full bg-primary" />
                {highlight}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const AiPlanMockup = ({ step }) => {
  const stepCopy = resolveStepCopy(step, defaultStepCopy.ai);

  return (
    <Card className="border-border bg-card">
      <StepHeader step={stepCopy} icon={BotIcon} />
      <CardContent className="flex flex-col gap-3">
        {map(stepCopy.highlights, (highlight, index) => {
          const value = aiProgressValues[index] || 70;

          return (
            <div
              key={highlight}
              className="rounded-lg border border-border bg-background p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground">
                  {highlight}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {value}%
                </span>
              </div>
              <Progress value={value} className="h-1.5" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export const DailyExecutionMockup = ({ step }) => {
  const stepCopy = resolveStepCopy(step, defaultStepCopy.daily);

  return (
    <Card
      className="border-border bg-card"
    >
      <StepHeader step={stepCopy} icon={CalendarCheckIcon} />
      <CardContent className="flex flex-col gap-3">
        {map(stepCopy.highlights, (highlight) => (
          <div
            key={highlight}
            className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
          >
            <CheckCircle2Icon className="size-4 shrink-0 text-primary" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {highlight}
            </span>
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-full bg-muted-foreground/40"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export const ProgressResultMockup = ({ step }) => {
  const stepCopy = resolveStepCopy(step, defaultStepCopy.progress);

  return (
    <Card
      className="border-border bg-card"
    >
      <StepHeader step={stepCopy} icon={LineChartIcon} />
      <CardContent className="flex flex-col gap-4">
        <div className="flex h-28 items-end gap-2 rounded-lg border border-border bg-background p-3">
          {map(resultBars, ({ id, height }) => (
            <div key={id} className="flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t-md bg-primary/70"
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {map(stepCopy.highlights, (highlight) => (
            <div
              key={highlight}
              className="flex items-center gap-2 rounded-lg bg-muted/45 p-3 text-sm font-medium text-foreground"
            >
              <ActivityIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 truncate">{highlight}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const StepMockup = ({ step }) => {
  switch (step?.id) {
    case "ai":
      return <AiPlanMockup step={step} />;
    case "daily":
      return <DailyExecutionMockup step={step} />;
    case "progress":
      return <ProgressResultMockup step={step} />;
    case "goal":
    default:
      return <GoalSetupMockup step={step} />;
  }
};
