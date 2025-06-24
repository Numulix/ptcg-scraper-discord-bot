import { DelfiScraper } from "./DelfiScraper.js";
import { KrakenScraper } from "./KrakenScraper.js";

export const scrapers = [
    new DelfiScraper(),
    new KrakenScraper()
]