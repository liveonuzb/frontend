import { expect, test } from "@playwright/test";

const today = "2026-05-20";

const authUser = {
  id: "visual-user",
  phone: "+998901234567",
  firstName: "Visual",
  lastName: "User",
  roles: ["USER"],
  onboardingCompleted: true,
  onboardingFlowStatus: "ACTIVATED",
  passwordSetupRequired: false,
  onboarding: {
    completed: true,
    flowStatus: "ACTIVATED",
    goal: "maintain",
  },
};

const goals = {
  goal: "maintain",
  calories: 2850,
  protein: 146,
  carbs: 135,
  fat: 42,
  fiber: 30,
  waterMl: 2850,
  cupSize: 250,
  steps: 10000,
  sleepHours: 8,
  workoutMinutes: 60,
};

const dayData = {
  date: today,
  waterCups: 5,
  waterLog: [
    { id: "w1", time: `${today}T08:00:00.000Z`, amountMl: 250 },
    { id: "w2", time: `${today}T10:00:00.000Z`, amountMl: 250 },
    { id: "w3", time: `${today}T12:00:00.000Z`, amountMl: 250 },
    { id: "w4", time: `${today}T14:00:00.000Z`, amountMl: 250 },
    { id: "w5", time: `${today}T16:00:00.000Z`, amountMl: 250 },
  ],
  meals: {
    breakfast: [
      {
        id: "m1",
        name: "Tuxumli nonushta",
        calories: 520,
        protein: 32,
        carbs: 42,
        fat: 18,
        quantity: 1,
        grams: 280,
        source: "manual",
        addedAt: `${today}T08:30:00.000Z`,
      },
    ],
    lunch: [
      {
        id: "m2",
        name: "Tovuqli guruch",
        calories: 780,
        protein: 58,
        carbs: 88,
        fat: 20,
        quantity: 1,
        grams: 420,
        source: "ai",
        addedAt: `${today}T13:10:00.000Z`,
      },
    ],
    dinner: [
      {
        id: "m3",
        name: "Sabzavotli salat",
        calories: 430,
        protein: 22,
        carbs: 36,
        fat: 16,
        quantity: 1,
        grams: 330,
        source: "saved-meal",
        addedAt: `${today}T19:00:00.000Z`,
      },
    ],
    snack: [
      {
        id: "m4",
        name: "Yong'oq va yogurt",
        calories: 285,
        protein: 14,
        carbs: 22,
        fat: 12,
        quantity: 1,
        grams: 180,
        source: "manual",
        addedAt: `${today}T16:30:00.000Z`,
      },
    ],
  },
  steps: 6240,
  workoutMinutes: 35,
  burnedCalories: 280,
  sleepHours: 7.5,
  mood: "good",
};

const planState = {
  activePlan: {
    id: "plan-active",
    name: "Sog'lom balans",
    status: "active",
    goal: "maintain",
    mealCount: 4,
    startDate: today,
    updatedAt: `${today}T12:00:00.000Z`,
    weeklyKanban: {},
  },
  draftPlan: {
    id: "plan-draft",
    name: "Mushak massasi",
    status: "draft",
    goal: "gain",
    mealCount: 5,
    updatedAt: `${today}T11:00:00.000Z`,
    weeklyKanban: {},
  },
  plans: [],
};

const buildReport = () => ({
  period: { startDate: "2026-05-14", endDate: today, days: 7 },
  goals,
  summary: {
    avgCalories: 2110,
    avgWaterMl: 1780,
    avgHealthScore: 81,
    adherenceRate: 74,
    avgCarbs: 168,
    avgProtein: 128,
    avgFat: 58,
  },
  sourceBreakdown: [
    { name: "Qo'lda", value: 45 },
    { name: "AI", value: 35 },
    { name: "Saqlangan", value: 20 },
  ],
  daily: Array.from({ length: 7 }, (_, index) => ({
    date: `2026-05-${String(14 + index).padStart(2, "0")}`,
    calories: 1900 + index * 60,
    targetCalories: goals.calories,
    protein: 118 + index,
    carbs: 150 + index * 4,
    fat: 52 + index,
    waterMl: 1500 + index * 90,
    healthScore: 76 + index,
    mealsCount: 3 + (index % 2),
  })),
});

const json = (data, status = 200) => ({
  status,
  contentType: "application/json",
  headers: {
    "access-control-allow-origin": "http://localhost:3030",
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "*",
  },
  body: JSON.stringify(data),
});

const seedBrowserState = async (page) => {
  await page.goto("/app-config.js", { waitUntil: "domcontentloaded" });
  await page.evaluate((user) => {
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
          token: "visual-token",
          refreshToken: "visual-refresh",
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
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((user) => {
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
          token: "visual-token",
          refreshToken: "visual-refresh",
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
    const userPath = path.replace(/^\/user/, "");

    if (userPath === "/me" || path === "/users/me") {
      await route.fulfill(json({ data: authUser }));
      return;
    }

    if (userPath === "/health-goals" || path === "/health-goals") {
      await route.fulfill(json({ data: goals }));
      return;
    }

    if (userPath === "/meal-plans/me" || path === "/meal-plans/me") {
      await route.fulfill(json({ data: planState }));
      return;
    }

    if (userPath === "/meal-plans/templates" || path === "/meal-plans/templates") {
      await route.fulfill(json({ data: { templates: [] } }));
      return;
    }

    if (userPath === "/tracking/history" || path === "/daily-tracking/history") {
      await route.fulfill(
        json({
          data: {
            days: [dayData, { ...dayData, date: "2026-05-19", waterCups: 4 }],
            meta: { total: 2 },
          },
        }),
      );
      return;
    }

    if (
      userPath === "/tracking/reports/health" ||
      path === "/daily-tracking/reports/health"
    ) {
      await route.fulfill(json({ data: buildReport() }));
      return;
    }

    if (
      /^\/tracking\/\d{4}-\d{2}-\d{2}$/.test(userPath) ||
      /^\/daily-tracking\/\d{4}-\d{2}-\d{2}$/.test(path)
    ) {
      await route.fulfill(json({ data: dayData }));
      return;
    }

    await route.fulfill(json({ data: [] }));
  });
});

const pages = [
  ["/user/nutrition/home", "Bugungi kaloriya"],
  ["/user/nutrition/plans", "Rejalar"],
  ["/user/nutrition/meals", "Bugungi ovqatlar"],
  ["/user/nutrition/history", "Ovqat tarixi"],
  ["/user/nutrition/report", "Hisobot"],
];

const viewports = [
  { name: "desktop", width: 1440, height: 1100 },
  { name: "tablet", width: 1024, height: 1100 },
  { name: "mobile", width: 390, height: 1200 },
];

for (const viewport of viewports) {
  test.describe(`nutrition redesign ${viewport.name}`, () => {
    test.use({ viewport });

    for (const [path, title] of pages) {
      test(`${path} renders without horizontal overflow`, async ({ page }) => {
        await seedBrowserState(page);
        await page.goto(path);

        await expect
          .poll(async () => page.locator("body").innerText())
          .toContain(title);

        const hasHorizontalOverflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth + 1,
        );
        expect(hasHorizontalOverflow).toBe(false);
      });
    }
  });
}
