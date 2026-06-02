import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FlameIcon, GemIcon } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
} from "@/components/ui/drawer";
import { useGetQuery } from "@/hooks/api";
import { usePostQuery } from "@/hooks/api";
import { useAuthStore } from "@/store";
import { cn } from "@/lib/utils";
import { getApiResponseData } from "@/lib/api-response";
import { DASHBOARD_ME_QUERY_KEY, normalizeDateKey } from "./query-helpers.js";

/* ─────────────────────────────────────────────
   STREAK RESTORE DRAWER (Dashboard-only)
   Surfaces 3s after dashboard mount when the
   user's streak is broken (currentStreak === 0
   AND last log was 1–3 days ago AND previous
   streak > 0). Lets the user spend XP to
   backfill the gap and resume their streak.
   One-shot per day — once dismissed or
   restored, stays hidden.
   ───────────────────────────────────────────── */

const OPEN_DELAY_MS = 3000;
const RETRY_AFTER_BLOCKING_MS = 5000;
const STORAGE_PREFIX = "streak-restore:dismissed-on";
const QUOTE_QUERY_KEY = ["streak", "restore-quote"];

const storageKey = (userId) => `${STORAGE_PREFIX}:${userId}`;

export default function StreakRestoreDrawer() {
  const userId = useAuthStore((state) => state.user?.id);
  const today = normalizeDateKey(new Date());
  const [open, setOpen] = useState(false);

  const { data: quoteResponse } = useGetQuery({
    url: "/user/gamification/streak/restore-quote",
    queryProps: {
      queryKey: QUOTE_QUERY_KEY,
      enabled: Boolean(userId),
    },
  });
  const quote = getApiResponseData(quoteResponse, null);

  const eligible = Boolean(quote?.eligible);
  const previousStreak = quote?.previousStreak ?? 0;
  const missedDays = quote?.missedDays ?? 0;
  const cost = quote?.cost ?? 0;
  const currentXp = quote?.currentXp ?? 0;
  const canAfford = Boolean(quote?.canAfford);

  const restoreMutation = usePostQuery({
    listKey: DASHBOARD_ME_QUERY_KEY,
    mutationProps: {
      onSuccess: () => {
        // Quote becomes ineligible after success — refetch on next mount.
      },
    },
  });

  const shownRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    if (!eligible) return;
    if (shownRef.current) return;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(storageKey(userId)) === today) return;

    const state = { cancelled: false, retryId: null };

    const tryOpen = () => {
      if (state.cancelled || shownRef.current) return;
      const blocking = document.querySelector(
        '[data-vaul-drawer-direction="bottom"]:not([data-streak-restore-drawer="true"])',
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
  }, [userId, eligible, today]);

  const dismiss = () => {
    if (userId && typeof window !== "undefined") {
      window.localStorage.setItem(storageKey(userId), today);
    }
    setOpen(false);
  };

  const handleRestore = async () => {
    if (!canAfford || restoreMutation.isPending) return;
    try {
      await restoreMutation.mutateAsync({
        url: "/user/gamification/streak/restore",
      });
      toast.success("Streak qaytarildi! 🔥");
      dismiss();
    } catch (error) {
      const message =
        error?.response?.data?.message ?? "Streakni qaytarib bo'lmadi";
      toast.error(message);
    }
  };

  const restoredStreakAfter = previousStreak + missedDays;

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : dismiss())}
      direction="bottom"
    >
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm" data-streak-restore-drawer="true">
        <DrawerHeader className="text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5">
              <GemIcon className="size-4 text-amber-500" />
              <span className="text-sm font-bold tabular-nums text-amber-600">
                {currentXp}
              </span>
            </div>
          </div>

          <div className="mx-auto mt-3 flex size-20 items-center justify-center">
            <div className="relative">
              <FlameIcon
                className="size-16 text-orange-500/30"
                strokeWidth={1.5}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">🔥</span>
              </div>
            </div>
          </div>

          <DrawerTitle className="mt-4 text-center text-2xl font-black">
            <span className="text-emerald-600">{previousStreak} kunlik</span>{" "}
            streakni qaytarasizmi?
          </DrawerTitle>
          <DrawerDescription className="text-center">
            {missedDays === 1
              ? "1 kun o'tkazib yubordingiz."
              : `${missedDays} kun o'tkazib yubordingiz.`}{" "}
            Streakingizni saqlab qoling.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="space-y-4 pb-6">
          <button
            type="button"
            onClick={handleRestore}
            disabled={!canAfford || restoreMutation.isPending}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 font-semibold shadow-sm transition",
              canAfford
                ? "bg-foreground text-background hover:scale-[1.02]"
                : "cursor-not-allowed bg-muted text-muted-foreground",
              restoreMutation.isPending && "opacity-60",
            )}
          >
            <span>
              {restoreMutation.isPending
                ? "Qaytarilmoqda..."
                : `${cost} ga qaytarish`}
            </span>
            <GemIcon className="size-4" />
          </button>

          {!canAfford && cost > 0 ? (
            <p className="text-center text-xs text-muted-foreground">
              Yetarli XP yo'q ({currentXp}/{cost}). Faollik orqali XP yig'ing.
            </p>
          ) : null}

          {canAfford ? (
            <p className="text-center text-[11px] text-muted-foreground">
              Qaytarilgandan so'ng streakingiz {restoredStreakAfter} kun bo'ladi
            </p>
          ) : null}

          <button
            type="button"
            onClick={dismiss}
            className="w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            0 dan boshlash
          </button>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
