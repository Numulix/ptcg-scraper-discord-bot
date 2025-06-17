import cron from 'node-cron';
import { scrapers } from './scrapers/index.js';
import { Comparator } from './core/Comparator.js';


async function runChecks() {
    console.log("Running hourly check...");

    for (const scraper of scrapers) {
        console.log(`Scraping ${scraper.storeName}...`);
        const newProducts = await scraper.scrape();

        // Skip if scraping failed :(
        if (newProducts.length === 0) {
            console.log(`No products found for ${scraper.storeName}, skipping`);
            continue;
        }

        const oldProducts = await Comparator.getSavedProducts(scraper.storeName);

        // If this is the first time we are saving a store, save and do nothing afterwards
        if (oldProducts.length === 0) {
            console.log(`Initial product list saved for ${scraper.storeName}`);
            await Comparator.saveProducts(scraper.storeName, newProducts);
            continue;
        }

        const newItems = Comparator.findNewProducts(oldProducts, newProducts);

        if (newItems.length > 0) {
            console.log(`Found ${newItems.length} new items for ${scraper.storeName}!`);
            // TODO: Send discord notification

            await Comparator.saveProducts(scraper.storeName, newProducts);
        } else {
            console.log(`No new items for ${scraper.storeName}`);
        }
    }

    console.log("Hourly check finished.")
}

async function main() {
    cron.schedule("0 * * * *", runChecks, { timezone: "Europe/Belgrade" });

    // TODO: Finish bot
}

main();