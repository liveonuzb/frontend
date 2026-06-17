import React from "react";
import { readFileSync } from "node:fs";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Layout from "./index.jsx";

const indexCss = readFileSync("src/index.css", { encoding: "utf8" });

const mocks = vi.hoisted(() => ({
  authState: {
    user: {
      firstName: "Fazliddin",
      lastName: "Liveon",
      avatar: "",
      currentStreak: 7,
      settings: { sidebarState: "expanded" },
    },
  },
  calendarBottomDrawer: vi.fn(),
  openProfile: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  useTranslation: () => ({
    t: (key, options = {}) => {
      if (key === "user.dashboard.mobileGreeting") {
        return "Salom";
      }

      if (key === "user.dashboard.mobileStreakDays") {
        return `${options.count} kun`;
      }

      return typeof options === "string" ? options : key;
    },
  }),
}));

vi.mock("@/hooks/utils/use-mobile", () => ({
  default: () => false,
}));

vi.mock("@/store", () => ({
  useAddMealOverlayStore: (selector) =>
    selector({ isActionDrawerOpen: false }),
  useAuthStore: (selector) =>
    selector ? selector(mocks.authState) : mocks.authState,
}));

vi.mock("@/components/role-switcher", () => ({
  default: () => <div data-testid="role-switcher" />,
}));

vi.mock("@/components/notification-center", () => ({
  default: () => (
    <button type="button" data-testid="notification-center">
      Notifications
    </button>
  ),
}));

vi.mock("@/components/calendar-bottom-drawer.jsx", () => ({
  default: (props) => {
    mocks.calendarBottomDrawer(props);

    return props.open ? <div data-testid="calendar-bottom-drawer" /> : null;
  },
}));

vi.mock("@/components/keyboard-shortcuts", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("./mobile-nav.jsx", () => ({
  default: () => <div data-testid="mobile-nav" />,
}));

vi.mock("./mobile-sidebar-edge-swipe.jsx", () => ({
  default: ({ enabled }) => (
    <div data-testid="mobile-sidebar-edge-swipe" data-enabled={String(enabled)} />
  ),
}));

vi.mock("@/components/pull-to-refresh", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("@/components/layout-header.jsx", () => ({
  default: ({ className }) => (
    <header data-testid="layout-header" className={className} />
  ),
}));

vi.mock("@/hooks/app/use-mobile-chrome-hidden", () => ({
  useMobileChromeHidden: () => false,
}));

vi.mock("./profile-drawer.jsx", () => ({ default: () => null }));
vi.mock("./premium-reminder-drawer.jsx", () => ({ default: () => null }));
vi.mock("./premium-gift-received-drawer.jsx", () => ({ default: () => null }));
vi.mock("./reward-reminder-drawer.jsx", () => ({ default: () => null }));
vi.mock("./add-meal-overlay.jsx", () => ({ default: () => null }));

vi.mock("@/hooks/app/use-realtime-notifications", () => ({
  default: () => undefined,
}));

vi.mock("@/modules/profile/hooks/use-profile-overlay", () => ({
  PROFILE_OVERVIEW_TAB: "overview",
  useProfileOverlay: () => ({ openProfile: mocks.openProfile }),
}));

vi.mock("@/modules/profile/lib/profile-tab-navigation", () => ({
  getStandaloneProfileTabPath: () => null,
}));

vi.mock("@/components/nav-user/index.jsx", () => ({
  default: () => <div data-testid="nav-user" />,
}));

vi.mock("./user-nav-items.js", () => ({
  getUserTrackingNavItems: () => [],
}));

const renderLayout = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/user/dashboard" element={<div>dashboard</div>} />
          <Route path="/user/nutrition/overview" element={<div>nutrition</div>} />
          <Route path="/user/workout/overview" element={<div>workout</div>} />
          <Route path="/user/chat/*" element={<div>chat</div>} />
          <Route
            path="/user/workout/plans/:planId/days/:dayIndex/session"
            element={<div>workout session</div>}
          />
          <Route
            path="/user/workout/running/live/:id"
            element={<div>running live</div>}
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe("User layout shell", () => {
  beforeEach(() => {
    mocks.calendarBottomDrawer.mockClear();
    mocks.openProfile.mockClear();
  });

  it("renders dashboard inside a centered phone shell without desktop chrome", () => {
    const { container } = renderLayout("/user/dashboard");

    const content = screen.getByTestId("user-layout-content");
    const mobileNav = screen.getByTestId("mobile-nav");
    const sidebarInset = container.querySelector('[data-slot="sidebar-inset"]');

    expect(screen.queryByTestId("layout-header")).not.toBeInTheDocument();
    expect(screen.queryByTestId("role-switcher")).not.toBeInTheDocument();
    expect(sidebarInset).toHaveClass("user-phone-shell");
    expect(content).toHaveClass("mx-auto", "w-full", "max-w-md");
    expect(content).not.toHaveClass("md:p-6", "md:pb-3");
    expect(screen.getByTestId("user-layout-top-bar")).toBeInTheDocument();
    expect(mobileNav).toBeInTheDocument();
    expect(mobileNav.parentElement).not.toHaveClass("md:hidden");
  });

  it("shows the shared profile greeting without dashboard calendar action", () => {
    renderLayout("/user/dashboard");

    const topBar = screen.getByTestId("user-layout-top-bar");
    const profileButton = screen.getByRole("button", {
      name: /Profilni ochish: Fazliddin Liveon/i,
    });
    const notificationButton = within(topBar).getByTestId(
      "notification-center",
    );

    expect(topBar).not.toHaveClass("md:hidden");
    expect(screen.getByTestId("user-layout-greeting-line")).toHaveTextContent(
      "Salom Fazliddin Liveon",
    );
    expect(screen.getByTestId("user-layout-streak")).toHaveTextContent("7 kun");
    expect(
      profileButton.compareDocumentPosition(notificationButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    fireEvent.click(profileButton);

    expect(mocks.openProfile).toHaveBeenCalledWith("overview");
    expect(
      within(topBar).queryByRole("button", { name: /Sana tanlash/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("calendar-bottom-drawer"),
    ).not.toBeInTheDocument();
  });

  it("keeps the shared calendar drawer available outside dashboard", () => {
    renderLayout("/user/nutrition/overview");

    const topBar = screen.getByTestId("user-layout-top-bar");
    const calendarButton = within(topBar).getByRole("button", {
      name: /Sana tanlash/i,
    });

    expect(
      screen.queryByTestId("calendar-bottom-drawer"),
    ).not.toBeInTheDocument();

    fireEvent.click(calendarButton);

    expect(screen.getByTestId("calendar-bottom-drawer")).toBeInTheDocument();
    expect(mocks.calendarBottomDrawer.mock.calls.at(-1)[0]).toEqual(
      expect.objectContaining({ open: true }),
    );
  });

  it("keeps feature pages in the same phone shell and mobile nav", () => {
    const { unmount } = renderLayout("/user/nutrition/overview");

    expect(screen.queryByTestId("layout-header")).not.toBeInTheDocument();
    expect(screen.getByTestId("user-layout-content")).toHaveClass(
      "mx-auto",
      "w-full",
      "max-w-md",
      "p-3",
    );
    expect(screen.getByTestId("user-layout-top-bar")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-nav").parentElement).not.toHaveClass(
      "md:hidden",
    );
    expect(screen.getByTestId("mobile-sidebar-edge-swipe")).toHaveAttribute(
      "data-enabled",
      "true",
    );

    unmount();

    renderLayout("/user/workout/overview");

    expect(screen.queryByTestId("layout-header")).not.toBeInTheDocument();
    expect(screen.getByTestId("user-layout-content")).toHaveClass(
      "mx-auto",
      "w-full",
      "max-w-md",
      "p-3",
    );
    expect(screen.getByTestId("user-layout-content")).not.toHaveClass(
      "md:pb-3",
    );
    expect(screen.getByTestId("user-layout-top-bar")).toBeInTheDocument();
  });

  it("keeps running live full-bleed inside the phone shell", () => {
    const { container } = renderLayout("/user/workout/running/live/run-1");
    const sidebarInset = container.querySelector('[data-slot="sidebar-inset"]');

    expect(screen.queryByTestId("layout-header")).not.toBeInTheDocument();
    expect(screen.queryByTestId("user-layout-top-bar")).not.toBeInTheDocument();
    expect(screen.getByTestId("mobile-sidebar-edge-swipe")).toHaveAttribute(
      "data-enabled",
      "false",
    );
    expect(screen.getByTestId("user-layout-content")).toHaveClass(
      "mx-auto",
      "w-full",
      "max-w-md",
    );
    expect(screen.getByTestId("user-layout-content")).toHaveClass("p-0");
    expect(screen.getByTestId("user-layout-content")).not.toHaveClass("p-3");
    expect(sidebarInset).toHaveClass("bg-white");
  });

  it("hides the shared top bar while a workout session is active", () => {
    renderLayout("/user/workout/plans/plan-1/days/0/session");

    expect(screen.queryByTestId("user-layout-top-bar")).not.toBeInTheDocument();
    expect(screen.getByText("workout session")).toBeInTheDocument();
  });

  it("hides layout chrome on chat routes", () => {
    renderLayout("/user/chat");

    expect(screen.queryByTestId("user-layout-top-bar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mobile-nav")).not.toBeInTheDocument();
    expect(screen.getByTestId("user-layout-content")).toHaveClass("p-0");
    expect(screen.getByTestId("user-layout-content")).not.toHaveClass("p-3");
    expect(screen.getByText("chat")).toBeInTheDocument();
  });

  it("defines phone shell overrides for responsive desktop card layouts", () => {
    expect(indexCss).toContain('.user-phone-shell [class*="sm:grid-cols-"]');
    expect(indexCss).toContain('.user-phone-shell [class*="md:grid-cols-"]');
    expect(indexCss).toContain('.user-phone-shell [class*="lg:grid-cols-"]');
    expect(indexCss).toContain('.user-phone-shell [class*="xl:grid-cols-"]');
    expect(indexCss).toContain('.user-phone-shell [class*="sm:col-span-"]');
    expect(indexCss).toContain('.user-phone-shell [class*="md:col-span-"]');
    expect(indexCss).toContain('.user-phone-shell [class*="lg:col-span-"]');
    expect(indexCss).toContain('.user-phone-shell [class*="xl:col-span-"]');
    expect(indexCss).toContain('.user-phone-shell [class*="md:flex-row"]');
  });

  it("applies the dashboard card surface rhythm across user routes", () => {
    renderLayout("/user/nutrition/overview");

    const content = screen.getByTestId("user-layout-content");

    expect(content).toHaveClass("user-card-scope");
    expect(indexCss).toContain('.user-card-scope [data-slot="card"]');
    expect(indexCss).toContain(".user-card-scope .user-card");
    expect(indexCss).toContain(".user-card-scope .user-surface");
    expect(indexCss).toContain('.user-card-scope [class*="shadow-"]');
  });
});
