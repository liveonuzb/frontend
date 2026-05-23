import React from "react";
import { get, map } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useGetQuery } from "@/hooks/api";
import { usePutQuery } from "@/hooks/api";
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
        "relative overflow-hidden py-4 pb-0 transition-all hover:ring-primary/20 hover:shadow-sm",
        "mood-widget",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-4 -top-4 size-24 rounded-full bg-primary/10 blur-[28px]" />
      <CardHeader className="relative z-10 px-4 pb-2">
        <CardTitle
          className={cn("flex items-center gap-1.5 font-bold", "text-base")}
        >
          <span className="rounded bg-primary/10 p-1 text-primary">
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
              className={cn("size-4", selectedMood || "good")}
            />
          </span>
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent
        className={cn(
          "relative z-10 flex flex-1 flex-col justify-center px-4 ",
          "gap-5",
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
                  "flex flex-1 items-center justify-center rounded-2xl py-1 transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                  !readOnly && "cursor-pointer",
                  isSelected
                    ? "bg-primary/15 ring-1 ring-primary"
                    : "bg-muted/30 hover:bg-muted/60",
                )}
              >
                <motion.div
                  className={cn("size-14", value)}
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
