import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkoutPlanSessionPage from "./index.jsx";
import {
  useWorkoutExerciseCategories,
  useWorkoutExercises,
  useWorkoutPlanDetail,
} from "@/hooks/app/use-workout-plans";
import {
  useFinishWorkoutSession,
  useStartWorkoutSession,
  useUpdateWorkoutSessionProgress,
  useWorkoutSessionDraft,
} from "@/hooks/app/use-workout-sessions";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("@/components/page-loader/index.jsx", () => ({
  default: () => <div data-testid="page-loader">Loading</div>,
}));

vi.mock("@/hooks/app/use-workout-plans", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useWorkoutExerciseCategories: vi.fn(),
    useWorkoutExercises: vi.fn(),
    useWorkoutPlanDetail: vi.fn(),
  };
});

vi.mock("@/hooks/app/use-workout-sessions", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useWorkoutSessionDraft: vi.fn(),
    useStartWorkoutSession: vi.fn(),
    useUpdateWorkoutSessionProgress: vi.fn(),
    useFinishWorkoutSession: vi.fn(),
  };
});

const finishSessionMock = vi.fn();
const startSessionMock = vi.fn();
const updateProgressMock = vi.fn();

const plan = {
  id: "plan-1",
  name: "Leg Power",
  status: "active",
  schedule: [
    {
      day: "Day 1",
      focus: "Legs",
      exercises: [
        {
          id: 7,
          name: "Sumo Squat",
          equipment: "Barbell",
          trackingType: "REPS_WEIGHT",
          sets: [
            { reps: 15, weight: 28 },
            { reps: 15, weight: 28 },
          ],
        },
      ],
    },
  ],
};

const replacementExerciseList = [
  {
    id: 10,
    name: "Step-up",
    category: "Legs",
    trackingType: "REPS_WEIGHT",
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSeconds: 45,
  },
];

const renderPage = (initialEntry = "/user/workout/plans/plan-1/days/0/session") => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/workout/plans/:planId/days/:dayIndex/session",
        element: <WorkoutPlanSessionPage />,
      },
      {
        path: "/user/workout/plans/:planId/days/:dayIndex/session/summary",
        element: <div data-testid="session-summary-route">Summary route</div>,
      },
      {
        path: "/user/workout/plans/:planId/days/:dayIndex",
        element: <div data-testid="day-detail-route">Day detail</div>,
      },
    ],
    { initialEntries: [initialEntry] },
  );

  render(<RouterProvider router={router} />);

  return router;
};

describe("WorkoutPlanSessionPage", () => {
  beforeEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
    finishSessionMock.mockReset();
    startSessionMock.mockReset();
    updateProgressMock.mockReset();
    startSessionMock.mockResolvedValue({ id: "server-session-1" });
    updateProgressMock.mockResolvedValue({ id: "server-session-1" });
    finishSessionMock.mockResolvedValue({ id: "completed-session-1" });
    useWorkoutPlanDetail.mockReturnValue({
      plan,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useWorkoutExerciseCategories.mockReturnValue({
      categories: [{ id: 1, name: "Legs" }],
    });
    useWorkoutExercises.mockReturnValue({
      exercises: replacementExerciseList,
    });
    useFinishWorkoutSession.mockReturnValue({
      finishSession: finishSessionMock,
      isPending: false,
    });
    useWorkoutSessionDraft.mockReturnValue({
      draft: null,
    });
    useStartWorkoutSession.mockReturnValue({
      startSession: startSessionMock,
      isPending: false,
    });
    useUpdateWorkoutSessionProgress.mockReturnValue({
      updateProgress: updateProgressMock,
      isPending: false,
    });
  });

  it("renders the session page for the selected day", () => {
    renderPage();

    expect(screen.getByText("Day 1-Legs")).toBeInTheDocument();
    expect(screen.getByText("Sumo Squat · Barbell")).toBeInTheDocument();
    expect(screen.getByText("0/2 Done")).toBeInTheDocument();
    expect(screen.getByText("LOG NEXT SET")).toBeInTheDocument();
  });

  it("starts or resumes a backend workout session on page load", async () => {
    renderPage();

    await waitFor(() => {
      expect(startSessionMock).toHaveBeenCalledWith("plan-1", 0);
    });
  });

  it("does not loop start requests when the backend start call fails", async () => {
    startSessionMock.mockRejectedValue(new Error("boom"));

    renderPage();

    await waitFor(() => {
      expect(startSessionMock).toHaveBeenCalledTimes(1);
    });

    await new Promise((resolve) => setTimeout(resolve, 1_200));
    expect(startSessionMock).toHaveBeenCalledTimes(1);
  }, 8_000);

  it("stops remote draft PUT sync when start falls back without a server session id", async () => {
    startSessionMock.mockResolvedValue({
      id: null,
      planId: "plan-1",
      planDayIndex: 0,
      exercises: plan.schedule[0].exercises,
    });

    renderPage();

    await waitFor(() => {
      expect(startSessionMock).toHaveBeenCalledTimes(1);
    });

    await new Promise((resolve) => setTimeout(resolve, 1_200));
    expect(updateProgressMock).not.toHaveBeenCalled();
  }, 8_000);

  it("logs the next set from the sticky action", async () => {
    renderPage();

    fireEvent.click(screen.getByText("LOG NEXT SET"));

    await waitFor(() => {
      expect(screen.getByText("1/2 Done")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(updateProgressMock).toHaveBeenCalledWith(
        "server-session-1",
        expect.objectContaining({
          elapsedSeconds: expect.any(Number),
          exercises: expect.any(Array),
        }),
      );
    });
  });

  it("starts the rest timer when a set is completed", async () => {
    renderPage();

    fireEvent.click(screen.getByText("LOG NEXT SET"));

    await waitFor(() => {
      expect(screen.getByText("Dam olish vaqti")).toBeInTheDocument();
    });

    expect(screen.getByText("+15s")).toBeInTheDocument();
  });

  it("can skip the selected exercise from the action drawer", async () => {
    renderPage();

    fireEvent.click(screen.getByLabelText("Sumo Squat actions"));
    fireEvent.click(screen.getByText("Mashqni skip qilish"));

    await waitFor(() => {
      expect(screen.getByText("Skipped")).toBeInTheDocument();
    });
  });

  it("can replace the selected exercise from the replace drawer", async () => {
    renderPage();

    fireEvent.click(screen.getByLabelText("Sumo Squat actions"));
    fireEvent.click(screen.getByText("Mashqni almashtirish"));
    fireEvent.click(screen.getByText("Step-up"));

    await waitFor(() => {
      expect(screen.getByText("Step-up · Legs")).toBeInTheDocument();
    });
  });

  it("opens the duration edit drawer from the timer pencil", () => {
    renderPage();

    fireEvent.click(screen.getByLabelText("Duration edit"));

    expect(screen.getByText("Duration")).toBeInTheDocument();
    expect(screen.getByText("Start time")).toBeInTheDocument();
    expect(screen.getByText("Manual")).toBeInTheDocument();
  });

  it("sends plan day metadata when the workout is finished", async () => {
    const router = renderPage();

    fireEvent.click(screen.getByText("LOG NEXT SET"));
    fireEvent.click(screen.getByText("LOG NEXT SET"));
    fireEvent.click(screen.getByText("MASHG'ULOTNI YAKUNLASH"));

    await waitFor(() => {
      expect(finishSessionMock).toHaveBeenCalledWith(
        "plan-1",
        0,
        expect.objectContaining({
          planName: "Leg Power",
          focus: "Legs",
          exerciseCount: 1,
          completedExerciseCount: 1,
          logs: [
            expect.objectContaining({
              planId: "plan-1",
              planDayIndex: 0,
              planDayKey: "Day 1",
            }),
          ],
        }),
      );
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        "/user/workout/plans/plan-1/days/0/session/summary",
      );
    });
  });

  it("restores saved session progress from local storage on refresh", () => {
    window.localStorage.setItem(
      "liveon:workout-session:plan-1:0",
      JSON.stringify({
        planId: "plan-1",
        dayIndex: 0,
        sessionStartTime: Date.now() - 45_000,
        elapsed: 45,
        expandedExerciseId: "7-0",
        restSecondsRemaining: 28,
        restEndsAt: new Date(Date.now() + 28_000).toISOString(),
        exercises: [
          {
            id: 7,
            _id: "7-0",
            name: "Sumo Squat",
            equipment: "Barbell",
            trackingType: "REPS_WEIGHT",
            sets: [
              { reps: "15", weight: "28", done: true },
              { reps: "15", weight: "28", done: false },
            ],
          },
        ],
      }),
    );

    renderPage();

    expect(screen.getByText("1/2 Done")).toBeInTheDocument();
    expect(screen.getAllByDisplayValue("28").length).toBeGreaterThan(0);
    expect(screen.getByText("Dam olish vaqti")).toBeInTheDocument();
  });
});
