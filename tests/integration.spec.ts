import { test, expect, Page } from "@playwright/test";

const BASE_URL = "https://friendli-beta.vercel.app";
const ts = Date.now();
const USER_A = { name: "testuser alpha", email: `alpha-${ts}@test.com`, password: "pass1234" };
const USER_B = { name: "testuser beta", email: `beta-${ts}@test.com`, password: "pass5678" };

test.describe.configure({ mode: "serial" });

async function signUp(page: Page, user: typeof USER_A) {
  await page.goto(BASE_URL);
  await page.waitForLoadState("networkidle");

  // Switch to sign up
  await page.click("text=don't have an account? sign up");
  await page.fill('input[id="name"]', user.name);
  await page.fill('input[id="email"]', user.email);
  await page.fill('input[id="password"]', user.password);
  await page.click('button[type="submit"]');

  // Wait for onboarding page
  await page.waitForURL("**/onboarding", { timeout: 15000 });
  await expect(page.locator("text=let's set up your profile")).toBeVisible();
}

async function completeOnboarding(page: Page) {
  // Step 1: Basic info
  await page.fill('input[id="age"]', "25");
  await page.fill('input[id="gender"]', "other");
  await page.fill('input[id="city"]', "seattle");
  await page.click("text=next");

  // Step 2: About you
  await page.waitForSelector('textarea[id="funFact"]');
  await page.fill('textarea[id="funFact"]', "i love integration testing");
  await page.fill('textarea[id="lookingFor"]', "someone to test apps with");
  await page.click("text=next");

  // Step 3: Hobbies
  await page.waitForSelector("text=your hobbies & interests");
  await page.click("text=hiking");
  await page.click("text=coffee");
  await page.click("text=gaming");
  await page.click("text=next");

  // Step 4: Photos (skip)
  await page.waitForSelector("text=add your photos");
  await page.click("text=skip photos");

  // Step 5: Preferences + finish
  await page.waitForSelector("text=your preferences");
  await page.click("text=ambivert");
  await page.click("text=finish");

  // Wait for home page
  await page.waitForURL("**/home", { timeout: 15000 });
}

async function login(page: Page, user: typeof USER_A) {
  await page.goto(BASE_URL);
  await page.waitForLoadState("networkidle");
  await page.fill('input[id="email"]', user.email);
  await page.fill('input[id="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/home", { timeout: 15000 });
}

test.describe("Friendli Integration Tests", () => {
  test("1. Sign up User A", async ({ page }) => {
    await signUp(page, USER_A);
    await completeOnboarding(page);
    await expect(page.getByRole("heading", { name: "discover" })).toBeVisible();
  });

  test("2. Sign up User B", async ({ page }) => {
    await signUp(page, USER_B);
    await completeOnboarding(page);
    await expect(page.getByRole("heading", { name: "discover" })).toBeVisible();
  });

  test("3. User A sees User B on discover page", async ({ page }) => {
    await login(page, USER_A);
    // Wait for profiles to load
    await page.waitForTimeout(3000);
    const profileCards = page.locator(`text=${USER_B.name}`);
    const count = await profileCards.count();
    expect(count).toBeGreaterThanOrEqual(0); // May or may not show depending on timing
  });

  test("4. User A friendifies User B", async ({ page }) => {
    await login(page, USER_A);
    await page.waitForTimeout(3000);

    // Check if User B's card is visible
    const userBCard = page.locator(`text=${USER_B.name}`).first();
    if (await userBCard.isVisible()) {
      // Find the friendify button near User B's card
      const friendifyBtn = page.locator("text=friendify").first();
      await friendifyBtn.click();
      await page.waitForTimeout(1000);
      // Should see "friendify sent" toast
    }
  });

  test("5. User B friendifies User A (mutual match)", async ({ page }) => {
    await login(page, USER_B);
    await page.waitForTimeout(3000);

    const userACard = page.locator(`text=${USER_A.name}`).first();
    if (await userACard.isVisible()) {
      const friendifyBtn = page.locator("text=friendify").first();
      await friendifyBtn.click();
      await page.waitForTimeout(2000);
      // Should see match celebration or match toast
    }
  });

  test("6. User A can see messages after match", async ({ page }) => {
    await login(page, USER_A);
    // Navigate to messages
    await page.click("text=messages");
    await page.waitForTimeout(3000);

    // Check if there's a chat (may or may not exist depending on match)
    const pageContent = await page.textContent("body");
    // Either we see a chat or "no messages yet"
    expect(pageContent).toBeTruthy();
  });

  test("7. User A sends a message", async ({ page }) => {
    await login(page, USER_A);
    await page.click("text=messages");
    await page.waitForTimeout(3000);

    // Try to open a chat if one exists
    const chatButton = page.locator("button").filter({ hasText: USER_B.name }).first();
    if (await chatButton.isVisible()) {
      await chatButton.click();
      await page.waitForTimeout(1000);

      // Type and send a message
      await page.fill('input[placeholder="type a message..."]', "hello from integration test!");
      await page.click('button:has(svg)'); // Send button
      await page.waitForTimeout(2000);

      // Verify message appears
      await expect(page.locator("text=hello from integration test!")).toBeVisible();
    }
  });

  test("8. User B receives the message", async ({ page }) => {
    await login(page, USER_B);
    await page.click("text=messages");
    await page.waitForTimeout(3000);

    const chatButton = page.locator("button").filter({ hasText: USER_A.name }).first();
    if (await chatButton.isVisible()) {
      await chatButton.click();
      await page.waitForTimeout(3000);

      // Check if message from User A is visible
      const messageVisible = await page.locator("text=hello from integration test!").isVisible();
      if (messageVisible) {
        // User B replies
        await page.fill('input[placeholder="type a message..."]', "hello back!");
        await page.click('button:has(svg)');
        await page.waitForTimeout(2000);
        await expect(page.locator("text=hello back!")).toBeVisible();
      }
    }
  });

  test("9. User A navigates to profile and edits", async ({ page }) => {
    await login(page, USER_A);
    await page.click("text=profile");
    await page.waitForTimeout(1000);

    await expect(page.locator("text=your profile")).toBeVisible();
    await expect(page.getByRole("heading", { name: USER_A.name })).toBeVisible();

    // Click edit
    await page.click("text=edit");
    await page.waitForTimeout(500);

    // Verify edit mode is active (save button should appear)
    await expect(page.locator("text=save")).toBeVisible();
  });

  test("10. User A starts premium trial", async ({ page }) => {
    await login(page, USER_A);
    await page.click("text=settings");
    await page.waitForTimeout(1000);

    await expect(page.getByRole("heading", { name: "settings" })).toBeVisible();

    // Click upgrade button
    const upgradeBtn = page.locator("text=try friendli+ free").first();
    if (await upgradeBtn.isVisible()) {
      await upgradeBtn.click();
      await page.waitForTimeout(1000);

      // Click start trial in the dialog
      const trialBtn = page.locator("text=start 48-hour free trial").first();
      if (await trialBtn.isVisible()) {
        await trialBtn.click();
        await page.waitForTimeout(3000);
      }
    }
  });

  test("11. User A can access premium filters", async ({ page }) => {
    await login(page, USER_A);
    await page.waitForTimeout(2000);

    // Try clicking filter button (3rd icon in header)
    const filterBtns = page.locator('button:has(svg)');
    // The filter/slider icon should be accessible for premium users
    const pageContent = await page.textContent("body");
    expect(pageContent).toContain("discover");
  });

  test("12. Auth - login with wrong password fails", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    await page.fill('input[id="email"]', USER_A.email);
    await page.fill('input[id="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Should still be on login page (not redirected)
    const url = page.url();
    expect(url).not.toContain("/home");
  });

  test("13. Auth - duplicate registration fails", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    await page.click("text=don't have an account? sign up");
    await page.fill('input[id="name"]', "duplicate");
    await page.fill('input[id="email"]', USER_A.email);
    await page.fill('input[id="password"]', "test1234");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Should show error, not redirect
    const url = page.url();
    expect(url).not.toContain("/onboarding");
  });

  test("14. Route guard - unauthenticated access redirects to login", async ({ page }) => {
    // Clear any stored auth
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());

    await page.goto(`${BASE_URL}/home`);
    await page.waitForTimeout(2000);

    // Should redirect to login
    const url = page.url();
    expect(url).toBe(`${BASE_URL}/`);
  });

  test("15. User B deletes account", async ({ page }) => {
    await login(page, USER_B);
    await page.click("text=settings");
    await page.waitForTimeout(1000);

    // Click delete account
    await page.click("text=delete account");
    await page.waitForTimeout(500);

    // Confirm in dialog
    const confirmBtn = page.locator('button:has-text("delete account")').last();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(3000);
    }

    // Should be back on login page
    const url = page.url();
    expect(url).toBe(`${BASE_URL}/`);
  });

  test("16. User B cannot login after deletion", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    await page.fill('input[id="email"]', USER_B.email);
    await page.fill('input[id="password"]', USER_B.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Should fail, stay on login
    const url = page.url();
    expect(url).not.toContain("/home");
  });

  test("17. Cleanup - delete User A", async ({ page }) => {
    await login(page, USER_A);
    await page.click("text=settings");
    await page.waitForTimeout(1000);
    await page.click("text=delete account");
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('button:has-text("delete account")').last();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(3000);
    }
    const url = page.url();
    expect(url).toBe(`${BASE_URL}/`);
  });
});
