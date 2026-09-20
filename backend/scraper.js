import { chromium } from "playwright";
import { execSync } from "child_process";
import fs from "fs";

const MAX_SCRAPE_ATTEMPTS = 3;
const PRICE_MOVE_COUNT = 12;
const PRICE_MOVE_INTERVAL_MS = 70;
const PRICE_DWELL_MS = 900;
const PRICE_WAIT_MS = 30000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Auto-install Chromium if missing on cloud environments like Render
function ensureBrowserInstalled() {
  try {
    const executablePath = chromium.executablePath();
    if (!fs.existsSync(executablePath)) {
      console.log("Chromium binary not found. Installing playwright browser...");
      execSync("npx playwright install chromium", { stdio: "inherit" });
    }
  } catch (err) {
    console.log("Auto-install check skipped or failed:", err.message);
  }
}

async function acceptCookies(page) {
  const accept = page.getByRole("button", {
    name: /^\s*accept( all)?( cookies)?\s*$/i,
  }).first();

  try {
    if (await accept.count() && await accept.isVisible()) {
      await accept.click({ force: true });
      await sleep(300);
    }
  } catch {
    // No cookie banner / it disappeared between the checks.
  }
}

// Helper to dismiss lazy-loading cookie overlays that pop up asynchronously and block clicks
async function dismissCookieOverlay(page) {
  try {
    const overlay = page.locator(".cookie-overlay");
    if (await overlay.count() > 0 && await overlay.isVisible()) {
      const acceptBtn = overlay.getByRole("button", { name: /accept/i }).first();
      if (await acceptBtn.count() > 0) {
        await acceptBtn.click({ force: true }).catch(() => { });
      } else {
        await page.evaluate(() => {
          document.querySelectorAll(".cookie-overlay").forEach(el => el.remove());
        });
      }
      await sleep(300);
    }
  } catch {
    // Ignore if overlay isn't present
  }
}

function extractPrice(text) {
  if (!text) return null;

  const clean = text
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ");

  const matches = clean.match(/₹\s*[\d,]+(?:\.\d{1,2})?/g);
  if (!matches?.length) return null;

  const selected = matches[matches.length - 1];
  const value = Number(selected.replace(/[^\d.]/g, ""));

  return Number.isFinite(value) && value > 0 ? value : null;
}

function extractStock(text) {
  const lower = (text || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .toLowerCase();

  if (lower.includes("out of stock") || lower.includes("sold out")) {
    return { status: "out_of_stock", quantity: 0 };
  }

  const inStock = lower.match(/(\d+)\s+in\s+stock/);
  if (inStock) {
    return { status: "in_stock", quantity: Number(inStock[1]) };
  }

  const left = lower.match(/(\d+)\s+left/);
  if (left) {
    return { status: "in_stock", quantity: Number(left[1]) };
  }

  if (lower.includes("in stock") || lower.includes("available")) {
    return { status: "in_stock", quantity: null };
  }

  return { status: "unknown", quantity: null };
}

function revealButton(page) {
  return page.getByRole("button", { name: /reveal price/i }).first();
}

async function buttonState(page) {
  const button = revealButton(page);

  if (!(await button.count())) {
    return { exists: false, visible: false, enabled: false };
  }

  return {
    exists: true,
    visible: await button.isVisible().catch(() => false),
    enabled: await button.isEnabled().catch(() => false),
  };
}

async function satisfyPriceInteraction(page, priceBlock) {
  await priceBlock.scrollIntoViewIfNeeded();

  const box = await priceBlock.boundingBox();
  if (!box) throw new Error("Could not get price block bounding box");

  const xPositions = [
    0.15, 0.28, 0.42, 0.57, 0.72, 0.86,
    0.76, 0.61, 0.47, 0.33, 0.20, 0.50,
  ];

  const y = box.y + Math.max(2, box.height / 2);

  for (const ratio of xPositions.slice(0, PRICE_MOVE_COUNT)) {
    const x = box.x + Math.max(2, Math.min(box.width - 2, box.width * ratio));

    await page.mouse.move(x, y, { steps: 2 });
    await sleep(PRICE_MOVE_INTERVAL_MS);
  }

  await sleep(PRICE_DWELL_MS);

  let state = await buttonState(page);
  console.log("Reveal button after real mouse interaction:", state);

  if (state.enabled) return;

  console.log("Native mouse moves were not enough; replaying mousemove events...");

  await page.evaluate(() => {
    const block = document.querySelector(".price-block.price-idle");
    if (!block) return;

    const rect = block.getBoundingClientRect();
    const points = [
      0.15, 0.28, 0.42, 0.57, 0.72, 0.86,
      0.76, 0.61, 0.47, 0.33, 0.20, 0.50,
    ];

    for (const ratio of points) {
      const x = rect.left + rect.width * ratio;
      const y = rect.top + rect.height / 2;

      block.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          clientX: x,
          clientY: y,
          view: window,
        })
      );
    }

    block.dispatchEvent(
      new MouseEvent("mouseenter", {
        bubbles: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        view: window,
      })
    );
  });

  await sleep(1000);
  state = await buttonState(page);
  console.log("Reveal button after fallback interaction:", state);

  if (!state.enabled) {
    const status = await priceBlock.innerText().catch(() => "");
    throw new Error(
      `Reveal price remained disabled. Price block says: ${status.replace(/\n/g, " ")}`
    );
  }
}

async function waitForPrice(page, priceBlock) {
  const deadline = Date.now() + PRICE_WAIT_MS;

  while (Date.now() < deadline) {
    const text = await priceBlock.innerText().catch(() => "");
    const price = extractPrice(text);

    if (price !== null) {
      return { price, text };
    }

    const lower = text.toLowerCase();

    if (lower.includes("couldn't load the price") ||
      lower.includes("couldn’t load the price")) {
      const retry = page.getByRole("button", { name: /try again/i }).first();

      if (await retry.count() && await retry.isVisible().catch(() => false)) {
        console.log("Store reported a failed price load; retrying...");
        await satisfyPriceInteraction(page, priceBlock);
        await retry.click();
      }
    }

    await sleep(500);
  }

  const finalText = await priceBlock.innerText().catch(() => "");
  throw new Error(
    `Price did not become available within ${PRICE_WAIT_MS} ms. ` +
    `Final price block: ${finalText.replace(/\n/g, " ")}`
  );
}

async function scrapeOnce(url, headless) {
  ensureBrowserInstalled(); // Ensures browser binary exists before launching

  const browser = await chromium.launch({
    headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // Crucial for Linux/Render cloud containers
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 900 },
    });

    const page = await context.newPage();
    page.setDefaultTimeout(15000);

    console.log(`Opening ${url}`);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await acceptCookies(page);

    const priceBlock = page.locator(".price-block").first();
    await priceBlock.waitFor({ state: "visible", timeout: 15000 });

    console.log("Price block found.");

    const initialText = await priceBlock.innerText().catch(() => "");
    const initialPrice = extractPrice(initialText);

    if (initialPrice === null) {
      await satisfyPriceInteraction(page, priceBlock);

      // Dismiss any lazy-loading cookie banner blocking pointer events before clicking
      await dismissCookieOverlay(page);

      const button = revealButton(page);
      if (!(await button.isEnabled().catch(() => false))) {
        throw new Error("Reveal Price is still disabled after interaction");
      }

      console.log("Clicking Reveal Price...");
      await button.click({ force: true });
    }

    const result = await waitForPrice(page, priceBlock);

    const stockText = await page.locator(".stock-badge").first()
      .innerText()
      .catch(() => "");

    const stock = extractStock(stockText || await page.locator("body").innerText());

    return {
      success: true,
      data: {
        price: result.price,
        stock_status: stock.status,
        stock_quantity: stock.quantity,
      },
    };
  } finally {
    await browser.close();
  }
}

export async function scrapeProduct(url, headless = true) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_SCRAPE_ATTEMPTS; attempt++) {
    console.log(`\n--- Scrape attempt ${attempt}/${MAX_SCRAPE_ATTEMPTS} ---`);

    try {
      return await scrapeOnce(url, headless);
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed: ${error.message}`);

      if (attempt < MAX_SCRAPE_ATTEMPTS) {
        await sleep(2000 * attempt);
      }
    }
  }

  return {
    success: false,
    error: `Failed after ${MAX_SCRAPE_ATTEMPTS} attempts. Last error: ${lastError?.message}`,
  };
}