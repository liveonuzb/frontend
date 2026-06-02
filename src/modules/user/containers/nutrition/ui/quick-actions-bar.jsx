import React from "react";
import map from "lodash/map";
import { Button } from "@/components/ui/button";
import NutritionCard from "./nutrition-card.jsx";

export default function QuickActionsBar({ title = "Tez harakatlar", actions }) {
  return (
    <NutritionCard>
      <p className="text-sm font-black">{title}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {map(actions, (action) => {
          const Icon = action.icon;

          return (
            <Button
              key={action.label}
              type="button"
              variant={action.variant || "outline"}
              disabled={action.disabled}
              onClick={action.onClick}
              className="justify-start"
              aria-label={action.ariaLabel || action.label}
            >
              {Icon ? <Icon className="size-4" /> : null}
              {action.label}
            </Button>
          );
        })}
      </div>
    </NutritionCard>
  );
}

