import React from "react";
import { SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import NutritionCard from "./nutrition-card.jsx";

export default function AIRecommendationCard({
  title = "AI tavsiya",
  description,
  actionLabel,
  onAction,
}) {
  return (
    <NutritionCard tone="accent">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <SparklesIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          {actionLabel && onAction ? (
            <Button type="button" size="sm" className="mt-4" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </NutritionCard>
  );
}

