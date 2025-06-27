import React from "react";
import SettingsIcon from "./icons/SettingsIcon";
import CrossIcon from "./icons/CrossIcon";

interface TitlebarProps {
    onMinimize: () => void;
    onClose: () => void;
    onSettings: () => void;
}

export default function Titlebar({ onMinimize, onClose, onSettings }: TitlebarProps) {

    return (
        <div
            className="w-full flex items-center border-b border-zinc-700 justify-between bg-zinc-900 h-9 select-none"
            //@ts-ignore
            style={{ WebkitAppRegion: 'drag' }}
        >
            <div className="flex-1 flex items-center px-4 font-bold text-lg text-white">
                <span className="text-spotify-green">Song</span><span className="text-kick-green">ülfy</span>
            </div>
            <div className="flex-1" />
            {/* @ts-ignore */}
            <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag', }}>
                <div className="h-full aspect-[1.25_/_1] flex items-center justify-center transition-colors hover:bg-white/10 text-zinc-300" onClick={onSettings} title="Settings" tabIndex={-1}>
                    <SettingsIcon className="size-4" />
                </div>
                <div className="h-full aspect-[1.25_/_1] flex items-center justify-center transition-colors hover:bg-white/10 text-zinc-300" onClick={onMinimize} title="Minimize" tabIndex={-1}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><rect y="7.5" width="16" height="1" rx="0.5" fill="currentColor" /></svg>
                </div>
                <div className="h-full aspect-[1.25_/_1] flex items-center justify-center transition-colors hover:bg-red-500 text-zinc-300" onClick={onClose} title="Close" tabIndex={-1}>
                    <CrossIcon className="size-3" />
                </div>
            </div>
        </div>
    );
}
