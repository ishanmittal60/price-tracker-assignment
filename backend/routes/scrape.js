import express from 'express';
import { getAllProducts, logScrapeAttempt, recordPriceHistory } from '../db.js';
import { scrapeProduct } from '../scraper.js';

const router = express.Router();

// POST /api/scrape/cron
// Triggered by cron-job.org on a regular schedule
router.post('/cron', async (req, res) => {
  // Respond immediately so cron-job.org passes without hitting the 30s timeout
  res.status(200).json({
    success: true,
    message: 'Cron scrape triggered successfully and running in background'
  });

  // Execute the scraping pipeline asynchronously in the background
  (async () => {
    try {
      const products = await getAllProducts();
      if (!products || products.length === 0) {
        console.log('Cron scrape: No products found to track.');
        return;
      }

      console.log(`Cron scrape started for ${products.length} products...`);
      let successCount = 0;
      let failedCount = 0;

      for (const product of products) {
        const url = product.product_url;
        console.log(`Cron scraping product: ${url}`);
        const scrapeResult = await scrapeProduct(url, true); // headless mode

        if (scrapeResult.success) {
          successCount++;
          await recordPriceHistory({
            product_url: url,
            price: scrapeResult.data.price,
            stock_status: scrapeResult.data.stock_status,
            stock_quantity: scrapeResult.data.stock_quantity,
          });

          await logScrapeAttempt({
            product_url: url,
            status: 'success',
            error_message: null
          });
        } else {
          failedCount++;
          await logScrapeAttempt({
            product_url: url,
            status: 'failed',
            error_message: scrapeResult.error
          });
        }

        // 2-second pacing delay to prevent rate-limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      console.log(`Cron scrape completed. Success: ${successCount}, Failed: ${failedCount}`);
    } catch (error) {
      console.error('Background cron scrape execution error:', error.message);
    }
  })();
});

// POST /api/scrape/manual
// Endpoint to trigger a single headless Playwright scrape
router.post('/manual', async (req, res) => {
  try {
    const { id, product_url, url } = req.body;
    const targetUrl = product_url || url;

    if (!targetUrl || !id) {
      return res.status(400).json({ error: 'ID and product_url are required' });
    }

    const scrapeResult = await scrapeProduct(targetUrl, true); // headless

    if (scrapeResult.success) {
      await recordPriceHistory({
        product_url: targetUrl,
        price: scrapeResult.data.price,
        stock_status: scrapeResult.data.stock_status,
        stock_quantity: scrapeResult.data.stock_quantity,
      });
      await logScrapeAttempt({
        product_url: targetUrl,
        status: 'success',
        error_message: null
      });
      res.status(200).json({ message: 'Manual scrape successful', data: scrapeResult.data });
    } else {
      await logScrapeAttempt({
        product_url: targetUrl,
        status: 'failed',
        error_message: scrapeResult.error
      });
      res.status(500).json({ error: 'Manual scrape failed', details: scrapeResult.error });
    }
  } catch (error) {
    console.error('Manual scrape error:', error);
    res.status(500).json({ error: 'Internal server error during manual scrape' });
  }
});

export default router;