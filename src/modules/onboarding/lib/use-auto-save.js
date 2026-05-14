import { useEffect, useRef } from "react";
import { debounce } from "lodash";
import useApi from "@/hooks/api/use-api.js";
import { useOnboardingStore } from "@/store";
import {
  buildCoachOnboardingPayload,
  normalizeOnboardingStepForApi,
} from "./coach-onboarding-dto";
import { getOnboardingDraftApiPath } from "./onboarding-api-paths";
import { pickActiveUserDraftData } from "./user-draft-data";

/**
 * Extracts draft data from the onboarding store based on onboarding type.
 */
function extractDraftData(state, type) {
  if (type === "user") {
    return pickActiveUserDraftData(state);
  }

  if (type === "coach") {
    return buildCoachOnboardingPayload(state);
  }

  // Vendor types: gym, shop, food
  return state.vendorDrafts?.[type] ?? {};
}

/**
 * Builds a Zustand selector for the given onboarding type so that we only
 * re-trigger auto-save when the relevant slice of state changes, instead
 * of subscribing to every field in the entire store.
 */
function buildSelector(type) {
  if (type === "user") {
    return pickActiveUserDraftData;
  }

  if (type === "coach") {
    return (s) => ({
      coachCategory: s.coachCategory,
      coachCategories: s.coachCategories,
      targetAudience: s.targetAudience,
      availability: s.availability,
      experience: s.experience,
      specializations: s.specializations,
      certificationType: s.certificationType,
      certificationNumber: s.certificationNumber,
      certificateFiles: s.certificateFiles,
      coachLanguages: s.coachLanguages,
      coachCity: s.coachCity,
      coachWorkMode: s.coachWorkMode,
      coachWorkplace: s.coachWorkplace,
      coachMonthlyPrice: s.coachMonthlyPrice,
      coachMinMonthlyPrice: s.coachMinMonthlyPrice,
      coachMaxMonthlyPrice: s.coachMaxMonthlyPrice,
      coachBio: s.coachBio,
      coachAvatar: s.coachAvatar,
      wantsMarketplaceListing: s.wantsMarketplaceListing,
    });
  }

  // Vendor types: gym, shop, food
  return (s) => s.vendorDrafts?.[type];
}

const autoSaveQueues = new Map();
const defaultRateLimitRetryDelayMs = 10000;

function getAutoSaveQueue(type) {
  const key = type || "unknown";
  if (!autoSaveQueues.has(key)) {
    autoSaveQueues.set(key, {
      type: key,
      step: null,
      request: null,
      debounceMs: null,
      debouncedSave: null,
      pending: false,
      inFlight: false,
      needsFlush: false,
      retryTimer: null,
    });
  }

  return autoSaveQueues.get(key);
}

function getResponseStatus(error) {
  return error?.response?.status ?? error?.status ?? null;
}

function getResponseHeader(error, name) {
  const headers = error?.response?.headers;
  if (!headers) return null;
  if (typeof headers.get === "function") {
    return headers.get(name) ?? headers.get(name.toLowerCase());
  }
  return headers[name] ?? headers[name.toLowerCase()] ?? null;
}

function getRateLimitRetryDelayMs(error) {
  if (getResponseStatus(error) !== 429) return null;

  const retryAfter = getResponseHeader(error, "Retry-After");
  const retryAfterSeconds = Number(retryAfter);
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return Math.min(60000, Math.round(retryAfterSeconds * 1000));
  }

  return defaultRateLimitRetryDelayMs;
}

function getAutoSaveErrorMessage(error) {
  return error instanceof Error ? error.message : "Auto-save failed";
}

async function flushDraftSaveQueue(type, allowRetry = true) {
  const queue = getAutoSaveQueue(type);

  if (!queue.pending || !queue.request) return;
  if (queue.inFlight) {
    queue.needsFlush = true;
    return;
  }

  queue.pending = false;
  queue.inFlight = true;

  const state = useOnboardingStore.getState();
  const data = extractDraftData(state, queue.type);
  const currentStep = normalizeOnboardingStepForApi(queue.type, queue.step);
  const setDraftSaveStatus = state.setDraftSaveStatus;

  try {
    setDraftSaveStatus?.("saving");
    await queue.request.put(getOnboardingDraftApiPath(queue.type), {
      data,
      currentStep,
    });
    setDraftSaveStatus?.("saved", {
      lastSavedAt: new Date().toISOString(),
      error: null,
    });
  } catch (error) {
    const retryDelayMs = allowRetry ? getRateLimitRetryDelayMs(error) : null;

    if (retryDelayMs !== null) {
      queue.pending = true;
      setDraftSaveStatus?.("error", {
        error: "Auto-save rate limit reached; retrying shortly.",
      });
      queue.retryTimer = setTimeout(() => {
        queue.retryTimer = null;
        void flushDraftSaveQueue(queue.type, false);
      }, retryDelayMs);
    } else {
      setDraftSaveStatus?.("error", {
        error: getAutoSaveErrorMessage(error),
      });
    }
  } finally {
    queue.inFlight = false;

    if ((queue.needsFlush || queue.pending) && !queue.retryTimer) {
      queue.needsFlush = false;
      queue.debouncedSave?.();
    }
  }
}

function scheduleDraftSave({ type, step, request, debounceMs }) {
  const queue = getAutoSaveQueue(type);
  queue.type = type;
  queue.step = step;
  queue.request = request;
  queue.pending = true;

  if (queue.retryTimer) {
    clearTimeout(queue.retryTimer);
    queue.retryTimer = null;
  }

  if (!queue.debouncedSave || queue.debounceMs !== debounceMs) {
    queue.debouncedSave?.cancel?.();
    queue.debounceMs = debounceMs;
    queue.debouncedSave = debounce(
      () => void flushDraftSaveQueue(type),
      debounceMs,
      { maxWait: Math.max(debounceMs * 2, 10000) },
    );
  }

  if (queue.inFlight) {
    queue.needsFlush = true;
    return;
  }

  queue.debouncedSave();
}

export function __resetOnboardingAutoSaveQueuesForTest() {
  for (const queue of autoSaveQueues.values()) {
    queue.debouncedSave?.cancel?.();
    if (queue.retryTimer) clearTimeout(queue.retryTimer);
  }
  autoSaveQueues.clear();
}

/**
 * Hook that subscribes to the Zustand onboarding store and auto-saves
 * draft data to the server when relevant state changes.
 *
 * Uses raw axios instead of usePutQuery to avoid React Query re-renders
 * and query invalidation that caused loading spinners on every keystroke.
 *
 * @param {string} type - "user" | "coach" | "gym" | "shop" | "food"
 * @param {string} step - current step identifier (e.g. "name", "gender", "profile")
 * @param {object} options
 * @param {number} options.debounceMs - debounce delay in ms (default 5000)
 * @param {boolean} options.enabled - whether auto-save is active (default true)
 */
export function useOnboardingAutoSave(
  type,
  step,
  { debounceMs = 5000, enabled = true } = {},
) {
  const { request } = useApi();

  const enabledRef = useRef(enabled);
  const stepRef = useRef(step);
  const typeRef = useRef(type);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    typeRef.current = type;
  }, [type]);

  useEffect(() => {
    if (!enabled) return;

    // Subscribe only to the relevant slice using subscribeWithSelector
    const selector = buildSelector(type);

    const unsubscribe = useOnboardingStore.subscribe(
      selector,
      () => {
        if (!enabledRef.current) return;
        scheduleDraftSave({
          type: typeRef.current,
          step: stepRef.current,
          request,
          debounceMs,
        });
      },
      {
        equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b),
      },
    );

    return () => {
      unsubscribe();
    };
  }, [enabled, type, debounceMs, request]);

  // Also save when the step changes (user navigated forward/back)
  useEffect(() => {
    if (!enabled) return;
    scheduleDraftSave({
      type: typeRef.current,
      step: stepRef.current,
      request,
      debounceMs,
    });
  }, [step, enabled, debounceMs, request]);
}
