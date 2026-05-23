import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MobileNav from "./mobile-nav.jsx";
import { useChatStore } from "@/store";

vi.mock("@/components/fab", () => ({
  default: () => <button type="button">FAB</button>,
}));

const profileOverlayMocks = {
  openProfile: vi.fn(),
};

vi.mock("@/modules/profile/hooks/use-profile-overlay", () => ({
  PROFILE_OVERVIEW_TAB: "overview",
  useProfileOverlay: () => ({
    isProfileOpen: false,
    openProfile: profileOverlayMocks.openProfile,
  }),
}));

const initialChatState = useChatStore.getState();

const renderMobileNav = () =>
  render(
    <MemoryRouter initialEntries={["/user/dashboard"]}>
      <MobileNav />
    </MemoryRouter>,
  );

const setChatState = ({ contacts = [] } = {}) => {
  const initSocket = vi.fn();
  const fetchRooms = vi.fn();
  const disconnectSocket = vi.fn();

  useChatStore.setState({
    contacts,
    initSocket,
    fetchRooms,
    disconnectSocket,
  });

  return { initSocket, fetchRooms, disconnectSocket };
};

describe("MobileNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profileOverlayMocks.openProfile.mockClear();
    setChatState();
  });

  afterEach(() => {
    cleanup();
    useChatStore.setState({
      contacts: [],
      initSocket: initialChatState.initSocket,
      fetchRooms: initialChatState.fetchRooms,
      disconnectSocket: initialChatState.disconnectSocket,
    });
  });

  it("replaces Report with Chat and starts chat sync", () => {
    const { initSocket, fetchRooms, disconnectSocket } = setChatState();

    const { unmount } = renderMobileNav();

    expect(screen.queryByTitle("Report")).not.toBeInTheDocument();
    expect(screen.getByTitle("Chat")).toHaveAttribute("href", "/user/chat");
    expect(initSocket).toHaveBeenCalledTimes(1);
    expect(fetchRooms).toHaveBeenCalledTimes(1);

    unmount();

    expect(disconnectSocket).toHaveBeenCalledTimes(1);
  });

  it("shows the total unread message count on the Chat badge", () => {
    setChatState({
      contacts: [
        { id: "room-1", unreadCount: 5 },
        { id: "room-2", unreadCount: 7 },
        { id: "room-3", unreadCount: 0 },
      ],
    });

    renderMobileNav();

    expect(
      screen.getByLabelText("Chat, 12 ta o'qilmagan xabar"),
    ).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("caps large unread badge values at 99+", () => {
    setChatState({
      contacts: [
        { id: "room-1", unreadCount: 75 },
        { id: "room-2", unreadCount: 40 },
      ],
    });

    renderMobileNav();

    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("does not show a badge when there are no unread messages", () => {
    setChatState({
      contacts: [
        { id: "room-1", unreadCount: 0 },
        { id: "room-2", unreadCount: null },
      ],
    });

    renderMobileNav();

    expect(screen.getByLabelText("Chat")).toBeInTheDocument();
    expect(
      screen.queryByText(/ta o'qilmagan xabar/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("opens the profile drawer from the mobile profile item", () => {
    renderMobileNav();

    fireEvent.click(screen.getByLabelText("Profil"));

    expect(profileOverlayMocks.openProfile).toHaveBeenCalledTimes(1);
    expect(profileOverlayMocks.openProfile).toHaveBeenCalledWith("overview");
  });
});
