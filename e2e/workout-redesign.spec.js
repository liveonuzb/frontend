import { expect, test } from "@playwright/test";

const authUser = {
  id: "user-workout-redesign",
  name: "Shoxrux",
  email: "user@example.com",
  onboardingCompleted: true,
  onboardingFlowStatus: "ACTIVATED",
  roles: ["USER"],
  activeRole: "USER",
  premium: { status: "active" },
  subscription: { status: "ACTIVE" },
  gamification: { currentStreak: 4, longestStreak: 9 },
};

const json = (data, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(data),
});

const runningSession = {
  id: "run-live",
  workoutSessionId: "run-live",
  activityType: "OUTDOOR_RUN",
  type: "OUTDOOR_RUN",
  title: "Outdoor run",
  planName: "Outdoor run",
  status: "completed",
  startedAt: "2026-05-20T06:00:00.000Z",
  endedAt: "2026-05-20T06:32:11.000Z",
  durationSeconds: 1931,
  estimatedCalories: 412,
  running: {
    distanceMeters: 5020,
    durationSeconds: 1931,
    averagePaceSecondsPerKm: 385,
    caloriesBurned: 412,
    gpsQualityScore: 0.91,
    routePolyline: "encoded-route",
  },
  metrics: {
    distanceMeters: 5020,
    durationSeconds: 1931,
    caloriesBurned: 412,
    averagePaceSecondsPerKm: 385,
    gpsQualityScore: 0.91,
  },
  route: {
    polyline: "encoded-route",
  },
  points: [
    { sequence: 1, latitude: 41.311081, longitude: 69.240562 },
    { sequence: 2, latitude: 41.320069, longitude: 69.240562 },
  ],
};

const strengthSession = {
  id: "strength-1",
  activityType: "STRENGTH",
  type: "STRENGTH",
  title: "Full Body Strength",
  planName: "Full Body Strength",
  status: "completed",
  startedAt: "2026-05-19T16:00:00.000Z",
  endedAt: "2026-05-19T16:58:12.000Z",
  durationSeconds: 3492,
  estimatedCalories: 568,
  totalVolumeKg: 5240,
};

const report = {
  summary: {
    totalSessions: 2,
    totalDurationSeconds: 5423,
    totalCalories: 980,
    totalDistanceMeters: 5020,
    averagePaceSecondsPerKm: 385,
    totalVolumeKg: 5240,
    streakDays: 4,
  },
  runVsStrength: {
    running: { sessions: 1, durationSeconds: 1931, distanceMeters: 5020 },
    strength: { sessions: 1, durationSeconds: 3492, totalVolumeKg: 5240 },
  },
  typeDistribution: [
    { name: "Бег", value: 1 },
    { name: "Силовые", value: 1 },
  ],
  charts: {
    weeklyActivity: [
      { label: "20 май", durationHours: 0.5, distanceKm: 5.02 },
    ],
    monthlySessions: [{ label: "Май", sessions: 2 }],
    distancePaceTrend: [{ label: "20 май", distanceKm: 5.02, paceMinPerKm: 6.4 }],
    intensityDistribution: [{ name: "Умеренная", value: 2 }],
  },
  goals: {
    completionPercent: 78,
    sessions: { current: 2, target: 4 },
    distanceMeters: { current: 5020, target: 12000 },
    calories: { current: 980, target: 1400 },
  },
  recovery: {
    loadBalanceLabel: "Оптимальный",
    recommendation: "Продолжайте в текущем темпе.",
  },
  coachAdvice: {
    title: "AI совет тренера",
    text: "Бег и силовые тренировки собраны в одном отчете.",
  },
  recentWorkouts: [runningSession, strengthSession],
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((user) => {
    window.localStorage.setItem("storage_version", "v2");
    window.localStorage.setItem(
      "language-storage",
      JSON.stringify({
        state: { currentLanguage: "ru", hasSelectedLanguage: true },
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
          token: "workout-redesign-token",
          refreshToken: "workout-redesign-refresh",
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
  }, authUser);

  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api\/v1/, "");

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

    if (path.startsWith("/daily-tracking/") || path.startsWith("/user/tracking/")) {
      const date = path.split("/").at(-1) || "2026-05-20";
      await route.fulfill(
        json({
          data: {
            date,
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

    if (path === "/user/workout/dashboard") {
      await route.fulfill(
        json({
          data: {
            weeklyStats: { count: 2, calories: 980, duration: 90, target: 4 },
            recentWorkoutDays: ["2026-05-20", "2026-05-19"],
            personalRecordCount: 1,
            streak: { currentDays: 4, bestDays: 9 },
            recovery: {
              status: "good",
              score: 86,
              recommendation: "Баланс нагрузки хороший.",
            },
          },
        }),
      );
      return;
    }

    if (path === "/user/workout/start-run" && route.request().method() === "POST") {
      await route.fulfill(
        json({
          data: {
            workoutSessionId: "run-live",
            status: "active",
            startedAt: "2026-05-20T06:00:00.000Z",
          },
        }),
        201,
      );
      return;
    }

    if (path === "/user/workout/running/active") {
      await route.fulfill(json({ data: null }));
      return;
    }

    if (path === "/user/workout/running") {
      await route.fulfill(json({ data: { data: [runningSession], meta: {} } }));
      return;
    }

    if (path === "/user/workout/running/stats/summary") {
      await route.fulfill(
        json({
          data: {
            totalRuns: 1,
            totalDistanceMeters: 5020,
            totalDurationSeconds: 1931,
            totalCaloriesBurned: 412,
          },
        }),
      );
      return;
    }

    if (path === "/user/workout/weather/today") {
      await route.fulfill(
        json({
          data: {
            location: "Tashkent",
            temperatureC: 28,
            feelsLikeC: 30,
            condition: "Clear",
            humidity: 32,
            windKph: 9,
            aqi: 65,
            aqiLabel: "Moderate",
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

    if (path === "/user/workout/sessions/history") {
      await route.fulfill(
        json({
          data: {
            data: [runningSession, strengthSession],
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
            totalSessions: 2,
            totalDurationSeconds: 5423,
            totalCalories: 980,
            totalVolumeKg: 5240,
            streakDays: 4,
            planned: 2,
            completed: 2,
            missed: 0,
            completionPercent: 100,
          },
        }),
      );
      return;
    }

    if (path === "/user/workout/report") {
      await route.fulfill(json({ data: report }));
      return;
    }

    if (path === "/user/workout/plans/exercises") {
      await route.fulfill(json({ data: { data: [], meta: {} } }));
      return;
    }

    if (
      path === "/user/workout/plans/catalog" ||
      path === "/user/workout/plans/exercise-categories"
    ) {
      await route.fulfill(json({ data: [] }));
      return;
    }

    if (path.startsWith("/user/me/favorites")) {
      await route.fulfill(json({ data: [] }));
      return;
    }

    await route.fulfill(json({ data: {} }));
  });
});

test("workout redesign keeps running inside unified home, history, and report flows", async ({
  page,
}) => {
  await page.goto("/user/workout");
  await expect(page.getByRole("heading", { name: "Тренировка сегодня" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Начать бег" })).toBeVisible();

  await page.getByRole("button", { name: "Начать бег" }).click();
  await expect(page).toHaveURL(/\/user\/workout\/running\/live\/run-live/);

  await page.goto("/user/workout/history");
  await expect(page.getByRole("heading", { name: "История тренировок" })).toBeVisible();
  await expect(page.getByText("Outdoor run").first()).toBeVisible();

  await page.goto("/user/workout/report");
  await expect(page.getByRole("heading", { name: "Аналитика тренировок" })).toBeVisible();
  await expect(page.getByText("Бег vs Силовые")).toBeVisible();

  await page.goto("/user/workout/running");
  await expect(page).toHaveURL(/\/user\/workout\/home/);
  await expect(
    page.locator('[data-workout-tab="surface"]').getByText("Бег"),
  ).toHaveCount(0);
});
