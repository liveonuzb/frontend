import React from "react";
import { get } from "lodash";
import { useGetQuery } from "@/hooks/api";
import { COACH_AVAILABILITY_QUERY_KEY } from "./use-coach-query-keys";

export const useCoachAvailability = () => {
  const { data, ...query } = useGetQuery({
    url: "/coach/availability",
    queryProps: {
      queryKey: COACH_AVAILABILITY_QUERY_KEY,
    },
  });

  const getAvailableSlots = React.useCallback(
    (date) => {
      const availability = get(data, "data", {});
      const d = new Date(date);
      const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      const dayKey = dayNames[d.getDay()];

      const dayAvailability = availability[dayKey];
      if (!dayAvailability || !dayAvailability.active) return [];

      const slots = [];
      let current = parseInt(dayAvailability.start.split(":")[0]);
      const end = parseInt(dayAvailability.end.split(":")[0]);

      while (current < end) {
        slots.push(`${String(current).padStart(2, "0")}:00`);
        current++;
      }
      return slots;
    },
    [data],
  );

  return {
    ...query,
    availability: get(data, "data", {}),
    getAvailableSlots,
  };
};
