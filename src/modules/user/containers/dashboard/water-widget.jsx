import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import useGetQuery from "@/hooks/api/use-get-query";
import usePostQuery from "@/hooks/api/use-post-query";
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
  onOpen,
  onAddOverride,
  interactive = true,
  hideAdd = false,
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: trackingData } = useGetQuery({
    url: `/daily-tracking/${dateKey}`,
    queryProps: {
      queryKey: getDashboardDayQueryKey(dateKey),
      enabled: Boolean(dateKey),
    },
  });
  const { data: goalsData } = useGetQuery({
    url: "/health-goals",
    queryProps: {
      queryKey: DASHBOARD_HEALTH_GOALS_QUERY_KEY,
    },
  });
  const dayData = React.useMemo(
    () => getDayDataFromResponse(trackingData, dateKey),
    [dateKey, trackingData],
  );
  const { goals } = React.useMemo(
    () => getGoalsStateFromResponses({ goalsResponse: goalsData, user: null }),
    [goalsData],
  );
  const cupSize = Number(goals?.cupSize || 250);
  const waterGoalMl = Number(goals?.waterMl || 2500);
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
            url: `/daily-tracking/${dateKey}/water`,
            attributes: { amountMl: cupSize },
          });
          toast.success(`Kamina yana ${cupSize}ml suv ichdi! 💧`);
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
