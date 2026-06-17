import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const files = [
  "src/modules/user/containers/report/daily-report.jsx",
  "src/modules/user/containers/report/daily-report-drawer.jsx",
  "src/modules/user/containers/report/ten-day-report.jsx",
  "src/modules/user/containers/dashboard/daily-review-drawer.jsx",
  "src/modules/user/containers/dashboard/ten-day-popup-drawer.jsx",
  "src/modules/user/containers/dashboard/use-dashboard-ai-insights.js",
];

describe("user report API contract", () => {
  it("uses canonical nutrition report routes instead of tracking report aliases", () => {
    const combinedSource = files
      .map((file) => readFileSync(join(process.cwd(), file), "utf8"))
      .join("\n");

    expect(combinedSource).not.toContain("/user/tracking/reports/");
    expect(combinedSource).toContain("/user/nutrition/reports/daily");
    expect(combinedSource).toContain("/user/nutrition/reports/range");
  });
});
