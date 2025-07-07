import fs from "fs";
import path from "path";
import { app } from "electron";
import { logInfo, logError, logWarn, logDebug } from "../logging";
import { redactSecrets } from "../logging/utils";
import { z } from "zod";

export interface CommandConfig {
    aliases?: string[];
    enabled?: boolean;
}

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
    replyOnSongRequestError: true,
    songRequestErrorTemplate: "Error: {error}",
    replyOnCooldown: true,
    cooldownMessageTemplate:
        "Please wait {time} seconds before requesting another song.",
    replyOnVolumeChange: true,
    volumeChangeReplyTemplate: "Volume changed to {volume}%",
    replyOnVolumeError: true,
    volumeErrorTemplate: "Error: {error}",
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
        const result = keys.reduce(
            (acc, key) => {
                acc[key] = cache[key];
                return acc;
            },
            {} as Pick<AppConfig, K>
        );
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

// Enhanced validation schema with stricter rules
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
    prefix: z
        .string()
        .min(1, "Prefix cannot be empty")
        .max(10, "Prefix too long")
        .optional(),
    rewardTitle: z.string().max(100, "Reward title too long").optional(),
    spotifyClientId: z
        .string()
        .min(10, "Client ID too short")
        .max(100, "Client ID too long")
        .regex(/^[a-zA-Z0-9_-]+$/, "Invalid Client ID format")
        .optional(),
    spotifyClientSecret: z
        .string()
        .min(20, "Client Secret too short")
        .max(200, "Client Secret too long")
        .optional(),
    kickClientId: z
        .string()
        .min(10, "Client ID too short")
        .max(100, "Client ID too long")
        .regex(/^[a-zA-Z0-9_-]+$/, "Invalid Client ID format")
        .optional(),
    kickClientSecret: z
        .string()
        .min(20, "Client Secret too short")
        .max(200, "Client Secret too long")
        .optional(),
    currentSongFormat: z.string().max(200, "Song format too long").optional(),
    autoUpdateEnabled: z.boolean().optional(),
    startOnStartup: z.boolean().optional(),
    minimizeToTray: z.boolean().optional(),
    replyOnSongRequest: z.boolean().optional(),
    songRequestReplyTemplate: z
        .string()
        .max(500, "Template too long")
        .optional(),
    replyOnSongRequestError: z.boolean().optional(),
    songRequestErrorTemplate: z
        .string()
        .max(500, "Template too long")
        .optional(),
    replyOnCooldown: z.boolean().optional(),
    cooldownMessageTemplate: z
        .string()
        .max(500, "Template too long")
        .optional(),
    replyOnVolumeChange: z.boolean().optional(),
    volumeChangeReplyTemplate: z
        .string()
        .max(500, "Template too long")
        .optional(),
    replyOnVolumeError: z.boolean().optional(),
    volumeErrorTemplate: z.string().max(500, "Template too long").optional(),
    replyOnVolumeGet: z.boolean().optional(),
    volumeGetReplyTemplate: z.string().max(500, "Template too long").optional(),
    commandsConfig: z
        .record(
            z.string(),
            z.object({
                aliases: z
                    .array(
                        z
                            .string()
                            .min(1, "Alias cannot be empty")
                            .max(20, "Alias too long")
                            .regex(/^[a-zA-Z0-9_-]+$/, "Invalid alias format")
                    )
                    .max(10, "Too many aliases")
                    .optional(),
                enabled: z.boolean().optional(),
            })
        )
        .optional(),
    allowedBadges: z
        .array(
            z
                .string()
                .min(1, "Badge cannot be empty")
                .max(20, "Badge name too long")
        )
        .max(50, "Too many badges")
        .optional(),
    customModerators: z
        .array(
            z
                .string()
                .min(1, "Username cannot be empty")
                .max(50, "Username too long")
                .regex(/^[a-zA-Z0-9_-]+$/, "Invalid username format")
        )
        .max(100, "Too many custom moderators")
        .optional(),
    saveCurrentSongToFile: z.boolean().optional(),
    currentSongFilePath: z.string().max(500, "File path too long").optional(),
    kickRedirectUri: z
        .string()
        .url("Invalid Kick redirect URI")
        .max(200, "URI too long")
        .optional(),
    spotifyRedirectUri: z
        .string()
        .url("Invalid Spotify redirect URI")
        .max(200, "URI too long")
        .optional(),

    // Cooldown settings
    globalCooldownEnabled: z.boolean().optional(),
    globalCooldownSeconds: z
        .string()
        .regex(/^\d+$/, "Must be a number")
        .optional(),
    perUserCooldownEnabled: z.boolean().optional(),
    perUserCooldownSeconds: z
        .string()
        .regex(/^\d+$/, "Must be a number")
        .optional(),
});

// Runtime validation functions
export function validateClientId(id: string): string | null {
    if (!id.trim()) return "Client ID cannot be empty";
    if (id.length < 10) return "Client ID seems too short";
    if (id.length > 100) return "Client ID seems too long";
    if (!/^[a-zA-Z0-9_-]+$/.test(id))
        return "Client ID contains invalid characters";
    return null;
}

export function validateClientSecret(secret: string): string | null {
    if (!secret.trim()) return "Client Secret cannot be empty";
    if (secret.length < 20) return "Client Secret seems too short";
    if (secret.length > 200) return "Client Secret seems too long";
    return null;
}

export function validateUrl(url: string): string | null {
    if (!url.trim()) return "URL cannot be empty";
    try {
        new URL(url);
        return null;
    } catch {
        return "Please enter a valid URL";
    }
}

export function validateTemplate(
    template: string,
    allowedVars: string[]
): string | null {
    if (!template.trim()) return "Template cannot be empty";
    if (template.length > 500)
        return "Template must be no more than 500 characters";

    // Check for valid variables
    const variableRegex = /\{([^}]+)\}/g;
    const matches = template.match(variableRegex);
    if (matches) {
        for (const match of matches) {
            const varName = match.slice(1, -1);
            if (!allowedVars.includes(varName)) {
                return `Invalid variable: {${varName}}. Allowed: ${allowedVars.join(", ")}`;
            }
        }
    }
    return null;
}

export function validateCommandAlias(
    alias: string,
    existingAliases: string[],
    commandName: string
): string | null {
    if (!alias.trim()) return "Alias cannot be empty";
    if (alias.length < 1) return "Alias must be at least 1 character";
    if (alias.length > 20) return "Alias must be no more than 20 characters";
    if (!/^[a-zA-Z0-9_-]+$/.test(alias))
        return "Alias can only contain letters, numbers, hyphens, and underscores";
    if (alias === commandName)
        return "Alias cannot be the same as the command name";
    if (existingAliases.includes(alias)) return "This alias already exists";
    return null;
}

export function validateAppConfig(config: any): AppConfig | null {
    const result = AppConfigSchema.safeParse(config);
    if (!result.success) {
        logError(
            "Invalid config: " + JSON.stringify(result.error.format()),
            "config:validate"
        );
        return null;
    }
    return result.data;
}
