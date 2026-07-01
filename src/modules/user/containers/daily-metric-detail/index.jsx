import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeftIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  LinkIcon,
  RefreshCwIcon,
  SmartphoneIcon,
  TargetIcon,
  TrophyIcon,
  UnplugIcon,
} from "lucide-react";
import {
  clamp,
  filter,
  get,
  map,
  reduce,
  reverse,
  takeRight,
} from "lodash";
import PageTransition from "@/components/page-transition";
import RechartsBar from "@/components/charts/bar-chart.jsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetQuery } from "@/hooks/api";
import { useDailyTrackingDay } from "@/hooks/app/use-daily-tracking";
import useHealthGoals from "@/hooks/app/use-health-goals";
import useHealthSync from "@/hooks/app/use-health-sync";
import { getApiResponseData } from "@/lib/api-response";
import { cn } from "@/lib/utils";
import { useBreadcrumbStore } from "@/store";
import {
  getUserAccentCardClassName,
  userCardScopeClassName,
} from "@/modules/user/lib/card-styles";
import MetricEntryDrawer from "./metric-entry-drawer.jsx";
import {
  METRICS,
  isDateKey,
  toFiniteNumber,
  todayKey,
} from "./metric-config.js";
import { toast } from "sonner";

const average = (values) =>
  values.length
    ? reduce(values, (total, value) => total + toFiniteNumber(value), 0) /
      values.length
    : 0;

const goalStreakFromEnd = (values, goal) => {
  let streak = 0;

  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (toFiniteNumber(values[index]) < goal) {
      break;
    }
    streak += 1;
  }

  return streak;
};

const buildChartData = ({ dates, values, formatValue, chartKey }) =>
  map(values, (value, index) => ({
    name: dates[index]?.slice(5) ?? String(index + 1),
    value: toFiniteNumber(value),
    [chartKey]: toFiniteNumber(value),
    label: formatValue(value),
  }));

const MetricStatCard = ({ label, value, Icon }) => (
  <Card className={getUserAccentCardClassName("rounded-[1.35rem]")}>
    <CardContent className="flex min-h-[104px] flex-col justify-between gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <Icon className="size-4 text-primary" aria-hidden="true" />
      </div>
      <p className="text-xl font-black leading-tight">{value}</p>
    </CardContent>
  </Card>
);

const formatSyncDate = (value) => {
  if (!value) {
    return "Hali sync qilinmagan";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Hali sync qilinmagan";
  }

  return `Oxirgi sync: ${date.toLocaleString("uz-UZ", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

const DeviceSyncCard = ({ dateKey }) => {
  const {
    status,
    isConnecting,
    isSyncing,
    isDisconnecting,
    connectGoogle,
    syncGoogle,
    disconnectGoogle,
  } = useHealthSync();
  const google = get(status, "google", {});
  const connected = Boolean(get(google, "connected", false));
  const lastError = get(google, "lastError", null);

  const handleConnect = async () => {
    try {
      const result = await connectGoogle();
      if (result?.url) {
        window.location.assign(result.url);
      }
    } catch {
      toast.error("Google Health ulanishi boshlanmadi");
    }
  };

  const handleSync = async () => {
    try {
      await syncGoogle({ startDate: dateKey, endDate: dateKey });
      toast.success("Google Health sync yangilandi");
    } catch {
      toast.error("Google Health sync amalga oshmadi");
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectGoogle();
      toast.success("Google Health uzildi");
    } catch {
      toast.error("Google Health uzilmadi");
    }
  };

  return (
    <Card className={getUserAccentCardClassName("rounded-[1.75rem]")}>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <SmartphoneIcon className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="font-bold">Google Health</p>
              <p className="text-sm text-muted-foreground">
                {connected
                  ? formatSyncDate(get(google, "lastSyncAt"))
                  : "Qadam va uyqu ma'lumotlarini Google orqali ulang."}
              </p>
              {lastError ? (
                <p className="mt-1 text-xs font-semibold text-destructive">
                  {lastError}
                </p>
              ) : null}
            </div>
          </div>
          {connected ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-10 rounded-full"
                aria-label="Google Health sync qilish"
                disabled={isSyncing || isDisconnecting}
                onClick={handleSync}
              >
                <RefreshCwIcon className="size-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10 rounded-full"
                aria-label="Google Health uzish"
                disabled={isSyncing || isDisconnecting}
                onClick={handleDisconnect}
              >
                <UnplugIcon className="size-4" aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="shrink-0 rounded-full"
              disabled={isConnecting}
              onClick={handleConnect}
            >
              <LinkIcon data-icon="inline-start" />
              Google Health ulash
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/35 px-3 py-3">
          <div className="min-w-0">
            <p className="font-bold">Apple Health</p>
            <p className="text-sm text-muted-foreground">
              iOS app bilan keyingi bosqichda ulanadi.
            </p>
          </div>
          <Button type="button" variant="outline" disabled>
            iOS app bilan keyingi bosqichda
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const DailyMetricDetailPage = ({ metric }) => {
  const config = METRICS[metric] ?? METRICS.steps;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const rawDate = searchParams.get("date");
  const dateKey = isDateKey(rawDate) ? rawDate : todayKey();
  const { dayData, isLoading: isDayLoading } = useDailyTrackingDay(dateKey);
  const { goals } = useHealthGoals();

  const { data: reportResponse, isLoading: isReportLoading } = useGetQuery({
    url: "/user/nutrition/reports/range",
    params: { days: 30, endDate: dateKey },
    queryProps: {
      queryKey: ["user", "daily-metric-detail", metric, dateKey, 30],
    },
  });

  const currentValue = config.normalizeValue(get(dayData, config.valueKey, 0));
  const currentGoal = config.normalizeValue(get(goals, config.goalKey, 0));
  const report = getApiResponseData(reportResponse, null);
  const dates = map(get(report, "daysCalendar", []), (item) => get(item, "date"));
  const trendValues = map(
    get(report, `trends.${config.trendKey}`, []),
    toFiniteNumber,
  );
  const chartData = buildChartData({
    dates,
    values: trendValues,
    formatValue: config.formatValue,
    chartKey: config.chartKey,
  });
  const trailingSeven = takeRight(trendValues, 7);
  const bestValue = trendValues.length
    ? Math.max(...map(trendValues, toFiniteNumber))
    : 0;
  const goalDays = filter(
    trendValues,
    (item) => toFiniteNumber(item) >= currentGoal,
  ).length;
  const sevenDayAverage = average(trailingSeven);
  const thirtyDayAverage = toFiniteNumber(
    get(
      report,
      metric === "steps" ? "averages.steps.value" : "averages.sleep.value",
      average(trendValues),
    ),
  );
  const goalStreak = goalStreakFromEnd(trendValues, currentGoal);
  const progress = clamp(
    currentGoal > 0 ? (currentValue / currentGoal) * 100 : 0,
    0,
    100,
  );
  const recentDays = reverse([...takeRight(chartData, 6)]);
  const Icon = config.Icon;

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user/dashboard", title: "Dashboard" },
      { url: `/user/${metric}?date=${dateKey}`, title: config.title },
    ]);
  }, [config.title, dateKey, metric, setBreadcrumbs]);

  const handleDateChange = (nextDate) => {
    if (isDateKey(nextDate)) {
      setSearchParams({ date: nextDate });
    }
  };

  return (
    <PageTransition mode="slide-up">
      <div className={cn(userCardScopeClassName, "flex flex-col gap-5 pb-24")}>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 rounded-full"
            onClick={() => navigate(-1)}
            aria-label="Orqaga"
          >
            <ArrowLeftIcon className="size-5" aria-hidden="true" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black">{config.title}</h1>
            <p className="text-sm text-muted-foreground">{config.subtitle}</p>
          </div>
        </div>

        <Card className={getUserAccentCardClassName("rounded-[1.75rem]")}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-muted-foreground">
                  Bugungi natija
                </p>
                {isDayLoading ? (
                  <Skeleton className="mt-2 h-9 w-28" />
                ) : (
                  <p className="mt-2 text-4xl font-black leading-none tracking-tight">
                    {config.formatValue(currentValue)}
                  </p>
                )}
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  Maqsad: {config.formatGoal(currentGoal)}
                </p>
              </div>
              <div className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-7" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <MetricEntryDrawer
          metric={metric}
          dateKey={dateKey}
          currentGoal={currentGoal}
          currentValue={currentValue}
          onDateChange={handleDateChange}
        >
          <Button type="button" className="h-12 rounded-full">
            <CheckCircle2Icon data-icon="inline-start" />
            Kiritish
          </Button>
        </MetricEntryDrawer>

        <Card className={getUserAccentCardClassName("rounded-[1.75rem]")}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">30 kunlik trend</CardTitle>
              <BarChart3Icon className="size-5 text-primary" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            {isReportLoading ? (
              <Skeleton className="h-48 w-full rounded-2xl" />
            ) : (
              <RechartsBar
                data={chartData}
                dataKey={config.chartKey}
                height={220}
                color="var(--color-primary)"
                gradientColor="var(--color-primary)"
              />
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <MetricStatCard
            label="7 kunlik o'rtacha"
            value={config.formatValue(sevenDayAverage)}
            Icon={BarChart3Icon}
          />
          <MetricStatCard
            label="30 kunlik o'rtacha"
            value={config.formatValue(thirtyDayAverage)}
            Icon={TargetIcon}
          />
          <MetricStatCard
            label={config.bestLabel}
            value={config.formatValue(bestValue)}
            Icon={TrophyIcon}
          />
          <MetricStatCard
            label="Maqsad bajarilgan kunlar"
            value={`${goalDays}/30`}
            Icon={CheckCircle2Icon}
          />
        </div>

        <Card className={getUserAccentCardClassName("rounded-[1.75rem]")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Oxirgi kunlar</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {map(recentDays, (day) => (
              <div
                key={day.name}
                className="flex items-center justify-between gap-3 rounded-2xl bg-muted/40 px-3 py-2"
              >
                <span className="text-sm font-semibold text-muted-foreground">
                  {day.name}
                </span>
                <span className="text-sm font-bold">{day.label}</span>
              </div>
            ))}
            <p className="pt-1 text-xs font-medium text-muted-foreground">
              Joriy streak: {goalStreak} kun
            </p>
          </CardContent>
        </Card>

        <DeviceSyncCard dateKey={dateKey} />
      </div>
    </PageTransition>
  );
};

export default DailyMetricDetailPage;
