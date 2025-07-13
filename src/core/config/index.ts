import fs from "fs";
import path from "path";
import { app } from "electron";
import { logInfo, logError, logDebug } from "@/core/logging";
import { redactSecrets } from "@/core/logging/utils";

/**
 * Configuration management system with multi-language support
 * Handles secure storage of API credentials, user preferences, and translated default templates
 * Automatically merges user customizations with language-specific defaults
 */

/**
 * Complete application configuration interface
 * Includes API tokens, user preferences, and localized message templates
 */
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

    // Language setting
    language?: string;

    // Track which language defaults are currently being used (internal field)
    defaultsLanguage?: string;

    // Command reply toggles and templates
    replyOnSongRequest?: boolean;
    songRequestReplyTemplate?: string;
    replyOnSongRequestError?: boolean;
    songRequestErrorTemplate?: string;
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
    replyOnCooldown?: boolean;
    cooldownMessageTemplate?: string;
}

/**
 * Returns language-specific default configuration values
 * Used when changing languages to provide appropriate default templates and aliases
 *
 * @param language - Target language code ('en', 'tr', etc.)
 * @returns Object containing translated defaults for templates and command aliases
 */
function getTranslatedDefaults(language: string = "en") {
    const translations = {
        en: {
            songRequestReplyTemplate: "✅ Added to queue: {title} by {artist}",
            songRequestErrorTemplate: "❌ Song not found or unavailable",
            volumeChangeReplyTemplate: "🔊 Volume changed to {volume}%",
            volumeErrorTemplate: "❌ Failed to change volume",
            volumeGetReplyTemplate: "Current Spotify volume is {volume}%",
            cooldownMessageTemplate:
                "Please wait {time} seconds before requesting another song.",
            currentSongFormat: "{title} - {artist}",
            // Command aliases for English
            commandsConfig: {
                sr: { aliases: ["song", "request"], enabled: true },
                volume: { aliases: ["vol"], enabled: true },
            },
        },
        tr: {
            songRequestReplyTemplate: "✅ Sıraya eklendi: {title} - {artist}",
            songRequestErrorTemplate: "❌ Şarkı bulunamadı veya erişilemiyor",
            volumeChangeReplyTemplate:
                "🔊 Ses seviyesi {volume}% olarak ayarlandı",
            volumeErrorTemplate: "❌ Ses seviyesi ayarlanamadı",
            volumeGetReplyTemplate: "Mevcut Spotify ses seviyesi {volume}%",
            cooldownMessageTemplate:
                "Başka bir şarkı istemek için {time} saniye bekleyin.",
            currentSongFormat: "{title} - {artist}",
            // Command aliases for Turkish
            commandsConfig: {
                sr: { aliases: ["şarkı", "istek", "song"], enabled: true },
                volume: { aliases: ["ses", "vol"], enabled: true },
            },
        },
    };

    return (
        translations[language as keyof typeof translations] || translations.en
    );
}

const defaultConfig: AppConfig = {
    canAnyonePlaySong: false,
    prefix: "!",
    language: "en",
    autoUpdateEnabled: true,
    minimizeToTray: false,
    replyOnSongRequest: true,
    replyOnSongRequestError: false,
    replyOnCooldown: true,
    replyOnVolumeChange: true,
    replyOnVolumeError: false,
    replyOnVolumeGet: true,
    allowedBadges: ["og", "vip", "subscriber"],
    customModerators: [],
    saveCurrentSongToFile: false,
    currentSongFilePath: path.join(app.getPath("userData"), "current-song.txt"),
    kickRedirectUri: "http://localhost:8889/callback",
    spotifyRedirectUri: "http://127.0.0.1:8888/callback",

    // Cooldown settings
    globalCooldownEnabled: true,
    globalCooldownSeconds: "30",
    perUserCooldownEnabled: true,
    perUserCooldownSeconds: "60",

    // Track which language defaults are currently being used
    defaultsLanguage: "en",

    // Default translated message templates and commands (will be set based on language)
    ...getTranslatedDefaults("en"),
};

const storePath = path.join(app.getPath("userData"), "config.json");

let cache: AppConfig = { ...defaultConfig };

function load(): void {
    try {
        if (fs.existsSync(storePath)) {
            const raw = fs.readFileSync(storePath, "utf-8");
            const savedConfig = JSON.parse(raw);
            cache = { ...defaultConfig, ...savedConfig };

            // Check if we need to update translated defaults for the current language
            const currentLanguage = cache.language || "en";
            const defaultsLanguage = cache.defaultsLanguage || "en";

            if (currentLanguage !== defaultsLanguage) {
                logInfo(
                    `Language changed from ${defaultsLanguage} to ${currentLanguage}, updating translated defaults`
                );
                updateTranslatedDefaults();
            } else {
                save();
            }

            logInfo("Loaded config from disk", redactSecrets(cache));
        } else {
            // First time setup - detect system language and apply appropriate defaults
            logInfo(
                "No config file found, creating new configuration with system language defaults"
            );

            // Try to detect system language (simplified detection)
            const systemLanguage = detectSystemLanguage();
            cache.language = systemLanguage;
            cache.defaultsLanguage = systemLanguage;

            // Apply the correct language defaults from the start
            if (systemLanguage !== "en") {
                const translatedDefaults =
                    getTranslatedDefaults(systemLanguage);
                Object.keys(translatedDefaults).forEach((key) => {
                    const configKey = key as keyof typeof translatedDefaults;
                    (cache as any)[configKey] = translatedDefaults[configKey];
                });
                logInfo(
                    `Applied ${systemLanguage} defaults for first-time setup`
                );
            }

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

/**
 * Updates the configuration with translated default templates based on the current language
 * This is useful when the language is changed to update default message templates
 *
 * Key behavior:
 * - Updates templates that are using any language's default values (prevents overriding user customizations)
 * - Compares current values against all supported language defaults to detect user modifications
 * - Preserves user-customized content while updating language-specific defaults
 * - Uses a tracking field to know which language defaults are currently active
 */
function updateTranslatedDefaults(): void {
    const currentLanguage = cache.language || "en";
    const translatedDefaults = getTranslatedDefaults(currentLanguage);

    // Get the language that the current defaults are from (or assume English if not set)
    const previousDefaultsLanguage = cache.defaultsLanguage || "en";
    const previousDefaults = getTranslatedDefaults(previousDefaultsLanguage);

    // Get all supported languages to check against all possible defaults
    const supportedLanguages = ["en", "tr"]; // Add more as supported
    const allDefaults = supportedLanguages.map((lang) => ({
        language: lang,
        defaults: getTranslatedDefaults(lang),
    }));

    Object.keys(translatedDefaults).forEach((key) => {
        const configKey = key as keyof typeof translatedDefaults;
        const currentValue = cache[configKey];

        // Check if current value matches any language's default (indicating it hasn't been customized)
        const isDefaultValue =
            !currentValue ||
            allDefaults.some(
                ({ defaults }) => currentValue === defaults[configKey]
            );

        // Update if the current value is a default value from any language
        if (isDefaultValue) {
            (cache as any)[configKey] = translatedDefaults[configKey];
            logDebug(
                `Updated ${configKey} from ${previousDefaultsLanguage} to ${currentLanguage} default`
            );
        } else {
            logDebug(
                `Preserved custom value for ${configKey}: ${currentValue}`
            );
        }
    });

    // Track which language defaults we're now using
    cache.defaultsLanguage = currentLanguage;
    save();
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
    updateTranslatedDefaults(): void {
        updateTranslatedDefaults();
    },
    getPath(): string {
        return storePath;
    },
};

/**
 * Detects the user's system language and returns a supported language code
 * Falls back to English if the system language is not supported
 *
 * @returns Supported language code ('en', 'tr', etc.)
 */
function detectSystemLanguage(): string {
    try {
        // Try to get system language from various sources
        const systemLang =
            process.env.LANG || // Linux/Mac
            process.env.LC_ALL || // Linux/Mac
            process.env.LC_MESSAGES || // Linux/Mac
            app.getSystemLocale() || // Electron
            "en-US"; // Fallback

        // Extract language code (e.g., 'tr' from 'tr-TR' or 'tr_TR')
        const langCode = systemLang.split(/[-_]/)[0].toLowerCase();

        // Check if we support this language
        const supportedLanguages = ["en", "tr"];
        if (supportedLanguages.includes(langCode)) {
            logInfo(`Detected system language: ${langCode}`);
            return langCode;
        }

        logInfo(
            `Unsupported system language ${langCode}, falling back to English`
        );
        return "en";
    } catch (error) {
        logError(error, "detectSystemLanguage");
        return "en";
    }
}

export default Config;
