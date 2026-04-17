import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes, useLocation } from "react-router";
import { describe, expect, it, vi } from "vitest";
import CoachIndex from "./index.jsx";

vi.mock("@/modules/coach/layout/index.jsx", () => ({
  default: () => <Outlet />,
}));

vi.mock("@/modules/coach/pages/dashboard/index.jsx", () => ({
  default: () => <div data-testid="dashboard-page">dashboard</div>,
}));

vi.mock("@/modules/coach/pages/clients/index.jsx", () => ({
  default: () => <div data-testid="clients-page">clients</div>,
}));

vi.mock("@/modules/coach/pages/meal-plans/index.jsx", () => ({
  default: () => <div data-testid="meal-plans-page">meal plans</div>,
}));

vi.mock("@/modules/coach/pages/workout-plans/index.jsx", () => ({
  default: () => <div data-testid="workout-plans-page">workout plans</div>,
}));

vi.mock("@/modules/coach/pages/payments/index.jsx", () => ({
  default: () => <div data-testid="payments-page">payments</div>,
}));

vi.mock("@/modules/coach/pages/groups/index.jsx", () => ({
  default: () => (
    <div data-testid="telegram-groups-page">telegram groups workspace</div>
  ),
}));

vi.mock("@/modules/profile/pages/profile/index.jsx", () => ({
  default: () => <div data-testid="profile-page">profile</div>,
}));

vi.mock("@/pages/not-found/index.jsx", () => ({
  default: () => <div data-testid="not-found-page">not found</div>,
}));

const LocationProbe = () => {
  const location = useLocation();

  return (
    <div data-testid="location">{`${location.pathname}${location.search}`}</div>
  );
};

const renderCoachIndex = (initialEntry) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <LocationProbe />
      <Routes>
        <Route path="/coach/*" element={<CoachIndex />} />
      </Routes>
    </MemoryRouter>,
  );

describe("CoachIndex", () => {
  it("redirects marketplace and courses to clients while preserving search params", async () => {
    renderCoachIndex("/coach/marketplace?tab=legacy");

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/coach/clients?tab=legacy",
      );
    });
    expect(await screen.findByTestId("clients-page")).toBeInTheDocument();
  });

  it("redirects groups and telegram-bot to telegram-groups", async () => {
    renderCoachIndex("/coach/groups?q=vip");

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/coach/telegram-groups?q=vip",
      );
    });
    expect(
      await screen.findByTestId("telegram-groups-page"),
    ).toBeInTheDocument();
  });

  it("redirects packages and purchase queue to payments", async () => {
    renderCoachIndex("/coach/packages");

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/coach/payments",
      );
    });
    expect(await screen.findByTestId("payments-page")).toBeInTheDocument();
  });
});
