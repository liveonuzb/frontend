import React, { useEffect, useRef, useState } from "react";
import { get, find } from "lodash";
import { FlameIcon } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
} from "@/components/ui/drawer";
import { useGetQuery } from "@/hooks/api";
import { useAuthStore } from "@/store";
import {
  DASHBOARD_ME_QUERY_KEY,
  getDashboardDayQueryKey,
  getDayDataFromResponse,
  getUserFromResponse,
  normalizeDateKey,
} from "./query-helpers.js";

/* ─────────────────────────────────────────────
   STREAK REMINDER DRAWER (Dashboard-only)
   Surfaces 3s after the user opens the dashboard
   when currentStreak > 0 and no activity today.
   Shows streak count + progress — no actions.
   Once dismissed it stays hidden for the day.
   ───────────────────────────────────────────── */

const OPEN_DELAY_MS = 3000;
const RETRY_AFTER_BLOCKING_MS = 5000;
const STORAGE_PREFIX = "streak-reminder:dismissed-on";
const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

const storageKey = (userId) => `${STORAGE_PREFIX}:${userId}`;

const hasMeaningfulActivity = (dayData) => {
  if (!dayData) return false;
  if ((dayData.waterCups ?? 0) > 0) return true;
  if ((dayData.steps ?? 0) > 0) return true;
  if (dayData.mood !== null && dayData.mood !== undefined) return true;
  if ((dayData.sleepHours ?? 0) > 0) return true;
  if ((dayData.workoutMinutes ?? 0) > 0) return true;
  for (const type of ["breakfast", "lunch", "dinner", "snack"]) {
    if ((dayData?.meals?.[type]?.length ?? 0) > 0) return true;
  }
  return false;
};

export default function StreakReminderDrawer() {
  const userId = useAuthStore((state) => state.user?.id);
  const today = normalizeDateKey(new Date());
  const [open, setOpen] = useState(false);

  // Streak data — shared cache with dashboard widgets, no extra fetch.
  const { data: meData } = useGetQuery({
    url: "/users/me",
    queryProps: {
      queryKey: DASHBOARD_ME_QUERY_KEY,
      enabled: Boolean(userId),
    },
  });
  const user = getUserFromResponse(meData);
  const currentStreak = get(user, "currentStreak", 0);
  const longestStreak = get(user, "longestStreak", currentStreak);

  // Today's activity — shared cache slot.
  const { data: dayResponse } = useGetQuery({
    url: `/daily-tracking/${today}`,
    queryProps: {
      queryKey: getDashboardDayQueryKey(today),
      enabled: Boolean(userId),
    },
  });
  const dayData = getDayDataFromResponse(dayResponse, today);
  const hasActivity = hasMeaningfulActivity(dayData);

  // shownRef prevents re-firing if deps update while delay is pending.
  const shownRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    if (currentStreak <= 0) return;
    if (hasActivity) return;
    if (shownRef.current) return;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(storageKey(userId)) === today) return;

    const state = { cancelled: false, retryId: null };

    const tryOpen = () => {
      if (state.cancelled || shownRef.current) return;
      const blocking = document.querySelector(
        '[data-vaul-drawer-direction="bottom"]:not([data-streak-reminder-drawer="true"])',
      );
      if (blocking) {
        state.retryId = window.setTimeout(tryOpen, RETRY_AFTER_BLOCKING_MS);
        return;
      }
      shownRef.current = true;
      setOpen(true);
    };

    const openId = window.setTimeout(tryOpen, OPEN_DELAY_MS);

    return () => {
      state.cancelled = true;
      window.clearTimeout(openId);
      if (state.retryId) window.clearTimeout(state.retryId);
    };
  }, [userId, currentStreak, hasActivity, today]);

  const dismiss = () => {
    if (userId && typeof window !== "undefined") {
      window.localStorage.setItem(storageKey(userId), today);
    }
    setOpen(false);
  };

  const nextMilestone =
    find(STREAK_MILESTONES, (m) => m > currentStreak) ?? currentStreak + 10;
  const progressPct =
    nextMilestone > 0
      ? Math.min(100, Math.round((currentStreak / nextMilestone) * 100))
      : 0;

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : dismiss())}
      direction="bottom"
    >
      <DrawerContent data-streak-reminder-drawer="true">
        <DrawerHeader className="text-center">
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-3xl bg-orange-500/10">
            <FlameIcon className="size-8 text-orange-500" />
          </div>
          <DrawerTitle className="text-2xl font-black">
            {currentStreak} kunlik streak 🔥
          </DrawerTitle>
          <DrawerDescription>
            Bugun ham faol bo&apos;ling — streakingizni yo&apos;qotmang!
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="pb-6">
          {/* Progress to next milestone */}
          <div className="mb-5 space-y-2 px-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Keyingi nishon: {nextMilestone} kun</span>
              <span className="font-semibold text-orange-500">
                {progressPct}%
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-orange-500/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 px-2">
            <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Hozirgi streak
              </p>
              <p className="mt-1 text-2xl font-black text-orange-500">
                {currentStreak}
                <span className="ml-1 text-xs font-medium text-muted-foreground">
                  kun
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Eng uzun
              </p>
              <p className="mt-1 text-2xl font-black">
                {longestStreak}
                <span className="ml-1 text-xs font-medium text-muted-foreground">
                  kun
                </span>
              </p>
            </div>
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
