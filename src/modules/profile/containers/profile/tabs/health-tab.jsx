import React from "react";
import { useTranslation } from "react-i18next";
import { isEqual } from "lodash";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import useHealthGoals from "@/hooks/app/use-health-goals";
import {
  BellIcon,
  DropletIcon,
  FlameIcon,
  FootprintsIcon,
  MinusIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const AUTO_SAVE_DELAY_MS = 700;

const INTENSITY_OPTIONS = [
  {
    id: "slow",
    label: "Sekin",
    lossCalories: -200,
    gainCalories: 150,
    waterBoost: 100,
    stepBoost: 500,
  },
  {
    id: "medium",
    label: "O'rtacha",
    lossCalories: -350,
    gainCalories: 300,
    waterBoost: 250,
    stepBoost: 1500,
  },
  {
    id: "fast",
    label: "Tez",
    lossCalories: -500,
    gainCalories: 450,
    waterBoost: 400,
    stepBoost: 2500,
  },
];

const PRESET_OPTIONS = [
  {
    id: "lose",
    icon: "🔥",
    label: "Ozish",
    description: "Kaloriya pasayadi, qadam ko'payadi.",
  },
  {
    id: "maintain",
    icon: "⚖️",
    label: "Saqlash",
    description: "Balans ushlab turiladi, ritm tinch qoladi.",
  },
  {
    id: "gain",
    icon: "💪",
    label: "Massa",
    description: "Kaloriya ko'payadi, suv va tiklanish kuchayadi.",
  },
];

const METRIC_META = {
  calories: {
    label: "Kunlik kaloriya",
    unit: "KCAL",
    icon: FlameIcon,
    step: 50,
    min: 1200,
    max: 5000,
    cardClass:
      "bg-gradient-to-br from-orange-500/10 via-background to-background dark:from-orange-500/15 dark:via-card dark:to-card",
    iconClass: "bg-orange-500/10 text-orange-500",
    toneClass: "text-orange-500",
    ringClass: "ring-orange-500/10",
  },
  waterMl: {
    label: "Kunlik suv",
    unit: "ML",
    icon: DropletIcon,
    step: 100,
    min: 500,
    max: 7000,
    cardClass:
      "bg-gradient-to-br from-sky-500/10 via-background to-background dark:from-sky-500/15 dark:via-card dark:to-card",
    iconClass: "bg-sky-500/10 text-sky-500",
    toneClass: "text-sky-500",
    ringClass: "ring-sky-500/10",
  },
  steps: {
    label: "Kunlik qadam",
    unit: "QADAM",
    icon: FootprintsIcon,
    step: 500,
    min: 1000,
    max: 30000,
    cardClass:
      "bg-gradient-to-br from-emerald-500/10 via-background to-background dark:from-emerald-500/15 dark:via-card dark:to-card",
    iconClass: "bg-emerald-500/10 text-emerald-500",
    toneClass: "text-emerald-500",
    ringClass: "ring-emerald-500/10",
  },
};

const STATUS_DOT_CLASS = {
  idle: null,
  saving: "bg-primary/80 animate-pulse",
  saved: "bg-emerald-500",
  error: "bg-destructive",
};

const createInitialForm = (goals) => ({
  weightUnit: goals.weightUnit,
  heightUnit: goals.heightUnit,
  waterUnit: goals.waterUnit,
  waterNotification: goals.waterNotification ?? true,
  calories: String(goals.calories),
  waterMl: String(goals.waterMl),
  steps: String(goals.steps),
});

const toGoalsPayload = (form) => ({
  weightUnit: form.weightUnit,
  heightUnit: form.heightUnit,
  waterUnit: form.waterUnit,
  waterNotification: Boolean(form.waterNotification),
  calories: Number(form.calories) || 0,
  waterMl: Number(form.waterMl) || 0,
  steps: Number(form.steps) || 0,
});

const clampMetricValue = (value, min, max) =>
  Math.min(Math.max(value, min), max);

const roundToStep = (value, step) => Math.round(value / step) * step;

const formatNumber = (value) =>
  new Intl.NumberFormat("en-US").format(Number(value) || 0);

const vibrateSoft = () => {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  ) {
    navigator.vibrate(10);
  }
};

const getSavedNumbers = (form) => ({
  calories: Number(form.calories) || 0,
  waterMl: Number(form.waterMl) || 0,
  steps: Number(form.steps) || 0,
});

const inferPresetFromGoals = (goals) => {
  if (goals.calories <= 1950) {
    return "lose";
  }

  if (goals.calories >= 2400) {
    return "gain";
  }

  return "maintain";
};

const inferIntensityFromGoals = (goals, presetId) => {
  if (presetId === "maintain") {
    return "medium";
  }

  const baseline = 2200;
  const delta = Math.abs((goals.calories || baseline) - baseline);

  if (delta < 250) {
    return "slow";
  }

  if (delta < 400) {
    return "medium";
  }

  return "fast";
};

const buildPresetTargets = (baseGoals, presetId, intensityId) => {
  const intensity =
    INTENSITY_OPTIONS.find((item) => item.id === intensityId) ??
    INTENSITY_OPTIONS[1];
  const caloriesBase = baseGoals.calories || 2200;
  const waterBase = baseGoals.waterMl || 2500;
  const stepsBase = baseGoals.steps || 10000;

  if (presetId === "lose") {
    return {
      calories: clampMetricValue(
        roundToStep(caloriesBase + intensity.lossCalories, 50),
        METRIC_META.calories.min,
        METRIC_META.calories.max,
      ),
      waterMl: clampMetricValue(
        roundToStep(Math.max(waterBase, 2500) + intensity.waterBoost, 100),
        METRIC_META.waterMl.min,
        METRIC_META.waterMl.max,
      ),
      steps: clampMetricValue(
        roundToStep(Math.max(stepsBase, 8500) + intensity.stepBoost, 500),
        METRIC_META.steps.min,
        METRIC_META.steps.max,
      ),
    };
  }

  if (presetId === "gain") {
    return {
      calories: clampMetricValue(
        roundToStep(caloriesBase + intensity.gainCalories, 50),
        METRIC_META.calories.min,
        METRIC_META.calories.max,
      ),
      waterMl: clampMetricValue(
        roundToStep(Math.max(waterBase, 2400) + intensity.waterBoost, 100),
        METRIC_META.waterMl.min,
        METRIC_META.waterMl.max,
      ),
      steps: clampMetricValue(
        roundToStep(
          Math.max(
            7000,
            stepsBase - 1000 + Math.round(intensity.stepBoost * 0.4),
          ),
          500,
        ),
        METRIC_META.steps.min,
        METRIC_META.steps.max,
      ),
    };
  }

  const maintainOffset =
    intensityId === "slow" ? -50 : intensityId === "fast" ? 100 : 0;

  return {
    calories: clampMetricValue(
      roundToStep(caloriesBase + maintainOffset, 50),
      METRIC_META.calories.min,
      METRIC_META.calories.max,
    ),
    waterMl: clampMetricValue(
      roundToStep(
        Math.max(waterBase, 2500) + Math.round(intensity.waterBoost * 0.4),
        100,
      ),
      METRIC_META.waterMl.min,
      METRIC_META.waterMl.max,
    ),
    steps: clampMetricValue(
      roundToStep(
        Math.max(stepsBase, 9000) + Math.round(intensity.stepBoost * 0.35),
        500,
      ),
      METRIC_META.steps.min,
      METRIC_META.steps.max,
    ),
  };
};

const getCaloriesChangeText = (current, target) => {
  const diff = target - current;

  if (diff === 0) {
    return "Hozirgi ritmingiz bilan mos keladi.";
  }

  return `${diff > 0 ? "+" : "−"}${formatNumber(Math.abs(diff))} kcal ${
    diff > 0 ? "oshirish kerak." : "kamaytirish kerak."
  }`;
};

const HealthTabSkeleton = () => (
  <div className="space-y-4">
    <Card className="border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
      <CardContent className="space-y-3 p-5">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>

    <div className="flex gap-2 overflow-hidden">
      {[0, 1, 2].map((item) => (
        <Skeleton key={item} className="h-12 w-32 rounded-full" />
      ))}
    </div>

    <Card className="border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
      <CardContent className="space-y-4 p-5">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-3 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-10" />
        </div>
      </CardContent>
    </Card>

    {[0, 1, 2].map((item) => (
      <Card
        key={item}
        className="border-border/60 bg-card/70 shadow-sm backdrop-blur-xl"
      >
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-28 rounded-full" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-[auto,1fr,auto] items-center gap-3">
            <Skeleton className="size-11 rounded-full" />
            <Skeleton className="mx-auto h-11 w-32 rounded-2xl" />
            <Skeleton className="size-11 rounded-full" />
          </div>
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const AnimatedMetricValue = ({ value, unit, toneClass }) => (
  <div className="flex min-w-0 items-end justify-center gap-2">
    <div className="relative h-12 overflow-hidden sm:h-14">
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={value}
          initial={{ y: 18, opacity: 0, filter: "blur(8px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -18, opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="block text-[2rem] font-black tracking-[-0.06em] text-foreground tabular-nums sm:text-[2.35rem]"
        >
          {formatNumber(value)}
        </motion.span>
      </AnimatePresence>
    </div>
    <span className={cn("pb-1 text-sm font-black tracking-[0.18em]", toneClass)}>
      {unit}
    </span>
  </div>
);

const StepButton = ({ disabled, icon: Icon, onClick }) => (
  <motion.div whileTap={{ scale: disabled ? 1 : 0.95 }}>
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      onClick={onClick}
      disabled={disabled}
      className="size-12 rounded-full border-border/70 bg-background/75 shadow-sm backdrop-blur-xl hover:bg-muted/60"
    >
      <Icon className="size-4.5" />
    </Button>
  </motion.div>
);

const GoalMetricCard = ({
  meta,
  value,
  primarySubtext,
  secondarySubtext,
  onIncrement,
  onDecrement,
  incrementDisabled,
  decrementDisabled,
  extra,
}) => {
  const Icon = meta.icon;

  return (
    <Card
      className={cn(
        "rounded-[28px] border-border/60 shadow-sm backdrop-blur-xl",
        meta.cardClass,
        meta.ringClass,
      )}
    >
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                meta.iconClass,
              )}
            >
              <Icon className="size-4.5" />
            </div>
            <div className="min-w-0">
              <Badge
                variant="outline"
                className={cn(
                  "h-6 rounded-full border-border/60 bg-background/60 px-2.5 text-[10px] font-bold uppercase tracking-[0.18em]",
                  meta.toneClass,
                )}
              >
                {meta.label}
              </Badge>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">
                {primarySubtext}
              </p>
            </div>
          </div>
          {extra}
        </div>

        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-3">
          <StepButton
            disabled={decrementDisabled}
            icon={MinusIcon}
            onClick={onDecrement}
          />
          <AnimatedMetricValue
            value={value}
            unit={meta.unit}
            toneClass={meta.toneClass}
          />
          <StepButton
            disabled={incrementDisabled}
            icon={PlusIcon}
            onClick={onIncrement}
          />
        </div>

        <p className="text-sm leading-6 text-muted-foreground">
          {secondarySubtext}
        </p>
      </CardContent>
    </Card>
  );
};

const HealthTabContent = ({
  form,
  initialNumbers,
  currentNumbers,
  recommendedNumbers,
  saveStatus,
  selectedIntensity,
  selectedPreset,
  onMetricChange,
  onPresetChange,
  onIntensityChange,
  onWaterReminderChange,
}) => {
  const recommendedCalories = roundToStep(
    Math.max(1600, recommendedNumbers.calories || currentNumbers.calories),
    50,
  );
  const optimalWaterMl = recommendedNumbers.waterMl || currentNumbers.waterMl;
  const optimalSteps = recommendedNumbers.steps || currentNumbers.steps;
  const stepsKm = (optimalSteps * 0.00075).toFixed(1);
  const stepsBurn = Math.round(optimalSteps * 0.035);
  const selectedPresetMeta =
    PRESET_OPTIONS.find((preset) => preset.id === selectedPreset) ??
    PRESET_OPTIONS[1];
  const statusDotClass = STATUS_DOT_CLASS[saveStatus];

  return (
    <div className="space-y-4 pb-6">
      <Card className="overflow-hidden border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
        <CardContent className="relative space-y-3 p-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.14),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_40%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_40%)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <SparklesIcon className="size-4.5" />
              </div>
              <div className="min-w-0">
                <Badge
                  variant="outline"
                  className="h-6 rounded-full border-border/60 bg-background/60 px-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground"
                >
                  Smart info
                </Badge>
                <p className="mt-2 text-lg font-black tracking-[-0.04em] text-foreground">
                  Siz uchun tavsiya: {formatNumber(recommendedCalories)} kcal
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="h-7 rounded-full border-sky-500/20 bg-sky-500/10 px-3 text-[11px] font-semibold text-sky-600 dark:text-sky-400"
                  >
                    <DropletIcon className="mr-1.5 size-3.5" />
                    {(optimalWaterMl / 1000).toFixed(1)}L suv
                  </Badge>
                  <Badge
                    variant="outline"
                    className="h-7 rounded-full border-emerald-500/20 bg-emerald-500/10 px-3 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"
                  >
                    <FootprintsIcon className="mr-1.5 size-3.5" />
                    {formatNumber(optimalSteps)} qadam
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Maqsadingiz va profilingiz asosida
                </p>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {statusDotClass ? (
                <motion.span
                  key={saveStatus}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={cn(
                    "mt-1 inline-flex size-2.5 shrink-0 rounded-full shadow-sm",
                    statusDotClass,
                  )}
                />
              ) : null}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Quick presets
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedPresetMeta.description}
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {PRESET_OPTIONS.map((preset) => {
            const isActive = preset.id === selectedPreset;

            return (
              <motion.div
                key={preset.id}
                whileTap={{ scale: 0.97 }}
                className="shrink-0"
              >
                <Button
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPresetChange(preset.id)}
                  className={cn(
                    "h-11 rounded-full px-4 shadow-sm",
                    !isActive && "bg-background/75 backdrop-blur-xl",
                  )}
                >
                  <span className="text-base leading-none">{preset.icon}</span>
                  <span className="font-semibold">{preset.label}</span>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </section>

      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
        <CardContent className="space-y-5 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Intensivlik
              </p>
              <h3 className="mt-1 text-lg font-black tracking-[-0.03em] text-foreground">
                Qancha tez o'zgartirmoqchisiz?
              </h3>
            </div>
            <Badge
              variant="outline"
              className="h-7 rounded-full border-border/60 bg-background/60 px-3 text-xs text-muted-foreground"
            >
              {
                INTENSITY_OPTIONS.find((item) => item.id === selectedIntensity)
                  ?.label
              }
            </Badge>
          </div>

          <div className="space-y-3">
            <Slider
              value={[
                Math.max(
                  0,
                  INTENSITY_OPTIONS.findIndex(
                    (item) => item.id === selectedIntensity,
                  ),
                ),
              ]}
              min={0}
              max={INTENSITY_OPTIONS.length - 1}
              step={1}
              onValueChange={(value) => onIntensityChange(value[0] ?? 1)}
              className="[&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:border-background [&_[data-slot=slider-thumb]]:bg-primary [&_[data-slot=slider-track]]:h-2.5 [&_[data-slot=slider-track]]:bg-muted"
            />
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              {INTENSITY_OPTIONS.map((item) => (
                <span
                  key={item.id}
                  className={cn(
                    item.id === selectedIntensity && "text-foreground",
                  )}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Daily targets
          </p>
          <h3 className="mt-1 text-xl font-black tracking-[-0.04em] text-foreground">
            Maqsadlar
          </h3>
        </div>

        <div className="space-y-3">
          <GoalMetricCard
            meta={METRIC_META.calories}
            value={currentNumbers.calories}
            onIncrement={() =>
              onMetricChange(
                "calories",
                METRIC_META.calories.step,
                METRIC_META.calories,
              )
            }
            onDecrement={() =>
              onMetricChange(
                "calories",
                -METRIC_META.calories.step,
                METRIC_META.calories,
              )
            }
            incrementDisabled={
              currentNumbers.calories >= METRIC_META.calories.max
            }
            decrementDisabled={
              currentNumbers.calories <= METRIC_META.calories.min
            }
            primarySubtext={`Siz hozir: ~${formatNumber(initialNumbers.calories)} kcal`}
            secondarySubtext={getCaloriesChangeText(
              initialNumbers.calories,
              currentNumbers.calories,
            )}
          />

          <GoalMetricCard
            meta={METRIC_META.waterMl}
            value={currentNumbers.waterMl}
            onIncrement={() =>
              onMetricChange(
                "waterMl",
                METRIC_META.waterMl.step,
                METRIC_META.waterMl,
              )
            }
            onDecrement={() =>
              onMetricChange(
                "waterMl",
                -METRIC_META.waterMl.step,
                METRIC_META.waterMl,
              )
            }
            incrementDisabled={currentNumbers.waterMl >= METRIC_META.waterMl.max}
            decrementDisabled={currentNumbers.waterMl <= METRIC_META.waterMl.min}
            primarySubtext={`Siz uchun optimal: ${(optimalWaterMl / 1000).toFixed(1)}L`}
            secondarySubtext={`Reminder ${form.waterNotification ? "ON" : "OFF"}`}
            extra={
              <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-2">
                <BellIcon className="size-3.5 text-sky-500" />
                <Switch
                  checked={Boolean(form.waterNotification)}
                  onCheckedChange={onWaterReminderChange}
                  className="data-[state=checked]:bg-sky-500"
                />
              </div>
            }
          />

          <GoalMetricCard
            meta={METRIC_META.steps}
            value={currentNumbers.steps}
            onIncrement={() =>
              onMetricChange("steps", METRIC_META.steps.step, METRIC_META.steps)
            }
            onDecrement={() =>
              onMetricChange(
                "steps",
                -METRIC_META.steps.step,
                METRIC_META.steps,
              )
            }
            incrementDisabled={currentNumbers.steps >= METRIC_META.steps.max}
            decrementDisabled={currentNumbers.steps <= METRIC_META.steps.min}
            primarySubtext={`Siz uchun optimal: ${formatNumber(optimalSteps)} qadam`}
            secondarySubtext={`~${stepsKm} km • ~${formatNumber(stepsBurn)} kcal`}
          />
        </div>
      </section>
    </div>
  );
};

export const HealthTab = ({ embedded = false }) => {
  const { t } = useTranslation();
  const { goals, recommendedGoals, saveGoals, isHydratingGoals } =
    useHealthGoals();
  const initialForm = React.useMemo(() => createInitialForm(goals), [goals]);
  const recommendedNumbers = React.useMemo(
    () => getSavedNumbers(recommendedGoals),
    [recommendedGoals],
  );
  const [form, setForm] = React.useState(initialForm);
  const [saveStatus, setSaveStatus] = React.useState("idle");
  const hasCompletedSaveRef = React.useRef(false);
  const lastSyncedFormRef = React.useRef(initialForm);
  const saveGoalsRef = React.useRef(saveGoals);
  const lastSubmittedFormRef = React.useRef(null);
  const hasHydratedRef = React.useRef(false);
  const latestSaveIdRef = React.useRef(0);
  const inferredPreset = React.useMemo(
    () => inferPresetFromGoals(getSavedNumbers(initialForm)),
    [initialForm],
  );
  const inferredIntensity = React.useMemo(
    () => inferIntensityFromGoals(getSavedNumbers(initialForm), inferredPreset),
    [initialForm, inferredPreset],
  );
  const [selectedPreset, setSelectedPreset] = React.useState(inferredPreset);
  const [selectedIntensity, setSelectedIntensity] =
    React.useState(inferredIntensity);

  React.useEffect(() => {
    saveGoalsRef.current = saveGoals;
  }, [saveGoals]);

  React.useEffect(() => {
    setForm((currentForm) => {
      if (isEqual(currentForm, lastSyncedFormRef.current)) {
        return initialForm;
      }

      return currentForm;
    });
    lastSyncedFormRef.current = initialForm;
  }, [initialForm]);

  React.useEffect(() => {
    setSelectedPreset(inferredPreset);
    setSelectedIntensity(inferredIntensity);
  }, [inferredIntensity, inferredPreset]);

  React.useEffect(() => {
    if (saveStatus !== "saved") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSaveStatus("idle");
    }, 900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [saveStatus]);

  const isDirty = !isEqual(form, initialForm);
  const initialNumbers = React.useMemo(
    () => getSavedNumbers(initialForm),
    [initialForm],
  );
  const currentNumbers = React.useMemo(() => getSavedNumbers(form), [form]);

  const handleMetricChange = React.useCallback((key, delta, { min, max }) => {
    vibrateSoft();
    setForm((current) => {
      const nextValue = clampMetricValue(
        (Number(current[key]) || 0) + delta,
        min,
        max,
      );

      if (nextValue === Number(current[key])) {
        return current;
      }

      return {
        ...current,
        [key]: String(nextValue),
      };
    });
  }, []);

  const applyPreset = React.useCallback(
    (presetId, intensityId) => {
      const nextPresetTargets = buildPresetTargets(
        initialNumbers,
        presetId,
        intensityId,
      );

      vibrateSoft();
      setSelectedPreset(presetId);
      setSelectedIntensity(intensityId);
      setForm((current) => ({
        ...current,
        calories: String(nextPresetTargets.calories),
        waterMl: String(nextPresetTargets.waterMl),
        steps: String(nextPresetTargets.steps),
      }));
    },
    [initialNumbers],
  );

  const handlePresetChange = React.useCallback(
    (presetId) => {
      applyPreset(presetId, selectedIntensity);
    },
    [applyPreset, selectedIntensity],
  );

  const handleIntensityChange = React.useCallback(
    (intensityIndex) => {
      const nextIntensity =
        INTENSITY_OPTIONS[
          clampMetricValue(intensityIndex, 0, INTENSITY_OPTIONS.length - 1)
        ]?.id ?? "medium";

      applyPreset(selectedPreset, nextIntensity);
    },
    [applyPreset, selectedPreset],
  );

  const handleWaterReminderChange = React.useCallback((checked) => {
    vibrateSoft();
    setForm((current) => ({
      ...current,
      waterNotification: checked,
    }));
  }, []);

  const persistGoals = React.useCallback(
    async (nextForm, saveId) => {
      setSaveStatus("saving");

      try {
        await saveGoalsRef.current(toGoalsPayload(nextForm));

        if (latestSaveIdRef.current === saveId) {
          hasCompletedSaveRef.current = true;
          setSaveStatus("saved");
        }
      } catch {
        if (latestSaveIdRef.current === saveId) {
          setSaveStatus("error");
          toast.error(t("profile.health.saveError"));
        }
      }
    },
    [t],
  );

  React.useEffect(() => {
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      return;
    }

    if (!isDirty) {
      lastSubmittedFormRef.current = form;
      if (saveStatus === "error") {
        setSaveStatus("idle");
      }
      return;
    }

    if (isEqual(form, lastSubmittedFormRef.current)) {
      return;
    }

    const saveId = latestSaveIdRef.current + 1;
    const snapshot = { ...form };
    latestSaveIdRef.current = saveId;

    const timeoutId = window.setTimeout(() => {
      lastSubmittedFormRef.current = snapshot;
      void persistGoals(snapshot, saveId);
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [form, isDirty, persistGoals, saveStatus]);

  const content = isHydratingGoals ? (
    <HealthTabSkeleton />
  ) : (
    <HealthTabContent
      form={form}
      initialNumbers={initialNumbers}
      currentNumbers={currentNumbers}
      recommendedNumbers={recommendedNumbers}
      saveStatus={saveStatus}
      selectedIntensity={selectedIntensity}
      selectedPreset={selectedPreset}
      onMetricChange={handleMetricChange}
      onPresetChange={handlePresetChange}
      onIntensityChange={handleIntensityChange}
      onWaterReminderChange={handleWaterReminderChange}
    />
  );

  if (embedded) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex-1 overflow-y-auto px-4">{content}</div>
      </div>
    );
  }

  return content;
};
