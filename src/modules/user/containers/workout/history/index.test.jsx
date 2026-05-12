import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SessionHistoryPage from "./index.jsx";
import { useWorkoutSessionHistory } from "@/hooks/app/use-workout-sessions";
import { useWorkoutPlans } from "@/hooks/app/use-workout-plans";

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("@/components/page-loader/index.jsx", () => ({
  default: () => <div data-testid="page-loader">Loading</div>,
}));

vi.mock("@/hooks/app/use-workout-sessions", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useWorkoutSessionHistory: vi.fn(),
  };
});

vi.mock("@/hooks/app/use-workout-plans", () => ({
  useWorkoutPlans: vi.fn(),
}));

const renderPage = () => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/workout/history",
        element: <SessionHistoryPage />,
      },
      {
        path: "/user/workout",
        element: <div>Workout home</div>,
      },
      {
        path: "/user/workout/history/:sessionId",
        element: <div data-testid="history-detail-route">History detail route</div>,
      },
      {
        path: "/user/workout/running/:sessionId",
        element: <div data-testid="running-detail-route">Running detail route</div>,
      },
    ],
    { initialEntries: ["/user/workout/history"] },
  );

  render(<RouterProvider router={router} />);
  return router;
};

describe("SessionHistoryPage", () => {
  beforeEach(() => {
    const now = new Date();
    const todayIso = new Date(now).toISOString();
    const previousDay = new Date(now);
    previousDay.setDate(previousDay.getDate() - 1);
    const oldDay = new Date(now);
    oldDay.setDate(oldDay.getDate() - 20);

    useWorkoutSessionHistory.mockReturnValue({
      sessions: [
        {
          id: "session-1",
          planName: "Leg Power",
          focus: "Legs",
          planDayIndex: 0,
          endedAt: todayIso,
          durationSeconds: 1500,
          estimatedCalories: 180,
          totalVolumeKg: 840,
          totalSets: 6,
          completedSets: 6,
          completedExerciseCount: 3,
          exerciseSummaries: [
            {
              exerciseKey: "squat-1",
              exerciseName: "Squat",
              completedSets: 3,
              totalReps: 30,
              totalVolumeKg: 840,
            },
          ],
        },
        {
          id: "session-2",
          planName: "Push Day",
          focus: "Chest",
          planDayIndex: 1,
          endedAt: oldDay.toISOString(),
          durationSeconds: 1200,
          estimatedCalories: 120,
          totalVolumeKg: 500,
          totalSets: 4,
          completedSets: 4,
          completedExerciseCount: 2,
          exerciseSummaries: [],
        },
        {
          id: "session-3",
          planName: "Core Day",
          focus: "Core",
          planDayIndex: 2,
          endedAt: previousDay.toISOString(),
          durationSeconds: 900,
          estimatedCalories: 90,
          totalVolumeKg: 120,
          totalSets: 3,
          completedSets: 3,
          completedExerciseCount: 1,
          exerciseSummaries: [],
        },
        {
          id: "run-session-1",
          activityType: "OUTDOOR_RUN",
          focus: "Outdoor run",
          endedAt: todayIso,
          durationSeconds: 1800,
          estimatedCalories: 320,
          distanceMeters: 5000,
          averagePaceSecondsPerKm: 360,
          exerciseSummaries: [
            {
              exerciseKey: "outdoor-run",
              exerciseName: "Outdoor run",
              distanceMeters: 5000,
              durationSeconds: 1800,
              averagePaceSecondsPerKm: 360,
            },
          ],
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useWorkoutPlans.mockReturnValue({
      items: [
        {
          id: "plan-1",
          status: "ACTIVE",
          startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
          createdAt: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
          schedule: [
            { exercises: [{ name: "Squat" }] },
            { exercises: [{ name: "Bench" }] },
            { exercises: [{ name: "Pull" }] },
          ],
          dayProgress: [
            { dayIndex: 0, completed: true },
            { dayIndex: 1, completed: false },
            { dayIndex: 2, completed: false },
          ],
        },
      ],
    });
  });

  it("renders session history cards", () => {
    renderPage();

    expect(screen.getByText("Workout tarixi")).toBeInTheDocument();
    expect(screen.getByText("Legs")).toBeInTheDocument();
    expect(screen.getByText("Leg Power")).toBeInTheDocument();
  });

  it("navigates to the session detail page", () => {
    const router = renderPage();

    fireEvent.click(screen.getByText("Legs"));

    expect(router.state.location.pathname).toBe("/user/workout/history/session-1");
    expect(screen.getByTestId("history-detail-route")).toBeInTheDocument();
  });

  it("routes outdoor runs to the running detail page with run metrics", () => {
    const router = renderPage();

    expect(screen.getByText("Outdoor run")).toBeInTheDocument();
    expect(screen.getByText("5.0 km")).toBeInTheDocument();
    expect(screen.getByText("6:00 /km")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Outdoor run"));

    expect(router.state.location.pathname).toBe("/user/workout/running/run-session-1");
    expect(screen.getByTestId("running-detail-route")).toBeInTheDocument();
  });

  it("filters sessions by selected period and shows streak", () => {
    renderPage();

    expect(screen.getByText("2 kun")).toBeInTheDocument();

    fireEvent.click(screen.getByText("7 kun"));

    expect(screen.queryByText("Chest")).not.toBeInTheDocument();
    expect(screen.getByText("Core")).toBeInTheDocument();
  });

  it("shows missed workouts and monthly summary", () => {
    renderPage();

    expect(screen.getByText("Missed")).toBeInTheDocument();
    expect(screen.getByText("33%")).toBeInTheDocument();
    expect(screen.getByText("Oylik ko‘rinish")).toBeInTheDocument();
  });

  it("shows an empty state when there are no completed sessions", () => {
    useWorkoutSessionHistory.mockReturnValue({
      sessions: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useWorkoutPlans.mockReturnValue({
      items: [],
    });

    renderPage();

    expect(screen.getByText("Hali yakunlangan mashg'ulot yo'q")).toBeInTheDocument();
  });
});
