import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BellIcon } from "lucide-react";
import NotificationCenter from "./index.jsx";

const mocks = vi.hoisted(() => ({
  notificationStore: {
    notifications: [],
    setInitialNotifications: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}));

vi.mock("react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children }) => <div>{children}</div>,
  DrawerContent: ({ children, className }) => (
    <section data-slot="drawer-content" className={className}>
      {children}
    </section>
  ),
  DrawerDescription: ({ children, className }) => (
    <p data-slot="drawer-description" className={className}>
      {children}
    </p>
  ),
  DrawerFooter: ({ children, className }) => (
    <footer data-slot="drawer-footer" className={className}>
      {children}
    </footer>
  ),
  DrawerHeader: ({ children, className }) => (
    <header data-slot="drawer-header" className={className}>
      {children}
    </header>
  ),
  DrawerTitle: ({ children, className }) => (
    <h2 data-slot="drawer-title" className={className}>
      {children}
    </h2>
  ),
  DrawerBody: ({ children, className }) => (
    <div data-slot="drawer-body" className={className}>
      {children}
    </div>
  ),
}));

vi.mock("@/modules/profile/containers/profile/tabs/notifications-tab.jsx", () => ({
  NotificationSettingsDrawer: ({ open }) =>
    open ? <div>Settings drawer</div> : null,
}));

vi.mock("@/hooks/app/use-health-goals", () => ({
  default: () => ({ goals: {} }),
}));

vi.mock("@/hooks/app/use-daily-tracking", () => ({
  getTodayKey: () => "2026-05-24",
  useDailyTrackingDay: () => ({
    dayData: { meals: {}, waterLog: [], waterCups: 0 },
  }),
}));

vi.mock("@/hooks/app/use-notifications", () => ({
  useUserNotificationsFeed: () => ({
    items: [],
    hasMore: false,
    loadMore: vi.fn(),
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    isUpdatingNotificationState: false,
  }),
}));

vi.mock("@/store", () => ({
  useAuthStore: (selector) =>
    selector({
      activeRole: "USER",
      user: { settings: {} },
    }),
  useGamificationStore: () => ({ streak: 0 }),
  useNotificationsStore: (selector) => selector(mocks.notificationStore),
}));

describe("NotificationCenter", () => {
  beforeEach(() => {
    mocks.notificationStore.notifications = [
      {
        id: "unread-1",
        icon: BellIcon,
        title: "Qadam maqsadi qolmoqda",
        message: "0 / 12,000 qadam bajarildi.",
        time: "Bugun",
        read: false,
        color: "text-emerald-500",
        category: "progress",
      },
      {
        id: "read-1",
        icon: BellIcon,
        title: "Mashg'ulot bajarildi",
        message: "Bugungi mashg'ulot yopildi.",
        time: "Kecha",
        read: true,
        color: "text-primary",
        category: "challenge",
      },
    ];
    mocks.notificationStore.setInitialNotifications.mockClear();
    mocks.notificationStore.markAllRead.mockClear();
    mocks.notificationStore.markRead.mockClear();
  });

  it("shows only all and unread tabs, keeps fixed drawer height, and uses a header settings icon", () => {
    render(<NotificationCenter />);

    const drawerBody = document.querySelector('[data-slot="drawer-body"]');

    expect(screen.getByRole("tab", { name: "Barchasi" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "O'qilmagan" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Do'stlar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Challenge" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "To'lov" })).not.toBeInTheDocument();

    expect(document.querySelector('[data-slot="drawer-content"]')).toHaveClass(
      "data-[vaul-drawer-direction=bottom]:h-[min(82vh,42rem)]",
    );

    const settingsButton = screen.getByRole("button", {
      name: "Bildirishnoma sozlamalari",
    });
    expect(settingsButton).toHaveClass("absolute", "right-4", "top-4");
    expect(settingsButton).toHaveTextContent("");
    expect(document.querySelector('[data-slot="drawer-footer"]')).not.toBeInTheDocument();
    expect(drawerBody).not.toHaveTextContent("Bildirishnomalar");
  });

  it("filters unread notifications through the unread tab", () => {
    render(<NotificationCenter />);

    fireEvent.click(screen.getByRole("tab", { name: "O'qilmagan" }));

    expect(screen.getByText("Qadam maqsadi qolmoqda")).toBeInTheDocument();
    expect(screen.queryByText("Mashg'ulot bajarildi")).not.toBeInTheDocument();
  });
});
