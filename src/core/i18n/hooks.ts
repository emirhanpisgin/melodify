import {
    useTranslation as useI18nTranslation,
    UseTranslationResponse,
} from "react-i18next";

/**
 * Custom hook that wraps react-i18next's useTranslation
 * Provides additional functionality and type safety
 */
export function useTranslation(): UseTranslationResponse<
    "translation",
    undefined
> {
    return useI18nTranslation();
}

/**
 * Hook for getting the current language
 */
export function useLanguage() {
    const { i18n } = useI18nTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return {
        currentLanguage: i18n.language,
        changeLanguage,
        languages: ["en", "es", "fr", "de", "tr"],
    };
}
