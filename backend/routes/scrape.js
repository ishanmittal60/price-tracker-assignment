import express from 'express';
import { getAllProducts, logScrapeAttempt, recordPriceHistory } from '../db.js';
import { scrapeProduct } from '../scraper.js';

const router = express.Router();

// POST /api/scrape/cron
// Intended to be hit by cron-job.org every 2 hours
router.post('/cron', async (req, res) => {
  try {
    const products = await getAllProducts();
    const results = [];
    let successCount = 0;
    let failedCount = 0;

    // Process each product sequentially to avoid overloading the target server
    for (const product of products) {
      const url = product.product_url;
      const scrapeResult = await scrapeProduct(url, true); // headless
      
      if (scrapeResult.success) {
        successCount++;
        // Record successful history
        await recordPriceHistory({
          product_url: url,
          price: scrapeResult.data.price,
          stock_status: scrapeResult.data.stock_status,
          stock_quantity: scrapeResult.data.stock_quantity,
        });
        
        // Log success
        await logScrapeAttempt({
          product_url: url,
          status: 'success',
          error_message: null
        });
      } else {
        failedCount++;
        // Log failure, do not insert incorrect data into price_history
        await logScrapeAttempt({
          product_url: url,
          status: 'failed',
          error_message: scrapeResult.error
        });
      }
      results.push({ url, success: scrapeResult.success });
      
      // Delay between each product in the loop to avoid rate-limiting
      await new Promise(r => setTimeout(r, 2000));
    }

    res.status(200).json({ 
      message: 'Cron scrape completed', 
      summary: { total: products.length, success: successCount, failed: failedCount },
      results 
    });
  } catch (error) {
    console.error('Cron scrape error:', error);
    res.status(500).json({ error: 'Internal server error during cron scrape' });
  }
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
