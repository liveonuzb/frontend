import { describe, expect, it } from "vitest";
import { getChatSocketConnectionConfig } from "./chat-store.js";

describe("getChatSocketConnectionConfig", () => {
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
});
