import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import FloatingActionButton from "./fab.jsx";

const navigateMock = vi.fn();
const addWaterCupMock = vi.fn();
const openActionDrawerMock = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/hooks/app/use-daily-tracking", () => ({
  useDailyTrackingActions: () => ({
    addWaterCup: addWaterCupMock,
  }),
  useDailyTrackingDay: () => ({
    dayData: {
      waterLog: [],
      waterCups: 0,
      meals: {},
    },
  }),
}));

vi.mock("@/hooks/app/use-health-goals", () => ({
  default: () => ({
    goals: {
      calories: 2000,
      cupSize: 250,
    },
  }),
}));

vi.mock("@/hooks/app/use-measurements", () => ({
  default: () => ({
    getLatest: () => ({
      weight: 80,
    }),
  }),
}));

vi.mock("@/store", () => ({
  useAddMealOverlayStore: (selector) =>
    selector({
      openActionDrawer: openActionDrawerMock,
    }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("FloatingActionButton", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders a full-screen overlay in a portal and closes on outside click", () => {
    render(
      <MemoryRouter initialEntries={["/user/dashboard"]}>
        <FloatingActionButton />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Open quick actions" }),
    );

    expect(screen.getByText("Weight")).toBeInTheDocument();

    const overlay = screen.getByTestId("fab-overlay");
    expect(overlay.parentElement).toBe(document.body);

    fireEvent.click(overlay);

    expect(screen.queryByText("Weight")).not.toBeInTheDocument();
  });
});
