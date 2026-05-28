import React from "react";
import { Button } from "@/components/ui/button";
import NutritionCard from "./nutrition-card.jsx";

export default function PlanTemplateCard({
  icon: Icon,
  title,
  description,
  calories,
  onSelect,
}) {
  return (
    <NutritionCard className="h-full min-h-[148px] p-5 transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md">
      <div className="flex h-full flex-col gap-5">
        <div className="flex min-w-0 gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-7" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-1 text-lg font-black">{title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3">
          <p className="text-base font-black">
            {calories}{" "}
            <span className="text-xs font-semibold text-muted-foreground">
              kcal / kun
            </span>
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-32 shrink-0 rounded-xl bg-primary/5 text-primary hover:bg-primary/10"
            onClick={onSelect}
          >
            Tanlash
          </Button>
        </div>
      </div>
    </NutritionCard>
  );
}
