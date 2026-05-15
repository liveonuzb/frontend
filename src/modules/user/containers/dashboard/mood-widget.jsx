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
import { motion, useReducedMotion } from "framer-motion";

const getMoodLabel = (value, labels = {}) => {
  if (!value) return null;

  return labels.moods?.[value] ?? getMoodMeta(value)?.label ?? null;
};

export function MoodWidgetView({
  selectedMood,
  onMoodSelect,
  readOnly = false,
  isPending = false,
  className,
  compact = false,
  labels = {},
}) {
  const shouldReduceMotion = useReducedMotion();
  const title = labels.title ?? "Kayfiyat";
  const pendingLabel = labels.pending ?? "Saqlanmoqda...";
  const emptyLabel = labels.empty ?? "Kayfiyat kiritilmagan";
  const questionLabel = labels.question ?? "Bugungi kayfiyat?";
  const selectedMoodLabel = getMoodLabel(selectedMood, labels);

  return (
    <Card
      className={cn(
        compact ? "gap-3 py-4" : "py-6",
        "mood-widget",
        className,
      )}
    >
      <CardHeader>
        <CardTitle
          className={cn(
            "flex items-center gap-2",
            compact ? "text-lg" : "text-xl",
          )}
        >
          <motion.div
            key={selectedMood || "good"}
            initial={
              shouldReduceMotion
                ? false
                : { scale: 0.5, rotate: -15, opacity: 0 }
            }
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 300, damping: 18 }
            }
            className={cn(compact ? "size-6" : "size-7", selectedMood || "good")}
          />
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent
        className={cn(
          "flex flex-1 flex-col justify-center px-4",
          compact ? "gap-3" : "gap-5",
        )}
      >
        <div className="flex gap-3">
          {map(MOOD_OPTIONS, (moodOption = {}) => {
            const value = get(moodOption, "value");
            const isSelected = selectedMood === value;
            const moodLabel = getMoodLabel(value, labels) ?? value;

            return (
              <motion.button
                key={value}
                type="button"
                aria-label={moodLabel}
                disabled={isPending || readOnly}
                whileHover={
                  !readOnly && !shouldReduceMotion
                    ? { scale: 1.08, y: -3 }
                    : undefined
                }
                whileTap={
                  !readOnly && !shouldReduceMotion ? { scale: 0.92 } : undefined
                }
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        scale: isSelected ? 1.08 : 1,
                        y: isSelected ? -4 : 0,
                      }
                }
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : {
                        type: "spring",
                        stiffness: 380,
                        damping: 18,
                      }
                }
                onClick={() => {
                  if (isPending || readOnly) return;
                  onMoodSelect?.(value);
                }}
                className={cn(
                  "flex flex-1 items-center justify-center rounded-lg py-1 transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                  !readOnly && "cursor-pointer",
                  isSelected
                    ? "bg-primary/15 ring-1 ring-primary"
                    : "bg-muted/30 hover:bg-muted/60",
                )}
              >
                <motion.div
                  className={cn(compact ? "size-12" : "size-14", value)}
                  animate={
                    isSelected && !shouldReduceMotion
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
          {isPending
            ? pendingLabel
            : readOnly
              ? (selectedMoodLabel ?? emptyLabel)
              : (selectedMoodLabel ?? questionLabel)}
        </p>
      </CardContent>
    </Card>
  );
}

export default function MoodWidget({
  dateKey,
  dayData: dayDataOverride,
  readOnly = false,
  className,
  compact = false,
}) {
  const queryClient = useQueryClient();
  const { data } = useGetQuery({
    url: `/daily-tracking/${dateKey}`,
    queryProps: {
      queryKey: getDashboardDayQueryKey(dateKey),
      enabled: dayDataOverride === undefined && Boolean(dateKey),
    },
  });
  const dayData = React.useMemo(
    () => dayDataOverride ?? getDayDataFromResponse(data, dateKey),
    [data, dateKey, dayDataOverride],
  );
  const setMoodMutation = usePutQuery({
    mutationProps: {
      onSuccess: async (response) => {
        queryClient.setQueryData(getDashboardDayQueryKey(dateKey), response);
      },
    },
  });
  const selectedMood = get(dayData, "mood", null);

  return (
    <MoodWidgetView
      className={className}
      compact={compact}
      isPending={setMoodMutation.isPending}
      readOnly={readOnly}
      selectedMood={selectedMood}
      onMoodSelect={async (value) => {
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
    />
  );
}
