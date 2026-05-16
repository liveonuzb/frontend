import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RunningHistoryPage from "./index.jsx";
import { useRunningSessions } from "@/hooks/app/use-running-sessions";

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key, fallback, values = {}) =>
      typeof fallback === "string"
        ? fallback.replaceAll("{{date}}", String(values.date ?? ""))
        : _key,
  }),
}));

vi.mock("@/components/page-loader/index.jsx", () => ({
  default: () => <div data-testid="page-loader">Loading</div>,
}));

vi.mock("@/hooks/app/use-running-sessions", () => ({
  useRunningSessions: vi.fn(),
}));

const renderPage = () => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/workout/running/history",
        element: <RunningHistoryPage />,
      },
      {
        path: "/user/workout/running/:workoutSessionId",
        element: <div data-testid="running-detail-route">Run detail</div>,
      },
      {
        path: "/user/workout/running",
        element: <div>Running home</div>,
      },
    ],
    { initialEntries: ["/user/workout/running/history"] },
  );

  render(<RouterProvider router={router} />);
  return router;
};

describe("RunningHistoryPage", () => {
  beforeEach(() => {
    useRunningSessions.mockReturnValue({
      sessions: [
        {
          workoutSessionId: "workout-1",
          startedAt: "2026-05-12T10:00:00.000Z",
          metrics: {
            distanceMeters: 1000,
            durationSeconds: 600,
            caloriesBurned: 72,
            averagePaceSecondsPerKm: 600,
            gpsQualityScore: 0.92,
          },
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it("renders completed runs as keyboard-accessible links", () => {
    const router = renderPage();
    const runLink = screen.getByRole("link", { name: /ochiq yugurish/i });

    expect(runLink).toHaveAttribute("href", "/user/workout/running/workout-1");
    expect(screen.getByText("1.0 km")).toBeInTheDocument();
    expect(screen.getByText(/00:10:00/)).toBeInTheDocument();
    expect(screen.getByText(/10:00 \/km/)).toBeInTheDocument();
    expect(screen.getByText(/72 kcal/)).toBeInTheDocument();
    expect(screen.getByText("GPS 92%")).toBeInTheDocument();

    fireEvent.click(runLink);

    expect(router.state.location.pathname).toBe(
      "/user/workout/running/workout-1",
    );
  });

  it("shows an actionable Uzbek empty state", () => {
    useRunningSessions.mockReturnValue({
      sessions: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText(/hali yugurishlar yo'q/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /birinchi yugurishni boshlash/i }),
    ).toHaveAttribute("href", "/user/workout/running");
  });
});
