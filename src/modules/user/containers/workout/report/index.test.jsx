import React from "react";
import "@/lib/i18n";
import i18n from "@/lib/i18n";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkoutReportPage from "./index.jsx";
import { useWorkoutReport } from "@/hooks/app/use-workout-sessions";

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("@/components/page-loader/index.jsx", () => ({
  default: () => <div data-testid="page-loader">Loading</div>,
}));

vi.mock("@/components/charts/bar-chart.jsx", () => ({
  default: ({ data, dataKey }) => (
    <div data-testid={`bar-chart-${dataKey}`}>{data.length}</div>
  ),
}));

vi.mock("@/components/charts/line-chart.jsx", () => ({
  default: ({ data, dataKey }) => (
    <div data-testid={`line-chart-${dataKey}`}>{data.length}</div>
  ),
}));

vi.mock("@/components/charts/pie-chart.jsx", () => ({
  default: ({ data }) => <div data-testid="pie-chart">{data.length}</div>,
}));

vi.mock("@/hooks/app/use-workout-sessions", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useWorkoutReport: vi.fn(),
  };
});

const report = {
  period: { key: "30d", days: 30 },
  summary: {
    totalSessions: 18,
    totalDurationSeconds: 26640,
    totalCalories: 4523,
    totalDistanceMeters: 42600,
    averagePaceSecondsPerKm: 372,
    totalVolumeKg: 1250,
    streakDays: 12,
  },
  runVsStrength: {
    running: { sessions: 10, durationSeconds: 15120, distanceMeters: 42600 },
    strength: { sessions: 6, durationSeconds: 8880, totalVolumeKg: 1250 },
  },
  typeDistribution: [
    { type: "OUTDOOR_RUN", label: "Бег", sessions: 10, percentage: 56 },
    { type: "STRENGTH", label: "Силовые", sessions: 6, percentage: 33 },
    { type: "FUNCTIONAL", label: "Функциональные", sessions: 2, percentage: 11 },
  ],
  charts: {
    weeklyActivity: [
      { label: "5 май", durationMinutes: 45, distanceKm: 5.6 },
      { label: "12 май", durationMinutes: 52, distanceKm: 8.2 },
    ],
    monthlySessions: [{ label: "Май", sessions: 18 }],
    distancePaceTrend: [
      { label: "5 май", distanceMeters: 5600, averagePaceSecondsPerKm: 345 },
    ],
  },
  goals: {
    completionPercent: 78,
    sessions: { current: 18, target: 23 },
    distanceMeters: { current: 42600, target: 55000 },
    calories: { current: 4523, target: 5500 },
  },
  recovery: {
    loadBalanceLabel: "Оптимальный",
    recommendation:
      "Продолжайте в текущем темпе и не забывайте про восстановление.",
  },
  coachAdvice: {
    title: "AI совет тренера",
    text: "Отличная работа! Вы увеличили дистанцию и улучшили темп.",
  },
  recentWorkouts: [
    {
      id: "run-1",
      focus: "Outdoor run",
      activityType: "OUTDOOR_RUN",
      distanceMeters: 5600,
      durationSeconds: 1921,
      averagePaceSecondsPerKm: 345,
    },
  ],
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/user/workout/report"]}>
      <WorkoutReportPage />
    </MemoryRouter>,
  );

describe("WorkoutReportPage", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("ru");
    useWorkoutReport.mockReturnValue({
      report,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it("renders unified workout analytics with running metrics", () => {
    renderPage();

    expect(screen.getByText("Аналитика тренировок")).toBeInTheDocument();
    expect(
      screen.getByText("Ваш прогресс, тренировки и бег в одном отчете."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("42.6 km").length).toBeGreaterThan(0);
    expect(screen.getByText("6:12 /km")).toBeInTheDocument();
    expect(screen.getByText("Бег vs Силовые")).toBeInTheDocument();
    expect(screen.getByText("AI совет тренера")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart-durationMinutes")).toBeInTheDocument();
    expect(screen.getAllByTestId("pie-chart").length).toBeGreaterThan(0);
  });

  it("does not show a fake comparison trend when the report has no backend trend data", () => {
    renderPage();

    expect(screen.queryByText("+ 20%")).not.toBeInTheDocument();
  });

  it("shows backend-provided comparison trends on metric cards", () => {
    useWorkoutReport.mockReturnValue({
      report: {
        ...report,
        trends: {
          totalSessions: { percentageChange: 50 },
          totalCalories: { percentageChange: -12 },
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText("+50%")).toBeInTheDocument();
    expect(screen.getByText("-12%")).toBeInTheDocument();
  });

  it("renders localized recovery load guidance from structured backend state", () => {
    useWorkoutReport.mockReturnValue({
      report: {
        ...report,
        recovery: {
          loadBalanceKey: "high",
          recommendedRestDays: 2,
          recentSessions: 6,
          highIntensitySessions: 4,
          loadScore: 92,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText("Высокая нагрузка")).toBeInTheDocument();
    expect(screen.getByText("2 дня восстановления")).toBeInTheDocument();
    expect(
      screen.getByText(/запланируйте восстановление/i),
    ).toBeInTheDocument();
  });

  it("localizes report labels even when backend fallback labels are Russian", async () => {
    await i18n.changeLanguage("uz");
    useWorkoutReport.mockReturnValue({
      report: {
        ...report,
        charts: {
          ...report.charts,
          intensityDistribution: [
            { key: "low", label: "Низкая", sessions: 1, percentage: 20 },
            { key: "moderate", label: "Умеренная", sessions: 2, percentage: 40 },
            { key: "high", label: "Высокая", sessions: 2, percentage: 40 },
          ],
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText("Mashg'ulot analitikasi")).toBeInTheDocument();
    expect(screen.getByText("Yugurish vs Kuch")).toBeInTheDocument();
    expect(screen.getByText("Past")).toBeInTheDocument();
    expect(screen.getByText("O'rtacha")).toBeInTheDocument();
    expect(screen.getByText("Yuqori")).toBeInTheDocument();
    expect(screen.getByText("AI trener maslahati")).toBeInTheDocument();
    expect(
      screen.getByText(/Yugurish va kuch mashg'ulotlari/),
    ).toBeInTheDocument();
    expect(screen.queryByText("AI совет тренера")).not.toBeInTheDocument();
  });

  it("exposes chart cards as labelled regions for assistive technology", () => {
    renderPage();

    expect(
      screen.getByRole("region", { name: "Активность по неделям" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Бег vs Силовые" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Выполнение целей" }),
    ).toBeInTheDocument();
  });

  it("requests report data with comparison period controls", () => {
    renderPage();

    expect(useWorkoutReport).toHaveBeenLastCalledWith({
      comparisonPeriod: "previous",
      period: "30d",
    });

    fireEvent.change(screen.getByLabelText("Сравнение"), {
      target: { value: "none" },
    });

    expect(useWorkoutReport).toHaveBeenLastCalledWith({
      comparisonPeriod: "none",
      period: "30d",
    });
  });

  it("exports the current workout report as CSV", () => {
    const createObjectURL = vi.fn(() => "blob:workout-report");
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

    fireEvent.click(screen.getByRole("button", { name: /экспорт/i }));

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:workout-report");

    click.mockRestore();
  });
});
