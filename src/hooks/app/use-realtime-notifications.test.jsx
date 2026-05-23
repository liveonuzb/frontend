import React from "react";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRealtimeNotifications } from "./use-realtime-notifications.js";

const {
  disconnectSocketMock,
  initSocketMock,
  invalidateQueriesMock,
  socketHandlers,
  socketMock,
  useAuthStoreMock,
  useChatStoreMock,
} = vi.hoisted(() => {
  const socketHandlers = {};
  const socketMock = {
    on: vi.fn((event, handler) => {
      socketHandlers[event] = handler;
    }),
    off: vi.fn(),
  };
  const initSocketMock = vi.fn();
  const disconnectSocketMock = vi.fn();
  const chatState = {
    socket: socketMock,
    initSocket: initSocketMock,
    disconnectSocket: disconnectSocketMock,
  };
  const authState = {
    user: { id: "user-1" },
    activeRole: "USER",
    token: "access-token",
  };
  const useChatStoreMock = vi.fn((selector) => selector(chatState));
  const useAuthStoreMock = vi.fn((selector) => selector(authState));
  const invalidateQueriesMock = vi.fn();

  return {
    disconnectSocketMock,
    initSocketMock,
    invalidateQueriesMock,
    socketHandlers,
    socketMock,
    useAuthStoreMock,
    useChatStoreMock,
  };
});

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: invalidateQueriesMock,
  }),
}));

vi.mock("@/store", () => ({
  useAuthStore: (...args) => useAuthStoreMock(...args),
  useChatStore: (...args) => useChatStoreMock(...args),
}));

vi.mock("@/hooks/app/use-notifications", () => ({
  USER_NOTIFICATIONS_QUERY_KEY: ["me", "notifications"],
}));

vi.mock("@/hooks/app/use-premium", () => ({
  PREMIUM_QUERY_KEY: ["me", "premium"],
}));

vi.mock("@/hooks/app/use-profile-settings", () => ({
  ME_QUERY_KEY: ["me"],
}));

vi.mock("@/hooks/app/use-ai-access", () => ({
  AI_USAGE_STATUS_QUERY_KEY: ["user", "ai-usage", "status"],
}));

const Harness = () => {
  useRealtimeNotifications();
  return <div>ready</div>;
};

describe("useRealtimeNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(socketHandlers).forEach((key) => {
      delete socketHandlers[key];
    });
  });

  it("connects to the shared socket and invalidates notification, premium, profile, and AI access data", async () => {
    render(<Harness />);

    expect(initSocketMock).toHaveBeenCalledTimes(1);
    expect(socketMock.on).toHaveBeenCalledWith(
      "notification:created",
      expect.any(Function),
    );

    socketHandlers["notification:created"]({ userId: "user-1" });

    await waitFor(() => {
      expect(invalidateQueriesMock).toHaveBeenCalledWith({
        queryKey: ["me", "notifications"],
      });
      expect(invalidateQueriesMock).toHaveBeenCalledWith({
        queryKey: ["me", "premium"],
      });
      expect(invalidateQueriesMock).toHaveBeenCalledWith({
        queryKey: ["me"],
      });
      expect(invalidateQueriesMock).toHaveBeenCalledWith({
        queryKey: ["user", "ai-usage", "status"],
      });
    });
  });
});
