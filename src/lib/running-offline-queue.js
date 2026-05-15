import { trimRunningPointQueue } from "./running-point-sync.js";

const QUEUE_PREFIX = "liveon:running:queue";
const ACTIVE_SESSION_KEY = "liveon:running:active-session";

const canUseLocalStorage = () =>
  typeof window !== "undefined" && Boolean(window.localStorage);

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const safeGetItem = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const safeRemoveItem = (key) => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Best effort cleanup only.
  }
};

export const getRunningQueueKey = (workoutSessionId) =>
  `${QUEUE_PREFIX}:${workoutSessionId}`;

export const saveActiveRunningSession = (session) => {
  if (!canUseLocalStorage() || !session?.workoutSessionId) {
    return;
  }

  safeSetItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
};

export const loadActiveRunningSession = () =>
  canUseLocalStorage()
    ? safeParse(safeGetItem(ACTIVE_SESSION_KEY), null)
    : null;

export const clearActiveRunningSession = () => {
  if (!canUseLocalStorage()) {
    return;
  }

  safeRemoveItem(ACTIVE_SESSION_KEY);
};

export const enqueueRunningPoints = (workoutSessionId, points) => {
  if (!canUseLocalStorage() || !workoutSessionId) {
    return [];
  }

  const key = getRunningQueueKey(workoutSessionId);
  const current = safeParse(safeGetItem(key), []);
  const nextQueue = trimRunningPointQueue([...current, ...points]);
  safeSetItem(key, JSON.stringify(nextQueue));
  return nextQueue;
};

export const loadRunningPointQueue = (workoutSessionId) =>
  canUseLocalStorage() && workoutSessionId
    ? trimRunningPointQueue(
        safeParse(safeGetItem(getRunningQueueKey(workoutSessionId)), []),
      )
    : [];

export const saveRunningPointQueue = (workoutSessionId, points) => {
  if (!canUseLocalStorage() || !workoutSessionId) {
    return [];
  }

  const nextQueue = trimRunningPointQueue(points);
  safeSetItem(getRunningQueueKey(workoutSessionId), JSON.stringify(nextQueue));
  return nextQueue;
};

export const clearRunningPointQueue = (workoutSessionId) => {
  if (!canUseLocalStorage()) {
    return;
  }

  safeRemoveItem(getRunningQueueKey(workoutSessionId));
};
