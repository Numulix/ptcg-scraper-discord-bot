import * as fs from 'fs/promises';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const REACTION_ROLES_FILE = path.join(DATA_DIR, 'reaction-roles.json');

export interface ReactionRole {
    guildId: string;
    channelId: string;
    messageId: string;
    roleId: string;
    emoji: string;
}

export class ReactionRoleManager {
    // Reads all reaction role configurations from the JSON file
    public static async getConfigs(): Promise<ReactionRole[]> {
        try {
            await fs.mkdir(DATA_DIR, { recursive: true });
            const data = await fs.readFile(REACTION_ROLES_FILE, 'utf-8');
            return JSON.parse(data) as ReactionRole[];
        } catch (error) {
            return []; // File does not exist or is empty
        }
    }

    // Saves the entire array of reaction role configurations to the JSON file
    private static async saveConfigs(configs: ReactionRole[]): Promise<void> {
        await fs.writeFile(REACTION_ROLES_FILE, JSON.stringify(configs, null, 2), 'utf-8');
    }

    // Adds a new reaction role configuration
    public static async addConfig(config: ReactionRole): Promise<void> {
        const configs = await this.getConfigs();
        // Avoid duplicates
        if (!configs.some(c => c.messageId === config.messageId)) {
            configs.push(config);
            await this.saveConfigs(configs);
        }
    }

    // Find a specific reaction role configuration by message ID
    public static async findConfigByMessageId(messageId: string): Promise<ReactionRole | undefined> {
        const configs = await this.getConfigs();
        return configs.find(config => config.messageId === messageId);
    }
}