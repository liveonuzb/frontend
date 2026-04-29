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

const renderPage = () => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/workout/history/:sessionId",
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
    ],
    { initialEntries: ["/user/workout/history/session-1"] },
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
});
