import { describe, expect, it } from "vitest";
import {
  isRunningLiveImmersivePath,
  shouldHideMobileNavForPath,
} from "./layout-route-state.js";

describe("user layout route state", () => {
  it("uses immersive layout only for running live routes", () => {
    expect(
      isRunningLiveImmersivePath("/user/workout/running/live/workout-1"),
    ).toBe(true);
    expect(isRunningLiveImmersivePath("/user/workout/running")).toBe(false);
    expect(isRunningLiveImmersivePath("/user/workout/running/workout-1")).toBe(
      false,
    );
    expect(isRunningLiveImmersivePath("/user/workout/home")).toBe(false);
  });

  it("keeps normal mobile navigation outside chat and running live", () => {
    expect(
      shouldHideMobileNavForPath("/user/workout/running/live/workout-1"),
    ).toBe(true);
    expect(shouldHideMobileNavForPath("/user/chat/room-1")).toBe(true);
    expect(shouldHideMobileNavForPath("/user/workout/running")).toBe(false);
    expect(shouldHideMobileNavForPath("/user/workout/running/workout-1")).toBe(
      false,
    );
  });
});
