import * as cheerio from 'cheerio';
import { chromium } from "playwright";
import { logger } from "../core/Logger.js";
import { Product } from "../types/Product.js";
import { Scraper } from "./Scraper.js";

export class KrakenScraper extends Scraper {
    public readonly storeName: string = "kraken";
    public readonly baseUrl: string = "https://www.kraken.rs";
    public readonly itemsPerPage: number = 12;
    public readonly logoUrl: string = "https://www.kraken.rs/wp-content/uploads/2022/12/kraken-logo-270x62-1.png";

    public async scrape(): Promise<Product[]> {
        let browser = null;

        try {
            browser = await chromium.launch();
            const context = await browser.newContext();
            const page = await context.newPage();

            const selector = ".products.wd-products";
            const loadingOnScrollSelector = "a.load-on-scroll";

            await page.goto(
                `${this.baseUrl}/kategorija/igre-sa-kartama/pokemon/?per_page=96&shop_view=grid&per_row=6`,
                { waitUntil: 'networkidle' }
            );

            const maxClicks = 25;

            for (let clickCount = 0; clickCount < maxClicks; clickCount++) {
                const loadMoreButton = page.locator(loadingOnScrollSelector);

                if (await loadMoreButton.count() > 0) {
                    await loadMoreButton.click({ clickCount: 1 });
                    await page.waitForLoadState('networkidle', { timeout: 10000 });
                    await page.waitForSelector(`${loadingOnScrollSelector}.loading`, { state: 'detached', timeout: 10000 });
                } else {
                    logger.info("No more loading found, breaking")
                    break;
                }

                await page.waitForTimeout(1000);
            }

            const html = await page.content();
            const $ = cheerio.load(html);
            const productCards = $(selector).children("div");

            const products: Product[] = [];

            productCards.each((i, element) => {
                const productImageLink = $(element).find(".product-image-link");
                const url = $(productImageLink).attr("href");
                const imageUrl = $(productImageLink).find("img").attr("src");
                const name = $(element).find(".wd-entities-title").find("a").text();
                const price = $(element).find("bdi").text();
                const inStock = $(element).find(".out-of-stock").length === 0;

                products.push({
                    storeName: "kraken",
                    name,
                    price,
                    url: url || "",
                    imageUrl,
                    inStock
                })
            })

            return products;
        } catch (error) {
            logger.error(`Error scraping: ${this.storeName} ${error}`);
            return [];
        } finally {
            if (browser) {
                browser.close();
            }
        }
    }
}

new KrakenScraper().scrape();