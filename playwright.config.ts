import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "https://friendli-beta.vercel.app",
    headless: true,
    viewport: { width: 430, height: 932 },
    actionTimeout: 10000,
    trace: "off",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
});
