import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useCoachTelegramBroadcasts,
  useCoachTelegramConnect,
  useCoachTelegramDisconnect,
  useCoachTelegramHealth,
  useCoachTelegramMessages,
  useCoachTelegramSendMessage,
  useCoachTelegramSettings,
  useCoachTelegramTemplates,
  useCoachTelegramToggle,
  useCoachTelegramUserUpdate,
  useCoachTelegramUsers,
} from "@/modules/coach/lib/hooks/useCoachTelegram";
import { useCoachClients } from "@/modules/coach/lib/hooks/useCoachClients";
import {
  DiagnosticsTab,
  SendMessageDrawer,
} from "./telegram-bot-container.jsx";
import { TelegramWorkbenchTab } from "./telegram-workbench.jsx";

vi.mock("@/modules/coach/lib/hooks/useCoachTelegram", () => ({
  useCoachTelegramBot: vi.fn(),
  useCoachTelegramBroadcasts: vi.fn(),
  useCoachTelegramConnect: vi.fn(),
  useCoachTelegramDisconnect: vi.fn(),
  useCoachTelegramHealth: vi.fn(),
  useCoachTelegramMessages: vi.fn(),
  useCoachTelegramSendMessage: vi.fn(),
  useCoachTelegramSettings: vi.fn(),
  useCoachTelegramTemplates: vi.fn(),
  useCoachTelegramToggle: vi.fn(),
  useCoachTelegramUserUpdate: vi.fn(),
  useCoachTelegramUsers: vi.fn(),
}));

vi.mock("@/modules/coach/lib/hooks/useCoachClients", () => ({
  useCoachClients: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const renderWithQueryClient = (ui) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

describe("TelegramBotContainer", () => {
  const refetchHealth = vi.fn();
  const sendMutate = vi.fn();
  const updateUserMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useCoachTelegramHealth.mockReturnValue({
      isLoading: false,
      isFetching: false,
      refetch: refetchHealth,
      data: {
        data: {
          checkedAt: "2026-05-06T08:00:00.000Z",
          managerRegistered: true,
          telegramReachable: true,
          tokenEncrypted: true,
          webhookUrl: "https://api.example.com/webhook",
          webhookInfo: {
            url: "https://api.example.com/webhook",
            pendingUpdateCount: 0,
            allowedUpdates: ["message", "callback_query"],
          },
          lastMessageAt: "2026-05-06T07:55:00.000Z",
          lastOutgoingMessageAt: "2026-05-06T07:50:00.000Z",
        },
      },
    });
    useCoachTelegramBroadcasts.mockReturnValue({
      data: {
        data: [
          {
            id: "job-1",
            text: "Salom",
            status: "COMPLETED",
            sentCount: 3,
            totalCount: 4,
            createdAt: "2026-05-06T07:40:00.000Z",
          },
        ],
      },
      isFetching: false,
      refetch: vi.fn(),
    });
    useCoachTelegramConnect.mockReturnValue({ mutate: vi.fn(), isPending: false });
    useCoachTelegramDisconnect.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    useCoachTelegramMessages.mockReturnValue({
      data: {
        data: {
          items: [
            {
              id: "msg-1",
              telegramUserId: "telegram-user-1",
              direction: "incoming",
              messageType: "text",
              content: "Assalomu alaykum",
              deliveryStatus: "LOGGED",
              createdAt: "2026-05-06T07:55:00.000Z",
              user: {
                id: "telegram-user-1",
                firstName: "Ali",
                lastName: "Valiyev",
                username: "ali_fit",
              },
            },
          ],
        },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    useCoachTelegramSendMessage.mockReturnValue({
      mutate: sendMutate,
      isPending: false,
    });
    useCoachTelegramSettings.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    useCoachTelegramTemplates.mockReturnValue({
      data: {
        data: {
          items: [
            {
              key: "welcome",
              label: "Welcome",
              translations: { uz: "Salom {{clientName}}", ru: "", en: "" },
            },
          ],
        },
      },
      isLoading: false,
    });
    useCoachTelegramToggle.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    useCoachTelegramUserUpdate.mockReturnValue({
      mutate: updateUserMutate,
      isPending: false,
    });
    useCoachTelegramUsers.mockReturnValue({
      data: {
        data: {
          items: [
            {
              id: "telegram-user-1",
              telegramId: "123",
              username: "ali_fit",
              firstName: "Ali",
              lastName: "Valiyev",
              languageCode: "uz",
              phone: "+998901112233",
              state: { workbench: { tags: ["lead"], note: "Nutrition" } },
              lastActiveAt: "2026-05-06T07:55:00.000Z",
            },
          ],
        },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    useCoachClients.mockReturnValue({
      data: {
        data: {
          items: [
            {
              id: "client-1",
              name: "Ali Client",
              email: "ali@example.com",
              phone: "+998901112233",
            },
          ],
        },
      },
      isLoading: false,
    });
  });

  it("shows diagnostics health", () => {
    const onOpenSend = vi.fn();

    render(
      <DiagnosticsTab
        apiBase="/coach/telegram"
        enabled
        onOpenSend={onOpenSend}
      />,
    );

    expect(useCoachTelegramHealth).toHaveBeenLastCalledWith(
      "/coach/telegram",
      expect.objectContaining({
        enabled: true,
        queryKey: ["/coach/telegram", "health"],
      }),
    );
    expect(screen.getByText("Runtime")).toBeInTheDocument();
    expect(screen.getByText("Registered")).toBeInTheDocument();
    expect(screen.getByText("Telegram API")).toBeInTheDocument();
    expect(screen.getByText("Encrypted")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Test xabar"));
    expect(onOpenSend).toHaveBeenCalledTimes(1);
  });

  it("opens the message drawer in individual mode for diagnostics tests", () => {
    render(
      <SendMessageDrawer
        open
        onOpenChange={vi.fn()}
        initialMode="individual"
        apiBase="/coach/telegram"
      />,
    );

    expect(screen.getByText(/Alohida/)).toBeInTheDocument();
    expect(screen.getByText("Foydalanuvchini tanlang...")).toBeInTheDocument();
  });

  it("renders the inbox workbench with profile actions and replies", () => {
    renderWithQueryClient(<TelegramWorkbenchTab apiBase="/coach/telegram" />);

    expect(screen.getByText("Telegram inbox")).toBeInTheDocument();
    expect(screen.getAllByText("Ali Valiyev").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Assalomu alaykum").length).toBeGreaterThan(0);
    expect(screen.getByText("lead x")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Mijozga bog'lash"), {
      target: { value: "client-1" },
    });
    expect(updateUserMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/coach/telegram/users/telegram-user-1/workbench",
        attributes: { linkedUserId: "client-1" },
      }),
      expect.any(Object),
    );

    fireEvent.change(screen.getByPlaceholderText("Javob matni..."), {
      target: { value: "Salom, ko'rib chiqaman" },
    });
    fireEvent.click(screen.getByTitle("Javob yuborish"));

    expect(sendMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/coach/telegram/send-message",
        attributes: {
          telegramUserId: "telegram-user-1",
          message: "Salom, ko'rib chiqaman",
        },
      }),
      expect.any(Object),
    );
  });
});
