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

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
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
  default: ({ open, plan }) => (
    <div data-testid="session-drawer" data-open={String(open)}>
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
          name: "Bench Press",
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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders plan details and AI generation context", () => {
    renderPage();

    expect(screen.getAllByText("AI Upper").length).toBeGreaterThan(0);
    expect(screen.getByText("AI asoslari")).toBeInTheDocument();
    expect(screen.getByText("Bench Press")).toBeInTheDocument();
    expect(screen.getByText("46 kg")).toBeInTheDocument();
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
