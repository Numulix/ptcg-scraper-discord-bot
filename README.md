
# PokéSerbia TCG Stock Notifier

A Discord bot that scrapes Serbian online stores for new Pokémon TCG products and sends real-time notifications about new stock.

## About this project

This project was born out of a passion for Pokémon TCG and the challenge of keeping up with new product releases across various Serbian retailers. This bot automates the process of checking for new stock by periodically scraping store websites and instantly notifying a designated Discord channel when a new item is found.

Currently, it supports scraping from the following stores:
- Delfi

Scrapers that have yet to be implemented:
- Kraken
- Games4You
- Games.rs
- (easily extendible for more stores)

## Key Features

- **Automated Hourly Scraping**: A cron job runs every hour to check for new products.
- **Dynamic Website Support**: Uses Playwright to handle modern, JavaScript-heavy websites that simple HTTP requests cannot scrape.
- **Modular Scraper Design**: Thanks to an abstract Scraper class, adding a new store is as simple as creating a new class file.
- **Persistent State**: Remembers the last known products for each store to accurately detect only new items.

## Built With

This project leverages a modern TypeScript and Node.js stack:
- Node.js
- TypeScript
- discordx
- Playwright
- Cheerio
- node-cron