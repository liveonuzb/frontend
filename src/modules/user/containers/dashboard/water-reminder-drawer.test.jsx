import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WaterReminderDrawer from "./water-reminder-drawer.jsx";
import useHealthGoals from "@/hooks/app/use-health-goals";
import { useGetQuery } from "@/hooks/api";

const mocks = vi.hoisted(() => ({
  addWaterCup: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children }) => <div>{children}</div>,
  DrawerContent: ({ children, className, ...props }) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  DrawerHeader: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
  DrawerTitle: ({ children }) => <h2>{children}</h2>,
  DrawerDescription: ({ children }) => <p>{children}</p>,
  DrawerBody: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: vi.fn(),
}));

vi.mock("@/hooks/app/use-health-goals", () => ({
  default: vi.fn(),
}));

vi.mock("@/hooks/app/use-daily-tracking", () => ({
  useDailyTrackingActions: () => ({
    addWaterCup: mocks.addWaterCup,
  }),
}));

vi.mock("@/store", () => ({
  useAuthStore: (selector) =>
    selector({
      user: { id: "user-1" },
    }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}));

vi.mock("./use-reminder-trigger.js", async () => {
  const React = await import("react");

  return {
    default: ({ enabled, onTrigger }) => {
      React.useEffect(() => {
        if (enabled) onTrigger();
      }, [enabled, onTrigger]);
    },
  };
});

describe("WaterReminderDrawer", () => {
  beforeEach(() => {
    vi.mocked(useHealthGoals).mockReturnValue({
      goals: {
        cupSize: 250,
        customCupSize: null,
        waterMl: 2850,
        waterNotification: true,
        waterNotifStart: "00:00",
        waterNotifEnd: "23:59",
        waterNotifInterval: "30 min",
      },
    });
    vi.mocked(useGetQuery).mockReturnValue({
      data: {
        date: "2026-06-09",
        waterLog: [],
        waterCups: 0,
      },
    });
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("renders the reminder cups with the same picker style as cup selection", async () => {
    render(<WaterReminderDrawer />);

    expect(await screen.findByText("Suv ichish vaqti!")).toBeInTheDocument();

    const cupOptions = screen.getByTestId("water-reminder-cup-options");
    const selectedCup = screen.getByRole("button", { name: "250 ml" });
    const inactiveCup = screen.getByRole("button", { name: "150 ml" });

    expect(cupOptions).toHaveClass("grid", "grid-cols-3", "gap-3", "water-cup");
    expect(selectedCup).toHaveAttribute("aria-pressed", "true");
    expect(selectedCup).toHaveClass(
      "aspect-square",
      "rounded-3xl",
      "bg-primary/10",
      "border-primary",
      "scale-105",
    );
    expect(inactiveCup).toHaveAttribute("aria-pressed", "false");
    expect(inactiveCup).toHaveClass("hover:scale-105", "shadow-sm");
    expect(
      screen.getByRole("button", { name: "+ 250 ml ich" }),
    ).toBeInTheDocument();
  });

  it("uses the selected cup amount for the primary log action", async () => {
    mocks.addWaterCup.mockResolvedValue({});

    render(<WaterReminderDrawer />);

    await screen.findByText("Suv ichish vaqti!");

    fireEvent.click(screen.getByRole("button", { name: "500 ml" }));

    expect(mocks.addWaterCup).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "500 ml" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "+ 500 ml ich" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "+ 500 ml ich" }));

    await waitFor(() => {
      expect(mocks.addWaterCup).toHaveBeenCalledWith(expect.any(String), 500);
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith("500 ml suv qayd etildi");
  });
});
