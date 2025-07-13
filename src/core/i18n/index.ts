import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { translations } from "./translations";

// Import validation in development
if (process.env.NODE_ENV === "development") {
    import("./validator").then(({ logValidationResults }) => {
        logValidationResults();
    });
}

const resources = {
    en: { translation: translations.en },
    tr: { translation: translations.tr },
};

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: "en",
        debug: process.env.NODE_ENV === "development",

        interpolation: {
            escapeValue: false, // React already escapes values
        },

        detection: {
            order: ["localStorage", "navigator", "htmlTag"],
            lookupLocalStorage: "melodify-language",
            caches: ["localStorage"],
        },

        react: {
            useSuspense: false,
        },
    });

export default i18n;
