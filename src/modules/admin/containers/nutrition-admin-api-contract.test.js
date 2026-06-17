import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const source = (relativePath) =>
  readFileSync(join(process.cwd(), relativePath), "utf8");

describe("admin nutrition API contracts", () => {
  it("uses canonical ingredient price endpoints in the price editor", () => {
    const priceSource = source(
      "src/modules/admin/containers/ingredients/price/index.jsx",
    );

    expect(priceSource).toContain(
      "`/admin/nutrition/ingredient-prices/${id}`",
    );
    expect(priceSource).toContain(
      "`/admin/nutrition/ingredient-prices/${id}/regional-prices`",
    );
    expect(priceSource).toContain(
      "`/admin/nutrition/ingredient-prices/${id}/regional-prices/${priceId}`",
    );
    expect(priceSource).not.toContain("`/admin/ingredients/${id}/price`");
    expect(priceSource).not.toContain(
      "`/admin/ingredients/${id}/regional-prices`",
    );
  });

  it("starts nutrition import and export jobs through canonical admin roots", () => {
    const foodsSource = source(
      "src/modules/admin/containers/foods/list/index.jsx",
    );
    const ingredientsSource = source(
      "src/modules/admin/containers/ingredients/list/index.jsx",
    );
    const reportsSource = source(
      "src/modules/admin/containers/reports/list/index.jsx",
    );

    expect(foodsSource).toContain('url: "/admin/nutrition/foods/export/jobs"');
    expect(foodsSource).toContain('url: "/admin/nutrition/foods/import/jobs"');
    expect(reportsSource).toContain(
      'startExportJob("/admin/nutrition/foods/export/jobs")',
    );
    expect(ingredientsSource).toContain(
      'url: "/admin/nutrition/ingredients/import/jobs"',
    );
    expect(foodsSource).not.toContain('url: "/admin/foods/export/jobs"');
    expect(foodsSource).not.toContain('url: "/admin/foods/import/jobs"');
    expect(reportsSource).not.toContain(
      'startExportJob("/admin/foods/export/jobs")',
    );
    expect(ingredientsSource).not.toContain(
      'url: "/admin/ingredients/import/jobs"',
    );
  });
});
