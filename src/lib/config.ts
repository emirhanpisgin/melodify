import fs from "fs";
import path from "path";
import { app } from "electron";
import { logInfo, logError, logWarn, logDebug } from "./logger";
import { redactSecrets } from "./logger-utils";
import { z } from "zod";

export interface AppConfig {
    // Kick tokens
    kickAccessToken?: string;
    kickRefreshToken?: string;
    kickExpiresAt?: number;

    // Spotify tokens
    spotifyAccessToken?: string;
    spotifyRefreshToken?: string;
    spotifyExpiresAt?: number;

    // Common
    codeVerifier?: string;
    username?: string;
    userId?: string;
    chatroomId?: string;
    canAnyonePlaySong?: boolean;
    prefix?: string;
    rewardTitle?: string;

    // API secrets
    spotifyClientId?: string;
    spotifyClientSecret?: string;
    kickClientId?: string;
    kickClientSecret?: string;

    // Song reply message template
    songReplyMessage?: string;
    currentSongFormat?: string;

    // Auto update preference
    autoUpdateEnabled?: boolean;
}

const defaultConfig: AppConfig = {
    canAnyonePlaySong: false,
    prefix: "!sr",
    songReplyMessage:
        "Added to queue: {title} by {artist} (requested by {user})",
    currentSongFormat: "{title} - {artist}",
    autoUpdateEnabled: true,
};

const storePath = path.join(app.getPath("userData"), "config.json");

let cache: AppConfig = { ...defaultConfig };

function load(): void {
    try {
        if (fs.existsSync(storePath)) {
            const raw = fs.readFileSync(storePath, "utf-8");
            cache = { ...defaultConfig, ...JSON.parse(raw) };
            logInfo("Loaded config from disk", redactSecrets(cache));
        } else {
            save();
        }
    } catch (err) {
        logError(err, "config:load");
        cache = { ...defaultConfig };
    }
}

function save(): void {
    try {
        fs.writeFileSync(storePath, JSON.stringify(cache, null, 2), "utf-8");
        logInfo("Saved config to disk", redactSecrets(cache));
    } catch (err) {
        logError(err, "config:save");
    }
}

load();

function get(): AppConfig;
function get<K extends keyof AppConfig>(key: K): AppConfig[K];
function get(key?: keyof AppConfig) {
    return typeof key === "undefined" ? { ...cache } : cache[key];
}

const Config = {
    get,
    getMany<K extends keyof AppConfig>(keys: K[]): Pick<AppConfig, K> {
        const result = keys.reduce((acc, key) => {
            acc[key] = cache[key];
            return acc;
        }, {} as Pick<AppConfig, K>);
        logDebug("Config.getMany called", redactSecrets(result));
        return result;
    },
    set(data: Partial<AppConfig>): void {
        logInfo("Config.set called", redactSecrets(data));
        cache = { ...cache, ...data };
        save();
    },
    setMany<K extends keyof AppConfig>(entries: [K, AppConfig[K]][]): void {
        logInfo(
            "Config.setMany called",
            redactSecrets(Object.fromEntries(entries))
        );
        for (const [key, value] of entries) {
            cache[key] = value;
        }
        save();
    },
    reset(): void {
        logInfo("Config.reset called");
        cache = { ...defaultConfig };
        save();
    },
    getPath(): string {
        return storePath;
    },
};

export default Config;

export const AppConfigSchema = z.object({
    kickAccessToken: z.string().optional(),
    kickRefreshToken: z.string().optional(),
    kickExpiresAt: z.number().optional(),
    spotifyAccessToken: z.string().optional(),
    spotifyRefreshToken: z.string().optional(),
    spotifyExpiresAt: z.number().optional(),
    codeVerifier: z.string().optional(),
    username: z.string().optional(),
    userId: z.string().optional(),
    chatroomId: z.string().optional(),
    canAnyonePlaySong: z.boolean().optional(),
    prefix: z.string().optional(),
    rewardTitle: z.string().optional(),
    spotifyClientId: z.string().optional(),
    spotifyClientSecret: z.string().optional(),
    kickClientId: z.string().optional(),
    kickClientSecret: z.string().optional(),
    songReplyMessage: z.string().optional(),
    currentSongFormat: z.string().optional(),
    autoUpdateEnabled: z.boolean().optional(),
});

export function validateAppConfig(config: any): AppConfig | null {
    const result = AppConfigSchema.safeParse(config);
    if (!result.success) {
        logError("Invalid config: " + JSON.stringify(result.error.format()), "config:validate");
        return null;
    }
    return result.data;
}
