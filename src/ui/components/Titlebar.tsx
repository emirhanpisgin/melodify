// Titlebar.tsx
// Custom title bar component for the Electron app, including app name, version, update status, and window controls.

import React from "react";
import { SettingsIcon, XIcon, Music, TestTube } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Props for the Titlebar component.
 * @property onMinimize - Function to minimize the window.
 * @property onClose - Function to close the window.
 * @property onSettings - Function to open the settings page.
 */
interface TitlebarProps {
    onMinimize: () => void;
    onClose: () => void;
    onSettings: () => void;
}

/**
 * Renders the custom title bar for the Electron app.
 * Displays app name, version, update status, and window controls.
 */
export default function Titlebar({
    onMinimize,
    onClose,
    onSettings,
}: TitlebarProps) {
    const { t } = useTranslation();
    const isDevelopment = process.env.NODE_ENV === "development";

    const openUITestWindow = () => {
        window.electronAPI?.openUITestWindow();
    };

    return (
        <div
            className="w-full flex items-center border-b border-zinc-700/50 justify-between bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 h-9 select-none pl-2 gap-3"
            style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        >
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-md flex items-center justify-center">
                        <Music className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex items-center font-bold text-white">
                        {t("app.name")}
                    </div>
                </div>
            </div>

            <div
                className="flex items-center h-full ml-auto"
                style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
            >
                {isDevelopment && (
                    <button
                        className="h-full aspect-[1.25_/_1] flex items-center justify-center transition-colors hover:bg-blue-500/20 text-blue-400 border-none bg-transparent focus:outline-none"
                        onClick={openUITestWindow}
                        title="UI Test Window (Dev Only)"
                        aria-label="Open UI Test Window"
                        tabIndex={-1}
                    >
                        <TestTube className="size-4" />
                    </button>
                )}
                <button
                    className="h-full aspect-[1.25_/_1] flex items-center justify-center transition-colors hover:bg-white/10 text-zinc-300 border-none bg-transparent focus:outline-none"
                    onClick={onSettings}
                    title="Settings"
                    aria-label="Open Settings"
                    tabIndex={-1}
                >
                    <SettingsIcon className="size-4" />
                </button>
                <button
                    className="h-full aspect-[1.25_/_1] flex items-center justify-center transition-colors hover:bg-white/10 text-zinc-300 border-none bg-transparent focus:outline-none"
                    onClick={onMinimize}
                    title="Minimize"
                    aria-label="Minimize window"
                    tabIndex={-1}
                >
                    <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                        <rect
                            y="7.5"
                            width="16"
                            height="1"
                            rx="0.5"
                            fill="currentColor"
                        />
                    </svg>
                </button>
                <button
                    className="h-full aspect-[1.25_/_1] flex items-center justify-center transition-colors hover:bg-red-500 text-zinc-300 border-none bg-transparent focus:outline-none"
                    onClick={onClose}
                    title={t("common.close")}
                    aria-label="Close application"
                    tabIndex={-1}
                >
                    <XIcon className="size-5" />
                </button>
            </div>
        </div>
    );
}
