import { test, expect, Browser, BrowserContext, Page } from "@playwright/test";

const BASE_URL = "https://friendli-beta.vercel.app";
const ts = Date.now();
const USER_A = {
  name: "screenshot alpha",
  email: `ss-alpha-${ts}@test.com`,
  password: "testpass1234",
};
const USER_B = {
  name: "screenshot beta",
  email: `ss-beta-${ts}@test.com`,
  password: "testpass5678",
};

const SCREENSHOT_DIR = "ui-screenshots";

function ssPath(name: string): string {
  return `${SCREENSHOT_DIR}/${name}.png`;
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: ssPath(name), fullPage: true });
}

test.describe.configure({ mode: "serial" });

test.describe("Friendli Screenshot Integration Test", () => {
  let browser: Browser;
  let contextA: BrowserContext;
  let contextB: BrowserContext;
  let pageA: Page;
  let pageB: Page;

  test.beforeAll(async ({ browser: b }) => {
    browser = b;
    contextA = await browser.newContext({
      viewport: { width: 430, height: 932 },
    });
    contextA.setDefaultTimeout(15000);
    pageA = await contextA.newPage();
  });

  test.afterAll(async () => {
    await contextA?.close();
    await contextB?.close();
  });

  // ─── User A: Sign Up & Onboarding ───────────────────────────────

  test("01-login-page", async () => {
    await pageA.goto(BASE_URL);
    await pageA.waitForLoadState("networkidle");
    await screenshot(pageA, "01-login-page");
  });

  test("02-signup-form", async () => {
    await pageA.click("text=don't have an account? sign up");
    await pageA.waitForTimeout(500);
    await screenshot(pageA, "02-signup-form");
  });

  test("03-signup-filled", async () => {
    await pageA.fill('input[id="name"]', USER_A.name);
    await pageA.fill('input[id="email"]', USER_A.email);
    await pageA.fill('input[id="password"]', USER_A.password);
    await screenshot(pageA, "03-signup-filled");

    // Submit
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL("**/onboarding", { timeout: 15000 });
    await expect(pageA.locator("text=let's set up your profile")).toBeVisible();
  });

  test("04-onboarding-step1", async () => {
    await pageA.fill('input[id="age"]', "22");
    await pageA.fill('input[id="gender"]', "female");
    await pageA.fill('input[id="city"]', "seattle");
    await screenshot(pageA, "04-onboarding-step1");

    await pageA.click("text=next");
  });

  test("05-onboarding-step2", async () => {
    await pageA.waitForSelector('textarea[id="funFact"]');
    await pageA.fill('textarea[id="funFact"]', "i can solve a rubik's cube in under a minute");
    await pageA.fill('textarea[id="lookingFor"]', "friends who like board games and hiking");
    await screenshot(pageA, "05-onboarding-step2");

    await pageA.click("text=next");
  });

  test("06-onboarding-step3", async () => {
    await pageA.waitForSelector("text=your hobbies & interests");
    await pageA.click("text=hiking");
    await pageA.click("text=coffee");
    await pageA.click("text=gaming");
    await screenshot(pageA, "06-onboarding-step3");

    await pageA.click("text=next");
  });

  test("07-onboarding-step4", async () => {
    await pageA.waitForSelector("text=add your photos");
    await screenshot(pageA, "07-onboarding-step4");

    await pageA.click("text=skip photos");
  });

  test("08-onboarding-step5", async () => {
    await pageA.waitForSelector("text=your preferences");
    await pageA.click("text=ambivert");
    await screenshot(pageA, "08-onboarding-step5");

    await pageA.click("text=finish");
    await pageA.waitForURL("**/home", { timeout: 15000 });
  });

  // ─── User A: Explore the app ────────────────────────────────────

  test("09-discover-empty", async () => {
    await pageA.waitForTimeout(2000);
    await screenshot(pageA, "09-discover-empty");
  });

  test("10-profile-view", async () => {
    await pageA.click("text=profile");
    await pageA.waitForTimeout(1000);
    await expect(pageA.locator("text=your profile")).toBeVisible();
    await screenshot(pageA, "10-profile-view");
  });

  test("11-profile-edit", async () => {
    await pageA.click("text=edit");
    await pageA.waitForTimeout(500);
    await expect(pageA.locator("text=save")).toBeVisible();
    await screenshot(pageA, "11-profile-edit");

    // Cancel edit mode by clicking save or navigating away
    await pageA.click("text=save");
    await pageA.waitForTimeout(500);
  });

  test("12-settings-page", async () => {
    await pageA.click("text=settings");
    await pageA.waitForTimeout(1000);
    await screenshot(pageA, "12-settings-page");
  });

  test("13-premium-dialog", async () => {
    const upgradeBtn = pageA.locator("text=try friendli+ free").first();
    if (await upgradeBtn.isVisible()) {
      await upgradeBtn.click();
      await pageA.waitForTimeout(1000);
      await screenshot(pageA, "13-premium-dialog");
    } else {
      // Take screenshot of current state anyway
      await screenshot(pageA, "13-premium-dialog");
    }
  });

  test("14-premium-trial-started", async () => {
    const trialBtn = pageA.locator("text=start 48-hour free trial").first();
    if (await trialBtn.isVisible()) {
      await trialBtn.click();
      await pageA.waitForTimeout(3000);
    }
    await screenshot(pageA, "14-premium-trial-started");
  });

  test("15-messages-empty", async () => {
    await pageA.click("text=messages");
    await pageA.waitForTimeout(1000);
    await screenshot(pageA, "15-messages-empty");
  });

  // ─── User B: Sign Up & Onboarding ──────────────────────────────

  test("16-user-b-signup", async () => {
    contextB = await browser.newContext({
      viewport: { width: 430, height: 932 },
    });
    contextB.setDefaultTimeout(15000);
    pageB = await contextB.newPage();

    await pageB.goto(BASE_URL);
    await pageB.waitForLoadState("networkidle");
    await pageB.click("text=don't have an account? sign up");
    await pageB.fill('input[id="name"]', USER_B.name);
    await pageB.fill('input[id="email"]', USER_B.email);
    await pageB.fill('input[id="password"]', USER_B.password);
    await screenshot(pageB, "16-user-b-signup");

    await pageB.click('button[type="submit"]');
    await pageB.waitForURL("**/onboarding", { timeout: 15000 });
  });

  test("17-user-b-onboarding", async () => {
    // Step 1
    await pageB.fill('input[id="age"]', "24");
    await pageB.fill('input[id="gender"]', "male");
    await pageB.fill('input[id="city"]', "seattle");
    await pageB.click("text=next");

    // Step 2
    await pageB.waitForSelector('textarea[id="funFact"]');
    await pageB.fill('textarea[id="funFact"]', "i once ate 50 tacos in one sitting");
    await pageB.fill('textarea[id="lookingFor"]', "adventure buddies");
    await pageB.click("text=next");

    // Step 3
    await pageB.waitForSelector("text=your hobbies & interests");
    await pageB.click("text=hiking");
    await pageB.click("text=coffee");
    await pageB.click("text=gaming");
    await pageB.click("text=next");

    // Step 4
    await pageB.waitForSelector("text=add your photos");
    await pageB.click("text=skip photos");

    // Step 5
    await pageB.waitForSelector("text=your preferences");
    await pageB.click("text=ambivert");
    await screenshot(pageB, "17-user-b-onboarding");

    await pageB.click("text=finish");
    await pageB.waitForURL("**/home", { timeout: 15000 });
  });

  test("18-user-b-discovers-a", async () => {
    await pageB.waitForTimeout(3000);
    await screenshot(pageB, "18-user-b-discovers-a");
  });

  test("19-user-b-friendifies-a", async () => {
    const userACard = pageB.locator(`text=${USER_A.name}`).first();
    if (await userACard.isVisible({ timeout: 5000 }).catch(() => false)) {
      const friendifyBtn = pageB.locator("text=friendify").first();
      if (await friendifyBtn.isVisible()) {
        await friendifyBtn.click();
        await pageB.waitForTimeout(2000);
      }
    }
    await screenshot(pageB, "19-user-b-friendifies-a");
  });

  // ─── User A: Discovers B and Matches ────────────────────────────

  test("20-user-a-discovers-b", async () => {
    // Navigate User A back to discover
    await pageA.click("text=discover");
    await pageA.waitForTimeout(3000);
    await screenshot(pageA, "20-user-a-discovers-b");
  });

  test("21-user-a-friendifies-b", async () => {
    const userBCard = pageA.locator(`text=${USER_B.name}`).first();
    if (await userBCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      const friendifyBtn = pageA.locator("text=friendify").first();
      if (await friendifyBtn.isVisible()) {
        await friendifyBtn.click();
        await pageA.waitForTimeout(2000);
      }
    }
    await screenshot(pageA, "21-user-a-friendifies-b");
  });

  test("22-match-celebration", async () => {
    // Give time for match overlay to appear
    await pageA.waitForTimeout(2000);
    await screenshot(pageA, "22-match-celebration");

    // Dismiss overlay if present
    const dismissBtn = pageA.locator("text=start chatting").first();
    if (await dismissBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dismissBtn.click();
      await pageA.waitForTimeout(500);
    } else {
      // Try other dismiss methods
      const closeBtn = pageA.locator("text=close").first();
      if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeBtn.click();
      }
    }
  });

  test("23-messages-with-match", async () => {
    await pageA.click("text=messages");
    await pageA.waitForTimeout(2000);
    await screenshot(pageA, "23-messages-with-match");
  });

  test("24-chat-opened", async () => {
    const chatEntry = pageA.locator(`text=${USER_B.name}`).first();
    if (await chatEntry.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatEntry.click();
      await pageA.waitForTimeout(1000);
    }
    await screenshot(pageA, "24-chat-opened");
  });

  test("25-message-sent", async () => {
    const msgInput = pageA.locator('input[placeholder="type a message..."]').first();
    if (await msgInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await msgInput.fill("hello from test!");
      await pageA.locator('button:has(svg)').last().click();
      await pageA.waitForTimeout(2000);
    }
    await screenshot(pageA, "25-message-sent");
  });

  test("26-message-received", async () => {
    // Switch to User B and check messages
    await pageB.click("text=messages");
    await pageB.waitForTimeout(2000);

    const chatEntry = pageB.locator(`text=${USER_A.name}`).first();
    if (await chatEntry.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatEntry.click();
      await pageB.waitForTimeout(2000);
    }
    await screenshot(pageB, "26-message-received");
  });

  // ─── Cleanup ────────────────────────────────────────────────────

  test("27-user-b-settings", async () => {
    await pageB.click("text=settings");
    await pageB.waitForTimeout(1000);
    await screenshot(pageB, "27-user-b-settings");
  });

  test("28-user-b-delete", async () => {
    await pageB.click("text=delete account");
    await pageB.waitForTimeout(500);
    const confirmBtn = pageB.locator('button:has-text("delete account")').last();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await pageB.waitForTimeout(3000);
    }
    await screenshot(pageB, "28-user-b-delete");
  });

  test("29-user-a-deleted-chat", async () => {
    // Navigate User A to messages to see deleted account state
    await pageA.click("text=messages");
    await pageA.waitForTimeout(2000);

    const chatEntry = pageA.locator(`text=${USER_B.name}`).first();
    if (await chatEntry.isVisible({ timeout: 3000 }).catch(() => false)) {
      await chatEntry.click();
      await pageA.waitForTimeout(1000);
    }
    await screenshot(pageA, "29-user-a-deleted-chat");
  });

  test("30-user-a-delete", async () => {
    await pageA.click("text=settings");
    await pageA.waitForTimeout(1000);
    await pageA.click("text=delete account");
    await pageA.waitForTimeout(500);
    const confirmBtn = pageA.locator('button:has-text("delete account")').last();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await pageA.waitForTimeout(3000);
    }
    await screenshot(pageA, "30-user-a-delete");
  });
});
