import { describe, expect, it, vi } from "vitest";

import { map } from "lodash";

describe("WORKOUT_NAV_ITEMS", () => {
  it("hides the Running tab when the running feature flag is disabled", async () => {
    vi.resetModules();
    vi.doMock("@/config.js", () => ({
      config: {
        runningFeatureEnabled: false,
      },
    }));

    const { WORKOUT_NAV_ITEMS } = await import("./workout-nav-items.js");

    expect(map(WORKOUT_NAV_ITEMS, (item) => item.label)).not.toContain(
      "Running",
    );
  });

  it("shows the Running tab by default", async () => {
    vi.resetModules();
    vi.doMock("@/config.js", () => ({
      config: {
        runningFeatureEnabled: true,
      },
    }));

    const { WORKOUT_NAV_ITEMS } = await import("./workout-nav-items.js");

    expect(map(WORKOUT_NAV_ITEMS, (item) => item.label)).toContain("Running");
  });
});
