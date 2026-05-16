import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SessionHistoryDetailPage from "./index.jsx";
import {
  useWorkoutSessionHistory,
  useWorkoutSessionHistoryItem,
} from "@/hooks/app/use-workout-sessions";

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("@/components/page-loader/index.jsx", () => ({
  default: () => <div data-testid="page-loader">Loading</div>,
}));

vi.mock("@/store", () => ({
  useBreadcrumbStore: () => ({
    setBreadcrumbs: vi.fn(),
  }),
}));

vi.mock("@/hooks/app/use-workout-sessions", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useWorkoutSessionHistory: vi.fn(),
    useWorkoutSessionHistoryItem: vi.fn(),
  };
});

const renderPage = (initialEntry = "/user/workout/history/session-1") => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/workout/history/:sessionId",
        element: <SessionHistoryDetailPage />,
      },
      {
        path: "/user/workout/report/:sessionId",
        element: <SessionHistoryDetailPage />,
      },
      {
        path: "/user/workout/history",
        element: <div data-testid="history-route">History route</div>,
      },
      {
        path: "/user/workout/plans/:planId/days/:dayIndex",
        element: <div data-testid="plan-day-route">Plan day route</div>,
      },
      {
        path: "/user/workout/running/:sessionId",
        element: <div data-testid="running-detail-route">Running detail route</div>,
      },
    ],
    { initialEntries: [initialEntry] },
  );

  render(<RouterProvider router={router} />);
  return router;
};

describe("SessionHistoryDetailPage", () => {
  beforeEach(() => {
    useWorkoutSessionHistoryItem.mockReturnValue({
      session: {
        id: "session-1",
        planId: "plan-1",
        planDayIndex: 0,
        planName: "Leg Power",
        focus: "Legs",
        endedAt: new Date().toISOString(),
        durationSeconds: 1500,
        estimatedCalories: 180,
        totalVolumeKg: 840,
        totalSets: 6,
        completedSets: 6,
        exerciseSummaries: [
          {
            exerciseKey: "squat-1",
            exerciseName: "Squat",
            completedSets: 3,
            totalReps: 30,
            totalVolumeKg: 840,
            distanceMeters: 0,
          },
        ],
        exercises: [
          {
            id: "session-exercise-1",
            exerciseKey: "squat-1",
            exerciseName: "Squat",
            equipment: "Barbell",
            completedSets: 3,
            totalSets: 3,
            totalReps: 30,
            totalVolumeKg: 840,
            distanceMeters: 0,
            skipped: false,
            sets: [
              {
                id: "session-set-1",
                setIndex: 0,
                reps: 10,
                weight: 28,
                durationSeconds: 0,
                distanceMeters: 0,
              },
            ],
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    useWorkoutSessionHistory.mockReturnValue({
      sessions: [
        { id: "session-1" },
        { id: "session-0" },
      ],
    });
  });

  it("renders the completed session details", () => {
    renderPage();

    expect(screen.getByText("Legs")).toBeInTheDocument();
    expect(screen.getByText("Bajarilgan mashqlar")).toBeInTheDocument();
    expect(screen.getByText("Squat")).toBeInTheDocument();
    expect(screen.getAllByText("840 kg").length).toBeGreaterThan(0);
    expect(screen.getByText("Barbell")).toBeInTheDocument();
    expect(screen.getByText("10 reps")).toBeInTheDocument();
  });

  it("navigates back to history", () => {
    const router = renderPage();

    fireEvent.click(screen.getByText("Tarix"));

    expect(router.state.location.pathname).toBe("/user/workout/history");
  });

  it("opens the related plan day", () => {
    const router = renderPage();

    fireEvent.click(screen.getByText("Plan kuni"));

    expect(router.state.location.pathname).toBe("/user/workout/plans/plan-1/days/0");
  });

  it("renders outdoor run metrics and links to the running detail page", () => {
    useWorkoutSessionHistoryItem.mockReturnValue({
      session: {
        id: "run-session-1",
        activityType: "OUTDOOR_RUN",
        focus: "Outdoor run",
        endedAt: new Date().toISOString(),
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
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useWorkoutSessionHistory.mockReturnValue({
      sessions: [{ id: "run-session-1" }],
    });

    const router = renderPage("/user/workout/history/run-session-1");

    expect(screen.getByText("Outdoor run")).toBeInTheDocument();
    expect(screen.getByText("5.0 km")).toBeInTheDocument();
    expect(screen.getByText("6:00 /km")).toBeInTheDocument();
    expect(screen.queryByText("Bajarilgan mashqlar")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Running detail"));

    expect(router.state.location.pathname).toBe("/user/workout/running/run-session-1");
    expect(screen.getByTestId("running-detail-route")).toBeInTheDocument();
  });

  it("loads the report detail alias by session id", () => {
    renderPage("/user/workout/report/session-1");

    expect(screen.getByText("Legs")).toBeInTheDocument();
    expect(screen.getByText("Bajarilgan mashqlar")).toBeInTheDocument();
  });

  it("shows a not-found state when a session cannot be loaded", () => {
    useWorkoutSessionHistoryItem.mockReturnValue({
      session: null,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    renderPage("/user/workout/history/missing-session");

    expect(screen.getByText("Workout session topilmadi")).toBeInTheDocument();
    expect(screen.getByText("Tarixga qaytish")).toBeInTheDocument();
  });
});
