import React, { useState } from "react";

const TABS = [
    { key: "general", label: "General" },
    { key: "spotify", label: "Spotify" },
    { key: "kick", label: "Kick" },
    { key: "secrets", label: "Secrets" },
];

export default function Settings({ onClose }: { onClose: () => void }) {
    const [tab, setTab] = useState("general");
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-zinc-900 rounded-lg shadow-lg w-[90vw] max-w-2xl h-[80vh] flex">
                {/* Tabs */}
                <div className="w-40 border-r border-zinc-800 flex flex-col py-6 px-2 gap-2">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            className={`text-left px-3 py-2 rounded transition-colors font-semibold ${tab === t.key ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800"}`}
                            onClick={() => setTab(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto relative">
                    <button
                        className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                        onClick={onClose}
                        aria-label="Close settings"
                    >
                        ×
                    </button>
                    {tab === "general" && <div><h2 className="text-xl font-bold mb-4">General Settings</h2><p>General app settings go here.</p></div>}
                    {tab === "spotify" && <div><h2 className="text-xl font-bold mb-4">Spotify Settings</h2><p>Spotify-specific settings go here.</p></div>}
                    {tab === "kick" && <div><h2 className="text-xl font-bold mb-4">Kick Settings</h2><p>Kick-specific settings go here.</p></div>}
                    {tab === "secrets" && <div><h2 className="text-xl font-bold mb-4">API Secrets</h2><p>API secrets management goes here.</p></div>}
                </div>
            </div>
        </div>
    );
}
