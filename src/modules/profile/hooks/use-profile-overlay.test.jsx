import { describe, expect, it } from "vitest";
import {
  PROFILE_OVERVIEW_TAB,
  getNormalizedProfileOverlayState,
} from "./use-profile-overlay";

describe("getNormalizedProfileOverlayState", () => {
  it("keeps a valid overlay tab", () => {
    expect(
      getNormalizedProfileOverlayState({
        profileState: "open",
        profileTab: "health",
      }),
    ).toEqual({
      isProfileOpen: true,
      activeProfileTab: "health",
      shouldSanitize: false,
    });
  });

  it("falls back to overview for invalid overlay tabs", () => {
    expect(
      getNormalizedProfileOverlayState({
        profileState: "open",
        profileTab: "unknown-tab",
      }),
    ).toEqual({
      isProfileOpen: true,
      activeProfileTab: PROFILE_OVERVIEW_TAB,
      shouldSanitize: true,
    });
  });

  it("ignores profileTab when the overlay is closed", () => {
    expect(
      getNormalizedProfileOverlayState({
        profileState: null,
        profileTab: "health",
      }),
    ).toEqual({
      isProfileOpen: false,
      activeProfileTab: PROFILE_OVERVIEW_TAB,
      shouldSanitize: false,
    });
  });
});
