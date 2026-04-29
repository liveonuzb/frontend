import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import WorkoutDashboardPage from "./index.jsx";
import useWorkoutOverview from "@/hooks/app/use-workout-overview";
import useWorkoutPlan from "@/hooks/app/use-workout-plan";
import { useWorkoutSessionHistory } from "@/hooks/app/use-workout-sessions";
import {
  useWorkoutCatalog,
  useWorkoutExerciseCategories,
  useWorkoutExercises,
} from "@/hooks/app/use-workout-plans";

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("@/modules/user/containers/dashboard/calorie-gauge-widget.jsx", () => ({
  default: () => <div data-testid="calorie-widget">Calories</div>,
}));

vi.mock("@/hooks/app/use-workout-overview", () => ({
  default: vi.fn(),
}));

vi.mock("@/hooks/app/use-workout-plan", () => ({
  default: vi.fn(),
}));

vi.mock("@/hooks/app/use-workout-sessions", () => ({
  useWorkoutSessionHistory: vi.fn(),
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
  beforeEach(() => {
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
      activePlan: null,
      startPlan: vi.fn(),
    });
    useWorkoutSessionHistory.mockReturnValue({
      sessions: [],
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
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("shows empty next workout state when there is no active plan", () => {
    renderPage();

    expect(
      screen.getByText(/Faol plan yo‘q. Reja yaratganingizdan keyin/),
    ).toBeInTheDocument();
  });

  it("renders backend-driven challenge cards and filters exercises on CTA", () => {
    useWorkoutCatalog.mockReturnValue({
      catalog: {
        bodyParts: [{ id: 14, name: "Butun tana" }],
        exercises: [],
      },
    });
    useWorkoutExerciseCategories.mockReturnValue({
      categories: [{ id: 2, name: "Kuch" }],
    });
    useWorkoutExercises.mockReturnValue({
      exercises: [
        {
          id: 5,
          name: "Bench Press",
          categoryId: 2,
          categoryIds: [2],
          bodyParts: ["Ko'krak"],
          targetMuscles: ["Pectoralis major"],
          trackingType: "REPS_WEIGHT",
          defaultSets: 3,
          imageUrl: "https://example.com/bench.jpg",
        },
      ],
    });

    renderPage();

    expect(screen.getByText("Kuch")).toBeInTheDocument();

    fireEvent.click(screen.getAllByText("Boshlash")[0]);

    expect(toast.info).toHaveBeenCalledWith(
      "Kuch bo'yicha mashqlar filtrlab ko'rsatildi.",
    );
    expect(screen.getAllByText("Bench Press")).toHaveLength(2);
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
    expect(screen.getByText("Day 2")).toBeInTheDocument();
    expect(screen.getByText("Bugun")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Day 2"));

    expect(router.state.location.pathname).toBe(
      "/user/workout/plans/plan-1/days/1/session",
    );
  });
});
