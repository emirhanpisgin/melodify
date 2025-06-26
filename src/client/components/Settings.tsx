import { useState, useEffect } from "react";
import EyeIcon from "./icons/EyeIcon";

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
    [key: string]: string | boolean | string[] | undefined;
}

interface SecretsVisible {
    [key: string]: boolean;
}

export default function Settings({ onClose }: { onClose: () => void }) {
    const [tab, setTab] = useState<string>("general");
    const [config, setConfig] = useState<Config>({});
    const [secretsVisible, setSecretsVisible] = useState<SecretsVisible>({});

    // IPC: get config on mount
    useEffect(() => {
        window.electronAPI.invoke("config:get").then(setConfig);
    }, []);

    // IPC: save config
    const handleSave = () => {
        window.electronAPI.send("config:set", config);
        onClose();
    };

    const handleInput = (key: string, value: string | boolean | string[]) => {
        setConfig((prevConfig) => ({ ...prevConfig, [key]: value }));
    };

    const renderTabContent = () => {
        switch (tab) {
            case "general":
                return (
                    <div>
                        <h2 className="text-xl font-bold mb-4">General Settings</h2>
                        <div className="flex flex-col gap-4">
                            <label className="flex flex-col gap-1">
                                Song Request Prefix
                                <input
                                    className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                    value={config.prefix || ""}
                                    onChange={(e) => handleInput("prefix", e.target.value)}
                                />
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={!!config.canAnyonePlaySong}
                                    onChange={(e) => handleInput("canAnyonePlaySong", e.target.checked)}
                                />
                                Allow Anyone to Play Songs
                            </label>
                            <label className="flex flex-col gap-1">
                                Song Reply Message
                                <input
                                    className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                    value={config.songReplyMessage || ""}
                                    onChange={(e) => handleInput("songReplyMessage", e.target.value)}
                                />
                                <span className="text-xs text-zinc-400">Use <code>{`{title}`}</code>, <code>{`{artist}`}</code>, <code>{`{user}`}</code> as variables.</span>
                            </label>
                            <label className="flex flex-col gap-1">
                                Allowed Badges
                                <input
                                    className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                    value={(config.allowedBadges || []).join(", ")}
                                    onChange={(e) => handleInput("allowedBadges", e.target.value.split(", "))}
                                />
                                <span className="text-xs text-zinc-400">Enter badges separated by commas.</span>
                            </label>
                        </div>
                    </div>
                );
            case "secrets":
                return (
                    <div>
                        <h2 className="text-xl font-bold mb-4">API Secrets</h2>
                        <div className="flex flex-col gap-4">
                            {secretFields.map((field) => (
                                <label key={field.key} className="flex flex-col gap-1 relative">
                                    {field.label}
                                    <input
                                        className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white pr-10"
                                        type={secretsVisible[field.key] ? "text" : "password"}
                                        value={typeof config[field.key] === "string" ? config[field.key] as string : ""}
                                        onChange={(e) => handleInput(field.key, e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white"
                                        onClick={() => setSecretsVisible((prev) => ({ ...prev, [field.key]: !prev[field.key] }))}
                                        tabIndex={-1}
                                    >
                                        <EyeIcon open={!!secretsVisible[field.key]} className="w-5 h-5" />
                                    </button>
                                </label>
                            ))}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed bottom-0 left-0 h-screen w-screen z-50 flex bg-zinc-900">
            {/* Tabs */}
            <div className="w-40 border-r border-zinc-800 flex flex-col">
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
            <div className="flex-1 p-6 overflow-y-auto relative max-h-screen">
                {renderTabContent()}
                <div className="mt-8 flex justify-end gap-4">
                    <div
                        className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold px-6 py-2 rounded shadow cursor-pointer"
                        onClick={onClose}
                    >
                        Close
                    </div>
                    <div
                        className="bg-spotify-green hover:bg-spotify-green-dark text-black font-bold px-6 py-2 rounded shadow cursor-pointer"
                        onClick={handleSave}
                    >
                        Save Settings
                    </div>
                </div>
            </div>
        </div>
    );
}
