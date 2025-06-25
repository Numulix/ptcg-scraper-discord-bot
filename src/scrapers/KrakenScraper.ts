import * as cheerio from 'cheerio';
import { Product } from "../types/Product.js";
import { Scraper } from "./Scraper.js";
import axios from 'axios';

export class KrakenScraper extends Scraper {
    public readonly storeName: string = "kraken";
    public readonly baseUrl: string = "https://www.kraken.rs";
    public readonly itemsPerPage: number = 12;
    public readonly logoUrl: string = "https://www.kraken.rs/wp-content/uploads/2022/12/kraken-logo-270x62-1.png";

    public async scrape(): Promise<Product[]> {
        const products: Product[] = [];

        const selector = ".product-wrapper";
        let page: number = 1;
        let lastPage: boolean = false;
        const getPageUrl = (pageNumber: number) => `${this.baseUrl}/kategorija/igre-sa-kartama/pokemon/page/${pageNumber}/?per_page=96&_pjax=.main-page-wrapper&loop=96&woo_ajax=1`
        const htmlArray: string[] = [];

        while (!lastPage) {

            try {
                const response = await axios.get(getPageUrl(page));
                htmlArray.push(response.data.items);
                page++;
            } catch (error) {
                if (axios.isAxiosError(error) && error.response && error.response.status === 404) {
                    lastPage = true;
                    break;
                }
            }
        }

        const html = htmlArray.join('');
        const $ = cheerio.load(html);
        const productCards = $(selector);

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
    }
}