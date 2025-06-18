import { Product } from "../types/Product.js";

export abstract class Scraper {
    // Each scraper must have a unique name, used for the JSON filename
    public abstract readonly storeName: string;
    // Each scraper must have a baseUrl to start scraping from
    public abstract readonly baseUrl: string;
    // Items per page
    public abstract readonly itemsPerPage: number;
    // Logo url of the store for embed thumbnail
    public abstract readonly logoUrl: string;

    // The main method that will be called to get products
    public abstract scrape(): Promise<Product[]>;
}