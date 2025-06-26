/// <reference path="../types/global.d.ts" />

import React, { useState } from "react";
import HomePage from "./components/HomePage";
import Navbar from "./components/Navbar";
import Settings from "./components/Settings";

/**
 * Root application component. Sets up the main layout and theme.
 */
export default function App() {
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <div className="flex flex-col justify-center items-center h-screen w-screen bg-black text-white">
            <Navbar onSettingsClick={() => setSettingsOpen(true)} />
            <HomePage />
            {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
        </div>
    );
}
