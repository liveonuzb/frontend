import React from "react";
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

vi.mock("../../session-drawer", () => ({
  default: ({ open, plan, initialDayIdx }) => (
    <div
      data-testid="session-drawer"
      data-open={String(open)}
      data-day-index={String(initialDayIdx)}
    >
      {plan?.name}
    </div>
  ),
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

vi.mock("@/hooks/app/use-workout-logs", () => ({
  useWorkoutLogs: vi.fn(),
}));

const activatePlanMock = vi.fn();
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
        path: "/user/workout/plans",
        element: <div data-testid="plans-route">Plans route</div>,
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
    expect(screen.getByText("AI asoslari")).toBeInTheDocument();
    expect(screen.getByText(/Bench Press/)).toBeInTheDocument();
    expect(screen.getAllByText("46 kg").length).toBeGreaterThan(0);
    expect(screen.getByText("Day 1")).toBeInTheDocument();
  });

  it("opens exercise instructions drawer from the selected day exercise list", () => {
    renderPage();

    fireEvent.click(screen.getByText(/Bench Press/));

    expect(screen.getByText("Instructions")).toBeInTheDocument();
    expect(screen.getByText("Records")).toBeInTheDocument();
    expect(screen.getByText("Focus area")).toBeInTheDocument();
    expect(screen.getByText("Lie on bench")).toBeInTheDocument();
  });

  it("activates the plan and opens the session drawer", async () => {
    activatePlanMock.mockResolvedValue({
      ...defaultPlan,
      status: "active",
    });

    renderPage();
    fireEvent.click(screen.getAllByText("Boshlash")[0]);

    await waitFor(() => {
      expect(activatePlanMock).toHaveBeenCalledWith(
        "plan-1",
        expect.objectContaining({
          name: "AI Upper",
        }),
      );
    });

    expect(screen.getByTestId("session-drawer")).toHaveAttribute(
      "data-open",
      "true",
    );
    expect(screen.getByTestId("session-drawer")).toHaveAttribute(
      "data-day-index",
      "0",
    );
  });

  it("navigates to the full edit page from the detail action", async () => {
    const router = renderPage();

    fireEvent.click(screen.getAllByText("Tahrirlash")[0]);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        "/user/workout/plans/edit/plan-1",
      );
    });
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
  });
});
