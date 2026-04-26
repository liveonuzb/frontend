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

/* ─────────────────────────────────────────────
   MOOD REMINDER DRAWER (Dashboard-only)
   Pops a bottom drawer when the user has been
   actively using the dashboard for ≥60s, has
   tapped at least once, and hasn't logged today's
   mood. Once dismissed it stays hidden for the
   rest of the day (per user, per device).
   ───────────────────────────────────────────── */

const STORAGE_PREFIX = "mood-reminder:dismissed-on";
const ACTIVE_THRESHOLD_MS = 60000;
const TICK_MS = 2000;
const RETRY_AFTER_BLOCKING_MS = 5000;

const storageKey = (userId) => `${STORAGE_PREFIX}:${userId}`;

export default function MoodReminderDrawer() {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  const today = normalizeDateKey(new Date());
  const [open, setOpen] = useState(false);

  // Same cache slot the dashboard MoodWidget uses → no extra fetch.
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
    if (!userId) return;
    if (mood !== null) return;
    if (typeof window === "undefined") return;

    const dismissedOn = window.localStorage.getItem(storageKey(userId));
    if (dismissedOn === today) return;

    const state = {
      activeMs: 0,
      lastTick: 0, // 0 = uninitialized; set on first qualifying tick
      interacted: false,
      cancelled: false,
      blockingTimeoutId: null,
    };

    const onPointerDown = () => {
      state.interacted = true;
    };
    const onVisibility = () => {
      // Reset anchor whenever visibility flips so we don't credit hidden
      // time as "active".
      state.lastTick = Date.now();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("visibilitychange", onVisibility);

    const tryOpen = () => {
      if (state.cancelled) return;
      // Re-check mood from cache — user may have logged via the widget
      // while the timer was running.
      const fresh = queryClient.getQueryData(getDashboardDayQueryKey(today));
      if (getDayDataFromResponse(fresh, today)?.mood) return;

      // Anti-collision: another bottom drawer (camera, nutrition, etc.) is
      // open — wait and retry.
      const blocking = document.querySelector(
        '[data-vaul-drawer-direction="bottom"]:not([data-mood-reminder-drawer="true"])',
      );
      if (blocking) {
        state.blockingTimeoutId = window.setTimeout(
          tryOpen,
          RETRY_AFTER_BLOCKING_MS,
        );
        return;
      }

      setOpen(true);
    };

    const intervalId = window.setInterval(() => {
      if (state.cancelled) return;
      const now = Date.now();
      if (document.visibilityState !== "visible") {
        state.lastTick = now;
        return;
      }
      if (!state.interacted) {
        state.lastTick = now;
        return;
      }
      if (state.lastTick === 0) {
        state.lastTick = now;
        return;
      }
      state.activeMs += now - state.lastTick;
      state.lastTick = now;
      if (state.activeMs >= ACTIVE_THRESHOLD_MS) {
        window.clearInterval(intervalId);
        tryOpen();
      }
    }, TICK_MS);

    return () => {
      state.cancelled = true;
      window.clearInterval(intervalId);
      if (state.blockingTimeoutId) window.clearTimeout(state.blockingTimeoutId);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [userId, mood, today, queryClient]);

  const dismiss = () => {
    if (userId && typeof window !== "undefined") {
      window.localStorage.setItem(storageKey(userId), today);
    }
    setOpen(false);
  };

  const selectMood = async (value) => {
    if (setMoodMutation.isPending) return;
    try {
      await setMoodMutation.mutateAsync({
        url: `/daily-tracking/${today}`,
        attributes: {
          steps: dayData.steps,
          workoutMinutes: dayData.workoutMinutes,
          burnedCalories: dayData.burnedCalories,
          sleepHours: dayData.sleepHours,
          mood: value,
        },
      });
      toast.success("Kayfiyat saqlandi");
      // Mood is now non-null → effect early-exit prevents reopen.
      setOpen(false);
    } catch {
      toast.error("Kayfiyatni saqlab bo'lmadi");
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : dismiss())}
      direction="bottom"
    >
      <DrawerContent data-mood-reminder-drawer="true">
        <DrawerHeader className="text-center">
          <DrawerTitle>Bugungi kayfiyatingiz?</DrawerTitle>
          <DrawerDescription>
            Kuningiz qanday o'tayotganini bir tugma bilan belgilang.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="pb-6">
          <div className="grid grid-cols-5 gap-2 px-2">
            {MOOD_OPTIONS.map(({ value, emoji, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => selectMood(value)}
                disabled={setMoodMutation.isPending}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border bg-card p-3 transition",
                  "hover:scale-105 hover:border-primary",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                <span className="text-3xl leading-none">{emoji}</span>
                <span className="text-[11px] font-medium leading-tight">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
