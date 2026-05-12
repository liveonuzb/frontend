const QUEUE_PREFIX = "liveon:running:queue";
const ACTIVE_SESSION_KEY = "liveon:running:active-session";

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const getRunningQueueKey = (workoutSessionId) =>
  `${QUEUE_PREFIX}:${workoutSessionId}`;

export const saveActiveRunningSession = (session) => {
  if (!session?.workoutSessionId) {
    return;
  }

  window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
};

export const loadActiveRunningSession = () =>
  safeParse(window.localStorage.getItem(ACTIVE_SESSION_KEY), null);

export const clearActiveRunningSession = () => {
  window.localStorage.removeItem(ACTIVE_SESSION_KEY);
};

export const enqueueRunningPoints = (workoutSessionId, points) => {
  const key = getRunningQueueKey(workoutSessionId);
  const current = safeParse(window.localStorage.getItem(key), []);
  window.localStorage.setItem(key, JSON.stringify([...current, ...points]));
};

export const loadRunningPointQueue = (workoutSessionId) =>
  safeParse(
    window.localStorage.getItem(getRunningQueueKey(workoutSessionId)),
    [],
  );

export const clearRunningPointQueue = (workoutSessionId) => {
  window.localStorage.removeItem(getRunningQueueKey(workoutSessionId));
};
