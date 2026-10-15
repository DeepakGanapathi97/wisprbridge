import { test, expect } from "@playwright/test";

const PROD_URL = process.env.TEST_URL || "https://wisprbridge.vercel.app";

test.describe("WisprBridge Web & Data Isolation Production E2E Suite", () => {
  test("1. Web Desktop Gateway displays Join Room and Create Room without requiring login", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 }); // Desktop web viewport
    await page.goto(PROD_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Title verification
    await expect(page).toHaveTitle(/WisprBridge/);

    // Gateway heading
    await expect(page.getByRole("heading", { name: /WisprBridge/i })).toBeVisible({ timeout: 10000 });

    // Web option: Join Room
    await expect(page.getByRole("heading", { name: /Join a Room \/ Device/i })).toBeVisible();
    await expect(page.getByPlaceholder(/e\.g\. 582194/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Join Room/i })).toBeVisible();

    // Web option: Create New Room (Instant, zero login)
    await expect(page.getByRole("heading", { name: /Create a New Room/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Create Room/i })).toBeVisible();

    // Optional sign in button visible
    await expect(page.getByRole("button", { name: /Sign In \/ Sign Up \(Optional\)/i })).toBeVisible();
  });

  test("2. Web Desktop workspace features a prominent 'Pair Room' button in Header", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 }); // Desktop web viewport
    await page.goto(PROD_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Click Create Room to enter workspace
    const createBtn = page.getByRole("button", { name: /Create Room/i });
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    // In the Web Desktop workspace, verify prominent "Pair Room" button in header
    const pairRoomBtn = page.getByRole("button", { name: /Pair Room/i });
    await expect(pairRoomBtn).toBeVisible({ timeout: 10000 });

    // Active room code is visible
    const roomCodePill = page.locator("header div").filter({ hasText: /Room:/i }).first();
    await expect(roomCodePill).toBeVisible();

    // Clicking "Pair Room" on Desktop Web opens the Room & Group Pairing modal
    await pairRoomBtn.click();
    await expect(page.getByRole("heading", { name: /Room & Group Pairing/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Join Group/i })).toBeVisible();

    // Close modal
    const closeBtn = page.locator(".fixed.inset-0 button").filter({ has: page.locator("svg.lucide-x") }).first();
    await closeBtn.click();
    await expect(page.getByRole("heading", { name: /Room & Group Pairing/i })).not.toBeVisible();
  });

  test("3. Cross-Device Real-Time Sync & 1-Click Copy on Web Laptop", async ({ browser }) => {
    // Context 1: Mobile sender
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(PROD_URL);
    await mobilePage.evaluate(() => localStorage.clear());
    await mobilePage.reload();
    await mobilePage.waitForLoadState("domcontentloaded");

    // Mobile creates room
    const mobileCreateBtn = mobilePage.getByRole("button", { name: /Create Room/i });
    await expect(mobileCreateBtn).toBeVisible({ timeout: 10000 });
    await mobileCreateBtn.click();

    const mobileRoomBtn = mobilePage.locator("header div").filter({ hasText: /Room:/i }).first();
    await expect(mobileRoomBtn).toBeVisible({ timeout: 10000 });
    const roomText = await mobileRoomBtn.innerText();
    const pairCode = roomText.replace(/\D/g, "").slice(0, 6);
    expect(pairCode.length).toBe(6);

    // Context 2: Laptop Web receiver
    const laptopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const laptopPage = await laptopContext.newPage();
    // Connect directly via room query param
    await laptopPage.goto(`${PROD_URL}?code=${pairCode}`);
    await laptopPage.waitForLoadState("domcontentloaded");

    // Laptop should be in the room and have prominent "Pair Room" button
    await expect(laptopPage.getByRole("button", { name: /Pair Room/i })).toBeVisible({ timeout: 10000 });

    // Enable Auto-Copy on Laptop
    const laptopAutoCopy = laptopPage.getByRole("button", { name: /Auto-Copy/i });
    await laptopAutoCopy.click();
    await expect(laptopAutoCopy).toContainText("ON");

    // Mobile inputs prompt
    const testPrompt = `Sync Prompt ${Date.now()}: Real-time bridge test`;
    const mobileInput = mobilePage.getByPlaceholder(/Create unit tests|e\.g\./i);
    await mobileInput.fill(testPrompt);
    const mobileAddBtn = mobilePage.getByTitle(/Add and sync prompt/i);
    await mobileAddBtn.click();

    // Verify appears on laptop in real time
    const laptopCard = laptopPage.locator(".group").filter({ hasText: testPrompt });
    await expect(laptopCard).toBeVisible({ timeout: 15000 });

    // 1-Click Copy on laptop
    const copyBtn = laptopCard.locator("button[title*='Copy']");
    await copyBtn.click();
    const toast = laptopPage.locator(".fixed.bottom-20, .fixed.bottom-6");
    await expect(toast).toBeVisible({ timeout: 5000 });

    await mobileContext.close();
    await laptopContext.close();
  });

  test("4. Strict Per-Room Data Isolation: Prompts and Kept data NEVER leak across users/rooms", async ({ browser }) => {
    // Context A: User in Room 1
    const contextA = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const pageA = await contextA.newPage();
    await pageA.goto(PROD_URL);
    await pageA.evaluate(() => localStorage.clear());
    await pageA.reload();
    await pageA.waitForLoadState("domcontentloaded");

    // User A creates Room 1
    await pageA.getByRole("button", { name: /Create Room/i }).click();
    const roomAPill = pageA.locator("header div").filter({ hasText: /Room:/i }).first();
    await expect(roomAPill).toBeVisible({ timeout: 10000 });
    const roomAText = await roomAPill.innerText();
    const roomACode = roomAText.replace(/\D/g, "").slice(0, 6);

    // User A adds a private prompt and marks it Kept
    const promptSecretA = `Confidential User A Secret: ${Date.now()}`;
    const inputA = pageA.getByPlaceholder(/Create unit tests|e\.g\./i);
    await inputA.fill(promptSecretA);
    await pageA.getByTitle(/Add and sync prompt/i).click();

    const cardA = pageA.locator(".group").filter({ hasText: promptSecretA });
    await expect(cardA).toBeVisible({ timeout: 10000 });

    // User A keeps the prompt
    await cardA.locator("button[title*='Keep']").click();
    await expect(cardA.locator("span").filter({ hasText: /Kept/ }).first()).toBeVisible({ timeout: 5000 });

    // Context B: A completely different user in Room 2
    const contextB = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const pageB = await contextB.newPage();
    await pageB.goto(PROD_URL);
    await pageB.evaluate(() => localStorage.clear());
    await pageB.reload();
    await pageB.waitForLoadState("domcontentloaded");

    // User B creates a different Room 2
    await pageB.getByRole("button", { name: /Create Room/i }).click();
    const roomBPill = pageB.locator("header div").filter({ hasText: /Room:/i }).first();
    await expect(roomBPill).toBeVisible({ timeout: 10000 });
    const roomBText = await roomBPill.innerText();
    const roomBCode = roomBText.replace(/\D/g, "").slice(0, 6);

    // Verify Room codes are distinct
    expect(roomBCode).not.toEqual(roomACode);

    // CRITICAL SECURITY ASSERTION: User B must NEVER see User A's confidential prompt or kept data!
    await expect(pageB.locator(".group").filter({ hasText: promptSecretA })).not.toBeVisible();
    await expect(pageB.getByText("No prompts in this room yet")).toBeVisible();

    // Check User B's Kept tab
    await pageB.getByRole("button", { name: /Kept/i }).click();
    await expect(pageB.locator(".group").filter({ hasText: promptSecretA })).not.toBeVisible();
    await expect(pageB.getByText("No kept prompts yet")).toBeVisible();

    await contextA.close();
    await contextB.close();
  });

  test("5. Robust Auto-Copy Engine: Automatically writes incoming prompts to laptop clipboard", async ({ browser }) => {
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(PROD_URL);
    await mobilePage.evaluate(() => localStorage.clear());
    await mobilePage.reload();
    await mobilePage.waitForLoadState("domcontentloaded");

    // Mobile creates room
    await mobilePage.getByRole("button", { name: /Create Room/i }).click();
    const roomBtn = mobilePage.locator("header div").filter({ hasText: /Room:/i }).first();
    await expect(roomBtn).toBeVisible({ timeout: 10000 });
    const pairCode = (await roomBtn.innerText()).replace(/\D/g, "").slice(0, 6);

    // Laptop joins same room
    const laptopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const laptopPage = await laptopContext.newPage();
    await laptopPage.goto(`${PROD_URL}?code=${pairCode}`);
    await laptopPage.waitForLoadState("domcontentloaded");

    // Turn ON Auto-Copy on Laptop
    const autoCopyBtn = laptopPage.getByRole("button", { name: /Auto-Copy/i });
    await expect(autoCopyBtn).toBeVisible({ timeout: 10000 });
    await autoCopyBtn.click();
    await expect(autoCopyBtn).toContainText("ON");

    // Mobile submits prompt
    const autoCopyPrompt = `AutoCopy Test ${Date.now()}: whisper to clipboard`;
    const mobileInput = mobilePage.getByPlaceholder(/Create unit tests|e\.g\./i);
    await mobileInput.fill(autoCopyPrompt);
    await mobilePage.getByTitle(/Add and sync prompt/i).click();

    // Laptop tab brings to front and interacts to simulate active user session
    await laptopPage.bringToFront();
    await laptopPage.mouse.click(200, 200);

    // Verify prompt appears on laptop
    const laptopCard = laptopPage.locator(".group").filter({ hasText: autoCopyPrompt });
    await expect(laptopCard).toBeVisible({ timeout: 15000 });

    // Assert clipboard text contains the auto-copied prompt
    await expect.poll(async () => {
      return await laptopPage.evaluate(async () => {
        try {
          return await navigator.clipboard.readText();
        } catch {
          return "";
        }
      });
    }, { timeout: 12000 }).toContain(autoCopyPrompt);

    await mobileContext.close();
    await laptopContext.close();
  });
});
