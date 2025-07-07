// Titlebar.tsx
// Custom title bar component for the Electron app, including app name, version, update status, and window controls.

import React, { useEffect, useState } from "react";
import { SettingsIcon } from "lucide-react";
import { useUpdateStatus } from "../hooks/useUpdateStatus";
import { InfoIcon, LoaderCircleIcon, RotateCcwIcon, XIcon } from "lucide-react";

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
export default function Titlebar({ onMinimize, onClose, onSettings }: TitlebarProps) {
    const { status, progress } = useUpdateStatus();
    const [version, setVersion] = useState<string>("");

    useEffect(() => {
        // Fetch the app version from the main process
        window.electronAPI.getAppVersion?.().then(setVersion);
    }, []);

    // Determine which update icon and tooltip to show based on update status
    let updateIcon = null;
    let tooltip = "";
    if (status === "checking" || status === "downloading") {
        updateIcon = <LoaderCircleIcon className="text-green-500 animate-spin" />;
        tooltip = status === "checking" ? "Checking for updates..." : `Downloading update... ${progress.percent.toFixed(0)}%`;
    } else if (status === "available") {
        updateIcon = <InfoIcon className="text-green-500" />;
        tooltip = "Update available!";
    } else if (status === "downloaded") {
        updateIcon = <RotateCcwIcon className="text-orange-500" />;
        tooltip = "Update downloaded! Restart to apply.";
    } else if (status === "error") {
        updateIcon = <InfoIcon className="text-red-500" />;
        tooltip = "Update error!";
    } else {
        updateIcon = null;
        tooltip = "App is up to date.";
    }

    return (
        <div
            className="w-full flex items-center border-b border-zinc-700 justify-between bg-zinc-900 h-9 select-none"
            //@ts-ignore
            style={{ WebkitAppRegion: 'drag' }}
        >
            {/* App name */}
            <div className="flex items-center pl-4 font-bold text-lg text-white">
                <span className="text-spotify-green">Song</span><span className="text-kick-green">ülfy</span>
            </div>
            {/* Version and update status */}
            <div className="flex items-center gap-2 font-bold text-lg text-gray-600">
                <span className="flex items-center gap-2" title={tooltip}>
                    <span>{version}</span>
                    {updateIcon}
                </span>
            </div>
            <div className="flex-1" />
            {/* Window controls */}
            {/* @ts-ignore */}
            <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag', }}>
                <div className="h-full aspect-[1.25_/_1] flex items-center justify-center transition-colors hover:bg-white/10 text-zinc-300" onClick={onSettings} title="Settings" tabIndex={-1}>
                    <SettingsIcon className="size-5" />
                </div>
                <div className="h-full aspect-[1.25_/_1] flex items-center justify-center transition-colors hover:bg-white/10 text-zinc-300" onClick={onMinimize} title="Minimize" tabIndex={-1}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><rect y="7.5" width="16" height="1" rx="0.5" fill="currentColor" /></svg>
                </div>
                <div className="h-full aspect-[1.25_/_1] flex items-center justify-center transition-colors hover:bg-red-500 text-zinc-300" onClick={onClose} title="Close" tabIndex={-1}>
                    <XIcon className="size-5" />
                </div>
            </div>
        </div>
    );
}
