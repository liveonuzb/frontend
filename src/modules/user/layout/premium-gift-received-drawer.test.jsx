import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PremiumGiftReceivedDrawer from "./premium-gift-received-drawer.jsx";

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
  Drawer: ({ children, open }) =>
    open ? <div data-testid="drawer-root">{children}</div> : null,
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

const premiumGiftNotification = {
  id: "notification-1",
  type: "premium_gift_received",
  title: "Premium sovg'a qilindi",
  message: "Sizga Premium obuna sovg'a qilindi.",
  target: "/user/dashboard?profile=open&profileTab=premium",
  createdAt: "2026-05-23T10:00:00.000Z",
  metadata: {
    planName: "Premium",
    expiresAt: "2026-06-22T00:00:00.000Z",
    note: "Welcome",
  },
};

describe("PremiumGiftReceivedDrawer", () => {
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

  it("opens an unread premium gift notification and navigates to premium tab", async () => {
    markNotificationReadMock.mockResolvedValue({});
    useUserNotificationsFeedMock.mockReturnValue({
      items: [premiumGiftNotification],
      markNotificationRead: markNotificationReadMock,
    });

    render(<PremiumGiftReceivedDrawer />);

    expect(await screen.findByText("Premium sovg'a qilindi")).toBeInTheDocument();
    expect(screen.getByText("Premium")).toBeInTheDocument();
    expect(screen.queryByText(/AI credit/i)).not.toBeInTheDocument();
    expect(screen.getByText("Welcome")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Premiumni ko'rish" }));

    await waitFor(() => {
      expect(markNotificationReadMock).toHaveBeenCalledWith("notification-1");
      expect(navigateMock).toHaveBeenCalledWith(
        "/user/dashboard?profile=open&profileTab=premium",
      );
    });
  });

  it("does not auto-open while another meal action drawer is active", async () => {
    addMealOverlayState.isActionDrawerOpen = true;
    useUserNotificationsFeedMock.mockReturnValue({
      items: [premiumGiftNotification],
      markNotificationRead: markNotificationReadMock,
    });

    render(<PremiumGiftReceivedDrawer />);

    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(screen.queryByText("Premium sovg'a qilindi")).not.toBeInTheDocument();
    expect(markNotificationReadMock).not.toHaveBeenCalled();
  });
});
