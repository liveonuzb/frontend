import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import WorkoutDashboardPage from "./index.jsx";
import useWorkoutOverview from "@/hooks/app/use-workout-overview";
import useWorkoutPlan from "@/hooks/app/use-workout-plan";
import { useWorkoutSessionHistory } from "@/hooks/app/use-workout-sessions";
import {
  useRunningActiveSession,
  useRunningSessions,
  useRunningStatsSummary,
} from "@/hooks/app/use-running-sessions";
import {
  useWorkoutCatalog,
  useWorkoutExerciseCategories,
  useWorkoutExercises,
} from "@/hooks/app/use-workout-plans";
import useWorkoutWeatherToday from "@/hooks/app/use-workout-weather";

import { find, some } from "lodash";

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("@/modules/user/containers/dashboard/calorie-gauge-widget.jsx", () => ({
  default: () => <div data-testid="calorie-widget">Calories</div>,
}));

vi.mock("../running/components/run-map-panel.jsx", () => ({
  default: ({ points, polyline, variant, emptyLabel }) => (
    <div
      data-testid="workout-home-real-running-map"
      data-point-count={points?.length ?? 0}
      data-polyline={polyline ?? ""}
      data-variant={variant ?? ""}
      data-empty-label={emptyLabel ?? ""}
    />
  ),
}));

vi.mock("@/hooks/app/use-workout-overview", () => ({
  default: vi.fn(),
}));

vi.mock("@/hooks/app/use-workout-plan", () => ({
  default: vi.fn(),
}));

vi.mock("@/hooks/app/use-workout-sessions", () => ({
  useWorkoutSessionHistory: vi.fn(),
}));

vi.mock("@/hooks/app/use-running-sessions", () => ({
  useRunningActiveSession: vi.fn(),
  useRunningSessions: vi.fn(),
  useRunningStatsSummary: vi.fn(),
}));

vi.mock("@/hooks/app/use-workout-plans", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useWorkoutCatalog: vi.fn(),
    useWorkoutExerciseCategories: vi.fn(),
    useWorkoutExercises: vi.fn(),
  };
});

vi.mock("@/hooks/app/use-workout-weather", () => ({
  default: vi.fn(),
}));

vi.mock("@/store", () => ({
  useBreadcrumbStore: () => ({
    setBreadcrumbs: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

const renderPage = () => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/workout",
        element: <WorkoutDashboardPage />,
      },
      {
        path: "/user/workout/plans",
        element: <div>Plans</div>,
      },
      {
        path: "/user/workout/plans/create",
        element: <div>Create</div>,
      },
      {
        path: "/user/workout/history",
        element: <div>History</div>,
      },
      {
        path: "/user/workout/history/:sessionId",
        element: <div>Workout history detail</div>,
      },
      {
        path: "/user/workout/running",
        element: <div>Running dashboard</div>,
      },
      {
        path: "/user/workout/running/:workoutSessionId",
        element: <div>Running detail</div>,
      },
      {
        path: "/user/workout/running/live/:workoutSessionId",
        element: <div>Running live</div>,
      },
      {
        path: "/user/challenges",
        element: <div>Challenges</div>,
      },
      {
        path: "/user/workout/plans/:planId/days/:dayIndex/session",
        element: <div>Session page</div>,
      },
      {
        path: "/user/workout/plans/:planId/days/:dayIndex",
        element: <div>Day detail</div>,
      },
    ],
    {
      initialEntries: ["/user/workout"],
    },
  );

  render(<RouterProvider router={router} />);
  return router;
};

describe("WorkoutDashboardPage", () => {
  beforeEach(() => {
    useWorkoutOverview.mockReturnValue({
      overview: {
        weeklyStats: {
          count: 0,
          calories: 0,
          duration: 0,
        },
        recentWorkoutDays: [],
      },
    });
    useWorkoutPlan.mockReturnValue({
      plans: [],
      activePlan: null,
      startPlan: vi.fn(),
    });
    useWorkoutSessionHistory.mockReturnValue({
      sessions: [],
    });
    useWorkoutCatalog.mockReturnValue({
      catalog: {
        bodyParts: [],
        exercises: [],
      },
    });
    useWorkoutExerciseCategories.mockReturnValue({
      categories: [],
    });
    useWorkoutExercises.mockReturnValue({
      exercises: [],
    });
    useRunningActiveSession.mockReturnValue({
      activeSession: null,
    });
    useRunningSessions.mockReturnValue({
      sessions: [],
    });
    useRunningStatsSummary.mockReturnValue({
      stats: {
        totalRuns: 0,
        totalDistanceMeters: 0,
        totalDurationSeconds: 0,
        totalCaloriesBurned: 0,
      },
    });
    useWorkoutWeatherToday.mockReturnValue({
      weather: {
        location: "Tashkent",
        temperatureC: 28,
        feelsLikeC: 30,
        condition: "Clear",
        humidity: 32,
        windKph: 9,
        aqi: 42,
        aqiLabel: "Good",
        pm25: 8,
        source: "open-meteo",
        updatedAt: "2026-05-15T07:15:00.000Z",
      },
      isLoading: false,
      isError: false,
      locationStatus: "fallback",
    });
  });

  it("renders the activity dashboard and removes catalog-heavy sections", () => {
    renderPage();

    expect(useWorkoutSessionHistory).toHaveBeenCalledWith({ limit: 6 });
    expect(screen.getByText("Bugungi mashg'ulot")).toBeInTheDocument();
    expect(screen.getByText("So'nggi faoliyat")).toBeInTheDocument();
    expect(screen.getByText("Bugungi ob-havo")).toBeInTheDocument();
    expect(screen.getByText("Haftalik statistika")).toBeInTheDocument();
    expect(screen.getByText("Maqsadlar")).toBeInTheDocument();
    expect(screen.getByText("Yutuqlar")).toBeInTheDocument();
    expect(screen.queryByText("Challenge")).not.toBeInTheDocument();
    expect(screen.queryByText("Body Focus")).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Workout, plan yoki mashg'ulot qidirish..."),
    ).not.toBeInTheDocument();
  });

  it("shows active running state and resumes the live session", () => {
    useRunningActiveSession.mockReturnValue({
      activeSession: {
        workoutSessionId: "run-active",
        status: "active",
        startedAt: "2026-05-15T06:00:00.000Z",
        metrics: {
          distanceMeters: 2300,
          durationSeconds: 940,
          caloriesBurned: 180,
          averagePaceSecondsPerKm: 408,
        },
      },
    });

    const router = renderPage();

    fireEvent.click(screen.getByRole("button", { name: /davom ettirish/i }));

    expect(router.state.location.pathname).toBe(
      "/user/workout/running/live/run-active",
    );
  });

  it("shows the latest running session in the activity feed", () => {
    useRunningSessions.mockReturnValue({
      sessions: [
        {
          workoutSessionId: "run-1",
          status: "completed",
          startedAt: "2026-05-15T02:15:00.000Z",
          endedAt: "2026-05-15T02:52:45.000Z",
          metrics: {
            distanceMeters: 6230,
            durationSeconds: 2265,
            caloriesBurned: 462,
            averagePaceSecondsPerKm: 363,
          },
        },
      ],
    });

    renderPage();

    expect(screen.getByText("Morning Run")).toBeInTheDocument();
    expect(screen.getAllByText("6.2 km").length).toBeGreaterThan(0);
    expect(screen.getAllByText("06:03 /km").length).toBeGreaterThan(0);
  });

  it("renders recent running feed routes with real map data instead of a static image", () => {
    useRunningSessions.mockReturnValue({
      sessions: [
        {
          workoutSessionId: "run-1",
          status: "completed",
          startedAt: "2026-05-15T02:15:00.000Z",
          endedAt: "2026-05-15T02:52:45.000Z",
          route: {
            polyline: "encoded-feed-route",
          },
          points: [
            {
              sequence: 1,
              latitude: 41.311081,
              longitude: 69.240562,
            },
            {
              sequence: 2,
              latitude: 41.320069,
              longitude: 69.240562,
            },
          ],
          metrics: {
            distanceMeters: 6230,
            durationSeconds: 2265,
            caloriesBurned: 462,
            averagePaceSecondsPerKm: 363,
            gpsQualityScore: 0.92,
          },
        },
      ],
    });

    renderPage();

    const mapPanels = screen.getAllByTestId("workout-home-real-running-map");
    expect(
      some(mapPanels, (panel) =>
        panel.getAttribute("data-polyline") === "encoded-feed-route" &&
        panel.getAttribute("data-point-count") === "2"),
    ).toBe(true);
    expect(screen.queryByAltText("Morning Run")).not.toBeInTheDocument();
  });

  it("opens running and workout detail pages from recent activity rows", async () => {
    useWorkoutSessionHistory.mockReturnValue({
      sessions: [
        {
          id: "strength-1",
          title: "Upper Body",
          startedAt: "2026-05-15T01:00:00.000Z",
          endedAt: "2026-05-15T01:45:00.000Z",
          durationSeconds: 2700,
          burnedCalories: 320,
        },
      ],
    });
    useRunningSessions.mockReturnValue({
      sessions: [
        {
          workoutSessionId: "run-1",
          status: "completed",
          startedAt: "2026-05-15T02:15:00.000Z",
          endedAt: "2026-05-15T02:52:45.000Z",
          metrics: {
            distanceMeters: 6230,
            durationSeconds: 2265,
            caloriesBurned: 462,
            averagePaceSecondsPerKm: 363,
          },
        },
      ],
    });

    const router = renderPage();

    fireEvent.click(screen.getByRole("button", { name: /morning run/i }));
    expect(router.state.location.pathname).toBe("/user/workout/running/run-1");

    await act(async () => {
      await router.navigate("/user/workout");
    });
    fireEvent.click(screen.getByRole("button", { name: /upper body/i }));
    expect(router.state.location.pathname).toBe(
      "/user/workout/history/strength-1",
    );
  });

  it("shows a start-running widget in recent activity when no run is active", () => {
    useRunningSessions.mockReturnValue({
      sessions: [
        {
          workoutSessionId: "run-1",
          status: "completed",
          startedAt: "2026-05-15T02:15:00.000Z",
          endedAt: "2026-05-15T02:52:45.000Z",
          route: {
            polyline: "encoded-route",
          },
          points: [
            {
              sequence: 1,
              latitude: 41.311081,
              longitude: 69.240562,
            },
            {
              sequence: 2,
              latitude: 41.320069,
              longitude: 69.240562,
            },
          ],
          metrics: {
            distanceMeters: 6230,
            durationSeconds: 2265,
            caloriesBurned: 462,
            averagePaceSecondsPerKm: 363,
            gpsQualityScore: 0.92,
          },
        },
      ],
    });

    const router = renderPage();
    const startMap = find(screen
      .getAllByTestId("workout-home-real-running-map"), (panel) =>
      panel.getAttribute("data-empty-label") ===
      "Yugurishni boshlanganda xarita shu yerda ko'rinadi");

    expect(screen.queryByTestId("workout-home-fake-route-svg")).not.toBeInTheDocument();
    expect(startMap).toHaveAttribute(
      "data-point-count",
      "0",
    );
    expect(startMap).toHaveAttribute(
      "data-polyline",
      "",
    );
    expect(startMap).toHaveAttribute(
      "data-empty-label",
      "Yugurishni boshlanganda xarita shu yerda ko'rinadi",
    );
    expect(startMap).toHaveAttribute(
      "data-variant",
      "preview",
    );

    fireEvent.click(screen.getByRole("button", { name: /yugurishni boshlash/i }));

    expect(router.state.location.pathname).toBe("/user/workout/running");
  });

  it("renders the running activity card with active route data when a run is in progress", () => {
    useRunningActiveSession.mockReturnValue({
      activeSession: {
        workoutSessionId: "run-active",
        status: "active",
        startedAt: "2026-05-15T06:00:00.000Z",
        route: {
          polyline: "encoded-route",
        },
        points: [
          {
            sequence: 1,
            latitude: 41.311081,
            longitude: 69.240562,
          },
          {
            sequence: 2,
            latitude: 41.320069,
            longitude: 69.240562,
          },
        ],
        metrics: {
          distanceMeters: 2300,
          durationSeconds: 940,
          caloriesBurned: 180,
          averagePaceSecondsPerKm: 408,
          gpsQualityScore: 0.92,
        },
      },
    });

    renderPage();

    expect(screen.getByTestId("workout-home-real-running-map")).toHaveAttribute(
      "data-point-count",
      "2",
    );
    expect(screen.getByTestId("workout-home-real-running-map")).toHaveAttribute(
      "data-polyline",
      "encoded-route",
    );
  });

  it("renders weather and AQI fallback data for today's workout decision", () => {
    renderPage();

    expect(screen.getByText("28°C")).toBeInTheDocument();
    expect(screen.getByText("AQI 42")).toBeInTheDocument();
    expect(screen.getByText("Tashkent")).toBeInTheDocument();
  });

  it("keeps the weather card visible while weather is loading", () => {
    useWorkoutWeatherToday.mockReturnValue({
      weather: null,
      isLoading: true,
      isError: false,
      locationStatus: "requesting",
    });

    renderPage();

    expect(screen.getByText("Bugungi ob-havo")).toBeInTheDocument();
    expect(screen.getByText("Ob-havo yuklanmoqda")).toBeInTheDocument();
  });

  it("keeps Tashkent fallback weather visible when location permission is denied", () => {
    useWorkoutWeatherToday.mockReturnValue({
      weather: {
        location: "Tashkent",
        temperatureC: 28,
        feelsLikeC: 30,
        condition: "Clear",
        humidity: 32,
        windKph: 9,
        aqi: 42,
        aqiLabel: "Good",
        pm25: 8,
        source: "open-meteo",
        updatedAt: "2026-05-15T07:15:00.000Z",
      },
      isLoading: false,
      isError: false,
      locationStatus: "fallback",
    });

    renderPage();

    expect(screen.getByText("Bugungi ob-havo")).toBeInTheDocument();
    expect(screen.getByText("Tashkent")).toBeInTheDocument();
  });

  it("keeps the weather card visible when weather is unavailable", () => {
    useWorkoutWeatherToday.mockReturnValue({
      weather: null,
      isLoading: false,
      isError: true,
      locationStatus: "denied",
    });

    renderPage();

    expect(screen.getByText("Bugungi ob-havo")).toBeInTheDocument();
    expect(screen.getByText("Ob-havo vaqtincha mavjud emas")).toBeInTheDocument();
  });

  it("renders real zero state for weekly goal without fake premium badge", () => {
    renderPage();

    expect(screen.getByText("0/4 mashg'ulot")).toBeInTheDocument();
    expect(screen.queryByText("PRO")).not.toBeInTheDocument();
  });

  it("renders backend-driven weekly goal when data exists", () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    useWorkoutOverview.mockReturnValue({
      overview: {
        weeklyStats: {
          count: 2,
          calories: 320,
          duration: 45,
        },
        recentWorkoutDays: [
          { date: now.toISOString().slice(0, 10) },
          { date: yesterday.toISOString().slice(0, 10) },
        ],
      },
    });
    useWorkoutSessionHistory.mockReturnValue({
      sessions: [
        { endedAt: now.toISOString() },
        { endedAt: yesterday.toISOString() },
      ],
    });

    renderPage();

    expect(screen.getByText("2/4 mashg'ulot")).toBeInTheDocument();
    expect(screen.getAllByText("50%").length).toBeGreaterThan(0);
  });

  it("clamps goal progress percentages between zero and one hundred", () => {
    useWorkoutOverview.mockReturnValue({
      overview: {
        weeklyStats: {
          count: 0,
          calories: -500,
          duration: 0,
        },
        recentWorkoutDays: [],
      },
    });
    useRunningStatsSummary.mockReturnValue({
      stats: {
        totalRuns: 8,
        totalDistanceMeters: 100000,
        totalDurationSeconds: 7200,
        totalCaloriesBurned: 1200,
      },
    });

    renderPage();

    const goalsCard = screen.getByText("Maqsadlar").closest('[data-slot="card"]');

    expect(within(goalsCard).queryByText(/-/)).not.toBeInTheDocument();
    expect(within(goalsCard).getByText("0%")).toBeInTheDocument();
    expect(within(goalsCard).getByText("100%")).toBeInTheDocument();
  });

  it("includes active running metrics in today's summary", () => {
    useWorkoutOverview.mockReturnValue({
      overview: {
        weeklyStats: {
          count: 0,
          calories: 120,
          duration: 0,
        },
        recentWorkoutDays: [],
      },
    });
    useRunningActiveSession.mockReturnValue({
      activeSession: {
        workoutSessionId: "run-active",
        status: "active",
        metrics: {
          distanceMeters: 1200,
          durationSeconds: 300,
        },
      },
    });
    useRunningStatsSummary.mockReturnValue({
      stats: {
        totalRuns: 0,
        totalDistanceMeters: 0,
        totalDurationSeconds: 0,
        totalCaloriesBurned: 0,
      },
    });

    renderPage();

    const todayCard = screen
      .getByText("Bugun", { selector: '[data-slot="card-title"]' })
      .closest('[data-slot="card"]');

    expect(within(todayCard).getByText("25%")).toBeInTheDocument();
    expect(within(todayCard).getByText("1.2 km")).toBeInTheDocument();
    expect(within(todayCard).getByText("05:00")).toBeInTheDocument();
  });

  it("keeps today's summary readable with partial running stats", () => {
    useRunningStatsSummary.mockReturnValue({
      stats: {
        totalDistanceMeters: null,
      },
    });

    renderPage();

    const todayCard = screen
      .getByText("Bugun", { selector: '[data-slot="card-title"]' })
      .closest('[data-slot="card"]');

    expect(within(todayCard).queryByText(/NaN|undefined/i)).not.toBeInTheDocument();
    expect(within(todayCard).getByText("0 m")).toBeInTheDocument();
    expect(within(todayCard).getByText("0:00")).toBeInTheDocument();
  });

  it("marks completed week days when the overview returns date strings", () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    useWorkoutOverview.mockReturnValue({
      overview: {
        weeklyStats: {
          count: 2,
          calories: 320,
          duration: 45,
        },
        recentWorkoutDays: [
          now.toISOString().slice(0, 10),
          yesterday.toISOString().slice(0, 10),
        ],
      },
    });

    renderPage();

    const weeklyStatsCard = screen
      .getByText("Haftalik statistika")
      .closest('[data-slot="card"]');

    expect(within(weeklyStatsCard).getAllByText("–")).toHaveLength(5);
  });

  it("shows empty next workout state when there is no active plan", () => {
    renderPage();

    expect(
      screen.getByText(/Hozircha sizda faol workout rejasi yo'q/),
    ).toBeInTheDocument();
  });

  it("opens the next planned workout from the hero CTA", async () => {
    const planStart = new Date();
    planStart.setDate(planStart.getDate() - 1);

    useWorkoutPlan.mockReturnValue({
      plans: [],
      activePlan: {
        id: "plan-1",
        status: "active",
        startDate: planStart.toISOString(),
        daysPerWeek: 3,
        schedule: [
          { title: "Day 1", exercises: [{ name: "Squat" }] },
          { title: "Day 2", exercises: [{ name: "Bench" }] },
        ],
        dayProgress: [
          { dayIndex: 0, completed: true, exerciseCount: 1 },
          { dayIndex: 1, completed: false, exerciseCount: 1 },
        ],
      },
      startPlan: vi.fn(),
    });

    const router = renderPage();

    const heroCta = screen.getByRole("button", {
      name: /start today's workout/i,
    });

    expect(heroCta).toBeTruthy();
    fireEvent.click(heroCta);

    expect(router.state.location.pathname).toBe(
      "/user/workout/plans/plan-1/days/1/session",
    );
  });

  it("keeps catalog challenge content off the activity dashboard", () => {
    renderPage();

    expect(screen.queryByText("Challenge")).not.toBeInTheDocument();
    expect(screen.queryByText("Body Focus")).not.toBeInTheDocument();
    expect(toast.info).not.toHaveBeenCalled();
  });

  it("shows an empty achievements state instead of a +0 badge", () => {
    renderPage();

    const achievementsCard = screen
      .getByText("Yutuqlar")
      .closest('[data-slot="card"]');

    expect(within(achievementsCard).getByText("Hali yutuqlar yo'q")).toBeInTheDocument();
    expect(within(achievementsCard).queryByText("+0")).not.toBeInTheDocument();
  });

  it("shows the remaining achievement count when there are many achievements", () => {
    useWorkoutOverview.mockReturnValue({
      overview: {
        weeklyStats: {
          count: 0,
          calories: 0,
          duration: 0,
        },
        personalRecordCount: 12,
        recentWorkoutDays: [],
      },
    });

    renderPage();

    const achievementsCard = screen
      .getByText("Yutuqlar")
      .closest('[data-slot="card"]');

    expect(within(achievementsCard).getByText("+12")).toBeInTheDocument();
  });

  it("renders next workout recommendations without fake fixed time and opens selected day", () => {
    const planStart = new Date();
    planStart.setDate(planStart.getDate() - 1);

    useWorkoutPlan.mockReturnValue({
      plans: [],
      activePlan: {
        id: "plan-1",
        status: "active",
        startDate: planStart.toISOString(),
        daysPerWeek: 3,
        schedule: [
          { title: "Day 1", exercises: [{ name: "Squat" }] },
          { title: "Day 2", exercises: [{ name: "Bench" }] },
          { title: "Day 3", exercises: [{ name: "Pull" }] },
        ],
        dayProgress: [
          { dayIndex: 0, completed: true, exerciseCount: 1 },
          { dayIndex: 1, completed: false, exerciseCount: 1 },
          { dayIndex: 2, completed: false, exerciseCount: 1 },
        ],
      },
      startPlan: vi.fn(),
    });

    const router = renderPage();

    expect(screen.queryByText(/17:00/)).not.toBeInTheDocument();
    expect(screen.getByText("Day 2")).toBeInTheDocument();
    expect(screen.getAllByText("Bugun").length).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole("button", { name: /start today's workout/i }),
    );

    expect(router.state.location.pathname).toBe(
      "/user/workout/plans/plan-1/days/1/session",
    );
  });
});
