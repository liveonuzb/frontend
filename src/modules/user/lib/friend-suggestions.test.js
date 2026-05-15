import { describe, expect, it } from "vitest";
import { buildFriendSuggestionRows } from "./friend-suggestions.js";

describe("buildFriendSuggestionRows", () => {
  it("adds outgoing requests when backend suggestions exclude pending users", () => {
    expect(
      buildFriendSuggestionRows({
        suggestions: [{ id: "user-1", name: "Malika", username: "malika" }],
        outgoingRequests: [
          {
            id: "request-2",
            addressee: {
              id: "user-2",
              name: "Berlin Germany",
              username: "berlin",
            },
          },
        ],
      }),
    ).toEqual([
      expect.objectContaining({
        id: "user-2",
        requestId: "request-2",
        friendshipStatus: "request_sent",
      }),
      expect.objectContaining({
        id: "user-1",
        friendshipStatus: null,
      }),
    ]);
  });

  it("attaches outgoing request ids to request_sent search results", () => {
    expect(
      buildFriendSuggestionRows({
        sourceUsers: [
          {
            id: "user-2",
            firstName: "Berlin",
            lastName: "Germany",
            username: "berlin",
            avatar: "https://cdn.example/avatar.jpg",
            friendshipStatus: "request_sent",
          },
        ],
        outgoingRequests: [
          {
            id: "request-2",
            addressee: { id: "user-2", name: "Berlin Germany" },
          },
        ],
        includeOutgoingRows: false,
      }),
    ).toEqual([
      expect.objectContaining({
        id: "user-2",
        name: "Berlin Germany",
        avatarUrl: "https://cdn.example/avatar.jpg",
        requestId: "request-2",
        friendshipStatus: "request_sent",
      }),
    ]);
  });

  it("excludes friends and incoming request users", () => {
    expect(
      buildFriendSuggestionRows({
        suggestions: [
          { id: "friend-1", name: "Friend" },
          { id: "incoming-1", name: "Incoming" },
          { id: "available-1", name: "Available" },
        ],
        friends: [{ id: "friend-1" }],
        incomingRequests: [
          { id: "incoming-request-1", requester: { id: "incoming-1" } },
        ],
      }),
    ).toEqual([
      expect.objectContaining({
        id: "available-1",
        name: "Available",
      }),
    ]);
  });
});
