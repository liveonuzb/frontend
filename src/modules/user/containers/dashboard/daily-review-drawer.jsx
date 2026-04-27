import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import useGetQuery from "@/hooks/api/use-get-query";
import useHealthGoals from "@/hooks/app/use-health-goals";
import { useAuthStore } from "@/store";
import { getApiResponseData } from "@/lib/api-response";
import { cn } from "@/lib/utils";
import { normalizeDateKey } from "./query-helpers.js";
import { dailyReportQueryKey, getYesterdayKey } from "../report/report-helpers.js";

/* ─────────────────────────────────────────────
   DAILY REVIEW DRAWER (Dashboard-only)
   Shows a short popup in the morning when
   yesterday has tracking data. One-shot per day.
   ───────────────────────────────────────────── */

const OPEN_DELAY_MS = 3600;
const RETRY_AFTER_BLOCKING_MS = 5000;
const STORAGE_PREFIX = "daily-review:shown-on";

const storageKey = (userId) => `${STORAGE_PREFIX}:${userId}`;

const parseClock = (value, fallback) => {
  const source =
    typeof value === "string" && /^\d{1,2}:\d{2}$/.test(value)
      ? value
      : fallback;
  const [h, m] = source.split(":").map(Number);
  return h * 60 + m;
};

export default function DailyReviewDrawer() {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.user?.id);
  const today = normalizeDateKey(new Date());
  const yesterday = getYesterdayKey();
  const [open, setOpen] = useState(false);

  const {
    goals: { waterNotifStart },
  } = useHealthGoals();

  const startMinute = parseClock(waterNotifStart, "07:00");
  const now = new Date();
  const nowMinute = now.getHours() * 60 + now.getMinutes();
  const isAfterStart = nowMinute >= startMinute;

  const { data: reportResponse } = useGetQuery({
    url: `/user/tracking/reports/daily?date=${yesterday}`,
    queryProps: {
      queryKey: dailyReportQueryKey(yesterday),
      enabled: Boolean(userId) && isAfterStart,
    },
  });
  const report = getApiResponseData(reportResponse, null);
  const hasData = Boolean(report?.hasData);

  const shownRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    if (!isAfterStart) return;
    if (!hasData) return;
    if (shownRef.current) return;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(storageKey(userId)) === today) return;

    const state = { cancelled: false, retryId: null };

    const tryOpen = () => {
      if (state.cancelled || shownRef.current) return;

      const blocking = document.querySelector(
        '[data-vaul-drawer-direction="bottom"]:not([data-daily-review-drawer="true"])',
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
  }, [userId, today, isAfterStart, hasData]);

  const markShown = () => {
    if (userId && typeof window !== "undefined") {
      window.localStorage.setItem(storageKey(userId), today);
    }
  };

  const dismiss = () => {
    markShown();
    setOpen(false);
  };

  const openReport = () => {
    markShown();
    setOpen(false);
    navigate(`/user/dashboard/report/daily/${yesterday}`);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : dismiss())}
      direction="bottom"
    >
      <DrawerContent data-daily-review-drawer="true">
        <DrawerHeader className="text-center">
          <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-3xl bg-primary/10">
            <span className="text-3xl">🐧</span>
          </div>
          <DrawerTitle>Kecha bo'yicha hisobot tayyor!</DrawerTitle>
          <DrawerDescription>
            O'tgan kuningizni 30 soniyada ko'rib chiqing.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-4 pb-6">
          <div className="grid gap-2 rounded-3xl border bg-card p-4 text-left text-sm text-muted-foreground">
            <div className="flex gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>Suv, ovqat va faolligingiz tahlil qilindi</span>
            </div>
            <div className="flex gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>Oqsil, kaloriya va makrolar hisoblandi</span>
            </div>
            <div className="flex gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>Fast food iste'moli tekshirildi</span>
            </div>
          </div>

          <div className="grid gap-2">
            <Button
              type="button"
              className="h-11 rounded-full"
              onClick={openReport}
            >
              Hisobotni ko'rish
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={cn("h-11 rounded-full")}
              onClick={dismiss}
            >
              Keyinroq eslat
            </Button>
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
