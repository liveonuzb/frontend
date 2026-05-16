import { expect, test } from "@playwright/test";

/* global process */

const apiBase = process.env.E2E_API_BASE_URL ?? "http://localhost:3000/api/v1";

const authState = {
  isAuthenticated: true,
  token: "weather-e2e-token",
  refreshToken: "weather-e2e-refresh",
  user: {
    id: "weather-e2e-user",
    phone: "+998000000001",
    profile: { firstName: "Weather", lastName: "Tester" },
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

      Object.defineProperty(window.navigator, "geolocation", {
        configurable: true,
        value:
          geolocationMode === "unavailable"
            ? {}
            : {
                getCurrentPosition: (success, error) => {
                  if (geolocationMode === "denied") {
                    window.setTimeout(() => {
                      error?.({ code: 1, message: "Permission denied" });
                    }, 0);
                    return;
                  }

                  window.setTimeout(() => {
                    success?.({
                      coords: {
                        latitude: 41.311081,
                        longitude: 69.240562,
                      },
                    });
                  }, 0);
                },
              },
      });
    },
    { state: authState, geolocationMode: geolocation },
  );
};

const fulfillJson = async (route, payload, status = 200) => {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(payload),
  });
};

const installWorkoutHomeApi = async (
  page,
  { weatherPayload, weatherFailure = false } = {},
) => {
  await page.route(`${apiBase}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/v1", "");

    if (path === "/user/me") {
      await fulfillJson(route, { data: authState.user });
      return;
    }

    if (path === "/user/me/premium") {
      await fulfillJson(route, { data: { premium: authState.user.premium, plans: [] } });
      return;
    }

    if (path === "/user/me/notifications") {
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

    if (path === "/user/workout/weather/today") {
      if (weatherFailure) {
        await route.abort("failed");
        return;
      }

      await fulfillJson(route, { data: weatherPayload });
      return;
    }

    if (path === "/user/workout/plans") {
      await fulfillJson(route, {
        data: {
          activePlanId: null,
          draftPlanId: null,
          items: [],
          templates: [],
        },
      });
      return;
    }

    if (path === "/user/workout/overview") {
      await fulfillJson(route, {
        data: {
          weeklyStats: {
            count: 0,
            calories: 0,
            duration: 0,
            target: 4,
          },
          personalRecordCount: 0,
          personalRecords: [],
          recentWorkoutDays: [],
        },
      });
      return;
    }

    if (path.startsWith("/user/workout/sessions/history")) {
      await fulfillJson(route, { data: [], meta: { hasMore: false } });
      return;
    }

    if (path === "/user/workout/running/active") {
      await fulfillJson(route, { data: null });
      return;
    }

    if (path === "/user/workout/running/stats/summary") {
      await fulfillJson(route, {
        data: {
          totalRuns: 0,
          totalDistanceMeters: 0,
          totalDurationSeconds: 0,
          totalCaloriesBurned: 0,
        },
      });
      return;
    }

    if (path === "/user/workout/running") {
      await fulfillJson(route, { data: [] });
      return;
    }

    if (path.startsWith("/user/tracking/")) {
      await fulfillJson(route, {
        data: {
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

    await fulfillJson(route, { data: null });
  });
};

const openWorkoutHome = async (page) => {
  await page.goto("/user/workout/home");
  await expect(page.getByText("Bugungi ob-havo")).toBeVisible();
};

test.describe("workout home weather widget fallbacks", () => {
  test("renders IQAir success weather", async ({ page }) => {
    await installBrowserState(page);
    await installWorkoutHomeApi(page, {
      weatherPayload: {
        location: "Tashkent",
        temperatureC: 28,
        feelsLikeC: 30,
        condition: "Sunny",
        humidity: 30,
        windKph: 9,
        aqi: 72,
        aqiLabel: "Moderate",
        pm25: 21,
        source: "iqair",
        updatedAt: "2026-05-16T03:00:00.000Z",
      },
    });

    await openWorkoutHome(page);

    await expect(page.getByText("28°C")).toBeVisible();
    await expect(page.getByText("AQI 72")).toBeVisible();
    await expect(page.getByText("Moderate")).toBeVisible();
  });

  test("renders Open-Meteo fallback for missing or failed IQAir", async ({ page }) => {
    await installBrowserState(page);
    await installWorkoutHomeApi(page, {
      weatherPayload: {
        location: "Current location",
        temperatureC: 22,
        feelsLikeC: 21,
        condition: "Clear sky",
        humidity: 44,
        windKph: 12,
        aqi: 35,
        aqiLabel: "Good",
        pm25: 8,
        source: "open-meteo",
        updatedAt: "2026-05-16T03:00:00.000Z",
      },
    });

    await openWorkoutHome(page);

    await expect(page.getByText("22°C")).toBeVisible();
    await expect(page.getByText("Clear sky")).toBeVisible();
    await expect(page.getByText("AQI 35")).toBeVisible();
  });

  test("uses Tashkent display when geolocation is denied and fallback response is returned", async ({ page }) => {
    await installBrowserState(page, { geolocation: "denied" });
    await installWorkoutHomeApi(page, {
      weatherPayload: {
        location: "Current location",
        temperatureC: 18,
        feelsLikeC: 17,
        condition: "Fallback weather",
        humidity: 55,
        windKph: 6,
        aqi: null,
        aqiLabel: "Unknown",
        pm25: null,
        source: "fallback",
        updatedAt: "2026-05-16T03:00:00.000Z",
      },
    });

    await openWorkoutHome(page);

    await expect(page.getByText("18°C")).toBeVisible();
    await expect(page.getByText("Fallback weather")).toBeVisible();
    await expect(page.getByText("Tashkent")).toBeVisible();
  });

  test("shows stable error copy when weather API fully fails", async ({ page }) => {
    await installBrowserState(page);
    await installWorkoutHomeApi(page, { weatherFailure: true });

    await openWorkoutHome(page);

    await expect(page.getByText("Ob-havo vaqtincha mavjud emas")).toBeVisible();
    await expect(page.getByText("AQI --")).toBeVisible();
  });
});
