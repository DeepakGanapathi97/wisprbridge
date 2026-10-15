import { test, expect } from "@playwright/test";

const PROD_URL = process.env.TEST_URL || "https://wisprbridge.vercel.app";

test.describe("WisprBridge Production E2E Suite", () => {
  test("1. Gateway displays Join Room/Group & Sign In/Sign Up options", async ({ page }) => {
    // Clear localStorage to ensure fresh visitor state
    await page.goto(PROD_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Title verification
    await expect(page).toHaveTitle(/WisprBridge/);

    // Gateway heading
    await expect(page.getByRole("heading", { name: /Welcome to WisprBridge/i })).toBeVisible({ timeout: 10000 });

    // Option 1: Join Room or Group
    await expect(page.getByRole("heading", { name: /Join a Room or Group/i })).toBeVisible();
    await expect(page.getByPlaceholder(/e\.g\. 582194/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Join Room/i })).toBeVisible();

    // Option 2: Sign In / Create Account
    await expect(page.getByRole("heading", { name: /Sign In \/ Create Account/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign In \/ Sign Up/i })).toBeVisible();
  });

  test("2. Floating Auth Modal (Sign In / Sign Up) interaction", async ({ page }) => {
    await page.goto(PROD_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Click Sign In / Sign Up button on Gateway
    const authBtn = page.getByRole("button", { name: /Sign In \/ Sign Up/i });
    await expect(authBtn).toBeVisible({ timeout: 10000 });
    await authBtn.click();

    // Modal should be visible
    const modalHeading = page.getByRole("heading", { name: /Sign In to WisprBridge|Create Your Account/i });
    await expect(modalHeading).toBeVisible();

    // Inputs
    await expect(page.getByPlaceholder("developer@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();

    // Toggle between Sign In and Sign Up
    const toggleBtn = page.getByRole("button", { name: /Don't have an account\?|Already have an account\?/i });
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();
    await expect(page.getByRole("heading", { name: /Create Your Account/i })).toBeVisible();

    // Close modal
    const closeBtn = page.locator(".fixed.inset-0 button").filter({ has: page.locator("svg.lucide-x") }).first();
    await closeBtn.click();
    await expect(modalHeading).not.toBeVisible();
  });

  test("3. Guest Room creation & Room/Group Pairing Modal", async ({ page }) => {
    await page.goto(PROD_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Click quick guest room
    const guestBtn = page.getByRole("button", { name: /start a quick temporary guest room/i });
    await expect(guestBtn).toBeVisible({ timeout: 10000 });
    await guestBtn.click();

    // Now in active bridge workspace
    const roomBtn = page.locator("header button").filter({ hasText: /Room:/i });
    await expect(roomBtn).toBeVisible({ timeout: 10000 });
    const roomText = await roomBtn.innerText();
    const pairCode = roomText.replace(/\D/g, "").slice(0, 6);
    expect(pairCode.length).toBe(6);

    // Click to open Room & Group Pairing modal
    await roomBtn.click();
    await expect(page.getByRole("heading", { name: /Room & Group Pairing/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Join Group/i })).toBeVisible();

    // Close modal
    const closeBtn = page.locator(".fixed.inset-0 button").filter({ has: page.locator("svg.lucide-x") }).first();
    await closeBtn.click();
    await expect(page.getByRole("heading", { name: /Room & Group Pairing/i })).not.toBeVisible();
  });

  test("4. Cross-Device Sync, Auto-Copy, Keep, Reader Modal, and Delete", async ({ browser }) => {
    // Context 1: Mobile host (starts a room)
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(PROD_URL);
    await mobilePage.evaluate(() => localStorage.clear());
    await mobilePage.reload();
    await mobilePage.waitForLoadState("domcontentloaded");

    // Start mobile room
    const mobileGuestBtn = mobilePage.getByRole("button", { name: /start a quick temporary guest room/i });
    await expect(mobileGuestBtn).toBeVisible({ timeout: 10000 });
    await mobileGuestBtn.click();

    const mobileRoomBtn = mobilePage.locator("header button").filter({ hasText: /Room:/i });
    await expect(mobileRoomBtn).toBeVisible({ timeout: 10000 });
    const roomText = await mobileRoomBtn.innerText();
    const pairCode = roomText.replace(/\D/g, "").slice(0, 6);
    expect(pairCode.length).toBe(6);

    // Context 2: Laptop receiver (joins via 6-digit code or direct URL)
    const laptopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const laptopPage = await laptopContext.newPage();
    await laptopPage.goto(`${PROD_URL}?code=${pairCode}`);
    await laptopPage.waitForLoadState("domcontentloaded");

    // Laptop should be in the room
    const laptopRoomBtn = laptopPage.locator("header button").filter({ hasText: /Room:/i });
    await expect(laptopRoomBtn).toContainText(pairCode, { timeout: 10000 });

    // Enable Auto-Copy on Laptop
    const laptopAutoCopy = laptopPage.getByRole("button", { name: /Auto-Copy/i });
    await laptopAutoCopy.click();
    await expect(laptopAutoCopy).toContainText("ON");

    // Mobile sends prompt (Whisper Flow speech-to-text simulation)
    const testPrompt = `Sync Prompt ${Date.now()}: Test real-time bridge across mobile & laptop`;
    const mobileInput = mobilePage.getByPlaceholder(/Create unit tests|e\.g\./i);
    await mobileInput.fill(testPrompt);
    const mobileAddBtn = mobilePage.getByTitle(/Add and sync prompt/i);
    await mobileAddBtn.click();

    // Verify appears on mobile
    const mobileCard = mobilePage.locator(".group").filter({ hasText: testPrompt });
    await expect(mobileCard).toBeVisible({ timeout: 10000 });

    // Verify appears on laptop in real time
    const laptopCard = laptopPage.locator(".group").filter({ hasText: testPrompt });
    await expect(laptopCard).toBeVisible({ timeout: 15000 });

    // Verify card metadata: timestamp and 1-hour TTL
    await expect(laptopCard.locator("span").filter({ hasText: /left|Kept/ }).first()).toBeVisible({ timeout: 10000 });

    // Verify Copy button is next to Delete button
    const copyBtn = laptopCard.locator("button[title*='Copy']");
    const deleteBtn = laptopCard.locator("button[title*='Delete']");
    await expect(copyBtn).toBeVisible();
    await expect(deleteBtn).toBeVisible();

    // 1-Click Copy
    await copyBtn.click();
    const toast = laptopPage.locator(".fixed.bottom-20, .fixed.bottom-6");
    await expect(toast).toBeVisible({ timeout: 5000 });

    // Keep toggle
    const keepBtn = laptopCard.locator("button[title*='Keep']");
    await keepBtn.click();
    await expect(laptopCard.locator("span").filter({ hasText: /Kept/ }).first()).toBeVisible({ timeout: 5000 });

    // Reader Modal
    await laptopCard.locator("p").first().click();
    const readerModal = laptopPage.locator(".fixed.inset-0").filter({ hasText: /words|characters/i });
    await expect(readerModal).toBeVisible();
    await expect(readerModal).toContainText(testPrompt);

    const closeReaderBtn = readerModal.locator("button[title*='Close']");
    await closeReaderBtn.click();
    await expect(readerModal).not.toBeVisible();

    // Delete
    await deleteBtn.click();
    await expect(laptopCard).not.toBeVisible({ timeout: 8000 });

    await mobileContext.close();
    await laptopContext.close();
  });

  test("5. Settings Modal & Self-Destruction Lifecycle display", async ({ page }) => {
    await page.goto(PROD_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Start guest room to access settings
    const guestBtn = page.getByRole("button", { name: /start a quick temporary guest room/i });
    await expect(guestBtn).toBeVisible({ timeout: 10000 });
    await guestBtn.click();

    // Open settings
    const settingsBtn = page.getByRole("button", { name: /Settings/i });
    await expect(settingsBtn).toBeVisible({ timeout: 10000 });
    await settingsBtn.click();

    // Verify settings content
    const settingsHeading = page.getByRole("heading", { name: /Settings & Rules/i });
    await expect(settingsHeading).toBeVisible();
    await expect(page.getByText(/1-Hour Rolling Self-Destruct/i)).toBeVisible();

    // Close settings
    const doneBtn = page.getByRole("button", { name: /Done/i });
    await doneBtn.click();
    await expect(settingsHeading).not.toBeVisible();
  });
});
