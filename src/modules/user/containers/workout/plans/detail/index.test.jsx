import React from "react";
import "@/lib/i18n";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  createMemoryRouter,
  RouterProvider,
} from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WorkoutPlanDetailPage from "./index.jsx";
import {
  useActivateWorkoutPlan,
  useDeleteWorkoutPlan,
  useWorkoutPlanDetail,
} from "@/hooks/app/use-workout-plans";
import useWorkoutPlan from "@/hooks/app/use-workout-plan";
import { useWorkoutLogs } from "@/hooks/app/use-workout-logs";

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
    useDeleteWorkoutPlan: vi.fn(),
    useWorkoutPlanDetail: vi.fn(),
  };
});

vi.mock("@/hooks/app/use-workout-plan", () => ({
  default: vi.fn(),
}));

vi.mock("@/hooks/app/use-workout-logs", () => ({
  useWorkoutLogs: vi.fn(),
}));

const activatePlanMock = vi.fn();
const startPlanMock = vi.fn();
const deletePlanMock = vi.fn();
const refetchMock = vi.fn();

const defaultPlan = {
  id: "plan-1",
  name: "AI Upper",
  description: "Generated plan",
  status: "draft",
  source: "ai",
  difficulty: "beginner",
  days: 28,
  daysPerWeek: 4,
  generationMeta: {
    goal: "muscle_building",
    level: "beginner",
    benchmark: {
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

const renderPage = () => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/workout/plans/:planId",
        element: <WorkoutPlanDetailPage />,
      },
      {
        path: "/user/workout/plans/:planId/days/:dayIndex",
        element: <div data-testid="day-detail-route">Day detail route</div>,
      },
      {
        path: "/user/workout/plans/:planId/days/:dayIndex/session",
        element: <div data-testid="session-route">Session route</div>,
      },
      {
        path: "/user/workout/plans",
        element: <div data-testid="plans-route">Plans route</div>,
      },
      {
        path: "/user/workout/home",
        element: <div data-testid="workout-home-route">Workout home route</div>,
      },
      {
        path: "/user/workout/plans/edit/:planId",
        element: <div data-testid="edit-route">Edit route</div>,
      },
    ],
    { initialEntries: ["/user/workout/plans/plan-1"] },
  );

  render(<RouterProvider router={router} />);

  return router;
};

describe("WorkoutPlanDetailPage", () => {
  beforeEach(() => {
    activatePlanMock.mockReset();
    startPlanMock.mockReset();
    deletePlanMock.mockReset();
    refetchMock.mockReset();

    useWorkoutPlanDetail.mockReturnValue({
      plan: defaultPlan,
      isLoading: false,
      isError: false,
      refetch: refetchMock,
    });
    useActivateWorkoutPlan.mockReturnValue({
      activatePlan: activatePlanMock,
      isPending: false,
    });
    useWorkoutPlan.mockReturnValue({
      startPlan: startPlanMock,
      isStartingPlan: false,
    });
    useDeleteWorkoutPlan.mockReturnValue({
      deletePlan: deletePlanMock,
      isPending: false,
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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders plan details and AI generation context", () => {
    renderPage();

    expect(screen.getAllByText("AI Upper").length).toBeGreaterThan(0);
    expect(screen.getByText("Goal")).toBeInTheDocument();
    expect(screen.getByText("Difficulty level")).toBeInTheDocument();
    expect(screen.getByText("Day 1")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /start this plan/i }),
    ).toBeInTheDocument();
  });

  it("navigates to a separate day detail page when a day is selected", async () => {
    const router = renderPage();

    fireEvent.click(screen.getByText("Day 1"));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        "/user/workout/plans/plan-1/days/0",
      );
    });
  });

  it("activates the plan and navigates back to workout home", async () => {
    startPlanMock.mockResolvedValue({
      ...defaultPlan,
      status: "active",
    });

    const router = renderPage();
    fireEvent.click(screen.getByRole("button", { name: /start this plan/i }));

    await waitFor(() => {
      expect(startPlanMock).toHaveBeenCalledWith(
        expect.objectContaining({ name: "AI Upper" }),
      );
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        "/user/workout/home",
      );
    });
  });

  it("navigates to the full edit page from the detail action", async () => {
    const router = renderPage();

    fireEvent.click(screen.getByRole("button", { name: /tahrirlash/i }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        "/user/workout/plans/edit/plan-1",
      );
    });
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

  it("shows an error state when the plan cannot be loaded", () => {
    useWorkoutPlanDetail.mockReturnValue({
      plan: null,
      isLoading: false,
      isError: true,
      refetch: refetchMock,
    });

    renderPage();

    expect(screen.getByText("Workout reja topilmadi")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Workout reja" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Qayta urinish" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rejalarga qaytish" })).toBeInTheDocument();
  });

  it("shows an empty schedule state when the plan has no days", () => {
    useWorkoutPlanDetail.mockReturnValue({
      plan: {
        ...defaultPlan,
        schedule: [],
      },
      isLoading: false,
      isError: false,
      refetch: refetchMock,
    });

    renderPage();

    expect(screen.getByText("Schedule hali to'ldirilmagan")).toBeInTheDocument();
  });
});
