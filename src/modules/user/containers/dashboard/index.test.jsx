import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DashboardContainer from "./index.jsx";

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  useTranslation: () => ({ t: (key) => key }),
}));

vi.mock("@/store", () => ({
  useBreadcrumbStore: () => ({ setBreadcrumbs: vi.fn() }),
}));

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("@/components/stripped-calendar", () => ({
  default: () => <div data-testid="calendar" />,
}));

vi.mock("./use-dashboard-data.js", () => ({
  default: () => ({
    user: null,
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

vi.mock("./connected-coach-banner.jsx", () => ({
  default: () => null,
}));

vi.mock("./coach-invitations-section.jsx", () => ({
  default: () => null,
}));

vi.mock("./coach-activity-section.jsx", () => ({
  default: () => null,
}));

vi.mock("@/modules/user/containers/dashboard/challenge-invitations-section.jsx", () => ({
  default: () => null,
}));

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
  it("keeps the top card row at the target desktop height", () => {
    render(<DashboardContainer />);

    expect(screen.getByTestId("dashboard-top-card-row"))
      .toHaveClass("lg:h-[400px]");
  });
});
