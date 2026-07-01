import React, { useEffect, useRef, useState } from "react";
import get from "lodash/get";
import map from "lodash/map";
import confetti from "canvas-confetti";
import { FlameIcon, SparklesIcon, TrophyIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
} from "@/components/ui/drawer";
import { useGetQuery } from "@/hooks/api";
import {
  NUTRITION_TRACKING_API_ROOT,
  nutritionApiPath,
} from "@/hooks/app/nutrition-api-paths";
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
   Surfaces 3s after the user's first meaningful
   activity today. XP is already auto-awarded by
   the backend STREAK_BONUS flow; this drawer lets
   the user acknowledge that reward once per day.
   ───────────────────────────────────────────── */

const OPEN_DELAY_MS = 3000;
const RETRY_AFTER_BLOCKING_MS = 5000;
const STORAGE_PREFIX = "streak-reward:acknowledged-on";
const STREAK_REWARD_XP = 10;
const WEEK_STRIP_DAY_COUNT = 6;
const WEEKDAY_LABELS = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];

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

const buildRewardDays = (todayDate, currentStreak) => {
  const activeCount = Math.min(WEEK_STRIP_DAY_COUNT, Math.max(0, currentStreak));
  const activeStartIndex = WEEK_STRIP_DAY_COUNT - activeCount;

  return Array.from({ length: WEEK_STRIP_DAY_COUNT }, (_, index) => {
    const date = new Date(todayDate);
    date.setDate(todayDate.getDate() - (WEEK_STRIP_DAY_COUNT - 1 - index));

    return {
      active: index >= activeStartIndex,
      date,
      label: WEEKDAY_LABELS[date.getDay()],
    };
  });
};

const fireStreakConfetti = () => {
  if (typeof window === "undefined") return;

  confetti({
    particleCount: 72,
    spread: 72,
    startVelocity: 28,
    scalar: 0.85,
    origin: { y: 0.72 },
  });
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
  const currentStreak = Math.max(0, Number(get(user, "currentStreak", 0)) || 0);

  // Today's activity — shared cache slot.
  const { data: dayResponse } = useGetQuery({
    url: nutritionApiPath(NUTRITION_TRACKING_API_ROOT, today),
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
    if (!hasActivity) return;
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

  useEffect(() => {
    if (open) fireStreakConfetti();
  }, [open]);

  const closeReward = ({ celebrate = false } = {}) => {
    if (userId && typeof window !== "undefined") {
      window.localStorage.setItem(storageKey(userId), today);
    }
    if (celebrate) {
      fireStreakConfetti();
      toast.success(`+${STREAK_REWARD_XP} XP streak bonusi olindi`);
    }
    setOpen(false);
  };

  const acknowledgeReward = () => closeReward({ celebrate: true });

  const todayDate = React.useMemo(() => new Date(), []);
  const rewardDays = React.useMemo(
    () => buildRewardDays(todayDate, currentStreak),
    [currentStreak, todayDate],
  );

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : closeReward())}
      direction="bottom"
    >
      <DrawerContent
        className="before:bg-card before:border-border/60 data-[vaul-drawer-direction=bottom]:md:max-w-sm"
        data-streak-reminder-drawer="true"
      >
        <DrawerHeader className="relative overflow-hidden px-6 pb-1 pt-6 text-center">
          <div className="pointer-events-none absolute inset-x-5 top-0 flex justify-between text-primary/20">
            <SparklesIcon className="size-10 rotate-[-16deg]" />
            <SparklesIcon className="mt-3 size-8 rotate-12" />
          </div>
          <div
            className="relative mx-auto mb-5 grid size-36 place-items-center rounded-[2rem] bg-muted/40 ring-8 ring-muted/25"
            aria-label="Streak reward trophy"
          >
            <div className="absolute inset-4 rounded-[1.6rem] border border-card bg-card/70" />
            <TrophyIcon className="relative size-16 text-primary drop-shadow-sm" />
          </div>
          <DrawerTitle className="text-3xl font-black tracking-normal">
            {currentStreak} kunlik streak!
          </DrawerTitle>
          <DrawerDescription className="mt-2 text-base">
            Ajoyib! Bugun ham entry qo&apos;shdingiz.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="space-y-8 px-6 pb-6 pt-4">
          <div
            className="grid grid-cols-6 gap-2"
          >
            {map(rewardDays, (day) => (
              <div
                key={day.date.toISOString()}
                className="flex min-w-0 flex-col items-center gap-2 rounded-full border border-border/60 bg-muted/35 px-1.5 py-3 text-center"
              >
                <span className="text-[11px] font-semibold leading-none text-primary/70">
                  {day.label}
                </span>
                <span
                  className={
                    day.active
                      ? "grid size-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm"
                      : "grid size-10 place-items-center rounded-full bg-muted text-primary/50"
                  }
                >
                  {day.active ? (
                    <FlameIcon className="size-5 fill-current" />
                  ) : (
                    <span className="text-base font-black tabular-nums">
                      {day.date.getDate()}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-lg font-black text-primary-foreground shadow-[0_12px_28px_rgb(var(--accent-rgb)/0.22)] transition hover:scale-[1.01] hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            onClick={acknowledgeReward}
          >
            +{STREAK_REWARD_XP} XPni olish
          </button>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
