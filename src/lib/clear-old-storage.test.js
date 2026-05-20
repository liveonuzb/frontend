import { beforeEach, describe, expect, it } from "vitest";
import { clearOldClientStorage } from "./clear-old-storage.js";

describe("clearOldClientStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("storage_version", "v2");
  });

  it("removes obsolete persisted store keys without clearing active storage", () => {
    const obsoleteKeys = [
      "journal-storage",
      "workout-storage",
      "recipes-storage",
      "order-storage",
      "wearable-storage",
      "gallery-storage",
      "tour-storage",
    ];

    for (const key of obsoleteKeys) {
      localStorage.setItem(key, "old state");
    }
    localStorage.setItem("language-storage", "active state");
    sessionStorage.setItem("auth-storage", "active session");

    clearOldClientStorage();

    for (const key of obsoleteKeys) {
      expect(localStorage.getItem(key)).toBeNull();
    }
    expect(localStorage.getItem("language-storage")).toBe("active state");
    expect(sessionStorage.getItem("auth-storage")).toBe("active session");
  });
});
