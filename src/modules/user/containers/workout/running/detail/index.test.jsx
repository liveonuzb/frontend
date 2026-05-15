import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RunningDetailPage from "./index.jsx";
import { useRunningSessionDetail } from "@/hooks/app/use-running-sessions";

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key, fallback, values = {}) =>
      typeof fallback === "string"
        ? fallback.replaceAll("{{index}}", String(values.index ?? ""))
        : _key,
  }),
}));

vi.mock("@/components/page-loader/index.jsx", () => ({
  default: () => <div data-testid="page-loader">Loading</div>,
}));

vi.mock("@/hooks/app/use-running-sessions", () => ({
  useRunningSessionDetail: vi.fn(),
}));

vi.mock("../components/run-map-panel.jsx", () => ({
  default: ({ polyline, points, emptyLabel }) => (
    <div
      data-testid="run-map-panel"
      data-polyline={polyline ?? ""}
      data-point-count={points?.length ?? 0}
      data-empty-label={emptyLabel}
    />
  ),
}));

const renderPage = () => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/workout/running/:workoutSessionId",
        element: <RunningDetailPage />,
      },
      {
        path: "/user/workout/running/history",
        element: <div>Run history</div>,
      },
    ],
    { initialEntries: ["/user/workout/running/workout-1"] },
  );

  render(<RouterProvider router={router} />);
  return router;
};

describe("RunningDetailPage", () => {
  beforeEach(() => {
    useRunningSessionDetail.mockReturnValue({
      isLoading: false,
      session: {
        workoutSessionId: "workout-1",
        startedAt: "2026-05-12T10:00:00.000Z",
        metrics: {
          distanceMeters: 1000,
          durationSeconds: 600,
          caloriesBurned: 72,
            averagePaceSecondsPerKm: 600,
            gpsQualityScore: 0.91,
          },
          route: {
            polyline: "encoded-route",
          },
          splits: [
            {
              index: 1,
              distanceMeters: 1000,
              durationSeconds: 600,
              paceSecondsPerKm: 600,
            },
          ],
          points: [
          {
            sequence: 1,
            latitude: 41.311081,
            longitude: 69.240562,
          },
        ],
      },
    });
  });

  it("passes saved route data to the running map panel", () => {
    renderPage();

    expect(screen.getByTestId("run-map-panel")).toHaveAttribute(
      "data-polyline",
      "encoded-route",
    );
    expect(screen.getByTestId("run-map-panel")).toHaveAttribute(
      "data-point-count",
      "1",
    );
  });

  it("exposes accessible back navigation and split quality details", () => {
    const router = renderPage();

    expect(
      screen.getByRole("button", { name: /tarixga qaytish/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("GPS sifati")).toBeInTheDocument();
    expect(screen.getByText("91%")).toBeInTheDocument();
    expect(screen.getByText("1-km")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /tarixga qaytish/i }));

    expect(router.state.location.pathname).toBe("/user/workout/running/history");
  });
});
