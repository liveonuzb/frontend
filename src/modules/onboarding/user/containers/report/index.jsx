import React from "react";
import { get, map } from "lodash";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ActivityIcon,
  ArrowRightIcon,
  BadgeCheckIcon,
  BotIcon,
  BrainCircuitIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  DnaIcon,
  DropletsIcon,
  DumbbellIcon,
  FileTextIcon,
  FlameIcon,
  FolderOpenIcon,
  GaugeIcon,
  HeartPulseIcon,
  Loader2Icon,
  MonitorIcon,
  MoonIcon,
  RefreshCcwIcon,
  SaladIcon,
  ScanLineIcon,
  SparklesIcon,
  TargetIcon,
  TrendingUpIcon,
  TriangleAlertIcon,
  UtensilsIcon,
  WatchIcon,
  ZapIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useGetQuery, usePostQuery } from "@/hooks/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PageTransition from "@/components/page-transition";
import { cn } from "@/lib/utils";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import PageAura from "../../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";
import { useAuthStore } from "@/store";

const LATEST_REPORT_QUERY_KEY = (language) => [
  "onboarding-report",
  "latest",
  language || "uz",
];
const unwrapPayload = (response) => response?.data?.data ?? null;

const getReportTone = (goal) => {
  if (goal === "lose") return ONBOARDING_ACCENTS.rose;
  if (goal === "gain") return ONBOARDING_ACCENTS.blue;
  return ONBOARDING_ACCENTS.green;
};

const getLanguageLabel = (language, t) => {
  if (language === "ru") {
    return t("onboarding.report.languages.ru");
  }

  if (language === "en") {
    return t("onboarding.report.languages.en");
  }

  return t("onboarding.report.languages.uz");
};

const REPORT_LOADING_SCENES = [
  {
    key: "collecting",
    imageSrc: "/onboarding/report-1.png",
    imageClassName: "object-[50%_35%]",
    glowClassName: "from-cyan-400/24 via-emerald-300/12 to-transparent",
    orbitClassName: "border-cyan-300/35",
    primaryIcon: WatchIcon,
    signals: [
      { key: "watch", Icon: WatchIcon, className: "left-[8%] top-[18%]" },
      {
        key: "heart",
        Icon: HeartPulseIcon,
        className: "right-[10%] top-[15%]",
      },
      { key: "sleep", Icon: MoonIcon, className: "left-[15%] bottom-[23%]" },
      {
        key: "nutrition",
        Icon: UtensilsIcon,
        className: "right-[13%] bottom-[27%]",
      },
      {
        key: "dashboard",
        Icon: MonitorIcon,
        className: "left-1/2 top-[5%] -translate-x-1/2",
      },
    ],
  },
  {
    key: "analyzing",
    imageSrc: "/onboarding/report-2.png",
    imageClassName: "object-[50%_38%]",
    glowClassName: "from-indigo-400/22 via-sky-300/12 to-transparent",
    orbitClassName: "border-indigo-300/35",
    primaryIcon: BrainCircuitIcon,
    signals: [
      {
        key: "brain",
        Icon: BrainCircuitIcon,
        className: "left-1/2 top-[7%] -translate-x-1/2",
      },
      { key: "charts", Icon: ActivityIcon, className: "left-[8%] top-[22%]" },
      { key: "dna", Icon: DnaIcon, className: "right-[9%] top-[22%]" },
      {
        key: "graphs",
        Icon: MonitorIcon,
        className: "left-[12%] bottom-[24%]",
      },
      {
        key: "scan",
        Icon: ScanLineIcon,
        className: "right-[13%] bottom-[22%]",
      },
    ],
  },
  {
    key: "planning",
    imageSrc: "/onboarding/report-3.png",
    imageClassName: "object-[50%_42%]",
    glowClassName: "from-amber-300/24 via-lime-300/12 to-transparent",
    orbitClassName: "border-amber-300/40",
    primaryIcon: ClipboardListIcon,
    signals: [
      { key: "workout", Icon: DumbbellIcon, className: "left-[9%] top-[19%]" },
      { key: "food", Icon: SaladIcon, className: "right-[10%] top-[18%]" },
      {
        key: "sleepPlan",
        Icon: MoonIcon,
        className: "left-[13%] bottom-[24%]",
      },
      {
        key: "calendar",
        Icon: CalendarDaysIcon,
        className: "right-[14%] bottom-[25%]",
      },
      {
        key: "plan",
        Icon: ClipboardListIcon,
        className: "left-1/2 top-[7%] -translate-x-1/2",
      },
    ],
  },
  {
    key: "finalizing",
    imageSrc: "/onboarding/report-4.png",
    imageClassName: "object-[50%_44%]",
    glowClassName: "from-yellow-300/28 via-orange-300/16 to-transparent",
    orbitClassName: "border-yellow-300/45",
    primaryIcon: FileTextIcon,
    signals: [
      { key: "report", Icon: FileTextIcon, className: "left-[9%] top-[20%]" },
      {
        key: "reportFile",
        Icon: FileTextIcon,
        className: "right-[10%] top-[19%]",
      },
      {
        key: "approved",
        Icon: BadgeCheckIcon,
        className: "left-1/2 top-[7%] -translate-x-1/2",
      },
      {
        key: "folder",
        Icon: FolderOpenIcon,
        className: "left-[13%] bottom-[23%]",
      },
      {
        key: "final",
        Icon: SparklesIcon,
        className: "right-[14%] bottom-[25%]",
      },
    ],
  },
];

const formatDateTime = (value, locale) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const ReportLoadingState = ({ slides, activeStage, onSelectStage, t }) => {
  const activeSlide = slides[activeStage] ?? slides[0];

  return (
    <div className="relative flex h-full min-h-0 flex-1 items-center justify-center overflow-hidden px-3 py-3 md:px-6 md:py-5">
      <div className="relative z-10 grid h-full min-h-0 w-full max-w-6xl grid-rows-[minmax(0,1fr)_auto] gap-3 lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-1">
        <div className="relative min-h-0 overflow-hidden rounded-[28px] border border-border/60 bg-background/80 shadow-[0_28px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl md:rounded-[36px]">
          <motion.div
            className="flex h-full"
            animate={{ x: `-${activeStage * 100}%` }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          >
            {map(slides, (slide) => {
              const SceneIcon = slide.primaryIcon;

              return (
                <div
                  key={slide.key}
                  className="relative h-full min-w-full overflow-hidden px-4 py-4 sm:px-6 md:px-8 md:py-5"
                >
                  <div
                    className={cn(
                      "absolute inset-x-10 top-8 h-52 rounded-full bg-gradient-to-br blur-3xl",
                      slide.glowClassName,
                    )}
                  />

                  <div className="relative grid h-full min-h-0 gap-3 lg:grid-cols-[minmax(0,0.86fr)_minmax(320px,1.14fr)] lg:items-center">
                    <div className="relative z-10 flex min-h-0 flex-col justify-between gap-3">
                      <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/70 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground backdrop-blur md:px-3 md:py-1.5 md:text-xs">
                          <Loader2Icon className="size-3.5 animate-spin text-primary" />
                          {t("onboarding.report.generatingEyebrow")}
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase text-primary">
                            {slide.step}
                          </p>
                          <h1 className="max-w-lg text-2xl font-semibold leading-[1.05] tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
                            {slide.title}
                          </h1>
                          <p className="line-clamp-2 max-w-xl text-xs leading-5 text-muted-foreground md:text-sm md:leading-6">
                            {slide.description}
                          </p>
                        </div>
                      </div>

                      <div className="hidden gap-2 sm:grid sm:grid-cols-2">
                        {map(slide.items, (item) => (
                          <div
                            key={`${slide.key}-${item}`}
                            className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/70 px-3 py-2 text-xs font-medium text-foreground/85 backdrop-blur md:text-sm"
                          >
                            <SparklesIcon className="size-3.5 text-primary" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="relative flex min-h-0 items-center justify-center">
                      <motion.div
                        className={cn(
                          "absolute size-[230px] rounded-full border sm:size-[300px] md:size-[380px] lg:size-[430px]",
                          slide.orbitClassName,
                        )}
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 16,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }}
                      />
                      <motion.div
                        className="absolute size-[190px] rounded-full border border-dashed border-primary/20 sm:size-[250px] md:size-[320px] lg:size-[350px]"
                        animate={{ rotate: -360 }}
                        transition={{
                          duration: 22,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }}
                      />

                      <motion.img
                        src={slide.imageSrc}
                        alt=""
                        className={cn(
                          "relative z-10 h-[230px] w-[180px] object-contain drop-shadow-[0_24px_45px_rgba(15,23,42,0.16)] sm:h-[290px] sm:w-[230px] md:h-[390px] md:w-[310px] lg:h-[460px] lg:w-[360px]",
                          slide.imageClassName,
                        )}
                        onError={(event) => {
                          event.currentTarget.src = "/onboarding/report-1.png";
                        }}
                        animate={{ y: [0, -10, 0], scale: [1, 1.015, 1] }}
                        transition={{
                          duration: 4,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }}
                      />

                      <motion.div
                        className="absolute left-1/2 top-1/2 z-20 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary/20 bg-background/80 text-primary shadow-lg backdrop-blur-xl md:size-[4.5rem] lg:size-20"
                        animate={{
                          boxShadow: [
                            "0 18px 45px rgba(15,23,42,0.10)",
                            "0 18px 70px rgba(199,118,7,0.26)",
                            "0 18px 45px rgba(15,23,42,0.10)",
                          ],
                        }}
                        transition={{
                          duration: 2.4,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }}
                      >
                        <SceneIcon className="size-6 md:size-7 lg:size-8" />
                      </motion.div>

                      {map(slide.signals, ({ key, Icon, className }, index) => (
                        <motion.div
                          key={`${slide.key}-${key}`}
                          className={cn(
                            "absolute z-30 flex size-12 items-center justify-center rounded-2xl border border-border/60 bg-background/85 text-primary shadow-[0_14px_30px_rgba(15,23,42,0.10)] backdrop-blur-xl md:size-14",
                            className,
                          )}
                          initial={{ opacity: 0, scale: 0.7, y: 10 }}
                          animate={{
                            opacity: 1,
                            scale: [1, 1.08, 1],
                            y: [0, -8, 0],
                          }}
                          transition={{
                            delay: index * 0.12,
                            duration: 2.6,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                          }}
                        >
                          <Icon className="size-4 md:size-5 lg:size-6" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>

        <div className="relative overflow-hidden rounded-[24px] border border-border/60 bg-background/75 p-3 backdrop-blur-xl lg:rounded-[32px] lg:p-5">
          <div className="hidden space-y-2 lg:block">
            <p className="text-xs font-semibold uppercase text-primary">
              {t("onboarding.report.generatingTitle")}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("onboarding.report.generatingDescription")}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 lg:mt-5 lg:block lg:space-y-3">
            {map(slides, (slide, index) => {
              const active = index === activeStage;
              const StepIcon = slide.primaryIcon;

              return (
                <button
                  key={`timeline-${slide.key}`}
                  type="button"
                  className={cn(
                    "group grid w-full justify-items-center gap-1 rounded-xl border px-2 py-2 text-center transition-colors lg:grid-cols-[36px_minmax(0,1fr)] lg:justify-items-stretch lg:gap-3 lg:rounded-2xl lg:px-3 lg:py-3 lg:text-left",
                    active
                      ? "border-primary/25 bg-primary/[0.08]"
                      : "border-border/60 bg-background/55 hover:border-primary/20",
                  )}
                  onClick={() => onSelectStage(index)}
                >
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-xl border lg:size-9",
                      active
                        ? "border-primary/20 bg-primary/12 text-primary"
                        : "border-border/70 bg-background text-muted-foreground",
                    )}
                  >
                    <StepIcon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[9px] font-semibold uppercase text-muted-foreground lg:text-[11px]">
                      {slide.step}
                    </span>
                    <span className="mt-0.5 hidden truncate text-sm font-semibold lg:block">
                      {slide.title}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex gap-2 lg:mt-5">
            {map(slides, (slide, index) => (
              <button
                key={`dot-${slide.key}`}
                type="button"
                className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
                onClick={() => onSelectStage(index)}
                aria-label={slide.title}
              >
                <motion.span
                  className="block h-full rounded-full bg-primary"
                  initial={false}
                  animate={{ width: index === activeStage ? "100%" : "0%" }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                />
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`active-${activeSlide.key}`}
              className="mt-3 hidden rounded-2xl border border-primary/15 bg-primary/[0.06] px-4 py-4 lg:block"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <BotIcon className="size-4 text-primary" />
                {activeSlide.title}
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {activeSlide.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const ReportErrorState = ({ title, description, onRetry, onDashboard, t }) => {
  return (
    <div className="flex flex-1 items-center justify-center px-5 py-8 md:px-8">
      <Card className="w-full max-w-2xl border-destructive/20 bg-gradient-to-br from-destructive/[0.08] via-card to-card py-0 shadow-none">
        <CardContent className="flex flex-col items-center gap-6 px-6 py-10 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <TriangleAlertIcon className="size-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm leading-6 text-muted-foreground md:text-base">
              {description}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Button type="button" size="lg" onClick={onRetry}>
              <RefreshCcwIcon className="size-4" />
              {t("onboarding.report.retry")}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={onDashboard}
            >
              <ArrowRightIcon className="size-4" />
              {t("onboarding.report.goDashboard")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ReportContent = ({
  report,
  onStartPlan,
  t,
  locale,
}) => {
  const snapshot = get(report, "inputSnapshot", {});
  const targets = get(snapshot, "targets", {});
  const analytics = get(snapshot, "analytics", {});
  const daysTracked = Number(get(analytics, "daysTracked", 0)) || 0;
  const confidenceScore = Math.min(96, 72 + Math.min(daysTracked, 8) * 3);
  const bmiValue = get(report, "report.bodySummary.bmiValue") || "—";
  const bmiLabel = get(report, "report.bodySummary.bmiLabel") || "—";
  const calories = Number(get(targets, "calories", 0)) || 0;
  const protein = Number(get(targets, "protein", 0)) || 0;
  const waterMl = Number(get(targets, "waterMl", 0)) || 0;
  const sleepHours = Number(get(targets, "sleepHours", 0)) || 0;
  const weightStatus =
    get(report, "report.bodySummary.weightStatus") ||
    get(report, "report.hero.highlight") ||
    "—";
  const heroSummary =
    get(report, "report.hero.summary") ||
    t("onboarding.report.heroSubtitle", {
      defaultValue: "Built for your goals, body and habits",
    });
  const generatedAt = formatDateTime(get(report, "createdAt"), locale);

  const trackerItems = [
    t("onboarding.report.progressTracker.overview", { defaultValue: "Overview" }),
    t("onboarding.report.progressTracker.targets", { defaultValue: "Targets" }),
    t("onboarding.report.progressTracker.nutrition", { defaultValue: "Nutrition" }),
    t("onboarding.report.progressTracker.workout", { defaultValue: "Workout" }),
    t("onboarding.report.progressTracker.actionPlan", {
      defaultValue: "Action Plan",
    }),
  ];

  const scoreCards = [
    {
      label: t("onboarding.report.scoreCards.bmi", { defaultValue: "BMI Score" }),
      value: bmiValue,
      detail: bmiLabel,
      Icon: GaugeIcon,
    },
    {
      label: t("onboarding.report.scoreCards.metabolism", {
        defaultValue: "Metabolism",
      }),
      value: calories ? calories.toLocaleString() : "—",
      detail: t("onboarding.report.kcalPerDay", { defaultValue: "kcal/day" }),
      Icon: FlameIcon,
    },
    {
      label: t("onboarding.report.scoreCards.energy", {
        defaultValue: "Energy Level",
      }),
      value:
        daysTracked > 0
          ? t("onboarding.report.energyActive", { defaultValue: "Active" })
          : t("onboarding.report.energyBaseline", { defaultValue: "Baseline" }),
      detail: `${daysTracked} ${t("onboarding.report.daysTracked", {
        defaultValue: "tracked days",
      })}`,
      Icon: ZapIcon,
    },
    {
      label: t("onboarding.report.scoreCards.weightOutlook", {
        defaultValue: "Weight Outlook",
      }),
      value: get(report, "report.hero.highlight") || "—",
      detail: weightStatus,
      Icon: TrendingUpIcon,
    },
  ];

  const statHighlights = scoreCards.map(({ label, value, detail }) => ({
    label,
    value,
    detail,
  }));

  const targetCards = [
    {
      label: t("onboarding.report.targets.calories", { defaultValue: "Calories" }),
      value: calories ? calories.toLocaleString() : "—",
      unit: "kcal",
      Icon: FlameIcon,
    },
    {
      label: t("onboarding.report.targets.protein", { defaultValue: "Protein" }),
      value: protein || "—",
      unit: "g",
      Icon: SaladIcon,
    },
    {
      label: t("onboarding.report.targets.water", { defaultValue: "Water" }),
      value: waterMl ? Math.round(waterMl / 100) / 10 : "—",
      unit: waterMl ? "L" : "",
      Icon: DropletsIcon,
    },
    {
      label: t("onboarding.report.targets.sleep", { defaultValue: "Sleep" }),
      value: sleepHours || "—",
      unit: "h",
      Icon: MoonIcon,
    },
  ];

  const sectionCards = [
    {
      key: "nutrition",
      title: t("onboarding.report.sections.nutrition", {
        defaultValue: "Nutrition",
      }),
      image: "/onboarding/report-1.png",
      Icon: SaladIcon,
      section: get(report, "report.nutritionGuidance"),
    },
    {
      key: "water",
      title: t("onboarding.report.sections.water", { defaultValue: "Water" }),
      image: "/onboarding/report-2.png",
      Icon: DropletsIcon,
      section: get(report, "report.hydrationGuidance"),
    },
    {
      key: "workout",
      title: t("onboarding.report.sections.workout", {
        defaultValue: "Workout",
      }),
      image: "/onboarding/report-3.png",
      Icon: DumbbellIcon,
      section: get(report, "report.movementGuidance"),
    },
    {
      key: "sleep",
      title: t("onboarding.report.sections.sleep", { defaultValue: "Sleep" }),
      image: "/onboarding/report-4.png",
      Icon: MoonIcon,
      section: {
        summary: t("onboarding.report.sleepSummary", {
          defaultValue: "Sleep anchors recovery, appetite, and training consistency.",
        }),
        bullets: get(report, "report.cautionPoints.bullets", []),
      },
    },
    {
      key: "progress",
      title: t("onboarding.report.sections.progress", {
        defaultValue: "Progress",
      }),
      image: "/onboarding/report-1.png",
      Icon: TrendingUpIcon,
      section: get(report, "report.goalInterpretation"),
    },
  ];

  const whyItems = [
    get(report, "report.bodySummary.bmiLabel"),
    get(report, "report.hydrationGuidance.bullets.0"),
    daysTracked > 0
      ? t("onboarding.report.trackingAvailable", {
          defaultValue: "Real tracking data is available",
        })
      : t("onboarding.report.needTracking", {
          defaultValue: "Need more tracking data",
        }),
  ].filter(Boolean);
  const actionItems = get(report, "report.actionPlan.items", []).slice(0, 7);

  return (
    <div className="relative flex min-h-0 flex-1 overflow-y-auto bg-[#F8FAF7] px-3 py-3 pb-24 sm:px-4 sm:py-5 sm:pb-28 md:px-8 md:py-8 md:pb-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-10 size-72 rounded-full bg-[#E68A00]/10 blur-3xl" />
        <div className="absolute right-0 top-1/4 size-80 rounded-full bg-emerald-200/30 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl space-y-4 md:space-y-6">
        <motion.div
          className="hidden items-center gap-2 overflow-x-auto pb-1 sm:flex"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {trackerItems.map((item, index) => (
            <React.Fragment key={item}>
              <div className="flex shrink-0 items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-[#111827] shadow-sm ring-1 ring-[#E68A00]/12">
                <span className="flex size-6 items-center justify-center rounded-full bg-[#E68A00] text-[11px] text-white">
                  {index + 1}
                </span>
                {item}
              </div>
              {index < trackerItems.length - 1 ? (
                <div className="h-px w-8 shrink-0 bg-[#E68A00]/25" />
              ) : null}
            </React.Fragment>
          ))}
        </motion.div>

        <motion.section
          className="grid overflow-hidden rounded-[26px] bg-white shadow-[0_30px_100px_rgba(15,23,42,0.10)] ring-1 ring-[#E68A00]/12 md:rounded-[34px] lg:grid-cols-[minmax(0,1.08fr)_410px]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="space-y-4 p-4 sm:space-y-5 sm:p-6 md:space-y-7 md:p-9">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-[#E68A00] text-white hover:bg-[#E68A00]">
                <SparklesIcon className="size-3" />
                {t("onboarding.report.readyBadge")}
              </Badge>
              <Badge variant="outline" className="border-[#E68A00]/20 bg-[#F8FAF7]">
                {t("onboarding.report.oneTimeBadge", {
                  defaultValue: "One-time onboarding result",
                })}
              </Badge>
              <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                {getLanguageLabel(get(report, "language"), t)}
              </Badge>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-[28px] font-black leading-[0.98] tracking-[-0.035em] text-[#111827] sm:text-5xl md:text-7xl">
                {t("onboarding.report.heroTitle", {
                  defaultValue: "Your AI Wellness Report",
                })}
              </h1>
              <p className="max-w-2xl text-base font-bold leading-6 text-[#334155] sm:text-lg md:text-xl md:leading-7">
                {t("onboarding.report.heroSubtitle", {
                  defaultValue: "Built for your goals, body and habits",
                })}
              </p>
              <p className="line-clamp-2 max-w-3xl text-sm font-medium leading-6 text-[#64748B] sm:line-clamp-3">
                {heroSummary}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
              {statHighlights.map(({ label, value, detail }, index) => (
                <motion.div
                  key={label}
                  className="rounded-[18px] bg-[#F8FAF7] p-3 ring-1 ring-slate-200 sm:rounded-[24px] sm:p-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.06, duration: 0.28 }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#94A3B8] sm:text-xs sm:tracking-[0.2em]">
                    {label}
                  </p>
                  <p className="mt-2 line-clamp-1 text-xl font-black text-[#111827] sm:mt-3 sm:text-3xl">
                    {value}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs font-semibold text-[#64748B] sm:text-sm">
                    {detail}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="hidden flex-col gap-3 sm:flex sm:flex-row sm:items-center">
              <Button
                type="button"
                size="lg"
                className="h-12 gap-2 rounded-full bg-[#E68A00] px-6 text-sm font-bold text-white hover:bg-[#cf7b00] sm:h-14 sm:px-8 sm:text-base"
                onClick={onStartPlan}
              >
                <TargetIcon className="size-5" />
                {t("onboarding.report.startMyPlan", {
                  defaultValue: "Start My Plan",
                })}
              </Button>
              <p className="text-xs font-semibold leading-5 text-[#64748B] sm:text-sm">
                {t("onboarding.report.generatedOnce", {
                  date: generatedAt,
                  defaultValue: `Generated once after onboarding · ${generatedAt}`,
                })}
              </p>
            </div>
          </div>

          <div className="relative min-h-[220px] overflow-hidden bg-[#FFF7ED] sm:min-h-[340px] lg:min-h-[460px]">
            <div className="absolute inset-x-8 top-8 h-44 rounded-full bg-[#E68A00]/20 blur-3xl sm:top-12 sm:h-60" />
            <motion.div
              className="absolute left-4 top-4 z-20 rounded-2xl bg-white/90 px-3 py-2 shadow-xl backdrop-blur sm:left-8 sm:top-8 sm:rounded-[28px] sm:px-5 sm:py-4"
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.35, ease: "easeOut" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94A3B8] sm:text-xs sm:tracking-[0.2em]">
                {t("onboarding.report.confidence", {
                  defaultValue: "Confidence",
                })}
              </p>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-2xl font-black text-[#111827] sm:text-4xl">
                  {confidenceScore}
                </span>
                <span className="pb-0.5 text-xs font-bold text-[#64748B] sm:pb-1 sm:text-sm">%</span>
              </div>
            </motion.div>
            <motion.img
              src="/onboarding/report-1.png"
              alt=""
              className="absolute bottom-0 left-1/2 h-[250px] w-[200px] -translate-x-1/2 object-contain drop-shadow-[0_30px_60px_rgba(15,23,42,0.18)] sm:h-[370px] sm:w-[280px] lg:h-[470px] lg:w-[350px]"
              animate={{ y: [0, -10, 0], scale: [1, 1.015, 1] }}
              transition={{
                duration: 4.2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
            <div className="absolute right-3 top-3 flex size-16 items-center justify-center rounded-full bg-white shadow-lg sm:right-6 sm:top-6 sm:size-32">
              <div
                className="absolute inset-2 rounded-full"
                style={{
                  background: `conic-gradient(#E68A00 ${confidenceScore * 3.6}deg, #EEF2F7 0deg)`,
                }}
              />
              <div className="relative flex size-11 flex-col items-center justify-center rounded-full bg-white sm:size-24">
                <HeartPulseIcon className="size-4 text-[#E68A00] sm:size-8" />
              </div>
            </div>
          </div>
        </motion.section>

        <div className="grid gap-3 md:gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {targetCards.map(({ label, value, unit, Icon }) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
                <div className="flex items-center justify-between">
                  <Icon className="size-4 text-[#E68A00] sm:size-5" />
                  <span className="text-[10px] font-semibold text-green-600 sm:text-xs">
                    {t("onboarding.report.target", { defaultValue: "Target" })}
                  </span>
                </div>
                <p className="mt-3 text-xs font-semibold text-[#64748B] sm:mt-5 sm:text-sm">{label}</p>
                <p className="mt-1 text-xl font-bold text-[#111827] sm:text-3xl">
                  {value}
                  <span className="ml-1 text-xs font-semibold text-[#94A3B8] sm:text-base">
                    {unit}
                  </span>
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:row-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#111827] sm:text-2xl">
                  {t("onboarding.report.whyThisMatters", {
                    defaultValue: "Why this matters",
                  })}
                </h2>
                <p className="mt-1 text-xs font-medium text-[#64748B] sm:text-sm">
                  {formatDateTime(get(report, "createdAt"), locale)}
                </p>
              </div>
              <HeartPulseIcon className="size-6 text-[#E68A00] sm:size-7" />
            </div>
            <div className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
              {whyItems.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2.5 rounded-xl bg-[#F8FAF7] px-3 py-2.5 sm:gap-3 sm:py-3"
                >
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-green-600" />
                  <p className="text-sm font-medium leading-5 text-[#475569] sm:leading-6">
                    {item}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-[#FFF7ED] p-3 sm:mt-5 sm:p-4">
              <p className="text-sm font-bold text-[#111827]">
                {get(report, "report.motivationalClosing.title")}
              </p>
              <p className="mt-2 line-clamp-3 text-sm font-medium leading-5 text-[#64748B] sm:line-clamp-4 sm:leading-6">
                {get(report, "report.motivationalClosing.message")}
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-3 md:space-y-4">
          <div>
            <h2 className="text-2xl font-black text-[#111827] sm:text-3xl">
              {t("onboarding.report.focusAreas", {
                defaultValue: "Focus areas",
              })}
            </h2>
            <p className="mt-1 text-sm font-semibold leading-5 text-[#64748B]">
              {t("onboarding.report.focusAreasDescription", {
                defaultValue: "Short guidance by habit area. Scan, then start tracking.",
              })}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-5">
            {sectionCards.map(({ key, title, image, Icon, section }, index) => (
            <motion.div
              key={key}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-[28px]"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: index * 0.04, duration: 0.28 }}
            >
              <div className="relative h-28 bg-[#FFF7ED] sm:h-36">
                <img
                  src={image}
                  alt=""
                  className="absolute bottom-0 left-1/2 h-32 w-28 -translate-x-1/2 object-contain sm:h-44 sm:w-36"
                  onError={(event) => {
                    event.currentTarget.src = "/onboarding/report-1.png";
                  }}
                />
                <div className="absolute left-3 top-3 flex size-8 items-center justify-center rounded-xl bg-white text-[#E68A00] shadow-sm sm:left-4 sm:top-4 sm:size-10">
                  <Icon className="size-4 sm:size-5" />
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <h3 className="text-base font-bold text-[#111827] sm:text-lg">{title}</h3>
                <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-[#64748B] sm:mt-2 sm:text-sm sm:leading-6">
                  {get(section, "summary")}
                </p>
                <div className="mt-3 space-y-1.5 sm:mt-4 sm:space-y-2">
                  {get(section, "bullets", [])
                    .slice(0, 2)
                    .map((bullet) => (
                      <div key={bullet} className="flex items-start gap-2">
                        <CheckCircle2Icon className="mt-1 size-3.5 shrink-0 text-green-600" />
                        <p className="line-clamp-2 text-[11px] font-medium leading-4 text-[#64748B] sm:text-xs sm:leading-5">
                          {bullet}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] bg-[#111827] p-4 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)] sm:p-6 md:rounded-[34px] md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black leading-tight sm:text-3xl">
                {t("onboarding.report.sevenTips", {
                  defaultValue: "7 wellness tips",
                })}
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/65">
                {t("onboarding.report.sevenTipsDescription", {
                  defaultValue: "Short practical tips from your AI report. Start with the easiest one today.",
                })}
              </p>
            </div>
            <Button
              type="button"
              className="hidden h-12 w-full gap-2 rounded-full bg-[#E68A00] px-6 font-bold text-white hover:bg-[#cf7b00] sm:flex sm:w-auto"
              onClick={onStartPlan}
            >
              <TargetIcon className="size-4" />
              {t("onboarding.report.startMyPlan", {
                defaultValue: "Start My Plan",
              })}
            </Button>
          </div>
          <div className="mt-4 grid gap-2 sm:mt-5 sm:gap-3 md:grid-cols-2 xl:grid-cols-3">
            {actionItems.map((item, index) => (
              <div
                key={`${index}-${item}`}
                className="flex gap-2.5 rounded-2xl bg-white/8 p-2.5 ring-1 ring-white/10 sm:gap-3 sm:rounded-3xl sm:p-4"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#E68A00] text-xs font-black text-white sm:size-9 sm:text-sm">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#FBBF24] sm:text-xs sm:tracking-[0.16em]">
                    {t("onboarding.report.tipLabel", {
                      defaultValue: "Tip",
                    })}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-4 text-white/90 sm:mt-1 sm:text-sm sm:leading-6">
                    {item}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-white/8 p-3 ring-1 ring-white/10 sm:mt-5 sm:rounded-3xl sm:p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50 sm:text-xs sm:tracking-[0.18em]">
              {t("onboarding.report.disclaimer")}
            </p>
            <p className="mt-2 text-xs font-semibold leading-5 text-white/70 sm:text-sm sm:leading-6">
              {get(report, "report.disclaimer")}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

const ReportContentSkeleton = () => {
  return (
    <div className="flex flex-1 overflow-hidden px-5 py-5 md:px-8 md:py-8">
      <div className="grid w-full gap-4 xl:grid-cols-[minmax(0,1.3fr)_360px]">
        <div className="space-y-4">
          <Card className="py-0 shadow-none">
            <CardContent className="space-y-4 px-6 py-6">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
              <div className="grid gap-3 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-28 rounded-[28px]" />
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-60 rounded-[28px]" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-52 rounded-[28px]" />
          ))}
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const onboardingCompleted = useAuthStore(
    (state) => state.onboardingCompleted,
  );
  const currentLanguage = i18n.language || "uz";
  const goal = user?.onboarding?.goal ?? null;
  const tone = getReportTone(goal);
  const [activeStage, setActiveStage] = React.useState(0);
  const [autoRequested, setAutoRequested] = React.useState(false);

  const latestQuery = useGetQuery({
    url: "/user/onboarding/report/latest",
    queryProps: {
      queryKey: LATEST_REPORT_QUERY_KEY(currentLanguage),
      enabled: onboardingCompleted,
      staleTime: 60000,
    },
  });

  const {
    mutateAsync: generateReport,
    isPending: isGenerating,
    error: generateError,
  } = usePostQuery();

  const latestReport = React.useMemo(
    () => unwrapPayload(latestQuery.data),
    [latestQuery.data],
  );
  const report = latestReport;

  const loadingSlides = React.useMemo(
    () =>
      REPORT_LOADING_SCENES.map((scene, index) => ({
        ...scene,
        step: t(`onboarding.report.loadingSlides.${scene.key}.step`, {
          defaultValue: t("onboarding.report.stepLabel", { index: index + 1 }),
        }),
        title: t(`onboarding.report.loadingSlides.${scene.key}.title`),
        description: t(
          `onboarding.report.loadingSlides.${scene.key}.description`,
        ),
        items: t(`onboarding.report.loadingSlides.${scene.key}.items`, {
          returnObjects: true,
          defaultValue: [],
        }),
      })),
    [t],
  );

  React.useEffect(() => {
    setAutoRequested(false);
  }, [currentLanguage]);

  React.useEffect(() => {
    const shouldAnimate =
      isGenerating ||
      (!report &&
        (latestQuery.isLoading || latestQuery.isFetching || autoRequested));

    if (!shouldAnimate) {
      setActiveStage(0);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveStage((current) => (current + 1) % loadingSlides.length);
    }, 2300);

    return () => window.clearInterval(interval);
  }, [
    autoRequested,
    isGenerating,
    latestQuery.isFetching,
    latestQuery.isLoading,
    report,
    loadingSlides.length,
  ]);

  const handleGenerate = React.useCallback(
    async ({ silent = false } = {}) => {
      try {
        const response = await generateReport({
          url: "/user/onboarding/report/generate",
        });
        const payload = unwrapPayload(response);
        await queryClient.invalidateQueries({
          queryKey: LATEST_REPORT_QUERY_KEY(currentLanguage),
        });

        if (!silent) {
          toast.success(t("onboarding.report.generateSuccess"));
        }

        return payload;
      } catch (error) {
        if (!silent) {
          const message =
            get(error, "response.data.message") ||
            t("onboarding.report.generateError");
          toast.error(Array.isArray(message) ? message.join(", ") : message);
        }

        throw error;
      }
    },
    [currentLanguage, generateReport, queryClient, t],
  );

  React.useEffect(() => {
    if (
      !onboardingCompleted ||
      latestQuery.isLoading ||
      latestQuery.isFetching
    ) {
      return;
    }

    if (latestQuery.error || report || isGenerating || autoRequested) {
      return;
    }

    setAutoRequested(true);
    void handleGenerate({ silent: true });
  }, [
    autoRequested,
    handleGenerate,
    isGenerating,
    latestQuery.error,
    latestQuery.isFetching,
    latestQuery.isLoading,
    onboardingCompleted,
    report,
  ]);

  const handleRetry = React.useCallback(() => {
    setAutoRequested(false);
    void latestQuery.refetch();
  }, [latestQuery]);

  const handleOpenDashboard = React.useCallback(() => {
    navigate("/user", { replace: true });
  }, [navigate]);

  const activeError = latestQuery.error;
  const showGeneratingState =
    !report &&
    (isGenerating ||
      latestQuery.isLoading ||
      latestQuery.isFetching ||
      autoRequested);
  const showSkeleton =
    !report &&
    !showGeneratingState &&
    latestQuery.isLoading;

  React.useEffect(() => {
    if (!onboardingCompleted) {
      navigate("/user/onboarding", { replace: true });
    }
  }, [navigate, onboardingCompleted]);

  useOnboardingFooter(
    <Button
      type="button"
      size="lg"
      className="w-full"
      onClick={handleOpenDashboard}
      disabled={showGeneratingState}
    >
      {showGeneratingState
        ? t("onboarding.report.generatingFooter")
        : t("onboarding.report.goDashboard")}
    </Button>,
  );

  if (!onboardingCompleted) {
    return null;
  }

  return (
    <PageTransition
      mode="fade"
      className="relative flex h-full flex-1 overflow-hidden"
    >
      <PageAura tone={tone} />

      <AnimatePresence mode="wait">
        {showGeneratingState ? (
          <motion.div
            key="report-loading"
            className="flex h-full flex-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ReportLoadingState
              slides={loadingSlides}
              activeStage={activeStage}
              onSelectStage={setActiveStage}
              t={t}
            />
          </motion.div>
        ) : showSkeleton ? (
          <motion.div
            key="report-skeleton"
            className="flex h-full flex-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ReportContentSkeleton />
          </motion.div>
        ) : report ? (
          <motion.div
            key={report.id}
            className="flex h-full flex-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <ReportContent
              report={report}
              onStartPlan={handleOpenDashboard}
              t={t}
              locale={t("common.locale", { defaultValue: "uz-UZ" })}
            />
          </motion.div>
        ) : (
          <motion.div
            key="report-error"
            className="flex h-full flex-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ReportErrorState
              title={t("onboarding.report.errorTitle")}
              description={
                get(activeError, "response.data.message") ||
                get(generateError, "response.data.message") ||
                t("onboarding.report.errorDescription")
              }
              onRetry={() => {
                if (activeError) {
                  handleRetry();
                  return;
                }

                void handleGenerate();
              }}
              onDashboard={handleOpenDashboard}
              t={t}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
};

export default Index;
