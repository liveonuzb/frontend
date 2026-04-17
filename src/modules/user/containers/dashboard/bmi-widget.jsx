import React from "react";
import { useNavigate } from "react-router";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { get } from "lodash";
import useMeasurements from "@/hooks/app/use-measurements";
import { useAuthStore } from "@/store";
import { normalizeUserOnboarding } from "@/lib/user-onboarding";

const firstFinite = (...values) => {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
};

// Scale: BMI 10 → 40 (30-unit range)
const BMI_SCALE_MIN = 10;
const BMI_SCALE_RANGE = 30;

const clampPct = (bmi) =>
  Math.min(Math.max(((bmi - BMI_SCALE_MIN) / BMI_SCALE_RANGE) * 100, 1.5), 98.5);

const getBmiMeta = (bmi) => {
  if (bmi === null) return null;
  if (bmi < 18.5)
    return {
      label: "Kam vazn",
      color: "#60a5fa",
      tw: {
        text: "text-blue-400",
        bg: "bg-blue-500/8",
        badge: "bg-blue-500/12 text-blue-400 border-blue-400/20",
        glow: "from-blue-500/20",
      },
    };
  if (bmi < 25)
    return {
      label: "Normal",
      color: "#4ade80",
      tw: {
        text: "text-green-400",
        bg: "bg-green-500/8",
        badge: "bg-green-500/12 text-green-400 border-green-400/20",
        glow: "from-green-500/20",
      },
    };
  if (bmi < 30)
    return {
      label: "Ortiqcha",
      color: "#fbbf24",
      tw: {
        text: "text-amber-400",
        bg: "bg-amber-500/8",
        badge: "bg-amber-500/12 text-amber-400 border-amber-400/20",
        glow: "from-amber-500/20",
      },
    };
  return {
    label: "Semizlik",
    color: "#f87171",
    tw: {
      text: "text-red-400",
      bg: "bg-red-500/8",
      badge: "bg-red-500/12 text-red-400 border-red-400/20",
      glow: "from-red-500/20",
    },
  };
};

// Zone widths as % of the 10→40 scale
const ZONES = [
  { color: "#93c5fd", pct: (8.5 / 30) * 100 },  // underweight  10–18.5
  { color: "#86efac", pct: (6.5 / 30) * 100 },  // normal       18.5–25
  { color: "#fcd34d", pct: (5 / 30) * 100 },    // overweight   25–30
  { color: "#fca5a5", pct: (10 / 30) * 100 },   // obese        30–40
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
  onOpen,
  interactive = true,
}) {
  const navigate = useNavigate();
  const { getLatest } = useMeasurements();
  const { user } = useAuthStore();
  const onboarding = normalizeUserOnboarding(get(user, "onboarding"));

  const latest = getLatest();
  const currentW = firstFinite(
    currentWeightValue,
    get(latest, "weight"),
    parseFloat(get(onboarding, "currentWeight.value")),
  );
  const heightCm = firstFinite(
    heightCmValue,
    parseFloat(get(onboarding, "height.value")),
  );
  const heightM = heightCm / 100;
  const bmi = heightM > 0 && currentW > 0 ? currentW / (heightM * heightM) : null;
  const meta = getBmiMeta(bmi);
  const pct = bmi !== null ? clampPct(bmi) : 0;

  const handleClick = interactive
    ? onOpen ?? (() => navigate("/user/measurements"))
    : undefined;

  const handleKeyDown = interactive
    ? (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick?.();
        }
      }
    : undefined;

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative h-full rounded-[1.75rem] border bg-card overflow-hidden flex flex-col transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        interactive && "cursor-pointer hover:bg-accent/30",
        meta && meta.tw.bg,
      )}
    >
      {/* Background glow blob */}
      {meta && (
        <div
          className={cn(
            "absolute -top-10 -right-10 size-40 rounded-full blur-3xl opacity-60 pointer-events-none",
            `bg-gradient-radial ${meta.tw.glow}`,
          )}
          style={{
            background: `radial-gradient(circle, ${meta.color}33 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-0 shrink-0 relative">
        <div className="flex items-center gap-2">
          <span className="size-7 rounded-lg bg-blue-500/12 flex items-center justify-center text-sm leading-none">
            🧮
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            BMI indeks
          </span>
        </div>
        <ChevronRightIcon className="size-4 text-muted-foreground/40 shrink-0" />
      </div>

      {bmi !== null && meta ? (
        <div className="flex flex-col gap-4 px-5 pt-4 pb-5 flex-1 relative">
          {/* Hero row: big BMI number + category badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[3rem] font-black leading-none tabular-nums tracking-tight">
                {bmi.toFixed(1)}
              </div>
              <div
                className={cn(
                  "mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border",
                  meta.tw.badge,
                )}
              >
                <span
                  className="size-1.5 rounded-full flex-shrink-0"
                  style={{ background: meta.color }}
                />
                {meta.label}
              </div>
            </div>

            {/* Weight + height compact stack */}
            <div className="flex flex-col gap-1.5 text-right shrink-0">
              <div className="bg-muted/50 rounded-xl px-3 py-1.5 text-right">
                <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wide">Bo'y</p>
                <p className="text-sm font-black leading-tight">
                  {heightCm}
                  <span className="text-[10px] font-semibold text-muted-foreground ml-0.5">cm</span>
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl px-3 py-1.5 text-right">
                <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wide">Vazn</p>
                <p className="text-sm font-black leading-tight">
                  {currentW.toFixed(1)}
                  <span className="text-[10px] font-semibold text-muted-foreground ml-0.5">kg</span>
                </p>
              </div>
            </div>
          </div>

          {/* BMI scale */}
          <div className="space-y-1 mt-auto">
            {/* Pointer triangle */}
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

            {/* Segmented bar */}
            <div className="flex gap-[2px] h-2.5 w-full rounded-full overflow-hidden">
              {ZONES.map((z, i) => (
                <div
                  key={i}
                  className="h-full transition-opacity duration-500"
                  style={{
                    width: `${z.pct}%`,
                    background: z.color,
                    opacity: 1,
                  }}
                />
              ))}
            </div>

            {/* Scale labels */}
            <div className="relative h-3.5">
              {SCALE_LABELS.map(({ label, pct: lp }) => (
                <span
                  key={label}
                  className="absolute text-[9px] font-semibold text-muted-foreground/60 -translate-x-1/2 top-0"
                  style={{ left: `${lp}%` }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center gap-3 px-5 pb-6 pt-4 text-center flex-1 relative">
          <div className="size-14 rounded-2xl bg-muted/50 flex items-center justify-center">
            <span className="text-2xl">📏</span>
          </div>
          <div>
            <p className="text-sm font-bold">Ma'lumot yo'q</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              BMI hisoblash uchun<br />bo'y va vazn kiriting
            </p>
          </div>
          <div className="text-[10px] font-semibold text-muted-foreground/60 border border-dashed border-border/50 rounded-full px-3 py-1">
            Bosing va kiriting →
          </div>
        </div>
      )}
    </div>
  );
}
