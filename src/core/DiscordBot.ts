import { EmbedBuilder, GatewayIntentBits, Partials, TextChannel } from "discord.js";
import { Client } from "discordx";
import { Product } from "../types/Product.js";

const PRODUCTS_PER_EMBED = 10;

export class DiscordBot {
    private client = new Client({
        intents: [
            GatewayIntentBits.Guilds, 
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.MessageContent
        ],
        partials: [
            Partials.Message,
            Partials.Channel,
            Partials.Reaction
        ],
        silent: false
    });

    constructor (private token: string) {}

    public connect(): Promise<void> {
        return new Promise((resolve) => {
            this.client.once('ready', () => {
                console.log(`Logged in as ${this.client.user?.tag}`);
                this.client.initApplicationCommands();
                resolve();
            });
            this.client.on("interactionCreate", (interaction) => {
                this.client.executeInteraction(interaction);
            })
            this.client.login(this.token);
        })
    }

    public async sendNewProductNotification(
        channelId: string, 
        logoUrl: string, 
        products: Product[], 
        roleId: string
    ): Promise<void> {
        if (products.length === 0) {
            return;
        }

        const channel = await this.client.channels.fetch(channelId);
        if (!channel || !(channel instanceof TextChannel)) {
            console.error(`Channel with ID ${channelId} not found or is not a text channel.`);
            return;
        }

        const messageContent = roleId ? `<@&${roleId}>` : "";
        const storeName = products[0]!.storeName;

        // Handling the case of one product
        if (products.length === 1) {
            const product = products[0];

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(product!.name)
                .setURL(product!.url)
                .setDescription(`Novi proizvod je dostupan u radnji **${storeName.toUpperCase()}**!`)
                .addFields(
                    { name: 'Cena', value: product?.price || '', inline: true },
                    { name: 'Cena sa popustom', value: product?.discountedPrice || '', inline: true }
                )
                .setImage(product?.imageUrl || '')
                .setTimestamp()
                .setThumbnail(logoUrl);


            await channel.send({ content: messageContent ,embeds: [embed] });
            return;
        }

        for (let i = 0; i < products.length; i += PRODUCTS_PER_EMBED) {
            const chunk = products.slice(i, i + PRODUCTS_PER_EMBED);

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Pronadjeno ${products.length} novih proizvoda u radnji **${storeName.toUpperCase()}**`)
                .setDescription(`Prikazani proizvodi ${i+1}-${i + chunk.length} od ${products.length}`)
                .setThumbnail(products[0]?.imageUrl || "")
                .setTimestamp()
            
            for (const prod of chunk) {
                embed.addFields({
                    name: prod.name || "",
                    value: `Cena: ${prod.price} | Cena sa popustom: ${prod.discountedPrice} | [Link](${prod.url})`,
                    inline: false
                })
            }

            const contentForFirstChunk = (i === 0) ? messageContent : undefined; 
            await channel.send({ content: contentForFirstChunk, embeds: [embed] });
        }
    }
}