import { test, expect } from "@playwright/test";

const PROD_URL = process.env.TEST_URL || "https://wisprbridge.vercel.app";

test.describe("WisprBridge Production E2E Suite", () => {
  test("1. Production page loads with Google Eloquent styling and brand elements", async ({ page }) => {
    await page.goto(PROD_URL);
    await page.waitForLoadState("domcontentloaded");

    // Title verification
    await expect(page).toHaveTitle(/WisprBridge/);

    // Brand header
    const brand = page.locator("h1");
    await expect(brand).toContainText("WisprBridge");

    // Eloquent Status Pill
    const statusPill = page.locator("header div").filter({ hasText: /On|Syncing/ }).first();
    await expect(statusPill).toBeVisible();

    // Auto-Copy switch pill
    const autoCopyBtn = page.getByRole("button", { name: /Auto-Copy/i });
    await expect(autoCopyBtn).toBeVisible();

    // Tabs
    const allTab = page.getByRole("button", { name: /All prompts/i });
    const keptTab = page.getByRole("button", { name: /Kept/i });
    await expect(allTab).toBeVisible();
    await expect(keptTab).toBeVisible();

    // Eloquent Input Bar & Circular + button
    const inputField = page.getByPlaceholder(/Create unit tests|e\.g\./i);
    await expect(inputField).toBeVisible();

    const addBtn = page.getByTitle(/Add and sync prompt/i);
    await expect(addBtn).toBeVisible();
  });

  test("2. Device Pairing Modal & 6-digit room code generation", async ({ page }) => {
    await page.goto(PROD_URL);
    await page.waitForLoadState("domcontentloaded");

    // Click room pill in header
    const roomBtn = page.locator("header button").filter({ hasText: /Room:/i });
    await expect(roomBtn).toBeVisible({ timeout: 10000 });
    await roomBtn.click();

    // Modal should appear
    const modalHeading = page.getByRole("heading", { name: /Device Pairing/i });
    await expect(modalHeading).toBeVisible();

    // 6-digit code display
    const codeDisplay = page.locator("span.font-mono.text-3xl");
    await expect(codeDisplay).toBeVisible();
    const codeText = await codeDisplay.textContent();
    expect(codeText?.replace(/\D/g, "").length).toBe(6);

    // Close modal
    const closeBtn = page.locator("button").filter({ has: page.locator("svg.lucide-x") }).first();
    await closeBtn.click();
    await expect(modalHeading).not.toBeVisible();
  });

  test("3. End-to-End Cross-Device Sync, Keep, Modal Reader, Copy, and Delete", async ({ browser }) => {
    // Context 1: Mobile sender
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 }, // Mobile viewport
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(PROD_URL);
    await mobilePage.waitForLoadState("domcontentloaded");

    // Retrieve mobile's room code
    const mobileRoomBtn = mobilePage.locator("header button").filter({ hasText: /Room:/i });
    await expect(mobileRoomBtn).toBeVisible({ timeout: 10000 });
    const roomText = await mobileRoomBtn.innerText();
    const pairCode = roomText.replace(/\D/g, "").slice(0, 6);
    expect(pairCode.length).toBe(6);

    // Context 2: Work Laptop receiver
    const laptopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 }, // Laptop viewport
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const laptopPage = await laptopContext.newPage();
    // Connect directly via room query param
    await laptopPage.goto(`${PROD_URL}?code=${pairCode}`);
    await laptopPage.waitForLoadState("domcontentloaded");

    // Verify laptop is paired to the exact same room
    const laptopRoomBtn = laptopPage.locator("header button").filter({ hasText: /Room:/i });
    await expect(laptopRoomBtn).toContainText(pairCode, { timeout: 10000 });

    // Enable Auto-Copy on Laptop
    const laptopAutoCopy = laptopPage.getByRole("button", { name: /Auto-Copy/i });
    await laptopAutoCopy.click();
    await expect(laptopAutoCopy).toContainText("ON");

    // STEP A: Mobile inputs prompt (simulating Whisper Flow speech-to-text)
    const testPromptText = `Prompt Test ${Date.now()}: Refactor auth hook for WisprBridge`;
    const mobileInput = mobilePage.getByPlaceholder(/Create unit tests|e\.g\./i);
    await mobileInput.fill(testPromptText);

    const mobileAddBtn = mobilePage.getByTitle(/Add and sync prompt/i);
    await mobileAddBtn.click();

    // STEP B: Verify prompt appears on mobile
    const mobilePromptCard = mobilePage.locator(".group").filter({ hasText: testPromptText });
    await expect(mobilePromptCard).toBeVisible({ timeout: 10000 });

    // STEP C: Verify prompt arrives on laptop in real-time
    const laptopPromptCard = laptopPage.locator(".group").filter({ hasText: testPromptText });
    await expect(laptopPromptCard).toBeVisible({ timeout: 15000 });

    // Verify card metadata: timestamp and TTL or Kept status
    await expect(laptopPromptCard.locator("span").filter({ hasText: /left|Kept/ })).toBeVisible({ timeout: 10000 });

    // Verify Copy button is next to Delete button
    const copyBtn = laptopPromptCard.locator("button[title*='Copy']");
    const deleteBtn = laptopPromptCard.locator("button[title*='Delete']");
    await expect(copyBtn).toBeVisible();
    await expect(deleteBtn).toBeVisible();

    // STEP D: Test 1-Click Copy on laptop
    await copyBtn.click();
    // Verify toast notification
    const toast = laptopPage.locator(".fixed.bottom-20, .fixed.bottom-6");
    await expect(toast).toBeVisible({ timeout: 5000 });

    // STEP E: Test "Keep" toggle (prevents 1-hour self-destruct)
    const keepBtn = laptopPromptCard.locator("button[title*='Keep']");
    await keepBtn.click();
    await expect(laptopPromptCard.locator("span").filter({ hasText: /Kept/ })).toBeVisible({ timeout: 5000 });

    // Check Kept tab filter
    const keptTab = laptopPage.getByRole("button", { name: /Kept/i });
    await keptTab.click();
    await expect(laptopPromptCard).toBeVisible();

    // Switch back to All tab
    const allTab = laptopPage.getByRole("button", { name: /All prompts/i });
    await allTab.click();

    // STEP F: Test Floating Prompt Reader Modal
    await laptopPromptCard.locator("p").first().click();
    const readerModal = laptopPage.locator(".fixed.inset-0").filter({ hasText: /Prompt Details|words|characters/i });
    await expect(readerModal).toBeVisible();
    await expect(readerModal).toContainText(testPromptText);

    // Close modal
    const closeReaderBtn = readerModal.locator("button[title*='Close']");
    await closeReaderBtn.click();
    await expect(readerModal).not.toBeVisible();

    // STEP G: Delete Prompt
    await deleteBtn.click();
    await expect(laptopPromptCard).not.toBeVisible({ timeout: 8000 });

    // Also verify deleted on mobile
    await expect(mobilePromptCard).not.toBeVisible({ timeout: 8000 });

    await mobileContext.close();
    await laptopContext.close();
  });
});
