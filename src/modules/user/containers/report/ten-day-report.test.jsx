import React from "react";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TenDayReport from "./ten-day-report.jsx";
import useGetQuery from "@/hooks/api/use-get-query";

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("@/components/charts/line-chart", () => ({
  default: () => <div data-testid="line-chart" />,
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
        path: "/user/report/range/:days",
        element: <TenDayReport />,
      },
    ],
    { initialEntries: ["/user/report/range/10?endDate=2026-05-12"] },
  );

  render(<RouterProvider router={router} />);
  return router;
};

describe("TenDayReport", () => {
  beforeEach(() => {
    useGetQuery.mockReturnValue({
      isLoading: false,
      data: {
        data: {
          period: {
            days: 10,
            startDate: "2026-05-03",
            endDate: "2026-05-12",
          },
          overallScore: 80,
          successfulDays: 6,
          daysCalendar: [
            { date: "2026-05-12", status: "good", score: 80 },
          ],
          trends: {
            water: [2000],
            protein: [120],
            calories: [2100],
            carbs: [220],
            fat: [62],
            fastFood: [0],
            runningDistanceMeters: [5000],
          },
          averages: {
            water: { value: 2000, deltaPct: null },
            protein: { value: 120, deltaPct: null },
            calories: { value: 2100, deltaPct: null },
            carbs: { value: 220, deltaPct: null },
            fat: { value: 62, deltaPct: null },
            fastFood: { value: 0, deltaPct: null },
            running: {
              distanceMeters: 5000,
              durationMinutes: 30,
              burnedCalories: 320,
              count: 1,
              averagePaceSecondsPerKm: 360,
              deltaPct: null,
            },
          },
          highlights: {},
          improvements: [],
          recommendations: [],
        },
      },
    });
  });

  it("renders running totals from the range report", () => {
    renderPage();

    expect(screen.getByText("Running")).toBeInTheDocument();
    expect(screen.getByText("5.0 km")).toBeInTheDocument();
    expect(screen.getByText("1 runs")).toBeInTheDocument();
    expect(screen.getByText("6:00 /km")).toBeInTheDocument();
  });
});
