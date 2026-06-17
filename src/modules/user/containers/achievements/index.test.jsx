import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AchievementsPage from "./index.jsx";

const useGetQueryMock = vi.fn();
const setBreadcrumbsMock = vi.fn();

const achievements = [
  {
    id: 1,
    key: "meal_1",
    category: "NUTRITION",
    metric: "MEAL_LOG",
    name: "Meal 1",
    description: "Log one meal",
    imageUrl: "/madagascar/meal.png",
    threshold: 1,
    progress: 1,
    xpReward: 10,
    unlocked: true,
    unlockedAt: "2026-05-01T00:00:00.000Z",
  },
  {
    id: 2,
    key: "streak_7",
    category: "STREAK",
    metric: "STREAK_DAY",
    name: "Streak 7",
    description: "Keep a 7 day streak",
    imageUrl: "/madagascar/streak.png",
    threshold: 7,
    progress: 2,
    xpReward: 60,
    unlocked: false,
    unlockedAt: null,
  },
  {
    id: 3,
    key: "xp_2500",
    category: "GENERAL",
    metric: "XP_TOTAL",
    name: "XP 2500",
    description: "Earn 2500 XP",
    imageUrl: "/madagascar/xp.png",
    threshold: 2500,
    progress: 1250,
    xpReward: 100,
    unlocked: false,
    unlockedAt: null,
  },
];

const summary = {
  rings: {
    achievements: { unlocked: 1, total: 3, percent: 33 },
    xp: { xp: 1250, level: 4, levelProgress: 30 },
    streak: {
      currentStreak: 2,
      longestStreak: 5,
      trackedDays: 12,
      nextMilestone: 7,
      percent: 29,
    },
  },
  nextAwards: [achievements[2], achievements[1]],
};

const categories = [
  { category: "NUTRITION", count: 1 },
  { category: "STREAK", count: 1 },
  { category: "GENERAL", count: 1 },
];

const xpHistory = [
  {
    id: "xp-1",
    type: "MEAL_LOG",
    amount: 10,
    balance: 1250,
    note: "Ovqat qayd qilindi",
    createdAt: "2026-05-24T08:10:00.000Z",
  },
];

vi.mock("@/hooks/api", () => ({
  useGetQuery: (options) => useGetQueryMock(options),
}));

vi.mock("@/store", () => ({
  useAppModeStore: (selector) => selector({ mode: "madagascar" }),
  useBreadcrumbStore: () => ({ setBreadcrumbs: setBreadcrumbsMock }),
}));

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

const renderPage = () => render(<AchievementsPage />);

describe("AchievementsPage", () => {
  beforeEach(() => {
    setBreadcrumbsMock.mockReset();
    useGetQueryMock.mockReset();
    useGetQueryMock.mockImplementation(({ url }) => {
      if (url === "/user/gamification/achievements/summary") {
        return { data: { data: summary }, isLoading: false };
      }

      if (url === "/user/gamification/achievements/categories") {
        return { data: { data: categories }, isLoading: false };
      }

      if (url === "/user/gamification/achievements/1") {
        return {
          data: {
            data: {
              ...achievements[0],
              name: "Meal 1 detail",
              totalUnlockedByUsers: 44,
            },
          },
          isLoading: false,
          isFetching: false,
        };
      }

      if (url === "/user/gamification/xp/history") {
        return {
          data: { data: { items: xpHistory, total: 1 } },
          isLoading: false,
          isFetching: false,
        };
      }

      return { data: { data: achievements }, isLoading: false };
    });
  });

  it("renders Apple Fitness style rings and next awards from the summary API", async () => {
    renderPage();

    expect(
      await screen.findByLabelText("Achievements ring 33%"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("XP ring Level 4")).toBeInTheDocument();
    expect(screen.getByLabelText("Streak ring 2 kun")).toBeInTheDocument();
    expect(screen.getByText("Keyingi yutuqlar")).toBeInTheDocument();
    expect(screen.getByText("XP 2500")).toBeInTheDocument();
    expect(useGetQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/user/gamification/achievements/summary",
        params: { mode: "madagascar" },
      }),
    );
  });

  it("opens achievement detail from the detail endpoint", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /Meal 1/i }));

    await waitFor(() => {
      expect(useGetQueryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/user/gamification/achievements/1",
          params: { mode: "madagascar" },
          queryProps: expect.objectContaining({ enabled: true }),
        }),
      );
    });
    expect(await screen.findByText("Meal 1 detail")).toBeInTheDocument();
    expect(screen.getByText("44 ta user ochgan")).toBeInTheDocument();
  });

  it("renders XP history inside the achievements page scroll panel", async () => {
    renderPage();

    const historyPanel = await screen.findByTestId(
      "achievements-xp-history-scroll",
    );

    expect(within(historyPanel).getByText("Ovqat qayd qilindi")).toBeInTheDocument();
    expect(within(historyPanel).getByText("+10 XP")).toBeInTheDocument();
  });
});
