import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FriendActivityFeed from "./friend-activity-feed.jsx";
import { useGetQuery } from "@/hooks/api";

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/hooks/api", () => ({
  useGetQuery: vi.fn(),
}));

const friends = [
  { id: "f1", name: "Alisher", avatarUrl: "" },
  { id: "f2", name: "Madina", avatarUrl: "", isOnline: true },
  { id: "f3", name: "Sardor", avatarUrl: "" },
  { id: "f4", name: "Dilshod", avatarUrl: "" },
];

describe("FriendActivityFeed", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    vi.mocked(useGetQuery).mockReturnValue({ data: null });
  });

  it("renders friends as a compact avatar preview without an extra add avatar", () => {
    render(
      <MemoryRouter>
        <FriendActivityFeed
          friends={friends}
          challenges={[]}
          currentUserId="me"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Do'stlar")).toBeInTheDocument();
    expect(
      screen.getByText("Do'stlar").closest("[data-slot=card]"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Barchasi" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Alisher")).toBeInTheDocument();
    expect(screen.getByText("Madina")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Do'st qo'shish/i }),
    ).not.toBeInTheDocument();
  });

  it("opens the friends page from the view-all action", () => {
    render(
      <MemoryRouter>
        <FriendActivityFeed
          friends={friends}
          challenges={[]}
          currentUserId="me"
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Barchasi" }));

    expect(navigateMock).toHaveBeenCalledWith("/user/friends");
  });

  it("renders an empty state with an add friend action", () => {
    const onAddFriend = vi.fn();

    render(
      <MemoryRouter>
        <FriendActivityFeed
          friends={[]}
          challenges={[]}
          currentUserId="me"
          onAddFriend={onAddFriend}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Do'stlar").closest("[data-slot=card]"),
    ).toBeInTheDocument();
    expect(screen.getByText("Hali do'stlaringiz yo'q")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Qo'shish" }));

    expect(onAddFriend).toHaveBeenCalledTimes(1);
  });
});
