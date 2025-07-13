// Translation validation utility
// Validates that all translation files have the same structure

import type { TranslationKeys } from "./types";

// Import all translation files
import en from "./locales/en.json";
import tr from "./locales/tr.json";

// Type assertion to ensure the English file matches our type definition
const englishTranslations: TranslationKeys = en as TranslationKeys;

// Helper function to get all nested keys from an object
function getNestedKeys(obj: any, prefix = ""): string[] {
    let keys: string[] = [];

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;

            if (
                typeof obj[key] === "object" &&
                obj[key] !== null &&
                !Array.isArray(obj[key])
            ) {
                keys = keys.concat(getNestedKeys(obj[key], fullKey));
            } else {
                keys.push(fullKey);
            }
        }
    }

    return keys.sort();
}

// Get all expected keys from the English translation
const expectedKeys = getNestedKeys(englishTranslations);

// Validation function for a single translation file
function validateTranslationFile(
    translations: any,
    language: string,
    expectedKeys: string[]
): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const actualKeys = getNestedKeys(translations);

    // Check for missing keys
    const missingKeys = expectedKeys.filter((key) => !actualKeys.includes(key));
    if (missingKeys.length > 0) {
        errors.push(`Missing keys in ${language}: ${missingKeys.join(", ")}`);
    }

    // Check for extra keys
    const extraKeys = actualKeys.filter((key) => !expectedKeys.includes(key));
    if (extraKeys.length > 0) {
        errors.push(`Extra keys in ${language}: ${extraKeys.join(", ")}`);
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

// Validate all translation files
export function validateAllTranslations(): {
    isValid: boolean;
    errors: string[];
    summary: { [language: string]: boolean };
} {
    const allErrors: string[] = [];
    const summary: { [language: string]: boolean } = {};

    // Validate each language
    const languages = [
        { code: "en", translations: en, name: "English" },
        { code: "tr", translations: tr, name: "Turkish" },
    ];

    for (const lang of languages) {
        const result = validateTranslationFile(
            lang.translations,
            lang.name,
            expectedKeys
        );
        summary[lang.name] = result.isValid;

        if (!result.isValid) {
            allErrors.push(...result.errors);
        }
    }

    return {
        isValid: allErrors.length === 0,
        errors: allErrors,
        summary,
    };
}

// Function to log validation results (useful during development)
export function logValidationResults(): void {
    const results = validateAllTranslations();

    if (results.isValid) {
        console.log(
            "✅ All translation files are valid and have matching keys!"
        );
    } else {
        console.error("❌ Translation validation failed:");
        results.errors.forEach((error) => console.error(`  - ${error}`));

        console.log("\nSummary:");
        Object.entries(results.summary).forEach(([lang, isValid]) => {
            console.log(`  ${isValid ? "✅" : "❌"} ${lang}`);
        });
    }
}

// Export the English translations as the reference type
export { englishTranslations };
export default validateAllTranslations;
