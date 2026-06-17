import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DashboardContainer from "./index.jsx";
import { UserLayoutDateProvider } from "@/modules/user/layout/user-layout-date-context.jsx";

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  useTranslation: () => ({
    t: (key, options = {}) =>
      ({
        "user.dashboard.mobileGreeting": "Salom",
        "user.dashboard.mobileStreakDays": `${options.count} kun`,
      })[key] ?? key,
  }),
}));

vi.mock("@/store", () => ({
  useBreadcrumbStore: () => ({ setBreadcrumbs: vi.fn() }),
}));

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("./use-dashboard-data.js", () => ({
  default: () => ({
    user: {
      firstName: "Fazliddin",
      lastName: "Liveon",
      username: "fazliddin",
      avatar: "",
      currentStreak: 7,
    },
    dayData: { meals: {} },
    goalsState: { goals: { calories: 2000 } },
    measurementSnapshot: null,
    activeMealPlan: null,
    activeWorkoutPlan: null,
    friends: [],
    challenges: [],
    currentChallenge: null,
    isCoreLoading: false,
    hasCoreError: false,
    hasSupportingError: false,
    refetchDashboard: vi.fn(),
  }),
}));

vi.mock(
  "@/modules/user/containers/dashboard/challenge-invitations-section.jsx",
  () => ({
    default: () => null,
  }),
);

vi.mock("./calorie-gauge-widget.jsx", () => ({
  default: () => <div data-testid="calorie-widget" />,
}));

vi.mock("./meals-widget.jsx", () => ({
  default: () => <div data-testid="meals-widget" />,
}));

vi.mock("./water-widget.jsx", () => ({
  default: () => <div data-testid="water-widget" />,
}));

vi.mock("./mood-widget.jsx", () => ({
  default: () => <div data-testid="mood-widget" />,
}));

vi.mock("./bmi-widget.jsx", () => ({
  default: () => <div data-testid="bmi-widget" />,
}));

vi.mock("./weight-widget.jsx", () => ({
  default: () => <div data-testid="weight-widget" />,
}));

vi.mock("./workout-widget.jsx", () => ({
  default: () => <div data-testid="workout-widget" />,
}));

vi.mock("@/modules/user/containers/dashboard/achievements-widget.jsx", () => ({
  default: () => <div data-testid="achievements-widget" />,
}));

vi.mock("@/modules/user/containers/dashboard/challenge-widget.jsx", () => ({
  default: () => <div data-testid="challenge-widget" />,
}));

vi.mock("@/modules/user/containers/dashboard/friend-activity-feed.jsx", () => ({
  default: () => <div data-testid="friend-activity-widget" />,
}));

vi.mock("./mood-reminder-drawer.jsx", () => ({ default: () => null }));
vi.mock("./streak-reminder-drawer.jsx", () => ({ default: () => null }));
vi.mock("./streak-restore-drawer.jsx", () => ({ default: () => null }));
vi.mock("./water-reminder-drawer.jsx", () => ({ default: () => null }));
vi.mock("./daily-review-drawer.jsx", () => ({ default: () => null }));
vi.mock("./ten-day-popup-drawer.jsx", () => ({ default: () => null }));
vi.mock("./challenge-reminder-drawer.jsx", () => ({ default: () => null }));
vi.mock("./challenge-completion-drawer.jsx", () => ({ default: () => null }));

const DashboardWithDate = ({ initialDate }) => {
  const [selectedDate, setSelectedDate] = React.useState(initialDate);

  return (
    <UserLayoutDateProvider
      selectedDate={selectedDate}
      setSelectedDate={setSelectedDate}
    >
      <DashboardContainer />
    </UserLayoutDateProvider>
  );
};

describe("DashboardContainer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders every dashboard card as a single-column row", () => {
    render(<DashboardContainer />);

    const cardList = screen.getByTestId("dashboard-card-list");
    const className = cardList.getAttribute("class") ?? "";
    const cardRows = Array.from(cardList.children);

    expect(cardList).toHaveClass("grid", "grid-cols-1", "gap-4");
    expect(className).not.toMatch(/\b(md|lg|xl):grid-cols-/);
    expect(className).not.toContain("lg:h-[400px]");
    expect(cardRows).toHaveLength(9);
    expect(
      cardRows.every((row) => {
        const rowClassName = row.getAttribute("class") ?? "";

        return !/\b(md|lg|xl):col-span-/.test(rowClassName);
      }),
    ).toBe(true);

    expect(within(cardList).getByTestId("calorie-widget")).toBeInTheDocument();
    expect(within(cardList).getByTestId("meals-widget")).toBeInTheDocument();
    expect(within(cardList).getByTestId("water-widget")).toBeInTheDocument();
    expect(within(cardList).getByTestId("mood-widget")).toBeInTheDocument();
    expect(within(cardList).getByTestId("bmi-widget")).toBeInTheDocument();
    expect(within(cardList).getByTestId("weight-widget")).toBeInTheDocument();
    expect(within(cardList).getByTestId("workout-widget")).toBeInTheDocument();
    expect(
      within(cardList).getByTestId("achievements-widget"),
    ).toBeInTheDocument();
    expect(
      within(cardList).getByTestId("friend-activity-widget"),
    ).toBeInTheDocument();
  });

  it("leaves profile and date controls to the shared user layout", () => {
    render(<DashboardContainer />);

    expect(
      screen.queryByTestId("dashboard-mobile-top-bar"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("calendar-bottom-drawer"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Sana tanlash/i }),
    ).not.toBeInTheDocument();
  });

  it("renders a compact scrollable date picker with past days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2022, 5, 24, 12));
    render(<DashboardWithDate initialDate={new Date(2022, 5, 24)} />);

    const picker = screen.getByTestId("dashboard-week-date-picker");
    const pastButton = within(picker).getByRole("button", {
      name: "Thu 26",
    });
    const fridayButton = within(picker).getByRole("button", {
      name: "Fri 24",
    });
    const thursdayButton = within(picker).getByRole("button", {
      name: "Thu 23",
    });

    expect(picker).toHaveClass("overflow-x-auto");
    expect(pastButton).toHaveAttribute("aria-pressed", "false");
    expect(fridayButton).toHaveClass("h-[48px]", "w-10");
    expect(fridayButton).toHaveAttribute("aria-pressed", "true");
    expect(fridayButton).toHaveClass("bg-primary", "text-primary-foreground");

    fireEvent.click(thursdayButton);

    expect(thursdayButton).toHaveAttribute("aria-pressed", "true");
    expect(fridayButton).toHaveAttribute("aria-pressed", "false");
  });
});
