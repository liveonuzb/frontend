import React from "react";
import { useNavigate } from "react-router";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const firstFinite = (...values) => {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return 0;
};

const BMI_SCALE_MIN = 10;
const BMI_SCALE_RANGE = 30;

const clampPct = (bmi) =>
  Math.min(
    Math.max(((bmi - BMI_SCALE_MIN) / BMI_SCALE_RANGE) * 100, 1.5),
    98.5,
  );

const getBmiMeta = (bmi) => {
  if (bmi === null) return null;
  if (bmi < 18.5) {
    return {
      label: "Kam vazn",
      color: "#60a5fa",
      tw: {
        bg: "bg-blue-500/8",
        badge: "border-blue-400/20 bg-blue-500/12 text-blue-400",
        glow: "from-blue-500/20",
      },
    };
  }
  if (bmi < 25) {
    return {
      label: "Normal",
      color: "#4ade80",
      tw: {
        bg: "bg-green-500/8",
        badge: "border-green-400/20 bg-green-500/12 text-green-400",
        glow: "from-green-500/20",
      },
    };
  }
  if (bmi < 30) {
    return {
      label: "Ortiqcha",
      color: "#fbbf24",
      tw: {
        bg: "bg-amber-500/8",
        badge: "border-amber-400/20 bg-amber-500/12 text-amber-400",
        glow: "from-amber-500/20",
      },
    };
  }

  return {
    label: "Semizlik",
    color: "#f87171",
    tw: {
      bg: "bg-red-500/8",
      badge: "border-red-400/20 bg-red-500/12 text-red-400",
      glow: "from-red-500/20",
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

export default function CoachBmiWidget({
  currentWeightValue,
  heightCmValue,
  onOpen,
  interactive = true,
}) {
  const navigate = useNavigate();
  const currentWeight = firstFinite(currentWeightValue);
  const heightCm = firstFinite(heightCmValue);
  const heightM = heightCm / 100;
  const bmi =
    heightM > 0 && currentWeight > 0 ? currentWeight / (heightM * heightM) : null;
  const meta = getBmiMeta(bmi);
  const pct = bmi !== null ? clampPct(bmi) : 0;
  const handleClick = interactive
    ? (onOpen ?? (() => navigate("/user/measurements")))
    : undefined;

  return (
    <div
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
        "relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        interactive && "cursor-pointer hover:bg-accent/30",
        meta && meta.tw.bg,
      )}
    >
      {meta ? (
        <div
          className={cn(
            "pointer-events-none absolute -right-10 -top-10 size-40 rounded-full blur-3xl opacity-60",
            `bg-gradient-radial ${meta.tw.glow}`,
          )}
          style={{
            background: `radial-gradient(circle, ${meta.color}33 0%, transparent 70%)`,
          }}
        />
      ) : null}

      <div className="relative flex shrink-0 items-center justify-between px-5 pb-0 pt-5">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-blue-500/12 text-sm leading-none">
            🧮
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            BMI indeks
          </span>
        </div>
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground/40" />
      </div>

      {bmi !== null && meta ? (
        <div className="relative flex flex-1 flex-col gap-4 px-5 pb-5 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[3rem] font-black leading-none tracking-tight tabular-nums">
                {bmi.toFixed(1)}
              </div>
              <div
                className={cn(
                  "mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold",
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

            <div className="shrink-0 text-right">
              <div className="rounded-xl bg-muted/50 px-3 py-1.5 text-right">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Bo'y
                </p>
                <p className="text-sm font-black leading-tight">
                  {heightCm}
                  <span className="ml-0.5 text-[10px] font-semibold text-muted-foreground">
                    cm
                  </span>
                </p>
              </div>
              <div className="mt-1.5 rounded-xl bg-muted/50 px-3 py-1.5 text-right">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Vazn
                </p>
                <p className="text-sm font-black leading-tight">
                  {currentWeight.toFixed(1)}
                  <span className="ml-0.5 text-[10px] font-semibold text-muted-foreground">
                    kg
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-1">
            <div className="relative h-2.5">
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

            <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full">
              {ZONES.map((zone, index) => (
                <div
                  key={index}
                  className="h-full transition-opacity duration-500"
                  style={{ width: `${zone.pct}%`, background: zone.color, opacity: 1 }}
                />
              ))}
            </div>

            <div className="relative h-3.5">
              {SCALE_LABELS.map(({ label, pct: labelPct }) => (
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
        </div>
      ) : (
        <div className="relative flex flex-1 flex-col items-center justify-center gap-3 px-5 pb-6 pt-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50">
            <span className="text-2xl">📏</span>
          </div>
          <div>
            <p className="text-sm font-bold">Ma'lumot yo'q</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              BMI hisoblash uchun
              <br />
              bo'y va vazn kiriting
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
