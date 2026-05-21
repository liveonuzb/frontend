import React from "react";
import "@/lib/i18n";
import i18n from "@/lib/i18n";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WorkoutPlansPage from "./index.jsx";
import { useGetQuery } from "@/hooks/api";
import useWorkoutPlan from "@/hooks/app/use-workout-plan";
import { useRunningActiveSession } from "@/hooks/app/use-running-sessions";
import { useActiveWorkoutSession } from "@/hooks/app/use-workout-sessions";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("../running/components/run-map-panel.jsx", () => ({
  default: () => <div data-testid="plans-live-run-map" />,
}));

vi.mock("@/store", () => ({
  useLanguageStore: (selector) => selector({ currentLanguage: "en" }),
  useBreadcrumbStore: () => ({
    setBreadcrumbs: vi.fn(),
  }),
}));

vi.mock("@/hooks/api", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useGetQuery: vi.fn(),
  };
});

vi.mock("@/hooks/app/use-workout-plan", () => ({
  default: vi.fn(),
}));

vi.mock("@/hooks/app/use-running-sessions", () => ({
  useRunningActiveSession: vi.fn(),
}));

vi.mock("@/hooks/app/use-workout-sessions", () => ({
  useActiveWorkoutSession: vi.fn(),
}));

const startPlanMock = vi.fn();
const removePlanMock = vi.fn();
const duplicatePlanMock = vi.fn();

const renderPage = () => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/workout/plans",
        element: <WorkoutPlansPage />,
      },
      {
        path: "/user/workout/plans/create",
        element: <div data-testid="create-route">Create route</div>,
      },
      {
        path: "/user/workout/plans/:planId",
        element: <div data-testid="detail-route">Detail route</div>,
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
        path: "/user/workout/plans/edit/:planId",
        element: <div data-testid="edit-route">Edit route</div>,
      },
      {
        path: "/user/workout/running/live/:workoutSessionId",
        element: <div data-testid="running-live-route">Running live route</div>,
      },
      {
        path: "/user/workout/overview",
        element: <div data-testid="overview-route">Workout overview route</div>,
      },
    ],
    { initialEntries: ["/user/workout/plans"] },
  );

  render(<RouterProvider router={router} />);

  return router;
};

describe("WorkoutPlansPage", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    startPlanMock.mockReset();
    removePlanMock.mockReset();
    duplicatePlanMock.mockReset();
    useGetQuery.mockReturnValue({
      data: {
        data: {
          currentStreak: 5,
          premium: { isActive: true },
        },
      },
    });
    useRunningActiveSession.mockReturnValue({
      activeSession: null,
    });
    useActiveWorkoutSession.mockReturnValue({
      activeWorkoutSession: null,
    });
    useWorkoutPlan.mockReturnValue({
      plans: [
        {
          id: "plan-1",
          name: "Upper Strength",
          description: "Build upper-body strength.",
          status: "active",
          source: "manual",
          days: 28,
          daysPerWeek: 4,
          schedule: [
            {
              title: "Push Day",
              exercises: [{ name: "Bench Press" }],
            },
          ],
        },
      ],
      templates: [
        {
          id: "template-muscle",
          name: "Muscle Gain Plan",
          description: "Build lean muscle from backend template.",
          coverImageUrl: "https://cdn.example.com/muscle.jpg",
          status: "template",
          source: "seed",
          isTemplate: true,
          days: 56,
          daysPerWeek: 4,
          difficulty: "intermediate",
          schedule: [{ title: "Chest", exercises: [{ name: "Bench Press" }] }],
        },
        {
          id: "template-running",
          name: "Running Starter Plan",
          description: "Build a consistent running habit.",
          coverImageUrl: "https://cdn.example.com/running.jpg",
          status: "template",
          source: "seed",
          isTemplate: true,
          days: 28,
          daysPerWeek: 3,
          difficulty: "beginner",
          schedule: [{ title: "Easy Run", exercises: [{ name: "Easy Run" }] }],
        },
      ],
      activePlan: {
        id: "plan-1",
        name: "Upper Strength",
        progress: 34,
        currentWeek: 1,
        currentDay: 2,
      },
      startPlan: startPlanMock,
      removePlan: removePlanMock,
      duplicatePlan: duplicatePlanMock,
      isStartingPlan: false,
      isRemovingPlan: false,
      isDuplicatingPlan: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders localized plan list and sidebar copy", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "Plans" })).toBeInTheDocument();
    expect(screen.getByText("Weight loss")).toBeInTheDocument();
    expect(screen.getAllByText("Your active plan").length).toBeGreaterThan(0);
    expect(screen.getByText("34% complete")).toBeInTheDocument();
    expect(screen.getAllByText("Create new plan").length).toBeGreaterThan(0);
  });

  it("keeps the plans heading accessible while removing the visible intro header", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "Plans" })).toHaveClass(
      "sr-only",
    );
    expect(
      screen.queryByText("Find the right plan for your goals."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Day streak")).not.toBeInTheDocument();
  });

  it("renders a no-active-plan state hero before the compact plan rows", () => {
    useWorkoutPlan.mockReturnValue({
      plans: [],
      templates: [],
      activePlan: null,
      startPlan: startPlanMock,
      removePlan: removePlanMock,
      isStartingPlan: false,
      isRemovingPlan: false,
    });

    renderPage();

    expect(screen.getByTestId("plans-state-hero-no-active")).toBeInTheDocument();
    expect(screen.getByText("You do not have an active plan yet")).toBeInTheDocument();
    expect(screen.getByText("AI plan selection")).toBeInTheDocument();
    expect(screen.queryByTestId("plans-compact-row")).not.toBeInTheDocument();
    expect(screen.queryByText("Muscle Gain Plan")).not.toBeInTheDocument();
  });

  it("renders an active-plan hero and starts today's workout session", async () => {
    const router = renderPage();

    expect(screen.getByTestId("plans-state-hero-active-plan")).toBeInTheDocument();
    expect(screen.getByText("Today's workout is ready")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Start today's workout" }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        "/user/workout/plans/plan-1/days/0/session",
      );
    });
    expect(screen.getByTestId("session-route")).toBeInTheDocument();
  });

  it("uses the backend nextWorkout as the active plan start target", async () => {
    useWorkoutPlan.mockReturnValue({
      plans: [],
      templates: [],
      activePlan: {
        id: "plan-2",
        name: "Backend Plan",
        status: "active",
        progress: 40,
        completedWorkouts: 2,
        targetWorkouts: 5,
        nextWorkout: {
          planId: "plan-2",
          dayIndex: 2,
          title: "Pull Day",
          duration: "36 min",
          estimatedCalories: 240,
          exerciseCount: 5,
          completed: false,
          isStartable: true,
        },
        todayWorkout: {
          dayIndex: 2,
          title: "Pull Day",
          duration: "36 min",
          calories: 240,
          exercisesCount: 5,
        },
        schedule: [
          { title: "Push Day", exercises: [{ name: "Bench" }] },
          { title: "Leg Day", exercises: [{ name: "Squat" }] },
          { title: "Pull Day", exercises: [{ name: "Pull-up" }] },
        ],
        dayProgress: [
          { dayIndex: 0, completed: false, exerciseCount: 1 },
          { dayIndex: 1, completed: false, exerciseCount: 1 },
          { dayIndex: 2, completed: false, exerciseCount: 1 },
        ],
      },
      startPlan: startPlanMock,
      removePlan: removePlanMock,
      isStartingPlan: false,
      isRemovingPlan: false,
    });
    const router = renderPage();

    expect(screen.getByText(/Pull Day/)).toBeInTheDocument();
    expect(screen.getByText("36 min")).toBeInTheDocument();
    expect(screen.getByText("240")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Start today's workout" }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        "/user/workout/plans/plan-2/days/2/session",
      );
    });
  });

  it("prioritizes a live running hero and routes finish actions to the live page", async () => {
    useRunningActiveSession.mockReturnValue({
      activeSession: {
        workoutSessionId: "run-active",
        status: "active",
        metrics: {
          distanceMeters: 2450,
          durationSeconds: 988,
          caloriesBurned: 168,
          averagePaceSecondsPerKm: 403,
        },
        points: [
          { latitude: 41.311081, longitude: 69.240562 },
          { latitude: 41.320069, longitude: 69.250562 },
        ],
      },
    });
    const router = renderPage();

    expect(screen.getByTestId("plans-state-hero-live-run")).toBeInTheDocument();
    expect(screen.getAllByText("Running in progress").length).toBeGreaterThan(0);
    expect(screen.getByTestId("plans-live-run-map")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Finish" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        "/user/workout/running/live/run-active",
      );
    });
    expect(screen.getByTestId("running-live-route")).toBeInTheDocument();
  });

  it("prioritizes an active workout draft over the active plan", () => {
    useActiveWorkoutSession.mockReturnValue({
      activeWorkoutSession: {
        id: "draft-1",
        planId: "plan-1",
        planDayIndex: 0,
        planDayKey: "Push Day",
        elapsedSeconds: 640,
        exercises: [{ name: "Bench Press" }, { name: "Incline Press" }],
      },
    });
    const router = renderPage();

    expect(screen.getByTestId("plans-state-hero-active-workout")).toBeInTheDocument();
    expect(screen.getByText("Workout in progress")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue workout" }));

    expect(router.state.location.pathname).toBe(
      "/user/workout/plans/plan-1/days/0/session",
    );
  });

  it("renders the redesigned right rail widgets", () => {
    renderPage();

    expect(screen.getByText("Recommended for you")).toBeInTheDocument();
    expect(screen.getAllByText("Muscle Gain Plan").length).toBeGreaterThan(0);
    expect(screen.getByText("View recommendation")).toBeInTheDocument();
    expect(screen.getByText("Workout streak")).toBeInTheDocument();
    expect(screen.getByText("5 days in a row")).toBeInTheDocument();
    expect(screen.getByText("Why follow a plan?")).toBeInTheDocument();
  });

  it("filters running plans and opens them in the unified plan flow", () => {
    const router = renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Running" }));

    expect(screen.getByText("Running Starter Plan")).toBeInTheDocument();
    expect(screen.getAllByTestId("plans-compact-row")).toHaveLength(1);

    fireEvent.click(
      screen.getByRole("button", {
        name: "View Running Starter Plan plan",
      }),
    );

    expect(router.state.location.pathname).toBe(
      "/user/workout/plans/template-running",
    );
    expect(screen.getByTestId("detail-route")).toBeInTheDocument();
  });

  it("starts a running plan through the existing workout plan action without leaving plans", async () => {
    const router = renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Running" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Select as plan" })[0]);

    await waitFor(() => {
      expect(startPlanMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "template-running",
          isTemplate: true,
        }),
      );
    });
    expect(router.state.location.pathname).toBe("/user/workout/plans");
    expect(screen.queryByTestId("overview-route")).not.toBeInTheDocument();
  });

  it("duplicates a persisted plan from the compact row menu", async () => {
    renderPage();

    fireEvent.pointerDown(
      screen.getAllByRole("button", { name: "More actions" })[0],
    );
    fireEvent.click(screen.getByRole("menuitem", { name: /Duplicate/i }));

    await waitFor(() => {
      expect(duplicatePlanMock).toHaveBeenCalledWith("plan-1");
    });
  });

  it("keeps the required Russian page labels", async () => {
    await i18n.changeLanguage("ru");

    renderPage();

    expect(screen.getByRole("heading", { name: "Планы" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Бег" })).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Создать новый план" }).length,
    ).toBeGreaterThan(0);
  });
});
