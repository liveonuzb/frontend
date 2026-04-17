import React from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import AnimatedWaterWidget from "@/components/animated-water-widget";
import { useDailyTrackingActions } from "@/hooks/app/use-daily-tracking";

export default function WaterWidget({
  waterConsumedMl,
  waterGoalMl,
  cupSize,
  dateKey,
  onOpen,
  onAddOverride,
  interactive = true,
  hideAdd = false,
}) {
  const navigate = useNavigate();
  const { addWaterCup } = useDailyTrackingActions();

  return (
    <AnimatedWaterWidget
      currentMl={waterConsumedMl}
      maxMl={waterGoalMl}
      onAdd={async () => {
        if (!interactive) return;
        if (onAddOverride) {
          await onAddOverride();
          return;
        }
        try {
          await addWaterCup(dateKey, cupSize || 250);
          toast.success(`Kamina yana ${cupSize || 250}ml suv ichdi! 💧`);
        } catch {
          toast.error("Suvni saqlab bo'lmadi");
        }
      }}
      onClick={interactive ? onOpen ?? (() => navigate("/user/water")) : undefined}
      hideAdd={hideAdd || !interactive}
      className="h-full"
    />
  );
}
