import { expect, test } from "@playwright/test";

const authUser = {
  id: "user-running-live",
  name: "Runner",
  email: "runner@example.com",
  onboardingCompleted: true,
  onboardingFlowStatus: "ACTIVATED",
  roles: ["USER"],
  activeRole: "USER",
  premium: { status: "active" },
  subscription: { status: "ACTIVE" },
};

const gpsPoints = [
  { latitude: 41.311081, longitude: 69.240562, accuracy: 8, speed: 0 },
  { latitude: 41.311981, longitude: 69.240662, accuracy: 9, speed: 2.4 },
  { latitude: 41.312881, longitude: 69.240762, accuracy: 10, speed: 2.6 },
  { latitude: 41.313781, longitude: 69.240862, accuracy: 12, speed: 2.8 },
];

const json = (data, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(data),
});

const buildRunningSession = (state) => ({
  workoutSessionId: "run-live",
  runningSessionId: "running-run-live",
  activityType: "OUTDOOR_RUN",
  focus: "Outdoor run",
  status: state.status,
  startedAt: state.startedAt,
  pausedAt: state.pausedAt,
  endedAt: state.endedAt,
  durationSeconds: state.status === "completed" ? 420 : 0,
  estimatedCalories: state.status === "completed" ? 52 : 0,
  distanceMeters: state.status === "completed" ? 720 : 0,
  averagePaceSecondsPerKm: state.status === "completed" ? 583 : null,
  metrics: {
    distanceMeters: state.status === "completed" ? 720 : 0,
    durationSeconds: state.status === "completed" ? 420 : 0,
    movingDurationSeconds: state.status === "completed" ? 390 : 0,
    pausedDurationSeconds: state.pausedDurationSeconds,
    caloriesBurned: state.status === "completed" ? 52 : 0,
    averagePaceSecondsPerKm: state.status === "completed" ? 583 : null,
    gpsQualityScore: 0.94,
  },
  route: {
    polyline: "encoded-route",
    segments: ["segment-a", "segment-b"],
    pointCount: Math.max(2, state.points.length),
    acceptedPointCount: Math.max(2, state.points.length),
    filteredPointCount: 0,
  },
  points:
    state.points.length > 0
      ? state.points
      : [
          {
            sequence: 1,
            segmentIndex: 0,
            latitude: 41.311081,
            longitude: 69.240562,
            accuracy: 8,
            sourceTimestamp: state.startedAt,
          },
          {
            sequence: 2,
            segmentIndex: 0,
            latitude: 41.312881,
            longitude: 69.240762,
            accuracy: 10,
            sourceTimestamp: state.startedAt,
          },
        ],
  exerciseSummaries: [
    {
      exerciseKey: "outdoor-run",
      exerciseName: "Outdoor run",
      distanceMeters: state.status === "completed" ? 720 : 0,
      durationSeconds: state.status === "completed" ? 420 : 0,
      averagePaceSecondsPerKm: state.status === "completed" ? 583 : null,
    },
  ],
});

const setupRunningApi = async (page) => {
  const state = {
    status: "ready",
    startedAt: "2026-05-21T05:00:00.000Z",
    pausedAt: null,
    pausedDurationSeconds: 0,
    endedAt: null,
    points: [],
    pointBatchPayloads: [],
    finishPayloads: [],
    pauseCalls: 0,
    resumeCalls: 0,
  };

  await page.addInitScript(
    ({ user, points }) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem("storage_version", "v2");
      window.localStorage.setItem(
        "language-storage",
        JSON.stringify({
          state: { currentLanguage: "uz", hasSelectedLanguage: true },
          version: 0,
        }),
      );
      window.localStorage.setItem(
        "app-mode-storage",
        JSON.stringify({
          state: { mode: "madagascar" },
          version: 0,
        }),
      );
      window.sessionStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            isAuthenticated: true,
            token: "running-live-token",
            refreshToken: "running-live-refresh",
            user,
            roles: ["USER"],
            activeRole: "USER",
            onboardingCompleted: true,
            onboardingFlowStatus: "ACTIVATED",
            onboardingNextPath: null,
            latestPersonalizationJobId: null,
            latestPlanGenerationJobId: null,
            pendingVerification: null,
            authPhoneFlow: null,
            twoFactorChallenge: null,
            passwordReset: null,
          },
          version: 4,
        }),
      );

      const toPosition = (point, index) => ({
        coords: {
          latitude: point.latitude,
          longitude: point.longitude,
          accuracy: point.accuracy,
          altitude: 440 + index,
          altitudeAccuracy: 8,
          heading: 90,
          speed: point.speed,
        },
        timestamp: Date.parse("2026-05-21T05:00:00.000Z") + index * 30_000,
      });
      const positions = points.map(toPosition);
      let nextWatchId = 1;
      const watchTimers = new Map();

      Object.defineProperty(window.navigator, "geolocation", {
        configurable: true,
        value: {
          getCurrentPosition(success) {
            window.setTimeout(() => success(positions[0]), 20);
          },
          watchPosition(success) {
            const watchId = nextWatchId;
            nextWatchId += 1;
            const timers = positions.slice(1).map((position, index) =>
              window.setTimeout(() => success(position), 120 + index * 180),
            );
            watchTimers.set(watchId, timers);
            return watchId;
          },
          clearWatch(watchId) {
            const timers = watchTimers.get(watchId) ?? [];
            timers.forEach((timer) => window.clearTimeout(timer));
            watchTimers.delete(watchId);
          },
        },
      });
    },
    { user: authUser, points: gpsPoints },
  );

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const method = request.method();

    if (path === "/users/me" || path === "/user/me") {
      await route.fulfill(json({ data: authUser }));
      return;
    }

    if (path === "/users/me/premium" || path === "/user/me/premium") {
      await route.fulfill(
        json({
          data: {
            user: authUser,
            premium: { status: "active" },
            plans: [],
            history: [],
            recentPayments: [],
          },
        }),
      );
      return;
    }

    if (path === "/user/workout/running/active") {
      await route.fulfill(
        json({
          data: state.status === "ready" ? null : buildRunningSession(state),
        }),
      );
      return;
    }

    if (path === "/user/workout/running/run-live") {
      await route.fulfill(json({ data: buildRunningSession(state) }));
      return;
    }

    if (path === "/user/workout/running/run-live/begin" && method === "POST") {
      const payload = request.postDataJSON();
      state.status = "active";
      state.startedAt = payload?.startedAt ?? state.startedAt;
      state.pausedAt = null;
      if (payload?.firstPoint) {
        state.points.push(payload.firstPoint);
      }
      await route.fulfill(json({ data: buildRunningSession(state) }));
      return;
    }

    if (
      path === "/user/workout/running/run-live/points/batch" &&
      method === "POST"
    ) {
      const payload = request.postDataJSON();
      const points = payload?.points ?? [];
      state.pointBatchPayloads.push(payload);
      state.points.push(...points);
      await route.fulfill(
        json({
          data: {
            acceptedCount: points.length,
            duplicateCount: 0,
            rejectedCount: 0,
            lastAcceptedSequence: points.at(-1)?.sequence ?? 0,
          },
        }),
      );
      return;
    }

    if (path === "/user/workout/running/run-live/pause" && method === "POST") {
      state.status = "paused";
      state.pausedAt = "2026-05-21T05:03:00.000Z";
      state.pauseCalls += 1;
      await route.fulfill(json({ data: buildRunningSession(state) }));
      return;
    }

    if (path === "/user/workout/running/run-live/resume" && method === "POST") {
      state.status = "active";
      state.pausedAt = null;
      state.pausedDurationSeconds = 30;
      state.resumeCalls += 1;
      await route.fulfill(json({ data: buildRunningSession(state) }));
      return;
    }

    if (path === "/user/workout/running/run-live/finish" && method === "POST") {
      const payload = request.postDataJSON();
      state.status = "completed";
      state.endedAt = payload?.finishedAt ?? "2026-05-21T05:07:00.000Z";
      state.finishPayloads.push(payload);
      await route.fulfill(json({ data: buildRunningSession(state) }));
      return;
    }

    if (path === "/user/workout/sessions/history/run-live") {
      await route.fulfill(json({ data: buildRunningSession(state) }));
      return;
    }

    if (path === "/user/workout/sessions/history") {
      await route.fulfill(
        json({
          data: {
            data: [buildRunningSession(state)],
            meta: { hasMore: false, nextCursor: null, limit: 10 },
          },
        }),
      );
      return;
    }

    if (path === "/user/workout/sessions/history/summary") {
      await route.fulfill(
        json({
          data: {
            totalSessions: 1,
            totalDurationSeconds: 420,
            totalCalories: 52,
            totalDistanceMeters: 720,
            totalVolumeKg: 0,
            streakDays: 1,
          },
        }),
      );
      return;
    }

    if (path === "/user/workout/plans") {
      await route.fulfill(
        json({
          data: {
            items: [],
            templates: [],
            activePlanId: null,
            draftPlanId: null,
          },
        }),
      );
      return;
    }

    if (path.startsWith("/daily-tracking/") || path.startsWith("/user/tracking/")) {
      await route.fulfill(
        json({
          data: {
            date: "2026-05-21",
            waterCups: 0,
            waterLog: [],
            workoutLogs: [],
            meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
            steps: 0,
            workoutMinutes: 0,
            burnedCalories: 0,
            sleepHours: 0,
            mood: null,
          },
        }),
      );
      return;
    }

    await route.fulfill(json({ data: {} }));
  });

  return state;
};

test("tracks a live GPS run through start, pause, resume, finish, and completed history route", async ({
  page,
}) => {
  const state = await setupRunningApi(page);

  await page.goto("/user/workout/running/live/run-live");
  await expect(page.getByTestId("running-live-page")).toBeVisible();

  await page.getByRole("button", { name: /^START$/i }).click();
  await expect(
    page.getByText(/GPS ulandi|Sync navbatda|GPS signali zaif/i),
  ).toBeVisible();

  await expect.poll(() => state.pointBatchPayloads.length).toBeGreaterThan(0);
  await expect(
    page
      .locator('[data-testid="route-fallback-svg"], [data-testid="maplibre-map"]')
      .first(),
  ).toBeVisible();

  const pauseResume = page.getByRole("button", { name: /RESUME|DAVOM/i });
  await pauseResume.click();
  await expect.poll(() => state.pauseCalls).toBe(1);

  await pauseResume.click();
  await expect.poll(() => state.resumeCalls).toBe(1);

  await page.getByRole("button", { name: /END|YAKUN/i }).click();
  await page.getByRole("button", { name: /^Yakunlash$/i }).click();

  await expect.poll(() => state.finishPayloads.length).toBe(1);
  expect(state.finishPayloads[0]?.finalPoints?.length ?? 0).toBeGreaterThan(0);
  expect(state.finishPayloads[0]?.finalPointSequence ?? 0).toBeGreaterThan(0);
  await expect(page).toHaveURL(/\/user\/workout\/history\/run-live/);
  await expect(page.getByText("Outdoor run").first()).toBeVisible();
  await expect(
    page
      .locator('[data-testid="route-fallback-svg"], [data-testid="maplibre-map"]')
      .first(),
  ).toBeVisible();
});
