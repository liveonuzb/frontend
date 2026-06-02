import map from "lodash/map";
import { describe, expect, it } from "vitest";
import { getUserTrackingNavItems } from "./user-nav-items.js";

describe("getUserTrackingNavItems", () => {
  it("temporarily hides challenges and leaderboard from user navigation", () => {
    const paths = map(getUserTrackingNavItems(), "to");

    expect(paths).toContain("/user/dashboard");
    expect(paths).toContain("/user/friends");
    expect(paths).not.toContain("/user/challenges");
    expect(paths).not.toContain("/user/leaderboard");
  });
});
