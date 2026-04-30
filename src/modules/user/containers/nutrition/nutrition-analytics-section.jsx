import React from "react";
import { map } from "lodash";
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
  DownloadIcon,
  FlameIcon,
  TargetIcon,
  TrophyIcon,
} from "lucide-react";
import { useGetQuery } from "@/hooks/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SOURCE_META } from "./source-meta.js";

const PERIOD_OPTIONS = [
  { value: 7, label: "7 kun" },
  { value: 14, label: "14 kun" },
  { value: 30, label: "30 kun" },
];

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

const getSourceLabel = (source) => {
  if (source === "coach-meal-plan") return SOURCE_META["meal-plan"].label;
  return SOURCE_META[source]?.label || SOURCE_META.manual.label;
};

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

const escapeCsvCell = (value) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const toCsv = (rows) =>
  rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");

const downloadCsv = (filename, csv) => {
  if (typeof document === "undefined") return;
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const buildNutritionCsv = ({ daily, summary, goals, period, sourceBreakdown }) => {
  const mealRows = daily.flatMap((entry) => {
    const meals = Array.isArray(entry.meals) ? entry.meals : [];
    if (meals.length === 0) {
      return [
        [
          entry.date,
          "",
          "",
          "",
          "",
          Math.round(Number(entry.calories || 0)),
          Math.round(Number(entry.protein || 0)),
          Math.round(Number(entry.carbs || 0)),
          Math.round(Number(entry.fat || 0)),
          "",
        ],
      ];
    }

    return meals.map((meal) => [
      entry.date,
      meal.addedAt || "",
      meal.mealType || "",
      meal.name || "",
      meal.source || "",
      Math.round(Number(meal.calories || 0)),
      Math.round(Number(meal.protein || 0)),
      Math.round(Number(meal.carbs || 0)),
      Math.round(Number(meal.fat || 0)),
      Math.round(Number(meal.fiber || 0)),
    ]);
  });
  const rows = [
    ["Liveon nutrition report"],
    ["start_date", period.startDate || ""],
    ["end_date", period.endDate || ""],
    ["days", period.days || ""],
    [],
    ["meals"],
    [
      "date",
      "added_at",
      "meal_type",
      "food_name",
      "source",
      "calories",
      "protein_g",
      "carbs_g",
      "fat_g",
      "fiber_g",
    ],
    ...mealRows,
    [],
    ["daily_totals"],
    [
      "date",
      "calories",
      "protein_g",
      "carbs_g",
      "fat_g",
      "water_ml",
      "steps",
      "workout_minutes",
      "sleep_hours",
      "mood",
    ],
    ...daily.map((entry) => [
      entry.date,
      Math.round(Number(entry.calories || 0)),
      Math.round(Number(entry.protein || 0)),
      Math.round(Number(entry.carbs || 0)),
      Math.round(Number(entry.fat || 0)),
      Math.round(Number(entry.waterMl || 0)),
      Math.round(Number(entry.steps || 0)),
      Math.round(Number(entry.workoutMinutes || 0)),
      entry.sleepHours || "",
      entry.mood || "",
    ]),
    [],
    ["summary"],
    ["avg_calories", summary.avgCalories ?? 0],
    ["avg_protein_g", summary.avgProtein ?? 0],
    ["avg_water_ml", summary.avgWaterMl ?? 0],
    ["avg_steps", summary.avgSteps ?? 0],
    ["avg_workout_minutes", summary.avgWorkoutMinutes ?? 0],
    ["avg_sleep_hours", summary.avgSleepHours ?? 0],
    ["calories_goal_met_days", summary.caloriesGoalMet ?? 0],
    ["water_goal_met_days", summary.waterGoalMet ?? 0],
    ["steps_goal_met_days", summary.stepsGoalMet ?? 0],
    ["workout_goal_met_days", summary.workoutGoalMet ?? 0],
    [],
    ["goals"],
    ["calories", goals.calories ?? ""],
    ["protein_g", goals.protein ?? ""],
    ["water_ml", goals.waterMl ?? ""],
    ["steps", goals.steps ?? ""],
    ["workout_minutes", goals.workoutMinutes ?? ""],
    ["sleep_hours", goals.sleepHours ?? ""],
    [],
    ["source_breakdown"],
    ["source", "label", "count", "percent"],
    ...sourceBreakdown.map((item) => [
      item.source,
      getSourceLabel(item.source),
      item.count,
      item.percent,
    ]),
  ];

  return toCsv(rows);
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
  const logged = items.filter((item) => Number(item.calories || 0) > 0);
  if (logged.length === 0) return 0;
  return Math.round(
    logged.reduce((sum, item) => sum + Number(item.calories || 0), 0) /
      logged.length,
  );
};

const formatSignedCalories = (value) => {
  if (value === 0) return "0 kcal";
  return `${value > 0 ? "+" : ""}${value} kcal`;
};

const HighlightCard = React.memo(({ icon: Icon, label, title, description, tone }) => (
  <div className="rounded-2xl border bg-card px-4 py-3">
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
      {payload.map((entry, i) => (
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
    <div className="rounded-2xl border bg-card px-4 py-3 space-y-1.5">
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

const SourceBreakdownChart = React.memo(({ sourceChartData, topSource }) => {
  if (sourceChartData.length === 0) return null;

  return (
    <div className="grid gap-4 rounded-2xl border bg-muted/15 p-4 lg:grid-cols-[220px_1fr]">
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
              {sourceChartData.map((entry, index) => (
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
          {sourceChartData.map((item, index) => (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-xl border bg-card px-3 py-2"
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
    <div className="space-y-3 rounded-2xl border bg-muted/15 p-4">
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
      () => MACRO_SERIES.filter((macro) => activeMacros.includes(macro.key)),
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
            {MACRO_SERIES.map((macro) => {
              const active = activeMacros.includes(macro.key);
              return (
                <button
                  key={macro.key}
                  type="button"
                  onClick={() => onToggleMacro(macro.key)}
                  className={cn(
                    "rounded-xl border px-2.5 py-1 text-xs font-medium transition-colors",
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
              {visibleMacros.map((macro) =>
                goals[macro.goalKey] > 0 ? (
                  <ReferenceLine
                    key={`goal-${macro.key}`}
                    y={goals[macro.goalKey]}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth={1.25}
                    ifOverflow="extendDomain"
                  />
                ) : null,
              )}
              <RechartsTooltip content={<CustomTooltip />} />
              {visibleMacros.map((macro) => (
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
      {TREND_CARD_SERIES.map((item) => {
        const values = chartData.map((entry) => Number(entry[item.key] || 0));
        const first = values.find((value) => value > 0) || 0;
        const last = [...values].reverse().find((value) => value > 0) || 0;
        const delta =
          first > 0 ? Math.round(((last - first) / first) * 100) : 0;
        const average = values.length
          ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
          : 0;

        return (
          <div key={item.key} className="rounded-2xl border bg-card px-4 py-3">
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
  <div className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6 space-y-4">
    <Skeleton className="h-5 w-40 rounded-lg" />
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-20 rounded-2xl" />
      ))}
    </div>
    <Skeleton className="h-40 w-full rounded-2xl" />
  </div>
);

export default function NutritionAnalyticsSection() {
  const [days, setDays] = React.useState(7);
  const [rangeMode, setRangeMode] = React.useState("preset");
  const [customRange, setCustomRange] = React.useState(getDefaultCustomRange);
  const [comparisonEnabled, setComparisonEnabled] = React.useState(false);
  const [activeMacros, setActiveMacros] = React.useState(() =>
    MACRO_SERIES.map((item) => item.key),
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
      WEEKDAY_LABELS.map((label, index) => ({
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
      sourceBreakdown.map((item) => ({
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
    () => daily.filter((entry) => Number(entry.calories || 0) > 0),
    [daily],
  );
  const dayHighlights = React.useMemo(() => {
    const calorieGoal = Number(goals.calories || 0);
    if (!calorieGoal || trackedCalorieDays.length === 0) {
      return null;
    }

    const withDiff = trackedCalorieDays.map((entry) => ({
      ...entry,
      diff: Math.round(Number(entry.calories || 0) - calorieGoal),
      absDiff: Math.abs(Number(entry.calories || 0) - calorieGoal),
    }));
    const best = [...withDiff].sort((left, right) => left.absDiff - right.absDiff)[0];
    const hardest = [...withDiff].sort(
      (left, right) => right.absDiff - left.absDiff,
    )[0];

    return { best, hardest };
  }, [goals.calories, trackedCalorieDays]);
  const handleExportCsv = React.useCallback(() => {
    const start = period.startDate || "start";
    const end = period.endDate || "end";
    const csv = buildNutritionCsv({
      daily,
      summary,
      goals,
      period,
      sourceBreakdown,
    });

    downloadCsv(`nutrition-report-${start}-${end}.csv`, csv);
  }, [daily, goals, period, sourceBreakdown, summary]);

  const toggleMacro = React.useCallback((key) => {
    setActiveMacros((current) => {
      if (current.includes(key)) {
        return current.length === 1
          ? current
          : current.filter((item) => item !== key);
      }
      return [...current, key];
    });
  }, []);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (daily.length === 0) return null;

  return (
    <div className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FlameIcon className="size-4 text-orange-500" />
          <h2 className="text-base font-bold">Ovqatlanish statistikasi</h2>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-transparent px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <DownloadIcon className="size-3.5" />
            CSV
          </button>
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setRangeMode("preset");
                setDays(opt.value);
              }}
              className={cn(
                "rounded-xl border px-2.5 py-1 text-xs font-medium transition-colors",
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
        <div className="space-y-2 rounded-2xl border bg-muted/20 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="date"
              value={customRange.start}
              max={customRange.end || undefined}
              onChange={(event) =>
                setCustomRange((current) => ({
                  ...current,
                  start: event.target.value,
                }))
              }
              className="h-10 rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
            />
            <input
              type="date"
              value={customRange.end}
              min={customRange.start || undefined}
              onChange={(event) =>
                setCustomRange((current) => ({
                  ...current,
                  end: event.target.value,
                }))
              }
              className="h-10 rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
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
        <div className="rounded-2xl border bg-card px-4 py-3 space-y-1.5">
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
        <div className="rounded-2xl border bg-card px-4 py-3 space-y-1.5">
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
