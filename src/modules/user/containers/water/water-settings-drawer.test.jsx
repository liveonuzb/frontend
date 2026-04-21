import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import WaterSettingsDrawer from "./water-settings-drawer.jsx";
import useHealthGoals from "@/hooks/app/use-health-goals";
import useMe from "@/hooks/app/use-me";

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children }) => <div>{children}</div>,
  DrawerTrigger: ({ children }) => <div>{children}</div>,
  DrawerContent: ({ children }) => <div>{children}</div>,
  DrawerHeader: ({ children }) => <div>{children}</div>,
  DrawerTitle: ({ children }) => <div>{children}</div>,
  DrawerDescription: ({ children }) => <div>{children}</div>,
  DrawerBody: ({ children, className }) => <div className={className}>{children}</div>,
}));

vi.mock("@/hooks/app/use-health-goals", () => ({
  default: vi.fn(),
}));

vi.mock("@/hooks/app/use-me", () => ({
  default: vi.fn(),
}));

vi.mock("./daily-goal-drawer", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("./custom-cup-drawer", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("./time-drawer", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("./interval-drawer", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

describe("WaterSettingsDrawer", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows a Telegram hint when water reminders are enabled but the account is disconnected", () => {
    vi.mocked(useMe).mockReturnValue({
      user: {
        telegramConnected: false,
      },
    });
    vi.mocked(useHealthGoals).mockReturnValue({
      goals: {
        waterNotification: true,
        waterNotifStart: "08:00",
        waterNotifEnd: "22:00",
        waterNotifInterval: "1 hour",
        waterMl: 2500,
        cupSize: 250,
        customCupSize: null,
      },
      setGoal: vi.fn(),
    });

    render(<WaterSettingsDrawer />);

    expect(
      screen.getByText(
        "Telegram ulanmagan. Bot eslatmalari Notifications bo'limidan @liveonappbot ni ulaganingizdan keyin ishlaydi.",
      ),
    ).toBeInTheDocument();
  });

  it("hides the Telegram hint when the account is already connected", () => {
    vi.mocked(useMe).mockReturnValue({
      user: {
        telegramConnected: true,
      },
    });
    vi.mocked(useHealthGoals).mockReturnValue({
      goals: {
        waterNotification: true,
        waterNotifStart: "08:00",
        waterNotifEnd: "22:00",
        waterNotifInterval: "1 hour",
        waterMl: 2500,
        cupSize: 250,
        customCupSize: null,
      },
      setGoal: vi.fn(),
    });

    render(<WaterSettingsDrawer />);

    expect(
      screen.queryByText(/Telegram ulanmagan/i),
    ).not.toBeInTheDocument();
  });
});
