import React from "react";
import { Button } from "@/components/ui/button";
import NutritionCard from "./nutrition-card.jsx";

export default function PlanTemplateCard({
  icon: Icon,
  title,
  description,
  calories,
  badge,
  onSelect,
}) {
  return (
    <NutritionCard className="h-full p-4 transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md">
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <span className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[11px] font-bold text-primary">
            {badge}
          </span>
        </div>
        <div className="min-h-0 flex-1">
          <h3 className="text-base font-black">{title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
          <p className="mt-3 text-sm font-black">
            {calories} <span className="text-xs font-semibold text-muted-foreground">kcal/kun</span>
          </p>
        </div>
        <Button type="button" variant="outline" className="w-full rounded-full" onClick={onSelect}>
          Tanlash
        </Button>
      </div>
    </NutritionCard>
  );
}
