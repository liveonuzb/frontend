/* global process */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3030",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "uz-UZ",
    timezoneId: "Asia/Tashkent",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        permissions: ["geolocation"],
        geolocation: { latitude: 41.311081, longitude: 69.240562 },
      },
    },
  ],
  webServer:
    process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1"
      ? undefined
      : {
          command: "npm run dev -- --host 127.0.0.1",
          url: "http://127.0.0.1:3030",
          reuseExistingServer: true,
          timeout: 120000,
        },
});
