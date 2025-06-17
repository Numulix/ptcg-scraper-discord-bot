import * as fs from "fs/promises";
import * as path from "path";
import { Product } from "../types/Product.js";

const DATA_DIR = path.join(process.cwd(), "data");

export class Comparator {
    // Finds new products by comparing the new list with the old one
    public static findNewProducts(oldProducts: Product[], newProducts: Product[]): Product[] {
        const oldProductUrls = new Set(oldProducts.map(p => p.url));
        return newProducts.filter(p => !oldProductUrls.has(p.url));
    }

    // Get previously saved file for a given store
    public static async getSavedProducts(storeName: string): Promise<Product[]> {
        const filePath = path.join(DATA_DIR, `${storeName}.json`);

        try {
            // Check if directory exists
            await fs.mkdir(DATA_DIR, { recursive: true });
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            // If the file does not exist, it's the first run for the store
            return [];
        }
    }

    // Saves the new product list for a store
    public static async saveProducts(storeName: string, products: Product[]): Promise<void> {
        const filePath = path.join(DATA_DIR, `${storeName}.json`);
        await fs.writeFile(filePath, JSON.stringify(products, null, 2));
    }
}