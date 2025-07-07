import fs from "fs";
import path from "path";
import { app } from "electron";
import { logInfo, logError, logDebug } from "../logging";
import { redactSecrets } from "../logging/utils";

interface CommandConfig {
    aliases?: string[];
    enabled?: boolean;
}

interface AppConfig {
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
    currentSongFormat?: string;

    // Auto update preference
    autoUpdateEnabled?: boolean;

    // Startup preference
    startOnStartup?: boolean;

    // Window behavior
    minimizeToTray?: boolean;

    // Command reply toggles and templates
    replyOnSongRequest?: boolean;
    songRequestReplyTemplate?: string;
    replyOnSongRequestError?: boolean;
    songRequestErrorTemplate?: string;
    replyOnCooldown?: boolean;
    cooldownMessageTemplate?: string;
    replyOnVolumeChange?: boolean;
    volumeChangeReplyTemplate?: string;
    replyOnVolumeError?: boolean;
    volumeErrorTemplate?: string;
    replyOnVolumeGet?: boolean;
    volumeGetReplyTemplate?: string;

    commandsConfig?: {
        [commandName: string]: CommandConfig;
    };

    allowedBadges?: string[];
    customModerators?: string[];
    saveCurrentSongToFile?: boolean;
    currentSongFilePath?: string;
    kickRedirectUri?: string;
    spotifyRedirectUri?: string;

    // Cooldown settings
    globalCooldownEnabled?: boolean;
    globalCooldownSeconds?: string;
    perUserCooldownEnabled?: boolean;
    perUserCooldownSeconds?: string;
}

const defaultConfig: AppConfig = {
    canAnyonePlaySong: false,
    prefix: "!",
    currentSongFormat: "{title} - {artist}",
    autoUpdateEnabled: true,
    minimizeToTray: false,
    replyOnSongRequest: true,
    songRequestReplyTemplate: "Added to queue: {title} by {artist}",
    replyOnSongRequestError: false,
    songRequestErrorTemplate: "Something went wrong, try again later.",
    replyOnCooldown: true,
    cooldownMessageTemplate:
        "Please wait {time} seconds before requesting another song.",
    replyOnVolumeChange: true,
    volumeChangeReplyTemplate: "Volume changed to {volume}%",
    replyOnVolumeError: false,
    volumeErrorTemplate: "Something went wrong, try again later.",
    replyOnVolumeGet: true,
    volumeGetReplyTemplate: "Current Spotify volume is {volume}%",
    commandsConfig: {
        sr: { aliases: ["song", "request"], enabled: true },
        volume: { aliases: ["vol"], enabled: true },
    },
    allowedBadges: ["og", "vip", "subscriber"], // User-configurable roles (broadcaster always allowed)
    customModerators: [], // Custom moderators for app commands
    saveCurrentSongToFile: false, // Save current song to file
    currentSongFilePath: path.join(app.getPath("userData"), "current-song.txt"), // Default path in userData
    kickRedirectUri: "http://localhost:8889/callback",
    spotifyRedirectUri: "http://127.0.0.1:8888/callback",

    // Cooldown settings
    globalCooldownEnabled: true,
    globalCooldownSeconds: "30",
    perUserCooldownEnabled: true,
    perUserCooldownSeconds: "60",
};

const storePath = path.join(app.getPath("userData"), "config.json");

let cache: AppConfig = { ...defaultConfig };

function load(): void {
    try {
        if (fs.existsSync(storePath)) {
            const raw = fs.readFileSync(storePath, "utf-8");
            cache = { ...defaultConfig, ...JSON.parse(raw) };
            save();
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
