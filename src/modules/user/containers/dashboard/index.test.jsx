import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
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

const actionMocks = vi.hoisted(() => ({
  setSteps: vi.fn(),
  setSleep: vi.fn(),
  setGoal: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/hooks/app/use-daily-tracking", () => ({
  useDailyTrackingActions: () => ({
    setSteps: actionMocks.setSteps,
    setSleep: actionMocks.setSleep,
  }),
}));

vi.mock("@/hooks/app/use-health-goals", () => ({
  default: () => ({
    goals: { steps: 10000, sleepHours: 8 },
    setGoal: actionMocks.setGoal,
    isSaving: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args) => actionMocks.toastSuccess(...args),
    error: (...args) => actionMocks.toastError(...args),
  },
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
    dayData: { meals: {}, steps: 6400, sleepHours: 7.25 },
    goalsState: { goals: { calories: 2000, steps: 10000, sleepHours: 8 } },
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
    <MemoryRouter initialEntries={["/user/dashboard"]}>
      <UserLayoutDateProvider
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      >
        <DashboardContainer />
      </UserLayoutDateProvider>
    </MemoryRouter>
  );
};

const renderDashboard = () =>
  render(
    <MemoryRouter initialEntries={["/user/dashboard"]}>
      <DashboardContainer />
    </MemoryRouter>,
  );

describe("DashboardContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders every dashboard card as a single-column row", () => {
    renderDashboard();

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
    expect(
      within(cardList).getByTestId("activity-summary-row"),
    ).toBeInTheDocument();
    expect(
      within(cardList).getByTestId("steps-summary-card"),
    ).toBeInTheDocument();
    expect(
      within(cardList).getByTestId("sleep-summary-card"),
    ).toBeInTheDocument();
    expect(within(cardList).queryByTestId("meals-widget")).not.toBeInTheDocument();
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

  it("places compact step and sleep cards after the calorie widget", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 18, 12));
    renderDashboard();

    const cardList = screen.getByTestId("dashboard-card-list");
    const rows = Array.from(cardList.children);
    const activityRow = screen.getByTestId("activity-summary-row");

    expect(rows[0]).toContainElement(screen.getByTestId("calorie-widget"));
    expect(rows[1]).toBe(activityRow);
    expect(activityRow).toHaveClass("grid", "grid-cols-2", "gap-3");

    const stepsCard = screen.getByTestId("steps-summary-card");
    const sleepCard = screen.getByTestId("sleep-summary-card");
    const stepsEntryButton = within(stepsCard).getByRole("button", {
      name: "Qadamlar kiritish",
    });
    const sleepEntryButton = within(sleepCard).getByRole("button", {
      name: "Uyqu kiritish",
    });

    expect(within(stepsCard).getByRole("link", { name: /Qadamlar detail/i })).toHaveAttribute("href", "/user/steps?date=2026-06-18");
    expect(within(sleepCard).getByRole("link", { name: /Uyqu detail/i })).toHaveAttribute("href", "/user/sleep?date=2026-06-18");
    expect(stepsEntryButton).toHaveClass("size-10", "rounded-full");
    expect(stepsEntryButton).toHaveTextContent("");
    expect(sleepEntryButton).toHaveClass("size-10", "rounded-full");
    expect(sleepEntryButton).toHaveTextContent("");
    expect(screen.getByTestId("steps-progress-ring")).toHaveClass(
      "absolute",
      "bottom-3",
      "right-3",
    );
    expect(screen.getByTestId("sleep-progress-ring")).toHaveClass(
      "absolute",
      "bottom-3",
      "right-3",
    );
    expect(stepsCard).not.toHaveTextContent("Kiritish");
    expect(sleepCard).not.toHaveTextContent("Kiritish");
    expect(stepsCard).toHaveTextContent("Qadamlar");
    expect(stepsCard).toHaveTextContent("6,400");
    expect(stepsCard).toHaveTextContent("10,000 goal");
    expect(sleepCard).toHaveTextContent("Uyqu");
    expect(sleepCard).toHaveTextContent("7 soat 15 daq");
    expect(sleepCard).toHaveTextContent("8 soat goal");
  });

  it("opens a compact dashboard drawer and saves steps for the selected date", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 18, 12));
    renderDashboard();
    vi.useRealTimers();

    fireEvent.click(
      within(screen.getByTestId("steps-summary-card")).getByRole("button", {
        name: "Qadamlar kiritish",
      }),
    );

    expect(screen.getByText("Maqsad: 10,000 qadam")).toBeInTheDocument();
    expect(screen.queryByLabelText("Kunlik qadam maqsadi")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Sana")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Bugungi qadamlar"), {
      target: { value: "9200" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));

    await waitFor(() => {
      expect(actionMocks.setSteps).toHaveBeenCalledWith("2026-06-18", 9200);
      expect(actionMocks.setGoal).not.toHaveBeenCalled();
    });
  });

  it("opens a compact dashboard drawer and saves sleep without goal/date fields", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 18, 12));
    renderDashboard();
    vi.useRealTimers();

    fireEvent.click(
      within(screen.getByTestId("sleep-summary-card")).getByRole("button", {
        name: "Uyqu kiritish",
      }),
    );

    expect(screen.getByText("Maqsad: 8 soat")).toBeInTheDocument();
    expect(screen.queryByLabelText("Uyqu maqsadi")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Sana")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Bugungi uyqu"), {
      target: { value: "8" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));

    await waitFor(() => {
      expect(actionMocks.setSleep).toHaveBeenCalledWith("2026-06-18", 8);
      expect(actionMocks.setGoal).not.toHaveBeenCalled();
    });
  });

  it("leaves profile and date controls to the shared user layout", () => {
    renderDashboard();

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
    expect(fridayButton).toHaveClass(
      "min-h-12",
      "min-w-[42px]",
      "gap-0.5",
      "rounded-xl",
      "py-1.5",
      "shadow-none",
    );
    expect(fridayButton).toHaveAttribute("aria-pressed", "true");
    expect(fridayButton).toHaveClass("bg-primary", "text-primary-foreground");
    expect(fridayButton).not.toHaveClass("border", "border-primary");
    expect(thursdayButton).not.toHaveClass("border", "border-border/50");

    const selectedDateChip = within(fridayButton).getByText("24");
    expect(selectedDateChip).toHaveClass(
      "grid",
      "shrink-0",
      "size-8",
      "rounded-full",
      "bg-card",
      "text-primary",
      "text-sm",
      "font-semibold",
    );

    const idleDateChip = within(thursdayButton).getByText("23");
    expect(idleDateChip).toHaveClass("bg-muted/60", "text-muted-foreground");

    fireEvent.click(thursdayButton);

    expect(thursdayButton).toHaveAttribute("aria-pressed", "true");
    expect(fridayButton).toHaveAttribute("aria-pressed", "false");
  });
});
