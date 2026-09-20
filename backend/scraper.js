// import { chromium } from "playwright";

// const MAX_SCRAPE_ATTEMPTS = 3;
// const PRICE_INTERACTION_ATTEMPTS = 8;
// const PRICE_LOAD_ATTEMPTS = 15;

// const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// const rand = (min, max) => min + Math.random() * (max - min);

// // ============================================================
// // HELPERS
// // ============================================================
// async function safeClick(page, locator, label, timeout = 10000) {
//   try {
//     // Wait for the element to be visible and get its bounding box
//     await locator.waitFor({ state: 'visible', timeout });
//     const box = await locator.boundingBox();

//     if (!box) {
//       // Fallback if bounding box isn't available
//       await locator.click({ timeout });
//       return true;
//     }

//     // Calculate a random point within the button (slightly off-center)
//     const targetX = box.x + (box.width / 2) + rand(-box.width / 4, box.width / 4);
//     const targetY = box.y + (box.height / 2) + rand(-box.height / 4, box.height / 4);

//     // Move the mouse smoothly to the target
//     await page.mouse.move(targetX, targetY, { steps: Math.floor(rand(20, 40)) });

//     // Pre-click dwell time (simulate user reading/hesitating)
//     await sleep(rand(400, 800));

//     // Simulate realistic click duration (mousedown -> short delay -> mouseup)
//     await page.mouse.down();
//     await sleep(rand(50, 150));
//     await page.mouse.up();

//     // Post-click dwell time
//     await sleep(rand(300, 600));

//     return true;
//   } catch (error) {
//     console.log(`Click failed (${label}): ${error.message.split("\n")[0]}`);
//     return false;
//   }
// }

// async function setupCookieHandler(page) {
//   await page.addLocatorHandler(
//     page.getByRole("button", { name: /^\s*accept( all)?( cookies)?\s*$/i }).first(),
//     async (button) => {
//       console.log("Cookie banner detected, accepting...");
//       await button.click();
//     }
//   );
// }

// async function acceptCookies(page) {
//   const overlay = page.locator(".cookie-overlay").first();
//   const acceptBtn = page.getByRole("button", { name: /accept/i }).first();

//   if ((await overlay.count()) > 0 && (await overlay.isVisible().catch(() => false))) {
//     console.log("Cookie banner detected, attempting to accept...");
//     // The banner may require up to 3 clicks, so we loop
//     for (let i = 0; i < 5; i++) {
//         if (!(await overlay.isVisible().catch(() => false))) break;
//         if ((await acceptBtn.count()) > 0 && await acceptBtn.isVisible().catch(() => false)) {
//             console.log("Clicking accept button...");
//             await acceptBtn.click({ force: true, timeout: 2000 }).catch(e => console.log("Click error:", e));
//             await sleep(200);
//         }
//     }

//     await overlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {
//       console.log("Warning: Cookie overlay did not disappear completely.");
//     });

//     await sleep(500);
//   }
// }

// async function wiggleOverPrice(page, priceBlock) {
//   const box = await priceBlock.boundingBox().catch(() => null);
//   if (!box) return;

//   // Move AT LEAST 10 times to satisfy minMoves: 8 requirement
//   const numMoves = Math.floor(rand(10, 15));

//   for (let i = 0; i < numMoves; i++) {
//     // Sometimes move wildly across the screen, sometimes stay near the price block
//     const isWildMove = Math.random() > 0.7;

//     let x, y;
//     if (isWildMove) {
//       x = rand(50, 800);
//       y = rand(50, 600);
//     } else {
//       x = box.x + rand(-20, box.width + 20);
//       y = box.y + rand(-20, box.height + 20);
//     }

//     // Ensure we don't move off screen
//     x = Math.max(0, Math.min(x, 1366));
//     y = Math.max(0, Math.min(y, 900));

//     await page.mouse.move(x, y, { steps: Math.floor(rand(10, 25)) });
//     await sleep(rand(100, 300));
//   }

//   // Final move to rest directly over the price block
//   const finalX = box.x + rand(10, box.width - 10);
//   const finalY = box.y + rand(10, box.height - 10);
//   await page.mouse.move(finalX, finalY, { steps: 15 });

//   // Dwell AT LEAST 600ms to satisfy minDwellMs: 600
//   await sleep(rand(800, 1200));
// }

// async function getPriceBlock(page) {
//   const priceBlock = page.locator(".price-block").first();
//   await priceBlock.waitFor({ state: "visible", timeout: 15000 });
//   return priceBlock;
// }

// function extractPrice(text) {
//   if (!text) return null;
//   const cleanText = text.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\u00A0/g, " ");
//   const prices = cleanText.match(/₹\s*[\d,]+(?:\.\d{1,2})?/g);
//   if (!prices || prices.length === 0) return null;

//   const selected = prices.length >= 2 ? prices[1] : prices[0];
//   const numeric = selected.replace(/[^\d.]/g, "");
//   const price = Number(numeric);
//   return !Number.isFinite(price) || price <= 0 ? null : price;
// }

// function extractStock(text) {
//   if (!text) return { status: "unknown", quantity: null };
//   const lower = text.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\u00A0/g, " ").toLowerCase();

//   if (lower.includes("out of stock") || lower.includes("sold out")) return { status: "out_of_stock", quantity: 0 };
//   const inStockMatch = lower.match(/(\d+)\s+in\s+stock/);
//   if (inStockMatch) return { status: "in_stock", quantity: Number(inStockMatch[1]) };
//   const leftMatch = lower.match(/(\d+)\s+left/);
//   if (leftMatch) return { status: "in_stock", quantity: Number(leftMatch[1]) };
//   if (lower.includes("in stock") || lower.includes("available")) return { status: "in_stock", quantity: null };

//   return { status: "unknown", quantity: null };
// }

// function getRevealButton(page) {
//   return page.getByRole("button", { name: /REVEAL PRICE/i }).first();
// }

// async function interactWithPrice(page, priceBlock) {
//   const revealButton = getRevealButton(page);
//   for (let attempt = 1; attempt <= PRICE_INTERACTION_ATTEMPTS; attempt++) {
//     console.log(`interactWithPrice attempt ${attempt}...`);
//     // Dismiss cookie banner if it appeared late
//     await acceptCookies(page);

//     // ALWAYS wiggle over the price block to trigger the mousemove threshold
//     console.log("Wiggling over price block...");
//     await wiggleOverPrice(page, priceBlock);
//     await sleep(800);

//     console.log("Checking price block text...");
//     const currentText = await priceBlock.innerText().catch(() => "");
//     if (extractPrice(currentText) !== null) return { button: revealButton, priceAlreadyLoaded: true };

//     const isButtonVisible = (await revealButton.count()) > 0 && (await revealButton.isVisible().catch(() => false));
//     if (isButtonVisible && await revealButton.isEnabled({ timeout: 100 }).catch(() => false)) {
//       return { button: revealButton, priceAlreadyLoaded: false };
//     }
//   }
//   throw new Error("Reveal price button remained disabled");
// }

// async function waitForPrice(page, priceBlock) {
//   for (let attempt = 1; attempt <= PRICE_LOAD_ATTEMPTS; attempt++) {
//     await sleep(1200);
//     const text = await priceBlock.innerText().catch(() => "");
//     const lower = text.toLowerCase();
//     const price = extractPrice(text);

//     if (price !== null) return { price, text };
//     if (lower.includes("loading current price")) continue;

//     if (lower.includes("challenge_failed") || lower.includes("couldn't load the price")) {
//       const retryButton = page.getByRole("button", { name: /TRY AGAIN/i }).first();
//       if ((await retryButton.count()) > 0 && await retryButton.isVisible().catch(() => false)) {
//         await safeClick(page, retryButton, "try again");
//         await sleep(1000);
//         await wiggleOverPrice(page, priceBlock);
//         const revealButton = getRevealButton(page);
//         if ((await revealButton.count()) > 0 && await revealButton.isEnabled({ timeout: 100 }).catch(() => false)) {
//           await safeClick(page, revealButton, "reveal price (after retry)");
//         }
//       }
//       continue;
//     }

//     if (lower.includes("price hidden")) {
//       await wiggleOverPrice(page, priceBlock);
//       const revealButton = getRevealButton(page);
//       if ((await revealButton.count()) > 0 && await revealButton.isEnabled({ timeout: 100 }).catch(() => false)) {
//         await safeClick(page, revealButton, "reveal price (still hidden)");
//       }
//     }
//   }
//   throw new Error("Price did not become available after waiting");
// }

// // ============================================================
// // MAIN EXPORTED SCRAPER FUNCTION
// // ============================================================
// export async function scrapeProduct(url, headless = true) {
//   let lastError = null;

//   for (let attempt = 1; attempt <= MAX_SCRAPE_ATTEMPTS; attempt++) {
//     console.log(`\n--- Scrape Attempt ${attempt}/${MAX_SCRAPE_ATTEMPTS} for ${url} ---`);
//     let browser = null;

//     try {
//       browser = await chromium.launch({ headless });
//       const context = await browser.newContext({
//         viewport: { width: 1366, height: 900 },
//         userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
//       });

//       // Inject script to bypass webdriver detection
//       await context.addInitScript(() => {
//         Object.defineProperty(navigator, 'webdriver', {
//           get: () => undefined,
//         });
//         window.navigator.chrome = {
//           runtime: {},
//         };
//       });

//       const page = await context.newPage();
//       page.setDefaultTimeout(15000);

//       await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

//       // Initial human dwell time
//       await sleep(rand(1000, 2500));

//       // Simulate reading by scrolling a bit
//       await page.mouse.wheel(0, rand(200, 400));
//       await sleep(rand(800, 1500));
//       await page.mouse.wheel(0, rand(-100, 100));

//       await sleep(1000);
//       await acceptCookies(page);

//       const priceBlock = await getPriceBlock(page);
//       const interaction = await interactWithPrice(page, priceBlock);

//       if (!interaction.priceAlreadyLoaded) {
//         const revealButton = getRevealButton(page);
//         if ((await revealButton.count()) > 0 && await revealButton.isEnabled().catch(() => false)) {
//           await safeClick(page, revealButton, "reveal price");
//           await sleep(1000);
//         }
//       }

//       const priceResult = await waitForPrice(page, priceBlock);
//       const bodyText = await page.locator("body").innerText();
//       const stock = extractStock(bodyText);

//       await browser.close();

//       return {
//         success: true,
//         data: {
//           price: priceResult.price,
//           stock_status: stock.status,
//           stock_quantity: stock.quantity
//         }
//       };

//     } catch (error) {
//       lastError = error;
//       console.error(`Attempt ${attempt} failed: ${error.message}`);
//       if (browser) await browser.close().catch(() => { });
//       if (attempt < MAX_SCRAPE_ATTEMPTS) await sleep(attempt * 3000);
//     }
//   }

//   return {
//     success: false,
//     error: `Failed after ${MAX_SCRAPE_ATTEMPTS} attempts. Last error: ${lastError?.message}`
//   };
// }
import { chromium } from "playwright";

const MAX_SCRAPE_ATTEMPTS = 3;
const PRICE_MOVE_COUNT = 12;
const PRICE_MOVE_INTERVAL_MS = 70;
const PRICE_DWELL_MS = 900;
const PRICE_WAIT_MS = 30000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function acceptCookies(page) {
  // The storefront may render a cookie overlay late, so check both the
  // overlay and any visible Accept button.
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

function extractPrice(text) {
  if (!text) return null;

  const clean = text
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ");

  // The success state can contain MRP + deal price + current price.
  // The current displayed price is the last INR amount in .price-main.
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

/**
 * The storefront does NOT enable Reveal Price just because the element is
 * hovered once. Its own React code records mouse moves and requires:
 *   - at least 8 moves
 *   - at least 600 ms of dwell time
 *
 * The old scraper mixed random off-screen moves with price-block moves.
 * This version keeps every required move inside the actual price block and
 * waits >40 ms between moves, matching the storefront's internal throttle.
 */
async function satisfyPriceInteraction(page, priceBlock) {
  await priceBlock.scrollIntoViewIfNeeded();

  const box = await priceBlock.boundingBox();
  if (!box) throw new Error("Could not get price block bounding box");

  const xPositions = [
    0.15, 0.28, 0.42, 0.57, 0.72, 0.86,
    0.76, 0.61, 0.47, 0.33, 0.20, 0.50,
  ];

  // Keep the pointer safely inside the element, including its vertical
  // centre. This guarantees React receives onMouseEnter/onMouseMove.
  const y = box.y + Math.max(2, box.height / 2);

  for (const ratio of xPositions.slice(0, PRICE_MOVE_COUNT)) {
    const x = box.x + Math.max(2, Math.min(box.width - 2, box.width * ratio));

    await page.mouse.move(x, y, { steps: 2 });
    await sleep(PRICE_MOVE_INTERVAL_MS);
  }

  // The site's tracker measures dwell from the first enter/move.
  await sleep(PRICE_DWELL_MS);

  let state = await buttonState(page);
  console.log("Reveal button after real mouse interaction:", state);

  if (state.enabled) return;

  /*
   * Fallback for environments where Playwright's native mouse movement is
   * not delivered to React consistently (this can happen with some headed
   * Windows/browser setups).

   * The storefront's tracker only uses clientX/clientY for mousemove and
   * checks isTrusted separately on the eventual click. We therefore still
   * perform the final button click with a real Playwright click.
   */
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
  const browser = await chromium.launch({ headless });

  try {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 900 },
      // Do not spoof webdriver here. The storefront does not require it,
      // and removing this hack makes the browser session more predictable.
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

    // If a previous state is already successful, no interaction is needed.
    const initialText = await priceBlock.innerText().catch(() => "");
    const initialPrice = extractPrice(initialText);

    if (initialPrice === null) {
      await satisfyPriceInteraction(page, priceBlock);

      const button = revealButton(page);
      if (!(await button.isEnabled().catch(() => false))) {
        throw new Error("Reveal Price is still disabled after interaction");
      }

      // Use Playwright's real click. This produces the trusted click that
      // the storefront records in its request payload.
      console.log("Clicking Reveal Price...");
      await button.click();
    }

    const result = await waitForPrice(page, priceBlock);

    // The successful price UI exposes stock in .stock-badge.
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
