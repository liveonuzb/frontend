import React from "react";
import "@/lib/i18n";
import i18n from "@/lib/i18n";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WorkoutPlansPage from "./index.jsx";
import { useGetQuery } from "@/hooks/api";
import useWorkoutPlan from "@/hooks/app/use-workout-plan";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <>{children}</>,
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

const startPlanMock = vi.fn();
const removePlanMock = vi.fn();

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
        path: "/user/workout/plans/edit/:planId",
        element: <div data-testid="edit-route">Edit route</div>,
      },
      {
        path: "/user/workout/home",
        element: <div data-testid="home-route">Workout home route</div>,
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
    useGetQuery.mockReturnValue({
      data: {
        data: {
          currentStreak: 5,
          premium: { isActive: true },
        },
      },
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
          schedule: [],
        },
      ],
      templates: [],
      activePlan: {
        id: "plan-1",
        name: "Upper Strength",
        progress: 34,
        currentWeek: 1,
        currentDay: 2,
      },
      startPlan: startPlanMock,
      removePlan: removePlanMock,
      isStartingPlan: false,
      isRemovingPlan: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders localized plan list and sidebar copy", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "Plans" })).toBeInTheDocument();
    expect(
      screen.getByText("Find the right plan for your goals."),
    ).toBeInTheDocument();
    expect(screen.getByText("Day streak")).toBeInTheDocument();
    expect(screen.getByText("Weight loss")).toBeInTheDocument();
    expect(screen.getByText("Your active plan")).toBeInTheDocument();
    expect(screen.getByText("34% complete")).toBeInTheDocument();
    expect(screen.getAllByText("Create new plan").length).toBeGreaterThan(0);
  });

  it("renders the redesigned right rail widgets", () => {
    renderPage();

    expect(screen.getByText("Recommended for you")).toBeInTheDocument();
    expect(screen.getByText("Focus on strength")).toBeInTheDocument();
    expect(screen.getByText("View recommendation")).toBeInTheDocument();
    expect(screen.getByText("Workout streak")).toBeInTheDocument();
    expect(screen.getByText("5 days in a row")).toBeInTheDocument();
    expect(screen.getByText("Why follow a plan?")).toBeInTheDocument();
  });

  it("filters running plans and opens them in the unified plan flow", () => {
    const router = renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Running" }));

    expect(screen.getByText("Running Starter Plan")).toBeInTheDocument();
    expect(screen.queryByText("Muscle Gain Plan")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "View Running Starter Plan plan",
      }),
    );

    expect(router.state.location.pathname).toBe(
      "/user/workout/plans/running-starter-plan",
    );
    expect(screen.getByTestId("detail-route")).toBeInTheDocument();
  });

  it("starts a running plan through the existing workout plan action", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Running" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Start" })[0]);

    await waitFor(() => {
      expect(startPlanMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "running-starter-plan",
          category: "running",
        }),
      );
    });
    expect(screen.getByTestId("home-route")).toBeInTheDocument();
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
