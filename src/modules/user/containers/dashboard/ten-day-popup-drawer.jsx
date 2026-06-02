import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import get from "lodash/get";
import toNumber from "lodash/toNumber";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useGetQuery } from "@/hooks/api";
import { useAuthStore } from "@/store";
import { getApiResponseData } from "@/lib/api-response";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_ME_QUERY_KEY,
  getUserFromResponse,
  normalizeDateKey,
} from "./query-helpers.js";
import { METRIC_META, rangeReportQueryKey } from "../report/report-helpers.js";

/* ─────────────────────────────────────────────
   TEN-DAY POPUP DRAWER (Dashboard-only)
   Celebration popup every 10 streak days.
   One-shot per streak milestone.
   ───────────────────────────────────────────── */

const OPEN_DELAY_MS = 4200;
const RETRY_AFTER_BLOCKING_MS = 5000;
const STORAGE_PREFIX = "ten-day-popup:last-shown-streak";

const storageKey = (userId) => `${STORAGE_PREFIX}:${userId}`;

export default function TenDayPopupDrawer() {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.user?.id);
  const today = normalizeDateKey(new Date());
  const [open, setOpen] = useState(false);

  const { data: meData } = useGetQuery({
    url: "/users/me",
    queryProps: {
      queryKey: DASHBOARD_ME_QUERY_KEY,
      enabled: Boolean(userId),
    },
  });
  const user = getUserFromResponse(meData);
  const currentStreak = get(user, "currentStreak", 0);

  const eligible =
    Boolean(userId) && currentStreak > 0 && currentStreak % 10 === 0;

  const { data: reportResponse } = useGetQuery({
    url: `/user/tracking/reports/range?days=10&endDate=${today}`,
    queryProps: {
      queryKey: rangeReportQueryKey(10, today),
      enabled: eligible,
    },
  });
  const report = getApiResponseData(reportResponse, null);
  const hasReport = Boolean(report?.period?.startDate && report?.period?.endDate);

  const shownRef = useRef(false);

  useEffect(() => {
    if (!eligible) return;
    if (!hasReport) return;
    if (shownRef.current) return;
    if (typeof window === "undefined") return;

    const lastShown = window.localStorage.getItem(storageKey(userId));
    if (lastShown && toNumber(lastShown) === currentStreak) return;

    const state = { cancelled: false, retryId: null };

    const tryOpen = () => {
      if (state.cancelled || shownRef.current) return;
      const blocking = document.querySelector(
        '[data-vaul-drawer-direction="bottom"]:not([data-ten-day-popup-drawer="true"])',
      );
      if (blocking) {
        state.retryId = window.setTimeout(tryOpen, RETRY_AFTER_BLOCKING_MS);
        return;
      }
      shownRef.current = true;
      window.localStorage.setItem(storageKey(userId), String(currentStreak));
      setOpen(true);
    };

    const openId = window.setTimeout(tryOpen, OPEN_DELAY_MS);

    return () => {
      state.cancelled = true;
      window.clearTimeout(openId);
      if (state.retryId) window.clearTimeout(state.retryId);
    };
  }, [eligible, hasReport, userId, currentStreak]);

  const dismiss = () => {
    if (userId && typeof window !== "undefined") {
      window.localStorage.setItem(storageKey(userId), String(currentStreak));
    }
    setOpen(false);
  };

  const openDetails = () => {
    dismiss();
    navigate(`/user/report/range/10?endDate=${today}`);
  };

  const waterAvg = report?.averages?.water?.value ?? 0;
  const proteinAvg = report?.averages?.protein?.value ?? 0;
  const caloriesAvg = report?.averages?.calories?.value ?? 0;
  const fastFood = report?.averages?.fastFood?.value ?? 0;
  const weightDelta = report?.highlights?.weight?.delta ?? null;

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : dismiss())}
      direction="bottom"
    >
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm" data-ten-day-popup-drawer="true">
        <DrawerHeader className="text-center">
          <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-3xl bg-amber-500/10">
            <span className="text-3xl">🏆</span>
          </div>
          <DrawerTitle>Zo'r ish!</DrawerTitle>
          <DrawerDescription>So'nggi 10 kunlik progress</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-4 pb-6">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border bg-card p-3 text-center">
              <div className="text-lg font-black tabular-nums">
                {report?.successfulDays ?? 0}/10
              </div>
              <div className="text-[11px] text-muted-foreground">Yaxshi kunlar</div>
            </div>
            <div className="rounded-2xl border bg-card p-3 text-center">
              <div className="text-lg font-black tabular-nums">
                {currentStreak}
              </div>
              <div className="text-[11px] text-muted-foreground">Seriya</div>
            </div>
            <div className="rounded-2xl border bg-card p-3 text-center">
              <div className="text-lg font-black tabular-nums">
                {report?.overallScore ?? 0}
              </div>
              <div className="text-[11px] text-muted-foreground">Ball</div>
            </div>
          </div>

          <div className="space-y-2 rounded-3xl border bg-card p-4 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>{METRIC_META.water.label}</span>
              <span className="font-semibold text-foreground">
                {METRIC_META.water.formatActual(waterAvg)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>{METRIC_META.protein.label}</span>
              <span className="font-semibold text-foreground">
                {METRIC_META.protein.formatActual(proteinAvg)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>{METRIC_META.calories.label}</span>
              <span className="font-semibold text-foreground">
                {METRIC_META.calories.formatActual(caloriesAvg)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>{METRIC_META.fastFood.label}</span>
              <span className="font-semibold text-foreground">
                {METRIC_META.fastFood.formatActual(fastFood)}
              </span>
            </div>
            {weightDelta != null ? (
              <div className="flex items-center justify-between">
                <span>Vazn</span>
                <span className="font-semibold text-foreground">
                  {weightDelta > 0 ? "+" : ""}
                  {weightDelta} kg
                </span>
              </div>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Button type="button" className="h-11 rounded-full" onClick={openDetails}>
              Batafsil hisobotni ko'rish
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={cn("h-11 rounded-full")}
              onClick={dismiss}
            >
              Davom etaman
            </Button>
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
