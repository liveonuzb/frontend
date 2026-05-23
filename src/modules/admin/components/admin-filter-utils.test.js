import { describe, expect, it } from "vitest";
import { buildAdminFilterParams } from "./admin-filter-utils.js";

describe("admin filter utils", () => {
  it("trims text filter values without throwing", () => {
    expect(() =>
      buildAdminFilterParams([
        {
          key: "name",
          value: "  Ali  ",
          operator: "contains",
          defaultOperator: "contains",
          trim: true,
        },
      ]),
    ).not.toThrow();

    expect(
      buildAdminFilterParams([
        {
          key: "name",
          value: "  Ali  ",
          operator: "contains",
          defaultOperator: "contains",
          trim: true,
        },
      ]),
    ).toEqual({ name: "Ali" });
  });

  it("omits whitespace-only trimmed text filters", () => {
    expect(
      buildAdminFilterParams([
        {
          key: "name",
          value: "   ",
          operator: "contains",
          defaultOperator: "contains",
          trim: true,
        },
      ]),
    ).toEqual({});
  });
});
