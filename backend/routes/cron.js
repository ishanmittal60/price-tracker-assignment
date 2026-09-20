import express from 'express';
import { supabase } from '../supabase.js'; // Adjust path to your supabase instance if needed
import { scrapeProduct } from '../scraper.js';

const router = express.Router();

// Define a GET route for cron-job.org to ping
router.get('/', async (req, res) => {
    console.log('Cron job triggered: Starting automated price checks...');

    try {
        // 1. Fetch all products currently tracked in Supabase
        const { data: products, error } = await supabase.from('products').select('*');
        if (error) throw error;

        if (!products || products.length === 0) {
            return res.json({ success: true, message: 'No products to scrape.' });
        }

        const results = [];

        // 2. Loop through each product and run your Playwright scraper
        for (const product of products) {
            // Assuming your product table has 'product_url' and 'id'
            const url = product.product_url;
            console.log(`Scraping product ID ${product.id}: ${url}`);

            const scrapeResult = await scrapeProduct(url);

            if (scrapeResult.success) {
                const newPrice = scrapeResult.data.price;

                // 3. Save the new price history into your database
                await supabase.from('price_history').insert([
                    {
                        product_url: url,
                        price: newPrice,
                        stock_status: scrapeResult.data.stock_status,
                        recorded_at: new Date().toISOString()
                    }
                ]);

                results.push({ id: product.id, status: 'success', price: newPrice });
            } else {
                console.error(`Failed to scrape product ID ${product.id}:`, scrapeResult.error);
                results.push({ id: product.id, status: 'failed', error: scrapeResult.error });
            }
        }

        res.json({ success: true, message: 'Automated scrape completed successfully', results });
    } catch (err) {
        console.error('Cron route error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;