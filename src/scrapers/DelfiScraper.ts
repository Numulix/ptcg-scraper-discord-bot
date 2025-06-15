import axios from "axios";
import * as cheerio from 'cheerio';
import { chromium } from "playwright";
import { Product } from "../types/Product.js";
import { Scraper } from "./Scraper.js";

export class DelfiScraper extends Scraper {
    public readonly storeName: string = "delfi";
    public readonly baseUrl: string = "https://delfi.rs/"
    public readonly itemsPerPage: number = 20;

    public async scrape(): Promise<Product[]> {
        let browser = null;
        try {
            browser = await chromium.launch();
            const context = await browser.newContext();
            const page = await context.newPage();

            const selector = "#root > main > div > div.container.mt-3 > div.row.justify-content-center.text-center.p-2.mt-4 > div.col-md-9.mt-5.mt-md-0 > div:nth-child(3)"

            await page.goto(
                `${this.baseUrl}pretraga?q=Pokemon+TCG&category=all&sort=order_asc&isAvailable=all&limit=100&page=1`,
                { waitUntil: 'networkidle' }
            );

            await page.waitForSelector(selector, { timeout: 10000 });

            const html = await page.content();
            const $ = cheerio.load(html);

            console.log($.html());

            return [];

        } catch (error) {
            console.error(`Error scraping: ${this.storeName} ${error}`);
            return [];
        } finally {
            if (browser) {
                browser.close();
            }
        }
    }
}

const scraper = new DelfiScraper();
scraper.scrape();