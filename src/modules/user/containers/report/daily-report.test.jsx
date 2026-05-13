import React from "react";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DailyReport from "./daily-report.jsx";
import useGetQuery from "@/hooks/api/use-get-query";

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("@/hooks/api/use-get-query", () => ({
  default: vi.fn(),
}));

vi.mock("@/store/breadcrumb-store", () => ({
  default: (selector) =>
    selector({
      setBreadcrumbs: vi.fn(),
    }),
}));

const renderPage = () => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/report/daily/:date",
        element: <DailyReport />,
      },
    ],
    { initialEntries: ["/user/report/daily/2026-05-12"] },
  );

  render(<RouterProvider router={router} />);
  return router;
};

describe("DailyReport", () => {
  beforeEach(() => {
    useGetQuery.mockReturnValue({
      isLoading: false,
      data: {
        data: {
          hasData: true,
          status: "good",
          score: 82,
          summary: "Running day",
          metrics: {
            water: { actual: 1800, goal: 2500, status: "warn", label: "Kam" },
            calories: { actual: 2100, goal: 2200, status: "good", label: "Zo'r" },
            protein: { actual: 120, goal: 150, status: "warn", label: "Kam" },
            carbs: { actual: 220, goal: 250, status: "good", label: "Zo'r" },
            fat: { actual: 62, goal: 70, status: "good", label: "Zo'r" },
            fastFood: { count: 0, status: "good", label: "Yo'q" },
            running: {
              count: 1,
              distanceMeters: 5000,
              durationMinutes: 30,
              burnedCalories: 320,
              averagePaceSecondsPerKm: 360,
              status: "good",
              label: "Yugurish bor",
            },
          },
        },
      },
    });
  });

  it("renders running metrics when the daily report includes a run", () => {
    renderPage();

    expect(screen.getByText("Running")).toBeInTheDocument();
    expect(screen.getByText("5.0 km")).toBeInTheDocument();
    expect(screen.getByText("30 min")).toBeInTheDocument();
    expect(screen.getByText("6:00 /km")).toBeInTheDocument();
  });
});
