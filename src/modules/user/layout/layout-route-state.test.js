import { describe, expect, it } from "vitest";
import {
  isRunningLiveImmersivePath,
  shouldHideMobileNavForPath,
} from "./layout-route-state.js";

describe("user layout route state", () => {
  it("does not use immersive layout for running live routes", () => {
    expect(
      isRunningLiveImmersivePath("/user/workout/running/live/workout-1"),
    ).toBe(false);
    expect(isRunningLiveImmersivePath("/user/workout/running")).toBe(false);
    expect(isRunningLiveImmersivePath("/user/workout/running/workout-1")).toBe(
      false,
    );
    expect(isRunningLiveImmersivePath("/user/workout/home")).toBe(false);
  });

  it("keeps normal mobile navigation outside chat", () => {
    expect(
      shouldHideMobileNavForPath("/user/workout/running/live/workout-1"),
    ).toBe(false);
    expect(shouldHideMobileNavForPath("/user/chat/room-1")).toBe(true);
    expect(shouldHideMobileNavForPath("/user/workout/running")).toBe(false);
    expect(shouldHideMobileNavForPath("/user/workout/running/workout-1")).toBe(
      false,
    );
  });
});
