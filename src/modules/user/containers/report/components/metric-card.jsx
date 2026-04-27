import React from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   Traffic-light metric card.
   Renders: icon + label + actual + goal hint +
   colored progress bar + status pill (Kam / Ko'p
   / Zo'r / Ehtiyot).
   Used by Daily Report page and 10-day averages.
   ───────────────────────────────────────────── */

const STATUS_STYLES = {
  low: {
    pill: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
    bar: "from-red-400 to-red-500",
    track: "bg-red-100/60 dark:bg-red-500/10",
  },
  high: {
    pill: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
    bar: "from-red-400 to-red-500",
    track: "bg-red-100/60 dark:bg-red-500/10",
  },
  good: {
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    bar: "from-emerald-400 to-emerald-500",
    track: "bg-emerald-100/60 dark:bg-emerald-500/10",
  },
  warn: {
    pill: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    bar: "from-amber-400 to-amber-500",
    track: "bg-amber-100/60 dark:bg-amber-500/10",
  },
  unknown: {
    pill: "bg-muted text-muted-foreground",
    bar: "from-muted to-muted",
    track: "bg-muted/40",
  },
};

export default function MetricCard({
  icon,
  label,
  goalHint,
  actualText,
  status = "unknown",
  statusLabel,
  delta,
  progressPct,
}) {
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.unknown;
  const clampedPct = Math.max(0, Math.min(100, progressPct ?? 0));

  return (
    <div className="rounded-3xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon ? (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted/50">
              {icon}
            </div>
          ) : null}
          <div>
            <p className="text-sm font-bold leading-tight">{label}</p>
            {goalHint ? (
              <p className="text-[11px] text-muted-foreground">{goalHint}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="text-base font-black tabular-nums">{actualText}</div>
          {statusLabel ? (
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                styles.pill,
              )}
            >
              {statusLabel}
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-3">
        <div className={cn("h-2 overflow-hidden rounded-full", styles.track)}>
          <div
            className={cn(
              "h-full rounded-full bg-gradient-to-r transition-all duration-500",
              styles.bar,
            )}
            style={{ width: `${clampedPct}%` }}
          />
        </div>
        {delta ? (
          <p className="mt-1.5 text-right text-[11px] text-muted-foreground">
            {delta}
          </p>
        ) : null}
      </div>
    </div>
  );
}
