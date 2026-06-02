import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import WaterSettingsDrawer from "./water-settings-drawer.jsx";
import useHealthGoals from "@/hooks/app/use-health-goals";
import useMe from "@/hooks/app/use-me";
import useUserTelegram from "@/hooks/app/use-user-telegram";

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children }) => <div>{children}</div>,
  DrawerTrigger: ({ children }) => <div>{children}</div>,
  DrawerContent: ({ children }) => <div>{children}</div>,
  DrawerHeader: ({ children, className }) => (
    <div data-testid="water-settings-header" className={className}>
      {children}
    </div>
  ),
  DrawerTitle: ({ children }) => <div>{children}</div>,
  DrawerDescription: ({ children }) => <div>{children}</div>,
  DrawerBody: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock("@/hooks/app/use-health-goals", () => ({
  default: vi.fn(),
}));

vi.mock("@/hooks/app/use-me", () => ({
  default: vi.fn(),
}));

vi.mock("@/hooks/app/use-user-telegram", () => ({
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
    const createConnectLink = vi.fn();
    vi.mocked(useMe).mockReturnValue({
      user: {
        telegramConnected: false,
      },
    });
    vi.mocked(useUserTelegram).mockReturnValue({
      createConnectLink,
      disconnectTelegram: vi.fn(),
      isCreatingConnectLink: false,
      isDisconnectingTelegram: false,
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

    fireEvent.click(screen.getByRole("button", { name: "Telegramni ulash" }));

    expect(createConnectLink).toHaveBeenCalledTimes(1);
  });

  it("hides the Telegram hint when the account is already connected", () => {
    vi.mocked(useMe).mockReturnValue({
      user: {
        telegramConnected: true,
      },
    });
    vi.mocked(useUserTelegram).mockReturnValue({
      createConnectLink: vi.fn(),
      disconnectTelegram: vi.fn(),
      isCreatingConnectLink: false,
      isDisconnectingTelegram: false,
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

    expect(screen.queryByText(/Telegram ulanmagan/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Telegramni ulash" }),
    ).not.toBeInTheDocument();
  });

  it("uses the default drawer header style and the shared mode-aware cup picker", () => {
    vi.mocked(useMe).mockReturnValue({
      user: {
        telegramConnected: true,
      },
    });
    vi.mocked(useUserTelegram).mockReturnValue({
      createConnectLink: vi.fn(),
      disconnectTelegram: vi.fn(),
      isCreatingConnectLink: false,
      isDisconnectingTelegram: false,
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

    expect(screen.getByTestId("water-settings-header")).not.toHaveClass(
      "border-b",
    );
    expect(screen.getByText("150 ml")).toBeInTheDocument();
    expect(screen.getByText("250 ml")).toBeInTheDocument();
    expect(screen.getByText("400 ml")).toBeInTheDocument();
    expect(screen.queryByText("100 ml")).not.toBeInTheDocument();
    expect(screen.queryByText("200 ml")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "250 ml" }).querySelector(".cup_250"),
    ).toBeInTheDocument();
  });
});
