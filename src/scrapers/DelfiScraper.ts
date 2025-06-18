import axios from "axios";
import * as cheerio from 'cheerio';
import { chromium } from "playwright";
import { Product } from "../types/Product.js";
import { Scraper } from "./Scraper.js";

export class DelfiScraper extends Scraper {
    public readonly storeName: string = "delfi";
    public readonly baseUrl: string = "https://delfi.rs"
    public readonly itemsPerPage: number = 20;
    public readonly logoUrl: string = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8a-8VwRXB66uUPsUxqkEH8pGX0SYFVAsdCg&s";

    public async scrape(): Promise<Product[]> {
        let browser = null;
        try {
            browser = await chromium.launch();
            const context = await browser.newContext();
            const page = await context.newPage();

            const selector = "#root > main > div > div.container.mt-3 > div.row.justify-content-center.text-center.p-2.mt-4 > div.col-md-9.mt-5.mt-md-0 > div:nth-child(3)"

            await page.goto(
                `${this.baseUrl}/pretraga?q=Pokemon+TCG&category=all&sort=order_asc&isAvailable=all&limit=100&page=1`,
                { waitUntil: 'networkidle' }
            );

            await page.waitForSelector(selector, { timeout: 10000 });

            const html = await page.content();
            const $ = cheerio.load(html);
            const productCards = $(selector).children("div");

            const products: Product[] = [];

            productCards.each((i, element) => {
                const card =  $(element).children().first()
                const imageUrl = card.find("a").first().find("img").attr("src");
                const url = `${this.baseUrl}${card.find("a").attr("href")}`
                const productTitle = card.find("h2").text();
                const price = card.find("span").eq(3).text();
                const discountedPrice = card.find("span").eq(2).text();
                const inStock = !card.find("button").hasClass("bg-black-shadows");
                
                if (productTitle && url && price) {
                    products.push({
                        storeName: "delfi",
                        name: productTitle,
                        price: price,
                        discountedPrice: discountedPrice,
                        url: url,
                        imageUrl: imageUrl,
                        inStock: inStock
                    })
                }

            })

            return products;

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