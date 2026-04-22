import { describe, expect, it } from "vitest";
import { getFriendItems, getFriendRequests } from "./friends-response.js";

describe("friends response helpers", () => {
  it("reads items from wrapped friends/candidates responses", () => {
    expect(
      getFriendItems({
        data: {
          data: {
            items: [
              {
                id: "e69c0cf1-34a3-4a08-8270-956fc706e4fa",
                name: "Fazliddin Liveon",
              },
            ],
          },
          meta: {
            timestamp: "2026-04-22T06:52:13.186Z",
          },
        },
      }),
    ).toEqual([
      {
        id: "e69c0cf1-34a3-4a08-8270-956fc706e4fa",
        name: "Fazliddin Liveon",
      },
    ]);
  });

  it("reads friend request groups from wrapped responses", () => {
    expect(
      getFriendRequests({
        data: {
          data: {
            incoming: [{ id: "incoming-1" }],
            outgoing: [{ id: "outgoing-1" }],
          },
        },
      }),
    ).toEqual({
      incoming: [{ id: "incoming-1" }],
      outgoing: [{ id: "outgoing-1" }],
    });
  });
});
