import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FriendsContainer from "./index.jsx";
import { useDeleteQuery, useGetQuery, usePostQuery } from "@/hooks/api";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  setBreadcrumbs: vi.fn(),
  invalidateQueries: vi.fn(),
  postMutation: vi.fn(),
  deleteMutation: vi.fn(),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");

  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

vi.mock("@/components/page-transition", () => ({
  default: ({ children, className }) => (
    <div className={className} data-testid="page-transition">
      {children}
    </div>
  ),
}));

vi.mock("@/store", () => ({
  useBreadcrumbStore: () => ({ setBreadcrumbs: mocks.setBreadcrumbs }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: vi.fn(),
  usePostQuery: vi.fn(),
  useDeleteQuery: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    message: vi.fn(),
    success: vi.fn(),
  },
}));

const friends = [
  {
    id: "friend-1",
    name: "Alisher",
    username: "alisher",
    avatarUrl: "",
  },
];

const incomingRequests = [
  {
    id: "request-1",
    createdAt: "2026-05-21T10:00:00.000Z",
    requester: {
      id: "friend-2",
      name: "Sardor",
      username: "sardor",
      avatarUrl: "",
    },
  },
];

const outgoingRequests = [
  {
    id: "request-2",
    addressee: {
      id: "friend-3",
      name: "Dilshod",
      username: "dilshod",
      avatarUrl: "",
    },
  },
];

const suggestions = [
  {
    id: "friend-4",
    name: "Madina",
    username: "madina",
    avatarUrl: "",
    mutualFriendCount: 2,
  },
];

const apiResponse = (data) => ({ data: { data } });

const renderFriends = (initialEntries = ["/user/friends"]) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <FriendsContainer />
    </MemoryRouter>,
  );

describe("FriendsContainer", () => {
  beforeEach(() => {
    mocks.navigate.mockClear();
    mocks.setBreadcrumbs.mockClear();
    mocks.invalidateQueries.mockClear();
    mocks.postMutation.mockReset();
    mocks.deleteMutation.mockReset();

    vi.mocked(useGetQuery).mockImplementation(({ url }) => {
      if (url === "/users/me/friends") {
        return {
          data: apiResponse({ items: friends }),
          isLoading: false,
        };
      }

      if (url === "/users/me/friends/requests") {
        return {
          data: apiResponse({
            incoming: incomingRequests,
            outgoing: outgoingRequests,
          }),
          isLoading: false,
        };
      }

      if (url === "/users/me/friends/suggestions") {
        return {
          data: apiResponse({ items: suggestions }),
          isLoading: false,
        };
      }

      if (url === "/users/search") {
        return {
          data: apiResponse({ items: [] }),
          isLoading: false,
        };
      }

      return { data: apiResponse(null), isLoading: false };
    });
    vi.mocked(usePostQuery).mockReturnValue({
      mutateAsync: mocks.postMutation,
    });
    vi.mocked(useDeleteQuery).mockReturnValue({
      mutateAsync: mocks.deleteMutation,
    });
  });

  it("renders the standard page shell, summary cards, and friend requests", () => {
    renderFriends();

    expect(
      screen.getByRole("heading", { level: 1, name: "Do'stlar" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Jami do'stlar")).toBeInTheDocument();
    expect(screen.getAllByText("Kelgan so'rovlar")).toHaveLength(2);
    expect(screen.getByText("Yuborilgan so'rovlar")).toBeInTheDocument();
    expect(screen.getByText("Do'stlar ro'yxati")).toBeInTheDocument();
    expect(screen.getByText("Alisher")).toBeInTheDocument();
    expect(screen.getByText("Sardor")).toBeInTheDocument();
    expect(screen.queryByText("Community")).not.toBeInTheDocument();
    expect(
      screen.getByText("Do'stlar ro'yxati").closest("[data-slot=card]"),
    ).toBeInTheDocument();
  });

  it("opens the suggestions tab from the header add action", () => {
    renderFriends();

    fireEvent.click(screen.getByRole("button", { name: /Do'st qo'shish/i }));

    expect(screen.getByText("Tavsiya qilingan do'stlar")).toBeInTheDocument();
    expect(screen.getByText("Madina")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Do'st bo'lish/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Bekor qilish/i }),
    ).toBeInTheDocument();
  });

  it("opens the chat for a selected friend", () => {
    renderFriends();

    fireEvent.click(screen.getByRole("button", { name: /Chat/i }));

    expect(mocks.navigate).toHaveBeenCalledWith("/user/chat?userId=friend-1");
  });
});
