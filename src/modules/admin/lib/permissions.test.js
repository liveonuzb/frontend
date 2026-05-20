import { describe, expect, it } from "vitest";
import { hasAdminCapability, isSuperAdminRole } from "./permissions.js";

describe("admin permissions", () => {
  it("treats super admin as the only fallback admin role", () => {
    expect(isSuperAdminRole(["SUPER_ADMIN"])).toBe(true);
    expect(isSuperAdminRole(["READONLY_ADMIN"])).toBe(false);
    expect(hasAdminCapability(["SUPER_ADMIN"], "content.read")).toBe(true);
    expect(hasAdminCapability(["READONLY_ADMIN"], "content.read")).toBe(
      false,
    );
    expect(hasAdminCapability(["FINANCE"], "finance.read")).toBe(false);
  });
});
