import React from "react";
import { clamp, round } from "lodash";
import { cn } from "@/lib/utils";

const toneClassName = {
  primary: "bg-primary",
  protein: "bg-red-500",
  carbs: "bg-amber-500",
  fat: "bg-emerald-500",
  water: "bg-sky-500",
  success: "bg-emerald-500",
};

export const getProgressPercent = (value, target) => {
  if (!target || target <= 0) {
    return 0;
  }

  return clamp(round((value / target) * 100), 0, 100);
};

export default function ProgressBar({
  value = 0,
  target = 0,
  tone = "primary",
  className,
  barClassName,
  "aria-label": ariaLabel,
}) {
  const percent = getProgressPercent(value, target);

  return (
    <div
      className={cn("h-2 overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-300",
          toneClassName[tone] || toneClassName.primary,
          barClassName,
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

