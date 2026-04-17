import React from "react";
import { map } from "lodash";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { FlameIcon, TargetIcon } from "lucide-react";
import { useGetQuery } from "@/hooks/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS = [
  { value: 7, label: "7 kun" },
  { value: 14, label: "14 kun" },
  { value: 30, label: "30 kun" },
];

const formatDay = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("uz-UZ", { month: "short", day: "numeric" });
};

const CustomTooltip = ({ active, payload, label }) => {
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
};

const StatBadge = ({ label, value, goal, unit, color }) => {
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
};

export default function NutritionAnalyticsSection() {
  const [days, setDays] = React.useState(7);

  const { data, isLoading } = useGetQuery({
    url: "/daily-tracking/reports/health",
    params: { days },
    queryProps: { queryKey: ["daily-tracking", "health-report", days] },
  });

  const report = data?.data;
  const daily = report?.daily ?? [];
  const summary = report?.summary ?? {};
  const goals = report?.goals ?? {};

  const chartData = map(daily, (entry) => ({
    date: formatDay(entry.date),
    "Kaloriya": entry.calories,
    "Oqsil (g)": entry.protein,
  }));

  if (isLoading) {
    return (
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
        <div className="flex items-center gap-1.5">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDays(opt.value)}
              className={cn(
                "rounded-xl border px-2.5 py-1 text-xs font-medium transition-colors",
                days === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

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
              {days} kundan
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
              {days} kundan {summary.daysTracked ?? 0} ta
            </span>
          </div>
        </div>
      </div>

      {/* Calorie bar chart */}
      {chartData.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Kunlik kaloriya (kcal)</p>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={16} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                {goals.calories > 0 ? (
                  <ReferenceLine
                    y={goals.calories}
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
          {goals.calories > 0 ? (
            <p className="text-[10px] text-muted-foreground text-right">
              — maqsad: {goals.calories} kcal
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
