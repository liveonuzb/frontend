import { describe, expect, it } from "vitest";

import { contentNav } from "./admin-layout-navigation.js";

describe("admin layout navigation", () => {
  it("exposes recipes as a first-class content section", () => {
    expect(contentNav).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          to: "/admin/recipes/list",
          label: "Retseptlar",
          capability: "content.read",
        }),
      ]),
    );
  });
});
