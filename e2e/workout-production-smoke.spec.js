import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/* global process */

const apiBase = process.env.E2E_API_BASE_URL ?? "http://localhost:3000/api/v1";
const visualBaselineDir = path.resolve("test-results/workout-visual-baselines");

const authState = {
  isAuthenticated: true,
  token: "workout-production-token",
  refreshToken: "workout-production-refresh",
  user: {
    id: "workout-production-user",
    phone: "+998000000002",
    profile: { firstName: "Production", lastName: "Tester" },
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

const exerciseFixture = {
  id: "exercise-1",
  name: "Bench Press",
  category: "Chest",
  groupLabel: "Chest",
  equipment: "Barbell",
  equipments: ["Barbell"],
  targetMuscles: ["Chest"],
  instructions: ["Lie on the bench.", "Press the bar with control."],
  trackingType: "REPS_WEIGHT",
  defaultSets: 3,
  defaultReps: 10,
  defaultWeight: 40,
};

const planFixture = {
  id: "plan-1",
  name: "Full Body Strength",
  description: "Production smoke workout plan",
  status: "active",
  source: "manual",
  difficulty: "beginner",
  days: 28,
  daysPerWeek: 3,
  startDate: "2026-05-13T00:00:00.000Z",
  createdAt: "2026-05-13T00:00:00.000Z",
  updatedAt: "2026-05-16T04:00:00.000Z",
  schedule: [
    {
      day: "Dushanba",
      focus: "Strength",
      exercises: [
        {
          ...exerciseFixture,
          exerciseId: exerciseFixture.id,
          sets: [{ reps: 10, weight: 40 }],
        },
      ],
    },
  ],
  dayProgress: [],
  generationMeta: {
    benchmark: {
      exerciseName: "Bench Press",
      oneRepMaxKg: 46,
    },
  },
};

const workoutSessionFixture = {
  id: "session-1",
  planId: "plan-1",
  planName: "Full Body Strength",
  focus: "Strength",
  planDayIndex: 0,
  startedAt: "2026-05-16T04:00:00.000Z",
  endedAt: "2026-05-16T04:45:00.000Z",
  durationSeconds: 2700,
  estimatedCalories: 320,
  totalVolumeKg: 1200,
  totalSets: 6,
  completedSets: 6,
  completedExerciseCount: 2,
  exerciseSummaries: [
    {
      exerciseKey: "exercise-1",
      exerciseName: "Bench Press",
      completedSets: 3,
      totalReps: 30,
      totalVolumeKg: 1200,
    },
  ],
};

const runningDetailFixture = {
  workoutSessionId: "run-1",
  runningSessionId: "running-1",
  status: "completed",
  startedAt: "2026-05-16T03:00:00.000Z",
  endedAt: "2026-05-16T03:32:00.000Z",
  metrics: {
    distanceMeters: 5200,
    durationSeconds: 1920,
    movingDurationSeconds: 1880,
    caloriesBurned: 380,
    averagePaceSecondsPerKm: 369,
    averageSpeedKmh: 9.8,
    elevationGainMeters: 24,
    gpsQualityScore: 0.92,
  },
  route: { polyline: null, encoding: "google" },
  points: [
    {
      sequence: 1,
      latitude: 41.311081,
      longitude: 69.240562,
      accuracy: 8,
      sourceTimestamp: "2026-05-16T03:01:00.000Z",
    },
    {
      sequence: 2,
      latitude: 41.316081,
      longitude: 69.244562,
      accuracy: 8,
      sourceTimestamp: "2026-05-16T03:10:00.000Z",
    },
  ],
  moments: {
    title: "Morning run",
    text: "Easy aerobic run.",
    imageUploadId: null,
    imageUrl: null,
  },
  feeling: { level: 2 },
  bodyMetrics: { heightCm: null, weightKg: null },
};

const runningLiveFixture = {
  ...runningDetailFixture,
  workoutSessionId: "live-1",
  runningSessionId: "running-live-1",
  status: "ready",
  endedAt: null,
  metrics: {
    distanceMeters: 0,
    durationSeconds: 0,
    movingDurationSeconds: 0,
    caloriesBurned: 0,
    averagePaceSecondsPerKm: null,
    averageSpeedKmh: 0,
    elevationGainMeters: 0,
    gpsQualityScore: null,
  },
  points: [],
};

const workoutLogFixture = {
  id: "log-1",
  date: "2026-05-16",
  source: "quick-log",
  exercise: exerciseFixture,
  entries: [
    {
      id: "entry-1",
      sets: 1,
      reps: 10,
      weight: 40,
      burnedCalories: 10,
      addedAt: "2026-05-16T04:05:00.000Z",
    },
  ],
  summary: {
    totalSets: 1,
    maxReps: 10,
    maxWeight: 40,
    totalBurnedCalories: 10,
  },
};

const installBrowserState = async (
  page,
  { mode = "madagascar", theme = "light" } = {},
) => {
  await page.addInitScript(
    ({ state, appMode, colorTheme }) => {
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
        JSON.stringify({ state: { mode: appMode }, version: 0 }),
      );
      window.localStorage.setItem("theme", colorTheme);
      document.documentElement.classList.toggle("dark", colorTheme === "dark");

      Object.defineProperty(window.navigator, "geolocation", {
        configurable: true,
        value: {
          getCurrentPosition: (success) => {
            window.setTimeout(() => {
              success?.({
                coords: {
                  latitude: 41.311081,
                  longitude: 69.240562,
                },
              });
            }, 0);
          },
          watchPosition: () => 1,
          clearWatch: () => undefined,
        },
      });
    },
    { state: authState, appMode: mode, colorTheme: theme },
  );
};

const fulfillJson = (route, payload, status = 200) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(payload),
  });

const installMapMocks = async (page) => {
  await page.route("https://tiles.openfreemap.org/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/styles/")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          version: 8,
          sources: {},
          layers: [
            {
              id: "background",
              type: "background",
              paint: { "background-color": "#f7f3eb" },
            },
          ],
        }),
      });
      return;
    }

    await route.abort();
  });
};

const installWorkoutApi = async (page, { onCreateLog } = {}) => {
  await page.route(`${apiBase}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathName = url.pathname.replace("/api/v1", "");
    const method = request.method();

    if (pathName === "/user/me") {
      await fulfillJson(route, { data: authState.user });
      return;
    }

    if (pathName === "/user/me/premium") {
      await fulfillJson(route, {
        data: { premium: authState.user.premium, plans: [] },
      });
      return;
    }

    if (pathName === "/user/me/notifications") {
      await fulfillJson(route, { data: [] });
      return;
    }

    if (pathName === "/user/onboarding/status") {
      await fulfillJson(route, {
        data: {
          onboardingCompleted: true,
          onboardingFlowStatus: "ACTIVATED",
          status: "ACTIVATED",
        },
      });
      return;
    }

    if (pathName === "/user/workout/weather/today") {
      await fulfillJson(route, {
        data: {
          location: "Tashkent",
          temperatureC: 24,
          feelsLikeC: 25,
          condition: "Clear",
          humidity: 35,
          windKph: 8,
          aqi: 42,
          aqiLabel: "Good",
          pm25: 9,
          source: "open-meteo",
          updatedAt: "2026-05-16T04:00:00.000Z",
        },
      });
      return;
    }

    if (pathName === "/user/workout/overview") {
      await fulfillJson(route, {
        data: {
          weeklyStats: { count: 2, calories: 700, duration: 90, target: 4 },
          personalRecordCount: 3,
          personalRecords: [],
          recentWorkoutDays: ["2026-05-15", "2026-05-16"],
        },
      });
      return;
    }

    if (pathName === "/user/workout/plans") {
      await fulfillJson(route, {
        data: {
          activePlanId: "plan-1",
          draftPlanId: null,
          items: [planFixture],
          templates: [],
        },
      });
      return;
    }

    if (pathName === "/user/workout/plans/plan-1") {
      await fulfillJson(route, { data: planFixture });
      return;
    }

    if (pathName === "/user/workout/plans/catalog") {
      await fulfillJson(route, {
        data: { goals: [], levels: [], equipment: [], coverImages: [] },
      });
      return;
    }

    if (pathName === "/user/workout/plans/exercise-categories") {
      await fulfillJson(route, {
        data: [{ id: "chest", name: "Chest", slug: "chest" }],
      });
      return;
    }

    if (pathName === "/user/workout/plans/exercises") {
      await fulfillJson(route, { data: [exerciseFixture] });
      return;
    }

    if (pathName === "/user/workout/sessions/history/session-1") {
      await fulfillJson(route, { data: workoutSessionFixture });
      return;
    }

    if (pathName.startsWith("/user/workout/sessions/history")) {
      await fulfillJson(route, {
        data: [workoutSessionFixture],
        meta: { hasMore: false },
      });
      return;
    }

    if (pathName === "/user/workout/logs/log-1") {
      await fulfillJson(route, { data: workoutLogFixture });
      return;
    }

    if (pathName === "/user/workout/logs" && method === "POST") {
      onCreateLog?.(request.postDataJSON());
      await fulfillJson(route, { data: workoutLogFixture }, 201);
      return;
    }

    if (pathName === "/user/workout/logs") {
      await fulfillJson(route, { data: [workoutLogFixture] });
      return;
    }

    if (pathName === "/user/workout/running/active") {
      await fulfillJson(route, { data: null });
      return;
    }

    if (pathName === "/user/workout/running/stats/summary") {
      await fulfillJson(route, {
        data: {
          totalRuns: 1,
          totalDistanceMeters: runningDetailFixture.metrics.distanceMeters,
          totalDurationSeconds: runningDetailFixture.metrics.durationSeconds,
          totalCaloriesBurned: runningDetailFixture.metrics.caloriesBurned,
        },
      });
      return;
    }

    if (pathName === "/user/workout/running/run-1") {
      await fulfillJson(route, { data: runningDetailFixture });
      return;
    }

    if (pathName === "/user/workout/running/live-1") {
      await fulfillJson(route, { data: runningLiveFixture });
      return;
    }

    if (pathName === "/user/workout/running") {
      await fulfillJson(route, { data: [runningDetailFixture] });
      return;
    }

    if (pathName.startsWith("/user/tracking/")) {
      await fulfillJson(route, {
        data: {
          waterLog: [],
          meals: {},
          workoutLogs: [workoutLogFixture],
          steps: 4200,
          workoutMinutes: 45,
          burnedCalories: 320,
        },
      });
      return;
    }

    await fulfillJson(route, { data: null });
  });
};

const expectNoPageOverflow = async (page) => {
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const root = document.documentElement;
          const body = document.body;
          const main = document.querySelector("main");
          const rootOverflow = root.scrollWidth - root.clientWidth;
          const bodyOverflow = body.scrollWidth - window.innerWidth;
          const mainOverflow = main ? main.scrollWidth - main.clientWidth : 0;

          return Math.max(rootOverflow, bodyOverflow, mainOverflow);
        }),
      { message: "page should not have unintended horizontal overflow" },
    )
    .toBeLessThanOrEqual(2);
};

const expectKeyboardFocusSignal = async (page) => {
  let focusState = { inMain: false, hasSignal: false, tag: "" };

  for (let index = 0; index < 30; index += 1) {
    await page.keyboard.press("Tab");
    focusState = await page.evaluate(() => {
      const active = document.activeElement;
      if (!active || !active.closest("main, [role='dialog']")) {
        return { inMain: false, hasSignal: false, tag: active?.tagName ?? "" };
      }

      const style = window.getComputedStyle(active);
      const outlineWidth = Number.parseFloat(style.outlineWidth || "0") || 0;
      const hasOutline =
        style.outlineStyle !== "none" &&
        style.outlineStyle !== "hidden" &&
        outlineWidth > 0;
      const hasShadow = style.boxShadow && style.boxShadow !== "none";
      const hasRing = Array.from(active.classList).some((className) =>
        className.includes("focus-visible:ring"),
      );

      return {
        inMain: true,
        hasSignal: Boolean(hasOutline || hasShadow || hasRing),
        tag: active.tagName,
      };
    });

    if (focusState.inMain) {
      break;
    }
  }

  expect(focusState).toMatchObject({ inMain: true, hasSignal: true });
};

const openAndSmoke = async (page, url, assertVisible) => {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await assertVisible(page);
  await expectNoPageOverflow(page);
  await expectKeyboardFocusSignal(page);
};

test.describe("workout production smoke", () => {
  test.beforeEach(async ({ page }) => {
    await installBrowserState(page);
    await installMapMocks(page);
    await installWorkoutApi(page);
  });

  test("secondary workout routes are keyboard-accessible and mobile-stable", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const routes = [
      [
        "/user/workout/plans",
        (targetPage) =>
          expect(
            targetPage.getByRole("heading", { name: "Plans" }),
          ).toBeVisible(),
      ],
      [
        "/user/workout/plans/create",
        (targetPage) =>
          expect(targetPage.getByText("Yangi workout plan")).toBeVisible(),
      ],
      [
        "/user/workout/plans/plan-1",
        (targetPage) =>
          expect(
            targetPage.getByRole("heading", { name: "Full Body Strength" }),
          ).toBeVisible(),
      ],
      [
        "/user/workout/plans/plan-1/days/0",
        (targetPage) =>
          expect(targetPage.getByRole("heading", { name: "DAY 1" })).toBeVisible(),
      ],
      [
        "/user/workout/exercises",
        (targetPage) =>
          expect(
            targetPage.getByRole("heading", { name: "Mashqlar kutubxonasi" }),
          ).toBeVisible(),
      ],
      [
        "/user/workout/history",
        (targetPage) =>
          expect(
            targetPage.getByRole("heading", { name: "Workout tarixi" }),
          ).toBeVisible(),
      ],
      [
        "/user/workout/report",
        (targetPage) =>
          expect(
            targetPage.getByRole("heading", { name: "Workout tarixi" }),
          ).toBeVisible(),
      ],
      [
        "/user/workout/history/session-1",
        (targetPage) =>
          expect(targetPage.getByRole("heading", { name: "Strength" })).toBeVisible(),
      ],
      [
        "/user/workout/running/run-1",
        (targetPage) => expect(targetPage.getByText("Training Data")).toBeVisible(),
      ],
    ];

    for (const [url, assertVisible] of routes) {
      await openAndSmoke(page, url, assertVisible);
    }
  });

  test("workout log create flow saves through the real drawer controls", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    let createdPayload = null;

    await installWorkoutApi(page, {
      onCreateLog: (payload) => {
        createdPayload = payload;
      },
    });

    await page.goto("/user/workout/logs/create", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByText("Tezkor log")).toBeVisible();

    await page.getByPlaceholder("Mashq qidirish...").fill("Bench");
    await page.getByRole("button", { name: /Bench Press/i }).click();
    await expect(page.getByText("Setlar bo'yicha mashq logini to'ldiring")).toBeVisible();
    await page.getByRole("button", { name: "Logni saqlash" }).click();

    await expect.poll(() => createdPayload).not.toBeNull();
    expect(createdPayload.exerciseId).toBe(exerciseFixture.id);
    expect(createdPayload.entries.length).toBeGreaterThan(0);
    await expect(page).toHaveURL(/\/user\/workout(\/home)?/);
  });

  test("workout back and close controls use safe fallback routes", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/user/workout/plans/plan-1/days/0", {
      waitUntil: "domcontentloaded",
    });
    await page.getByRole("button", { name: "Planga qaytish" }).click();
    await expect(page).toHaveURL(/\/user\/workout\/plans\/plan-1$/);

    await page.goto("/user/workout/history/session-1", {
      waitUntil: "domcontentloaded",
    });
    await page.getByRole("button", { name: /^Tarix$/ }).click();
    await expect(page).toHaveURL(/\/user\/workout\/history$/);

    await page.goto("/user/workout/running/run-1", {
      waitUntil: "domcontentloaded",
    });
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page).toHaveURL(/\/user\/workout\/running$/);

    await page.goto("/user/workout/logs/create", {
      waitUntil: "domcontentloaded",
    });
    await page.getByRole("button", { name: "Bekor qilish" }).click();
    await expect(page).toHaveURL(/\/user\/workout(\/home)?$/);
  });

  test("secondary workout pages stay stable across app modes and themes", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const routeChecks = [
      [
        "/user/workout/plans",
        (targetPage) =>
          expect(
            targetPage.getByRole("heading", { name: "Plans" }),
          ).toBeVisible(),
      ],
      [
        "/user/workout/exercises",
        (targetPage) =>
          expect(
            targetPage.getByRole("heading", { name: "Mashqlar kutubxonasi" }),
          ).toBeVisible(),
      ],
      [
        "/user/workout/history",
        (targetPage) =>
          expect(
            targetPage.getByRole("heading", { name: "Workout tarixi" }),
          ).toBeVisible(),
      ],
      [
        "/user/workout/report",
        (targetPage) =>
          expect(
            targetPage.getByRole("heading", { name: "Workout tarixi" }),
          ).toBeVisible(),
      ],
      [
        "/user/workout/logs/create",
        (targetPage) =>
          expect(targetPage.getByText("Tezkor log")).toBeVisible(),
      ],
      [
        "/user/workout/running/run-1",
        (targetPage) => expect(targetPage.getByText("Training Data")).toBeVisible(),
      ],
    ];

    for (const mode of ["focus", "zen", "madagascar"]) {
      for (const theme of ["light", "dark"]) {
        await installBrowserState(page, { mode, theme });
        await installMapMocks(page);
        await installWorkoutApi(page);

        for (const [route, assertVisible] of routeChecks) {
          await openAndSmoke(page, route, assertVisible);
        }
      }
    }
  });

  test("workout home default components follow the selected app mode palette", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const buttonBackgrounds = [];

    for (const mode of ["focus", "zen", "madagascar"]) {
      await installBrowserState(page, { mode, theme: "light" });
      await page.goto("/user/workout/home", { waitUntil: "domcontentloaded" });
      await expect(page.getByText("Bugungi mashg'ulot")).toBeVisible();

      const ctaState = await page
        .getByRole("button", { name: /start today's workout/i })
        .evaluate((element) => ({
          mode: document.documentElement.dataset.appMode,
          backgroundImage: window.getComputedStyle(element).backgroundImage,
      }));

      expect(ctaState.mode).toBe(mode);
      if (mode !== "madagascar") {
        expect(ctaState.backgroundImage).not.toContain("rgb(255, 106, 0)");
      }
      buttonBackgrounds.push(ctaState.backgroundImage);
      await expectNoPageOverflow(page);
    }

    expect(new Set(buttonBackgrounds).size).toBe(3);
  });

  test("workout home does not recolor the global layout chrome", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const pickChrome = async () =>
      page.evaluate(() => {
        const pickStyle = (selector) => {
          const element = document.querySelector(selector);
          const style = window.getComputedStyle(element);
          return {
            backgroundColor: style.backgroundColor,
            backgroundImage: style.backgroundImage,
            borderColor: style.borderColor,
            boxShadow: style.boxShadow,
            color: style.color,
          };
        };

        const activeSubnav = document.querySelector(
          '.workout-subnav a[aria-current="page"]',
        );

        return {
          inset: pickStyle('[data-slot="sidebar-inset"]'),
          sidebar: pickStyle('[data-slot="sidebar-inner"]'),
          activeMenu: pickStyle(
            '[data-slot="sidebar-menu-button"][data-active="true"]',
          ),
          activeSubnav: activeSubnav
            ? pickStyle('.workout-subnav a[aria-current="page"]')
            : null,
          header: pickStyle(".workout-layout-header, header"),
        };
      });

    for (const mode of ["focus", "zen", "madagascar"]) {
      await installBrowserState(page, { mode, theme: "light" });
      await page.goto("/user/dashboard", { waitUntil: "domcontentloaded" });
      await expect(
        page.locator('[data-slot="sidebar-menu-button"][data-active="true"]'),
      ).toBeVisible();
      const dashboardChrome = await pickChrome();

      await page.goto("/user/workout/home", { waitUntil: "domcontentloaded" });
      await expect(page.getByText("Bugungi mashg'ulot")).toBeVisible();
      const workoutChrome = await pickChrome();

      expect(workoutChrome).toMatchObject({
        inset: dashboardChrome.inset,
        sidebar: dashboardChrome.sidebar,
        activeMenu: dashboardChrome.activeMenu,
        header: dashboardChrome.header,
      });
      expect(workoutChrome.activeSubnav).toMatchObject({
        backgroundColor: dashboardChrome.activeMenu.backgroundColor,
        color: dashboardChrome.activeMenu.color,
      });
      await expectNoPageOverflow(page);
    }
  });

  test("mobile keyboard-height viewport keeps detail moments and log forms usable", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/user/workout/running/run-1", {
      waitUntil: "domcontentloaded",
    });
    await page.getByPlaceholder("Add a title").focus();
    await page.setViewportSize({ width: 390, height: 520 });
    await expect(page.getByPlaceholder("Add a title")).toBeVisible();
    await expect(page.getByPlaceholder("Add text")).toBeVisible();
    await expectNoPageOverflow(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/user/workout/logs/create", {
      waitUntil: "domcontentloaded",
    });
    await page.getByPlaceholder("Mashq qidirish...").fill("Bench");
    await page.getByRole("button", { name: /Bench Press/i }).click();
    await page.setViewportSize({ width: 390, height: 520 });
    await expect(page.getByRole("button", { name: "Logni saqlash" })).toBeVisible();
    await expectNoPageOverflow(page);
  });
});

test.describe("workout visual baselines", () => {
  test("captures mobile home, live, and detail baselines across app modes", async ({
    page,
  }) => {
    fs.mkdirSync(visualBaselineDir, { recursive: true });
    await page.setViewportSize({ width: 390, height: 844 });

    const modes = ["focus", "zen", "madagascar"];
    const themes = ["light", "dark"];
    const pages = [
      ["home", "/user/workout/home", "Bugungi mashg'ulot"],
      ["live", "/user/workout/running/live/live-1", "START"],
      ["detail", "/user/workout/running/run-1", "Training Data"],
    ];

    for (const mode of modes) {
      for (const theme of themes) {
        for (const [name, route, text] of pages) {
          await installBrowserState(page, { mode, theme });
          await installMapMocks(page);
          await installWorkoutApi(page);
          await page.goto(route, { waitUntil: "domcontentloaded" });
          await expect(page.getByText(text).first()).toBeVisible();
          await expectNoPageOverflow(page);
          await page.screenshot({
            path: path.join(visualBaselineDir, `${mode}-${theme}-${name}.png`),
            fullPage: true,
          });
        }
      }
    }
  });
});
