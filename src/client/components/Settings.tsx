import { useState, useEffect } from "react";

const TABS = [
    { key: "general", label: "General" },
    { key: "secrets", label: "Secrets" },
];

const secretFields = [
    { key: "spotifyClientId", label: "Spotify Client ID" },
    { key: "spotifyClientSecret", label: "Spotify Client Secret" },
    { key: "kickClientId", label: "Kick Client ID" },
    { key: "kickClientSecret", label: "Kick Client Secret" },
];

interface Config {
    prefix?: string;
    canAnyonePlaySong?: boolean;
    songReplyMessage?: string;
    allowedBadges?: string[];
    currentSongFormat?: string;
    [key: string]: string | boolean | string[] | undefined;
}

export default function Settings({ onClose }: { onClose: () => void }) {
    const [tab, setTab] = useState<string>("general");
    const [config, setConfig] = useState<Config>({});
    const [saveMessage, setSaveMessage] = useState<string>("");
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // IPC: get config on mount
    useEffect(() => {
        window.electronAPI.invoke("config:get").then(setConfig);
    }, []);

    // IPC: save config
    const handleSave = () => {
        window.electronAPI.send("config:set", config);
        setSaveMessage("Settings have been saved successfully.");
        setHasUnsavedChanges(false);
        setTimeout(() => setSaveMessage(""), 3000); // Clear message after 3 seconds
    };

    const handleInput = (key: string, value: string | boolean | string[]) => {
        setConfig((prevConfig) => {
            const newConfig = { ...prevConfig, [key]: value };
            setHasUnsavedChanges(JSON.stringify(newConfig) !== JSON.stringify(prevConfig));
            return newConfig;
        });
    };

    const handleManualCheck = () => {
        window.electronAPI.checkForUpdates();
    };

    const renderTabContent = () => {
        switch (tab) {
            case "general":
                return (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2">
                                <div
                                    className={`w-10 h-5 flex items-center rounded-full p-1 transition cursor-pointer ${config.autoUpdateEnabled ? "bg-green-500" : "bg-zinc-700"}`}
                                    onClick={() => handleInput("autoUpdateEnabled", !config.autoUpdateEnabled)}
                                >
                                    <div
                                        className={`w-4 h-4 bg-white rounded-full shadow-md transform transition ${config.autoUpdateEnabled ? "translate-x-[1.10rem]" : "-translate-x-0.5"}`}
                                    ></div>
                                </div>
                                <span>Enable Automatic Updates</span>
                            </div>
                            <div className="flex-1" />
                            <div
                                className="hover:bg-zinc-600/10 transition-colors text-white px-2 py-1 rounded-md border-zinc-700 border shadow cursor-pointer text-sm"
                                onClick={handleManualCheck}
                                title="Check for updates now"
                            >
                                Check for Updates
                            </div>
                        </div>
                        <label className="flex items-center gap-2">
                            <div
                                className={`w-10 h-5 flex items-center rounded-full p-1 transition cursor-pointer ${config.canAnyonePlaySong ? "bg-green-500" : "bg-zinc-700"}`}
                                onClick={() => handleInput("canAnyonePlaySong", !config.canAnyonePlaySong)}
                            >
                                <div
                                    className={`w-4 h-4 bg-white rounded-full shadow-md transform transition ${config.canAnyonePlaySong ? "translate-x-[1.10rem]" : "-translate-x-0.5"}`}
                                ></div>
                            </div>
                            Allow Anyone to Play Songs
                        </label>
                        <label className="flex flex-col gap-1">
                            Song Request Prefix
                            <input
                                className="bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-green-500 rounded px-3 py-2 text-white"
                                value={config.prefix || ""}
                                onChange={(e) => handleInput("prefix", e.target.value)}
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            Song Reply Message
                            <input
                                className="bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-green-500 rounded px-3 py-2 text-white"
                                value={config.songReplyMessage || ""}
                                onChange={(e) => handleInput("songReplyMessage", e.target.value)}
                            />
                            <span className="text-xs text-zinc-400">Use <code>{`{title}`}</code>, <code>{`{artist}`}</code>, <code>{`{user}`}</code> as variables.</span>
                        </label>
                        <label className="flex flex-col gap-1">
                            Current Song Text Format
                            <input
                                className="bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-green-500 rounded px-3 py-2 text-white"
                                value={config.currentSongFormat || ""}
                                onChange={(e) => handleInput("currentSongFormat", e.target.value)}
                            />
                            <span className="text-xs text-zinc-400">Use <code>{`{title}`}</code>, <code>{`{artist}`}</code> as variables.</span>
                        </label>
                    </div>
                );
            case "secrets":
                return (
                    <div className="flex flex-col gap-4">
                        {secretFields.map((field) => (
                            <label key={field.key} className="flex flex-col gap-1">
                                {field.label}
                                <input
                                    className="bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-green-500 rounded px-3 py-2 text-white"
                                    type={field.key.includes("Secret") ? "password" : "text"}
                                    value={typeof config[field.key] === "string" ? config[field.key] as string : ""}
                                    onChange={(e) => handleInput(field.key, e.target.value)}
                                />
                            </label>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed bottom-0 left-0 h-screen w-screen z-50 flex bg-zinc-900">
            {/* Tabs */}
            <div className="w-40 border-r border-zinc-800 flex flex-col overflow-y-auto max-h-screen">
                {TABS.map((t) => (
                    <div
                        key={t.key}
                        className={`text-left px-3 py-2 transition-colors font-semibold cursor-pointer ${tab === t.key ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800"}`}
                        onClick={() => setTab(t.key)}
                    >
                        {t.label}
                    </div>
                ))}
            </div>
            {/* Content */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-6 py-4 relative max-h-full min-h-0">
                    {renderTabContent()}
                </div>
                {/* Footer */}
                <div className="bg-zinc-800 p-2 flex justify-between items-center">
                    <div className="text-sm text-white ml-4">
                        {saveMessage ? (
                            <span className="text-green-500">{saveMessage}</span>
                        ) : hasUnsavedChanges ? (
                            <span className="text-yellow-500">Unsaved changes detected</span>
                        ) : (
                            <span className="text-zinc-400">All settings are up-to-date</span>
                        )}
                    </div>
                    <div className="flex gap-2 items-center">
                        <div
                            className="bg-spotify-green hover:bg-spotify-green-dark transition-colors text-black font-bold px-6 py-2 rounded shadow cursor-pointer"
                            onClick={handleSave}
                        >
                            Save
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
