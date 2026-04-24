import React from "react";
import { get, map } from "lodash";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowRightIcon,
  BotIcon,
  DownloadIcon,
  FileTextIcon,
  Loader2Icon,
  RefreshCcwIcon,
  SparklesIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/hooks/api/use-api";
import { useGetQuery, usePostQuery } from "@/hooks/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PageTransition from "@/components/page-transition";
import { cn } from "@/lib/utils";
import { getUserOnboardingReportPath } from "@/lib/app-paths";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import PageAura from "../../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";
import { useAuthStore } from "@/store";

const LATEST_REPORT_QUERY_KEY = (language) => [
  "onboarding-report",
  "latest",
  language || "uz",
];
const REPORT_HISTORY_QUERY_KEY = ["onboarding-report", "history"];
const REPORT_DETAIL_QUERY_KEY = (reportId) => [
  "onboarding-report",
  "detail",
  reportId,
];

const unwrapPayload = (response) => response?.data?.data ?? null;
const unwrapMeta = (response) => response?.data?.meta ?? null;

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

const inferFilename = (response, fallback) => {
  const disposition = response?.headers?.["content-disposition"] || "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
};

const ReportLoadingState = ({ stages, activeStage, t }) => {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-8 md:px-8">
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center text-center">
        <div className="relative mb-8 flex h-64 w-full items-center justify-center md:h-72">
          <motion.div
            className="absolute size-56 rounded-full border border-primary/15 bg-background/70 backdrop-blur-xl md:size-64"
            animate={{
              scale: [1, 1.04, 1],
              opacity: [0.84, 1, 0.88],
            }}
            transition={{
              duration: 3.2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute size-40 rounded-full bg-gradient-to-br from-primary/16 via-primary/10 to-transparent blur-2xl md:size-48"
            animate={{
              rotate: [0, 180, 360],
              scale: [0.92, 1.08, 0.92],
            }}
            transition={{
              duration: 7,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />

          {map(stages, (stage, index) => {
            const angle = (360 / stages.length) * index;
            const active = index === activeStage;

            return (
              <motion.div
                key={stage}
                className="absolute"
                animate={{ rotate: [angle, angle + 360] }}
                transition={{
                  duration: 12,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              >
                <motion.div
                  className="translate-y-[-112px] md:translate-y-[-126px]"
                  animate={active ? { scale: [1, 1.16, 1] } : { scale: 1 }}
                  transition={{
                    duration: 1.8,
                    repeat: active ? Number.POSITIVE_INFINITY : 0,
                    ease: "easeInOut",
                  }}
                >
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur md:text-sm",
                      active
                        ? "border-primary/30 bg-primary/12 text-foreground"
                        : "border-border/70 bg-background/70 text-muted-foreground",
                    )}
                  >
                    {active ? (
                      <Loader2Icon className="size-3.5 animate-spin md:size-4" />
                    ) : (
                      <SparklesIcon className="size-3.5 md:size-4" />
                    )}
                    {stage}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}

          <motion.div
            className="relative flex flex-col items-center gap-4 rounded-[32px] border border-primary/15 bg-background/85 px-7 py-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/12 text-primary">
              <BotIcon className="size-7" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.26em] text-muted-foreground">
                {t("onboarding.report.generatingEyebrow")}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {t("onboarding.report.generatingTitle")}
              </h1>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                {t("onboarding.report.generatingDescription")}
              </p>
            </div>
          </motion.div>
        </div>

        <div className="grid w-full gap-3 md:grid-cols-3">
          {map(stages, (stage, index) => (
            <Card
              key={`summary-${stage}`}
              className={cn(
                "border-border/70 bg-background/70 py-0 shadow-none backdrop-blur",
                index === activeStage && "border-primary/25 bg-primary/[0.08]",
              )}
            >
              <CardContent className="px-5 py-4 text-left">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {t("onboarding.report.stepLabel", {
                    index: index + 1,
                  })}
                </p>
                <p className="mt-2 text-sm font-semibold md:text-base">{stage}</p>
              </CardContent>
            </Card>
          ))}
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
            <Button type="button" size="lg" variant="outline" onClick={onDashboard}>
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
  historyItems,
  totalVersions,
  isDownloading,
  isGenerating,
  onDownloadPdf,
  onRegenerate,
  onSelectVersion,
  currentReportId,
  t,
  locale,
}) => {
  const sections = [
    report?.report?.goalInterpretation,
    report?.report?.targetsExplanation,
    report?.report?.nutritionGuidance,
    report?.report?.hydrationGuidance,
    report?.report?.movementGuidance,
  ].filter(Boolean);

  return (
    <div className="relative flex flex-1 overflow-hidden px-5 py-5 md:px-8 md:py-8">
      <div className="relative z-10 grid w-full gap-4 xl:grid-cols-[minmax(0,1.3fr)_360px]">
        <div className="space-y-4">
          <Card className="border-primary/15 bg-background/80 py-0 shadow-none backdrop-blur">
            <CardContent className="space-y-5 px-6 py-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="gap-1.5">
                      <SparklesIcon className="size-3" />
                      {t("onboarding.report.readyBadge")}
                    </Badge>
                    <Badge variant="outline" className="border-primary/15 bg-background/70">
                      <FileTextIcon className="size-3" />
                      {t("onboarding.report.pdfReady")}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                      {get(report, "report.hero.title")}
                    </h1>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                      {get(report, "report.hero.summary")}
                    </p>
                  </div>
                </div>

                <div className="grid shrink-0 gap-2 text-sm text-muted-foreground md:text-right">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em]">
                      {t("onboarding.report.version")}
                    </div>
                    <div className="mt-1 font-medium text-foreground">
                      #{get(report, "version")}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em]">
                      {t("onboarding.report.generatedAt")}
                    </div>
                    <div className="mt-1 font-medium text-foreground">
                      {formatDateTime(get(report, "createdAt"), locale)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em]">
                      {t("onboarding.report.language")}
                    </div>
                    <div className="mt-1 font-medium text-foreground">
                      {getLanguageLabel(get(report, "language"), t)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[1.2fr_repeat(3,minmax(0,1fr))]">
                <div className="rounded-[28px] border border-primary/15 bg-gradient-to-br from-primary/[0.08] to-background px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {t("onboarding.report.goalFocus")}
                  </p>
                  <p className="mt-2 text-xl font-semibold tracking-tight">
                    {get(report, "report.hero.highlight")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {get(report, "report.motivationalClosing.message")}
                  </p>
                </div>
                <div className="rounded-[28px] border bg-background/70 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    BMI
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {get(report, "report.bodySummary.bmiValue")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {get(report, "report.bodySummary.bmiLabel")}
                  </p>
                </div>
                <div className="rounded-[28px] border bg-background/70 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {t("onboarding.report.weightStatus")}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6">
                    {get(report, "report.bodySummary.weightStatus")}
                  </p>
                </div>
                <div className="rounded-[28px] border bg-background/70 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {t("onboarding.report.model")}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6">
                    {get(report, "model") || "AI"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {get(report, "generationMs")
                      ? `${get(report, "generationMs")} ms`
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  size="lg"
                  className="gap-2"
                  onClick={onDownloadPdf}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <DownloadIcon className="size-4" />
                  )}
                  {t("onboarding.report.downloadPdf")}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  onClick={onRegenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <RefreshCcwIcon className="size-4" />
                  )}
                  {t("onboarding.report.regenerate")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="py-0 shadow-none">
              <CardHeader>
                <CardTitle>{get(report, "report.userSnapshot.title")}</CardTitle>
                <CardDescription>
                  {t("onboarding.report.userSnapshotDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {map(get(report, "report.userSnapshot.items", []), (item) => (
                  <div
                    key={`${item.label}-${item.value}`}
                    className="rounded-[24px] border bg-background/60 px-4 py-3"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold">{item.value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="py-0 shadow-none">
              <CardHeader>
                <CardTitle>{get(report, "report.bodySummary.title")}</CardTitle>
                <CardDescription>
                  {get(report, "report.bodySummary.summary")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {map(get(report, "report.bodySummary.bullets", []), (bullet) => (
                  <div
                    key={bullet}
                    className="rounded-[24px] border bg-background/60 px-4 py-3 text-sm leading-6 text-muted-foreground"
                  >
                    {bullet}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {map(sections, (section) => (
              <Card key={section.title} className="py-0 shadow-none">
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.summary}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {map(section.bullets, (bullet) => (
                    <div
                      key={bullet}
                      className="rounded-[24px] border bg-background/60 px-4 py-3 text-sm leading-6 text-muted-foreground"
                    >
                      {bullet}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Card className="py-0 shadow-none">
            <CardHeader>
              <CardTitle>{get(report, "report.actionPlan.title")}</CardTitle>
              <CardDescription>
                {t("onboarding.report.actionPlanDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {map(get(report, "report.actionPlan.items", []), (item, index) => (
                <div
                  key={`${index}-${item}`}
                  className="flex items-start gap-3 rounded-[24px] border bg-background/60 px-4 py-3"
                >
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="py-0 shadow-none">
            <CardHeader>
              <CardTitle>{get(report, "report.cautionPoints.title")}</CardTitle>
              <CardDescription>
                {t("onboarding.report.cautionDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {map(get(report, "report.cautionPoints.bullets", []), (bullet) => (
                <div
                  key={bullet}
                  className="rounded-[24px] border bg-background/60 px-4 py-3 text-sm leading-6 text-muted-foreground"
                >
                  {bullet}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="py-0 shadow-none">
            <CardHeader>
              <CardTitle>{t("onboarding.report.versions")}</CardTitle>
              <CardDescription>
                {t("onboarding.report.versionsDescription", {
                  count: totalVersions,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {historyItems.length > 0 ? (
                map(historyItems, (item) => {
                  const isActive = currentReportId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={cn(
                        "block w-full rounded-[24px] border px-4 py-3 text-left transition-colors",
                        isActive
                          ? "border-primary/25 bg-primary/[0.08]"
                          : "bg-background/60 hover:border-primary/20 hover:bg-background",
                      )}
                      onClick={() => onSelectVersion(item.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold">
                              {t("onboarding.report.versionNumber", {
                                version: item.version,
                              })}
                            </p>
                            <Badge variant="outline" className="h-6">
                              {getLanguageLabel(item.language, t)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.title}
                          </p>
                        </div>
                        {isActive ? (
                          <Badge className="shrink-0">
                            {t("onboarding.report.current")}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {item.summary}
                      </p>
                      <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        {formatDateTime(item.createdAt, locale)}
                      </p>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[24px] border bg-background/60 px-4 py-4 text-sm text-muted-foreground">
                  {t("onboarding.report.noVersions")}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="py-0 shadow-none">
            <CardHeader>
              <CardTitle>{get(report, "report.motivationalClosing.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="rounded-[24px] border bg-background/60 px-4 py-4 text-sm leading-6 text-muted-foreground">
                {get(report, "report.motivationalClosing.message")}
              </p>
              <div className="rounded-[24px] border bg-primary/[0.05] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {t("onboarding.report.disclaimer")}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {get(report, "report.disclaimer")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
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
  const { reportId } = useParams();
  const user = useAuthStore((state) => state.user);
  const onboardingCompleted = useAuthStore((state) => state.onboardingCompleted);
  const currentLanguage = i18n.language || "uz";
  const goal = user?.onboarding?.goal ?? null;
  const tone = getReportTone(goal);
  const [activeStage, setActiveStage] = React.useState(0);
  const [autoRequested, setAutoRequested] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);

  const latestQuery = useGetQuery({
    url: "/user/onboarding/report/latest",
    queryProps: {
      queryKey: LATEST_REPORT_QUERY_KEY(currentLanguage),
      enabled: onboardingCompleted && !reportId,
      staleTime: 60000,
    },
  });

  const detailQuery = useGetQuery({
    url: reportId ? `/user/onboarding/report/${reportId}` : "/user/onboarding/report/latest",
    queryProps: {
      queryKey: REPORT_DETAIL_QUERY_KEY(reportId || "latest"),
      enabled: onboardingCompleted && Boolean(reportId),
      staleTime: 60000,
    },
  });

  const historyQuery = useGetQuery({
    url: "/user/onboarding/report/history",
    queryProps: {
      queryKey: REPORT_HISTORY_QUERY_KEY,
      enabled: onboardingCompleted,
      staleTime: 60000,
    },
  });

  const { mutateAsync: generateReport, isPending: isGenerating, error: generateError } =
    usePostQuery();

  const latestReport = React.useMemo(
    () => unwrapPayload(latestQuery.data),
    [latestQuery.data],
  );
  const detailReport = React.useMemo(
    () => unwrapPayload(detailQuery.data),
    [detailQuery.data],
  );
  const report = reportId ? detailReport : latestReport;
  const historyItems = React.useMemo(
    () => unwrapPayload(historyQuery.data) ?? [],
    [historyQuery.data],
  );
  const historyMeta = React.useMemo(
    () => unwrapMeta(historyQuery.data),
    [historyQuery.data],
  );

  const stages = React.useMemo(
    () => [
      t("onboarding.report.stages.collecting"),
      t("onboarding.report.stages.analyzing"),
      t("onboarding.report.stages.planning"),
      t("onboarding.report.stages.pdf"),
    ],
    [t],
  );

  React.useEffect(() => {
    setAutoRequested(false);
  }, [reportId, currentLanguage]);

  React.useEffect(() => {
    const shouldAnimate =
      isGenerating ||
      (!report &&
        !reportId &&
        (latestQuery.isLoading || latestQuery.isFetching || autoRequested));

    if (!shouldAnimate) {
      setActiveStage(0);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveStage((current) => (current + 1) % stages.length);
    }, 1700);

    return () => window.clearInterval(interval);
  }, [
    autoRequested,
    isGenerating,
    latestQuery.isFetching,
    latestQuery.isLoading,
    report,
    reportId,
    stages.length,
  ]);

  const handleGenerate = React.useCallback(
    async ({ replace = false, silent = false } = {}) => {
      try {
        const response = await generateReport({
          url: "/user/onboarding/report/generate",
        });
        const payload = unwrapPayload(response);
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: LATEST_REPORT_QUERY_KEY(currentLanguage),
          }),
          queryClient.invalidateQueries({
            queryKey: REPORT_HISTORY_QUERY_KEY,
          }),
        ]);

        if (payload?.id) {
          navigate(getUserOnboardingReportPath(payload.id), { replace });
        }

        if (!silent) {
          toast.success(t("onboarding.report.generateSuccess"));
        }

        return payload;
      } catch (error) {
        if (!silent) {
          const message =
            get(error, "response.data.message") || t("onboarding.report.generateError");
          toast.error(Array.isArray(message) ? message.join(", ") : message);
        }

        throw error;
      }
    },
    [currentLanguage, generateReport, navigate, queryClient, t],
  );

  React.useEffect(() => {
    if (!onboardingCompleted || reportId || latestQuery.isLoading || latestQuery.isFetching) {
      return;
    }

    if (latestQuery.error || report || isGenerating || autoRequested) {
      return;
    }

    setAutoRequested(true);
    void handleGenerate({ replace: true, silent: true });
  }, [
    autoRequested,
    handleGenerate,
    isGenerating,
    latestQuery.error,
    latestQuery.isFetching,
    latestQuery.isLoading,
    onboardingCompleted,
    report,
    reportId,
  ]);

  const handleRetry = React.useCallback(() => {
    if (reportId) {
      void detailQuery.refetch();
      return;
    }

    setAutoRequested(false);
    void latestQuery.refetch();
  }, [detailQuery, latestQuery, reportId]);

  const handleDownloadPdf = React.useCallback(async () => {
    if (!report?.id || isDownloading) {
      return;
    }

    try {
      setIsDownloading(true);
      const response = await api.get(`/user/onboarding/report/${report.id}/pdf`, {
        responseType: "blob",
      });
      const blob = get(response, "data");
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = inferFilename(response, `onboarding-health-report-${report.version}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const message =
        get(error, "response.data.message") || t("onboarding.report.pdfError");
      toast.error(Array.isArray(message) ? message.join(", ") : message);
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading, report?.id, report?.version, t]);

  const handleOpenDashboard = React.useCallback(() => {
    navigate("/user", { replace: true });
  }, [navigate]);

  const handleSelectVersion = React.useCallback(
    (nextReportId) => {
      navigate(getUserOnboardingReportPath(nextReportId));
    },
    [navigate],
  );

  const activeError = reportId ? detailQuery.error : latestQuery.error;
  const showGeneratingState =
    !report &&
    (isGenerating ||
      (!reportId &&
        (latestQuery.isLoading || latestQuery.isFetching || autoRequested)));
  const showSkeleton =
    !report &&
    !showGeneratingState &&
    ((reportId && detailQuery.isLoading) || (!reportId && latestQuery.isLoading));

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
    <PageTransition mode="fade" className="relative flex h-full flex-1 overflow-hidden">
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
              stages={stages}
              activeStage={activeStage}
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
              historyItems={historyItems}
              isDownloading={isDownloading}
              isGenerating={isGenerating}
              onDownloadPdf={handleDownloadPdf}
              onRegenerate={() => void handleGenerate()}
              onSelectVersion={handleSelectVersion}
              currentReportId={report.id}
              t={t}
              locale={t("common.locale", { defaultValue: "uz-UZ" })}
              totalVersions={historyMeta?.total ?? historyItems.length}
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
