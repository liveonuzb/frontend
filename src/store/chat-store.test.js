import { beforeEach, describe, expect, it, vi } from "vitest";

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
    post: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

import { api } from "@/hooks/api/use-api.js";
import { toast } from "sonner";
import useAuthStore from "./auth-store.js";
import useChatStore, { getChatSocketConnectionConfig } from "./chat-store.js";

describe("getChatSocketConnectionConfig", () => {
  beforeEach(() => {
    localStorage.clear();
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

  it("removes the optimistic message when HTTP persistence fails", async () => {
    api.post.mockRejectedValue(new Error("network error"));

    await useChatStore.getState().sendMessage("room-1", "Yo'qoldi");

    expect(useChatStore.getState().messages["room-1"]).toEqual([]);
    expect(toast.error).toHaveBeenCalledWith("Xabar yuborishda xatolik");
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
});
