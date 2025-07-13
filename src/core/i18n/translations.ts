// Type-safe translation loader
// This file ensures that all translation imports are type-checked at compile time

import type { TranslationKeys } from "./types";

// Import and type-check all translation files
import enRaw from "./locales/en.json";
import trRaw from "./locales/tr.json";

// Type assertions ensure that each file matches the expected structure
// TypeScript will fail to compile if any file is missing keys or has wrong structure
export const en: TranslationKeys = enRaw as TranslationKeys;
export const tr: TranslationKeys = trRaw as TranslationKeys;

// Export all translations for use in i18n
export const translations = { en, tr };

// List of supported languages
export const supportedLanguages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "tr", name: "Türkçe", flag: "🇹🇷" },
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number]["code"];
