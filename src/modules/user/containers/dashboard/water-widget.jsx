import React from "react";
import get from "lodash/get";
import toNumber from "lodash/toNumber";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useGetQuery } from "@/hooks/api";
import { usePostQuery } from "@/hooks/api";
import {
  NUTRITION_TRACKING_API_ROOT,
  nutritionApiPath,
} from "@/hooks/app/nutrition-api-paths";
import AnimatedWaterWidget from "@/components/animated-water-widget";
import { invalidateGamificationQueries } from "@/modules/user/lib/gamification-query-keys";
import {
  calculateWaterConsumedMl,
  DASHBOARD_HEALTH_GOALS_QUERY_KEY,
  getDashboardDayQueryKey,
  getDayDataFromResponse,
  getGoalsStateFromResponses,
} from "./query-helpers.js";

export default function WaterWidget({
  dateKey,
  dayData: dayDataOverride,
  goalsState: goalsStateOverride,
  onOpen,
  onAddOverride,
  interactive = true,
  hideAdd = false,
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: trackingData } = useGetQuery({
    url: nutritionApiPath(NUTRITION_TRACKING_API_ROOT, dateKey),
    queryProps: {
      queryKey: getDashboardDayQueryKey(dateKey),
      enabled: dayDataOverride === undefined && Boolean(dateKey),
    },
  });
  const { data: goalsData } = useGetQuery({
    url: "/health-goals",
    queryProps: {
      queryKey: DASHBOARD_HEALTH_GOALS_QUERY_KEY,
      enabled: goalsStateOverride === undefined,
    },
  });
  const dayData = React.useMemo(
    () => dayDataOverride ?? getDayDataFromResponse(trackingData, dateKey),
    [dateKey, dayDataOverride, trackingData],
  );
  const { goals } = React.useMemo(
    () =>
      goalsStateOverride ??
      getGoalsStateFromResponses({ goalsResponse: goalsData, user: null }),
    [goalsData, goalsStateOverride],
  );
  const cupSize = toNumber(get(goals, "cupSize", 250) || 250);
  const waterGoalMl = toNumber(get(goals, "waterMl", 2500) || 2500);
  const waterConsumedMl = React.useMemo(
    () => calculateWaterConsumedMl(dayData, cupSize),
    [cupSize, dayData],
  );
  const addWaterMutation = usePostQuery({
    mutationProps: {
      onSuccess: async (response) => {
        queryClient.setQueryData(getDashboardDayQueryKey(dateKey), response);
        await invalidateGamificationQueries(queryClient);
      },
    },
  });

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
          await addWaterMutation.mutateAsync({
            url: nutritionApiPath(
              NUTRITION_TRACKING_API_ROOT,
              `${dateKey}/water`,
            ),
            attributes: { amountMl: cupSize },
          });
          toast.success(`Kamina yana ${cupSize}ml suv ichdi! 💧`);
        } catch {
          toast.error("Suvni saqlab bo'lmadi");
        }
      }}
      onClick={
        interactive ? (onOpen ?? (() => navigate("/user/water"))) : undefined
      }
      hideAdd={hideAdd || !interactive}
    />
  );
}
