import { APIEmbed, EmbedBuilder } from "discord.js";
import { Product } from "../../types/Product.js";
import { logger } from "../Logger.js";

export function createSingleNewEmbed(
    product: Product | undefined,
    logoUrl: string
): APIEmbed {
    if (!product) {
        logger.error("Product is undefined when creating embed");
        throw new Error("Product is undefined");
    }

    return new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(product.name)
        .setURL(product.url)
        .setDescription(`Novi proizvod je dostupan u radnji **${product.storeName.toUpperCase()}**!`)
        .addFields(
            { name: 'Cena', value: product?.price || '', inline: true },
            { name: 'Cena sa popustom', value: product?.discountedPrice || '', inline: true }
        )
        .setImage(product.imageUrl || '')
        .setTimestamp()
        .setThumbnail(logoUrl)
        .toJSON();
}