import { describe, expect, it } from "vitest";
import { buildFriendRequestPayload } from "./friend-request-payload.js";

describe("buildFriendRequestPayload", () => {
  it("builds strict friend request payloads with targetUserId", () => {
    expect(
      buildFriendRequestPayload({
        targetUserId: " user-1 ",
        message: " Salom ",
      }),
    ).toEqual({
      targetUserId: "user-1",
      message: "Salom",
    });
  });

  it("omits recipientId and blank messages", () => {
    expect(
      buildFriendRequestPayload({
        targetUserId: "user-1",
        recipientId: "legacy-user",
        message: "   ",
      }),
    ).toEqual({
      targetUserId: "user-1",
    });
  });
});
