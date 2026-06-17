import { describe, expect, it } from "vitest";
import {
  getStandaloneProfileTabPath,
  isStandaloneProfileTab,
} from "./profile-tab-navigation";

describe("profile-tab-navigation", () => {
  it("detects standalone profile tabs", () => {
    expect(isStandaloneProfileTab("health")).toBe(false);
    expect(isStandaloneProfileTab("profile")).toBe(false);
  });

  it("does not build standalone paths for routed overlay tabs", () => {
    expect(
      getStandaloneProfileTabPath("health", "?source=drawer"),
    ).toBeNull();
  });

  it("returns null when no standalone tab route exists", () => {
    expect(getStandaloneProfileTabPath("health", "?tab=health")).toBe(
      null,
    );
  });

  it("returns null for inline tabs", () => {
    expect(getStandaloneProfileTabPath("profile", "?tab=profile")).toBeNull();
  });
});
