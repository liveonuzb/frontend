import React from "react";
import "@/lib/i18n";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SessionHistoryPage from "./index.jsx";
import {
  useWorkoutSessionHistory,
  useWorkoutSessionHistorySummary,
} from "@/hooks/app/use-workout-sessions";
import { useWorkoutPlans } from "@/hooks/app/use-workout-plans";

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("@/components/page-loader/index.jsx", () => ({
  default: () => <div data-testid="page-loader">Loading</div>,
}));

vi.mock("../running/components/run-map-panel.jsx", () => ({
  default: ({ polyline, qualityScore, segments, emptyLabel }) => (
    <div
      data-testid="history-running-map"
      data-polyline={polyline ?? ""}
      data-quality={qualityScore ?? ""}
      data-segment-count={segments?.length ?? 0}
      data-empty-label={emptyLabel ?? ""}
    />
  ),
}));

vi.mock("@/hooks/app/use-workout-sessions", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useWorkoutSessionHistory: vi.fn(),
    useWorkoutSessionHistorySummary: vi.fn(),
  };
});

vi.mock("@/hooks/app/use-workout-plans", () => ({
  useWorkoutPlans: vi.fn(),
}));

const renderPage = (initialEntry = "/user/workout/history") => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/workout/history",
        element: <SessionHistoryPage />,
      },
      {
        path: "/user/workout/report",
        element: <SessionHistoryPage />,
      },
      {
        path: "/user/workout",
        element: <div>Workout home</div>,
      },
      {
        path: "/user/workout/history/:sessionId",
        element: <div data-testid="history-detail-route">History detail route</div>,
      },
      {
        path: "/user/workout/running/:sessionId",
        element: <div data-testid="running-detail-route">Running detail route</div>,
      },
    ],
    { initialEntries: [initialEntry] },
  );

  render(<RouterProvider router={router} />);
  return router;
};

describe("SessionHistoryPage", () => {
  beforeEach(() => {
    const now = new Date();
    const todayIso = new Date(now).toISOString();
    const previousDay = new Date(now);
    previousDay.setDate(previousDay.getDate() - 1);
    const oldDay = new Date(now);
    oldDay.setDate(oldDay.getDate() - 20);

    useWorkoutSessionHistory.mockReturnValue({
      sessions: [
        {
          id: "session-1",
          planName: "Leg Power",
          focus: "Legs",
          planDayIndex: 0,
          endedAt: todayIso,
          durationSeconds: 1500,
          estimatedCalories: 180,
          totalVolumeKg: 840,
          totalSets: 6,
          completedSets: 6,
          completedExerciseCount: 3,
          exerciseSummaries: [
            {
              exerciseKey: "squat-1",
              exerciseName: "Squat",
              completedSets: 3,
              totalReps: 30,
              totalVolumeKg: 840,
            },
          ],
        },
        {
          id: "session-2",
          planName: "Push Day",
          focus: "Chest",
          planDayIndex: 1,
          endedAt: oldDay.toISOString(),
          durationSeconds: 1200,
          estimatedCalories: 120,
          totalVolumeKg: 500,
          totalSets: 4,
          completedSets: 4,
          completedExerciseCount: 2,
          exerciseSummaries: [],
        },
        {
          id: "session-3",
          planName: "Core Day",
          focus: "Core",
          planDayIndex: 2,
          endedAt: previousDay.toISOString(),
          durationSeconds: 900,
          estimatedCalories: 90,
          totalVolumeKg: 120,
          totalSets: 3,
          completedSets: 3,
          completedExerciseCount: 1,
          exerciseSummaries: [],
        },
        {
          id: "run-session-1",
          activityType: "OUTDOOR_RUN",
          focus: "Outdoor run",
          endedAt: todayIso,
          durationSeconds: 1800,
          estimatedCalories: 320,
          distanceMeters: 5000,
          averagePaceSecondsPerKm: 360,
          averageHeartRate: 162,
          gpsQualityScore: 0.91,
          routePolyline: "encoded-history-route",
          route: {
            segments: ["segment-a", "segment-b"],
          },
          exerciseSummaries: [
            {
              exerciseKey: "outdoor-run",
              exerciseName: "Outdoor run",
              distanceMeters: 5000,
              durationSeconds: 1800,
              averagePaceSecondsPerKm: 360,
            },
          ],
        },
      ],
      meta: {
        hasMore: false,
        limit: 10,
        nextCursor: null,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useWorkoutSessionHistorySummary.mockReturnValue({
      summary: {
        totalSessions: 4,
        totalDurationSeconds: 5400,
        totalCalories: 1010,
        totalVolumeKg: 1460,
        totalDistanceMeters: 5000,
        streakDays: 2,
      },
      isLoading: false,
      isError: false,
    });
    useWorkoutPlans.mockReturnValue({
      items: [
        {
          id: "plan-1",
          status: "ACTIVE",
          startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
          createdAt: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
          schedule: [
            { exercises: [{ name: "Squat" }] },
            { exercises: [{ name: "Bench" }] },
            { exercises: [{ name: "Pull" }] },
          ],
          dayProgress: [
            { dayIndex: 0, completed: true },
            { dayIndex: 1, completed: false },
            { dayIndex: 2, completed: false },
          ],
        },
      ],
    });
  });

  it("renders session history cards", () => {
    renderPage();

    expect(screen.getByText("Workout tarixi")).toBeInTheDocument();
    expect(screen.getByText("Legs")).toBeInTheDocument();
    expect(screen.getByText("Leg Power")).toBeInTheDocument();
  });

  it("navigates to the session detail page", () => {
    const router = renderPage();

    fireEvent.click(screen.getByText("Legs"));

    expect(router.state.location.pathname).toBe("/user/workout/history/session-1");
    expect(screen.getByTestId("history-detail-route")).toBeInTheDocument();
  });

  it("routes outdoor runs to the unified history detail page with run metrics", () => {
    const router = renderPage();

    expect(screen.getByText("Outdoor run")).toBeInTheDocument();
    expect(screen.getByText("5.0 km")).toBeInTheDocument();
    expect(screen.getAllByText("00:30:00").length).toBeGreaterThan(0);
    expect(screen.getByText("6:00 /km")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Outdoor run"));

    expect(router.state.location.pathname).toBe("/user/workout/history/run-session-1");
    expect(screen.getByTestId("history-detail-route")).toBeInTheDocument();
  });

  it("renders running rows with map thumbnail, pulse, and route quality", () => {
    renderPage();

    const mapPreview = screen.getByTestId("history-running-map");

    expect(mapPreview).toHaveAttribute("data-polyline", "encoded-history-route");
    expect(mapPreview).toHaveAttribute("data-segment-count", "2");
    expect(mapPreview).toHaveAttribute("data-quality", "0.91");
    expect(screen.getByText("162 bpm")).toBeInTheDocument();
    expect(screen.getAllByText("91/100").length).toBeGreaterThan(0);
  });

  it("filters sessions by selected period and shows streak", () => {
    renderPage();

    expect(screen.getByText("2 kun")).toBeInTheDocument();

    fireEvent.click(screen.getByText("7 kun"));

    expect(screen.queryByText("Chest")).not.toBeInTheDocument();
    expect(screen.getByText("Core")).toBeInTheDocument();
  });

  it("requests server-filtered history and summary when period or type changes", () => {
    renderPage();

    expect(useWorkoutSessionHistory).toHaveBeenLastCalledWith({
      limit: 10,
      period: "all",
      status: "completed",
      type: "all",
    });
    expect(useWorkoutSessionHistorySummary).toHaveBeenLastCalledWith({
      period: "all",
      status: "completed",
      type: "all",
    });

    fireEvent.click(screen.getByRole("button", { name: "Running" }));

    expect(useWorkoutSessionHistory).toHaveBeenLastCalledWith({
      limit: 10,
      period: "all",
      status: "completed",
      type: "running",
    });
    expect(useWorkoutSessionHistorySummary).toHaveBeenLastCalledWith({
      period: "all",
      status: "completed",
      type: "running",
    });
  });

  it("passes date range filters to history and summary queries", () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Boshlanish sanasi"), {
      target: { value: "2026-05-01" },
    });
    fireEvent.change(screen.getByLabelText("Tugash sanasi"), {
      target: { value: "2026-05-20" },
    });

    expect(useWorkoutSessionHistory).toHaveBeenLastCalledWith({
      dateFrom: "2026-05-01",
      dateTo: "2026-05-20",
      limit: 10,
      period: "all",
      status: "completed",
      type: "all",
    });
    expect(useWorkoutSessionHistorySummary).toHaveBeenLastCalledWith({
      dateFrom: "2026-05-01",
      dateTo: "2026-05-20",
      period: "all",
      status: "completed",
      type: "all",
    });
  });

  it("moves through cursor pagination with previous and next controls", () => {
    useWorkoutSessionHistory.mockImplementation((params = {}) => ({
      sessions: [
        {
          id: params.cursor ? "session-page-2" : "session-page-1",
          planName: "Leg Power",
          focus: params.cursor ? "Second page" : "First page",
          endedAt: new Date().toISOString(),
          durationSeconds: 1200,
          estimatedCalories: 180,
          totalVolumeKg: 600,
          totalSets: 4,
          completedSets: 4,
          completedExerciseCount: 2,
          exerciseSummaries: [],
        },
      ],
      meta: params.cursor
        ? { hasMore: false, limit: 10, nextCursor: null }
        : { hasMore: true, limit: 10, nextCursor: "session-page-1" },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }));

    renderPage();

    expect(screen.getByText("First page")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Keyingi" }));

    expect(useWorkoutSessionHistory).toHaveBeenLastCalledWith({
      cursor: "session-page-1",
      limit: 10,
      period: "all",
      status: "completed",
      type: "all",
    });
    expect(screen.getByText("Second page")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Oldingi" }));

    expect(useWorkoutSessionHistory).toHaveBeenLastCalledWith({
      limit: 10,
      period: "all",
      status: "completed",
      type: "all",
    });
  });

  it("exports the currently visible history rows as CSV", () => {
    const createObjectURL = vi.fn(() => "blob:history");
    const revokeObjectURL = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /eksport/i }));

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:history");

    click.mockRestore();
  });

  it("shows missed workouts and monthly summary", () => {
    renderPage();

    expect(screen.getByText("Missed")).toBeInTheDocument();
    expect(screen.getByText("33%")).toBeInTheDocument();
    expect(screen.getByText("Oylik ko‘rinish")).toBeInTheDocument();
  });

  it("shows an empty state when there are no completed sessions", () => {
    useWorkoutSessionHistory.mockReturnValue({
      sessions: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useWorkoutPlans.mockReturnValue({
      items: [],
    });

    renderPage();

    expect(screen.getByText("Hali yakunlangan mashg'ulot yo'q")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /rejalarni ko'rish/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /yangi plan yaratish/i })).toBeInTheDocument();
  });

  it("loads the report alias with the same aggregate session data", () => {
    renderPage("/user/workout/report");

    expect(screen.getByText("Workout tarixi")).toBeInTheDocument();
    expect(screen.getByText("Leg Power")).toBeInTheDocument();
    expect(screen.getByText("Oylik ko‘rinish")).toBeInTheDocument();
  });
});
