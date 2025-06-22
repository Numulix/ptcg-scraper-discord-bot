import { APIEmbed, EmbedBuilder } from "discord.js";
import { Product } from "../../types/Product.js";
import { logger } from "../Logger.js";

export function createRestockChunkEmbed(
    productsChunk: Product[],
    totalProducts: number,
    storeName: string,
    index: number
): APIEmbed {
    if (productsChunk.length === 0) {
        logger.error("Products array is empty when creating embed");
        throw new Error("Products array is empty");
    }

    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Pronadjeno ${totalProducts} proizvoda na ponovnom stanju u radnji **${storeName.toUpperCase()}**`)
        .setDescription(`Prikazani proizvodi ${index + 1}-${index + productsChunk.length} od ${totalProducts}`)
        .setThumbnail(productsChunk[0]?.imageUrl || "")
        .setTimestamp();

    for (const product of productsChunk) {
        embed.addFields({
            name: product.name || "",
            value: `Cena: ${product.price} | Cena sa popustom: ${product.discountedPrice} | [Link](${product.url})`,
            inline: false
        });
    }
    return embed.toJSON();
}