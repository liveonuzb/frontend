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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
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
      "min-w-0 break-words rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium leading-4 text-muted-foreground",
      className,
    )}
  >
    {children}
  </span>
);

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
  map(fallbackHighlights, (fallbackHighlight, index) => (
    highlights?.[index] ?? fallbackHighlight
  ));

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
      "rounded-lg border border-border bg-background",
      compact ? "p-2.5" : "p-3",
      className,
    )}
  >
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground",
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
      <Progress value={progress} className="mt-3 h-1.5" />
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
      data-testid="product-dashboard-preview"
      size={compact ? "sm" : "default"}
      className={cn("border-border bg-card shadow-sm", className)}
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
            <FlameIcon className="size-5" />
          </span>
        </div>
      </CardHeader>

      <CardContent className={cn("flex flex-col", compact ? "gap-3" : "gap-4")}>
        <div
          className={cn(
            "rounded-lg border border-border bg-background",
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
            <TextPill className="max-w-32 text-right">{calories.target}</TextPill>
          </div>
          <Progress
            value={calories.progress}
            className={compact ? "mt-3" : "mt-4"}
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
            {map(take(dashboardCopy.meals, 3), (
              [meal, amount, status],
            ) => (
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

        <div className={cn("grid gap-3 sm:grid-cols-2", compact && "hidden lg:grid")}>
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
    <Card data-testid="goal-setup-preview" className="border-border bg-card">
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
    <Card data-testid="ai-plan-preview" className="border-border bg-card">
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
    <Card data-testid="daily-execution-preview" className="border-border bg-card">
      <StepHeader step={stepCopy} icon={CalendarCheckIcon} />
      <CardContent className="flex flex-col gap-3">
        {map(stepCopy.highlights, (
          highlight,
        ) => (
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
      data-testid="progress-result-preview"
      className="border-border bg-card"
    >
      <StepHeader step={stepCopy} icon={LineChartIcon} />
      <CardContent className="flex flex-col gap-4">
        <div className="flex h-28 items-end gap-2 rounded-lg border border-border bg-background p-3">
          {map(resultBars, ({ id, height }) => (
            <div
              key={id}
              className="flex h-full flex-1 items-end"
            >
              <div
                className="w-full rounded-t-md bg-primary/70"
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {map(stepCopy.highlights, (
            highlight,
          ) => (
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
