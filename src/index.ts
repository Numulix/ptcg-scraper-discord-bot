import cron from 'node-cron';
import { scrapers } from './scrapers/index.js';
import { Comparator } from './core/Comparator.js';
import 'dotenv/config';
import { DiscordBot } from './core/DiscordBot.js';
import { importx } from '@discordx/importer';
import { dirname } from 'path';
import { ServerConfigManager } from './core/ServerConfigManager.js';
import { fileURLToPath } from 'url';
import { logger } from './core/Logger.js';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN || "";

if (!DISCORD_TOKEN) {
    throw new Error('Missing DISCORD_TOKEN in .env file');
}

const bot = new DiscordBot(DISCORD_TOKEN);

async function runChecks() {
    logger.info("Running hourly check...");

    for (const scraper of scrapers) {
        logger.info(`Scraping ${scraper.storeName}...`);
        const newProducts = await scraper.scrape();

        // Skip if scraping failed :(
        if (newProducts.length === 0) {
            logger.warn(`No products found for ${scraper.storeName}, skipping`);
            continue;
        }

        const oldProducts = await Comparator.getSavedProducts(scraper.storeName);

        // If this is the first time we are saving a store, save and do nothing afterwards
        if (oldProducts.length === 0) {
            logger.info(`Initial product list saved for ${scraper.storeName}`);
            await Comparator.saveProducts(scraper.storeName, newProducts);
            continue;
        }

        const newItems = Comparator.findNewProducts(oldProducts, newProducts);

        if (newItems.length > 0) {
            logger.info(`Found ${newItems.length} new items for ${scraper.storeName}!`);
            
            // 1. Get all server configurations
            const allConfigs = await ServerConfigManager.getAllConfigs();
            const serverIds = Object.keys(allConfigs);

            if (serverIds.length === 0) {
                logger.warn("No servers have configured this bot.");
                continue;
            }

            // 2. Loop through each server that has a configuration
            for (const guildId of serverIds) {
                const config = allConfigs[guildId];

                // 3. Check if a notification channel is set for the server
                if (config?.notificationChannelId) {
                    try {

                        await bot.sendNewProductNotification(
                            config.notificationChannelId,
                            scraper.logoUrl,
                            newItems,
                            config.pingRoleId || ""
                        )
                    } catch (error) {
                        logger.error(`Failed to send notification to channel ${config.notificationChannelId} in guild ${guildId}.`, error);
                    }
                }
            }

            await Comparator.saveProducts(scraper.storeName, newProducts);
        } else {
            logger.info(`No new items found for ${scraper.storeName}. Skipping notification.`);
        }
    }

    logger.info("Hourly check finished.");
}

async function main() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const globPattern = `${__dirname}/{commands,events}/**/*.{js,ts}`;

    await importx(globPattern);

    await bot.connect();

    cron.schedule("0 * * * *", runChecks, { timezone: "Europe/Belgrade" });

    logger.info("Bot started. Cron job scheduled.");
}

main();