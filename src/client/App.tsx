/// <reference path="../types/global.d.ts" />

import { useState } from "react";
import HomePage from "./components/HomePage";
import Settings from "./components/Settings";
import Titlebar from "./components/Titlebar";

/**
 * Root application component. Sets up the main layout and theme.
 */
export default function App() {
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Window controls via preload
    const handleMinimize = () => {
        window.electronAPI?.minimize?.();
    };
    const handleClose = () => {
        window.electronAPI?.close?.();
    };
    const handleSettings = () => setSettingsOpen(true);

    return (
        <div className="flex flex-col h-[100vh] w-screen bg-zinc-900 text-white">
            <Titlebar onMinimize={handleMinimize} onClose={handleClose} onSettings={handleSettings} />
            <div className="flex-1 flex flex-col justify-center items-center">
                <HomePage />
                {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
            </div>
        </div>
    );
}
