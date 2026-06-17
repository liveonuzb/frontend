import { describe, expect, it } from "vitest";
import {
  getRecipeActionId,
  normalizeRecipeForUi,
} from "./recipe-ui-utils.js";

describe("recipe UI utils", () => {
  it("normalizes display recipe ids into numeric API action ids", () => {
    expect(getRecipeActionId({ id: "recipe-101" })).toBe(101);
    expect(getRecipeActionId({ catalogFoodId: 102, id: "recipe-102" })).toBe(
      102,
    );
    expect(getRecipeActionId({ foodId: "103" })).toBe(103);
    expect(getRecipeActionId({ id: "tovuqli-quinoa-salatasi" })).toBe("");
  });

  it("maps backend recipe relation and tag fields into UI detail fields", () => {
    expect(
      normalizeRecipeForUi({
        id: 101,
        dietaryTags: ["high-protein"],
        allergenTags: ["gluten"],
        categories: [
          { id: 2, name: "Lunch", translations: { uz: "Tushlik" } },
        ],
        cuisines: [
          { id: 5, name: "Uzbek", translations: { uz: "O'zbek" } },
        ],
      }),
    ).toEqual(
      expect.objectContaining({
        tags: ["high-protein"],
        allergens: ["gluten"],
        category: "Tushlik",
        categoryLabels: ["Tushlik"],
        cuisineLabels: ["O'zbek"],
      }),
    );
  });
});
