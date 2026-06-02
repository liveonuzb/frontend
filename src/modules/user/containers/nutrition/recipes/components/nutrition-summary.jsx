import React from "react";
import map from "lodash/map";
import { cn } from "@/lib/utils.js";
import { formatNumber } from "../recipe-mock-data.js";

const defaultItems = [
  { key: "calories", label: "kkal", unit: "" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "fat", label: "Yog'", unit: "g" },
  { key: "carbs", label: "Uglevod", unit: "g" },
];

const NutritionSummary = ({
  nutrition,
  items = defaultItems,
  className,
  itemClassName,
}) => (
  <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", className)}>
    {map(items, (item) => (
      <div
        key={item.key}
        className={cn(
          "rounded-2xl border border-border bg-background px-3 py-3 text-center",
          itemClassName,
        )}
      >
        <div className="text-base font-semibold text-foreground">
          {formatNumber(nutrition?.[item.key])}
          {item.unit}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">{item.label}</div>
      </div>
    ))}
  </div>
);

export default NutritionSummary;
