import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RunningPage from "./index.jsx";
import {
  useRunningActiveSession,
  useRunningSessionDetail,
  useRunningSessions,
  useRunningStatsSummary,
  useStartRunningSession,
} from "@/hooks/app/use-running-sessions";
import {
  loadActiveRunningSession,
  loadRunningPointQueue,
} from "@/lib/running-offline-queue";

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key, fallback, values = {}) =>
      typeof fallback === "string"
        ? fallback.replaceAll("{{count}}", String(values.count ?? ""))
        : _key,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock("@/hooks/app/use-running-sessions", () => ({
  useRunningActiveSession: vi.fn(),
  useRunningSessionDetail: vi.fn(),
  useRunningSessions: vi.fn(),
  useRunningStatsSummary: vi.fn(),
  useStartRunningSession: vi.fn(),
}));

vi.mock("@/lib/running-offline-queue", () => ({
  loadActiveRunningSession: vi.fn(),
  loadRunningPointQueue: vi.fn(),
}));

vi.mock("./components/run-map-panel.jsx", () => ({
  default: ({
    points,
    polyline,
    qualityScore,
    emptyLabel,
    onExpand,
    expandLabel = "Expand route preview",
  }) => (
    <div
      data-testid="home-route-preview"
      data-point-count={points?.length ?? 0}
      data-polyline={polyline ?? ""}
      data-quality-score={qualityScore ?? ""}
      data-empty-label={emptyLabel ?? ""}
    >
      <button type="button" onClick={onExpand}>
        {expandLabel}
      </button>
    </div>
  ),
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
      {
        path: "/user/workout/running/:workoutSessionId",
        element: <div data-testid="running-detail-route">Run detail</div>,
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
    loadActiveRunningSession.mockReturnValue(null);
    useRunningStatsSummary.mockReturnValue({
      stats: {
        totalRuns: 3,
        totalDistanceMeters: 12400,
        totalDurationSeconds: 4200,
        totalCaloriesBurned: 820,
      },
    });
    useRunningSessions.mockReturnValue({
      sessions: [],
      isLoading: false,
    });
    useRunningSessionDetail.mockReturnValue({
      session: null,
      isLoading: false,
    });
    useStartRunningSession.mockReturnValue({
      startRunningSession: vi.fn().mockResolvedValue({
        workoutSessionId: "workout-1",
      }),
      isPending: false,
    });
    loadRunningPointQueue.mockReturnValue([]);
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

  it("shows an inline start error when the backend running feature is unavailable", async () => {
    const startRunningSession = vi
      .fn()
      .mockRejectedValue(new Error("Running feature is disabled"));
    useStartRunningSession.mockReturnValue({
      startRunningSession,
      isPending: false,
    });
    const router = renderPage();

    fireEvent.click(screen.getByRole("button", { name: /start run/i }));

    expect(
      await screen.findByRole("alert", {
        name: /running start error/i,
      }),
    ).toHaveTextContent("Run could not be started. Try again.");
    expect(router.state.location.pathname).toBe("/user/workout/running");
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

    expect(screen.getByText("Active run is ready")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /resume run/i }));

    expect(router.state.location.pathname).toBe(
      "/user/workout/running/live/workout-active",
    );
  });

  it("recovers a locally saved active session when server active data is empty", () => {
    loadActiveRunningSession.mockReturnValue({
      workoutSessionId: "workout-local",
      status: "active",
    });
    const router = renderPage();

    expect(screen.getByText("Active run is ready")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /resume run/i }));

    expect(router.state.location.pathname).toBe(
      "/user/workout/running/live/workout-local",
    );
  });

  it("shows history and empty recent runs before starting a web run", () => {
    renderPage();

    expect(screen.getByText(/no runs yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /history/i })).toHaveAttribute(
      "href",
      "/user/workout/running/history",
    );
  });

  it("renders weekly and recent run data", () => {
    useRunningSessions.mockReturnValue({
      sessions: [
        {
          workoutSessionId: "recent-1",
          startedAt: new Date().toISOString(),
          metrics: {
            distanceMeters: 1500,
            durationSeconds: 600,
            averagePaceSecondsPerKm: 400,
          },
        },
      ],
      isLoading: false,
    });

    renderPage();

    expect(screen.getByText("This week")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /outdoor run/i })).toHaveAttribute(
      "href",
      "/user/workout/running/recent-1",
    );
    expect(screen.getAllByText("1.5 km").length).toBeGreaterThan(0);
  });

  it("uses the latest completed run detail route in the home preview and expands to detail", () => {
    useRunningSessions.mockReturnValue({
      sessions: [
        {
          workoutSessionId: "recent-1",
          startedAt: new Date().toISOString(),
          metrics: {
            distanceMeters: 1500,
            durationSeconds: 600,
            averagePaceSecondsPerKm: 400,
            gpsQualityScore: 0.88,
          },
        },
      ],
      isLoading: false,
    });
    useRunningSessionDetail.mockReturnValue({
      session: {
        workoutSessionId: "recent-1",
        route: {
          polyline: "encoded-route",
        },
        points: [
          {
            sequence: 1,
            latitude: 41.311081,
            longitude: 69.240562,
          },
          {
            sequence: 2,
            latitude: 41.320069,
            longitude: 69.240562,
          },
        ],
        metrics: {
          gpsQualityScore: 0.88,
        },
      },
      isLoading: false,
    });
    const router = renderPage();

    const previews = screen.getAllByTestId("home-route-preview");

    expect(previews[0]).toHaveAttribute("data-point-count", "2");
    expect(previews[0]).toHaveAttribute("data-polyline", "encoded-route");
    expect(previews[0]).toHaveAttribute("data-quality-score", "0.88");
    expect(previews[0]).toHaveAttribute("data-empty-label", "");

    fireEvent.click(
      screen.getAllByRole("button", { name: /expand route preview/i })[0],
    );

    expect(router.state.location.pathname).toBe(
      "/user/workout/running/recent-1",
    );
  });
});
