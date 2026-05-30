import { expect, test } from "@playwright/test";

const authUser = {
  id: "nutrition-plan-activation-user",
  phone: "+998901112233",
  firstName: "Nutrition",
  lastName: "User",
  roles: ["USER"],
  activeRole: "USER",
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
  calories: 2150,
  protein: 120,
  carbs: 210,
  fat: 70,
  fiber: 28,
  waterMl: 2500,
  cupSize: 250,
  steps: 10000,
  sleepHours: 8,
  workoutMinutes: 45,
};

const template = {
  id: "meal-template-30-day-balanced",
  name: "Sog'lom turmush",
  description: "Balansli makrolar, suv, vitaminlar va yengil haftalik menyu.",
  goal: "wellness",
  days: 30,
  mealCount: 4,
  mealsCount: 120,
  daysWithMeals: 30,
  appliedTargetCalories: 2150,
  isCompatible: true,
  source: "admin",
  sourceTemplateId: "meal-template-30-day-balanced",
  weeklyKanban: {
    "day-1": [
      {
        id: "breakfast",
        type: "Nonushta",
        time: "08:00",
        items: [{ id: "food-1", name: "Suli bo'tqasi", cal: 430 }],
      },
    ],
  },
};

const initialPlanState = {
  activePlan: null,
  draftPlan: null,
  plans: [],
};

const activatedPlan = {
  id: "user-active-plan-from-template",
  name: "Sog'lom turmush",
  description: template.description,
  status: "active",
  source: "template",
  sourceTemplateId: template.id,
  durationDays: 30,
  mealCount: 4,
  goal: "wellness",
  appliedTargetCalories: 2150,
  startDate: "2026-05-30T00:00:00.000Z",
  updatedAt: "2026-05-30T06:00:00.000Z",
  weeklyKanban: template.weeklyKanban,
};

const emptyDay = {
  date: "2026-05-30",
  waterCups: 0,
  waterLog: [],
  meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
  steps: 0,
  workoutMinutes: 0,
  burnedCalories: 0,
  sleepHours: 0,
  mood: null,
};

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

const seedAuthenticatedBrowser = async (page) => {
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
          token: "nutrition-plan-activation-token",
          refreshToken: "nutrition-plan-activation-refresh",
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

const setupNutritionPlanApi = async (page) => {
  let planState = initialPlanState;
  const activationRequests = [];

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const userPath = path.replace(/^\/user/, "");
    const method = request.method();

    if (userPath === "/me" || path === "/users/me") {
      await route.fulfill(json({ data: authUser }));
      return;
    }

    if (path === "/users/me/premium" || userPath === "/me/premium") {
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

    if (userPath === "/health-goals" || path === "/health-goals") {
      await route.fulfill(json({ data: goals }));
      return;
    }

    if (userPath === "/meal-plans/me" || path === "/meal-plans/me") {
      await route.fulfill(json({ data: planState }));
      return;
    }

    if (userPath === "/meal-plans/templates" || path === "/meal-plans/templates") {
      await route.fulfill(
        json({
          data: [template],
          meta: {
            total: 1,
            page: 1,
            pageSize: 20,
            totalPages: 1,
            goals: [{ value: "maintenance", label: "Balans" }],
          },
        }),
      );
      return;
    }

    if (
      userPath === `/meal-plans/me/${template.id}/activate` &&
      method === "POST"
    ) {
      activationRequests.push(request.postDataJSON());
      planState = {
        activePlan: activatedPlan,
        draftPlan: null,
        plans: [activatedPlan],
      };
      await route.fulfill(json({ data: planState }, 201));
      return;
    }

    if (
      /^\/tracking\/\d{4}-\d{2}-\d{2}$/.test(userPath) ||
      /^\/daily-tracking\/\d{4}-\d{2}-\d{2}$/.test(path)
    ) {
      await route.fulfill(json({ data: emptyDay }));
      return;
    }

    await route.fulfill(json({ data: [] }));
  });

  return {
    activationRequests,
    getPlanState: () => planState,
  };
};

test("activates an admin meal plan template from nutrition plans", async ({
  page,
}) => {
  await seedAuthenticatedBrowser(page);
  const apiState = await setupNutritionPlanApi(page);

  await page.goto("/user/nutrition/plans");

  await expect(page.getByRole("heading", { name: "Rejalar" })).toBeVisible();
  await expect(page.getByText("Sog'lom turmush")).toBeVisible();

  await page.getByRole("button", { name: "Tanlash" }).click();

  await expect(page.getByText("Shablon reja faollashtirildi")).toBeVisible();
  await expect(page.getByText("Faol reja")).toBeVisible();
  await expect(page.getByText("Mening rejalarim")).toBeVisible();
  await expect(
    page
      .getByRole("table")
      .getByRole("button", { name: "Ko'rish", exact: true }),
  ).toBeVisible();

  expect(apiState.activationRequests).toHaveLength(1);
  expect(apiState.activationRequests[0]).toEqual(
    expect.objectContaining({
      source: "template",
      sourceTemplateId: template.id,
      appliedTargetCalories: 2150,
    }),
  );
  expect(apiState.getPlanState().activePlan).toEqual(
    expect.objectContaining({
      id: activatedPlan.id,
      durationDays: 30,
      sourceTemplateId: template.id,
      status: "active",
    }),
  );
});
