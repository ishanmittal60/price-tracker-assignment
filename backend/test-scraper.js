import { scrapeProduct } from './scraper.js';

async function runTest() {
  const testUrls = [
    'https://demo.inelabteamdev.com/product/117',
    'https://demo.inelabteamdev.com/product/118',
    'https://demo.inelabteamdev.com/product/119'
  ];

  for (const url of testUrls) {
    console.log(`\n🚀 Starting manual headed scrape test for: ${url}`);
    console.log('👀 Keep an eye on the browser window that opens!');

    const result = await scrapeProduct(url, false); // false = headed mode

    console.log(`\n✅ Scrape Test Complete for ${url}. Result:`);
    console.log(JSON.stringify(result, null, 2));
  }
}

runTest();