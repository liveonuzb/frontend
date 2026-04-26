import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import useGetQuery from "@/hooks/api/use-get-query";
import usePutQuery from "@/hooks/api/use-put-query";
import { useAuthStore } from "@/store";
import { MOOD_OPTIONS } from "@/lib/mood";
import { cn } from "@/lib/utils";
import {
  getDashboardDayQueryKey,
  getDayDataFromResponse,
  normalizeDateKey,
} from "./query-helpers.js";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button.jsx";

const STORAGE_PREFIX = "mood-reminder:dismissed-on";
const ACTIVE_THRESHOLD_MS = 60000;

const storageKey = (userId) => `${STORAGE_PREFIX}:${userId}`;

export default function MoodReminderDrawer() {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  const today = normalizeDateKey(new Date());

  const [open, setOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);

  const { data } = useGetQuery({
    url: `/daily-tracking/${today}`,
    queryProps: {
      queryKey: getDashboardDayQueryKey(today),
      enabled: Boolean(userId),
    },
  });

  const dayData = getDayDataFromResponse(data, today);
  const mood = dayData?.mood ?? null;

  const setMoodMutation = usePutQuery({
    mutationProps: {
      onSuccess: async (response) => {
        queryClient.setQueryData(getDashboardDayQueryKey(today), response);
      },
    },
  });

  useEffect(() => {
    if (!userId || mood !== null) return;

    const dismissedOn = localStorage.getItem(storageKey(userId));
    if (dismissedOn === today) return;

    const timer = setTimeout(() => {
      setOpen(true);
    }, ACTIVE_THRESHOLD_MS);

    return () => clearTimeout(timer);
  }, [userId, mood, today]);

  const saveMood = async (moodValue) => {
    if (!moodValue) return;

    await setMoodMutation.mutateAsync({
      url: `/daily-tracking/${today}`,
      attributes: {
        steps: dayData?.steps,
        workoutMinutes: dayData?.workoutMinutes,
        burnedCalories: dayData?.burnedCalories,
        sleepHours: dayData?.sleepHours,
        mood: moodValue,
      },
    });
  };

  const closeDrawer = async () => {
    if (userId) {
      localStorage.setItem(storageKey(userId), today);
    }

    if (selectedMood && mood === null) {
      try {
        await saveMood(selectedMood);
        toast.success("Kayfiyat saqlandi");
      } catch {
        toast.error("Kayfiyatni saqlab bo'lmadi");
      }
    }

    setOpen(false);
  };

  const confirmMood = async () => {
    if (!selectedMood) return;

    try {
      await saveMood(selectedMood);
      toast.success("Kayfiyat saqlandi");
      setOpen(false);
    } catch {
      toast.error("Kayfiyatni saqlab bo'lmadi");
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setOpen(true);
        } else {
          closeDrawer();
        }
      }}
      direction="bottom"
    >
      <DrawerContent data-mood-reminder-drawer="true">
        <DrawerHeader className="text-center">
          <DrawerTitle>Bugungi kayfiyatingiz?</DrawerTitle>
          <DrawerDescription>
            Kuningiz qanday o'tayotganini belgilang
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="mood-widget">
          <div className="w-1/2 h-44 how mx-auto" />

          <div className="grid grid-cols-5 gap-2 px-2 pb-3">
            {MOOD_OPTIONS.map(({ value, label }) => {
              const active = selectedMood === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedMood(value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border bg-card transition-all py-3",
                    active
                      ? "border-primary scale-105 shadow-lg"
                      : "hover:scale-105",
                  )}
                >
                  <motion.div
                    className={`size-8 ${value}`}
                    animate={{
                      scale: active ? 1.35 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  />

                  <span className="text-[9px] font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        </DrawerBody>

        <DrawerFooter className="text-center">
          <Button
            type="button"
            onClick={confirmMood}
            className="h-11"
            disabled={!selectedMood || setMoodMutation.isPending}
          >
            Confirm
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
