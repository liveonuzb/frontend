import { describe, expect, it, vi } from "vitest";

import map from "lodash/map";

describe("WORKOUT_NAV_ITEMS", () => {
  it("exposes the redesigned five-tab workout navigation without Running", async () => {
    vi.resetModules();
    vi.doMock("@/config.js", () => ({
      config: {
        runningFeatureEnabled: true,
      },
    }));

    const { WORKOUT_NAV_ITEMS } = await import("./workout-nav-items.js");

    expect(map(WORKOUT_NAV_ITEMS, (item) => item.label)).toEqual([
      "Overview",
      "Plans",
      "Exercises",
      "History",
      "Report",
    ]);
  });

  it("keeps Running hidden even when the legacy running feature flag is enabled", async () => {
    vi.resetModules();
    vi.doMock("@/config.js", () => ({
      config: {
        runningFeatureEnabled: true,
      },
    }));

    const { WORKOUT_NAV_ITEMS } = await import("./workout-nav-items.js");

    expect(map(WORKOUT_NAV_ITEMS, (item) => item.to)).not.toContain(
      "/user/workout/running",
    );
  });
});
