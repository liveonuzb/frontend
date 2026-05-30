import React from "react";
import { Button } from "@/components/ui/button";
import NutritionCard from "./nutrition-card.jsx";
import { cn } from "@/lib/utils.js";
import {
  AlertCircleIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  EyeIcon,
  ListChecksIcon,
  UtensilsIcon,
  XCircleIcon,
} from "lucide-react";

export default function PlanTemplateCard({
  icon: Icon = UtensilsIcon,
  title,
  description,
  calories,
  daysLabel,
  mealLabel,
  mealsCountLabel,
  compatibilityLabel = "Mos",
  disabled = false,
  blockingReason = null,
  onPreview,
  onSelect,
}) {
  const CompatibilityIcon = disabled ? XCircleIcon : CheckCircle2Icon;

  return (
    <NutritionCard
      as="article"
      className="h-full min-h-[228px] p-5 transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
    >
      <div className="flex h-full flex-col gap-4">
        <div className="flex min-w-0 gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-7" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-lg font-black leading-6">
              {title}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-bold text-muted-foreground">
              {daysLabel ? (
                <span className="inline-flex h-7 items-center gap-1 rounded-full border bg-background px-2.5">
                  <CalendarDaysIcon className="size-3.5 text-primary" />
                  {daysLabel}
                </span>
              ) : null}
              {mealLabel ? (
                <span className="inline-flex h-7 items-center gap-1 rounded-full border bg-background px-2.5">
                  <UtensilsIcon className="size-3.5 text-primary" />
                  {mealLabel}
                </span>
              ) : null}
              {mealsCountLabel ? (
                <span className="inline-flex h-7 items-center gap-1 rounded-full border bg-background px-2.5">
                  <ListChecksIcon className="size-3.5 text-primary" />
                  {mealsCountLabel}
                </span>
              ) : null}
              <span
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-full border px-2.5",
                  disabled
                    ? "border-destructive/20 bg-destructive/5 text-destructive"
                    : "border-primary/15 bg-primary/5 text-primary",
                )}
              >
                <CompatibilityIcon className="size-3.5" />
                {compatibilityLabel}
              </span>
            </div>
            {blockingReason ? (
              <p className="mt-3 inline-flex items-start gap-1.5 rounded-xl border border-destructive/20 bg-destructive/5 px-2.5 py-2 text-xs leading-5 text-destructive">
                <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" />
                <span>{blockingReason}</span>
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3">
          <p className="text-base font-black">
            {calories}{" "}
            <span className="text-xs font-semibold text-muted-foreground">
              kcal / kun
            </span>
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {onPreview ? (
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl px-3"
                onClick={onPreview}
              >
                <EyeIcon className="size-4" />
                Ko'rish
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="h-10 min-w-24 rounded-xl bg-primary/5 px-4 text-primary hover:bg-primary/10"
              disabled={disabled}
              onClick={onSelect}
            >
              {disabled ? "Mos emas" : "Tanlash"}
            </Button>
          </div>
        </div>
      </div>
    </NutritionCard>
  );
}
