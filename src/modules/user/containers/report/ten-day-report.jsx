import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  TrendingUpIcon,
  TrophyIcon,
  SparklesIcon,
  TargetIcon,
  AlertTriangleIcon,
  FlameIcon,
  RouteIcon,
  TimerIcon,
} from "lucide-react";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import RechartsLine from "@/components/charts/line-chart";
import { CHART_COLORS } from "@/lib/chart-colors";
import useGetQuery from "@/hooks/api/use-get-query";
import { getApiResponseData } from "@/lib/api-response";
import { formatRunningDistance, formatRunningPace } from "@/lib/running-metrics";
import useBreadcrumbStore from "@/store/breadcrumb-store";
import ScoreCircle from "./components/score-circle.jsx";
import DayStatusDot from "./components/day-status-dot.jsx";
import {
  formatRangeLabel,
  formatShortDay,
  formatLongDate,
  METRIC_META,
  rangeReportQueryKey,
} from "./report-helpers.js";

const isDateKey = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const todayKey = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const toChartData = (series, dates) =>
  (series ?? []).map((value, index) => ({
    name: dates?.[index] ? formatShortDay(dates[index]) : String(index + 1),
    value,
  }));

const DeltaPill = ({ value }) => {
  if (value == null) return null;
  const positive = value > 0;
  const zero = value === 0;
  const cls = zero
    ? "bg-muted text-muted-foreground"
    : positive
      ? "bg-emerald-500/10 text-emerald-700"
      : "bg-amber-500/10 text-amber-700";
  const sign = zero ? "" : positive ? "+" : "";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {sign}
      {value}%
    </span>
  );
};

const HighlightCard = ({ title, value, icon }) => (
  <Card className="rounded-3xl shadow-sm">
    <CardContent className="flex items-center justify-between gap-3 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <p className="mt-1 text-lg font-black">{value}</p>
      </div>
      <div className="flex size-11 items-center justify-center rounded-2xl bg-muted/50">
        {icon}
      </div>
    </CardContent>
  </Card>
);

export default function TenDayReport() {
  const navigate = useNavigate();
  const { days: daysParam } = useParams();
  const [searchParams] = useSearchParams();
  const setBreadcrumbs = useBreadcrumbStore((s) => s.setBreadcrumbs);

  const days = React.useMemo(() => {
    const parsed = Number(daysParam);
    if (!Number.isFinite(parsed)) return 10;
    const value = Math.floor(parsed);
    if (value < 3) return 10;
    if (value > 60) return 60;
    return value;
  }, [daysParam]);

  const endDateKey = React.useMemo(() => {
    const raw = searchParams.get("endDate");
    return isDateKey(raw) ? raw : todayKey();
  }, [searchParams]);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user/dashboard", title: "Dashboard" },
      { url: `/user/report/range/${days}?endDate=${endDateKey}`, title: `${days} kunlik report` },
    ]);
    return () => setBreadcrumbs([]);
  }, [days, endDateKey, setBreadcrumbs]);

  const { data: response, isLoading } = useGetQuery({
    url: `/user/tracking/reports/range?days=${days}&endDate=${endDateKey}`,
    queryProps: {
      queryKey: rangeReportQueryKey(days, endDateKey),
    },
  });

  const report = getApiResponseData(response, null);
  const calendar = report?.daysCalendar ?? [];
  const dates = calendar.map((d) => d.date);
  const trends = report?.trends ?? {};
  const averages = report?.averages ?? {};
  const highlights = report?.highlights ?? {};
  const running = averages?.running ?? null;
  const hasRunning =
    Number(running?.distanceMeters ?? 0) > 0 ||
    Number(running?.durationMinutes ?? 0) > 0;

  const rangeLabel =
    report?.period?.startDate && report?.period?.endDate
      ? formatRangeLabel(report.period.startDate, report.period.endDate)
      : null;

  return (
    <PageTransition>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pb-10 md:px-8">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => navigate(-1)}
            aria-label="Orqaga"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold">
              {days} kunlik hisobot
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {rangeLabel ?? formatLongDate(endDateKey)}
            </p>
          </div>
        </div>

        {/* Overall score */}
        <Card className="rounded-3xl shadow-sm">
          <CardContent className="grid gap-4 p-5 md:grid-cols-[auto_1fr] md:items-center">
            {isLoading ? (
              <>
                <Skeleton className="h-36 w-36 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="h-4 w-80" />
                </div>
              </>
            ) : (
              <>
                <ScoreCircle score={report?.overallScore ?? 0} label="Sog'liq ball" />
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <TrendingUpIcon className="size-4" />
                    {report?.successfulDays ?? 0}/{days} yaxshi kunlar
                  </div>
                  <h2 className="mt-3 text-lg font-black leading-tight md:text-xl">
                    {report?.overallScore >= 90
                      ? "Zo'r! Juda yaxshi progress."
                      : report?.overallScore >= 70
                        ? "Yaxshi ish! Yana ham yaxshilash mumkin."
                        : "Boshlanishi yaxshi. Kichik qadamlar bilan o'samiz."}
                  </h2>
                  {highlights?.weight?.delta != null ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Vazn o'zgarishi:{" "}
                      <span className="font-semibold">
                        {highlights.weight.delta > 0 ? "+" : ""}
                        {highlights.weight.delta} kg
                      </span>
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Calendar dots */}
        <Card className="rounded-3xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Kunlar bo'yicha natija</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <>
                <div className="flex flex-wrap justify-between gap-2">
                  {calendar.map((day) => (
                    <DayStatusDot
                      key={day.date}
                      dayNumber={new Date(day.date).getDate()}
                      dayLabel={formatShortDay(day.date)}
                      status={day.status}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block size-2 rounded-full bg-emerald-500" />
                    Yaxshi
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block size-2 rounded-full bg-amber-500" />
                    O'rtacha
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block size-2 rounded-full bg-red-500" />
                    Yomon
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {hasRunning ? (
          <Card className="rounded-3xl shadow-sm">
            <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <RouteIcon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black">Running</p>
                  <p className="text-xs text-muted-foreground">
                    {Number(running?.count ?? 0)} runs
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl bg-muted/30 px-3 py-2 text-center">
                  <p className="text-[11px] text-muted-foreground">Masofa</p>
                  <p className="mt-1 text-sm font-black">
                    {formatRunningDistance(running?.distanceMeters)}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/30 px-3 py-2 text-center">
                  <p className="text-[11px] text-muted-foreground">Vaqt</p>
                  <p className="mt-1 inline-flex items-center justify-center gap-1 text-sm font-black">
                    <TimerIcon className="size-3.5 text-muted-foreground" />
                    {Math.round(Number(running?.durationMinutes) || 0)} min
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/30 px-3 py-2 text-center">
                  <p className="text-[11px] text-muted-foreground">Pace</p>
                  <p className="mt-1 text-sm font-black">
                    {formatRunningPace(running?.averagePaceSecondsPerKm)}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/30 px-3 py-2 text-center">
                  <p className="text-[11px] text-muted-foreground">Calories</p>
                  <p className="mt-1 inline-flex items-center justify-center gap-1 text-sm font-black">
                    <FlameIcon className="size-3.5 text-muted-foreground" />
                    {Math.round(Number(running?.burnedCalories) || 0)} kcal
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Trend cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["water", "water"],
            ["protein", "protein"],
            ["calories", "calories"],
            ["carbs", "carbs"],
            ["fat", "fat"],
            ["fastFood", "fastFood"],
          ].map(([key, trendKey], index) => {
            const meta = METRIC_META[key];
            const avg = averages?.[key] ?? null;
            const series = trends?.[trendKey] ?? [];
            const chartData = toChartData(series, dates);
            const label = meta?.label ?? key;
            const Icon = meta?.icon;
            const avgText =
              avg && meta
                ? meta.formatActual(avg.value ?? 0)
                : avg?.value != null
                  ? String(avg.value)
                  : "—";

            return (
              <Card key={key} className="rounded-3xl shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-9 items-center justify-center rounded-2xl bg-muted/50">
                        {Icon ? <Icon className={`size-4 ${meta.color}`} /> : null}
                      </div>
                      <div>
                        <CardTitle className="text-sm">{label}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          O'rtacha: <span className="font-semibold">{avgText}</span>
                        </p>
                      </div>
                    </div>
                    <DeltaPill value={avg?.deltaPct ?? null} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {isLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : (
                    <RechartsLine
                      data={chartData}
                      dataKey="value"
                      height={110}
                      showGrid={false}
                      showTooltip={false}
                      showArea
                      dot={false}
                      color={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Highlights */}
        <div className="grid gap-4 md:grid-cols-3">
          <HighlightCard
            title="Eng yaxshi kun"
            value={highlights?.bestDay?.date ? formatLongDate(highlights.bestDay.date) : "—"}
            icon={<TrophyIcon className="size-5 text-amber-600" />}
          />
          <HighlightCard
            title="Eng qiyin kun"
            value={highlights?.worstDay?.date ? formatLongDate(highlights.worstDay.date) : "—"}
            icon={<AlertTriangleIcon className="size-5 text-red-500" />}
          />
          <HighlightCard
            title="O'rtacha ball"
            value={`${report?.overallScore ?? 0}/100`}
            icon={<TrendingUpIcon className="size-5 text-primary" />}
          />
        </div>

        {/* Improvements */}
        <Card className="rounded-3xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2Icon className="size-4 text-emerald-600" />
              Yaxshi tomondan o'zgarishlar
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (report?.improvements?.length ?? 0) > 0 ? (
              report.improvements.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 rounded-2xl bg-emerald-500/5 p-3">
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Hozircha aniq yaxshilanishlar ko'rinmadi. Ko'proq tracking qiling.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="rounded-3xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <SparklesIcon className="size-4 text-primary" />
              Nimalarni yaxshilash mumkin?
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (report?.recommendations?.length ?? 0) > 0 ? (
              report.recommendations.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-2xl border bg-card p-3"
                >
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <TargetIcon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {item.severity === "major" ? "Muhim" : "Kichik"}
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Tavsiyalar yo'q. Hamma narsa yaxshi ketayapti.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Next goals */}
        <Card className="rounded-3xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TargetIcon className="size-4 text-primary" />
              Keyingi {days} kunlik maqsadlar
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-3 py-2">
                  <span>Suv</span>
                  <span className="font-semibold text-foreground">
                    {report?.nextGoals?.waterMl ?? 0} ml
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-3 py-2">
                  <span>Protein</span>
                  <span className="font-semibold text-foreground">
                    {report?.nextGoals?.proteinG ?? 0} g
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-3 py-2">
                  <span>Qadam</span>
                  <span className="font-semibold text-foreground">
                    {report?.nextGoals?.stepsDaily ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-3 py-2">
                  <span>Fast food (max)</span>
                  <span className="font-semibold text-foreground">
                    {report?.nextGoals?.fastFoodMax ?? 0} marta
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="pt-2">
          <Button
            type="button"
            className="h-11 w-full rounded-full"
            onClick={() => navigate("/user/dashboard")}
          >
            Davom etaman
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
