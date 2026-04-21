import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes, useLocation } from "react-router";
import { describe, expect, it, vi } from "vitest";
import CoachIndex from "../index.jsx";

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

vi.mock("@/modules/coach/pages/earnings/index.jsx", () => ({
  default: () => <div data-testid="earnings-page">earnings</div>,
}));

vi.mock("@/modules/coach/pages/groups/index.jsx", () => ({
  default: () => (
    <div data-testid="telegram-groups-page">telegram groups workspace</div>
  ),
}));

vi.mock("@/modules/coach/pages/telegram-bot/index.jsx", () => ({
  default: () => <div data-testid="telegram-bot-page">telegram bot workspace</div>,
}));

vi.mock("@/modules/coach/pages/snippets/index.jsx", () => ({
  default: () => <div data-testid="snippets-page">snippets</div>,
}));

vi.mock("@/modules/coach/pages/challenges/index.jsx", () => ({
  default: () => <div data-testid="challenges-page">challenges</div>,
}));

vi.mock("@/modules/coach/pages/programs/index.jsx", () => ({
  default: () => <div data-testid="programs-page">programs</div>,
}));

vi.mock("@/modules/coach/pages/notifications/index.jsx", () => ({
  default: () => <div data-testid="notifications-page">notifications</div>,
}));

vi.mock("@/modules/coach/pages/sessions/index.jsx", () => ({
  default: () => <div data-testid="sessions-page">sessions</div>,
}));

vi.mock("@/modules/coach/pages/reports/index.jsx", () => ({
  default: () => <div data-testid="reports-page">reports</div>,
}));

vi.mock("@/modules/coach/pages/ai/index.jsx", () => ({
  default: () => <div data-testid="ai-page">ai</div>,
}));

vi.mock("@/modules/coach/pages/referrals/index.jsx", () => ({
  default: () => <div data-testid="referrals-page">referrals</div>,
}));

vi.mock("@/modules/coach/pages/audit/index.jsx", () => ({
  default: () => <div data-testid="audit-page">audit</div>,
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
  it("redirects index route to dashboard", async () => {
    renderCoachIndex("/coach");

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/coach/dashboard",
      );
    });
    expect(await screen.findByTestId("dashboard-page")).toBeInTheDocument();
  });

  it("keeps the legacy groups redirect for old Telegram group links", async () => {
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

  it.each([
    ["/coach/telegram-bot", "telegram-bot-page"],
    ["/coach/programs", "programs-page"],
    ["/coach/challenges", "challenges-page"],
    ["/coach/snippets", "snippets-page"],
    ["/coach/notifications", "notifications-page"],
    ["/coach/sessions", "sessions-page"],
    ["/coach/reports", "reports-page"],
    ["/coach/ai", "ai-page"],
    ["/coach/referrals", "referrals-page"],
    ["/coach/audit-logs", "audit-page"],
  ])("routes %s to the mounted workspace", async (path, testId) => {
    renderCoachIndex(path);

    expect(await screen.findByTestId(testId)).toBeInTheDocument();
  });

  it.each([
    "/coach/marketplace?tab=legacy",
    "/coach/courses",
    "/coach/packages",
    "/coach/purchase-queue",
    "/coach/chat/thread-1",
    "/coach/messages",
  ])("does not keep removed legacy route %s", async (path) => {
    renderCoachIndex(path);

    expect(await screen.findByTestId("not-found-page")).toBeInTheDocument();
  });
});
