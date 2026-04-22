import { describe, expect, it } from "vitest";
import {
  getStandaloneProfileTabPath,
  isStandaloneProfileTab,
} from "./profile-tab-navigation";

describe("profile-tab-navigation", () => {
  it("detects standalone profile tabs", () => {
    expect(isStandaloneProfileTab("health")).toBe(true);
    expect(isStandaloneProfileTab("profile")).toBe(false);
  });

  it("builds the standalone health path and removes overlay params", () => {
    expect(
      getStandaloneProfileTabPath(
        "health",
        "?profile=open&profileTab=health&source=drawer",
      ),
    ).toBe("/user/health?source=drawer");
  });

  it("returns the plain route when no extra params remain", () => {
    expect(getStandaloneProfileTabPath("health", "?tab=health")).toBe(
      "/user/health",
    );
  });

  it("returns null for inline tabs", () => {
    expect(getStandaloneProfileTabPath("profile", "?tab=profile")).toBeNull();
  });
});
