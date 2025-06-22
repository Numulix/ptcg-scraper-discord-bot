import * as fs from "fs/promises";
import * as path from "path";
import { Product } from "../types/Product.js";

export interface ProductChanges {
    newlyAdded: Product[];
    restockedProducts: Product[];
}

const DATA_DIR = path.join(process.cwd(), "data");

export class Comparator {
    public static analysedChanges(oldProducts: Product[], newProducts: Product[]): ProductChanges {
        const newlyAdded: Product[] = [];
        const restockedProducts: Product[] = [];

        const oldProductsMap = new Map<string, Product>();
        for (const product of oldProducts) {
            oldProductsMap.set(product.url, product);
        }

        for (const newProduct of newProducts) {
            const oldProduct = oldProductsMap.get(newProduct.url);

            if (oldProduct) {
                if ((!oldProduct.inStock) && newProduct.inStock) {
                    restockedProducts.push(newProduct);
                }
                oldProductsMap.delete(newProduct.url);
            } else {
                // It does not matter whether the new product is in stock or not.
                // If it is not in the old list, it is considered newly added.
                newlyAdded.push(newProduct);
            }
        }

        return { newlyAdded, restockedProducts };
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