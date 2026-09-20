import { chromium } from "playwright";
import fs from "fs";

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();
  console.log("Navigating...");
  await page.goto("https://demo.inelabteamdev.com/product/117", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  try {
    const acceptButton = page.getByRole("button", { name: /^\s*accept( all)?( cookies)?\s*$/i }).first();
    if (await acceptButton.count() > 0 && await acceptButton.isVisible()) {
      await acceptButton.click({ force: true });
    }
  } catch (e) { }

  const priceBlock = page.locator(".price-block").first();
  await priceBlock.waitFor({ state: "visible" });

  const box = await priceBlock.boundingBox();
  console.log("Price block box:", box);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const rand = (min, max) => min + Math.random() * (max - min);

  async function wiggleOverPrice(page, priceBlock) {
    const box = await priceBlock.boundingBox().catch(() => null);
    if (!box) return;

    const numMoves = Math.floor(rand(5, 11));
    for (let i = 0; i < numMoves; i++) {
      const isWildMove = Math.random() > 0.7;
      let x, y;
      if (isWildMove) {
        x = rand(50, 800);
        y = rand(50, 600);
      } else {
        x = box.x + rand(-20, box.width + 20);
        y = box.y + rand(-20, box.height + 20);
      }
      x = Math.max(0, Math.min(x, 1366));
      y = Math.max(0, Math.min(y, 900));
      await page.mouse.move(x, y, { steps: Math.floor(rand(10, 25)) });
      await sleep(rand(100, 300));
    }

    const finalX = box.x + rand(10, box.width - 10);
    const finalY = box.y + rand(10, box.height - 10);
    await page.mouse.move(finalX, finalY, { steps: 15 });
    await sleep(rand(200, 400));
  }

  await wiggleOverPrice(page, priceBlock);
  await page.waitForTimeout(2000);

  const revealButton = page.getByRole("button", { name: /REVEAL PRICE/i }).first();
  console.log("Reveal button enabled after wiggle:", await revealButton.isEnabled());

  if (await revealButton.isEnabled()) {
    await revealButton.click();
    console.log("Clicked reveal!");
    await page.waitForTimeout(2000);
  } else {
    console.log("Still disabled, trying hover on button");
    await revealButton.hover({ timeout: 5000, force: true }).catch(() => { });
    await page.waitForTimeout(2000);
    console.log("Enabled now?", await revealButton.isEnabled());
  }

  const text = await priceBlock.innerText();
  console.log("Price block text:", text.replace(/\n/g, ' '));

  await browser.close();
}
run();
