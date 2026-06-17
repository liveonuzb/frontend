import { describe, expect, it } from "vitest";
import { getNutritionBreadcrumbTitle } from "./nutrition-breadcrumbs.js";

describe("nutrition breadcrumbs", () => {
  it("resolves entry view titles", () => {
    expect(getNutritionBreadcrumbTitle("home")).toBe("Ovqatlanish");
    expect(getNutritionBreadcrumbTitle("plans")).toBe("Ovqatlanish rejalari");
    expect(getNutritionBreadcrumbTitle("report")).toBe(
      "Ovqatlanish hisobotlari",
    );
  });
});
