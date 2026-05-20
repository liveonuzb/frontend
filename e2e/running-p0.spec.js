import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "language-storage",
      JSON.stringify({
        state: { currentLanguage: "uz", hasSelectedLanguage: true },
        version: 0,
      }),
    );
    window.localStorage.setItem(
      "app-mode-storage",
      JSON.stringify({
        state: { mode: "madagascar" },
        version: 0,
      }),
    );
  });
});

test("guards the running route for anonymous launch traffic", async ({
  page,
}) => {
  await page.goto("/user/workout/running");

  await expect(page).toHaveURL(/\/auth\/sign-in/);
  await expect(page.getByRole("main")).toBeVisible();
});

test("loads the landing page and opens the launch funnel", async ({ page }) => {
  const warnings = [];
  page.on("console", (message) => {
    if (message.type() === "warning") {
      warnings.push(message.text());
    }
  });

  await page.route("**/api/v1/analytics/events", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: { accepted: true } }),
    });
  });

  await page.goto("/");
  await expect(page.getByRole("main")).toBeVisible();

  const startButton = page
    .getByRole("button", { name: /boshlash|start/i })
    .first();
  await expect(startButton).toBeVisible();
  await startButton.click();

  await expect(page).toHaveURL(/\/auth\/sign-up|\/auth\/select-mode/);
  expect(warnings.join("\n")).not.toContain("parent route path has no trailing");
});
