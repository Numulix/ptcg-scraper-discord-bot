import { EmbedBuilder, Guild, PermissionsBitField, TextChannel } from "discord.js";
import * as discordx from "discordx";
import { ReactionRoleManager } from "../core/ReactionRoleManager.js";
import { ServerConfigManager } from "../core/ServerConfigManager.js";
import { logger } from "../core/Logger.js";

logger.info("✅ guildCreate.ts event handler file has been loaded by the importer.");

const REACTION_EMOJI = "🎉";

@discordx.Discord()
export class GuildCreateHandler {
    @discordx.On({ event: "guildCreate" })
    async onGuildCreate([guild]: discordx.ArgsOf<"guildCreate">): Promise<void> {
        logger.info(`Joined a new guild: ${guild.name} (ID: ${guild.id})`);
        
        // Step 1: Find a suitable channel to send a welcome message
        const channel = this.findWelcomeChannel(guild);
        if (!channel) {
            logger.error(`No suitable channel found in guild: ${guild.name} (ID: ${guild.id})`);
            return;
        }

        // Step 2: Create the notification role
        const role = await guild.roles.create({
            name: "PTCG Notify",
            color: "#5865F2",
            reason: "Role for Pokemon TCG stock notifications"
        }).catch(error => {
            logger.error(`Failed to create role in guild: ${guild.name} (ID: ${guild.id})`, error);
            return null;
        });

        if (!role) {
            await channel.send("❌ I couldn't create a notification role. Please check my 'Manage Roles' permission and try again.");
            return;
        }

        // Step 3: Create and send the welcome embed message
        const welcomeEmbed = new EmbedBuilder()
            .setColor("#5865F2")
            .setTitle(`Hvala što ste me dodali na ${guild.name}!`)
            .setDescription(`Ja sam bot koji prati nove Pokemon TCG proizvode u Srbiji.\n\n` +
                `**Kako koristiti bota:**\n` +
                `Da biste registrovali kanal za obaveštenja, koristite komandu \`/register\` u željeni kanal.\n` +
                `Da biste primili notifikacije, **reagujte sa ${REACTION_EMOJI} na ovu poruku** i dobićete **@${role.name}** rolu.\n` +
                `Ukoliko želite da isključite notifikacije, jednostavno uklonite reakciju.`
            )
            .addFields({
                name: '🚨 VAŽNO: Za admine',
                value: 'Ukoliko niste već, molimo vas da podesite potrebne dozvole za bota, inače neće moći da šalje poruke ili dodeljuje role.'
            })
        
        const message = await channel.send({ embeds: [welcomeEmbed] }).catch(error => {
            logger.error(`Failed to send welcome message in guild: ${guild.name} (ID: ${guild.id})`, error);
            return null;
        });

        if (!message) return;

        // Step 4: Add the initial reaction to the welcome message
        await message.react(REACTION_EMOJI);
        await ReactionRoleManager.addConfig({
            guildId: guild.id,
            channelId: channel.id,
            messageId: message.id,
            roleId: role.id,
            emoji: REACTION_EMOJI
        });

        await ServerConfigManager.setRoleId(guild.id, role.id);

        logger.info(`Successfully set up welcome message and reaction role in guild: ${guild.name} (ID: ${guild.id})`);
    }

    private findWelcomeChannel(guild: Guild): TextChannel | undefined {
        // Priority list channel names
        const channelNames = ["bot-commands", "bots", "welcome", "general"];

        for (const name of channelNames) {
            const channel = guild.channels.cache.find(
                ch => ch.name === name && ch.type === 0
            ) as TextChannel;
            if (channel && channel.permissionsFor(guild.members.me!).has(PermissionsBitField.Flags.SendMessages)) {
                return channel;
            }
        }

        // Fallback: Find the first text channel with send permissions
        return guild.channels.cache
            .filter(ch => ch.type === 0 && ch.permissionsFor(guild.members.me!).has(PermissionsBitField.Flags.SendMessages))
            .first() as TextChannel | undefined;
    }
}