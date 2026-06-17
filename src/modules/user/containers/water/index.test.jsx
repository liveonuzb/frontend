import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WaterPage from "./index.jsx";
import useHealthGoals from "@/hooks/app/use-health-goals";
import {
  useDailyTrackingActions,
  useDailyTrackingDay,
} from "@/hooks/app/use-daily-tracking";
import { useGetQuery } from "@/hooks/api";

const mocks = vi.hoisted(() => ({
  calendarBottomDrawer: vi.fn(),
}));

vi.mock("@/store", () => ({
  useBreadcrumbStore: () => ({ setBreadcrumbs: vi.fn() }),
}));

vi.mock("@/hooks/app/use-health-goals", () => ({
  default: vi.fn(),
}));

vi.mock("@/hooks/app/use-daily-tracking", () => ({
  useDailyTrackingActions: vi.fn(),
  useDailyTrackingDay: vi.fn(),
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: vi.fn(),
}));

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("@/components/animated-water-widget", () => ({
  default: ({ currentMl, maxMl, onAdd }) => (
    <section data-testid="animated-water-widget">
      <span>
        {currentMl} / {maxMl} ml
      </span>
      <button type="button" onClick={onAdd}>
        Widget add
      </button>
    </section>
  ),
}));

vi.mock("@/components/calendar-bottom-drawer.jsx", () => ({
  default: (props) => {
    mocks.calendarBottomDrawer(props);

    return props.open ? <div data-testid="calendar-bottom-drawer" /> : null;
  },
}));

vi.mock("./water-settings-drawer", () => ({
  default: () => <button type="button">Sozlamalar</button>,
}));

vi.mock("./water-analytics-section", () => ({
  default: () => <section data-testid="water-analytics-section" />,
}));

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/telegram-haptics", () => ({
  triggerTelegramHapticFeedback: vi.fn(),
}));

describe("WaterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T10:00:00.000Z"));
    vi.mocked(useHealthGoals).mockReturnValue({
      goals: {
        waterMl: 2500,
        cupSize: 250,
      },
    });
    vi.mocked(useDailyTrackingActions).mockReturnValue({
      addWaterCup: vi.fn(),
      removeLastWaterCup: vi.fn(),
      removeWaterLogEntry: vi.fn(),
      setWaterCups: vi.fn(),
    });
    vi.mocked(useDailyTrackingDay).mockReturnValue({
      dayData: {
        mood: null,
        waterLog: [
          { id: "water-1", amountMl: 250, time: "2026-06-02T08:00:00.000Z" },
          { id: "water-2", amountMl: 500, time: "2026-06-02T10:00:00.000Z" },
        ],
      },
      isLoading: false,
      isFetching: false,
      isError: false,
    });
    vi.mocked(useGetQuery).mockReturnValue({
      data: {
        data: {
          data: {
            mainInsight: "Bugun suv ritmingiz yaxshi.",
            nextAction: {
              label: "Keyingi stakan",
            },
            isPremium: true,
            premiumInsights: [],
          },
        },
      },
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("removes the old water header and summary/log/activity sections", () => {
    render(<WaterPage />);

    expect(
      screen.queryByText("Kunlik suv iste'molingiz"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Kunlik xulosa")).not.toBeInTheDocument();
    expect(screen.queryByText("Bugungi qaydlar")).not.toBeInTheDocument();
    expect(screen.queryByText("Aktiv kun holati")).not.toBeInTheDocument();
    expect(screen.getByTestId("animated-water-widget")).toHaveTextContent(
      "750 / 2500 ml",
    );
  });

  it("opens the bottom calendar drawer from the inline date chip", () => {
    render(<WaterPage />);

    const dateButton = screen.getByRole("button", { name: /Sana tanlash/i });

    expect(dateButton).toHaveTextContent("2-iyun");
    expect(
      screen.queryByTestId("calendar-bottom-drawer"),
    ).not.toBeInTheDocument();

    fireEvent.click(dateButton);

    expect(screen.getByTestId("calendar-bottom-drawer")).toBeInTheDocument();
    expect(mocks.calendarBottomDrawer.mock.calls.at(-1)[0]).toEqual(
      expect.objectContaining({ open: true }),
    );
  });

  it("renders water stats in one compact row", () => {
    render(<WaterPage />);

    const statsRow = screen.getByTestId("water-stats-row");
    const statCards = screen.getAllByTestId("water-stat-card");

    expect(statsRow).toHaveClass("grid-cols-3", "gap-2");
    expect(statsRow).not.toHaveClass("sm:grid-cols-3");
    expect(statCards).toHaveLength(3);

    for (const card of statCards) {
      expect(card).toHaveClass("rounded-2xl");
      expect(card.firstElementChild).toHaveClass("p-2.5");
    }
  });

  it("loads AI Hydration from the live backend insight endpoint", () => {
    render(<WaterPage />);

    expect(useGetQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/user/nutrition/tracking/water/insight",
        params: expect.objectContaining({
          date: "2026-06-02",
          days: 7,
        }),
      }),
    );
    expect(screen.getByText("AI Hydration")).toBeInTheDocument();
    expect(screen.getByText("Bugun suv ritmingiz yaxshi.")).toBeInTheDocument();
  });
});
