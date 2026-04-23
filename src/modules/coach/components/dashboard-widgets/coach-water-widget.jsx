import React from "react";
import AnimatedWaterWidget from "@/components/animated-water-widget";

export default function CoachWaterWidget({
  waterConsumedMl,
  waterGoalMl,
  cupSize,
  onOpen,
  onAddOverride,
  interactive = true,
  hideAdd = false,
}) {
  return (
    <AnimatedWaterWidget
      currentMl={waterConsumedMl}
      maxMl={waterGoalMl}
      onAdd={async () => {
        if (!interactive) return;
        await onAddOverride?.(cupSize || 250);
      }}
      onClick={interactive ? onOpen : undefined}
      hideAdd={hideAdd || !interactive}
      className="h-full"
    />
  );
}
