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
import { PingEnum } from './types/PingEnum.js';

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

        const changes = Comparator.analysedChanges(oldProducts, newProducts);

        let hadReportableUpdates = false;

        // Handle newly added products
        if (changes.newlyAdded.length > 0) {
            hadReportableUpdates = true;
            logger.info(`Found ${changes.newlyAdded.length} newly added products for ${scraper.storeName}!`);

            const pingType = changes.newlyAdded.length === 1
                ? PingEnum.SINGLE_NEW
                : PingEnum.MULTIPLE_NEW;

            const allConfigs = await ServerConfigManager.getAllConfigs();
            for (const guildId in allConfigs) {
                const config = allConfigs[guildId];
                if (config?.notificationChannelId) {
                    try {
                        await bot.sendNewProductNotification(
                            config.notificationChannelId,
                            scraper.logoUrl,
                            changes.newlyAdded,
                            config.pingRoleId || "",
                            pingType
                        );
                    } catch (error) {
                        logger.error(`Failed to send new product notification to channel ${config.notificationChannelId} in guild ${guildId}.`, error);
                    }
                }
            }
        }

        // Handle restocked products
        if (changes.restockedProducts.length > 0) {
            hadReportableUpdates = true;
            logger.info(`Found ${changes.restockedProducts.length} restocked products for ${scraper.storeName}!`);

            const pingType = changes.restockedProducts.length === 1
                ? PingEnum.SINGLE_RESTOCK
                : PingEnum.MULTIPLE_RESTOCK;

            const allConfigs = await ServerConfigManager.getAllConfigs();
            for (const guildId in allConfigs) {
                const config = allConfigs[guildId];
                if (config?.notificationChannelId) {
                    try {
                        await bot.sendNewProductNotification(
                            config.notificationChannelId,
                            scraper.logoUrl,
                            changes.restockedProducts,
                            config.pingRoleId || "",
                            pingType
                        );
                    } catch (error) {
                        logger.error(`Failed to send restock notification to channel ${config.notificationChannelId} in guild ${guildId}.`, error);
                    }
                }
            }
        }

        // Save the new state and provide final logging
        if (hadReportableUpdates) {
            logger.info(`Saving updated product list for ${scraper.storeName}`);
            await Comparator.saveProducts(scraper.storeName, newProducts);
        } else {
            logger.info(`No reportable updates for ${scraper.storeName}. No products added or restocked.`);
            await Comparator.saveProducts(scraper.storeName, newProducts);
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