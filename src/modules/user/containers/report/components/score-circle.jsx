import React from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   Large circular score indicator (78/100).
   SVG-based — independent of any chart lib so
   it stays light. Color shifts with score
   bucket: ≥80 emerald, 60–79 amber, <60 red.
   ───────────────────────────────────────────── */

const SIZE = 140;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function colorFor(score) {
  if (score >= 90) return "stroke-emerald-500";
  if (score >= 70) return "stroke-amber-500";
  return "stroke-red-500";
}

export default function ScoreCircle({ score = 0, max = 100, label }) {
  const clamped = Math.max(0, Math.min(max, score));
  const offset = CIRCUMFERENCE - (clamped / max) * CIRCUMFERENCE;
  const colorClass = colorFor(clamped);

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: SIZE, height: SIZE }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-rotate-90"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-muted/40"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={cn("transition-all duration-700", colorClass)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-black tabular-nums">{clamped}</div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          /{max}
        </div>
        {label ? (
          <div className="mt-0.5 text-[10px] font-medium text-muted-foreground">
            {label}
          </div>
        ) : null}
      </div>
    </div>
  );
}
