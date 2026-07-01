import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { describe, expect, it, vi } from "vitest";
import UserModule from "./index.jsx";

vi.mock("@/modules/user/layout/index.jsx", async () => {
  const ReactModule = await vi.importActual("react");
  const { Outlet } = await vi.importActual("react-router");

  return {
    default: () => ReactModule.createElement(Outlet),
  };
});

vi.mock("@/components/page-loader/index.jsx", () => ({
  default: () => <div>page-loader</div>,
}));

vi.mock("@/components/error-boundary/index.jsx", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("@/modules/profile/hooks/use-profile-overlay", () => ({
  DEFAULT_PROFILE_TAB: "overview",
}));

vi.mock("@/modules/profile/lib/profile-tab-registry", () => ({
  PROFILE_OVERVIEW_TAB: "overview",
  PROFILE_HEALTH_TAB: "health",
  PROFILE_SETTINGS_TAB: "settings",
  normalizeProfileOverlayTab: (value) => value || "overview",
}));

vi.mock("@/modules/profile/lib/profile-tab-navigation", () => ({
  getStandaloneProfileTabPath: () => null,
}));

vi.mock("@/modules/user/pages/dashboard/index.jsx", () => ({
  default: () => <div>dashboard-page</div>,
}));

vi.mock("@/modules/user/pages/steps/index.jsx", () => ({
  default: () => <div>steps-page</div>,
}));

vi.mock("@/modules/user/pages/sleep/index.jsx", () => ({
  default: () => <div>sleep-page</div>,
}));

const LocationProbe = () => {
  const location = useLocation();
  return <div>location:{location.pathname}</div>;
};

const renderUserModule = (initialPath) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/user/*" element={<UserModule />} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );

describe("UserModule hidden routes", () => {
  it("renders the dedicated steps and sleep detail pages", async () => {
    renderUserModule("/user/steps?date=2026-06-18");

    await waitFor(() => {
      expect(screen.getByText("steps-page")).toBeInTheDocument();
    });

    renderUserModule("/user/sleep?date=2026-06-18");

    await waitFor(() => {
      expect(screen.getByText("sleep-page")).toBeInTheDocument();
    });
  });

  it.each([
    "/user/challenges",
    "/user/challenges/active-challenge-id",
    "/user/leaderboard",
  ])("redirects %s to the dashboard while temporarily hidden", async (path) => {
    renderUserModule(path);

    await waitFor(() => {
      expect(screen.getByText("location:/user/dashboard")).toBeInTheDocument();
    });
  });
});
