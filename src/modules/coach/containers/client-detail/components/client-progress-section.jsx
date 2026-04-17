import {
  filter,
  get,
  map,
  orderBy,
  round,
  size,
  slice,
} from "lodash";
import React from "react";
import {
  ActivityIcon,
  DropletsIcon,
  FlameIcon,
  FootprintsIcon,
  MoonIcon,
  SmileIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const formatShortDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "short",
  }).format(date);
};

const MOOD_MAP = {
  great: { label: "Ajoyib", color: "text-emerald-500" },
  good: { label: "Yaxshi", color: "text-green-500" },
  okay: { label: "Normal", color: "text-amber-500" },
  bad: { label: "Yomon", color: "text-orange-500" },
  terrible: { label: "Juda yomon", color: "text-red-500" },
};

const MACRO_COLORS = ["hsl(var(--primary))", "#f59e0b", "#10b981"];

const DailyActivityGrid = ({ dailyLogs }) => {
  const logs = slice(orderBy(dailyLogs, ["date"], ["desc"]), 0, 7);

  if (size(logs) === 0) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed py-12 text-sm text-muted-foreground">
        Kundalik log ma'lumotlari topilmadi
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {map(orderBy(logs, ["date"], ["asc"]), (log) => {
        const mood = get(MOOD_MAP, get(log, "mood", ""), null);
        return (
          <div
            key={get(log, "date")}
            className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 transition-colors hover:bg-muted/20"
          >
            <p className="w-16 shrink-0 text-xs font-bold text-muted-foreground">
              {formatShortDate(get(log, "date"))}
            </p>
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <MetricPill
                icon={FlameIcon}
                value={get(log, "calories")}
                suffix="kcal"
                color="text-orange-500"
              />
              <MetricPill
                icon={DropletsIcon}
                value={get(log, "waterMl")}
                suffix="ml"
                color="text-cyan-500"
              />
              <MetricPill
                icon={MoonIcon}
                value={get(log, "sleepHours")}
                suffix="soat"
                color="text-indigo-500"
              />
              <MetricPill
                icon={FootprintsIcon}
                value={get(log, "steps")}
                color="text-emerald-500"
              />
              <MetricPill
                icon={ActivityIcon}
                value={get(log, "workoutMinutes")}
                suffix="min"
                color="text-blue-500"
              />
              {mood ? (
                <span className={cn("text-xs font-semibold", mood.color)}>
                  <SmileIcon className="mr-1 inline size-3" />
                  {mood.label}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const MetricPill = ({ icon: Icon, value, suffix, color }) => {
  if (value === null || value === undefined) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", color)}>
      <Icon className="size-3" />
      {value}
      {suffix ? <span className="text-muted-foreground">{suffix}</span> : null}
    </span>
  );
};

const BodyMeasurementsChart = ({ measurements }) => {
  const sorted = orderBy(
    filter(measurements, (m) => get(m, "date")),
    ["date"],
    ["asc"],
  );

  if (size(sorted) < 2) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
        Kamida 2 ta o'lchov kerak
      </div>
    );
  }

  const keys = ["waist", "chest", "hips", "arm", "thigh"];
  const COLORS = {
    waist: "#ef4444",
    chest: "#3b82f6",
    hips: "#8b5cf6",
    arm: "#f59e0b",
    thigh: "#10b981",
  };
  const LABELS = {
    waist: "Bel",
    chest: "Ko'krak",
    hips: "Tos",
    arm: "Qo'l",
    thigh: "Son",
  };

  const activeKeys = filter(keys, (key) =>
    sorted.some((m) => Number(get(m, key, 0)) > 0),
  );

  if (size(activeKeys) === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
        Tana o'lchamlari topilmadi
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {map(activeKeys, (key) => (
          <div key={key} className="flex items-center gap-1.5">
            <div
              className="size-2.5 rounded-full"
              style={{ backgroundColor: COLORS[key] }}
            />
            <span className="text-[10px] font-semibold text-muted-foreground">
              {LABELS[key]}
            </span>
          </div>
        ))}
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={sorted}
            margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="hsl(var(--muted-foreground) / 0.1)"
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              minTickGap={30}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              domain={["dataMin - 2", "dataMax + 2"]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !get(payload, "length")) return null;
                return (
                  <div className="rounded-xl border bg-background/95 p-3 shadow-xl backdrop-blur-sm">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {formatShortDate(label)}
                    </p>
                    {map(payload, (entry) => (
                      <p
                        key={entry.dataKey}
                        className="text-xs"
                        style={{ color: entry.color }}
                      >
                        <span className="font-semibold">{LABELS[entry.dataKey]}:</span>{" "}
                        {entry.value} sm
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            {map(activeKeys, (key) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLORS[key]}
                strokeWidth={2}
                fill={COLORS[key]}
                fillOpacity={0.05}
                dot={{ r: 3, fill: "hsl(var(--background))", stroke: COLORS[key], strokeWidth: 2 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const MacroBreakdown = ({ dailyLogs }) => {
  const latest = get(dailyLogs, "[0]");
  const macros = get(latest, "macros");
  if (!macros) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed py-8 text-sm text-muted-foreground">
        Makro ma'lumot topilmadi
      </div>
    );
  }

  const protein = Number(get(macros, "protein", 0));
  const carbs = Number(get(macros, "carbs", 0));
  const fat = Number(get(macros, "fat", 0));
  const total = protein + carbs + fat;

  if (total === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed py-8 text-sm text-muted-foreground">
        Makro ma'lumot topilmadi
      </div>
    );
  }

  const data = [
    { name: "Protein", value: protein, color: MACRO_COLORS[0] },
    { name: "Karbohidrat", value: carbs, color: MACRO_COLORS[1] },
    { name: "Yog'", value: fat, color: MACRO_COLORS[2] },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="h-[140px] w-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={65}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {map(data, (entry, idx) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4">
        {map(data, (item) => (
          <div key={item.name} className="text-center">
            <div className="flex items-center justify-center gap-1">
              <div className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] font-semibold text-muted-foreground">
                {item.name}
              </span>
            </div>
            <p className="mt-0.5 text-sm font-black">{item.value}g</p>
            <p className="text-[10px] text-muted-foreground">
              {total > 0 ? round((item.value / total) * 100) : 0}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const WeeklyCalorieChart = ({ dailyLogs }) => {
  const logs = slice(orderBy(dailyLogs, ["date"], ["asc"]), -7);

  if (size(logs) === 0) return null;

  return (
    <div className="h-[160px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={logs} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="4 4"
            vertical={false}
            stroke="hsl(var(--muted-foreground) / 0.1)"
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatShortDate}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !get(payload, "length")) return null;
              return (
                <div className="rounded-xl border bg-background/95 p-3 shadow-xl backdrop-blur-sm">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {formatShortDate(label)}
                  </p>
                  <p className="text-sm font-black text-primary">
                    {get(payload, "[0].value", 0)} kcal
                  </p>
                </div>
              );
            }}
          />
          <Bar
            dataKey="calories"
            fill="hsl(var(--primary))"
            radius={[6, 6, 0, 0]}
            opacity={0.8}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

function ClientProgressSkeleton() { return (
  <div className="space-y-6">
    <div className="grid gap-6 xl:grid-cols-2">
      {[0, 1].map((i) => (
        <Card key={i} className="overflow-hidden rounded-[28px] border-none bg-card/60 py-6 shadow-sm backdrop-blur-sm">
          <CardHeader>
            <Skeleton className="h-5 w-48 rounded-lg" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-16 rounded-2xl" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid gap-6 xl:grid-cols-2">
      {[0, 1].map((i) => (
        <Card key={i} className="overflow-hidden rounded-[28px] border-none bg-card/60 py-6 shadow-sm backdrop-blur-sm">
          <CardHeader>
            <Skeleton className="h-5 w-40 rounded-lg" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full rounded-2xl" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
); }

const ClientProgressSection = ({ measurements = [], dailyLogs = [], isLoading }) => {
  if (isLoading) return <ClientProgressSkeleton />;

  const firstMeasurement = get(orderBy(measurements, ["date"], ["asc"]), "[0]");
  const lastMeasurement = get(orderBy(measurements, ["date"], ["desc"]), "[0]");
  const weightChange =
    firstMeasurement && lastMeasurement
      ? round(
          Number(get(lastMeasurement, "weight", 0)) -
            Number(get(firstMeasurement, "weight", 0)),
          1,
        )
      : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden rounded-[28px] border-none bg-card/60 py-6 shadow-sm backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Kundalik faollik (oxirgi 7 kun)</CardTitle>
              {weightChange !== null && weightChange !== 0 ? (
                <div
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold",
                    weightChange < 0
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-orange-500/10 text-orange-600",
                  )}
                >
                  {weightChange < 0 ? (
                    <TrendingDownIcon className="size-3" />
                  ) : (
                    <TrendingUpIcon className="size-3" />
                  )}
                  {weightChange > 0 ? "+" : ""}
                  {weightChange} kg
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <DailyActivityGrid dailyLogs={dailyLogs} />
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[28px] border-none bg-card/60 py-6 shadow-sm backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base">Tana o'lchamlari trendi</CardTitle>
          </CardHeader>
          <CardContent>
            <BodyMeasurementsChart measurements={measurements} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.6fr]">
        <Card className="overflow-hidden rounded-[28px] border-none bg-card/60 py-6 shadow-sm backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base">Haftalik kaloriya</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyCalorieChart dailyLogs={dailyLogs} />
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[28px] border-none bg-card/60 py-6 shadow-sm backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base">Makronutrientlar (bugun)</CardTitle>
          </CardHeader>
          <CardContent>
            <MacroBreakdown dailyLogs={dailyLogs} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientProgressSection;
