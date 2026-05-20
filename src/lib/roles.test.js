import { describe, expect, it } from "vitest";
import { normalizeRoles } from "./roles";

describe("normalizeRoles", () => {
  it("keeps ADMIN out of frontend auth roles", () => {
    expect(normalizeRoles(["ADMIN"])).toEqual([]);
    expect(normalizeRoles(["SUPER_ADMIN"])).toEqual(["SUPER_ADMIN"]);
    expect(normalizeRoles(["USER", "ADMIN", "FINANCE"])).toEqual([
      "USER",
      "FINANCE",
    ]);
  });
});
