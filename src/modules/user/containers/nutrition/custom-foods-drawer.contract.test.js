import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(
    process.cwd(),
    "src/modules/user/containers/nutrition/custom-foods-drawer.jsx",
  ),
  "utf8",
);

describe("custom foods drawer API contract", () => {
  it("uses the canonical nutrition custom foods API root", () => {
    expect(source).toContain("NUTRITION_CUSTOM_FOODS_API_ROOT");
    expect(source).not.toContain("/users/me/custom-foods");
  });
});
