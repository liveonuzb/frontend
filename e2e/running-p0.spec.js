import { expect, test } from "@playwright/test";

/* global process */

const apiBase = process.env.E2E_API_BASE_URL ?? "http://localhost:3000/api/v1";

const authState = {
  isAuthenticated: true,
  token: "e2e-token",
  refreshToken: "e2e-refresh",
  user: {
    id: "e2e-user",
    phone: "+998000000000",
    profile: { firstName: "E2E", lastName: "Runner" },
    onboardingCompleted: true,
    onboardingFlowStatus: "ACTIVATED",
    premium: { status: "active" },
    roles: ["USER"],
  },
  roles: ["USER"],
  activeRole: "USER",
  onboardingCompleted: true,
  onboardingFlowStatus: "ACTIVATED",
  onboardingNextPath: null,
  latestPersonalizationJobId: null,
  latestPlanGenerationJobId: null,
};

const installBrowserState = async (page, { geolocation = "success" } = {}) => {
  await page.addInitScript(
    ({ state, geolocationMode }) => {
      window.sessionStorage.setItem(
        "auth-storage",
        JSON.stringify({ state, version: 4 }),
      );
      window.localStorage.setItem(
        "language-storage",
        JSON.stringify({
          state: { currentLanguage: "uz", hasSelectedLanguage: true },
          version: 0,
        }),
      );
      window.localStorage.setItem(
        "app-mode-storage",
        JSON.stringify({ state: { mode: "madagascar" }, version: 0 }),
      );
      window.__runningWatchSuccess = null;
      window.__runningWatchError = null;
      window.__runningWatchCalls = 0;
      Object.defineProperty(window.navigator, "geolocation", {
        configurable: true,
        value:
          geolocationMode === "unavailable"
            ? {}
            : {
                watchPosition: (success, error) => {
                  window.__runningWatchCalls += 1;
                  window.__runningWatchSuccess = success;
                  window.__runningWatchError = error;
                  if (geolocationMode === "denied") {
                    window.setTimeout(() => {
                      error?.({ code: 1, message: "Permission denied" });
                    }, 0);
                  }
                  return window.__runningWatchCalls;
                },
                clearWatch: () => undefined,
              },
      });
    },
    { state: authState, geolocationMode: geolocation },
  );
};

const createSession = (overrides = {}) => ({
  workoutSessionId: "workout-e2e",
  runningSessionId: "run-e2e",
  status: "active",
  startedAt: new Date("2026-05-15T04:00:00.000Z").toISOString(),
  metrics: {
    distanceMeters: 0,
    durationSeconds: 0,
    caloriesBurned: 0,
    averagePaceSecondsPerKm: null,
    gpsQualityScore: 0.92,
  },
  lastAcceptedSequence: 0,
  points: [],
  splits: [],
  route: { polyline: null, encoding: "google" },
  ...overrides,
});

const buildRoutePoints = (acceptedSequences) =>
  acceptedSequences.map((sequence) => ({
    sequence,
    latitude: 41.311081 + sequence * 0.002,
    longitude: 69.240562,
    accuracy: 8,
    sourceTimestamp: new Date(
      Date.parse("2026-05-15T04:00:00.000Z") + sequence * 60000,
    ).toISOString(),
  }));

const setupRunningApi = async (
  page,
  {
    batchFailuresBeforeSuccess = 0,
    batchFailureStatus = 429,
    batchFailureHeaders = { "retry-after-short": "1" },
    initialActiveSession = null,
    startFailureStatus = null,
  } = {},
) => {
  let activeSession = initialActiveSession;
  let batchAttempts = 0;
  let startAttempts = 0;
  const acceptedSequences = [];

  await page.route(`${apiBase}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/v1", "");
    const method = request.method();

    if (path === "/user/me") {
      await fulfillJson(route, { data: authState.user });
      return;
    }

    if (path === "/user/me/premium") {
      await fulfillJson(route, {
        data: { premium: authState.user.premium, plans: [] },
      });
      return;
    }

    if (path === "/user/me/notifications") {
      await fulfillJson(route, { data: [] });
      return;
    }

    if (path === "/user/health-goals") {
      await fulfillJson(route, { data: null });
      return;
    }

    if (path === "/user/chat/rooms") {
      await fulfillJson(route, { data: [] });
      return;
    }

    if (path === "/user/onboarding/status") {
      await fulfillJson(route, {
        data: {
          onboardingCompleted: true,
          onboardingFlowStatus: "ACTIVATED",
          status: "ACTIVATED",
        },
      });
      return;
    }

    if (path === "/user/onboarding/user/draft") {
      await fulfillJson(route, { data: null });
      return;
    }

    if (path === "/user/meal-plans/me") {
      await fulfillJson(route, {
        data: { plans: [], activePlan: null, draftPlan: null },
      });
      return;
    }

    if (path.startsWith("/user/tracking/")) {
      const date = path.split("/").at(-1);
      await fulfillJson(route, {
        data: {
          date,
          waterLog: [],
          meals: {},
          workoutLogs: [],
          steps: 0,
          workoutMinutes: 0,
          burnedCalories: 0,
        },
      });
      return;
    }

    if (path === "/user/workout/running/active") {
      await fulfillJson(route, { data: activeSession });
      return;
    }

    if (path === "/user/workout/running/stats/summary") {
      await fulfillJson(route, {
        data: {
          totalRuns: activeSession?.status === "completed" ? 1 : 0,
          totalDistanceMeters: activeSession?.metrics?.distanceMeters ?? 0,
          totalDurationSeconds: activeSession?.metrics?.durationSeconds ?? 0,
          totalCaloriesBurned: activeSession?.metrics?.caloriesBurned ?? 0,
        },
      });
      return;
    }

    if (path === "/user/workout/running/start" && method === "POST") {
      startAttempts += 1;
      if (startFailureStatus) {
        await fulfillJson(
          route,
          { message: "Running feature is disabled" },
          startFailureStatus,
        );
        return;
      }

      activeSession = createSession();
      await fulfillJson(route, { data: activeSession }, 201);
      return;
    }

    if (
      path === "/user/workout/running/workout-e2e/points/batch" &&
      method === "POST"
    ) {
      batchAttempts += 1;
      const body = request.postDataJSON();

      if (batchAttempts <= batchFailuresBeforeSuccess) {
        await fulfillJson(
          route,
          { message: "Point sync failed" },
          batchFailureStatus,
          batchFailureHeaders,
        );
        return;
      }

      for (const point of body.points ?? []) {
        acceptedSequences.push(point.sequence);
      }

      activeSession = {
        ...activeSession,
        lastAcceptedSequence:
          acceptedSequences.length > 0 ? Math.max(...acceptedSequences) : 0,
        points: buildRoutePoints(acceptedSequences),
      };

      await fulfillJson(
        route,
        {
          data: {
            acceptedCount: body.points?.length ?? 0,
            duplicateCount: 0,
            rejectedCount: 0,
            lastAcceptedSequence: activeSession.lastAcceptedSequence,
          },
        },
        201,
      );
      return;
    }

    if (path === "/user/workout/running/workout-e2e/pause") {
      activeSession = { ...activeSession, status: "paused" };
      await fulfillJson(route, { data: activeSession }, 201);
      return;
    }

    if (path === "/user/workout/running/workout-e2e/resume") {
      activeSession = { ...activeSession, status: "active" };
      await fulfillJson(route, { data: activeSession }, 201);
      return;
    }

    if (path === "/user/workout/running/workout-e2e/finish") {
      activeSession = {
        ...activeSession,
        status: "completed",
        endedAt: new Date("2026-05-15T04:06:00.000Z").toISOString(),
        metrics: {
          distanceMeters: 500,
          durationSeconds: 240,
          caloriesBurned: 36,
          averagePaceSecondsPerKm: 480,
          gpsQualityScore: 0.92,
        },
        points: buildRoutePoints(acceptedSequences),
        route: { polyline: null, encoding: "google" },
      };
      await fulfillJson(route, { data: activeSession }, 201);
      return;
    }

    if (path === "/user/workout/running/workout-e2e") {
      await fulfillJson(route, {
        data: {
          ...activeSession,
          points: activeSession?.points ?? buildRoutePoints(acceptedSequences),
        },
      });
      return;
    }

    if (path === "/user/workout/running") {
      await fulfillJson(route, {
        data: activeSession?.status === "completed" ? [activeSession] : [],
      });
      return;
    }

    await fulfillJson(route, { data: null });
  });

  return {
    get batchAttempts() {
      return batchAttempts;
    },
    get startAttempts() {
      return startAttempts;
    },
    get activeSession() {
      return activeSession;
    },
    get acceptedSequences() {
      return acceptedSequences;
    },
  };
};

const openRunningHome = async (page) => {
  await page.goto("/user/workout/running");
  await page.waitForLoadState("networkidle").catch(() => undefined);
  if (new URL(page.url()).pathname !== "/user/workout/running") {
    await page.goto("/user/workout/running");
  }
  await expect(page.getByRole("heading", { name: /Running/i })).toBeVisible();
};

const startRun = async (page) => {
  await page.getByRole("button", { name: /Start run/i }).click();
  await expect(page).toHaveURL(/\/user\/workout\/running\/live\/workout-e2e/);
};

const emitPosition = async (
  page,
  {
    latitude = 41.311081,
    longitude = 69.240562,
    timestamp = Date.parse("2026-05-15T04:01:00.000Z"),
  } = {},
) => {
  await page.waitForFunction(
    () => typeof window.__runningWatchSuccess === "function",
  );
  await page.evaluate(
    ({
      latitude: pointLatitude,
      longitude: pointLongitude,
      pointTimestamp,
    }) => {
      window.__runningWatchSuccess({
        coords: {
          latitude: pointLatitude,
          longitude: pointLongitude,
          altitude: null,
          accuracy: 8,
          speed: null,
          heading: null,
        },
        timestamp: pointTimestamp,
      });
    },
    { latitude, longitude, pointTimestamp: timestamp },
  );
};

const fulfillJson = (route, payload, status = 200, headers = {}) =>
  route.fulfill({
    status,
    headers,
    contentType: "application/json",
    body: JSON.stringify(payload),
  });

test("running P0 flow survives rate-limited point sync", async ({ page }) => {
  await installBrowserState(page);
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());
  const api = await setupRunningApi(page, {
    batchFailuresBeforeSuccess: 1,
    batchFailureStatus: 429,
    batchFailureHeaders: { "retry-after-short": "1" },
  });

  await openRunningHome(page);
  await startRun(page);
  await emitPosition(page);
  await emitPosition(page, {
    latitude: 41.315081,
    timestamp: Date.parse("2026-05-15T04:02:00.000Z"),
  });

  await expect(page.getByText(/GPS tracking/i)).toBeVisible();
  await page.getByRole("button", { name: /Pauza/i }).click();
  await expect(page.getByText(/Pauzada/i)).toBeVisible();
  await page.getByRole("button", { name: /Davom ettirish/i }).click();
  await expect(page.getByText(/GPS tracking/i)).toBeVisible();

  await expect.poll(() => api.batchAttempts).toBeGreaterThan(1);
  await page.getByRole("button", { name: /Yakunlash/i }).click();
  await expect(
    page.getByRole("dialog", { name: /Finish training/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Finish$/i }).click();
  await expect(page).toHaveURL(/\/user\/workout\/running\/workout-e2e/);
  await expect(page.getByTestId("route-fallback-svg")).toHaveAttribute(
    "data-coordinate-count",
    "2",
  );
});

test("running live page shows a recoverable denied-location state", async ({
  page,
}) => {
  await installBrowserState(page, { geolocation: "denied" });
  await setupRunningApi(page);

  await openRunningHome(page);
  await startRun(page);

  await expect(page.getByRole("status")).toContainText(/GPS ruxsati kerak/i);
  await expect(
    page.getByRole("button", { name: /GPS qayta urinish/i }),
  ).toBeVisible();
});

test("running live page survives reload and keeps pause/resume controls working", async ({
  page,
}) => {
  await installBrowserState(page);
  const api = await setupRunningApi(page);

  await openRunningHome(page);
  await startRun(page);
  await emitPosition(page);
  await expect.poll(() => api.batchAttempts).toBeGreaterThan(0);

  await page.reload();
  await expect(page).toHaveURL(/\/user\/workout\/running\/live\/workout-e2e/);
  await expect(page.getByText(/GPS tracking/i)).toBeVisible();

  await page.getByRole("button", { name: /Pauza/i }).click();
  await expect(page.getByText(/Pauzada/i)).toBeVisible();
  await page.getByRole("button", { name: /Davom ettirish/i }).click();
  await expect(page.getByText(/GPS tracking/i)).toBeVisible();
});

test("running live page shows queued sync state after a temporary upload outage", async ({
  page,
}) => {
  await installBrowserState(page);
  const api = await setupRunningApi(page, {
    batchFailuresBeforeSuccess: 1,
    batchFailureStatus: 503,
    batchFailureHeaders: {},
  });

  await openRunningHome(page);
  await startRun(page);
  await emitPosition(page);

  await expect.poll(() => api.batchAttempts).toBe(1);
  await expect(page.getByText(/Sync navbatda/i)).toBeVisible();
  await page.getByRole("button", { name: /Pauza/i }).click();
  await expect.poll(() => api.batchAttempts).toBeGreaterThan(1);
});

test("running route handles backend feature flag mismatch without crashing", async ({
  page,
}) => {
  await installBrowserState(page);
  const api = await setupRunningApi(page, { startFailureStatus: 503 });

  await openRunningHome(page);
  await page.getByRole("button", { name: /Start run/i }).click();

  await expect.poll(() => api.startAttempts).toBe(1);
  await expect(page).toHaveURL(/\/user\/workout\/running$/);
  await expect(
    page.getByRole("alert", { name: /Running start error/i }),
  ).toContainText(/Yugurishni boshlab bo'lmadi|Run could not be started/i);
});
