import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DashboardContainer from "./index.jsx";

const mocks = vi.hoisted(() => ({
  calendarBottomDrawer: vi.fn(),
  openProfile: vi.fn(),
}));

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

vi.mock("@/components/calendar-bottom-drawer.jsx", () => ({
  default: (props) => {
    mocks.calendarBottomDrawer(props);

    return props.open ? <div data-testid="calendar-bottom-drawer" /> : null;
  },
}));

vi.mock("@/components/notification-center", () => ({
  default: () => (
    <button type="button" data-testid="notification-center">
      Notifications
    </button>
  ),
}));

vi.mock("@/modules/profile/hooks/use-profile-overlay", () => ({
  PROFILE_OVERVIEW_TAB: "overview",
  useProfileOverlay: () => ({
    openProfile: mocks.openProfile,
  }),
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

describe("DashboardContainer", () => {
  beforeEach(() => {
    mocks.calendarBottomDrawer.mockClear();
    mocks.openProfile.mockClear();
  });

  it("keeps the top card row at the target desktop height", () => {
    render(<DashboardContainer />);

    expect(screen.getByTestId("dashboard-top-card-row")).toHaveClass(
      "lg:h-[400px]",
    );
  });

  it("shows a mobile profile greeting before notification and calendar actions", () => {
    render(<DashboardContainer />);

    const topBar = screen.getByTestId("dashboard-mobile-top-bar");
    const profileButton = screen.getByRole("button", {
      name: /Profilni ochish/i,
    });
    const notificationButton = within(topBar).getByTestId(
      "notification-center",
    );
    const calendarButton = within(topBar).getByRole("button", {
      name: /Sana tanlash/i,
    });

    expect(topBar).toHaveClass("md:hidden");
    expect(screen.getByTestId("dashboard-mobile-greeting-line")).toHaveTextContent(
      "Salom Fazliddin Liveon",
    );
    const streakRow = screen.getByTestId("dashboard-mobile-streak");
    expect(streakRow).toHaveTextContent("7 kun");
    expect(streakRow.querySelector(".lucide-flame")).toBeInTheDocument();
    expect(
      profileButton.compareDocumentPosition(notificationButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      notificationButton.compareDocumentPosition(calendarButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    fireEvent.click(profileButton);

    expect(mocks.openProfile).toHaveBeenCalledWith("overview");
  });

  it("opens the calendar bottom drawer from the dashboard date button", () => {
    render(<DashboardContainer />);

    const dateButton = within(
      screen.getByTestId("dashboard-mobile-top-bar"),
    ).getByRole("button", { name: /Sana tanlash/i });

    expect(dateButton).toHaveTextContent("");
    expect(
      screen.queryByTestId("calendar-bottom-drawer"),
    ).not.toBeInTheDocument();

    fireEvent.click(dateButton);

    expect(screen.getByTestId("calendar-bottom-drawer")).toBeInTheDocument();
    expect(mocks.calendarBottomDrawer.mock.calls.at(-1)[0]).toEqual(
      expect.objectContaining({ open: true }),
    );
  });
});
