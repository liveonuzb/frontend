import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";
import WorkoutPlanSessionSummaryPage from "./index.jsx";

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("@/hooks/app/use-workout-plans", () => ({
  useWorkoutPlanDetail: vi.fn(() => ({
    plan: {
      schedule: [
        { day: "Day 1", exercises: [{ id: 1 }] },
        { day: "Day 2", exercises: [{ id: 2 }] },
      ],
    },
  })),
}));

const summaryState = {
  summary: {
    planId: "plan-1",
    dayIndex: 0,
    planName: "Leg Power",
    focus: "Legs",
    durationMinutes: 18,
    estimatedCalories: 117,
    totalSets: 6,
    completedSets: 6,
    exerciseCount: 3,
    completedExerciseCount: 3,
    totalVolumeKg: 840,
    exerciseSummaries: [
      {
        exerciseKey: "sumo-0",
        exerciseName: "Sumo Squat",
        completedSets: 2,
        totalReps: 30,
        totalVolumeKg: 840,
        distanceMeters: 0,
      },
    ],
  },
};

const renderPage = (initialEntry) => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/workout/plans/:planId/days/:dayIndex/session/summary",
        element: <WorkoutPlanSessionSummaryPage />,
      },
      {
        path: "/user/workout/plans/:planId/days/:dayIndex",
        element: <div data-testid="day-route">Day route</div>,
      },
      {
        path: "/user/workout/plans/:planId",
        element: <div data-testid="plan-route">Plan route</div>,
      },
    ],
    { initialEntries: [initialEntry] },
  );

  render(<RouterProvider router={router} />);

  return router;
};

describe("WorkoutPlanSessionSummaryPage", () => {
  it("renders the session summary payload from route state", () => {
    renderPage({
      pathname: "/user/workout/plans/plan-1/days/0/session/summary",
      state: summaryState,
    });

    expect(screen.getByText("Mashg'ulot yakunlandi")).toBeInTheDocument();
    expect(screen.getByText("18 daqiqa")).toBeInTheDocument();
    expect(screen.getByText("117 kcal")).toBeInTheDocument();
    expect(screen.getByText("Sumo Squat")).toBeInTheDocument();
  });

  it("navigates back to day detail", () => {
    const router = renderPage({
      pathname: "/user/workout/plans/plan-1/days/0/session/summary",
      state: summaryState,
    });

    fireEvent.click(screen.getByText("Keyingi kunni ko'rish"));

    expect(router.state.location.pathname).toBe(
      "/user/workout/plans/plan-1/days/1",
    );
  });
});
