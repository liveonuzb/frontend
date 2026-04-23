import React from "react";
import { get } from "lodash";
import CalorieGaugeComponent from "@/components/calorie-gauge-widget";

export default function CoachCalorieGaugeWidget({
  totalCalories,
  goals,
  macros,
  onOpen,
}) {
  return (
    <CalorieGaugeComponent
      consumed={totalCalories}
      goal={get(goals, "calories", 0)}
      macros={{
        protein: {
          current: get(macros, "protein", 0),
          target: get(goals, "protein", 0),
        },
        carbs: {
          current: get(macros, "carbs", 0),
          target: get(goals, "carbs", 0),
        },
        fat: {
          current: get(macros, "fat", 0),
          target: get(goals, "fat", 0),
        },
      }}
      onClick={onOpen}
      className="h-full"
    />
  );
}
