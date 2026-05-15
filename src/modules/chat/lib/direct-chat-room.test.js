import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/api/use-api.js", () => ({
  api: {
    post: vi.fn(),
  },
}));

import { api } from "@/hooks/api/use-api.js";
import { findOrCreateDirectChatRoom } from "./direct-chat-room.js";

describe("findOrCreateDirectChatRoom", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates or resolves a direct room for a target user", async () => {
    api.post.mockResolvedValue({
      data: {
        data: {
          roomId: "room-1",
        },
      },
    });

    await expect(findOrCreateDirectChatRoom(" user-2 ")).resolves.toBe("room-1");
    expect(api.post).toHaveBeenCalledWith("/chat/rooms", { userId: "user-2" });
  });

  it("throws for an empty target user id", async () => {
    await expect(findOrCreateDirectChatRoom("   ")).rejects.toThrow(
      "Target user id is required.",
    );
    expect(api.post).not.toHaveBeenCalled();
  });
});
