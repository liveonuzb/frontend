import React from "react";
import { get, map } from "lodash";
import { useNavigate } from "react-router";
import {
  ActivityIcon,
  ChevronRightIcon,
  RulerIcon,
  ScaleIcon,
} from "lucide-react";
import { useGetQuery } from "@/hooks/api";
import { getApiResponseData } from "@/lib/api-response";
import { normalizeUserOnboarding } from "@/lib/user-onboarding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_MEASUREMENTS_QUERY_KEY,
  DASHBOARD_ME_QUERY_KEY,
  getMeasurementSnapshot,
  getUserFromResponse,
} from "./query-helpers.js";

const BMI_SCALE_MIN = 10;
const BMI_SCALE_RANGE = 30;

const clampPct = (bmi) =>
  Math.min(
    Math.max(((bmi - BMI_SCALE_MIN) / BMI_SCALE_RANGE) * 100, 1.5),
    98.5,
  );

const getBmiMeta = (bmi) => {
  if (bmi === null) return null;
  if (bmi < 18.5)
    return {
      label: "Kam vazn",
      color: "#60a5fa",
      tw: {
        badge: "bg-blue-500/12 text-blue-400 border-blue-400/20",
      },
    };
  if (bmi < 25)
    return {
      label: "Normal",
      color: "#4ade80",
      tw: {
        badge: "bg-green-500/12 text-green-400 border-green-400/20",
      },
    };
  if (bmi < 30)
    return {
      label: "Ortiqcha",
      color: "#fbbf24",
      tw: {
        badge: "bg-amber-500/12 text-amber-400 border-amber-400/20",
      },
    };
  return {
    label: "Semizlik",
    color: "#f87171",
    tw: {
      badge: "bg-red-500/12 text-red-400 border-red-400/20",
    },
  };
};

const ZONES = [
  { color: "#93c5fd", pct: (8.5 / 30) * 100 },
  { color: "#86efac", pct: (6.5 / 30) * 100 },
  { color: "#fcd34d", pct: (5 / 30) * 100 },
  { color: "#fca5a5", pct: (10 / 30) * 100 },
];

const SCALE_LABELS = [
  { label: "10", pct: 0 },
  { label: "18.5", pct: (8.5 / 30) * 100 },
  { label: "25", pct: (15 / 30) * 100 },
  { label: "30", pct: (20 / 30) * 100 },
  { label: "40", pct: 100 },
];

export default function BmiWidget({
  currentWeightValue,
  heightCmValue,
  measurementSnapshot: measurementSnapshotOverride,
  onOpen,
  interactive = true,
}) {
  const navigate = useNavigate();
  const shouldFetchUser =
    measurementSnapshotOverride === undefined &&
    (currentWeightValue === undefined || heightCmValue === undefined);
  const shouldFetchMeasurements =
    measurementSnapshotOverride === undefined &&
    currentWeightValue === undefined;
  const { data: userData } = useGetQuery({
    url: "/users/me",
    queryProps: {
      queryKey: DASHBOARD_ME_QUERY_KEY,
      enabled: shouldFetchUser,
    },
  });
  const { data: measurementsData } = useGetQuery({
    url: "/measurements",
    queryProps: {
      queryKey: DASHBOARD_MEASUREMENTS_QUERY_KEY,
      enabled: shouldFetchMeasurements,
    },
  });
  const user = React.useMemo(() => getUserFromResponse(userData), [userData]);
  const onboarding = React.useMemo(
    () => normalizeUserOnboarding(get(user, "onboarding")),
    [user],
  );
  const measurementHistory = React.useMemo(
    () => getApiResponseData(measurementsData, []),
    [measurementsData],
  );
  const measurementSnapshot = React.useMemo(
    () =>
      measurementSnapshotOverride ??
      getMeasurementSnapshot({
        history: measurementHistory,
        onboarding,
        currentWeightValue,
        heightCmValue,
      }),
    [
      currentWeightValue,
      heightCmValue,
      measurementHistory,
      measurementSnapshotOverride,
      onboarding,
    ],
  );
  const currentW = get(measurementSnapshot, "currentWeight", 0);
  const heightCm = get(measurementSnapshot, "heightCm", 0);
  const bmi = get(measurementSnapshot, "bmi", null);
  const meta = getBmiMeta(bmi);
  const pct = bmi !== null ? clampPct(bmi) : 0;
  const handleClick = interactive
    ? (onOpen ?? (() => navigate("/user/measurements")))
    : undefined;

  return (
    <Card
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleClick?.();
              }
            }
          : undefined
      }
      className={cn(
        "group/card relative h-full overflow-hidden border border-border/60 py-3 ring-0 transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        interactive && "cursor-pointer",
      )}
    >
      {meta ? (
        <div
          className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full blur-[26px]"
          style={{
            background: `radial-gradient(circle, ${meta.color}22 0%, transparent 72%)`,
          }}
        />
      ) : null}
      <CardHeader className="relative z-10 px-4 pb-1.5">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex min-w-0 items-center gap-1.5 text-xs font-bold">
            <span className="rounded bg-primary/10 p-1 text-primary">
              <ActivityIcon className="size-3" />
            </span>
            <span className="truncate">BMI indeks</span>
          </CardTitle>
          {interactive ? (
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground/40" />
          ) : null}
        </div>
      </CardHeader>
      {bmi !== null && meta ? (
        <CardContent className="relative z-10 flex flex-1 flex-col gap-3 px-4 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Joriy BMI
              </p>
              <div className="mt-1 text-3xl font-black leading-none tabular-nums">
                {bmi.toFixed(1)}
              </div>
              <div
                className={cn(
                  "mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                  meta.tw.badge,
                )}
              >
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ background: meta.color }}
                />
                {meta.label}
              </div>
            </div>

            <div className="grid shrink-0 gap-1.5 text-right">
              <div className="rounded-xl border border-border/60 bg-background/60 px-2.5 py-1.5">
                <p className="flex items-center justify-end gap-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <RulerIcon className="size-3" />
                  Bo'y
                </p>
                <p className="text-sm font-black leading-tight">
                  {heightCm}
                  <span className="ml-0.5 text-[10px] font-semibold text-muted-foreground">
                    cm
                  </span>
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 px-2.5 py-1.5">
                <p className="flex items-center justify-end gap-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <ScaleIcon className="size-3" />
                  Vazn
                </p>
                <p className="text-sm font-black leading-tight">
                  {currentW.toFixed(1)}
                  <span className="ml-0.5 text-[10px] font-semibold text-muted-foreground">
                    kg
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-auto rounded-2xl border border-border/60 bg-background/60 p-2.5">
            <div className="mb-1.5 flex items-center justify-between gap-3 text-[10px] font-semibold text-muted-foreground">
              <span>BMI diapazon</span>
              <span>{meta.label}</span>
            </div>
            <div className="relative h-2">
              <div
                className="absolute top-0 -translate-x-1/2 transition-all duration-700 ease-out"
                style={{ left: `${pct}%` }}
              >
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: "5px solid transparent",
                    borderRight: "5px solid transparent",
                    borderTop: `7px solid ${meta.color}`,
                    filter: `drop-shadow(0 0 4px ${meta.color}88)`,
                  }}
                />
              </div>
            </div>

            <div className="flex h-2 w-full gap-[2px] overflow-hidden rounded-full">
              {map(ZONES, (zone, index) => (
                <div
                  key={index}
                  className="h-full transition-opacity duration-500"
                  style={{
                    width: `${zone.pct}%`,
                    background: zone.color,
                    opacity: 1,
                  }}
                />
              ))}
            </div>

            <div className="relative h-3">
              {map(SCALE_LABELS, ({ label, pct: labelPct }) => (
                <span
                  key={label}
                  className="absolute top-0 -translate-x-1/2 text-[9px] font-semibold text-muted-foreground/60"
                  style={{ left: `${labelPct}%` }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      ) : (
        <CardContent className="relative z-10 flex flex-1 flex-col items-center justify-center gap-2 px-4 pb-3 pt-1 text-center">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RulerIcon className="size-5" />
          </div>
          <div>
            <p className="text-sm font-bold">Ma'lumot yo'q</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              BMI hisoblash uchun
              <br />
              bo'y va vazn kiriting
            </p>
          </div>
          {interactive ? (
            <div className="inline-flex items-center gap-1 rounded-full border border-dashed border-border/70 px-3 py-1 text-[10px] font-semibold text-muted-foreground">
              Bosing va kiriting
              <ChevronRightIcon className="size-3" />
            </div>
          ) : null}
        </CardContent>
      )}
    </Card>
  );
}
