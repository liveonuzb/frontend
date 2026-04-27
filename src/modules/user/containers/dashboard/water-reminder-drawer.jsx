import React, { useState } from "react";
import { toast } from "sonner";
import { DropletIcon } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
} from "@/components/ui/drawer";
import useGetQuery from "@/hooks/api/use-get-query";
import { useDailyTrackingActions } from "@/hooks/app/use-daily-tracking";
import useHealthGoals from "@/hooks/app/use-health-goals";
import { useAuthStore } from "@/store";
import { cn } from "@/lib/utils";
import {
  calculateWaterConsumedMl,
  getDashboardDayQueryKey,
  getDayDataFromResponse,
  normalizeDateKey,
} from "./query-helpers.js";
import useReminderTrigger from "./use-reminder-trigger.js";

/* ─────────────────────────────────────────────
   WATER REMINDER DRAWER (Dashboard-only)
   Surfaces periodically based on the user's
   `waterNotifInterval` setting (30min / 1h /
   1.5h / 2h / 3h). Skips when:
   - waterNotification toggle is off
   - outside waterNotifStart..waterNotifEnd
   - daily water goal already met
   - last shown < interval ago
   ───────────────────────────────────────────── */

const LAST_SHOWN_PREFIX = "water-reminder:last-shown-at";
const KNOWN_CUP_SIZES = new Set([50, 150, 250, 400, 500]);
const ALT_CUP_SIZES = [150, 250, 500];

const INTERVAL_MS = {
  "30 min": 30 * 60 * 1000,
  "1 hour": 60 * 60 * 1000,
  "1.5 hours": 90 * 60 * 1000,
  "2 hours": 120 * 60 * 1000,
  "3 hours": 180 * 60 * 1000,
};

const lastShownKey = (userId) => `${LAST_SHOWN_PREFIX}:${userId}`;

const cupClass = (ml) => (KNOWN_CUP_SIZES.has(ml) ? `cup_${ml}` : "cup_custom");

const parseClock = (value, fallback) => {
  const source =
    typeof value === "string" && /^\d{1,2}:\d{2}$/.test(value)
      ? value
      : fallback;
  const [h, m] = source.split(":").map(Number);
  return h * 60 + m;
};

const isWithinQuietHours = (now, startStr, endStr) => {
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = parseClock(startStr, "08:00");
  const end = parseClock(endStr, "22:00");
  if (start === end) return true;
  if (start < end) return cur >= start && cur <= end;
  // Wrap past midnight (e.g. 22:00 → 06:00).
  return cur >= start || cur <= end;
};

const isIntervalElapsed = (userId, intervalMs) => {
  if (typeof window === "undefined" || !userId) return false;
  const last = window.localStorage.getItem(lastShownKey(userId));
  if (!last) return true;
  const ts = new Date(last).getTime();
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts >= intervalMs;
};

export default function WaterReminderDrawer() {
  const userId = useAuthStore((state) => state.user?.id);
  const today = normalizeDateKey(new Date());
  const [open, setOpen] = useState(false);
  const [submittingMl, setSubmittingMl] = useState(null);

  const {
    goals: {
      cupSize,
      customCupSize,
      waterMl,
      waterNotification,
      waterNotifStart,
      waterNotifEnd,
      waterNotifInterval,
    },
  } = useHealthGoals();

  const preferredMl = customCupSize || cupSize || 250;
  const intervalMs = INTERVAL_MS[waterNotifInterval] ?? INTERVAL_MS["1 hour"];

  // Today's daily-tracking — shared cache.
  const { data: dayResponse } = useGetQuery({
    url: `/daily-tracking/${today}`,
    queryProps: {
      queryKey: getDashboardDayQueryKey(today),
      enabled: Boolean(userId),
    },
  });
  const dayData = getDayDataFromResponse(dayResponse, today);
  const consumedMl = calculateWaterConsumedMl(dayData, preferredMl);
  const goalMl = waterMl ?? 2500;
  const remainingMl = Math.max(0, goalMl - consumedMl);

  const { addWaterCup } = useDailyTrackingActions();

  // Eligibility — recomputed per render. Hook re-runs whenever this changes.
  const now = new Date();
  const inQuietHours = isWithinQuietHours(
    now,
    waterNotifStart || "08:00",
    waterNotifEnd || "22:00",
  );
  const intervalElapsed = isIntervalElapsed(userId, intervalMs);

  useReminderTrigger({
    enabled:
      Boolean(userId) &&
      waterNotification === true &&
      inQuietHours &&
      remainingMl > 0 &&
      intervalElapsed,
    excludeSelector: '[data-water-reminder-drawer="true"]',
    onTrigger: () => {
      if (userId && typeof window !== "undefined") {
        window.localStorage.setItem(
          lastShownKey(userId),
          new Date().toISOString(),
        );
      }
      setOpen(true);
    },
  });

  const close = () => {
    // Last-shown was set on open → next interval will re-trigger.
    setOpen(false);
  };

  const logWater = async (amountMl) => {
    if (submittingMl != null) return;
    setSubmittingMl(amountMl);
    try {
      await addWaterCup(today, amountMl);
      toast.success(`${amountMl} ml suv qayd etildi`);
      setOpen(false);
    } catch {
      toast.error("Suv qayd etib bo'lmadi");
    } finally {
      setSubmittingMl(null);
    }
  };

  const progressPct =
    goalMl > 0 ? Math.min(100, Math.round((consumedMl / goalMl) * 100)) : 0;
  const altCups = ALT_CUP_SIZES.filter((v) => v !== preferredMl);
  const submitting = submittingMl != null;

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
      direction="bottom"
    >
      <DrawerContent data-water-reminder-drawer="true">
        <DrawerHeader className="text-center">
          <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-2xl bg-sky-500/10">
            <DropletIcon className="size-7 text-sky-500" />
          </div>
          <DrawerTitle>Suv ichish vaqti!</DrawerTitle>
          <DrawerDescription>
            {consumedMl}/{goalMl} ml — yana {remainingMl} ml qoldi
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-5 pb-6">
          {/* Progress bar */}
          <div className="px-2">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>Bugungi maqsad</span>
              <span className="font-semibold text-sky-500">{progressPct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-sky-500/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Primary CTA — preferred cup size */}
          <button
            type="button"
            onClick={() => logWater(preferredMl)}
            disabled={submitting}
            className={cn(
              "flex w-full items-center justify-center gap-3 rounded-3xl bg-sky-500 px-5 py-4 text-white shadow-sm transition",
              "hover:scale-[1.02] hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            <div
              className={cn(
                "size-9 brightness-0 invert",
                cupClass(preferredMl),
              )}
            />
            <span className="text-base font-semibold">
              + {preferredMl} ml ich
            </span>
          </button>

          {/* Alternative cup sizes */}
          {altCups.length > 0 && (
            <div className="grid grid-cols-3 gap-2 px-2">
              {altCups.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => logWater(value)}
                  disabled={submitting}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 rounded-2xl border bg-card p-3 transition",
                    "hover:scale-105 hover:border-sky-500",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                >
                  <div className={cn("size-8", cupClass(value))} />
                  <span className="text-[11px] font-semibold tabular-nums">
                    {value} ml
                  </span>
                </button>
              ))}
            </div>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
