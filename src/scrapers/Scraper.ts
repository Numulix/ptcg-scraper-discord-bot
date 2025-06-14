import { Product } from "../types/Product";

export abstract class Scraper {
    // Each scraper must have a unique name, used for the JSON filename
    public abstract readonly storeName: string;
    // Each scraper must have a baseUrl to start scraping from
    public abstract readonly baseUrl: string;

    // The main method that will be called to get products
    public abstract scrape(): Promise<Product[]>;
}