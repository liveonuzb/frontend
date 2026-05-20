import React from "react";
import { cn } from "@/lib/utils";
import NutritionCard from "./nutrition-card.jsx";
import ProgressBar from "./progress-bar.jsx";

const toneClassName = {
  primary: "bg-primary/10 text-primary",
  water: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  muted: "bg-muted text-muted-foreground",
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  description,
  badge,
  progress,
  tone = "primary",
  className,
}) {
  return (
    <NutritionCard className={cn("min-w-0", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <div className="mt-2 flex min-w-0 flex-wrap items-end gap-x-1.5 gap-y-1">
            <span className="text-2xl font-black leading-none tracking-tight sm:text-3xl">
              {value}
            </span>
            {unit ? (
              <span className="pb-0.5 text-xs font-bold text-muted-foreground">
                {unit}
              </span>
            ) : null}
            {badge ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                {badge}
              </span>
            ) : null}
          </div>
        </div>
        {Icon ? (
          <div
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-2xl",
              toneClassName[tone] || toneClassName.primary,
            )}
          >
            <Icon className="size-5" />
          </div>
        ) : null}
      </div>
      {progress ? (
        <ProgressBar
          className="mt-4"
          tone={progress.tone || tone}
          value={progress.value}
          target={progress.target}
          aria-label={progress.ariaLabel || label}
        />
      ) : null}
      {description ? (
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </NutritionCard>
  );
}

