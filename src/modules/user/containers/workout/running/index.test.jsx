import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RunningPage from "./index.jsx";
import {
  useRunningActiveSession,
  useRunningStatsSummary,
  useStartRunningSession,
} from "@/hooks/app/use-running-sessions";

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("@/hooks/app/use-running-sessions", () => ({
  useRunningActiveSession: vi.fn(),
  useRunningStatsSummary: vi.fn(),
  useStartRunningSession: vi.fn(),
}));

vi.mock("@/store", () => ({
  useBreadcrumbStore: () => ({
    setBreadcrumbs: vi.fn(),
  }),
}));

const renderPage = () => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/workout/running",
        element: <RunningPage />,
      },
      {
        path: "/user/workout/running/live",
        element: <div data-testid="running-live-route">Live run</div>,
      },
      {
        path: "/user/workout/running/live/:workoutSessionId",
        element: <div data-testid="running-live-route">Live run</div>,
      },
      {
        path: "/user/workout/running/history",
        element: <div data-testid="running-history-route">Run history</div>,
      },
    ],
    { initialEntries: ["/user/workout/running"] },
  );

  render(<RouterProvider router={router} />);
  return router;
};

describe("RunningPage", () => {
  beforeEach(() => {
    useRunningActiveSession.mockReturnValue({
      activeSession: null,
      isLoading: false,
    });
    useRunningStatsSummary.mockReturnValue({
      stats: {
        totalRuns: 3,
        totalDistanceMeters: 12400,
        totalDurationSeconds: 4200,
        totalCaloriesBurned: 820,
      },
    });
    useStartRunningSession.mockReturnValue({
      startRunningSession: vi.fn().mockResolvedValue({
        workoutSessionId: "workout-1",
      }),
      isPending: false,
    });
  });

  it("renders running stats and starts a live run", async () => {
    const startRunningSession = vi.fn().mockResolvedValue({
      workoutSessionId: "workout-1",
    });
    useStartRunningSession.mockReturnValue({
      startRunningSession,
      isPending: false,
    });
    const router = renderPage();

    expect(
      screen.getByRole("heading", { name: "Running" }),
    ).toBeInTheDocument();
    expect(screen.getByText("12.4 km")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /start run/i }));
    await screen.findByTestId("running-live-route");

    expect(startRunningSession).toHaveBeenCalled();
    expect(router.state.location.pathname).toBe(
      "/user/workout/running/live/workout-1",
    );
  });

  it("shows active session recovery and resumes it", () => {
    useRunningActiveSession.mockReturnValue({
      activeSession: {
        workoutSessionId: "workout-active",
        status: "active",
      },
      isLoading: false,
    });
    const router = renderPage();

    expect(screen.getByText("Active run found")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /resume/i }));

    expect(router.state.location.pathname).toBe(
      "/user/workout/running/live/workout-active",
    );
  });
});
