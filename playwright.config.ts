import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 120000,
  expect: { timeout: 15000 },
  use: {
    actionTimeout: 15000,
    baseURL: "http://localhost:3000",
    ...devices["Desktop Chrome"],
    launchOptions: { channel: "chrome" },
    trace: "retain-on-failure",
  },
  reporter: "list",
});
