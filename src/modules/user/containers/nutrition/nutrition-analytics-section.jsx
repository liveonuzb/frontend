import React from "react";
import map from "lodash/map";
import filter from "lodash/filter";
import includes from "lodash/includes";
import isArray from "lodash/isArray";
import orderBy from "lodash/orderBy";
import reduce from "lodash/reduce";
import toNumber from "lodash/toNumber";
import find from "lodash/find";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  AlertTriangleIcon,
  BarChart3Icon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  DropletsIcon,
  DownloadIcon,
  FlameIcon,
  TargetIcon,
  TrophyIcon,
} from "lucide-react";
import { useGetQuery } from "@/hooks/api";
import useApi from "@/hooks/api/use-api.js";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SOURCE_META } from "./source-meta.js";
import { toast } from "sonner";

const PERIOD_OPTIONS = [
  { value: 7, label: "7 kun" },
  { value: 14, label: "14 kun" },
  { value: 30, label: "30 kun" },
];

export const NUTRITION_REPORT_EXPORT_EVENT = "nutrition-report-export";
export const NUTRITION_REPORT_TOGGLE_COMPARISON_EVENT =
  "nutrition-report-toggle-comparison";

const MACRO_SERIES = [
  { key: "Oqsil (g)", goalKey: "protein", label: "Oqsil", color: "#ef4444" },
  { key: "Uglevod (g)", goalKey: "carbs", label: "Uglevod", color: "#f59e0b" },
  { key: "Yog' (g)", goalKey: "fat", label: "Yog'", color: "#3b82f6" },
];

const TREND_CARD_SERIES = [
  { key: "Oqsil (g)", label: "Protein", unit: "g", color: "#ef4444" },
  { key: "Uglevod (g)", label: "Carbs", unit: "g", color: "#f59e0b" },
  { key: "Yog' (g)", label: "Fat", unit: "g", color: "#3b82f6" },
  { key: "Suv (ml)", label: "Water", unit: "ml", color: "#06b6d4" },
];

const SOURCE_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];
const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};
const AXIS_TICK = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };
const GRID_STROKE = "hsl(var(--border))";
const CALORIE_CHART_MARGIN = { top: 4, right: 4, left: -24, bottom: 0 };
const MACRO_CHART_MARGIN = { top: 4, right: 8, left: -24, bottom: 0 };
const REPORT_CARD_CLASS =
  "border-primary/10 bg-card/95 shadow-sm shadow-primary/5";
const REPORT_PANEL_CLASS =
  "border-primary/10 bg-background/60 shadow-sm shadow-primary/5";
const REPORT_CONTROL_FOCUS_CLASS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const getSourceLabel = (source) =>
  SOURCE_META[source]?.label || SOURCE_META.manual.label;

const toDateKey = (date) => date.toISOString().slice(0, 10);

const getDefaultCustomRange = () => {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return { start: toDateKey(start), end: toDateKey(end) };
};

const formatDay = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("uz-UZ", { month: "short", day: "numeric" });
};

const downloadBlob = (filename, blob) => {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const getHeaderValue = (headers, name) =>
  headers?.[name] || headers?.[name.toLowerCase()] || headers?.get?.(name);

const getExportFileName = ({ response, format, period }) => {
  const disposition = getHeaderValue(response?.headers, "content-disposition");
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(
    disposition || "",
  );

  if (match?.[1]) {
    return decodeURIComponent(match[1]);
  }

  const start = period.startDate || "start";
  const end = period.endDate || "end";
  return `nutrition-report-${start}-${end}.${format}`;
};

const getWeekComparisonRanges = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysSinceMonday = (today.getDay() + 6) % 7;
  const currentStart = new Date(today);
  currentStart.setDate(today.getDate() - daysSinceMonday);

  const currentEnd = new Date(currentStart);
  currentEnd.setDate(currentStart.getDate() + 6);

  const previousStart = new Date(currentStart);
  previousStart.setDate(currentStart.getDate() - 7);

  const previousEnd = new Date(currentStart);
  previousEnd.setDate(currentStart.getDate() - 1);

  return {
    current: {
      startDate: toDateKey(currentStart),
      endDate: toDateKey(currentEnd),
    },
    previous: {
      startDate: toDateKey(previousStart),
      endDate: toDateKey(previousEnd),
    },
  };
};

const WEEKDAY_LABELS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

const averageCalories = (items = []) => {
  const logged = filter(items, (item) => toNumber(item.calories || 0) > 0);
  if (logged.length === 0) return 0;
  return Math.round(
    reduce(logged, (sum, item) => sum + toNumber(item.calories || 0), 0) /
      logged.length,
  );
};

const formatSignedCalories = (value) => {
  if (value === 0) return "0 kcal";
  return `${value > 0 ? "+" : ""}${value} kcal`;
};

const formatSignedDailyCalories = (value) => {
  if (value === 0) return "0 kcal/kun";
  return `${value > 0 ? "+" : ""}${value} kcal/kun`;
};

const getPeriodSummaryTitle = (periodDays) => {
  if (periodDays >= 28) {
    return "Oylik xulosa";
  }

  if (periodDays <= 7) {
    return "Haftalik xulosa";
  }

  return `${periodDays} kunlik xulosa`;
};

const getGoalPercent = (value, periodDays) => {
  const daysCount = toNumber(periodDays) || 0;
  if (daysCount <= 0) return 0;

  return Math.min(100, Math.round(((toNumber(value) || 0) / daysCount) * 100));
};

const HighlightCard = React.memo(({ icon: Icon, label, title, description, tone }) => (
  <div className={cn("rounded-2xl border px-4 py-3", REPORT_CARD_CLASS)}>
    <div className="flex items-center gap-2">
      <span className={cn("grid size-8 place-items-center rounded-full", tone)}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-black">{title}</p>
      </div>
    </div>
    <p className="mt-2 text-xs text-muted-foreground">{description}</p>
  </div>
));
HighlightCard.displayName = "HighlightCard";

const CustomTooltip = React.memo(({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1 font-semibold">{label}</p>
      {map(payload, (entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
});
CustomTooltip.displayName = "CustomTooltip";

const StatBadge = React.memo(({ label, value, goal, unit, color }) => {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <div className={cn("rounded-2xl border px-4 py-3 space-y-1.5", REPORT_CARD_CLASS)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-xl font-black", color)}>
        {value}
        <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>
      </p>
      {goal > 0 ? (
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: "currentColor" }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">{pct}%</span>
        </div>
      ) : null}
    </div>
  );
});
StatBadge.displayName = "StatBadge";

const PeriodSummaryPanel = React.memo(({ period, periodDays, summary, goals }) => {
  const daysTracked = toNumber(summary.daysTracked) || 0;
  const calorieGoalMet = toNumber(summary.caloriesGoalMet) || 0;
  const waterGoalMet = toNumber(summary.waterGoalMet) || 0;
  const calorieDelta = Math.round(
    (toNumber(summary.avgCalories) || 0) - (toNumber(goals.calories) || 0),
  );
  const waterDelta = Math.round(
    (toNumber(summary.avgWaterMl) || 0) - (toNumber(goals.waterMl) || 0),
  );
  const calorieGoalPercent = getGoalPercent(calorieGoalMet, periodDays);
  const waterGoalPercent = getGoalPercent(waterGoalMet, periodDays);
  const periodRange =
    period.startDate && period.endDate
      ? `${formatDay(period.startDate)} - ${formatDay(period.endDate)}`
      : `${periodDays} kun`;

  return (
    <section
      className={cn("rounded-2xl border p-4", REPORT_PANEL_CLASS)}
      aria-label={getPeriodSummaryTitle(periodDays)}
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">
              <CalendarDaysIcon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-black">
                {getPeriodSummaryTitle(periodDays)}
              </h3>
              <p className="truncate text-[11px] text-muted-foreground">
                {periodRange}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold">
            {periodDays} kundan {daysTracked} kuni kuzatilgan
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Maqsad bajarilgan kunlar va o'rtacha tafovut shu davr bo'yicha
            hisoblandi.
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-muted-foreground">
              Kaloriya farqi
            </span>
            <span
              className={cn(
                "text-sm font-black",
                calorieDelta > 0
                  ? "text-orange-600 dark:text-orange-300"
                  : "text-emerald-600 dark:text-emerald-300",
              )}
            >
              {formatSignedDailyCalories(calorieDelta)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${calorieGoalPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Maqsad: {calorieGoalMet} / {periodDays} kun
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <DropletsIcon className="size-3.5" aria-hidden="true" />
              Suv maqsadi
            </span>
            <span
              className={cn(
                "text-sm font-black",
                waterDelta >= 0
                  ? "text-sky-600 dark:text-sky-300"
                  : "text-orange-600 dark:text-orange-300",
              )}
            >
              {waterGoalMet} / {periodDays}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-sky-500"
              style={{ width: `${waterGoalPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            O'rtacha suv: {summary.avgWaterMl ?? 0} ml/kun
          </p>
        </div>
      </div>
    </section>
  );
});
PeriodSummaryPanel.displayName = "PeriodSummaryPanel";

const PlanAdherencePanel = React.memo(({ planAdherence }) => {
  if (!planAdherence) {
    return null;
  }

  const adherencePercent = toNumber(planAdherence.adherencePercent) || 0;
  const matchedMeals = toNumber(planAdherence.matchedMeals) || 0;
  const plannedMeals = toNumber(planAdherence.plannedMeals) || 0;
  const fullyMatchedDays = toNumber(planAdherence.fullyMatchedDays) || 0;
  const plannedDays = toNumber(planAdherence.plannedDays) || 0;

  return (
    <section
      className={cn("rounded-2xl border p-4", REPORT_PANEL_CLASS)}
      aria-label="Rejaga amal qilish"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
              <CheckCircle2Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-black">Rejaga amal qilish</h3>
              <p className="truncate text-[11px] text-muted-foreground">
                {planAdherence.planName || "Faol ovqatlanish rejasi"}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold">
            {matchedMeals} / {plannedMeals} ovqat mos
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {fullyMatchedDays} / {plannedDays} kun to'liq mos
          </p>
        </div>
        <div className="min-w-[160px] space-y-2">
          <div className="flex items-end justify-between gap-3">
            <span className="text-xs font-bold text-muted-foreground">
              Moslik
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-300">
              {adherencePercent}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${Math.min(100, adherencePercent)}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
});
PlanAdherencePanel.displayName = "PlanAdherencePanel";

const SourceBreakdownChart = React.memo(({ sourceChartData, topSource }) => {
  if (sourceChartData.length === 0) return null;

  return (
    <div className={cn("grid gap-4 rounded-2xl border p-4 lg:grid-cols-[220px_1fr]", REPORT_PANEL_CLASS)}>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sourceChartData}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={78}
              paddingAngle={2}
            >
              {map(sourceChartData, (entry, index) => (
                <Cell
                  key={entry.name}
                  fill={SOURCE_COLORS[index % SOURCE_COLORS.length]}
                />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col justify-center gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Ovqat manbai
          </p>
          <h3 className="mt-1 text-base font-black">
            {topSource
              ? `Ovqatlaringizning ${topSource.percent}% ${topSource.name} orqali kiritilgan`
              : "Manba breakdown"}
          </h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {map(sourceChartData, (item, index) => (
            <div
              key={item.name}
              className={cn("flex items-center justify-between rounded-xl border px-3 py-2", REPORT_CARD_CLASS)}
            >
              <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                <span
                  className="size-2.5 rounded-full"
                  style={{
                    backgroundColor: SOURCE_COLORS[index % SOURCE_COLORS.length],
                  }}
                />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="text-xs font-bold text-muted-foreground">
                {item.percent}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
SourceBreakdownChart.displayName = "SourceBreakdownChart";

const CalorieBarChart = React.memo(({ chartData, calorieGoal }) => {
  if (chartData.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Kunlik kaloriya (kcal)
      </p>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={16} margin={CALORIE_CHART_MARGIN}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={GRID_STROKE}
            />
            <XAxis
              dataKey="date"
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
            {calorieGoal > 0 ? (
              <ReferenceLine
                y={calorieGoal}
                stroke="hsl(var(--primary))"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
            ) : null}
            <RechartsTooltip content={<CustomTooltip />} />
            <Bar
              dataKey="Kaloriya"
              fill="hsl(var(--primary))"
              radius={[6, 6, 0, 0]}
              opacity={0.85}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {calorieGoal > 0 ? (
        <p className="text-[10px] text-muted-foreground text-right">
          — maqsad: {calorieGoal} kcal
        </p>
      ) : null}
    </div>
  );
});
CalorieBarChart.displayName = "CalorieBarChart";

const WeekComparisonChart = React.memo(
  ({ comparisonChartData, averageCaloriesDelta }) => (
    <div className={cn("space-y-3 rounded-2xl border p-4", REPORT_PANEL_CLASS)}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold text-foreground">
            Bu hafta vs o'tgan hafta
          </p>
          <p className="text-[11px] text-muted-foreground">
            Kunlik kaloriya ustma-ust solishtirildi
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-bold",
            averageCaloriesDelta >= 0
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "bg-red-500/10 text-red-700 dark:text-red-300",
          )}
        >
          {averageCaloriesDelta >= 0 ? "+" : ""}
          {averageCaloriesDelta} kcal/kun o'rtacha
        </span>
      </div>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={comparisonChartData}
            barSize={14}
            margin={CALORIE_CHART_MARGIN}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={GRID_STROKE}
            />
            <XAxis
              dataKey="date"
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Bar
              dataKey="O'tgan hafta"
              fill="#94a3b8"
              radius={[5, 5, 0, 0]}
              opacity={0.7}
            />
            <Bar
              dataKey="Bu hafta"
              fill="hsl(var(--primary))"
              radius={[5, 5, 0, 0]}
              opacity={0.9}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  ),
);
WeekComparisonChart.displayName = "WeekComparisonChart";

const MacroTrendChart = React.memo(
  ({ chartData, goals, activeMacros, onToggleMacro }) => {
    const visibleMacros = React.useMemo(
      () => filter(MACRO_SERIES, (macro) => includes(activeMacros, macro.key)),
      [activeMacros],
    );

    if (chartData.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-muted-foreground">
            Makrolar trendi (g)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {map(MACRO_SERIES, (macro) => {
              const active = includes(activeMacros, macro.key);
              return (
                <button
                  key={macro.key}
                  type="button"
                  onClick={() => onToggleMacro(macro.key)}
                  className={cn(
                    "rounded-xl border px-2.5 py-1 text-xs font-medium transition-colors",
                    REPORT_CONTROL_FOCUS_CLASS,
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {macro.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={MACRO_CHART_MARGIN}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={GRID_STROKE}
              />
              <XAxis
                dataKey="date"
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
              {map(visibleMacros, (macro) =>
                goals[macro.goalKey] > 0 ? (
                  <ReferenceLine
                    key={`goal-${macro.key}`}
                    y={goals[macro.goalKey]}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth={1.25}
                    ifOverflow="extendDomain"
                  />
                ) : null)}
              <RechartsTooltip content={<CustomTooltip />} />
              {map(visibleMacros, (macro) => (
                <Line
                  key={macro.key}
                  type="monotone"
                  dataKey={macro.key}
                  name={macro.label}
                  stroke={macro.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-right text-[10px] text-muted-foreground">
          Qizil kesma chiziqlar — tanlangan makrolar maqsadi
        </p>
      </div>
    );
  },
);
MacroTrendChart.displayName = "MacroTrendChart";

const MacroTrendCards = React.memo(({ chartData }) => {
  if (chartData.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {map(TREND_CARD_SERIES, (item) => {
        const values = map(chartData, (entry) => toNumber(entry[item.key] || 0));
        const first = find(values, (value) => value > 0) || 0;
        const last = find([...values].reverse(), (value) => value > 0) || 0;
        const delta =
          first > 0 ? Math.round(((last - first) / first) * 100) : 0;
        const average = values.length
          ? Math.round(reduce(values, (sum, value) => sum + value, 0) / values.length)
          : 0;

        return (
          <div key={item.key} className={cn("rounded-2xl border px-4 py-3", REPORT_CARD_CLASS)}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1 text-lg font-black">
                  {average}
                  <span className="ml-1 text-xs text-muted-foreground">
                    {item.unit}
                  </span>
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-xs font-bold",
                  delta >= 0
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "bg-red-500/10 text-red-700 dark:text-red-300",
                )}
              >
                {delta >= 0 ? "+" : ""}
                {delta}%
              </span>
            </div>
            <div className="mt-3 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <Line
                    type="monotone"
                    dataKey={item.key}
                    stroke={item.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
});
MacroTrendCards.displayName = "MacroTrendCards";

const ChartSkeleton = () => (
  <div
    role="status"
    aria-label="Hisobot yuklanmoqda"
    className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6 space-y-4"
  >
    <Skeleton className="h-5 w-40 rounded-lg" />
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {map([0, 1, 2, 3], (i) => (
        <Skeleton key={i} className="h-20 rounded-2xl" />
      ))}
    </div>
    <Skeleton className="h-40 w-full rounded-2xl" />
  </div>
);

export default function NutritionAnalyticsSection() {
  const { request } = useApi();
  const [days, setDays] = React.useState(7);
  const [rangeMode, setRangeMode] = React.useState("preset");
  const [customRange, setCustomRange] = React.useState(getDefaultCustomRange);
  const [comparisonEnabled, setComparisonEnabled] = React.useState(false);
  const [activeMacros, setActiveMacros] = React.useState(() =>
    map(MACRO_SERIES, (item) => item.key),
  );

  const hasCustomRange =
    rangeMode === "custom" && customRange.start && customRange.end;
  const hasValidCustomRange =
    hasCustomRange && customRange.start <= customRange.end;
  const reportParams = hasValidCustomRange
    ? { startDate: customRange.start, endDate: customRange.end }
    : { days };

  const { data, isLoading } = useGetQuery({
    url: "/daily-tracking/reports/health",
    params: reportParams,
    queryProps: {
      queryKey: [
        "daily-tracking",
        "health-report",
        rangeMode,
        days,
        customRange.start,
        customRange.end,
      ],
    },
  });

  const comparisonRanges = React.useMemo(() => getWeekComparisonRanges(), []);
  const { data: currentWeekData } = useGetQuery({
    url: "/daily-tracking/reports/health",
    params: comparisonRanges.current,
    queryProps: {
      queryKey: [
        "daily-tracking",
        "health-report",
        "comparison",
        "current",
        comparisonRanges.current.startDate,
        comparisonRanges.current.endDate,
      ],
      enabled: comparisonEnabled,
    },
  });
  const { data: previousWeekData } = useGetQuery({
    url: "/daily-tracking/reports/health",
    params: comparisonRanges.previous,
    queryProps: {
      queryKey: [
        "daily-tracking",
        "health-report",
        "comparison",
        "previous",
        comparisonRanges.previous.startDate,
        comparisonRanges.previous.endDate,
      ],
      enabled: comparisonEnabled,
    },
  });

  const report = data?.data ?? EMPTY_OBJECT;
  const daily = report.daily ?? EMPTY_ARRAY;
  const summary = report.summary ?? EMPTY_OBJECT;
  const goals = report.goals ?? EMPTY_OBJECT;
  const sourceBreakdown = report.sourceBreakdown ?? EMPTY_ARRAY;
  const period = report.period ?? EMPTY_OBJECT;
  const periodDays = period.days ?? days;

  const chartData = React.useMemo(
    () =>
      map(daily, (entry) => ({
        date: formatDay(entry.date),
        "Kaloriya": entry.calories,
        "Oqsil (g)": entry.protein,
        "Uglevod (g)": entry.carbs,
        "Yog' (g)": entry.fat,
        "Suv (ml)": entry.waterMl,
      })),
    [daily],
  );
  const currentWeekDaily = currentWeekData?.data?.daily ?? EMPTY_ARRAY;
  const previousWeekDaily = previousWeekData?.data?.daily ?? EMPTY_ARRAY;
  const comparisonChartData = React.useMemo(
    () =>
      map(WEEKDAY_LABELS, (label, index) => ({
        date: label,
        "Bu hafta": Math.round(currentWeekDaily[index]?.calories ?? 0),
        "O'tgan hafta": Math.round(previousWeekDaily[index]?.calories ?? 0),
      })),
    [currentWeekDaily, previousWeekDaily],
  );
  const currentWeekAverageCalories = React.useMemo(
    () => averageCalories(currentWeekDaily),
    [currentWeekDaily],
  );
  const previousWeekAverageCalories = React.useMemo(
    () => averageCalories(previousWeekDaily),
    [previousWeekDaily],
  );
  const averageCaloriesDelta = React.useMemo(
    () => currentWeekAverageCalories - previousWeekAverageCalories,
    [currentWeekAverageCalories, previousWeekAverageCalories],
  );
  const sourceChartData = React.useMemo(
    () =>
      map(sourceBreakdown, (item) => ({
        name: getSourceLabel(item.source),
        value: item.count,
        percent: item.percent,
      })),
    [sourceBreakdown],
  );
  const topSource = React.useMemo(
    () => sourceChartData[0] || null,
    [sourceChartData],
  );
  const trackedCalorieDays = React.useMemo(
    () => filter(daily, (entry) => toNumber(entry.calories || 0) > 0),
    [daily],
  );
  const dayHighlights = React.useMemo(() => {
    const calorieGoal = toNumber(goals.calories || 0);
    if (!calorieGoal || trackedCalorieDays.length === 0) {
      return null;
    }

    const withDiff = map(trackedCalorieDays, (entry) => ({
      ...entry,
      diff: Math.round(toNumber(entry.calories || 0) - calorieGoal),
      absDiff: Math.abs(toNumber(entry.calories || 0) - calorieGoal),
    }));
    const best = orderBy(withDiff, ["absDiff"], ["asc"])[0];
    const hardest = orderBy(withDiff, ["absDiff"], ["desc"])[0];

    return { best, hardest };
  }, [goals.calories, trackedCalorieDays]);
  const handleExportReport = React.useCallback(
    async (format = "csv") => {
      try {
        const params = hasValidCustomRange
          ? {
              startDate: customRange.start,
              endDate: customRange.end,
              format,
            }
          : {
              days,
              format,
            };
        const response = await request.get(
          "/daily-tracking/reports/nutrition/export",
          {
            params,
            responseType: "blob",
          },
        );
        const blob =
          response.data instanceof Blob
            ? response.data
            : new Blob([response.data], {
                type:
                  format === "pdf"
                    ? "application/pdf"
                    : "text/csv;charset=utf-8",
              });

        downloadBlob(
          getExportFileName({ response, format, period }),
          blob,
        );
        toast.success(
          format === "pdf"
            ? "PDF hisobot yuklab olindi"
            : "CSV hisobot yuklab olindi",
        );
      } catch {
        toast.error("Hisobotni eksport qilib bo'lmadi");
      }
    },
    [
      customRange.end,
      customRange.start,
      days,
      hasValidCustomRange,
      period,
      request,
    ],
  );

  const toggleMacro = React.useCallback((key) => {
    setActiveMacros((current) => {
      if (includes(current, key)) {
        return current.length === 1
          ? current
          : filter(current, (item) => item !== key);
      }
      return [...current, key];
    });
  }, []);

  React.useEffect(() => {
    const handleExternalExport = () => {
      void handleExportReport("csv");
    };
    const handleExternalComparisonToggle = () =>
      setComparisonEnabled((value) => !value);

    window.addEventListener(NUTRITION_REPORT_EXPORT_EVENT, handleExternalExport);
    window.addEventListener(
      NUTRITION_REPORT_TOGGLE_COMPARISON_EVENT,
      handleExternalComparisonToggle,
    );

    return () => {
      window.removeEventListener(
        NUTRITION_REPORT_EXPORT_EVENT,
        handleExternalExport,
      );
      window.removeEventListener(
        NUTRITION_REPORT_TOGGLE_COMPARISON_EVENT,
        handleExternalComparisonToggle,
      );
    };
  }, [handleExportReport]);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (daily.length === 0) {
    return (
      <div className={cn("rounded-[28px] border p-6 text-center sm:p-8", REPORT_CARD_CLASS)}>
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <BarChart3Icon className="size-6" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-black">
          Hisobot uchun ma'lumot yo'q
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Ovqat yoki suv yozsangiz, kaloriya, makro va suv trendlaringiz shu
          yerda ko'rinadi.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-[28px] border p-5 sm:p-6 space-y-5", REPORT_CARD_CLASS)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FlameIcon className="size-4 text-orange-500" />
          <h2 className="text-base font-bold">Ovqatlanish statistikasi</h2>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => {
              void handleExportReport("csv");
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border border-border bg-transparent px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
              REPORT_CONTROL_FOCUS_CLASS,
            )}
            aria-label="Nutrition report CSV eksport qilish"
          >
            <DownloadIcon className="size-3.5" />
            CSV
          </button>
          <button
            type="button"
            onClick={() => {
              void handleExportReport("pdf");
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border border-border bg-transparent px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
              REPORT_CONTROL_FOCUS_CLASS,
            )}
            aria-label="Nutrition report PDF eksport qilish"
          >
            <DownloadIcon className="size-3.5" />
            PDF
          </button>
          {map(PERIOD_OPTIONS, (opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setRangeMode("preset");
                setDays(opt.value);
              }}
              className={cn(
                "rounded-xl border px-2.5 py-1 text-xs font-medium transition-colors",
                REPORT_CONTROL_FOCUS_CLASS,
                rangeMode === "preset" && days === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setRangeMode("custom")}
            className={cn(
              "rounded-xl border px-2.5 py-1 text-xs font-medium transition-colors",
              REPORT_CONTROL_FOCUS_CLASS,
              rangeMode === "custom"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            Boshqa
          </button>
          <button
            type="button"
            onClick={() => setComparisonEnabled((value) => !value)}
            className={cn(
              "rounded-xl border px-2.5 py-1 text-xs font-medium transition-colors",
              REPORT_CONTROL_FOCUS_CLASS,
              comparisonEnabled
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            Hafta solishtirish
          </button>
        </div>
      </div>
      {rangeMode === "custom" ? (
        <div className={cn("space-y-2 rounded-2xl border p-3", REPORT_PANEL_CLASS)}>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="date"
              aria-label="Hisobot boshlanish sanasi"
              value={customRange.start}
              max={customRange.end || undefined}
              onChange={(event) =>
                setCustomRange((current) => ({
                  ...current,
                  start: event.target.value,
                }))
              }
              className={cn(
                "h-10 rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary",
                REPORT_CONTROL_FOCUS_CLASS,
              )}
            />
            <input
              type="date"
              aria-label="Hisobot tugash sanasi"
              value={customRange.end}
              min={customRange.start || undefined}
              onChange={(event) =>
                setCustomRange((current) => ({
                  ...current,
                  end: event.target.value,
                }))
              }
              className={cn(
                "h-10 rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary",
                REPORT_CONTROL_FOCUS_CLASS,
              )}
            />
          </div>
          {!hasValidCustomRange ? (
            <p className="text-xs font-medium text-destructive">
              Sana oralig'ini to'g'ri tanlang.
            </p>
          ) : null}
        </div>
      ) : null}
      {/* Stat badges */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBadge
          label="O'rt. kaloriya"
          value={summary.avgCalories ?? 0}
          goal={goals.calories ?? 0}
          unit="kcal"
          color="text-orange-500"
        />
        <StatBadge
          label="O'rt. oqsil"
          value={summary.avgProtein ?? 0}
          goal={goals.protein ?? 0}
          unit="g"
          color="text-blue-500"
        />
        <div className={cn("rounded-2xl border px-4 py-3 space-y-1.5", REPORT_CARD_CLASS)}>
          <p className="text-xs text-muted-foreground">Maqsad bajarildi</p>
          <p className="text-xl font-black text-emerald-500">
            {summary.caloriesGoalMet ?? 0}
            <span className="text-xs font-normal text-muted-foreground ml-1">kun</span>
          </p>
          <div className="flex items-center gap-1.5">
            <TargetIcon className="size-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {periodDays} kundan
            </span>
          </div>
        </div>
        <div className={cn("rounded-2xl border px-4 py-3 space-y-1.5", REPORT_CARD_CLASS)}>
          <p className="text-xs text-muted-foreground">Kuzatilgan kunlar</p>
          <p className="text-xl font-black text-primary">
            {summary.daysTracked ?? 0}
            <span className="text-xs font-normal text-muted-foreground ml-1">kun</span>
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">
              {periodDays} kundan {summary.daysTracked ?? 0} ta
            </span>
          </div>
        </div>
      </div>
      <PeriodSummaryPanel
        period={period}
        periodDays={periodDays}
        summary={summary}
        goals={goals}
      />
      <PlanAdherencePanel planAdherence={report.planAdherence} />
      {dayHighlights ? (
        <div className="grid gap-3 lg:grid-cols-3">
          <HighlightCard
            icon={TrophyIcon}
            label="Eng yaxshi kun"
            title={formatDay(dayHighlights.best.date)}
            description={`${Math.round(
              dayHighlights.best.calories,
            )} kcal, maqsaddan ${formatSignedCalories(dayHighlights.best.diff)}`}
            tone="bg-emerald-500/10 text-emerald-600"
          />
          <HighlightCard
            icon={AlertTriangleIcon}
            label="Eng qiyin kun"
            title={formatDay(dayHighlights.hardest.date)}
            description={`${Math.round(
              dayHighlights.hardest.calories,
            )} kcal, maqsaddan ${formatSignedCalories(dayHighlights.hardest.diff)}`}
            tone="bg-red-500/10 text-red-600"
          />
          <HighlightCard
            icon={BarChart3Icon}
            label="O'rtacha kun"
            title={`${summary.avgCalories ?? 0} kcal`}
            description={`Tipik kun: ${summary.avgProtein ?? 0}g oqsil, maqsad ${goals.calories ?? 0} kcal`}
            tone="bg-blue-500/10 text-blue-600"
          />
        </div>
      ) : null}
      <SourceBreakdownChart
        sourceChartData={sourceChartData}
        topSource={topSource}
      />
      <CalorieBarChart
        chartData={chartData}
        calorieGoal={goals.calories ?? 0}
      />
      <MacroTrendCards chartData={chartData} />
      {comparisonEnabled ? (
        <WeekComparisonChart
          comparisonChartData={comparisonChartData}
          averageCaloriesDelta={averageCaloriesDelta}
        />
      ) : null}
      <MacroTrendChart
        chartData={chartData}
        goals={goals}
        activeMacros={activeMacros}
        onToggleMacro={toggleMacro}
      />
    </div>
  );
}
