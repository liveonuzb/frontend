import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import FloatingActionButton from "./fab.jsx";

const navigateMock = vi.fn();
const addWaterCupMock = vi.fn();
const openActionDrawerMock = vi.fn();
const startRunningSessionMock = vi.fn();

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

vi.mock("@/hooks/app/use-running-sessions", () => ({
  useStartRunningSession: () => ({
    startRunningSession: startRunningSessionMock,
    isPending: false,
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

  it("opens a bottom drawer in a portal", () => {
    render(
      <MemoryRouter initialEntries={["/user/dashboard"]}>
        <FloatingActionButton />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Open quick actions" }),
    );

    expect(
      screen.getByRole("dialog", { name: "Quick actions" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Log Food")).toBeInTheDocument();
    expect(screen.getByText("Weight")).toBeInTheDocument();

    const overlay = document.querySelector('[data-slot="drawer-overlay"]');
    expect(overlay).toBeInTheDocument();
    expect(overlay.parentElement).toBe(document.body);
  });

  it("is visible on the friends page", () => {
    render(
      <MemoryRouter initialEntries={["/user/friends"]}>
        <FloatingActionButton />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: "Open quick actions" }),
    ).toBeInTheDocument();
  });

  it("opens barcode scan from the drawer", () => {
    render(
      <MemoryRouter initialEntries={["/user/dashboard"]}>
        <FloatingActionButton />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Open quick actions" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Barcode Scan" }));

    expect(openActionDrawerMock).toHaveBeenCalledWith({
      dateKey: expect.any(String),
      initialNested: "barcode",
    });
  });

  it("starts a run from the bottom of the drawer", async () => {
    startRunningSessionMock.mockResolvedValue({
      workoutSessionId: "run-new",
    });

    render(
      <MemoryRouter initialEntries={["/user/dashboard"]}>
        <FloatingActionButton />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Open quick actions" }),
    );
    const drawerButtons = screen.getAllByRole("button");
    const runButton = screen.getByRole("button", { name: /Run/i });

    expect(drawerButtons[drawerButtons.length - 1]).toBe(runButton);

    fireEvent.click(runButton);

    expect(startRunningSessionMock).toHaveBeenCalledWith({
      source: "fab",
    });
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(
        "/user/workout/running/live/run-new",
      );
    });
  });
});
