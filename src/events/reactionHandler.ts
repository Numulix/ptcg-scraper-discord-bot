import * as discordx from "discordx";
import { ReactionRoleManager } from "../core/ReactionRoleManager.js";

console.log("✅ reactionHandler.ts event handler file has been loaded by the importer.");

@discordx.Discord()
export class ReactionHandler {
    // Handler for when user ADDS a reaction to the welcome messsage
    @discordx.On({ event: "messageReactionAdd" })
    async onReactionAdd([reaction, user]: discordx.ArgsOf<"messageReactionAdd">): Promise<void> {
        // Ignore reactions from bots
        if (user.bot) return;

        // Check if the reaction is on a tracked message
        const config = await ReactionRoleManager.findConfigByMessageId(reaction.message.id);
        if (!config || reaction.emoji.name !== config.emoji) return;

        try {
            const guild = reaction.message.guild;
            if (!guild) return;

            // Fetch the role and member to ensure we have the latest data
            const role = await guild.roles.fetch(config.roleId).catch(() => null);
            const member = await guild.members.fetch(user.id).catch(() => null);

            if (role && member) {
                await member.roles.add(role, "Added via reaction role system");
                console.log(`Added role ${role.name} to user ${user.username} in guild ${guild.name}`);
            }
        } catch (error) {
            console.error(`Failed to add role for reaction in guild ${reaction.message.guild?.name}:`, error);
        }
    }

    // Handler for when user REMOVES a reaction from the welcome message
    @discordx.On({ event: "messageReactionRemove" })
    async onReactionRemove([reaction, user]: discordx.ArgsOf<"messageReactionRemove">): Promise<void> {
        // Ignore reactions from bots
        if (user.bot) return;

        const config = await ReactionRoleManager.findConfigByMessageId(reaction.message.id);
        if (!config || reaction.emoji.name !== config.emoji) return;

        try {
            const guild = reaction.message.guild;
            if (!guild) return;

            // Fetch the role and member to ensure we have the latest data
            const role = await guild.roles.fetch(config.roleId).catch(() => null);
            const member = await guild.members.fetch(user.id).catch(() => null);

            if (role && member) {
                await member.roles.remove(role, "Removed via reaction role system");
                console.log(`Removed role ${role.name} from user ${user.username} in guild ${guild.name}`);
            }
        } catch (error) {
            console.error(`Failed to remove role for reaction in guild ${reaction.message.guild?.name}:`, error);
        }
    }
}