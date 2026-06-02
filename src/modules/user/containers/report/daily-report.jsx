import React from "react";
import { useNavigate, useParams } from "react-router";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  FlameIcon,
  RouteIcon,
  TimerIcon,
} from "lucide-react";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetQuery } from "@/hooks/api";
import { getApiResponseData } from "@/lib/api-response";
import { formatRunningDistance, formatRunningPace } from "@/lib/running-metrics";
import useBreadcrumbStore from "@/store/breadcrumb-store";
import MetricCard from "./components/metric-card.jsx";
import ScoreCircle from "./components/score-circle.jsx";
import {
  dailyReportQueryKey,
  formatLongDate,
  getYesterdayKey,
  METRIC_META,
} from "./report-helpers.js";

import map from "lodash/map";
import toNumber from "lodash/toNumber";

const isDateKey = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const resolveDailyMetrics = (report) => report?.metrics ?? null;

const formatRunningMinutes = (minutes) => `${Math.round(toNumber(minutes) || 0)} min`;

const progressPctFor = (metricKey, metric) => {
  if (!metric) return 0;
  if (metricKey === "fastFood") {
    const count = metric.count ?? 0;
    if (count <= 0) return 100;
    if (count === 1) return 40;
    return 10;
  }
  const goal = metric.goal ?? 0;
  if (!goal || goal <= 0) return 0;
  const actual = metric.actual ?? 0;
  return Math.min(100, Math.max(0, Math.round((actual / goal) * 100)));
};

const StatusBadge = ({ status }) => {
  const config =
    status === "good"
      ? { icon: <CheckCircle2Icon className="size-4 text-emerald-600" />, text: "Yaxshi kun", cls: "bg-emerald-500/10 text-emerald-700" }
      : status === "average"
        ? { icon: <AlertTriangleIcon className="size-4 text-amber-600" />, text: "O'rtacha kun", cls: "bg-amber-500/10 text-amber-700" }
        : { icon: <AlertTriangleIcon className="size-4 text-red-600" />, text: "Yaxshilash kerak", cls: "bg-red-500/10 text-red-700" };

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${config.cls}`}>
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
};

export default function DailyReport() {
  const navigate = useNavigate();
  const { date: dateParam } = useParams();
  const setBreadcrumbs = useBreadcrumbStore((s) => s.setBreadcrumbs);

  const dateKey = React.useMemo(() => {
    if (isDateKey(dateParam)) return dateParam;
    return getYesterdayKey();
  }, [dateParam]);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user/dashboard", title: "Dashboard" },
      { url: `/user/report/daily/${dateKey}`, title: "Kunlik natija" },
    ]);

    return () => setBreadcrumbs([]);
  }, [dateKey, setBreadcrumbs]);

  const { data: response, isLoading } = useGetQuery({
    url: `/user/tracking/reports/daily?date=${dateKey}`,
    queryProps: {
      queryKey: dailyReportQueryKey(dateKey),
    },
  });

  const report = getApiResponseData(response, null);
  const metrics = resolveDailyMetrics(report);
  const hasData = Boolean(report?.hasData);
  const runningMetrics = metrics?.running ?? null;
  const hasRunningMetrics =
    toNumber(runningMetrics?.distanceMeters ?? 0) > 0 ||
    toNumber(runningMetrics?.durationMinutes ?? 0) > 0;

  const trackedKeys = ["water", "calories", "protein", "carbs", "fat", "fastFood"];

  return (
    <PageTransition>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 pb-10 md:px-8">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0"
            onClick={() => navigate(-1)}
            aria-label="Orqaga"
          >
            <ArrowLeftIcon className="size-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold">Kunlik natija</h1>
            <p className="truncate text-sm text-muted-foreground">
              {formatLongDate(dateKey)}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-4 shadow-sm md:p-5">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="space-y-2">
                <Skeleton className="h-5 w-52" />
                <Skeleton className="h-4 w-80" />
              </div>
              <Skeleton className="size-36 rounded-full" />
            </div>
          ) : hasData ? (
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="min-w-0">
                <StatusBadge status={report?.status} />
                <h2 className="mt-3 text-lg font-black leading-tight md:text-xl">
                  {report?.summary || "Natija tayyor"}
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Kechagi ko'rsatkichlaringiz maqsadlar bilan solishtirildi.
                </p>
              </div>
              <ScoreCircle score={report?.score ?? 0} label="Ball" />
            </div>
          ) : (
            <div className="grid gap-2">
              <h2 className="text-lg font-black">Bu kun uchun log yo'q</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Kechagi kunda ovqat/suv/faollik qayd etilmagan. Bugundan boshlab
                trackingni boshlang.
              </p>
              <div className="pt-2">
                <Button type="button" onClick={() => navigate("/user/dashboard")}>
                  Dashboardga qaytish
                </Button>
              </div>
            </div>
          )}
        </div>

        {hasData ? (
          <div className="grid gap-4 md:grid-cols-2">
            {map(trackedKeys, (key) => {
              const meta = METRIC_META[key];
              if (!meta) return null;
              const item = key === "fastFood" ? metrics?.fastFood : metrics?.[key];
              const actualValue = key === "fastFood" ? item?.count ?? 0 : item?.actual ?? 0;
              const goalValue = key === "fastFood" ? null : item?.goal ?? null;
              const goalHint =
                key === "fastFood"
                  ? "Fast food"
                  : goalValue != null
                    ? `Maqsad: ${meta.formatGoal(goalValue)}`
                    : null;

              return (
                <MetricCard
                  key={key}
                  icon={
                    meta.icon ? (
                      <meta.icon className={`size-5 ${meta.color}`} />
                    ) : null
                  }
                  label={meta.label}
                  goalHint={goalHint}
                  actualText={meta.formatActual(actualValue)}
                  status={item?.status}
                  statusLabel={item?.label}
                  delta={item?.delta}
                  progressPct={progressPctFor(key, item)}
                />
              );
            })}
          </div>
        ) : null}

        {hasData && hasRunningMetrics ? (
          <div className="rounded-3xl border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <RouteIcon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black">Running</p>
                  <p className="text-xs text-muted-foreground">
                    {runningMetrics?.label || "Yakunlangan yugurish"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl bg-muted/30 px-3 py-2 text-center">
                  <p className="text-[11px] text-muted-foreground">Masofa</p>
                  <p className="mt-1 text-sm font-black">
                    {formatRunningDistance(runningMetrics?.distanceMeters)}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/30 px-3 py-2 text-center">
                  <p className="text-[11px] text-muted-foreground">Vaqt</p>
                  <p className="mt-1 inline-flex items-center justify-center gap-1 text-sm font-black">
                    <TimerIcon className="size-3.5 text-muted-foreground" />
                    {formatRunningMinutes(runningMetrics?.durationMinutes)}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/30 px-3 py-2 text-center">
                  <p className="text-[11px] text-muted-foreground">Pace</p>
                  <p className="mt-1 text-sm font-black">
                    {formatRunningPace(runningMetrics?.averagePaceSecondsPerKm)}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/30 px-3 py-2 text-center">
                  <p className="text-[11px] text-muted-foreground">Calories</p>
                  <p className="mt-1 inline-flex items-center justify-center gap-1 text-sm font-black">
                    <FlameIcon className="size-3.5 text-muted-foreground" />
                    {Math.round(toNumber(runningMetrics?.burnedCalories) || 0)} kcal
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {hasData ? (
          <div className="flex flex-col gap-3 pt-2 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
              10 kunlik trendlarni ham ko‘rib chiqing.
            </p>
            <Button
              type="button"
              className="h-11 rounded-full px-6"
              onClick={() => navigate("/user/report/range/10")}
            >
              Batafsil tahlil
            </Button>
          </div>
        ) : null}
      </div>
    </PageTransition>
  );
}
