import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotificationSettingsDrawer } from "./notifications-tab.jsx";
import useProfileSettings from "@/hooks/app/use-profile-settings";
import {
  useCoachNotificationPreferences,
  useQuietHours,
} from "@/hooks/app/use-notifications";
import useMe from "@/hooks/app/use-me";
import useUserTelegram from "@/hooks/app/use-user-telegram";

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: () => {},
  },
  useTranslation: () => ({
    t: (key, options = {}) => options.defaultValue || key,
  }),
}));

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children }) => <div>{children}</div>,
  DrawerContent: ({ children }) => <div>{children}</div>,
  DrawerHeader: ({ children }) => <div>{children}</div>,
  DrawerTitle: ({ children }) => <div>{children}</div>,
  DrawerDescription: ({ children }) => <div>{children}</div>,
  DrawerBody: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
  DrawerFooter: ({ children }) => <div>{children}</div>,
}));

vi.mock("@/hooks/app/use-profile-settings", () => ({
  default: vi.fn(),
  getRequestErrorMessage: (_error, fallback) => fallback,
}));

vi.mock("@/hooks/app/use-notifications", () => ({
  useCoachNotificationPreferences: vi.fn(),
  useQuietHours: vi.fn(),
}));

vi.mock("@/components/notification-center", () => ({
  NotificationFeedPanel: () => <div>Notification feed</div>,
  useNotificationCenterModel: () => ({ items: [] }),
}));

vi.mock("@/hooks/app/use-me", () => ({
  default: vi.fn(),
}));

vi.mock("@/hooks/app/use-user-telegram", () => ({
  default: vi.fn(),
}));

vi.mock("@/modules/profile/hooks/use-profile-overlay", () => ({
  useProfileOverlay: () => ({
    closeProfile: vi.fn(),
  }),
}));

vi.mock("@/store", () => ({
  useAuthStore: (selector) =>
    selector({
      activeRole: "USER",
    }),
}));

describe("NotificationSettingsDrawer", () => {
  afterEach(() => {
    vi.clearAllMocks();
    delete window.Telegram;
  });

  it("shows the Telegram connect flow and opens the deep link", async () => {
    const createConnectLink = vi.fn().mockResolvedValue({
      deepLink: "https://t.me/liveonappbot?start=connect_token-1",
      botUrl: "https://t.me/liveonappbot",
    });
    const openTelegramLink = vi.fn();

    window.Telegram = {
      WebApp: {
        openTelegramLink,
      },
    };

    vi.mocked(useProfileSettings).mockReturnValue({
      settings: {
        emailMarketing: true,
        emailWorkout: true,
        pushMeal: true,
        pushWater: true,
        pushProgress: true,
      },
      saveNotificationSettings: vi.fn(),
      isSavingNotifications: false,
    });
    vi.mocked(useCoachNotificationPreferences).mockReturnValue({
      preferences: [],
      updatePreferences: vi.fn(),
      isUpdating: false,
    });
    vi.mocked(useQuietHours).mockReturnValue({
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "08:00",
      },
      updateQuietHours: vi.fn(),
      isUpdating: false,
    });
    vi.mocked(useMe).mockReturnValue({
      user: {
        telegramConnected: false,
      },
      refetch: vi.fn(),
      isFetching: false,
    });
    vi.mocked(useUserTelegram).mockReturnValue({
      createConnectLink,
      disconnectTelegram: vi.fn(),
      isCreatingConnectLink: false,
      isDisconnectingTelegram: false,
    });

    render(<NotificationSettingsDrawer open onOpenChange={vi.fn()} />);

    expect(screen.getByText("Telegram bot")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Reminderlarni Telegramga yuborish uchun @liveonappbot ni ulang. Bot birinchi kirishda til va telefon raqamini so'raydi. Agar START ko'rinmasa Menu yoki /start dan foydalaning.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Telegramni ulash" }));

    await waitFor(() => {
      expect(createConnectLink).toHaveBeenCalledTimes(1);
      expect(openTelegramLink).toHaveBeenCalledWith(
        "https://t.me/liveonappbot?start=connect_token-1",
      );
    });
  });

  it("shows connected Telegram state from /users/me", () => {
    vi.mocked(useProfileSettings).mockReturnValue({
      settings: {
        emailMarketing: true,
        emailWorkout: true,
        pushMeal: true,
        pushWater: true,
        pushProgress: true,
      },
      saveNotificationSettings: vi.fn(),
      isSavingNotifications: false,
    });
    vi.mocked(useCoachNotificationPreferences).mockReturnValue({
      preferences: [],
      updatePreferences: vi.fn(),
      isUpdating: false,
    });
    vi.mocked(useQuietHours).mockReturnValue({
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "08:00",
      },
      updateQuietHours: vi.fn(),
      isUpdating: false,
    });
    vi.mocked(useMe).mockReturnValue({
      user: {
        telegramConnected: true,
        telegramLanguage: "ru",
        telegramMuted: true,
      },
      refetch: vi.fn(),
      isFetching: false,
    });
    vi.mocked(useUserTelegram).mockReturnValue({
      createConnectLink: vi.fn(),
      disconnectTelegram: vi.fn(),
      isCreatingConnectLink: false,
      isDisconnectingTelegram: false,
    });

    render(<NotificationSettingsDrawer open onOpenChange={vi.fn()} />);

    expect(
      screen.getByText(
        "LiveOn reminder bot ulangan. Birinchi kirishda til va telefon raqami so'raladi, keyin status va reminderlarni shu chatdan boshqarasiz. Agar START ko'rinmasa Menu yoki /start dan foydalaning.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Til: Русский")).toBeInTheDocument();
    expect(screen.getByText("Chat status: To'xtatilgan")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Botni ochish" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Telegramni uzish" }),
    ).toBeInTheDocument();
  });
});
