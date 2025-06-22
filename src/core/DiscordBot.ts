import { EmbedBuilder, GatewayIntentBits, Partials, TextChannel } from "discord.js";
import { Client } from "discordx";
import { Product } from "../types/Product.js";
import { logger } from "./Logger.js";
import { createSingleNewEmbed } from "./embeds/SingleNewEmbed.js";
import { createNewChunkEmbed } from "./embeds/MultiNewEmbed.js";
import { PingEnum } from "../types/PingEnum.js";
import { createSingleRestockEmbed } from "./embeds/SingleRestockEmbed.js";
import { createRestockChunkEmbed } from "./embeds/MultiRestockEmbed.js";

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
                logger.info(`Discord bot is ready as ${this.client.user?.tag}`);
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
        roleId: string,
        pingType: PingEnum
    ): Promise<void> {
        if (products.length === 0) {
            return;
        }

        const channel = await this.client.channels.fetch(channelId);
        if (!channel || !(channel instanceof TextChannel)) {
            logger.error(`Channel with ID ${channelId} not found or is not a text channel.`);
            return;
        }

        const messageContent = roleId ? `<@&${roleId}>` : "";
        const storeName = products[0]!.storeName;

        switch (pingType) {
            case PingEnum.SINGLE_NEW: {
                const embed = createSingleNewEmbed(products[0]!, logoUrl);
                await channel.send({ content: messageContent, embeds: [embed] });
                break;
            }
            case PingEnum.SINGLE_RESTOCK: {
                const embed = createSingleRestockEmbed(products[0]!, logoUrl);
                await channel.send({ content: messageContent, embeds: [embed] });
                break;
            }
            case PingEnum.MULTIPLE_NEW:
            case PingEnum.MULTIPLE_RESTOCK: {
                // This is the corrected ternary operator
                const multiEmbedBuilder = (pingType === PingEnum.MULTIPLE_NEW)
                    ? createNewChunkEmbed
                    : createRestockChunkEmbed;

                for (let i = 0; i < products.length; i += PRODUCTS_PER_EMBED) {
                    const chunk = products.slice(i, i + PRODUCTS_PER_EMBED);
                    const embed = multiEmbedBuilder(chunk, products.length, storeName, i);
                    
                    // Only ping on the first message of a multi-part notification
                    const contentForThisChunk = (i === 0) ? messageContent : undefined;
                    await channel.send({ content: contentForThisChunk, embeds: [embed] });
                }
                break;
            }

            default:
                logger.warn(`An unknown pingType was provided: ${pingType}`);
                break;
        }
    }
}