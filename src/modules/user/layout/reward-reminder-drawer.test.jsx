import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RewardReminderDrawer from "./reward-reminder-drawer.jsx";

const {
  navigateMock,
  markNotificationReadMock,
  useUserNotificationsFeedMock,
  addMealOverlayState,
  useAddMealOverlayStoreExport,
  useAddMealOverlayStoreMock,
} = vi.hoisted(() => {
  const navigateMock = vi.fn();
  const markNotificationReadMock = vi.fn();
  const useUserNotificationsFeedMock = vi.fn();
  const addMealOverlayState = {
    isActionDrawerOpen: false,
  };
  const useAddMealOverlayStoreMock = vi.fn((selector) =>
    typeof selector === "function"
      ? selector(addMealOverlayState)
      : addMealOverlayState,
  );

  useAddMealOverlayStoreMock.getState = () => addMealOverlayState;

  const useAddMealOverlayStoreExport = Object.assign(
    (...args) => useAddMealOverlayStoreMock(...args),
    {
      getState: () => useAddMealOverlayStoreMock.getState(),
    },
  );

  return {
    navigateMock,
    markNotificationReadMock,
    useUserNotificationsFeedMock,
    addMealOverlayState,
    useAddMealOverlayStoreExport,
    useAddMealOverlayStoreMock,
  };
});

vi.mock("react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock("@/hooks/app/use-notifications", () => ({
  useUserNotificationsFeed: (...args) => useUserNotificationsFeedMock(...args),
}));

vi.mock("@/store", () => ({
  useAddMealOverlayStore: useAddMealOverlayStoreExport,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children, open }) => (open ? <div data-testid="drawer-root">{children}</div> : null),
  DrawerContent: ({ children, ...props }) => (
    <div data-slot="drawer-content" data-vaul-drawer-direction="bottom" {...props}>
      {children}
    </div>
  ),
  DrawerHeader: ({ children, ...props }) => <div {...props}>{children}</div>,
  DrawerTitle: ({ children, ...props }) => <div {...props}>{children}</div>,
  DrawerDescription: ({ children, ...props }) => <div {...props}>{children}</div>,
  DrawerBody: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

describe("RewardReminderDrawer", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    markNotificationReadMock.mockReset();
    useUserNotificationsFeedMock.mockReset();
    useAddMealOverlayStoreMock.mockClear();
    addMealOverlayState.isActionDrawerOpen = false;

    vi.stubGlobal("requestAnimationFrame", (callback) =>
      setTimeout(() => callback(Date.now()), 0),
    );
    vi.stubGlobal("cancelAnimationFrame", (id) => clearTimeout(id));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("opens an unread achievement reward and confirms to the achievements page", async () => {
    markNotificationReadMock.mockResolvedValue({});
    useUserNotificationsFeedMock.mockReturnValue({
      items: [
        {
          id: "notification-1",
          type: "achievement_earned",
          title: "Birinchi taom",
          message: "Birinchi ovqat yozuvingizni qo'shing",
          createdAt: "2026-04-22T13:40:00.000Z",
          metadata: {
            icon: "🥗",
            xpReward: 10,
          },
        },
      ],
      markNotificationRead: markNotificationReadMock,
    });

    render(<RewardReminderDrawer />);

    expect(await screen.findByText("Birinchi taom")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Yutuqlarni ko'rish" }));

    await waitFor(() => {
      expect(markNotificationReadMock).toHaveBeenCalledWith("notification-1");
      expect(navigateMock).toHaveBeenCalledWith("/user/achievements");
    });
  });

  it("does not auto-open while the add meal overlay is active", async () => {
    addMealOverlayState.isActionDrawerOpen = true;
    markNotificationReadMock.mockResolvedValue({});
    useUserNotificationsFeedMock.mockReturnValue({
      items: [
        {
          id: "notification-2",
          type: "referral_reward",
          title: "Referral bonus",
          message: "Yangi reward sizni kutmoqda.",
          createdAt: "2026-04-22T13:41:00.000Z",
          metadata: {
            xpAmount: 100,
          },
        },
      ],
      markNotificationRead: markNotificationReadMock,
    });

    render(<RewardReminderDrawer />);

    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(screen.queryByText("Referral bonus")).not.toBeInTheDocument();
    expect(markNotificationReadMock).not.toHaveBeenCalled();
  });

  it("marks a referral reward as read when closed without navigating", async () => {
    markNotificationReadMock.mockResolvedValue({});
    useUserNotificationsFeedMock.mockReturnValue({
      items: [
        {
          id: "notification-3",
          type: "referral_reward",
          title: "Referral bonus",
          message: "Yangi reward sizni kutmoqda.",
          createdAt: "2026-04-22T13:42:00.000Z",
          metadata: {
            xpAmount: 150,
          },
        },
      ],
      markNotificationRead: markNotificationReadMock,
    });

    render(<RewardReminderDrawer />);

    expect(await screen.findByText("Referral bonus")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Reward reminderni yopish" }),
    );

    await waitFor(() => {
      expect(markNotificationReadMock).toHaveBeenCalledWith("notification-3");
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
