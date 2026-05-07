/* eslint-disable react-refresh/only-export-components */
import React from "react";
import {
  ActivityIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  DropletsIcon,
  DumbbellIcon,
  FlameIcon,
  PlusIcon,
  RepeatIcon,
  SearchIcon,
  ShoppingBasketIcon,
  SparklesIcon,
  TargetIcon,
  UtensilsIcon,
} from "lucide-react";
import AnimatedWaterWidget from "@/components/animated-water-widget";
import CalorieGaugeWidget from "@/components/calorie-gauge-widget";
import { cn } from "@/lib/utils";
import { MoodWidgetView } from "@/modules/user/containers/dashboard/mood-widget.jsx";
import WorkoutWidget from "@/modules/user/containers/dashboard/workout-widget.jsx";

const PREVIEW_INTERVAL_MS = 4500;

const tr = (t, prefix, key) => t(`${prefix}.${key}`);

export const buildLiveOnProductPreviewCopy = (t, prefix = "auth.layout") => ({
  sliderLabel: tr(t, prefix, "previewSliderLabel"),
  aiBadge: tr(t, prefix, "previewAiBadge"),
  title: tr(t, prefix, "previewTitle"),
  dailyDescription: tr(t, prefix, "previewDailyDescription"),
  progressLabel: tr(t, prefix, "previewProgressLabel"),
  progressValue: tr(t, prefix, "previewProgressValue"),
  caloriesLabel: tr(t, prefix, "previewCaloriesLabel"),
  caloriesValue: tr(t, prefix, "previewCaloriesValue"),
  caloriesMeta: tr(t, prefix, "previewCaloriesMeta"),
  mealsTitle: tr(t, prefix, "previewMealsTitle"),
  meals: [
    {
      name: tr(t, prefix, "previewBreakfastName"),
      description: tr(t, prefix, "previewBreakfastDescription"),
      calories: tr(t, prefix, "previewBreakfastCalories"),
    },
    {
      name: tr(t, prefix, "previewLunchName"),
      description: tr(t, prefix, "previewLunchDescription"),
      calories: tr(t, prefix, "previewLunchCalories"),
    },
    {
      name: tr(t, prefix, "previewDinnerName"),
      description: tr(t, prefix, "previewDinnerDescription"),
      calories: tr(t, prefix, "previewDinnerCalories"),
    },
  ],
  macros: [
    {
      icon: UtensilsIcon,
      label: tr(t, prefix, "previewProteinLabel"),
      value: tr(t, prefix, "previewProteinValue"),
      tone: "text-teal-600",
    },
    {
      icon: FlameIcon,
      label: tr(t, prefix, "previewFatLabel"),
      value: tr(t, prefix, "previewFatValue"),
      tone: "text-orange-500",
    },
    {
      icon: ActivityIcon,
      label: tr(t, prefix, "previewCarbsLabel"),
      value: tr(t, prefix, "previewCarbsValue"),
      tone: "text-blue-600",
    },
    {
      icon: DropletsIcon,
      label: tr(t, prefix, "previewWaterLabel"),
      value: tr(t, prefix, "previewWaterValue"),
      tone: "text-cyan-600",
    },
  ],
  workoutTitle: tr(t, prefix, "previewWorkoutTitle"),
  workoutMeta: tr(t, prefix, "previewWorkoutMeta"),
  workoutCalories: tr(t, prefix, "previewWorkoutCalories"),
  checklist: [
    tr(t, prefix, "previewChecklistSteps"),
    tr(t, prefix, "previewChecklistWater"),
    tr(t, prefix, "previewChecklistSugar"),
    tr(t, prefix, "previewChecklistSleep"),
  ],
  slides: [
    {
      id: "daily",
      type: "dashboard",
      badge: tr(t, prefix, "previewAiBadge"),
      title: tr(t, prefix, "previewTitle"),
      description: tr(t, prefix, "previewDailyDescription"),
      icon: SparklesIcon,
      tone: "text-orange-500",
      iconBg: "bg-orange-50",
    },
    {
      id: "builder",
      type: "builder",
      badge: tr(t, prefix, "previewBuilderBadge"),
      title: tr(t, prefix, "previewBuilderTitle"),
      description: tr(t, prefix, "previewBuilderDescription"),
      icon: TargetIcon,
      tone: "text-teal-600",
      iconBg: "bg-teal-50",
    },
    {
      id: "wellness",
      type: "wellness",
      badge: tr(t, prefix, "previewWellnessBadge"),
      title: tr(t, prefix, "previewWellnessTitle"),
      description: tr(t, prefix, "previewWellnessDescription"),
      icon: DropletsIcon,
      tone: "text-cyan-600",
      iconBg: "bg-cyan-50",
    },
    {
      id: "progress",
      type: "progress",
      badge: tr(t, prefix, "previewProgressBadge"),
      title: tr(t, prefix, "previewProgressTitle"),
      description: tr(t, prefix, "previewProgressDescription"),
      icon: ActivityIcon,
      tone: "text-blue-600",
      iconBg: "bg-blue-50",
    },
  ],
  nutritionBudgetLabel: tr(t, prefix, "previewNutritionBudgetLabel"),
  nutritionBudgetValue: tr(t, prefix, "previewNutritionBudgetValue"),
  nutritionReplacementsLabel: tr(
    t,
    prefix,
    "previewNutritionReplacementsLabel",
  ),
  nutritionReplacementsValue: tr(
    t,
    prefix,
    "previewNutritionReplacementsValue",
  ),
  nutritionShoppingTitle: tr(t, prefix, "previewNutritionShoppingTitle"),
  nutritionShopping: [
    tr(t, prefix, "previewNutritionShoppingItem1"),
    tr(t, prefix, "previewNutritionShoppingItem2"),
    tr(t, prefix, "previewNutritionShoppingItem3"),
  ],
  workoutExercisesTitle: tr(t, prefix, "previewWorkoutExercisesTitle"),
  workoutExercises: [
    tr(t, prefix, "previewWorkoutExercise1"),
    tr(t, prefix, "previewWorkoutExercise2"),
    tr(t, prefix, "previewWorkoutExercise3"),
    tr(t, prefix, "previewWorkoutExercise4"),
  ],
  workoutLevelLabel: tr(t, prefix, "previewWorkoutLevelLabel"),
  workoutLevelValue: tr(t, prefix, "previewWorkoutLevelValue"),
  workoutProgressionLabel: tr(t, prefix, "previewWorkoutProgressionLabel"),
  workoutProgressionValue: tr(t, prefix, "previewWorkoutProgressionValue"),
  progressStreakLabel: tr(t, prefix, "previewProgressStreakLabel"),
  progressStreakValue: tr(t, prefix, "previewProgressStreakValue"),
  progressWeightLabel: tr(t, prefix, "previewProgressWeightLabel"),
  progressWeightValue: tr(t, prefix, "previewProgressWeightValue"),
  progressStepsLabel: tr(t, prefix, "previewProgressStepsLabel"),
  progressStepsValue: tr(t, prefix, "previewProgressStepsValue"),
  progressReportTitle: tr(t, prefix, "previewProgressReportTitle"),
  progressInsights: [
    tr(t, prefix, "previewProgressInsight1"),
    tr(t, prefix, "previewProgressInsight2"),
    tr(t, prefix, "previewProgressInsight3"),
  ],
  calorieGaugeLabels: {
    title: tr(t, prefix, "previewCalorieGaugeTitle"),
    eaten: tr(t, prefix, "previewCalorieEatenLabel"),
    remaining: tr(t, prefix, "previewCalorieRemainingLabel"),
    over: tr(t, prefix, "previewCalorieOverLabel"),
    kcal: tr(t, prefix, "previewKcalLabel"),
    toggleAria: tr(t, prefix, "previewCalorieToggleAriaLabel"),
    goalLoading: tr(t, prefix, "previewCalorieGoalLoadingLabel"),
    ariaLabel: tr(t, prefix, "previewCalorieGaugeAriaLabel"),
    protein: tr(t, prefix, "previewProteinLabel"),
    carbs: tr(t, prefix, "previewCarbsLabel"),
    fat: tr(t, prefix, "previewFatLabel"),
    proteinLowAlert: tr(t, prefix, "previewProteinLowAlert"),
    fatHighAlert: tr(t, prefix, "previewFatHighAlert"),
    calorieCloseAlert: tr(t, prefix, "previewCalorieCloseAlert"),
  },
  waterWidgetTitle: tr(t, prefix, "previewWaterWidgetTitle"),
  waterWidgetAriaLabel: tr(t, prefix, "previewWaterWidgetAriaLabel"),
  moodLabels: {
    title: tr(t, prefix, "previewMoodTitle"),
    pending: tr(t, prefix, "previewMoodPendingLabel"),
    empty: tr(t, prefix, "previewMoodEmptyLabel"),
    question: tr(t, prefix, "previewMoodQuestionLabel"),
    moods: {
      bad: tr(t, prefix, "previewMoodBad"),
      tired: tr(t, prefix, "previewMoodTired"),
      neutral: tr(t, prefix, "previewMoodNeutral"),
      good: tr(t, prefix, "previewMoodGood"),
      amazing: tr(t, prefix, "previewMoodAmazing"),
    },
  },
  workoutWidgetLabels: {
    title: tr(t, prefix, "previewWorkoutWidgetTitle"),
    sessions: tr(t, prefix, "previewWorkoutSessionsLabel"),
    continue: tr(t, prefix, "previewWorkoutContinueLabel"),
    empty: tr(t, prefix, "previewWorkoutEmptyLabel"),
    start: tr(t, prefix, "previewWorkoutStartLabel"),
  },
  workoutActivePlanName: tr(t, prefix, "previewWorkoutActivePlanName"),
  previewBuilderBadge: tr(t, prefix, "previewBuilderBadge"),
  builderMealTitle: tr(t, prefix, "previewBuilderMealTitle"),
  builderWorkoutTitle: tr(t, prefix, "previewBuilderWorkoutTitle"),
  builderLibraryTitle: tr(t, prefix, "previewBuilderLibraryTitle"),
  builderSearchPlaceholder: tr(t, prefix, "previewBuilderSearchPlaceholder"),
  builderAddLabel: tr(t, prefix, "previewBuilderAddLabel"),
  builderReadyLabel: tr(t, prefix, "previewBuilderReadyLabel"),
  builderMealColumns: [
    {
      title: tr(t, prefix, "previewBreakfastName"),
      meta: "08:00",
      items: [
        tr(t, prefix, "previewBreakfastDescription"),
        tr(t, prefix, "previewProteinValue"),
      ],
    },
    {
      title: tr(t, prefix, "previewLunchName"),
      meta: "13:30",
      items: [
        tr(t, prefix, "previewLunchDescription"),
        tr(t, prefix, "previewLunchCalories"),
      ],
    },
    {
      title: tr(t, prefix, "previewDinnerName"),
      meta: "19:00",
      items: [
        tr(t, prefix, "previewDinnerDescription"),
        tr(t, prefix, "previewDinnerCalories"),
      ],
    },
  ],
  builderWorkoutDays: [
    {
      title: tr(t, prefix, "previewBuilderWorkoutDay1"),
      focus: tr(t, prefix, "previewWorkoutMeta"),
      items: [
        tr(t, prefix, "previewWorkoutExercise1"),
        tr(t, prefix, "previewWorkoutExercise2"),
      ],
    },
    {
      title: tr(t, prefix, "previewBuilderWorkoutDay2"),
      focus: tr(t, prefix, "previewBuilderWorkoutMobility"),
      items: [
        tr(t, prefix, "previewWorkoutExercise3"),
        tr(t, prefix, "previewWorkoutExercise4"),
      ],
    },
  ],
  builderLibraryItems: [
    tr(t, prefix, "previewBuilderLibraryItem1"),
    tr(t, prefix, "previewBuilderLibraryItem2"),
    tr(t, prefix, "previewBuilderLibraryItem3"),
  ],
});

const previewFrame = {
  auth: "border-white/14 bg-white/[0.08] shadow-[0_32px_100px_rgba(0,0,0,0.34)]",
  landing:
    "border-white/14 bg-white/[0.08] shadow-[0_34px_120px_rgba(2,6,23,0.44)]",
  final:
    "border-white/12 bg-white/[0.07] shadow-[0_28px_90px_rgba(0,0,0,0.30)]",
};

function ProductPreviewSlider({
  className,
  compact = false,
  preview,
  variant = "auth",
}) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const slides = preview?.slides ?? [];
  const activeSlide = slides[activeIndex] || slides[0];

  React.useEffect(() => {
    if (isPaused || slides.length < 2) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, PREVIEW_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [isPaused, slides.length]);

  if (!preview || !activeSlide) {
    return null;
  }

  return (
    <section
      aria-label={preview.sliderLabel}
      className={cn(
        "mx-auto w-full",
        compact ? "max-w-xl" : "max-w-[760px] 2xl:max-w-[860px]",
        className,
      )}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsPaused(false);
        }
      }}
      onFocusCapture={() => setIsPaused(true)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
    >
      <div
        className={cn(
          "rounded-[30px] border p-3 backdrop-blur 2xl:p-4",
          previewFrame[variant] ?? previewFrame.auth,
          compact && "rounded-[26px] p-2.5 2xl:p-3",
        )}
      >
        <div
          className={cn(
            "overflow-hidden rounded-[24px] bg-[#fbfaf7] p-4 text-slate-950 shadow-[0_28px_70px_rgba(2,6,23,0.30)] 2xl:p-5",
            compact && "rounded-[22px] p-3.5 2xl:p-4",
          )}
        >
          <div
            key={activeSlide.id}
            className={cn(
              "animate-in fade-in-0 slide-in-from-right-3 duration-300",
              compact ? "min-h-[500px]" : "min-h-[590px] 2xl:min-h-[650px]",
            )}
          >
            <PreviewSlide compact={compact} preview={preview} slide={activeSlide} />
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            {slides.map((slide, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`${preview.sliderLabel}: ${slide.title}`}
                  aria-pressed={isActive}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "h-2.5 rounded-full outline-none transition-all focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfaf7]",
                    isActive
                      ? "w-8 bg-orange-400"
                      : "w-2.5 bg-slate-200 hover:bg-slate-300",
                  )}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewSlide({ compact, preview, slide }) {
  if (slide.type === "builder") {
    return <PlanBuilderPreviewSlide compact={compact} preview={preview} slide={slide} />;
  }

  if (slide.type === "wellness") {
    return <WellnessPreviewSlide compact={compact} preview={preview} slide={slide} />;
  }

  if (slide.type === "progress") {
    return <ProgressPreviewSlide compact={compact} preview={preview} slide={slide} />;
  }

  return <DashboardPreviewSlide compact={compact} preview={preview} slide={slide} />;
}

function PreviewHeader({ compact, slide }) {
  const Icon = slide.icon;

  return (
    <div className={cn("mb-4 flex items-start justify-between gap-4", compact && "mb-3")}>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase text-orange-500">
          {slide.badge}
        </p>
        <h3
          className={cn(
            "mt-1 text-xl font-black leading-tight text-slate-950 2xl:text-2xl",
            compact && "text-lg 2xl:text-xl",
          )}
        >
          {slide.title}
        </h3>
        <p className="mt-2 max-w-[21rem] text-sm leading-5 text-slate-500">
          {slide.description}
        </p>
      </div>
      <span
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-2xl",
          slide.iconBg,
          compact && "size-10 rounded-xl",
        )}
      >
        <Icon className={cn("size-5", slide.tone, compact && "size-4")} />
      </span>
    </div>
  );
}

function DashboardPreviewSlide({ compact, preview, slide }) {
  return (
    <>
      <PreviewHeader compact={compact} slide={slide} />

      <div className={cn("grid gap-3 xl:grid-cols-[1fr_0.95fr]", compact && "xl:grid-cols-1")}>
        <CalorieGaugeWidget
          className={cn(
            "rounded-[22px] border-slate-200/80 bg-white py-4 shadow-sm [&_[data-slot=card-content]]:px-4 [&_[data-slot=card-header]]:mb-2 [&_[data-slot=card-header]]:px-4",
            compact ? "min-h-[285px]" : "min-h-[330px]",
          )}
          consumed={2160}
          defaultCalorieMode="eaten"
          goal={2760}
          labels={preview.calorieGaugeLabels}
          macros={{
            protein: { current: 140, target: 150 },
            carbs: { current: 235, target: 260 },
            fat: { current: 64, target: 80 },
          }}
        />

        <div className="grid gap-3">
          <MealPlanBuilderPreview compact preview={preview} />
          <WorkoutWidget
            activePlan={{
              completedWorkouts: 4,
              days: 6,
              name: preview.workoutActivePlanName,
              progress: 68,
            }}
            className="min-h-[132px] rounded-[22px] border-slate-200/80 bg-white shadow-sm"
            interactive={false}
            labels={preview.workoutWidgetLabels}
          />
        </div>
      </div>
    </>
  );
}

function PlanBuilderPreviewSlide({ compact, preview, slide }) {
  return (
    <>
      <PreviewHeader compact={compact} slide={slide} />

      <div className={cn("grid gap-3 xl:grid-cols-2", compact && "xl:grid-cols-1")}>
        <MealPlanBuilderPreview preview={preview} />
        <WorkoutPlanBuilderPreview preview={preview} />
      </div>

      <div className="mt-3 rounded-2xl border border-slate-200/75 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <ShoppingBasketIcon className="size-4 text-teal-600" />
          <p className="text-sm font-black text-slate-950">
            {preview.builderLibraryTitle}
          </p>
        </div>
        <div className="mb-3 flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
          <SearchIcon className="size-4 text-slate-400" />
          {preview.builderSearchPlaceholder}
        </div>
        <div className="flex flex-wrap gap-2">
          {preview.builderLibraryItems.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600"
            >
              <PlusIcon className="size-3.5 text-orange-500" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

function WellnessPreviewSlide({ compact, preview, slide }) {
  return (
    <>
      <PreviewHeader compact={compact} slide={slide} />

      <div className="grid gap-3">
        <AnimatedWaterWidget
          amountClassName="text-3xl"
          ariaLabel={preview.waterWidgetAriaLabel}
          className={cn(
            "rounded-[22px] shadow-sm [&_.h-11]:h-9",
            compact ? "min-h-[170px]" : "min-h-[190px]",
          )}
          currentMl={2100}
          hideAdd
          hideHeaderActions
          maxMl={2500}
          title={preview.waterWidgetTitle}
        />
        <MoodWidgetView
          className="rounded-[22px] border-slate-200/80 bg-white py-4 shadow-sm [&_.size-14]:size-9 [&_[data-slot=card-content]]:gap-3 [&_[data-slot=card-content]]:px-4 [&_[data-slot=card-header]]:px-4 [&_[data-slot=card-title]]:text-base"
          labels={preview.moodLabels}
          readOnly
          selectedMood="good"
        />
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
        <MiniInfoCard
          icon={DropletsIcon}
          label={preview.waterWidgetTitle}
          tone="text-cyan-600"
          value={preview.macros[3]?.value}
        />
        <MiniInfoCard
          icon={CheckCircle2Icon}
          label={preview.progressLabel}
          tone="text-teal-600"
          value={preview.checklist[3]}
        />
        <MiniInfoCard
          icon={SparklesIcon}
          label={preview.aiBadge}
          tone="text-orange-500"
          value={preview.progressValue}
        />
      </div>
    </>
  );
}

function ProgressPreviewSlide({ compact, preview, slide }) {
  return (
    <>
      <PreviewHeader compact={compact} slide={slide} />

      <div className={cn("grid gap-3 xl:grid-cols-[0.9fr_1.1fr]", compact && "xl:grid-cols-1")}>
        <WorkoutWidget
          activePlan={{
            completedWorkouts: 5,
            days: 7,
            name: preview.workoutActivePlanName,
            progress: 72,
          }}
          className="min-h-[180px] rounded-[22px] border-slate-200/80 bg-white shadow-sm"
          interactive={false}
          labels={preview.workoutWidgetLabels}
        />

        <div className="grid gap-2.5">
          <div className="grid gap-2.5 sm:grid-cols-3">
            <MiniInfoCard
              icon={FlameIcon}
              label={preview.progressStreakLabel}
              tone="text-orange-500"
              value={preview.progressStreakValue}
            />
            <MiniInfoCard
              icon={TargetIcon}
              label={preview.progressWeightLabel}
              tone="text-teal-600"
              value={preview.progressWeightValue}
            />
            <MiniInfoCard
              icon={ActivityIcon}
              label={preview.progressStepsLabel}
              tone="text-blue-600"
              value={preview.progressStepsValue}
            />
          </div>
          <MiniProgressChart preview={preview} />
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-slate-200/75 bg-white p-3.5 shadow-sm 2xl:mt-4 2xl:p-4">
        <div className="space-y-2.5">
          {preview.progressInsights.map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2Icon className="size-4 shrink-0 text-teal-600" />
              <span className="text-sm font-medium text-slate-600">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function MealPlanBuilderPreview({ compact = false, preview }) {
  return (
    <div className="rounded-2xl border border-slate-200/75 bg-white p-3.5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-teal-50 text-teal-600">
            <UtensilsIcon className="size-4" />
          </span>
          <p className="text-sm font-black text-slate-950">
            {preview.builderMealTitle}
          </p>
        </div>
        <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-black uppercase text-teal-700">
          {preview.builderReadyLabel}
        </span>
      </div>

      <div className={cn("space-y-2", compact && "space-y-2.5")}>
        {(compact ? preview.meals : preview.builderMealColumns).map((item) => (
          <BuilderColumnPreview
            actionLabel={preview.builderAddLabel}
            compact={compact}
            icon={compact ? UtensilsIcon : CalendarDaysIcon}
            item={item}
            key={compact ? item.name : item.title}
            tone="text-teal-600"
          />
        ))}
      </div>
    </div>
  );
}

export function WorkoutPlanBuilderPreview({ preview }) {
  return (
    <div className="rounded-2xl border border-slate-200/75 bg-white p-3.5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-orange-50 text-orange-500">
            <DumbbellIcon className="size-4" />
          </span>
          <p className="text-sm font-black text-slate-950">
            {preview.builderWorkoutTitle}
          </p>
        </div>
        <RepeatIcon className="size-4 text-slate-400" />
      </div>

      <div className="space-y-2">
        {preview.builderWorkoutDays.map((day) => (
          <BuilderColumnPreview
            actionLabel={preview.builderAddLabel}
            icon={DumbbellIcon}
            item={day}
            key={day.title}
            tone="text-orange-500"
          />
        ))}
      </div>
    </div>
  );
}

function BuilderColumnPreview({
  actionLabel,
  compact = false,
  icon: Icon,
  item,
  tone,
}) {
  const title = compact ? item.name : item.title;
  const meta = compact ? item.calories : item.meta || item.focus;
  const rows = compact
    ? [item.description]
    : item.items || [item.description].filter(Boolean);

  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon className={cn("size-3.5 shrink-0", tone)} />
            <p className="truncate text-sm font-black text-slate-950">
              {title}
            </p>
          </div>
          {meta ? (
            <p className="mt-1 text-xs font-semibold text-slate-500">{meta}</p>
          ) : null}
        </div>
        {!compact ? (
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-slate-500 shadow-sm">
            <PlusIcon className="size-3.5" aria-label={actionLabel} />
          </span>
        ) : null}
      </div>
      <div className="mt-2 space-y-1.5">
        {rows.map((row) => (
          <p
            className="truncate rounded-xl bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600"
            key={row}
          >
            {row}
          </p>
        ))}
      </div>
    </div>
  );
}

function MiniProgressChart({ preview }) {
  const bars = [
    "h-10",
    "h-16",
    "h-12",
    "h-20",
    "h-14",
    "h-24",
    "h-[72px]",
  ];

  return (
    <div className="rounded-2xl border border-slate-200/75 bg-white p-3.5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-950">
          {preview.progressReportTitle}
        </p>
        <p className="text-xs font-black text-orange-500">
          {preview.progressValue}
        </p>
      </div>
      <div className="flex h-28 items-end gap-2 rounded-2xl bg-slate-50 px-3 py-3">
        {bars.map((bar, index) => (
          <div
            key={`${bar}-${index}`}
            className={cn(
              "flex-1 rounded-t-xl bg-gradient-to-t from-orange-500 to-orange-300",
              bar,
            )}
          />
        ))}
      </div>
    </div>
  );
}

function MiniInfoCard({ icon: Icon, label, tone, value }) {
  return (
    <div className="rounded-2xl border border-slate-200/75 bg-white px-3.5 py-3.5 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className={cn("size-4", tone)} />
        <span className="text-xs font-semibold text-slate-500">{label}</span>
      </div>
      <p className="mt-2 text-base font-black text-slate-950">{value}</p>
    </div>
  );
}

export default ProductPreviewSlider;
