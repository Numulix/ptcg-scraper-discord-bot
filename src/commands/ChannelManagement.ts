import { CommandInteraction, MessageFlags, PermissionsBitField, TextChannel } from "discord.js";
import { Discord, Slash } from "discordx";
import { ServerConfigManager } from "../core/ServerConfigManager.js";
import { logger } from "../core/Logger.js";
import { log } from "console";

logger.info("✅ ChannelManagement file has been loaded by the importer.");

@Discord()
export class ChannelManagement {

    @Slash({
        name: "register",
        description: "Sets this channel to receive stock notifications",
        defaultMemberPermissions: [PermissionsBitField.Flags.Administrator]
    })
    async registerChannel(interaction: CommandInteraction): Promise<void> {
        logger.info(`[COMMAND] /register executed by ${interaction.user.tag} in guild ${interaction.guildId}`);

        if (!interaction.guildId || !interaction.channel) {
            await interaction.reply({ content: "This command can only be used in a server channel", flags: [MessageFlags.Ephemeral] });
            return;
        }

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        try {
            await ServerConfigManager.setNotificationChannel(interaction.guildId, interaction.channelId);
            const channelMention = interaction.channel as TextChannel;
            await interaction.editReply(`✅ Success! **${channelMention.name}** will now receive stock notifications. If another channel was previously set, this one has replaced it.`);
            logger.info(`[SUCCESS] Channel ${interaction.channelId} registered for guild ${interaction.guildId}`);
        } catch (error) {
            console.error(`[ERROR] Failed to execute /register for guild ${interaction.guildId}:`, error);
            await interaction.editReply({ 
                content: "❌ An unexpected error occurred while trying to register this channel. Please check the bot's console logs for more details." 
            });
            logger.error(`[ERROR] Failed to register channel ${interaction.channelId} for guild ${interaction.guildId}:`, error);
        }
       }

    @Slash({
        name: "unregister",
        description: "Stops sending stock notifications to this server",
        defaultMemberPermissions: [PermissionsBitField.Flags.Administrator]
    })
    async unregisterChannel(interaction: CommandInteraction): Promise<void> {
        logger.info(`[COMMAND] /unregister executed by ${interaction.user.tag} in guild ${interaction.guildId}`);

        if (!interaction.guildId) {
            await interaction.reply({ content: "This command can only be used in a server.", flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const currentConfig = await ServerConfigManager.getConfig(interaction.guildId);

        if (!currentConfig.notificationChannelId) {
            await interaction.editReply("ℹ️ No notification channel is currently registered for this server.");
            return;
        }

        await ServerConfigManager.clearNotificationsChannel(interaction.guildId);

        await interaction.editReply("✅ Success! The bot will no longer send stock notifications to this server until a new channel is registered.")
        logger.info(`[SUCCESS] Channel ${currentConfig.notificationChannelId} unregistered for guild ${interaction.guildId}`);
    }
}