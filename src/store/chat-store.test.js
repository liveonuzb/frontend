import { beforeEach, describe, expect, it, vi } from "vitest";

const { localStorageMock, tMock } = vi.hoisted(() => {
  const storage = {
    store: {},
    getItem(key) {
      return this.store[key] ?? null;
    },
    setItem(key, value) {
      this.store[key] = String(value);
    },
    removeItem(key) {
      delete this.store[key];
    },
    clear() {
      this.store = {};
    },
  };

  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
  });

  const translations = {
    "store.chat.errors.sendMessage": "Failed to send message",
    "store.chat.invoice.unavailable":
      "Invoice payment is not connected to a real payment provider yet",
  };

  const t = vi.fn((key, options = {}) => translations[key] ?? options.defaultValue ?? key);

  return { localStorageMock: storage, tMock: t };
});

const { ioMock } = vi.hoisted(() => ({
  ioMock: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

vi.mock("socket.io-client", () => ({
  io: ioMock,
}));

vi.mock("@/hooks/api/use-api.js", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/lib/i18n", () => ({
  default: {
    t: tMock,
  },
}));

import { api } from "@/hooks/api/use-api.js";
import { toast } from "sonner";
import useAuthStore from "./auth-store.js";
import useChatStore, { getChatSocketConnectionConfig } from "./chat-store.js";

describe("getChatSocketConnectionConfig", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();

    useAuthStore.setState({
      isAuthenticated: true,
      token: "access-token",
      refreshToken: "refresh-token",
      user: { id: "user-1" },
      roles: ["USER"],
      activeRole: "USER",
    });

    useChatStore.setState({
      socket: null,
      contacts: [],
      messages: {},
      messagesCursors: {},
      typingUsers: {},
      activeRoomId: null,
      messageSearchResults: [],
      messageSearchCursor: null,
      messageSearchQuery: "",
      isSearchingMessages: false,
      messageSearchError: null,
    });
  });

  it("routes socket.io through the API prefix for same-origin deployments", () => {
    expect(getChatSocketConnectionConfig("/api/v1")).toEqual({
      socketUrl: "",
      socketPath: "/api/v1/socket.io",
    });
  });

  it("keeps absolute backend origins and uses the API-prefixed socket path", () => {
    expect(getChatSocketConnectionConfig("https://liveon.uz/api/v1")).toEqual({
      socketUrl: "https://liveon.uz",
      socketPath: "/api/v1/socket.io",
    });
  });

  it("persists sent messages through HTTP and replaces the optimistic message", async () => {
    api.post.mockResolvedValue({
      data: {
        data: {
          id: "msg-1",
          roomId: "room-1",
          text: "Salom",
          type: "TEXT",
          createdAt: "2026-04-22T10:00:00.000Z",
          isRead: false,
          sender: { id: "user-1" },
        },
      },
    });

    await useChatStore.getState().sendMessage("room-1", "Salom");

    expect(api.post).toHaveBeenCalledWith("/chat/rooms/room-1/messages", {
      text: "Salom",
      type: "text",
      metadata: null,
      mediaUrl: null,
      replyToId: null,
    });

    expect(useChatStore.getState().messages["room-1"]).toEqual([
      expect.objectContaining({
        id: "msg-1",
        text: "Salom",
        type: "text",
        from: "me",
        status: "sent",
      }),
    ]);
  });

  it("keeps a failed optimistic message visible when HTTP persistence fails", async () => {
    api.post.mockRejectedValue(new Error("network error"));

    await useChatStore.getState().sendMessage("room-1", "Yo'qoldi");

    expect(useChatStore.getState().messages["room-1"]).toEqual([
      expect.objectContaining({
        id: expect.stringMatching(/^temp-/),
        text: "Yo'qoldi",
        status: "failed",
        errorMessage: "Failed to send message",
      }),
    ]);
    expect(toast.error).toHaveBeenCalledWith("Failed to send message");
  });

  it("retries a failed message and replaces it with the persisted message", async () => {
    api.post
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce({
        data: {
          data: {
            id: "msg-retried",
            roomId: "room-1",
            text: "Qayta yubor",
            type: "TEXT",
            createdAt: "2026-04-22T10:02:00.000Z",
            isRead: false,
            sender: { id: "user-1" },
          },
        },
      });

    await useChatStore.getState().sendMessage("room-1", "Qayta yubor");
    const failedId = useChatStore.getState().messages["room-1"][0].id;

    await useChatStore.getState().retryMessage("room-1", failedId);

    expect(api.post).toHaveBeenLastCalledWith("/chat/rooms/room-1/messages", {
      text: "Qayta yubor",
      type: "text",
      metadata: null,
      mediaUrl: null,
      replyToId: null,
    });
    expect(useChatStore.getState().messages["room-1"]).toEqual([
      expect.objectContaining({
        id: "msg-retried",
        text: "Qayta yubor",
        type: "text",
        from: "me",
        status: "sent",
      }),
    ]);
  });

  it("refreshes expiring secure attachment URLs through the backend", async () => {
    api.get.mockResolvedValue({
      data: {
        data: {
          url: "https://signed.example.com/new-url",
          objectKey: "chat-media/file.pdf",
          expiresAt: "2026-04-22T11:00:00.000Z",
        },
      },
    });
    useChatStore.setState({
      messages: {
        "room-1": [
          {
            id: "msg-1",
            mediaUrl: "https://signed.example.com/old-url",
            metadata: {
              attachment: {
                objectKey: "chat-media/file.pdf",
                signedUrlExpiresAt: "2026-04-22T10:00:00.000Z",
              },
            },
          },
        ],
      },
    });

    await useChatStore.getState().refreshAttachmentUrl("room-1", "msg-1");

    expect(api.get).toHaveBeenCalledWith(
      "/chat/rooms/room-1/messages/msg-1/attachment-url",
    );
    expect(useChatStore.getState().messages["room-1"][0]).toMatchObject({
      mediaUrl: "https://signed.example.com/new-url",
      metadata: {
        attachment: {
          objectKey: "chat-media/file.pdf",
          signedUrlExpiresAt: "2026-04-22T11:00:00.000Z",
        },
      },
    });
  });

  it("does not mark invoice messages as paid without a real payment provider", () => {
    useChatStore.setState({
      messages: {
        "room-1": [
          {
            id: "invoice-1",
            type: "invoice",
            metadata: {
              amount: 250000,
              description: "May oyi",
              status: "pending",
            },
          },
        ],
      },
    });

    const result = useChatStore.getState().payInvoice("room-1", "invoice-1");

    expect(result).toBe(false);
    expect(useChatStore.getState().messages["room-1"][0].metadata.status).toBe(
      "pending",
    );
    expect(toast.error).toHaveBeenCalledWith(
      "Invoice payment is not connected to a real payment provider yet",
    );
  });

  it("starts socket transport with polling before websocket for proxy compatibility", () => {
    useChatStore.getState().initSocket();

    expect(ioMock).toHaveBeenCalledWith(
      "http://localhost:3000",
      expect.objectContaining({
        path: "/api/v1/socket.io",
        transports: ["polling", "websocket"],
      }),
    );
  });

  it("searches messages through the backend instead of loaded local state only", async () => {
    api.get.mockResolvedValue({
      data: {
        data: {
          data: [
            {
              chatId: "room-1",
              msgId: "msg-1",
              text: "Serverdagi salom",
              createdAt: "2026-04-22T10:00:00.000Z",
              roomName: "Ali Friend",
              avatar: "avatar.png",
              isPinned: true,
            },
          ],
          nextCursor: "msg-1",
        },
      },
    });

    const results = await useChatStore
      .getState()
      .searchGlobalMessages("salom", { limit: 10, pinnedOnly: true });

    expect(api.get).toHaveBeenCalledWith("/chat/messages/search", {
      params: {
        q: "salom",
        limit: 10,
        pinnedOnly: true,
      },
    });
    expect(results).toEqual([
      expect.objectContaining({
        chatId: "room-1",
        msgId: "msg-1",
        text: "Serverdagi salom",
        senderName: "Ali Friend",
        avatar: "avatar.png",
        isPinned: true,
      }),
    ]);
    expect(useChatStore.getState().messageSearchCursor).toBe("msg-1");
  });
});
