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
import { motion } from "framer-motion";
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
    <Card className="py-6 mood-widget">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <motion.div
            key={selectedMood || "good"}
            initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className={`size-7 ${selectedMood || "good"}`}
          />
          Kayfiyat
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-center gap-5 px-4">
        <div className="flex gap-3">
          {map(MOOD_OPTIONS, (moodOption = {}) => {
            const value = get(moodOption, "value");
            const isSelected = selectedMood === value;

            return (
              <motion.button
                key={value}
                type="button"
                disabled={setMoodMutation.isPending || readOnly}
                whileHover={!readOnly ? { scale: 1.08, y: -3 } : undefined}
                whileTap={!readOnly ? { scale: 0.92 } : undefined}
                animate={{
                  scale: isSelected ? 1.08 : 1,
                  y: isSelected ? -4 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 18,
                }}
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
                        mood: value,
                      },
                    });
                    toast.success("Kayfiyat saqlandi");
                  } catch {
                    toast.error("Kayfiyatni saqlab bo'lmadi");
                  }
                }}
                className={cn(
                  "flex flex-1 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60 py-2 cursor-pointer",
                  isSelected
                    ? "bg-primary/15 ring-1 ring-primary"
                    : "bg-muted/30 hover:bg-muted/60",
                )}
              >
                <motion.div
                  className={`size-9 ${value}`}
                  animate={
                    isSelected
                      ? {
                          rotate: [0, -8, 8, -4, 4, 0],
                          scale: [1, 1.15, 1],
                        }
                      : {
                          rotate: 0,
                          scale: 1,
                        }
                  }
                  transition={{
                    duration: 0.45,
                  }}
                />
              </motion.button>
            );
          })}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          {setMoodMutation.isPending
            ? "Saqlanmoqda..."
            : readOnly
              ? (selectedMoodMeta?.label ?? "Kayfiyat kiritilmagan")
              : (selectedMoodMeta?.label ?? "Bugungi kayfiyat?")}
        </p>
      </CardContent>
    </Card>
  );
}
