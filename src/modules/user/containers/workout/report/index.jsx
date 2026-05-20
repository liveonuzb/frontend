import React from "react";
import { useTranslation } from "react-i18next";
import { get, map, slice, toNumber } from "lodash";
import {
  ActivityIcon,
  BarChart3Icon,
  CalendarDaysIcon,
  Clock3Icon,
  DownloadIcon,
  DumbbellIcon,
  FlameIcon,
  GaugeIcon,
  RouteIcon,
  SparklesIcon,
  TrophyIcon,
} from "lucide-react";
import RechartsBar from "@/components/charts/bar-chart.jsx";
import RechartsLine from "@/components/charts/line-chart.jsx";
import RechartsPie from "@/components/charts/pie-chart.jsx";
import PageLoader from "@/components/page-loader/index.jsx";
import PageTransition from "@/components/page-transition";
import { TrackingPageHeader } from "@/components/tracking-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkoutReport } from "@/hooks/app/use-workout-sessions";
import {
  formatRunningDistance,
  formatRunningPace,
} from "@/lib/running-metrics";
import { useBreadcrumbStore } from "@/store";

const chartColors = ["#fb8500", "#f2dcc8", "#c9c9c9", "#8bcf7e"];
const COMPARISON_OPTIONS = ["previous", "none"];

const escapeCsvCell = (value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export const buildWorkoutReportCsv = (report) => {
  const summary = get(report, "summary", {});
  const summaryRows = [
    ["metric", "value"],
    ["sessions", get(summary, "totalSessions", 0)],
    ["durationSeconds", get(summary, "totalDurationSeconds", 0)],
    ["calories", get(summary, "totalCalories", 0)],
    ["distanceMeters", get(summary, "totalDistanceMeters", 0)],
    ["averagePaceSecondsPerKm", get(summary, "averagePaceSecondsPerKm", "")],
    ["volumeKg", get(summary, "totalVolumeKg", 0)],
    ["streakDays", get(summary, "streakDays", 0)],
  ];
  const workoutRows = [
    [],
    ["recentWorkouts"],
    ["id", "title", "type", "durationSeconds", "calories", "distanceMeters", "paceSecondsPerKm"],
    ...map(get(report, "recentWorkouts", []), (session) => [
      get(session, "id", ""),
      get(session, "focus") || get(session, "planName") || "Workout",
      get(session, "activityType", ""),
      get(session, "durationSeconds", 0),
      get(session, "estimatedCalories", 0),
      get(session, "distanceMeters", 0),
      get(session, "averagePaceSecondsPerKm", ""),
    ]),
  ];

  return [...summaryRows, ...workoutRows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");
};

const formatDurationShort = (seconds) => {
  const totalSeconds = Math.max(0, toNumber(seconds) || 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours} ч ${minutes} мин`;
  }

  if (hours > 0) {
    return `${hours} ч`;
  }

  return `${minutes} мин`;
};

const formatNumber = (value) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(toNumber(value) || 0));

const MetricCard = ({ icon: Icon, label, value, trend }) => (
  <Card className="rounded-[24px] border-border/70 bg-card/95 shadow-sm">
    <CardContent className="flex items-center gap-4 p-5">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-2xl font-black tracking-tight">{value}</p>
        {trend ? <p className="mt-1 text-xs font-semibold text-green-600">{trend}</p> : null}
      </div>
    </CardContent>
  </Card>
);

const ChartCard = ({ title, action, children, className = "" }) => (
  <Card className={`rounded-[24px] border-border/70 bg-card/95 shadow-sm ${className}`}>
    <CardHeader className="flex-row items-start justify-between gap-4 pb-3">
      <CardTitle className="text-base font-black">{title}</CardTitle>
      {action ? <div className="text-xs font-semibold text-primary">{action}</div> : null}
    </CardHeader>
    <CardContent className="pb-5">{children}</CardContent>
  </Card>
);

const ProgressRing = ({ value }) => {
  const clamped = Math.max(0, Math.min(100, toNumber(value) || 0));
  const style = {
    background: `conic-gradient(var(--color-primary) ${clamped}%, hsl(var(--muted)) 0)`,
  };

  return (
    <div
      className="flex size-28 items-center justify-center rounded-full"
      style={style}
      aria-label={`Goal completion ${clamped}%`}
    >
      <div className="flex size-20 flex-col items-center justify-center rounded-full bg-card">
        <span className="text-2xl font-black">{clamped}%</span>
      </div>
    </div>
  );
};

const WorkoutReportPage = () => {
  const { t } = useTranslation();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const [period, setPeriod] = React.useState("30d");
  const [comparisonPeriod, setComparisonPeriod] = React.useState("previous");
  const { report, isLoading, isError, refetch } = useWorkoutReport({
    comparisonPeriod,
    period,
  });

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: t("user.dashboard.title") },
      { url: "/user/workout", title: t("user.workout.title") },
      { url: "/user/workout/report", title: t("user.workout.report.breadcrumb", "Отчет") },
    ]);
  }, [setBreadcrumbs, t]);

  const summary = get(report, "summary", {});
  const typeDistribution = map(get(report, "typeDistribution", []), (item, index) => ({
    name: get(item, "label", get(item, "type", "")),
    value: toNumber(get(item, "sessions", 0)) || 0,
    color: chartColors[index % chartColors.length],
    percentage: toNumber(get(item, "percentage", 0)) || 0,
  }));
  const weeklyActivity = get(report, "charts.weeklyActivity", []);
  const monthlySessions = get(report, "charts.monthlySessions", []);
  const distancePaceTrend = get(report, "charts.distancePaceTrend", []);
  const intensityDistribution = get(report, "charts.intensityDistribution", []);
  const recentWorkouts = slice(get(report, "recentWorkouts", []), 0, 5);
  const downloadReportCsv = React.useCallback(() => {
    const csv = buildWorkoutReportCsv(report ?? {});
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `workout-report-${period}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [period, report]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <PageTransition mode="slide-up">
        <Card>
          <CardHeader>
            <CardTitle>{t("user.workout.report.errorTitle", "Не удалось загрузить отчет")}</CardTitle>
            <CardDescription>
              {t("user.workout.report.errorDescription", "Попробуйте обновить аналитику тренировок.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()}>
              {t("user.workout.report.retry", "Повторить")}
            </Button>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition mode="slide-up">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <TrackingPageHeader
          title={t("user.workout.report.title", "Аналитика тренировок")}
          subtitle={t(
            "user.workout.report.subtitle",
            "Ваш прогресс, тренировки и бег в одном отчете.",
          )}
          hideTitleOnMobile={false}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {map(["7d", "30d", "90d"], (option) => (
                <Button
                  key={option}
                  type="button"
                  variant={period === option ? "default" : "outline"}
                  onClick={() => setPeriod(option)}
                >
                  <CalendarDaysIcon data-icon="inline-start" />
                  {t(`user.workout.report.period.${option}`, option)}
                </Button>
              ))}
              <label className="flex h-9 items-center gap-2 rounded-4xl border border-border bg-input/30 px-3 text-sm font-medium">
                <span className="text-muted-foreground">
                  {t("user.workout.report.comparison", "Сравнение")}
                </span>
                <select
                  aria-label={t("user.workout.report.comparison", "Сравнение")}
                  value={comparisonPeriod}
                  onChange={(event) => setComparisonPeriod(event.target.value)}
                  className="bg-transparent font-semibold outline-none"
                >
                  {map(COMPARISON_OPTIONS, (option) => (
                    <option key={option} value={option}>
                      {t(`user.workout.report.comparisonOptions.${option}`, option)}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="button" variant="outline" onClick={downloadReportCsv}>
                <DownloadIcon data-icon="inline-start" />
                {t("user.workout.report.export", "Экспорт")}
              </Button>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          <MetricCard
            icon={ActivityIcon}
            label={t("user.workout.report.sessions", "Сессии")}
            value={formatNumber(get(summary, "totalSessions", 0))}
            trend="+ 20%"
          />
          <MetricCard
            icon={Clock3Icon}
            label={t("user.workout.report.totalDuration", "Общая длительность")}
            value={formatDurationShort(get(summary, "totalDurationSeconds", 0))}
            trend="+ 18%"
          />
          <MetricCard
            icon={FlameIcon}
            label={t("user.workout.report.calories", "Калории")}
            value={`${formatNumber(get(summary, "totalCalories", 0))} kcal`}
            trend="+ 14%"
          />
          <MetricCard
            icon={RouteIcon}
            label={t("user.workout.report.totalDistance", "Общая дистанция")}
            value={formatRunningDistance(get(summary, "totalDistanceMeters", 0))}
            trend="+ 26%"
          />
          <MetricCard
            icon={GaugeIcon}
            label={t("user.workout.report.averagePace", "Средний темп (бег)")}
            value={formatRunningPace(get(summary, "averagePaceSecondsPerKm"))}
            trend="- 5%"
          />
          <MetricCard
            icon={BarChart3Icon}
            label={t("user.workout.report.volume", "Объем (нагрузка)")}
            value={formatNumber(get(summary, "totalVolumeKg", 0))}
            trend="+ 21%"
          />
          <MetricCard
            icon={TrophyIcon}
            label={t("user.workout.report.streak", "Серия (дней)")}
            value={formatNumber(get(summary, "streakDays", 0))}
            trend="+ 2 дня"
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <ChartCard
            title={t("user.workout.report.weeklyActivity", "Активность по неделям")}
            action={t("user.workout.report.allWorkouts", "Все тренировки")}
            className="xl:col-span-1"
          >
            <RechartsBar
              data={weeklyActivity}
              dataKey="durationMinutes"
              xAxisKey="label"
              height={220}
              color="#fb8500"
              showGrid
            />
          </ChartCard>

          <ChartCard
            title={t("user.workout.report.monthlySessions", "Сессии по месяцам")}
            action={t("user.workout.report.allWorkouts", "Все тренировки")}
          >
            <RechartsBar
              data={monthlySessions}
              dataKey="sessions"
              xAxisKey="label"
              height={220}
              color="#fb8500"
              gradientColor="#ffd6a3"
            />
          </ChartCard>

          <ChartCard
            title={t("user.workout.report.workoutTypes", "Типы тренировок")}
            action={t("user.workout.report.allWorkouts", "Все тренировки")}
          >
            <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
              <RechartsPie
                data={typeDistribution}
                height={180}
                innerRadius={54}
                outerRadius={78}
                centerLabel={String(get(summary, "totalSessions", 0))}
              />
              <div className="space-y-3">
                {map(typeDistribution, (item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.name}
                    </span>
                    <span className="font-bold">
                      {item.value} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          <ChartCard title={t("user.workout.report.runVsStrength", "Бег vs Силовые")}>
            <div className="grid gap-4 sm:grid-cols-[160px_1fr] sm:items-center">
              <RechartsPie
                data={[
                  {
                    name: t("user.workout.report.running", "Бег"),
                    value: get(report, "runVsStrength.running.sessions", 0),
                    color: "#fb8500",
                  },
                  {
                    name: t("user.workout.report.strength", "Силовые"),
                    value: get(report, "runVsStrength.strength.sessions", 0),
                    color: "#d9c6b7",
                  },
                ]}
                height={170}
                innerRadius={50}
                outerRadius={74}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Badge variant="outline">{t("user.workout.report.running", "Бег")}</Badge>
                  <p className="mt-2 text-2xl font-black">
                    {get(report, "runVsStrength.running.sessions", 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRunningDistance(get(report, "runVsStrength.running.distanceMeters", 0))}
                  </p>
                </div>
                <div>
                  <Badge variant="outline">{t("user.workout.report.strength", "Силовые")}</Badge>
                  <p className="mt-2 text-2xl font-black">
                    {get(report, "runVsStrength.strength.sessions", 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDurationShort(get(report, "runVsStrength.strength.durationSeconds", 0))}
                  </p>
                </div>
              </div>
            </div>
          </ChartCard>

          <ChartCard
            title={t("user.workout.report.distancePaceTrend", "Тренд дистанции и темпа (бег)")}
            action={t("user.workout.report.allWorkouts", "Все тренировки")}
          >
            <RechartsLine
              data={distancePaceTrend}
              dataKey="distanceMeters"
              xAxisKey="label"
              height={220}
              color="#fb8500"
              showGrid
            />
          </ChartCard>

          <ChartCard title={t("user.workout.report.goalCompletion", "Выполнение целей")}>
            <div className="grid gap-5 sm:grid-cols-[140px_1fr] sm:items-center">
              <ProgressRing value={get(report, "goals.completionPercent", 0)} />
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span>{t("user.workout.report.sessions", "Сессии")}</span>
                  <strong>
                    {get(report, "goals.sessions.current", 0)} / {get(report, "goals.sessions.target", 0)}
                  </strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span>{t("user.workout.report.distance", "Дистанция")}</span>
                  <strong>
                    {formatRunningDistance(get(report, "goals.distanceMeters.current", 0))} /{" "}
                    {formatRunningDistance(get(report, "goals.distanceMeters.target", 0))}
                  </strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span>{t("user.workout.report.calories", "Калории")}</span>
                  <strong>
                    {formatNumber(get(report, "goals.calories.current", 0))} /{" "}
                    {formatNumber(get(report, "goals.calories.target", 0))} kcal
                  </strong>
                </div>
              </div>
            </div>
          </ChartCard>

          <ChartCard title={t("user.workout.report.intensity", "Распределение интенсивности")}>
            <div className="space-y-3">
              {map(intensityDistribution, (item) => (
                <div key={get(item, "key")} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{get(item, "label")}</span>
                    <span className="font-bold">
                      {get(item, "sessions", 0)} ({get(item, "percentage", 0)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${get(item, "percentage", 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title={t("user.workout.report.recoveryLoad", "Восстановление и нагрузка")}>
            <div className="space-y-3">
              <p className="text-2xl font-black text-green-700">
                {get(report, "recovery.loadBalanceLabel", "Оптимальный")}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                {get(report, "recovery.recommendation", "")}
              </p>
            </div>
          </ChartCard>

          <ChartCard title={get(report, "coachAdvice.title", t("user.workout.report.coachAdvice", "AI совет тренера"))}>
            <div className="flex gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <SparklesIcon className="size-5" aria-hidden="true" />
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                {get(report, "coachAdvice.text", "")}
              </p>
            </div>
          </ChartCard>
        </div>

        <Card className="rounded-[24px] border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base font-black">
              {t("user.workout.report.recentWorkouts", "Последние тренировки")}
            </CardTitle>
            <Button variant="ghost" size="sm">
              {t("user.workout.report.showAll", "Показать все")}
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {map(recentWorkouts, (session) => {
              const isRunning = get(session, "activityType") === "OUTDOOR_RUN";

              return (
                <div
                  key={get(session, "id")}
                  className="rounded-2xl border border-border/70 p-4"
                >
                  <div className="mb-3 flex items-center gap-2">
                    {isRunning ? (
                      <RouteIcon className="size-4 text-green-600" aria-hidden="true" />
                    ) : (
                      <DumbbellIcon className="size-4 text-primary" aria-hidden="true" />
                    )}
                    <p className="truncate text-sm font-bold">
                      {get(session, "focus") || get(session, "planName") || "Workout"}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isRunning
                      ? `${formatRunningDistance(get(session, "distanceMeters", 0))} · ${formatRunningPace(get(session, "averagePaceSecondsPerKm"))}`
                      : `${formatDurationShort(get(session, "durationSeconds", 0))} · ${formatNumber(get(session, "estimatedCalories", 0))} kcal`}
                  </p>
                </div>
              );
            })}
            {recentWorkouts.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground md:col-span-2 xl:col-span-5">
                {t("user.workout.report.emptyRecent", "Завершенные тренировки появятся здесь.")}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default WorkoutReportPage;
