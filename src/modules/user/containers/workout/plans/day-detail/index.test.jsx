import React from "react";
import "@/lib/i18n";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WorkoutPlanDayDetailPage from "./index.jsx";
import { useWorkoutLogs } from "@/hooks/app/use-workout-logs";
import {
  useActivateWorkoutPlan,
  useRegenerateWorkoutPlanDay,
  useWorkoutPlanDetail,
} from "@/hooks/app/use-workout-plans";
import {
  useSkipWorkoutSession,
  useUndoSkipWorkoutSession,
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

vi.mock("@/store", () => ({
  useBreadcrumbStore: () => ({
    setBreadcrumbs: vi.fn(),
  }),
}));

vi.mock("@/hooks/app/use-workout-plans", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useActivateWorkoutPlan: vi.fn(),
    useRegenerateWorkoutPlanDay: vi.fn(),
    useWorkoutPlanDetail: vi.fn(),
  };
});

vi.mock("@/hooks/app/use-workout-logs", () => ({
  useWorkoutLogs: vi.fn(),
}));

vi.mock("@/hooks/app/use-workout-sessions", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useSkipWorkoutSession: vi.fn(),
    useUndoSkipWorkoutSession: vi.fn(),
  };
});

const activatePlanMock = vi.fn();
const regenerateDayMock = vi.fn();
const skipSessionMock = vi.fn();
const undoSkipSessionMock = vi.fn();
const refetchMock = vi.fn();

const defaultPlan = {
  id: "plan-1",
  name: "AI Upper",
  description: "Generated plan",
  coverImageUrl: "https://cdn.example.com/cover.jpg",
  status: "draft",
  source: "ai",
  generationMeta: {
    benchmark: {
      exerciseName: "Bench Press",
      oneRepMaxKg: 46,
    },
  },
  schedule: [
    {
      day: "Dushanba",
      focus: "Chest",
      exercises: [
        {
          id: 5,
          exerciseId: 5,
          name: "Bench Press",
          imageUrl: "https://cdn.example.com/bench.jpg",
          equipment: "Barbell",
          targetMuscles: ["Chest"],
          equipments: ["Barbell"],
          instructions: ["Lie on bench", "Press the bar"],
          sets: [{ reps: 12, weight: 40 }],
        },
      ],
    },
  ],
};

const renderPage = (initialEntry = "/user/workout/plans/plan-1/days/0") => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/workout/plans/:planId/days/:dayIndex",
        element: <WorkoutPlanDayDetailPage />,
      },
      {
        path: "/user/workout/plans/:planId/days/:dayIndex/session",
        element: <div data-testid="session-route">Session route</div>,
      },
      {
        path: "/user/workout/plans/:planId",
        element: <div data-testid="plan-detail-route">Plan detail route</div>,
      },
      {
        path: "/user/workout/plans/edit/:planId",
        element: <div data-testid="edit-route">Edit route</div>,
      },
    ],
    { initialEntries: [initialEntry] },
  );

  render(<RouterProvider router={router} />);

  return router;
};

describe("WorkoutPlanDayDetailPage", () => {
  beforeEach(() => {
    activatePlanMock.mockReset();
    regenerateDayMock.mockReset();
    skipSessionMock.mockReset();
    undoSkipSessionMock.mockReset();
    refetchMock.mockReset();

    useWorkoutPlanDetail.mockReturnValue({
      plan: defaultPlan,
      isLoading: false,
      isError: false,
      refetch: refetchMock,
    });
    useWorkoutLogs.mockReturnValue({
      items: [
        {
          exerciseId: 5,
          name: "Bench Press",
          date: "2026-04-27",
          entries: [{ reps: 12, weight: 40, sets: 1 }],
        },
      ],
    });
    useActivateWorkoutPlan.mockReturnValue({
      activatePlan: activatePlanMock,
      isPending: false,
    });
    useRegenerateWorkoutPlanDay.mockReturnValue({
      regenerateDay: regenerateDayMock,
      isPending: false,
    });
    useSkipWorkoutSession.mockReturnValue({
      skipSession: skipSessionMock,
      isPending: false,
    });
    useUndoSkipWorkoutSession.mockReturnValue({
      undoSkipSession: undoSkipSessionMock,
      isPending: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the selected day with metadata and exercises", () => {
    renderPage();

    expect(screen.getByText("DAY 1")).toBeInTheDocument();
    expect(screen.getByText("Chest")).toBeInTheDocument();
    expect(screen.getByText("Barbell")).toBeInTheDocument();
    expect(screen.getByText("46 kg")).toBeInTheDocument();
    expect(screen.getByText("1 exercises")).toBeInTheDocument();
    expect(screen.getAllByText(/Bench Press/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
  });

  it("renders the page loader while the plan is loading", () => {
    useWorkoutPlanDetail.mockReturnValue({
      plan: null,
      isLoading: true,
      isError: false,
      refetch: refetchMock,
    });

    renderPage();

    expect(screen.getByTestId("page-loader")).toBeInTheDocument();
  });

  it("shows an error state with retry and back navigation actions", () => {
    useWorkoutPlanDetail.mockReturnValue({
      plan: null,
      isLoading: false,
      isError: true,
      refetch: refetchMock,
    });

    renderPage();

    expect(screen.getByText("Workout reja topilmadi")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "DAY 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Planga qaytish" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Qayta urinish" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rejalarga qaytish" })).toBeInTheDocument();
  });

  it("shows an invalid day state when the route index is outside the schedule", () => {
    renderPage("/user/workout/plans/plan-1/days/9");

    expect(screen.getByText("Workout kuni topilmadi")).toBeInTheDocument();
    expect(screen.getByText("Plan sahifasiga qaytish")).toBeInTheDocument();
  });

  it("opens exercise instructions drawer from an exercise row", () => {
    renderPage();

    fireEvent.click(screen.getAllByText(/Bench Press/)[1]);

    expect(screen.getByText("Instructions")).toBeInTheDocument();
    expect(screen.getByText("Records")).toBeInTheDocument();
    expect(screen.getByText("Focus area")).toBeInTheDocument();
    expect(screen.getByText("Lie on bench")).toBeInTheDocument();
  });

  it("activates the plan and navigates to the selected day session page", async () => {
    activatePlanMock.mockResolvedValue({
      ...defaultPlan,
      status: "active",
    });

    const router = renderPage();
    fireEvent.click(screen.getByText("START"));

    await waitFor(() => {
      expect(activatePlanMock).toHaveBeenCalledWith(
        "plan-1",
        expect.objectContaining({
          name: "AI Upper",
        }),
      );
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        "/user/workout/plans/plan-1/days/0/session",
      );
    });
    expect(screen.getByTestId("session-route")).toBeInTheDocument();
  });

  it("uses the created active plan id when starting a template day", async () => {
    useWorkoutPlanDetail.mockReturnValue({
      plan: {
        ...defaultPlan,
        id: "template-running",
        name: "Running Starter Plan",
        status: "template",
        source: "seed",
        isTemplate: true,
      },
      isLoading: false,
      isError: false,
      refetch: refetchMock,
    });
    activatePlanMock.mockResolvedValue({
      ...defaultPlan,
      id: "active-running-plan",
      name: "Running Starter Plan",
      status: "active",
      source: "template",
    });

    const router = renderPage("/user/workout/plans/template-running/days/0");
    fireEvent.click(screen.getByText("START"));

    await waitFor(() => {
      expect(activatePlanMock).toHaveBeenCalledWith(
        "template-running",
        expect.objectContaining({
          name: "Running Starter Plan",
        }),
      );
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        "/user/workout/plans/active-running-plan/days/0/session",
      );
    });
  });

  it("navigates to edit route from the day detail action", async () => {
    const router = renderPage();

    fireEvent.click(screen.getByText("Edit"));

    await waitFor(() => {
      expect(
        `${router.state.location.pathname}${router.state.location.search}`,
      ).toBe(
        "/user/workout/plans/edit/plan-1?day=0",
      );
    });
  });

  it("allows opening an incomplete day even when a previous workout day is incomplete", async () => {
    useWorkoutPlanDetail.mockReturnValue({
      plan: {
        ...defaultPlan,
        status: "active",
        dayProgress: [
          {
            dayIndex: 0,
            completed: false,
            completedAt: null,
            exerciseCount: 1,
          },
          {
            dayIndex: 1,
            completed: false,
            completedAt: null,
            exerciseCount: 1,
          },
        ],
        schedule: [
          ...defaultPlan.schedule,
          {
            day: "Seshanba",
            focus: "Back",
            exercises: [
              {
                id: 6,
                exerciseId: 6,
                name: "Barbell Row",
                sets: [{ reps: 10, weight: 30 }],
              },
            ],
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: refetchMock,
    });

    const router = renderPage("/user/workout/plans/plan-1/days/1");

    expect(screen.getByText("START")).not.toBeDisabled();
    fireEvent.click(screen.getByText("START"));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        "/user/workout/plans/plan-1/days/1/session",
      );
    });
    expect(activatePlanMock).not.toHaveBeenCalled();
  });

  it("allows a completed workout day to be redone as an extra session", async () => {
    useWorkoutPlanDetail.mockReturnValue({
      plan: {
        ...defaultPlan,
        status: "active",
        dayProgress: [
          {
            dayIndex: 0,
            completed: true,
            completedAt: "2026-05-20T08:00:00.000Z",
            exerciseCount: 1,
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: refetchMock,
    });

    const router = renderPage("/user/workout/plans/plan-1/days/0");

    expect(
      screen.getByText(/yakunlangan|already completed|заверш/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("REDO AS EXTRA SESSION"));

    await waitFor(() => {
      expect(`${router.state.location.pathname}${router.state.location.search}`).toBe(
        "/user/workout/plans/plan-1/days/0/session?mode=extra",
      );
    });
  });

  it("keeps a skipped workout day view-only", () => {
    useWorkoutPlanDetail.mockReturnValue({
      plan: {
        ...defaultPlan,
        status: "active",
        dayProgress: [
          {
            dayIndex: 0,
            completed: false,
            completedAt: null,
            skipped: true,
            skippedAt: "2026-05-20T08:00:00.000Z",
            exerciseCount: 1,
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: refetchMock,
    });

    renderPage("/user/workout/plans/plan-1/days/0");

    expect(screen.getByText("Skipped")).toBeDisabled();
    expect(
      screen.getAllByText(/o'tkazib yuborilgan|skipped|пропущен/i).length,
    ).toBeGreaterThan(0);
  });

  it("restores a skipped workout day back into the plan queue", async () => {
    useWorkoutPlanDetail.mockReturnValue({
      plan: {
        ...defaultPlan,
        status: "active",
        dayProgress: [
          {
            dayIndex: 0,
            completed: false,
            completedAt: null,
            skipped: true,
            skippedAt: "2026-05-20T08:00:00.000Z",
            exerciseCount: 1,
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: refetchMock,
    });
    undoSkipSessionMock.mockResolvedValue({
      success: true,
      restored: true,
    });
    const router = renderPage("/user/workout/plans/plan-1/days/0");

    fireEvent.click(
      screen.getByRole("button", {
        name: /undo skip|skipni bekor qilish|отменить пропуск/i,
      }),
    );

    await waitFor(() => {
      expect(undoSkipSessionMock).toHaveBeenCalledWith("plan-1", 0);
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/user/workout/plans/plan-1");
    });
  });

  it("skips a pending workout day and returns to the plan detail", async () => {
    skipSessionMock.mockResolvedValue({
      id: "skipped-1",
      status: "skipped",
    });
    const router = renderPage("/user/workout/plans/plan-1/days/0");

    fireEvent.click(screen.getByText("SKIP DAY"));

    await waitFor(() => {
      expect(skipSessionMock).toHaveBeenCalledWith("plan-1", 0);
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/user/workout/plans/plan-1");
    });
  });

  it("shows an empty exercise state for a day without exercises", () => {
    useWorkoutPlanDetail.mockReturnValue({
      plan: {
        ...defaultPlan,
        schedule: [
          {
            day: "Dushanba",
            focus: "Mobility",
            exercises: [],
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: refetchMock,
    });

    renderPage();

    expect(screen.getByText("Bu kunda mashq yo'q")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
  });

  it("regenerates the opened AI workout day", async () => {
    regenerateDayMock.mockResolvedValue(defaultPlan);
    renderPage();

    fireEvent.click(screen.getByText("Regenerate"));

    expect(
      screen.getByText("AI yangi mashg'ulotlarni tayyorlamoqda..."),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(regenerateDayMock).toHaveBeenCalledWith("plan-1", 0, {});
    });
  });
});
