import { describe, expect, it } from "vitest";

import { buildLocalizedCatalogPayload } from "./localized-catalog-manager-utils.js";

describe("buildLocalizedCatalogPayload", () => {
  it("includes nutrition preference tag mapping only when enabled", () => {
    const form = {
      name: "Gluten sensitive",
      isActive: true,
      isOnboarding: true,
      dietaryTags: ["gluten-free"],
      allergenTags: ["gluten"],
    };

    expect(
      buildLocalizedCatalogPayload({
        form,
        currentLanguage: "uz",
        includeTagMapping: true,
      }),
    ).toMatchObject({
      name: "Gluten sensitive",
      dietaryTags: ["gluten-free"],
      allergenTags: ["gluten"],
    });

    expect(
      buildLocalizedCatalogPayload({
        form,
        currentLanguage: "uz",
        includeTagMapping: false,
      }),
    ).not.toHaveProperty("dietaryTags");
  });
});
