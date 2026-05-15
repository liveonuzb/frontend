import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { chatStoreMock } = vi.hoisted(() => ({
  chatStoreMock: {
    contacts: [],
    messages: {},
    typingUsers: {},
    pinnedMessages: {},
    fetchMessages: vi.fn(),
    fetchRooms: vi.fn(),
    sendMessage: vi.fn(),
    addReaction: vi.fn(),
    deleteMessage: vi.fn(),
    forwardMessage: vi.fn(),
    retryMessage: vi.fn(),
    editMessage: vi.fn(),
    setTyping: vi.fn(),
    markAsRead: vi.fn(),
    unpinMessage: vi.fn(),
    pinMessage: vi.fn(),
    toggleBookmark: vi.fn(),
    sendBooking: vi.fn(),
    getAISuggestions: vi.fn(),
    activeLive: null,
    startLive: vi.fn(),
    endLive: vi.fn(),
    toggleMuteChat: vi.fn(),
    toggleBlockChat: vi.fn(),
    isChatMuted: vi.fn(() => false),
    isChatBlocked: vi.fn(() => false),
    getPinnedMessages: vi.fn(() => []),
  },
}));

vi.mock("@/hooks/api/use-api.js", () => ({
  api: {
    post: vi.fn(),
  },
}));

vi.mock("@/store", () => ({
  useAuthStore: () => ({ activeRole: "USER" }),
  useChatStore: () => chatStoreMock,
}));

vi.mock("@/hooks/app/use-coach", () => ({
  useCoachClientDetail: () => ({
    detail: null,
    createWeeklyCheckIn: vi.fn(),
    createFeedback: vi.fn(),
    createTask: vi.fn(),
    isCreatingWeeklyCheckIn: false,
    isCreatingFeedback: false,
    isCreatingTask: false,
  }),
  useCoachClientNotes: () => ({
    createNote: vi.fn(),
    isCreatingNote: false,
  }),
}));

vi.mock("@/components/chat/message-context-menu", () => ({
  default: () => null,
}));

vi.mock("@/components/chat/media-upload-dialog", () => ({
  default: () => null,
}));

vi.mock("@/components/chat/forward-dialog", () => ({
  default: () => null,
}));

vi.mock("../../components/ChatActionShortcutDialog", () => ({
  default: () => null,
}));

vi.mock("../../components/LiveStreamOverlay", () => ({
  default: () => null,
}));

import { api } from "@/hooks/api/use-api.js";
import ChatView from "./index.jsx";

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

const renderChatRoute = (initialEntry) => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/chat",
        element: (
          <>
            <ChatView />
            <LocationProbe />
          </>
        ),
      },
      {
        path: "/user/chat/:chatId",
        element: (
          <>
            <ChatView />
            <LocationProbe />
          </>
        ),
      },
    ],
    { initialEntries: [initialEntry] },
  );

  render(<RouterProvider router={router} />);
};

describe("ChatView direct user route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chatStoreMock.fetchRooms.mockResolvedValue(undefined);
  });

  it("resolves userId query into a direct chat room route", async () => {
    api.post.mockResolvedValue({
      data: {
        data: {
          roomId: "room-1",
        },
      },
    });

    renderChatRoute("/user/chat?userId=user-2");

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/chat/rooms", { userId: "user-2" });
    });
    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/user/chat/room-1",
      );
    });
    expect(chatStoreMock.fetchRooms).toHaveBeenCalledTimes(1);
  });
});
