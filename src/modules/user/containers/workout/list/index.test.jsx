import React from "react";
import "@/lib/i18n";
import i18n from "@/lib/i18n";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import WorkoutDashboardPage from "./index.jsx";
import useWorkoutOverview from "@/hooks/app/use-workout-overview";
import useWorkoutPlan from "@/hooks/app/use-workout-plan";
import {
  useActiveWorkoutSession,
  useWorkoutSessionHistory,
} from "@/hooks/app/use-workout-sessions";
import {
  useRunningActiveSession,
  useRunningSessions,
  useRunningStatsSummary,
  useStartRunningSession,
} from "@/hooks/app/use-running-sessions";
import {
  useWorkoutCatalog,
  useWorkoutExerciseCategories,
  useWorkoutExercises,
} from "@/hooks/app/use-workout-plans";
import useWorkoutWeatherToday from "@/hooks/app/use-workout-weather";

import some from "lodash/some";

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
  useActiveWorkoutSession: vi.fn(),
  useWorkoutSessionHistory: vi.fn(),
}));

vi.mock("@/hooks/app/use-running-sessions", () => ({
  useRunningActiveSession: vi.fn(),
  useRunningSessions: vi.fn(),
  useRunningStatsSummary: vi.fn(),
  useStartRunningSession: vi.fn(),
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
  beforeEach(async () => {
    await i18n.changeLanguage("uz");
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
      templates: [
        {
          id: "template-muscle",
          name: "Muscle Gain Plan",
          description: "Build lean muscle from backend template.",
          coverImageUrl: "https://cdn.example.com/muscle.jpg",
          difficulty: "intermediate",
          days: 56,
          daysPerWeek: 4,
          isTemplate: true,
          status: "template",
        },
        {
          id: "template-running",
          name: "Running Starter Plan",
          description: "Backend running starter template.",
          coverImageUrl: "https://cdn.example.com/running.jpg",
          difficulty: "beginner",
          days: 28,
          daysPerWeek: 3,
          isTemplate: true,
          status: "template",
        },
      ],
      activePlan: null,
      startPlan: vi.fn(),
    });
    useWorkoutSessionHistory.mockReturnValue({
      sessions: [],
    });
    useActiveWorkoutSession.mockReturnValue({
      activeWorkoutSession: null,
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
    useStartRunningSession.mockReturnValue({
      startRunningSession: vi.fn().mockResolvedValue({
        workoutSessionId: "run-new",
      }),
      isPending: false,
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

  it("renders the overview widgets and removes full-detail widgets", () => {
    renderPage();

    expect(useWorkoutSessionHistory).toHaveBeenCalledWith({ limit: 1 });
    expect(screen.getByText("Bugungi mashg'ulot")).toBeInTheDocument();
    expect(screen.getByText("Tavsiya etilgan rejalar")).toBeInTheDocument();
    expect(screen.getByTestId("recommended-plans-scroll-row")).toHaveClass(
      "overflow-x-auto",
    );
    expect(screen.getByText("Muscle Gain Plan")).toBeInTheDocument();
    expect(screen.getByText("Running Starter Plan")).toBeInTheDocument();
    expect(screen.getByText("So'nggi faoliyat")).toBeInTheDocument();
    expect(screen.getByText("Bugungi ob-havo")).toBeInTheDocument();
    expect(screen.getByText("Haftalik statistika")).toBeInTheDocument();
    expect(screen.queryByText("Maqsadlar")).not.toBeInTheDocument();
    expect(screen.queryByText("Yutuqlar")).not.toBeInTheDocument();
    expect(screen.queryByText("Seriya")).not.toBeInTheDocument();
    expect(screen.queryByText("Tiklanish")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /barchasini ko'rish/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Challenge")).not.toBeInTheDocument();
    expect(screen.queryByText("Body Focus")).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Workout, plan yoki mashg'ulot qidirish..."),
    ).not.toBeInTheDocument();
  });

  it("opens plans from the recommended plans row when no plan is active", () => {
    const router = renderPage();

    fireEvent.click(screen.getByRole("button", { name: /Muscle Gain Plan/i }));

    expect(router.state.location.pathname).toBe("/user/workout/plans");
  });

  it("does not render static recommended plan fallbacks when backend templates are empty", () => {
    useWorkoutPlan.mockReturnValue({
      plans: [],
      templates: [],
      activePlan: null,
      startPlan: vi.fn(),
    });

    renderPage();

    expect(screen.getByTestId("recommended-plans-empty")).toBeInTheDocument();
    expect(screen.queryByText("Muscle Gain Plan")).not.toBeInTheDocument();
    expect(screen.queryByText("Running Starter Plan")).not.toBeInTheDocument();
  });

  it("uses the required Russian no-plan hero labels", async () => {
    await i18n.changeLanguage("ru");

    renderPage();

    expect(
      screen.getByRole("heading", { name: "Тренировка сегодня" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Выбрать план").length).toBeGreaterThan(0);
    expect(screen.getByText("Создать свой план")).toBeInTheDocument();
    expect(screen.getByText("НЕТ АКТИВНОГО ПЛАНА")).toBeInTheDocument();
  });

  it("keeps today's workout hero media readable in light and dark themes", () => {
    renderPage();

    expect(screen.getByTestId("today-workout-hero")).toHaveClass(
      "min-h-[260px]",
    );
    expect(screen.getByTestId("today-workout-hero-media-scrim")).toHaveClass(
      "workout-media-contrast-scrim",
    );
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

  it("shows active workout session before the active plan and resumes that workout", () => {
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
        dayProgress: [],
      },
      startPlan: vi.fn(),
    });
    useActiveWorkoutSession.mockReturnValue({
      activeWorkoutSession: {
        id: "draft-1",
        planId: "plan-1",
        planDayIndex: 1,
        planDayKey: "Push Day",
        sessionStartTime: "2026-05-20T06:00:00.000Z",
        elapsedSeconds: 620,
        exercises: [{ name: "Bench Press" }],
      },
    });
    useRunningActiveSession.mockReturnValue({
      activeSession: {
        workoutSessionId: "run-active",
        status: "active",
        startedAt: "2026-05-20T05:00:00.000Z",
        metrics: {
          distanceMeters: 1200,
          durationSeconds: 300,
        },
      },
    });

    const router = renderPage();

    expect(screen.getAllByText("Push Day").length).toBeGreaterThan(0);
    expect(screen.queryByText("Day 2")).not.toBeInTheDocument();
    expect(screen.queryByTestId("recommended-plans-scroll-row")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /davom ettirish/i }));

    expect(router.state.location.pathname).toBe(
      "/user/workout/plans/plan-1/days/1/session",
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

  it("opens the latest running detail page from the activity row", () => {
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
    expect(router.state.location.pathname).toBe("/user/workout/history/run-1");
  });

  it("opens the latest workout detail page when it is the newest activity", () => {
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
      sessions: [],
    });

    const router = renderPage();

    fireEvent.click(screen.getByRole("button", { name: /upper body/i }));
    expect(router.state.location.pathname).toBe(
      "/user/workout/history/strength-1",
    );
  });

  it("does not show a standalone running shortcut on the simplified overview", () => {
    const startRunningSession = vi.fn().mockResolvedValue({
      workoutSessionId: "run-new",
    });

    useStartRunningSession.mockReturnValue({
      startRunningSession,
      isPending: false,
    });
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

    renderPage();

    expect(screen.queryByRole("button", { name: /yugurishni boshlash/i })).not.toBeInTheDocument();
    expect(startRunningSession).not.toHaveBeenCalled();
  });

  it("shows active run details in the hero when a run is in progress", () => {
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

    expect(screen.getAllByText("Faol yugurish").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2.3 km").length).toBeGreaterThan(0);
    expect(screen.getAllByText("15:40").length).toBeGreaterThan(0);
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

    const heroCta = screen.getAllByRole("button", {
      name: /bugungi workoutni boshlash/i,
    })[0];

    expect(heroCta).toBeTruthy();
    fireEvent.click(heroCta);

    expect(router.state.location.pathname).toBe(
      "/user/workout/plans/plan-1/days/1/session",
    );
  });

  it("uses backend nextWorkout for dashboard hero and CTA target", async () => {
    useWorkoutPlan.mockReturnValue({
      plans: [],
      activePlan: {
        id: "plan-contract",
        status: "active",
        name: "Contract Plan",
        progress: 40,
        completedWorkouts: 2,
        targetWorkouts: 5,
        nextWorkout: {
          planId: "plan-contract",
          dayIndex: 2,
          title: "Pull Day",
          exerciseCount: 4,
          duration: "35 min",
          estimatedCalories: 220,
          completed: false,
          isStartable: true,
        },
        todayWorkout: {
          dayIndex: 2,
          title: "Pull Day",
          exercisesCount: 4,
          duration: "35 min",
          calories: 220,
        },
        schedule: [
          { title: "Push Day", exercises: [{ name: "Bench" }] },
          { title: "Leg Day", exercises: [{ name: "Squat" }] },
          { title: "Pull Day", exercises: [{ name: "Pull-up" }] },
        ],
        dayProgress: [
          { dayIndex: 0, completed: false, exerciseCount: 1 },
          { dayIndex: 1, completed: false, exerciseCount: 1 },
          { dayIndex: 2, completed: false, exerciseCount: 1 },
        ],
      },
      templates: [],
      startPlan: vi.fn(),
    });

    const router = renderPage();

    expect(screen.getAllByText("Pull Day").length).toBeGreaterThan(0);

    fireEvent.click(
      screen.getAllByRole("button", { name: /bugungi workoutni boshlash/i })[0],
    );

    expect(router.state.location.pathname).toBe(
      "/user/workout/plans/plan-contract/days/2/session",
    );
  });

  it("prefers the overview active plan snapshot over plans fallback data", () => {
    useWorkoutOverview.mockReturnValue({
      overview: {
        weeklyStats: {
          count: 1,
          calories: 80,
          duration: 20,
        },
        activePlan: {
          id: "overview-plan",
          status: "active",
          name: "Overview Contract Plan",
          progress: 48,
          completedWorkouts: 12,
          targetWorkouts: 25,
          nextWorkout: {
            planId: "overview-plan",
            dayIndex: 2,
            title: "Canonical Pull Day",
            exerciseCount: 5,
            duration: "35 min",
            estimatedCalories: 260,
            completed: false,
            isStartable: true,
          },
          todayWorkout: {
            dayIndex: 2,
            title: "Canonical Pull Day",
            exercisesCount: 5,
            calories: 260,
          },
          schedule: [
            { title: "Push Day", exercises: [{ name: "Bench" }] },
            { title: "Leg Day", exercises: [{ name: "Squat" }] },
            { title: "Canonical Pull Day", exercises: [{ name: "Row" }] },
          ],
          dayProgress: [
            { dayIndex: 0, completed: true, exerciseCount: 1 },
            { dayIndex: 1, completed: true, exerciseCount: 1 },
            { dayIndex: 2, completed: false, exerciseCount: 1 },
          ],
        },
        recentWorkoutDays: [],
      },
    });
    useWorkoutPlan.mockReturnValue({
      plans: [],
      activePlan: null,
      templates: [],
      startPlan: vi.fn(),
    });

    const router = renderPage();

    expect(screen.getAllByText("Canonical Pull Day").length).toBeGreaterThan(0);
    expect(screen.getByText("12/25 mashg'ulot")).toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole("button", { name: /bugungi workoutni boshlash/i })[0],
    );

    expect(router.state.location.pathname).toBe(
      "/user/workout/plans/overview-plan/days/2/session",
    );
  });

  it("renders a sticky today workout CTA for mobile priority access", () => {
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

    expect(screen.getByTestId("today-workout-sticky-cta")).toHaveTextContent(
      "Day 2",
    );

    fireEvent.click(
      within(screen.getByTestId("today-workout-sticky-cta")).getByRole(
        "button",
        { name: /bugungi workoutni boshlash/i },
      ),
    );

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
    expect(screen.getAllByText("Day 2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bugun").length).toBeGreaterThan(0);

    fireEvent.click(
      screen.getAllByRole("button", { name: /bugungi workoutni boshlash/i })[0],
    );

    expect(router.state.location.pathname).toBe(
      "/user/workout/plans/plan-1/days/1/session",
    );
  });
});
