import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import Layout from "./index.jsx";

vi.mock("@/hooks/utils/use-mobile", () => ({
  default: () => false,
}));

vi.mock("@/store", () => ({
  useAddMealOverlayStore: (selector) =>
    selector({ isActionDrawerOpen: false }),
  useAuthStore: () => ({
    user: {
      firstName: "Fazliddin",
      lastName: "Liveon",
      settings: { sidebarState: "expanded" },
    },
  }),
}));

vi.mock("@/components/role-switcher", () => ({
  default: () => <div data-testid="role-switcher" />,
}));

vi.mock("@/components/notification-center", () => ({
  default: () => <button type="button">Notifications</button>,
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
  useProfileOverlay: () => ({ openProfile: vi.fn() }),
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
          <Route
            path="/user/workout/running/live/:id"
            element={<div>running live</div>}
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe("User layout shell", () => {
  it("hides the shared dashboard header on mobile but keeps it available on desktop", () => {
    renderLayout("/user/dashboard");

    expect(screen.getByTestId("layout-header")).toHaveClass(
      "hidden",
      "md:block",
    );
    expect(screen.getByTestId("mobile-sidebar-edge-swipe")).toHaveAttribute(
      "data-enabled",
      "true",
    );
  });

  it("hides the shared header on normal user pages and removes header spacing", () => {
    const { unmount } = renderLayout("/user/nutrition/overview");

    expect(screen.getByTestId("layout-header")).toHaveClass(
      "hidden",
      "md:block",
    );
    expect(screen.getByTestId("user-layout-content")).toHaveClass("mt-0");
    expect(screen.getByTestId("user-layout-content")).not.toHaveClass("mt-16");
    expect(screen.getByTestId("mobile-sidebar-edge-swipe")).toHaveAttribute(
      "data-enabled",
      "true",
    );

    unmount();

    renderLayout("/user/workout/overview");

    expect(screen.getByTestId("layout-header")).toHaveClass(
      "hidden",
      "md:block",
    );
    expect(screen.getByTestId("user-layout-content")).toHaveClass("mt-0");
    expect(screen.getByTestId("user-layout-content")).not.toHaveClass("mt-16");
  });

  it("disables edge swipe on running live", () => {
    renderLayout("/user/workout/running/live/run-1");

    expect(screen.getByTestId("layout-header")).toHaveClass(
      "hidden",
      "md:block",
    );
    expect(screen.getByTestId("mobile-sidebar-edge-swipe")).toHaveAttribute(
      "data-enabled",
      "false",
    );
  });
});
