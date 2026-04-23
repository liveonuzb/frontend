import React from "react";
import { get, map } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import useGetQuery from "@/hooks/api/use-get-query";
import usePutQuery from "@/hooks/api/use-put-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getMoodMeta, MOOD_OPTIONS } from "@/lib/mood";
import {
  getDashboardDayQueryKey,
  getDayDataFromResponse,
} from "./query-helpers.js";

export default function MoodWidget({ dateKey, readOnly = false }) {
  const queryClient = useQueryClient();
  const { data } = useGetQuery({
    url: `/daily-tracking/${dateKey}`,
    queryProps: {
      queryKey: getDashboardDayQueryKey(dateKey),
      enabled: Boolean(dateKey),
    },
  });
  const dayData = React.useMemo(
    () => getDayDataFromResponse(data, dateKey),
    [data, dateKey],
  );
  const setMoodMutation = usePutQuery({
    mutationProps: {
      onSuccess: async (response) => {
        queryClient.setQueryData(getDashboardDayQueryKey(dateKey), response);
      },
    },
  });
  const selectedMood = get(dayData, "mood", null);
  const selectedMoodMeta = getMoodMeta(selectedMood);

  return (
    <Card className="py-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="flex size-7 items-center justify-center rounded-lg bg-purple-500/15 text-base">
            😊
          </span>
          Kayfiyat
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-center gap-3 px-4 pb-4">
        <div className="flex gap-1.5">
          {map(MOOD_OPTIONS, (moodOption) => (
            <button
              key={get(moodOption, "value")}
              type="button"
              disabled={setMoodMutation.isPending || readOnly}
              onClick={async () => {
                if (setMoodMutation.isPending || readOnly) return;
                try {
                  await setMoodMutation.mutateAsync({
                    url: `/daily-tracking/${dateKey}`,
                    attributes: {
                      steps: dayData.steps,
                      workoutMinutes: dayData.workoutMinutes,
                      burnedCalories: dayData.burnedCalories,
                      sleepHours: dayData.sleepHours,
                      mood: get(moodOption, "value"),
                    },
                  });
                  toast.success("Kayfiyat saqlandi");
                } catch {
                  toast.error("Kayfiyatni saqlab bo'lmadi");
                }
              }}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg py-2 transition-all disabled:cursor-not-allowed disabled:opacity-60",
                selectedMood === get(moodOption, "value")
                  ? "scale-105 bg-primary/15 ring-1 ring-primary"
                  : "bg-muted/30 hover:bg-muted/60",
              )}
            >
              <span className="text-xl">{get(moodOption, "emoji")}</span>
            </button>
          ))}
        </div>
        <p className="text-center text-[10px] text-muted-foreground">
          {setMoodMutation.isPending
            ? "Saqlanmoqda..."
            : readOnly
              ? selectedMoodMeta?.label ?? "Kayfiyat kiritilmagan"
              : selectedMoodMeta?.label ?? "Bugungi kayfiyat?"}
        </p>
      </CardContent>
    </Card>
  );
}
