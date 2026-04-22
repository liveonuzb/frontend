import React from "react";
import { isEqual } from "lodash";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3Icon,
  BellIcon,
  MinusIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react";
import { useGetQuery } from "@/hooks/api";
import useHealthGoals from "@/hooks/app/use-health-goals";
import useMe from "@/hooks/app/use-me";
import { getApiResponseData } from "@/lib/api-response";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  AUTO_SAVE_DELAY_MS,
  GOAL_THEME,
  INTENSITY_OPTIONS,
  METRIC_META,
  PERIOD_OPTIONS,
  PRESET_OPTIONS,
  STATUS_DOT_CLASS,
  buildActionItems,
  buildProgressMetrics,
  buildRecommendedGoals,
  buildWeightTrendBars,
  clampMetricValue,
  createInitialForm,
  formatChange,
  formatLiters,
  formatMetricValue,
  formatNumber,
  getBodyChangeHighlights,
  getCaloriesChangeText,
  getSavedNumbers,
  getWeightTrendSummary,
  inferIntensityFromGoals,
  toGoalsPayload,
  vibrateSoft,
} from "./health-tab.utils.js";

const CHANGE_META = {
  weight: { label: "Vazn", unit: "kg" },
  chest: { label: "Ko'krak", unit: "cm" },
  waist: { label: "Bel", unit: "cm" },
  hips: { label: "Tos", unit: "cm" },
  arm: { label: "Qo'l", unit: "cm" },
  thigh: { label: "Son", unit: "cm" },
  neck: { label: "Bo'yin", unit: "cm" },
  bodyFat: { label: "Yog'", unit: "%" },
};

const SAVE_STATUS_FALLBACKS = {
  idle: "O'zgarishlar avtomatik saqlanadi.",
  saving: "O'zgarishlar saqlanmoqda...",
  saved: "Barcha o'zgarishlar saqlandi.",
  error: "Oxirgi o'zgarishlarni saqlab bo'lmadi.",
};

const HealthTabSkeleton = () => (
  <div className="space-y-4 pb-6">
    <Card className="overflow-hidden border-border/60 bg-card/80 shadow-sm">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
        <Skeleton className="h-9 w-72 rounded-2xl" />
        <Skeleton className="h-5 w-full max-w-xl rounded-lg" />
        <div className="grid gap-2 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-14 rounded-2xl" />
          ))}
        </div>
      </CardContent>
    </Card>

    <Card className="border-border/60 bg-card/80 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <Skeleton className="h-4 w-24 rounded-full" />
        <div className="flex gap-2">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-11 w-28 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-24 rounded-[24px]" />
      </CardContent>
    </Card>

    <div className="grid gap-3 md:grid-cols-2">
      {[0, 1, 2, 3].map((item) => (
        <Skeleton key={item} className="h-36 rounded-[24px]" />
      ))}
    </div>

    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <Skeleton key={item} className="h-48 rounded-[28px]" />
      ))}
    </div>
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

const SectionHeader = ({ eyebrow, title, description, action }) => (
  <div className="flex items-end justify-between gap-3">
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-xl font-black tracking-[-0.04em] text-foreground">
        {title}
      </h3>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
    {action}
  </div>
);

const HeroStat = ({ label, value, accentClass }) => (
  <div className="rounded-2xl border border-border/60 bg-background/75 px-4 py-3 backdrop-blur">
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
      {label}
    </p>
    <p className={cn("mt-1 text-base font-black", accentClass)}>{value}</p>
  </div>
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

const ActionCard = ({ item }) => {
  const Icon = item.icon;
  const toneClass =
    item.tone === "good"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : item.tone === "needs-more"
        ? "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400"
        : item.tone === "needs-less"
          ? "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400"
          : "border-border/60 bg-background/70 text-muted-foreground";

  return (
    <Card className="overflow-hidden rounded-[24px] border-border/60 bg-card/80 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                item.iconClass,
              )}
            >
              <Icon className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.value}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn("rounded-full px-2.5 py-1 text-[10px] font-semibold", toneClass)}
          >
            {item.statusLabel}
          </Badge>
        </div>

        <Progress value={item.progress} className="h-2 bg-muted/60" />
        <p className="text-sm leading-6 text-muted-foreground">
          {item.description}
        </p>
      </CardContent>
    </Card>
  );
};

const ProgressCard = ({ item }) => {
  const Icon = item.icon;

  return (
    <div className="rounded-[22px] border border-border/60 bg-card/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={cn("size-4", item.iconClass)} />
          <p className="text-sm font-semibold text-foreground">{item.label}</p>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {item.progress}%
        </span>
      </div>

      <p className="mt-3 text-xl font-black tracking-[-0.04em] text-foreground">
        {item.format(item.current)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Target: {item.format(item.target)}
      </p>
      <Progress value={item.progress} className="mt-4 h-2 bg-muted/60" />
      <p className="mt-2 text-xs text-muted-foreground">{item.footnote}</p>
    </div>
  );
};

const applyRecommendedGoalsToForm = (current, presetId, nextGoals) => ({
  ...current,
  goal: presetId,
  calories: String(nextGoals.calories),
  protein: String(nextGoals.protein),
  carbs: String(nextGoals.carbs),
  fat: String(nextGoals.fat),
  fiber: String(nextGoals.fiber),
  waterMl: String(nextGoals.waterMl),
  steps: String(nextGoals.steps),
  sleepHours: String(nextGoals.sleepHours),
  workoutMinutes: String(nextGoals.workoutMinutes),
});

const WeightTrendCard = ({ weightSummary, bars, goalTheme, t }) => {
  if (!weightSummary) {
    return (
      <Card className="rounded-[28px] border-border/60 bg-card/80 shadow-sm">
        <CardContent className="space-y-3 p-5">
          <SectionHeader
            eyebrow={t("profile.health.weightTrendEyebrow", {
              defaultValue: "Weight trend",
            })}
            title={t("profile.health.weightTrendTitle", {
              defaultValue: "Vazn ritmi",
            })}
            description={t("profile.health.weightTrendEmpty", {
              defaultValue: "Vazn entry bo'lmasa trend chiqmaydi.",
            })}
          />
        </CardContent>
      </Card>
    );
  }

  const DirectionIcon = weightSummary.directionIcon;
  const changeTone = weightSummary.isImproving
    ? "text-emerald-500"
    : "text-orange-500";

  return (
    <Card className="rounded-[28px] border-border/60 bg-card/80 shadow-sm">
      <CardContent className="space-y-5 p-5">
        <SectionHeader
          eyebrow={t("profile.health.weightTrendEyebrow", {
            defaultValue: "Weight trend",
          })}
          title={t("profile.health.weightTrendTitle", {
            defaultValue: "Vazn ritmi",
          })}
          description={t("profile.health.weightTrendDescription", {
            defaultValue: "Oxirgi entrylar bo'yicha joriy yo'nalish.",
          })}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <HeroStat
            label={t("profile.health.currentWeight", {
              defaultValue: "Joriy vazn",
            })}
            value={formatMetricValue(weightSummary.current, "kg")}
            accentClass={goalTheme.accentClass}
          />
          <HeroStat
            label={t("profile.health.periodChange", {
              defaultValue: "Davr o'zgarishi",
            })}
            value={weightSummary.summaryText}
            accentClass={changeTone}
          />
          <HeroStat
            label={t("profile.health.trendStatus", {
              defaultValue: "Status",
            })}
            value={
              weightSummary.isImproving
                ? t("profile.health.trendOnTrack", {
                    defaultValue: "Yo'lda",
                  })
                : t("profile.health.trendNeedsAttention", {
                    defaultValue: "E'tibor kerak",
                  })
            }
            accentClass={changeTone}
          />
        </div>

        <div className="rounded-[24px] border border-border/60 bg-background/65 p-4">
          <div className="mb-3 flex items-center gap-2">
            <DirectionIcon className={cn("size-4", changeTone)} />
            <p className="text-sm font-semibold text-foreground">
              {weightSummary.summaryText}
            </p>
          </div>

          {bars.length ? (
            <div className="flex items-end gap-2">
              {bars.map((bar) => (
                <div key={bar.date} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-24 items-end">
                    <motion.div
                      initial={{ height: 0, opacity: 0.6 }}
                      animate={{ height: bar.height, opacity: 1 }}
                      transition={{ duration: 0.35 }}
                      className={cn(
                        "w-full min-w-5 rounded-full",
                        weightSummary.isImproving
                          ? "bg-emerald-500/70"
                          : "bg-orange-500/65",
                      )}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-semibold text-muted-foreground">
                      {bar.date?.slice(5)}
                    </p>
                    <p className="text-[10px] text-foreground">{bar.weight}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("profile.health.weightTrendEmpty", {
                defaultValue: "Vazn entry bo'lmasa trend chiqmaydi.",
              })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const HydrationCard = ({ waterSummary, periodDays, t }) => {
  const completionRate = Number(waterSummary?.completionRate) || 0;
  const averageMl = Number(waterSummary?.averageMl) || 0;
  const daysGoalMet = Number(waterSummary?.daysGoalMet) || 0;
  const daysTracked = Number(waterSummary?.daysTracked) || 0;

  return (
    <Card className="rounded-[28px] border-border/60 bg-card/80 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <SectionHeader
          eyebrow={t("profile.health.hydrationEyebrow", {
            defaultValue: "Hydration",
          })}
          title={t("profile.health.hydrationTitle", {
            defaultValue: "Suv intizomi",
          })}
          description={t("profile.health.hydrationDescription", {
            defaultValue: "Gidratsiya ritmi bu davrda qanday ketayotganini ko'rsatadi.",
          })}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <HeroStat
            label={t("profile.health.averageWater", {
              defaultValue: "O'rtacha suv",
            })}
            value={`${formatLiters(averageMl)}L`}
            accentClass="text-sky-500"
          />
          <HeroStat
            label={t("profile.health.goalMetDays", {
              defaultValue: "Goal met kunlar",
            })}
            value={`${daysGoalMet}/${Math.max(periodDays, daysTracked || periodDays)}`}
            accentClass="text-emerald-500"
          />
        </div>

        <Progress value={completionRate} className="h-2.5 bg-muted/60" />
        <p className="text-sm text-muted-foreground">
          {t("profile.health.hydrationCompletion", {
            defaultValue: "Bajarilish darajasi",
          })}: {completionRate}%
        </p>
      </CardContent>
    </Card>
  );
};

const BodyChangesCard = ({ items, t }) => (
  <Card className="rounded-[28px] border-border/60 bg-card/80 shadow-sm">
    <CardContent className="space-y-4 p-5">
      <SectionHeader
        eyebrow={t("profile.health.bodyChangesEyebrow", {
          defaultValue: "Body changes",
        })}
        title={t("profile.health.bodyChangesTitle", {
          defaultValue: "Tana o'zgarishlari",
        })}
        description={t("profile.health.bodyChangesDescription", {
          defaultValue: "So'nggi o'lcham entrylaridan eng muhim signal.",
        })}
      />

      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => {
            const change = Number(item.metric?.change) || 0;
            const meta = CHANGE_META[item.id] || {
              label: item.id,
              unit: "",
            };

            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-[20px] border border-border/60 bg-background/70 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {meta.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.metric?.last} {meta.unit}
                  </p>
                </div>
                <div
                  className={cn(
                    "text-sm font-semibold",
                    change < 0
                      ? "text-emerald-500"
                      : change > 0
                        ? "text-orange-500"
                        : "text-muted-foreground",
                  )}
                >
                  {formatChange(change, meta.unit)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[20px] border border-dashed border-border/60 bg-background/50 p-4 text-sm text-muted-foreground">
          {t("profile.health.bodyChangesEmpty", {
            defaultValue: "Tana o'lchamlari kiritilgach o'zgarishlar shu yerda chiqadi.",
          })}
        </div>
      )}
    </CardContent>
  </Card>
);

const ProgressEmptyState = ({ goalTheme, t }) => (
  <Card className="rounded-[28px] border-border/60 bg-card/80 shadow-sm">
    <CardContent className="space-y-4 p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BarChart3Icon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-black tracking-[-0.03em] text-foreground">
            {t("profile.health.emptyTitle", {
              defaultValue: "Hali yetarli tracking yo'q",
            })}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("profile.health.emptyDescription", {
              defaultValue:
                "Ovqat, suv, qadam yoki vazn entrylari muntazam kiritilgach shu yerda progress va trendlar chiqadi.",
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-[22px] border border-border/60 bg-background/65 p-4">
          <p className="text-sm font-semibold text-foreground">
            {t("profile.health.emptyStepOne", {
              defaultValue: "1. Kamida 3 kun tracking qiling",
            })}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t("profile.health.emptyStepOneDesc", {
              defaultValue:
                "Kaloriya, suv va qadamlarni bir necha kun ketma-ket kiritsangiz trendlar paydo bo'ladi.",
            })}
          </p>
        </div>
        <div className="rounded-[22px] border border-border/60 bg-background/65 p-4">
          <p className="text-sm font-semibold text-foreground">
            {t("profile.health.emptyStepTwo", {
              defaultValue: "2. Vazn entry qo'shing",
            })}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t("profile.health.emptyStepTwoDesc", {
              defaultValue:
                "Haftada kamida bir marta vazn kiritish hozirgi yo'nalishni ko'rsatadi.",
            })}
          </p>
        </div>
        <div className="rounded-[22px] border border-border/60 bg-background/65 p-4">
          <p className="text-sm font-semibold text-foreground">
            {t("profile.health.emptyStepThree", {
              defaultValue: "3. Shu ritmni saqlang",
            })}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {goalTheme.hint}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const HealthTabContent = ({
  t,
  form,
  currentNumbers,
  initialNumbers,
  recommendedGoals,
  recommendedNumbers,
  selectedPreset,
  selectedIntensity,
  saveStatus,
  saveStatusLabel,
  periodDays,
  onPeriodChange,
  onPresetChange,
  onIntensityChange,
  onMetricChange,
  onWaterReminderChange,
  onApplyRecommended,
  healthReport,
  waterAnalytics,
  measurementsTrends,
  insightsLoading,
  telegramConnected,
}) => {
  const goalTheme = GOAL_THEME[selectedPreset] ?? GOAL_THEME.lose;
  const selectedPresetMeta =
    PRESET_OPTIONS.find((preset) => preset.id === selectedPreset) ??
    PRESET_OPTIONS[0];
  const recommendedMatchesCurrent =
    form.goal === selectedPreset &&
    isEqual(currentNumbers, recommendedNumbers) &&
    Number(form.protein || 0) === Number(recommendedGoals.protein || 0) &&
    Number(form.carbs || 0) === Number(recommendedGoals.carbs || 0) &&
    Number(form.fat || 0) === Number(recommendedGoals.fat || 0) &&
    Number(form.fiber || 0) === Number(recommendedGoals.fiber || 0) &&
    Number(form.sleepHours || 0) === Number(recommendedGoals.sleepHours || 0) &&
    Number(form.workoutMinutes || 0) ===
      Number(recommendedGoals.workoutMinutes || 0);
  const statusDotClass = STATUS_DOT_CLASS[saveStatus];
  const healthSummary = healthReport?.summary ?? {};
  const waterSummary = waterAnalytics?.summary ?? {};
  const hasTrackingData = Array.isArray(healthReport?.daily) && healthReport.daily.length > 0;
  const actionItems = buildActionItems({
    goalPreset: selectedPreset,
    currentNumbers,
    recommendedGoals,
    healthSummary,
    waterSummary,
  });
  const progressMetrics = buildProgressMetrics({
    summary: healthSummary,
    currentNumbers,
    waterSummary,
    recommendedGoals,
  });
  const weightSummary = getWeightTrendSummary(
    healthReport?.weight,
    selectedPreset,
  );
  const weightBars = buildWeightTrendBars(healthReport?.weight?.trend ?? []);
  const bodyChanges = getBodyChangeHighlights(measurementsTrends, selectedPreset);
  const trackedDays = Number(healthSummary?.daysTracked) || 0;
  const caloriesGoalMet = Number(healthSummary?.caloriesGoalMet) || 0;

  return (
    <div className="space-y-4 pb-6">
      <Card className="overflow-hidden border-border/60 bg-card/80 shadow-sm">
        <CardContent className="relative p-5 sm:p-6">
          <div className={cn("pointer-events-none absolute inset-0", goalTheme.gradient)} />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 xl:max-w-2xl">
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.18em]",
                  goalTheme.badgeClass,
                )}
              >
                {goalTheme.badge}
              </Badge>
              <h2 className="mt-4 text-2xl font-black tracking-[-0.05em] text-foreground sm:text-[2rem]">
                {goalTheme.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                {goalTheme.subtitle}
              </p>
              <p className={cn("mt-3 text-sm font-medium", goalTheme.mutedAccentClass)}>
                {goalTheme.hint}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <HeroStat
                  label={t("profile.health.targetCalories", {
                    defaultValue: "Target kaloriya",
                  })}
                  value={formatMetricValue(currentNumbers.calories, "kcal")}
                  accentClass={goalTheme.accentClass}
                />
                <HeroStat
                  label={t("profile.health.trackedDays", {
                    defaultValue: "Kuzatilgan kunlar",
                  })}
                  value={`${trackedDays}/${periodDays}`}
                  accentClass="text-primary"
                />
                <HeroStat
                  label={t("profile.health.goalMet", {
                    defaultValue: "Kaloriya goal met",
                  })}
                  value={`${caloriesGoalMet} kun`}
                  accentClass="text-emerald-500"
                />
              </div>
            </div>

            <div className="grid gap-3 xl:w-[320px] xl:min-w-[320px]">
              <div className="rounded-[24px] border border-border/60 bg-background/75 p-4 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      {t("profile.health.recommendedPlan", {
                        defaultValue: "Tavsiya plan",
                      })}
                    </p>
                    <p className="mt-2 text-xl font-black tracking-[-0.04em] text-foreground">
                      {formatMetricValue(recommendedNumbers.calories, "kcal")}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatMetricValue(recommendedGoals.protein, "g")} oqsil
                    </p>
                  </div>
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <SparklesIcon className="size-4.5" />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-full bg-background/80">
                    {formatMetricValue(recommendedGoals.carbs, "g")} carbs
                  </Badge>
                  <Badge variant="outline" className="rounded-full bg-background/80">
                    {formatMetricValue(recommendedGoals.fat, "g")} fat
                  </Badge>
                  <Badge variant="outline" className="rounded-full bg-background/80">
                    {formatMetricValue(recommendedGoals.fiber, "g")} fiber
                  </Badge>
                </div>

                <Button
                  type="button"
                  className="mt-4 w-full rounded-2xl"
                  onClick={onApplyRecommended}
                  disabled={recommendedMatchesCurrent}
                >
                  {t("profile.health.applyRecommended", {
                    defaultValue: "Tavsiya planini qo'llash",
                  })}
                </Button>
              </div>

              <div className="rounded-[24px] border border-border/60 bg-background/75 p-4 backdrop-blur">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {t("profile.health.autoSaveLabel", {
                      defaultValue: "Autosave",
                    })}
                  </p>
                  <AnimatePresence initial={false}>
                    {statusDotClass ? (
                      <motion.span
                        key={saveStatus}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={cn(
                          "inline-flex size-2.5 shrink-0 rounded-full shadow-sm",
                          statusDotClass,
                        )}
                      />
                    ) : null}
                  </AnimatePresence>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{saveStatusLabel}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80 shadow-sm">
        <CardContent className="space-y-5 p-5">
          <SectionHeader
            eyebrow={t("profile.health.strategyEyebrow", {
              defaultValue: "Strategy composer",
            })}
            title={t("profile.health.strategyTitle", {
              defaultValue: "Bugungi plan kompozitori",
            })}
            description={selectedPresetMeta.description}
          />

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

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="rounded-[24px] border border-border/60 bg-background/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {t("profile.health.intensityLabel", {
                      defaultValue: "Intensivlik",
                    })}
                  </p>
                  <h4 className="mt-1 text-lg font-black tracking-[-0.03em] text-foreground">
                    {t("profile.health.intensityTitle", {
                      defaultValue: "Qancha tez o'zgartirmoqchisiz?",
                    })}
                  </h4>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full bg-background/80 px-3 text-xs text-muted-foreground"
                >
                  {
                    INTENSITY_OPTIONS.find((item) => item.id === selectedIntensity)
                      ?.label
                  }
                </Badge>
              </div>

              <div className="mt-5 space-y-3">
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
            </div>

            <div className="rounded-[24px] border border-border/60 bg-background/70 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {t("profile.health.macroSummary", {
                  defaultValue: "Macro summary",
                })}
              </p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    {t("profile.health.proteinLabel", {
                      defaultValue: "Oqsil",
                    })}
                  </p>
                  <p className="mt-1 text-lg font-black">
                    {formatMetricValue(recommendedGoals.protein, "g")}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3">
                    <p className="text-xs text-muted-foreground">Carbs</p>
                    <p className="mt-1 text-base font-black">
                      {formatMetricValue(recommendedGoals.carbs, "g")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3">
                    <p className="text-xs text-muted-foreground">Fat</p>
                    <p className="mt-1 text-base font-black">
                      {formatMetricValue(recommendedGoals.fat, "g")}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Fiber</p>
                  <p className="mt-1 text-base font-black">
                    {formatMetricValue(recommendedGoals.fiber, "g")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <SectionHeader
          eyebrow={t("profile.health.actionsEyebrow", {
            defaultValue: "Daily action stack",
          })}
          title={t("profile.health.actionsTitle", {
            defaultValue: "Bugungi fokuslar",
          })}
          description={t("profile.health.actionsDescription", {
            defaultValue:
              "Hozirgi tracking va targetlar asosida aynan nimaga ko'proq e'tibor kerakligini ko'rsatadi.",
          })}
        />

        <div className="grid gap-3 md:grid-cols-2">
          {actionItems.map((item) => (
            <ActionCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader
          eyebrow={t("profile.health.targetsEyebrow", {
            defaultValue: "Daily targets",
          })}
          title={t("profile.health.targetsTitle", {
            defaultValue: "Kunlik targetlar",
          })}
          description={t("profile.health.targetsDescription", {
            defaultValue: "Kaloriya, suv va qadam maqsadlarini shu yerdan boshqaring.",
          })}
        />

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
            primarySubtext={t("profile.health.currentCaloriesHint", {
              defaultValue: `Saqlangan target: ~${formatNumber(initialNumbers.calories)} kcal`,
            })}
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
            primarySubtext={t("profile.health.waterHint", {
              defaultValue: `Siz uchun optimal: ${formatLiters(recommendedNumbers.waterMl)}L`,
            })}
            secondarySubtext={t("profile.health.waterReminderHint", {
              defaultValue: form.waterNotification
                ? telegramConnected
                  ? "Reminder ON"
                  : "Reminder ON · Telegram ulanmagan"
                : "Reminder OFF",
            })}
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
            primarySubtext={t("profile.health.stepsHint", {
              defaultValue: `Siz uchun optimal: ${formatNumber(recommendedNumbers.steps)} qadam`,
            })}
            secondarySubtext={t("profile.health.stepsDistanceHint", {
              defaultValue: `~${(currentNumbers.steps * 0.00075).toFixed(1)} km • ~${formatNumber(Math.round(currentNumbers.steps * 0.035))} kcal`,
            })}
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader
          eyebrow={t("profile.health.progressEyebrow", {
            defaultValue: "Progress dashboard",
          })}
          title={t("profile.health.progressTitle", {
            defaultValue: "Jarayon va trendlar",
          })}
          description={t("profile.health.progressDescription", {
            defaultValue:
              "Nutrition, hydration, activity va weight signalini bitta joyda ko'rsatadi.",
          })}
          action={
            <div className="flex items-center gap-1.5">
              {PERIOD_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={periodDays === option.value ? "default" : "outline"}
                  size="sm"
                  className="rounded-full px-3"
                  onClick={() => onPeriodChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          }
        />

        {insightsLoading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {[0, 1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-36 rounded-[22px]" />
            ))}
          </div>
        ) : hasTrackingData ? (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {progressMetrics.map((item) => (
                <ProgressCard key={item.id} item={item} />
              ))}
            </div>

            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
              <WeightTrendCard
                weightSummary={weightSummary}
                bars={weightBars}
                goalTheme={goalTheme}
                t={t}
              />

              <div className="space-y-3">
                <HydrationCard
                  waterSummary={waterAnalytics?.summary}
                  periodDays={periodDays}
                  t={t}
                />
                <BodyChangesCard items={bodyChanges} t={t} />
              </div>
            </div>
          </>
        ) : (
          <ProgressEmptyState goalTheme={goalTheme} t={t} />
        )}
      </section>
    </div>
  );
};

export const HealthTab = ({ embedded = false }) => {
  const { t } = useTranslation();
  const { user, onboarding } = useMe();
  const {
    goals,
    saveGoals,
    isHydratingGoals,
  } = useHealthGoals();

  const [periodDays, setPeriodDays] = React.useState(14);
  const initialForm = React.useMemo(() => createInitialForm(goals), [goals]);
  const initialNumbers = React.useMemo(
    () => getSavedNumbers(initialForm),
    [initialForm],
  );
  const resolvedGoalPreset = goals.goal ?? "maintain";
  const inferredIntensity = React.useMemo(
    () => inferIntensityFromGoals(initialNumbers, resolvedGoalPreset),
    [initialNumbers, resolvedGoalPreset],
  );

  const [form, setForm] = React.useState(initialForm);
  const [saveStatus, setSaveStatus] = React.useState("idle");
  const [selectedPreset, setSelectedPreset] = React.useState(resolvedGoalPreset);
  const [selectedIntensity, setSelectedIntensity] =
    React.useState(inferredIntensity);
  const lastSyncedFormRef = React.useRef(initialForm);
  const saveGoalsRef = React.useRef(saveGoals);
  const lastSubmittedFormRef = React.useRef(null);
  const hasHydratedRef = React.useRef(false);
  const latestSaveIdRef = React.useRef(0);
  const recommendationProfile = React.useMemo(
    () => ({
      gender: onboarding?.gender,
      age: onboarding?.age,
      heightValue: onboarding?.height?.value,
      currentWeightValue: onboarding?.currentWeight?.value,
      activityLevel: onboarding?.activityLevel,
    }),
    [onboarding],
  );
  const recommendedGoals = React.useMemo(
    () =>
      buildRecommendedGoals({
        baseGoals: goals,
        recommendationProfile,
        presetId: selectedPreset,
        intensityId: selectedIntensity,
      }),
    [goals, recommendationProfile, selectedIntensity, selectedPreset],
  );
  const recommendedNumbers = React.useMemo(
    () => getSavedNumbers(recommendedGoals),
    [recommendedGoals],
  );

  const { data: healthReportData, isLoading: isHealthReportLoading } =
    useGetQuery({
      url: "/daily-tracking/reports/health",
      params: { days: periodDays },
      queryProps: {
        queryKey: ["daily-tracking", "health-report", "profile", periodDays],
      },
    });
  const { data: waterAnalyticsData, isLoading: isWaterAnalyticsLoading } =
    useGetQuery({
      url: "/daily-tracking/water/analytics",
      params: { days: periodDays },
      queryProps: {
        queryKey: ["water", "analytics", "profile", periodDays],
      },
    });
  const { data: measurementsTrendsData, isLoading: isMeasurementsLoading } =
    useGetQuery({
      url: "/measurements/trends",
      params: { days: Math.max(periodDays, 30) },
      queryProps: {
        queryKey: ["measurements", "trends", "profile", periodDays],
      },
    });

  const healthReport = React.useMemo(
    () => getApiResponseData(healthReportData, {}),
    [healthReportData],
  );
  const waterAnalytics = React.useMemo(
    () => getApiResponseData(waterAnalyticsData, {}),
    [waterAnalyticsData],
  );
  const measurementsTrends = React.useMemo(
    () => getApiResponseData(measurementsTrendsData, {}),
    [measurementsTrendsData],
  );

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
    setSelectedPreset(resolvedGoalPreset);
    setSelectedIntensity(inferredIntensity);
  }, [inferredIntensity, resolvedGoalPreset]);

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
      const nextTargets = buildRecommendedGoals({
        baseGoals: goals,
        recommendationProfile,
        presetId,
        intensityId,
      });

      vibrateSoft();
      setSelectedPreset(presetId);
      setSelectedIntensity(intensityId);
      setForm((current) =>
        applyRecommendedGoalsToForm(current, presetId, nextTargets),
      );
    },
    [goals, recommendationProfile],
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

  const handleApplyRecommended = React.useCallback(() => {
    vibrateSoft();
    setForm((current) =>
      applyRecommendedGoalsToForm(current, selectedPreset, recommendedGoals),
    );
  }, [recommendedGoals, selectedPreset]);

  const persistGoals = React.useCallback(
    async (nextForm, saveId) => {
      setSaveStatus("saving");

      try {
        await saveGoalsRef.current(toGoalsPayload(nextForm));

        if (latestSaveIdRef.current === saveId) {
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

  const saveStatusLabel = t(`profile.health.autoSave.${saveStatus}`, {
    defaultValue: SAVE_STATUS_FALLBACKS[saveStatus] ?? SAVE_STATUS_FALLBACKS.idle,
  });

  const content = isHydratingGoals ? (
    <HealthTabSkeleton />
  ) : (
    <HealthTabContent
      t={t}
      form={form}
      currentNumbers={currentNumbers}
      initialNumbers={initialNumbers}
      recommendedGoals={recommendedGoals}
      recommendedNumbers={recommendedNumbers}
      selectedPreset={selectedPreset}
      selectedIntensity={selectedIntensity}
      saveStatus={saveStatus}
      saveStatusLabel={saveStatusLabel}
      periodDays={periodDays}
      onPeriodChange={setPeriodDays}
      onPresetChange={handlePresetChange}
      onIntensityChange={handleIntensityChange}
      onMetricChange={handleMetricChange}
      onWaterReminderChange={handleWaterReminderChange}
      onApplyRecommended={handleApplyRecommended}
      healthReport={healthReport}
      waterAnalytics={waterAnalytics}
      measurementsTrends={measurementsTrends}
      insightsLoading={
        isHealthReportLoading || isWaterAnalyticsLoading || isMeasurementsLoading
      }
      telegramConnected={Boolean(user?.telegramConnected)}
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

export default HealthTab;
