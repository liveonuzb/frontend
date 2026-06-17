import { expect, test } from "@playwright/test";
import { NUTRITION_VISUAL_ROUTES } from "../src/modules/user/containers/nutrition/nutrition-visual-routes.js";

const today = "2026-05-20";
const visualNow = "2026-05-20T09:00:00+05:00";

const authUser = {
  id: "visual-user",
  phone: "+998901234567",
  firstName: "Visual",
  lastName: "User",
  roles: ["USER"],
  premium: { status: "active" },
  subscription: { status: "ACTIVE" },
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

const dashboardData = {
  date: today,
  timezone: "Asia/Tashkent",
  goals,
  calories: {
    current: 2015,
    target: goals.calories,
    remaining: 835,
    percent: 71,
  },
  macros: {
    protein: { current: 126, target: goals.protein, percent: 86 },
    carbs: { current: 188, target: goals.carbs, percent: 139 },
    fat: { current: 66, target: goals.fat, percent: 157 },
  },
  water: {
    currentMl: 1250,
    targetMl: goals.waterMl,
    percent: 44,
  },
  meals: {
    completed: 4,
    total: 4,
    byType: {
      breakfast: { count: 1, calories: 520 },
      lunch: { count: 1, calories: 780 },
      dinner: { count: 1, calories: 430 },
      snack: { count: 1, calories: 285 },
    },
  },
  activePlan: planState.activePlan,
  feedback: {
    items: [
      {
        id: "protein",
        metric: "protein",
        severity: "info",
        actual: 126,
        target: goals.protein,
      },
    ],
  },
  streak: {
    currentDays: 6,
    bestDays: 18,
  },
  quickActions: [
    { id: "add-meal", label: "Ovqat qo'shish", target: "meal", enabled: true },
    { id: "add-water", label: "Suv qo'shish", target: "water", enabled: true },
  ],
  blockers: {
    items: [],
  },
};

const recipeList = [
  {
    id: "tovuqli-quinoa-salatasi",
    catalogFoodId: 101,
    title: "Tovuqli quinoa salatasi",
    description: "Protein va tolaga boy tushlik varianti.",
    category: "Tushlik",
    difficulty: "Oson",
    totalTimeMinutes: 30,
    servings: 1,
    servingSize: 320,
    servingUnit: "g",
    caloriesPerServing: 420,
    proteinPerServing: 32,
    carbsPerServing: 38,
    fatPerServing: 15,
    fiberPerServing: 6,
    tags: ["Yuqori protein", "Oson"],
    ingredients: [
      { id: "chicken", name: "Tovuq filesi", grams: 120, isRequired: true },
      { id: "quinoa", name: "Quinoa", grams: 60, isRequired: true },
    ],
    instructions: [
      { id: "step-1", stepNumber: 1, body: "Tovuqni pishiring." },
    ],
  },
  {
    id: "sabzavotli-nonushta",
    catalogFoodId: 102,
    title: "Sabzavotli nonushta",
    description: "Yengil, tez tayyorlanadigan nonushta.",
    category: "Nonushta",
    difficulty: "Oson",
    totalTimeMinutes: 15,
    servings: 1,
    servingSize: 260,
    servingUnit: "g",
    caloriesPerServing: 360,
    proteinPerServing: 24,
    carbsPerServing: 34,
    fatPerServing: 13,
    fiberPerServing: 5,
    tags: ["Tez", "Balans"],
    ingredients: [
      { id: "egg", name: "Tuxum", grams: 100, isRequired: true },
      { id: "greens", name: "Ko'katlar", grams: 40, isRequired: false },
    ],
    instructions: [
      { id: "step-1", stepNumber: 1, body: "Ingredientlarni aralashtiring." },
    ],
  },
];

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

const seedBrowserState = async (page, language = "uz") => {
  await page.goto("/app-config.js", { waitUntil: "domcontentloaded" });
  await page.evaluate(({ user, language }) => {
    window.localStorage.setItem("storage_version", "v2");
    window.localStorage.setItem(
      "language-storage",
      JSON.stringify({
        state: { currentLanguage: language, hasSelectedLanguage: true },
        version: 0,
      }),
    );
    window.localStorage.setItem("i18nextLng", language);
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
  }, { user: authUser, language });
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((user) => {
    window.localStorage.setItem("storage_version", "v2");
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

    if (
      userPath === "/nutrition/overview" ||
      path === "/user/nutrition/overview"
    ) {
      await route.fulfill(json({ data: dashboardData }));
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

    if (
      userPath === "/nutrition/history" ||
      path === "/user/nutrition/history" ||
      userPath === "/tracking/history" ||
      path === "/daily-tracking/history"
    ) {
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
      userPath === "/nutrition/reports/range" ||
      path === "/user/nutrition/reports/range" ||
      userPath === "/tracking/reports/health" ||
      path === "/daily-tracking/reports/health"
    ) {
      await route.fulfill(json({ data: buildReport() }));
      return;
    }

    if (
      userPath === "/nutrition/recipes/filters" ||
      path === "/user/nutrition/recipes/filters"
    ) {
      await route.fulfill(
        json({
          data: {
            categories: [
              { id: 1, label: "Nonushta" },
              { id: 2, label: "Tushlik" },
            ],
            cuisines: [{ id: 1, label: "O'zbek" }],
            dietaryTags: ["Yuqori protein", "Balans"],
            allergenTags: ["Glutensiz"],
          },
        }),
      );
      return;
    }

    if (
      userPath === "/nutrition/recipes/mine" ||
      path === "/user/nutrition/recipes/mine"
    ) {
      await route.fulfill(
        json({
          data: {
            recipes: [],
            pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
          },
        }),
      );
      return;
    }

    if (
      userPath === "/nutrition/recipes" ||
      path === "/user/nutrition/recipes"
    ) {
      await route.fulfill(
        json({
          data: {
            recipes: recipeList,
            pagination: { page: 1, pageSize: 12, total: 2, totalPages: 1 },
            activeFilters: [],
          },
        }),
      );
      return;
    }

    if (
      userPath === "/nutrition/ai/pantry" ||
      path === "/user/nutrition/ai/pantry"
    ) {
      await route.fulfill(
        json({
          data: {
            items: [
              { id: "pantry-chicken", name: "Tovuq filesi", quantity: 1, unit: "kg" },
              { id: "pantry-quinoa", name: "Quinoa", quantity: 500, unit: "g" },
            ],
          },
        }),
      );
      return;
    }

    if (
      /^\/nutrition\/days\/\d{4}-\d{2}-\d{2}$/.test(userPath) ||
      /^\/user\/nutrition\/days\/\d{4}-\d{2}-\d{2}$/.test(path) ||
      /^\/tracking\/\d{4}-\d{2}-\d{2}$/.test(userPath) ||
      /^\/daily-tracking\/\d{4}-\d{2}-\d{2}$/.test(path)
    ) {
      await route.fulfill(json({ data: dayData }));
      return;
    }

    await route.fulfill(json({ data: [] }));
  });
});

const viewports = [
  { name: "desktop", width: 1440, height: 1100 },
  { name: "tablet", width: 1024, height: 1100 },
  { name: "mobile", width: 390, height: 1200 },
];

const localizationExpectations = {
  uz: {
    navLabel: "Ovqatlanish bo'limlari",
    navItems: ["Umumiy", "Rejalar", "Retseptlar", "Tarix", "Hisobot"],
    routes: {
      overview: { role: "heading", name: "Umumiy ko'rinish" },
      plans: { role: "heading", name: "Mashhur shablonlar" },
      recipes: { role: "heading", name: "Bugungi retseptlar" },
      history: { role: "button", name: "Filtr" },
      report: { role: "heading", name: "Hisobot" },
    },
  },
  en: {
    navLabel: "Nutrition sections",
    navItems: ["Overview", "Plans", "Recipes", "History", "Report"],
    routes: {
      overview: { role: "heading", name: "Overview" },
      plans: { role: "heading", name: "Popular templates" },
      recipes: { role: "heading", name: "Today's recipes" },
      history: { role: "button", name: "Filter" },
      report: { role: "heading", name: "Report" },
    },
  },
  ru: {
    navLabel: "Разделы питания",
    navItems: ["Обзор", "Планы", "Рецепты", "История", "Отчёт"],
    routes: {
      overview: { role: "heading", name: "Обзор" },
      plans: { role: "heading", name: "Популярные шаблоны" },
      recipes: { role: "heading", name: "Рецепты на сегодня" },
      history: { role: "button", name: "Фильтр" },
      report: { role: "heading", name: "Отчёт" },
    },
  },
};

const collectNutritionA11yIssues = async (page) =>
  page.evaluate(() => {
    const issues = [];
    const isVisible = (element) => {
      if (!element || element.closest("[hidden], [aria-hidden='true']")) {
        return false;
      }

      const style = window.getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") {
        return false;
      }

      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const describeElement = (element) => {
      const id = element.id ? `#${element.id}` : "";
      const classes = element.className && typeof element.className === "string"
        ? `.${element.className.trim().split(/\s+/).slice(0, 2).join(".")}`
        : "";

      return `${element.tagName.toLowerCase()}${id}${classes}`;
    };
    const getExplicitLabelText = (element) => {
      const labelledBy = element.getAttribute("aria-labelledby");
      const labelledByText = labelledBy
        ? labelledBy
            .split(/\s+/)
            .map((id) => document.getElementById(id)?.textContent || "")
            .join(" ")
        : "";

      return [
        element.getAttribute("aria-label"),
        element.getAttribute("title"),
        labelledByText,
      ]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    };
    const getAccessibleText = (element) => {
      return [
        getExplicitLabelText(element),
        element.getAttribute("alt"),
        element.textContent,
      ]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    };

    const visibleMainCount = Array.from(document.querySelectorAll("main"))
      .filter(isVisible).length;
    if (visibleMainCount !== 1) {
      issues.push(`Expected one visible main landmark, found ${visibleMainCount}.`);
    }

    const nutritionNavs = Array.from(document.querySelectorAll("nav"))
      .filter((nav) => isVisible(nav) && nav.querySelector("[data-workout-tab='surface']"));

    if (!nutritionNavs.length) {
      issues.push("Nutrition tab navigation is missing.");
    }

    nutritionNavs.forEach((nav) => {
      const navName = getExplicitLabelText(nav);
      if (!navName) {
        issues.push(`${describeElement(nav)} needs an accessible navigation label.`);
      }

      const currentLinks = Array.from(nav.querySelectorAll("a[aria-current='page']"))
        .filter(isVisible);
      if (currentLinks.length !== 1) {
        issues.push(
          `${describeElement(nav)} should expose exactly one current page tab, found ${currentLinks.length}.`,
        );
      } else {
        const currentPath = new URL(currentLinks[0].href).pathname;
        if (!window.location.pathname.startsWith(currentPath)) {
          issues.push(
            `${describeElement(currentLinks[0])} aria-current points to ${currentPath}, not ${window.location.pathname}.`,
          );
        }
      }
    });

    const interactiveSelector = [
      "button",
      "a[href]",
      "input:not([type='hidden'])",
      "select",
      "textarea",
      "[role='button']",
      "[role='link']",
      "[role='checkbox']",
      "[role='switch']",
      "[role='tab']",
      "[role='combobox']",
      "[role='textbox']",
    ].join(",");

    Array.from(document.querySelectorAll(interactiveSelector))
      .filter(isVisible)
      .forEach((element) => {
        if (!getAccessibleText(element)) {
          issues.push(`${describeElement(element)} is interactive but has no accessible name.`);
        }
      });

    Array.from(document.querySelectorAll("img"))
      .filter(isVisible)
      .forEach((image) => {
        if (!image.hasAttribute("alt")) {
          issues.push(`${describeElement(image)} is missing alt text.`);
        }
      });

    Array.from(document.querySelectorAll("[tabindex]"))
      .filter(isVisible)
      .forEach((element) => {
        const tabIndex = Number(element.getAttribute("tabindex"));
        if (tabIndex > 0) {
          issues.push(`${describeElement(element)} has positive tabindex ${tabIndex}.`);
        }
      });

    return issues;
  });

test.describe("nutrition localization", () => {
  test.use({ viewport: viewports[0] });

  for (const [language, expected] of Object.entries(localizationExpectations)) {
    for (const route of NUTRITION_VISUAL_ROUTES) {
      test(`${language} localizes ${route.path} route chrome`, async ({ page }) => {
        await page.clock.setFixedTime(new Date(visualNow));
        await seedBrowserState(page, language);
        await page.goto(route.path);

        const routeSignal = expected.routes[route.key];
        await expect(
          page.getByRole(routeSignal.role, {
            name: routeSignal.name,
            exact: true,
          }),
        ).toBeVisible();

        const nutritionNav = page.getByRole("navigation", {
          name: expected.navLabel,
        });
        await expect(nutritionNav).toBeVisible();

        for (const navItem of expected.navItems) {
          await expect(nutritionNav.getByRole("link", { name: navItem })).toBeVisible();
        }

        await expect(page.locator("body")).not.toContainText(/user\.nutrition\./);
      });
    }
  }
});

for (const viewport of viewports) {
  test.describe(`nutrition redesign ${viewport.name}`, () => {
    test.use({ viewport });

    for (const route of NUTRITION_VISUAL_ROUTES) {
      test(`${route.path} renders without overflow and matches visual baseline`, async ({
        page,
      }) => {
        await page.clock.setFixedTime(new Date(visualNow));
        await seedBrowserState(page);
        await page.goto(route.path);

        await expect
          .poll(async () => page.locator("body").innerText())
          .toContain(route.expectedText);

        const hasHorizontalOverflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth + 1,
        );
        expect(hasHorizontalOverflow).toBe(false);
        await expect(page).toHaveScreenshot(
          [viewport.name, route.screenshotName],
          {
            animations: "disabled",
            caret: "hide",
            fullPage: true,
            maxDiffPixelRatio: 0.01,
          },
        );
      });

      test(`${route.path} passes nutrition accessibility audit`, async ({
        page,
      }) => {
        await page.clock.setFixedTime(new Date(visualNow));
        await seedBrowserState(page);
        await page.goto(route.path);

        await expect
          .poll(async () => page.locator("body").innerText())
          .toContain(route.expectedText);

        expect(await collectNutritionA11yIssues(page)).toEqual([]);
      });
    }
  });
}
