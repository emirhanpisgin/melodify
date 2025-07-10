// UITestPage.tsx
// Development-only component for testing all UI states

import { useState } from "react";
import {
    Headphones,
    LoaderCircleIcon,
    RotateCcwIcon,
    TestTube,
    InfoIcon,
    Clock,
} from "lucide-react";

// Mock components that simulate different states
const MockSpotifyCard = ({ state }: { state: string }) => {
    const getStateConfig = () => {
        switch (state) {
            case "no-secrets":
                return {
                    hasSecrets: false,
                    authenticated: false,
                    spotifyRunning: false,
                    spotifyHasSession: false,
                    bannerText: "⚙ Setup required",
                    bannerClass:
                        "bg-red-500/20 text-red-300 border border-red-500/30",
                    showSetup: false,
                    authInProgress: false,
                    username: null,
                };
            case "setup-modal":
                return {
                    hasSecrets: false,
                    authenticated: false,
                    spotifyRunning: false,
                    spotifyHasSession: false,
                    bannerText: "⚙ Setup required",
                    bannerClass:
                        "bg-red-500/20 text-red-300 border border-red-500/30",
                    showSetup: true,
                    authInProgress: false,
                    username: null,
                };
            case "secrets-only":
                return {
                    hasSecrets: true,
                    authenticated: false,
                    spotifyRunning: false,
                    spotifyHasSession: false,
                    bannerText: "🔗 Ready to connect",
                    bannerClass:
                        "bg-blue-500/20 text-blue-300 border border-blue-500/30",
                    showSetup: false,
                    authInProgress: false,
                    username: null,
                };
            case "auth-in-progress":
                return {
                    hasSecrets: true,
                    authenticated: false,
                    spotifyRunning: false,
                    spotifyHasSession: false,
                    bannerText: "🔄 Connecting to Spotify...",
                    bannerClass:
                        "bg-blue-500/20 text-blue-300 border border-blue-500/30",
                    showSetup: false,
                    authInProgress: true,
                    username: null,
                };
            case "authenticated-no-app":
                return {
                    hasSecrets: true,
                    authenticated: true,
                    spotifyRunning: false,
                    spotifyHasSession: false,
                    bannerText: "⚠ Start playing music in Spotify",
                    bannerClass:
                        "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
                    showSetup: false,
                    authInProgress: false,
                    username: "johndoe",
                };
            case "full-ready":
                return {
                    hasSecrets: true,
                    authenticated: true,
                    spotifyRunning: true,
                    spotifyHasSession: true,
                    bannerText: "✓ Ready for song requests",
                    bannerClass:
                        "bg-green-500/20 text-green-300 border border-green-500/30",
                    showSetup: false,
                    authInProgress: false,
                    username: "johndoe",
                };
            default:
                return {
                    hasSecrets: null as boolean | null,
                    authenticated: null as boolean | null,
                    spotifyRunning: null as boolean | null,
                    spotifyHasSession: null as boolean | null,
                    bannerText: "Loading...",
                    bannerClass:
                        "bg-gray-500/20 text-gray-300 border border-gray-500/30",
                    showSetup: false,
                    authInProgress: false,
                    username: null,
                };
        }
    };

    const config = getStateConfig();

    if (config.showSetup) {
        return (
            <div className="w-full h-full flex flex-col bg-zinc-800/20 backdrop-blur-sm">
                <div className="p-5 pb-3">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-spotify-green to-green-400 rounded-xl flex items-center justify-center shadow-lg">
                            <div className="w-6 h-6 bg-black rounded-sm"></div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                                Configure Spotify API
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="flex-1 px-5 pb-5">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">
                                Client ID
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your Spotify Client ID"
                                className="w-full bg-zinc-700 text-white rounded px-3 py-2 border border-zinc-600 focus:border-spotify-green focus:ring-1 focus:ring-spotify-green"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">
                                Client Secret
                            </label>
                            <input
                                type="password"
                                placeholder="Enter your Spotify Client Secret"
                                className="w-full bg-zinc-700 text-white rounded px-3 py-2 border border-zinc-600 focus:border-spotify-green focus:ring-1 focus:ring-spotify-green"
                            />
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                            <p className="text-xs text-blue-300">
                                💡 Create an app at{" "}
                                <a
                                    href="https://developer.spotify.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 underline hover:text-blue-300 cursor-pointer"
                                >
                                    developer.spotify.com
                                </a>{" "}
                                and set redirect URI to:
                                http://127.0.0.1:8888/callback
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5 pt-2">
                    <div className="flex gap-3">
                        <button className="flex-1 bg-zinc-600 hover:bg-zinc-500 text-white py-2 px-4 rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button className="flex-1 bg-spotify-green hover:bg-green-400 text-black font-semibold py-2 px-4 rounded-lg transition-colors">
                            Save
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-zinc-800/20 backdrop-blur-sm">
            <div className="p-5 pb-3">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-spotify-green to-green-400 rounded-xl flex items-center justify-center shadow-lg">
                        <div className="w-6 h-6 bg-black rounded-sm"></div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                            Spotify
                        </h2>
                        {config.username && (
                            <p className="text-xs text-zinc-400 mt-0.5">
                                @{config.username}
                            </p>
                        )}
                    </div>
                </div>

                <div
                    className={`px-3 py-1.5 rounded-full text-xs font-medium text-center ${config.bannerClass}`}
                >
                    {config.bannerText}
                </div>
            </div>

            <div className="flex-1 px-5 pb-3">
                <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-zinc-700/20 rounded-lg p-2 border border-zinc-600/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                                API
                            </span>
                            <div
                                className={`w-2 h-2 rounded-full ${config.hasSecrets ? "bg-green-400" : "bg-red-400"}`}
                            ></div>
                        </div>
                        <p className="text-xs text-zinc-300 mt-0.5">
                            {config.hasSecrets === null
                                ? "Checking..."
                                : config.hasSecrets
                                  ? "Configured"
                                  : "Not set"}
                        </p>
                    </div>

                    <div className="bg-zinc-700/20 rounded-lg p-2 border border-zinc-600/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                                APP
                            </span>
                            <div
                                className={`w-2 h-2 rounded-full ${config.spotifyRunning ? "bg-green-400" : "bg-red-400"}`}
                            ></div>
                        </div>
                        <p className="text-xs text-zinc-300 mt-0.5">
                            {config.spotifyRunning === null
                                ? "Checking..."
                                : config.spotifyRunning
                                  ? "Running"
                                  : "Closed"}
                        </p>
                    </div>

                    <div className="bg-zinc-700/20 rounded-lg p-2 border border-zinc-600/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                                AUTH
                            </span>
                            <div
                                className={`w-2 h-2 rounded-full ${config.authenticated ? "bg-green-400" : "bg-red-400"}`}
                            ></div>
                        </div>
                        <p className="text-xs text-zinc-300 mt-0.5">
                            {config.authenticated === null
                                ? "Checking..."
                                : config.authenticated
                                  ? "Connected"
                                  : "Disconnected"}
                        </p>
                    </div>

                    <div className="bg-zinc-700/20 rounded-lg p-2 border border-zinc-600/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                                SESSION
                            </span>
                            <div
                                className={`w-2 h-2 rounded-full ${config.spotifyHasSession ? "bg-green-400" : "bg-red-400"}`}
                            ></div>
                        </div>
                        <p className="text-xs text-zinc-300 mt-0.5">
                            {config.spotifyHasSession === null
                                ? "Checking..."
                                : config.spotifyHasSession
                                  ? "Active"
                                  : "Inactive"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-5 pt-2">
                {!config.hasSecrets ? (
                    <button className="w-full bg-gradient-to-r from-spotify-green to-green-400 text-black font-semibold py-2.5 px-4 rounded-lg">
                        Configure API Credentials
                    </button>
                ) : config.authenticated ? (
                    <button className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-2.5 px-4 rounded-lg">
                        Disconnect Account
                    </button>
                ) : (
                    <button
                        disabled={config.authInProgress}
                        className={`w-full font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                            config.authInProgress
                                ? "bg-gray-500 cursor-not-allowed"
                                : "bg-gradient-to-r from-spotify-green to-green-400 hover:from-green-400 hover:to-spotify-green hover:shadow-xl transform hover:scale-105"
                        } text-black`}
                    >
                        {config.authInProgress ? (
                            <>
                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                Connecting...
                            </>
                        ) : (
                            <>
                                <div className="w-4 h-4 bg-black rounded-sm"></div>
                                Connect to Spotify
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Setup UI covers the whole card when enabled */}
        </div>
    );
};

const MockKickCard = ({ state }: { state: string }) => {
    const getStateConfig = () => {
        switch (state) {
            case "no-secrets":
                return {
                    hasSecrets: false,
                    authenticated: false,
                    listeningToChat: false,
                    bannerText: "⚙ Setup required",
                    bannerClass:
                        "bg-red-500/20 text-red-300 border border-red-500/30",
                    showSetup: false,
                    authInProgress: false,
                    username: null,
                };
            case "setup-modal":
                return {
                    hasSecrets: false,
                    authenticated: false,
                    listeningToChat: false,
                    bannerText: "⚙ Setup required",
                    bannerClass:
                        "bg-red-500/20 text-red-300 border border-red-500/30",
                    showSetup: true,
                    authInProgress: false,
                    username: null,
                };
            case "secrets-only":
                return {
                    hasSecrets: true,
                    authenticated: false,
                    listeningToChat: false,
                    bannerText: "🔗 Ready to connect",
                    bannerClass:
                        "bg-blue-500/20 text-blue-300 border border-blue-500/30",
                    showSetup: false,
                    authInProgress: false,
                    username: null,
                };
            case "auth-in-progress":
                return {
                    hasSecrets: true,
                    authenticated: false,
                    listeningToChat: false,
                    bannerText: "🔄 Connecting to Kick...",
                    bannerClass:
                        "bg-blue-500/20 text-blue-300 border border-blue-500/30",
                    showSetup: false,
                    authInProgress: true,
                    username: null,
                };
            case "authenticated-no-chat":
                return {
                    hasSecrets: true,
                    authenticated: true,
                    listeningToChat: false,
                    bannerText: "⚠ Connect to chat stream",
                    bannerClass:
                        "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
                    showSetup: false,
                    authInProgress: false,
                    username: "streamergirl",
                };
            case "full-ready":
                return {
                    hasSecrets: true,
                    authenticated: true,
                    listeningToChat: true,
                    bannerText: "✓ Listening to chat messages",
                    bannerClass:
                        "bg-green-500/20 text-green-300 border border-green-500/30",
                    showSetup: false,
                    authInProgress: false,
                    username: "streamergirl",
                };
            default:
                return {
                    hasSecrets: null as boolean | null,
                    authenticated: null as boolean | null,
                    listeningToChat: null as boolean | null,
                    bannerText: "Loading...",
                    bannerClass:
                        "bg-gray-500/20 text-gray-300 border border-gray-500/30",
                    showSetup: false,
                    authInProgress: false,
                    username: null,
                };
        }
    };

    const config = getStateConfig();

    if (config.showSetup) {
        return (
            <div className="w-full h-full flex flex-col bg-zinc-800/20 backdrop-blur-sm">
                <div className="p-5 pb-3">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-kick-green to-green-400 rounded-xl flex items-center justify-center shadow-lg">
                            <div className="w-6 h-6 bg-black rounded-sm"></div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                                Configure Kick API
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="flex-1 px-5 pb-5">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">
                                Client ID
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your Kick Client ID"
                                className="w-full bg-zinc-700 text-white rounded px-3 py-2 border border-zinc-600 focus:border-kick-green focus:ring-1 focus:ring-kick-green"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">
                                Client Secret
                            </label>
                            <input
                                type="password"
                                placeholder="Enter your Kick Client Secret"
                                className="w-full bg-zinc-700 text-white rounded px-3 py-2 border border-zinc-600 focus:border-kick-green focus:ring-1 focus:ring-kick-green"
                            />
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                            <p className="text-xs text-blue-300">
                                💡 Create an app at{" "}
                                <a
                                    href="https://kick.com/settings/developer"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 underline hover:text-blue-300 cursor-pointer"
                                >
                                    kick.com/settings/developer
                                </a>{" "}
                                and set redirect URI to:
                                http://localhost:8889/callback
                            </p>
                            <p className="text-xs text-blue-300 mt-1">
                                ℹ️ After saving your app, edit it again and
                                create a bot for that app.
                            </p>
                            <p className="text-xs text-blue-300 mt-1">
                                ✅ Required permissions: "Write to chat feed"
                                and "Read channel information"
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5 pt-2">
                    <div className="flex gap-3">
                        <button className="flex-1 bg-zinc-600 hover:bg-zinc-500 text-white py-2 px-4 rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button className="flex-1 bg-kick-green hover:bg-green-400 text-black font-semibold py-2 px-4 rounded-lg transition-colors">
                            Save
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-zinc-800/20 backdrop-blur-sm">
            <div className="p-5 pb-3">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-kick-green to-green-400 rounded-xl flex items-center justify-center shadow-lg">
                        <div className="w-6 h-6 bg-black rounded-sm"></div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                            Kick
                        </h2>
                        {config.username && (
                            <p className="text-xs text-zinc-400 mt-0.5">
                                @{config.username}
                            </p>
                        )}
                    </div>
                </div>

                <div
                    className={`px-3 py-1.5 rounded-full text-xs font-medium text-center ${config.bannerClass}`}
                >
                    {config.bannerText}
                </div>
            </div>

            <div className="flex-1 px-5 pb-3">
                <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-zinc-700/20 rounded-lg p-2 border border-zinc-600/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                                API
                            </span>
                            <div
                                className={`w-2 h-2 rounded-full ${config.hasSecrets ? "bg-green-400" : "bg-red-400"}`}
                            ></div>
                        </div>
                        <p className="text-xs text-zinc-300 mt-0.5">
                            {config.hasSecrets === null
                                ? "Checking..."
                                : config.hasSecrets
                                  ? "Configured"
                                  : "Not set"}
                        </p>
                    </div>

                    <div className="bg-zinc-700/20 rounded-lg p-2 border border-zinc-600/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                                AUTH
                            </span>
                            <div
                                className={`w-2 h-2 rounded-full ${config.authenticated ? "bg-green-400" : "bg-red-400"}`}
                            ></div>
                        </div>
                        <p className="text-xs text-zinc-300 mt-0.5">
                            {config.authenticated === null
                                ? "Checking..."
                                : config.authenticated
                                  ? "Connected"
                                  : "Disconnected"}
                        </p>
                    </div>

                    <div className="bg-zinc-700/20 rounded-lg p-2 border border-zinc-600/20 col-span-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                                CHAT CONNECTION
                            </span>
                            <div
                                className={`w-2 h-2 rounded-full ${config.listeningToChat ? "bg-green-400" : "bg-red-400"}`}
                            ></div>
                        </div>
                        <p className="text-xs text-zinc-300 mt-0.5">
                            {config.listeningToChat === null
                                ? "Checking..."
                                : config.listeningToChat
                                  ? "Active listening"
                                  : "Not connected"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-5 pt-2">
                {!config.hasSecrets ? (
                    <button className="w-full bg-gradient-to-r from-kick-green to-green-400 text-black font-semibold py-2.5 px-4 rounded-lg">
                        Configure API Credentials
                    </button>
                ) : config.authenticated ? (
                    <button className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-2.5 px-4 rounded-lg">
                        Disconnect Account
                    </button>
                ) : (
                    <button
                        disabled={config.authInProgress}
                        className={`w-full font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                            config.authInProgress
                                ? "bg-gray-500 cursor-not-allowed"
                                : "bg-gradient-to-r from-kick-green to-green-400 hover:from-green-400 hover:to-kick-green hover:shadow-xl transform hover:scale-105"
                        } text-black`}
                    >
                        {config.authInProgress ? (
                            <>
                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                Connecting...
                            </>
                        ) : (
                            <>
                                <div className="w-4 h-4 bg-black rounded-sm"></div>
                                Connect to Kick
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Setup UI covers the whole card when enabled */}
        </div>
    );
};

export default function UITestPage() {
    const [spotifyState, setSpotifyState] = useState("no-secrets");
    const [kickState, setKickState] = useState("no-secrets");
    const [updateState, setUpdateState] = useState("up-to-date");
    const [songRequests, setSongRequests] = useState(0);

    const spotifyStates = [
        { key: "loading", label: "Loading..." },
        { key: "no-secrets", label: "No Secrets" },
        { key: "setup-modal", label: "Setup UI" },
        { key: "secrets-only", label: "Secrets Only" },
        { key: "auth-in-progress", label: "Authenticating..." },
        { key: "authenticated-no-app", label: "Auth + No App" },
        { key: "full-ready", label: "Fully Ready" },
    ];

    const kickStates = [
        { key: "loading", label: "Loading..." },
        { key: "no-secrets", label: "No Secrets" },
        { key: "setup-modal", label: "Setup UI" },
        { key: "secrets-only", label: "Secrets Only" },
        { key: "auth-in-progress", label: "Authenticating..." },
        { key: "authenticated-no-chat", label: "Auth + No Chat" },
        { key: "full-ready", label: "Fully Ready" },
    ];

    const updateStates = [
        { key: "up-to-date", label: "Up to date", icon: null },
        {
            key: "checking",
            label: "Checking for updates...",
            icon: (
                <LoaderCircleIcon className="w-4 h-4 text-blue-400 animate-spin" />
            ),
        },
        {
            key: "downloading",
            label: "Downloading update... 45%",
            icon: (
                <LoaderCircleIcon className="w-4 h-4 text-blue-400 animate-spin" />
            ),
        },
        {
            key: "downloaded",
            label: "Update ready - restart to install",
            icon: <RotateCcwIcon className="w-4 h-4 text-green-400" />,
        },
        {
            key: "error",
            label: "Update error occurred",
            icon: <RotateCcwIcon className="w-4 h-4 text-red-400" />,
        },
    ];

    const getUpdateStatus = () => {
        return (
            updateStates.find((s) => s.key === updateState) || updateStates[0]
        );
    };

    return (
        <div className="flex-1 flex flex-col bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 overflow-hidden">
            {/* Controls Panel */}
            <div className="p-4 border-b border-zinc-700/50 bg-zinc-800/50">
                <div className="flex items-center gap-2 mb-4">
                    <TestTube className="w-5 h-5 text-blue-400" />
                    <h1 className="text-lg font-bold text-white">
                        UI Test Panel
                    </h1>
                    <span className="text-xs text-zinc-400 bg-zinc-700/50 px-2 py-1 rounded">
                        Development Only
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <label className="block text-zinc-400 mb-1">
                            Spotify State:
                        </label>
                        <select
                            value={spotifyState}
                            onChange={(e) => setSpotifyState(e.target.value)}
                            className="w-full bg-zinc-700 text-white rounded px-2 py-1 border border-zinc-600"
                        >
                            {spotifyStates.map((state) => (
                                <option key={state.key} value={state.key}>
                                    {state.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-zinc-400 mb-1">
                            Kick State:
                        </label>
                        <select
                            value={kickState}
                            onChange={(e) => setKickState(e.target.value)}
                            className="w-full bg-zinc-700 text-white rounded px-2 py-1 border border-zinc-600"
                        >
                            {kickStates.map((state) => (
                                <option key={state.key} value={state.key}>
                                    {state.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-zinc-400 mb-1">
                            Update State:
                        </label>
                        <select
                            value={updateState}
                            onChange={(e) => setUpdateState(e.target.value)}
                            className="w-full bg-zinc-700 text-white rounded px-2 py-1 border border-zinc-600"
                        >
                            {updateStates.map((state) => (
                                <option key={state.key} value={state.key}>
                                    {state.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-zinc-400 mb-1">
                            Song Requests:
                        </label>
                        <input
                            type="number"
                            value={songRequests}
                            onChange={(e) =>
                                setSongRequests(parseInt(e.target.value) || 0)
                            }
                            className="w-full bg-zinc-700 text-white rounded px-2 py-1 border border-zinc-600"
                            min="0"
                        />
                    </div>
                </div>
            </div>

            {/* Song Requests Stats */}
            <div className="px-8 py-3 border-b border-zinc-700/50">
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-3 border border-green-500/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-500/20 rounded-md flex items-center justify-center">
                                <Headphones className="w-4 h-4 text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">
                                    Song Requests
                                </h3>
                                <p className="text-xs text-zinc-400">
                                    Total today
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-green-400">
                                {songRequests}
                            </div>
                        </div>
                    </div>

                    {/* Last Song Info */}
                    {songRequests > 0 && (
                        <div className="mt-2 pt-2 border-t border-green-500/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-white font-medium truncate">
                                        Bohemian Rhapsody
                                    </p>
                                    <p className="text-xs text-zinc-400 truncate">
                                        by Queen
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 text-zinc-400 ml-2">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-xs">15m</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-8">
                <div className="h-full flex gap-8">
                    <div className="flex-1 grid grid-cols-2 gap-8">
                        <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/50 overflow-hidden">
                            <MockSpotifyCard state={spotifyState} />
                        </div>
                        <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/50 overflow-hidden">
                            <MockKickCard state={kickState} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-zinc-700/50">
                <div className="flex items-center justify-between text-base text-zinc-400">
                    <div className="flex items-center gap-2">
                        <span>v1.0.7-dev</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {getUpdateStatus().icon}
                        <span>{getUpdateStatus().label}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
