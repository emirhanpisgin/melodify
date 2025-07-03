/// <reference path="../types/global.d.ts" />

import { ErrorBoundary } from "./components/ErrorBoundary";
import { useState } from "react";
import HomePage from "./components/HomePage";
import Settings from "./components/Settings";
import Titlebar from "./components/Titlebar";
import UpdateDialog from "./components/UpdateDialog";

export default function App() {
    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleMinimize = () => {
        window.electronAPI?.minimize?.();
    };
    const handleClose = () => {
        window.electronAPI?.close?.();
    };
    const handleSettings = () => setSettingsOpen(state => !state);

    return (
        <ErrorBoundary>
            <div className="flex flex-col h-[100vh] w-screen bg-zinc-900 text-white">
                <Titlebar onMinimize={handleMinimize} onClose={handleClose} onSettings={handleSettings} />
                <div className="flex-1 flex flex-col justify-center items-center">
                    <HomePage />
                    {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
                </div>
                <UpdateDialog />
            </div>
        </ErrorBoundary>
    );
}
