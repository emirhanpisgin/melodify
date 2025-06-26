import fs from "fs";
import path from "path";
import { app } from "electron";

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
    canUsersPlaySong?: boolean;
    prefix?: string;

    // API secrets
    spotifyClientId?: string;
    spotifyClientSecret?: string;
    kickClientId?: string;
    kickClientSecret?: string;
}

const defaultConfig: AppConfig = {
    canUsersPlaySong: false,
    prefix: "!sr",
};

const storePath = path.join(app.getPath("userData"), "config.json");

let cache: AppConfig = { ...defaultConfig };

/**
 * Load configuration from disk into memory cache.
 */
function load(): void {
    try {
        if (fs.existsSync(storePath)) {
            const raw = fs.readFileSync(storePath, "utf-8");
            cache = { ...defaultConfig, ...JSON.parse(raw) };
        } else {
            save();
        }
    } catch (err) {
        console.error("[Config] Failed to load config:", err);
        cache = { ...defaultConfig };
    }
}

/**
 * Save current memory cache to disk.
 */
function save(): void {
    try {
        fs.writeFileSync(storePath, JSON.stringify(cache, null, 2), "utf-8");
    } catch (err) {
        console.error("[Config] Failed to save config:", err);
    }
}

load();

// Overloaded function declarations
function get(): AppConfig;
function get<K extends keyof AppConfig>(key: K): AppConfig[K];
function get(key?: keyof AppConfig) {
    return typeof key === "undefined" ? { ...cache } : cache[key];
}

const Config = {
    get,
    getMany<K extends keyof AppConfig>(keys: K[]): Pick<AppConfig, K> {
        return keys.reduce((acc, key) => {
            acc[key] = cache[key];
            return acc;
        }, {} as Pick<AppConfig, K>);
    },

    set(data: Partial<AppConfig>): void {
        cache = { ...cache, ...data };
        save();
    },

    setMany<K extends keyof AppConfig>(entries: [K, AppConfig[K]][]): void {
        for (const [key, value] of entries) {
            cache[key] = value;
        }
        save();
    },

    reset(): void {
        cache = { ...defaultConfig };
        save();
    },

    getPath(): string {
        return storePath;
    },
};

export default Config;
