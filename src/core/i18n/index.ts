import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { translations } from "./translations";

// Import validation in development
if (process.env.NODE_ENV === "development") {
    import("./validator").then(({ logValidationResults }) => {
        logValidationResults();
    });
}

/**
 * Get saved language from config system
 * This ensures i18n uses the user's saved preference instead of browser detection
 */
function getSavedLanguage(): string {
    try {
        // This will be called during initialization, so we need to handle cases
        // where the config might not be immediately available
        if (typeof window !== 'undefined' && window.electronAPI) {
            // In renderer process, we'll set this up properly in the async initialization
            return 'en'; // Temporary fallback, will be updated in initializeApp
        }
        return 'en';
    } catch (error) {
        console.warn('Failed to get saved language from config:', error);
        return 'en';
    }
}

const resources = {
    en: { translation: translations.en },
    tr: { translation: translations.tr },
};

i18n.use(initReactI18next)
    .init({
        resources,
        lng: getSavedLanguage(), // Use saved language instead of detection
        fallbackLng: "en",
        debug: process.env.NODE_ENV === "development",

        interpolation: {
            escapeValue: false, // React already escapes values
        },

        react: {
            useSuspense: false,
        },
    });

export default i18n;
