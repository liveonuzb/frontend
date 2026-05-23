import { useEffect } from "react";

/* ─────────────────────────────────────────────
   USE REMINDER TRIGGER (Dashboard reminders)
   Shared timer + activity logic used by Mood,
   Streak, and Water reminder drawers.

   Fires `onTrigger()` exactly once when ALL of:
   - `enabled === true`
   - User is on a visible tab
   - User has interacted (≥1 pointerdown) since
     mount
   - Cumulative active visible time ≥ thresholdMs
   - No other bottom drawer is open (matched by
     `[data-vaul-drawer-direction="bottom"]`,
     excluding `excludeSelector`)

   If a blocking drawer is detected at the moment
   the threshold is reached, the trigger retries
   every `retryMs` until clear.
   ───────────────────────────────────────────── */

const DEFAULT_TICK_MS = 2000;
const DEFAULT_THRESHOLD_MS = 60000;
const DEFAULT_RETRY_MS = 5000;

export default function useReminderTrigger({
  enabled,
  excludeSelector,
  onTrigger,
  thresholdMs = DEFAULT_THRESHOLD_MS,
  tickMs = DEFAULT_TICK_MS,
  retryMs = DEFAULT_RETRY_MS,
}) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (typeof onTrigger !== "function") return;

    const state = {
      activeMs: 0,
      lastTick: 0, // 0 = uninitialized; set on first qualifying tick
      interacted: false,
      cancelled: false,
      blockingTimeoutId: null,
      fired: false,
    };

    const onPointerDown = () => {
      state.interacted = true;
    };
    const onVisibility = () => {
      // Reset anchor when visibility flips so hidden time is not counted.
      state.lastTick = Date.now();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("visibilitychange", onVisibility);

    const tryFire = () => {
      if (state.cancelled || state.fired) return;

      const blocking = excludeSelector
        ? document.querySelector(
            `[data-vaul-drawer-direction="bottom"]:not(${excludeSelector})`,
          )
        : document.querySelector('[data-vaul-drawer-direction="bottom"]');

      if (blocking) {
        state.blockingTimeoutId = window.setTimeout(tryFire, retryMs);
        return;
      }

      state.fired = true;
      onTrigger();
    };

    const intervalId = window.setInterval(() => {
      if (state.cancelled || state.fired) return;
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
      if (state.activeMs >= thresholdMs) {
        window.clearInterval(intervalId);
        tryFire();
      }
    }, tickMs);

    return () => {
      state.cancelled = true;
      window.clearInterval(intervalId);
      if (state.blockingTimeoutId) window.clearTimeout(state.blockingTimeoutId);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, excludeSelector, onTrigger, thresholdMs, tickMs, retryMs]);
}
