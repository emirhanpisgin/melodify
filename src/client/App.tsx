/// <reference path="../types/global.d.ts" />

import { useState } from "react";
import HomePage from "./components/HomePage";
import Navbar from "./components/Navbar";

export type ViewKey = "home" | "donate" | "settings" | "about";

export default function App() {
    const [view, setView] = useState<ViewKey>("home");

    return (
        <div className="flex flex-col justify-center items-center h-screen w-screen bg-black text-white">
            <Navbar currentView={view} setView={(view) => setView(view)} />
            <HomePage />
        </div>
    );
}
