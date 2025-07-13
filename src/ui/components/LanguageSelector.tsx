import React from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { supportedLanguages } from "@/core/i18n/translations";

interface LanguageSelectorProps {
    onLanguageChange?: (language: string) => void;
}

export default function LanguageSelector({
    onLanguageChange,
}: LanguageSelectorProps) {
    const { i18n } = useTranslation();

    const handleLanguageChange = (languageCode: string) => {
        i18n.changeLanguage(languageCode);
        // Call the callback to update config and translated defaults
        onLanguageChange?.(languageCode);
    };

    return (
        <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 rounded text-white text-sm transition-colors">
                <Globe size={16} />
                <span className="hidden sm:inline">
                    {supportedLanguages.find(
                        (lang) => lang.code === i18n.language
                    )?.name || "English"}
                </span>
                <span className="sm:hidden">
                    {supportedLanguages.find(
                        (lang) => lang.code === i18n.language
                    )?.flag || "🇺🇸"}
                </span>
            </button>

            <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-zinc-600 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[140px]">
                {supportedLanguages.map((language) => (
                    <button
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-zinc-700 transition-colors first:rounded-t-md last:rounded-b-md ${
                            i18n.language === language.code
                                ? "bg-zinc-700 text-white"
                                : "text-zinc-300"
                        }`}
                    >
                        <span className="text-lg">{language.flag}</span>
                        <span>{language.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
