import * as fs from "fs/promises";
import path from "path";

export interface ServerConfig {
    notificationChannelId?: string | null;
    pingRoleId?: string | null;
}

interface AllConfigs {
    [guildId: string]: ServerConfig;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE_PATH = path.join(DATA_DIR, 'server-configs.json');

export class ServerConfigManager {
    public static async getAllConfigs(): Promise<AllConfigs> {
        try {
            await fs.mkdir(DATA_DIR, { recursive: true });
            const data = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');
            return JSON.parse(data) as AllConfigs;
        } catch (error) {
            return {};
        }
    }

    private static async saveAllConfigs(configs: AllConfigs): Promise<void> {
        await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(configs, null, 2));
    }

    public static async getConfig(guildId: string): Promise<ServerConfig> {
        const configs = await this.getAllConfigs();
        return configs[guildId] || {};
    }

    public static async setNotificationChannel(guildId: string, channelId: string): Promise<void> {
        const configs = await this.getAllConfigs();

        if (!configs[guildId]) {
            configs[guildId] = {}
        }
        configs[guildId].notificationChannelId = channelId;
        await this.saveAllConfigs(configs);
    }

    public static async clearNotificationsChannel(guildId: string): Promise<void> {
        const configs = await this.getAllConfigs();

        if (configs[guildId]) {
            configs[guildId].notificationChannelId = null;
            await this.saveAllConfigs(configs);
        }
    }

    public static async setRoleId(guildId: string, pingRoleId: string): Promise<void> {
        const configs = await this.getAllConfigs();

        if (!configs[guildId]) {
            configs[guildId] = {}
            configs[guildId].pingRoleId = pingRoleId;
        } else {
            configs[guildId].pingRoleId = pingRoleId;
        }

        await this.saveAllConfigs(configs);
    }
}