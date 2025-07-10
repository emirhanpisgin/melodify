import { useEffect, useState } from "react";
import { logDebug, logError } from "../../../renderer/rendererLogger";
import StatusMessage from "../../../ui/components/StatusMessage";
import { KICK_REDIRECT_URI } from "../../../shared/constants";
import KickIcon from "./KickIcon";
import { InfoIcon } from "lucide-react";

export default function KickCard() {
    const [hasSecrets, setHasSecrets] = useState(null);
    const [kickClientId, setKickClientId] = useState("");
    const [kickClientSecret, setKickClientSecret] = useState("");
    const [kickUsername, setKickUsername] = useState<string | null>(null);
    const [authenticated, setAuthenticated] = useState(false);
    const [listeningToChat, setListeningToChat] = useState(false);
    const [showSetup, setShowSetup] = useState(false);
    const [kickRedirectUri, setKickRedirectUri] =
        useState<string>(KICK_REDIRECT_URI);
    const [authInProgress, setAuthInProgress] = useState(false);

    useEffect(() => {
        window.electronAPI
            .invoke("kick:hasSecrets")
            .then((secrets) => {
                setHasSecrets(secrets);
            })
            .catch((error) => {
                logError(error, "Error checking Kick secrets");
            });

        window.electronAPI.on("kick:authenticated", (data) => {
            setAuthenticated(true);
            setAuthInProgress(false);
            logDebug(`Kick authenticated: ${data?.username}`);
            setKickUsername(data.username);
        });

        window.electronAPI.on("kick:chatConnected", () => {
            setListeningToChat(true);
        });

        window.electronAPI.on("kick:chatDisconnected", () => {
            setListeningToChat(false);
        });

        window.electronAPI.on("kick:authenticationFailed", () => {
            setAuthenticated(false);
            setListeningToChat(false);
            setKickUsername(null);
            setAuthInProgress(false);
        });

        window.electronAPI
            .invoke("kick:isListeningToChat")
            .then((isListening) => {
                setListeningToChat(isListening);
            })
            .catch((error) => {
                logError(error, "Error checking Kick chat listening status");
            });

        window.electronAPI
            .invoke("kick:checkAuth")
            .then((result) => {
                setAuthenticated(result.authenticated);
                if (result.authenticated) {
                    setKickUsername(result.username);
                } else {
                    setKickUsername(null);
                }
            })
            .catch((error) => {
                logError(error, "Error checking Kick authentication");
            });

        window.electronAPI.invoke("config:get").then((cfg) => {
            if (cfg && cfg.kickRedirectUri) {
                setKickRedirectUri(cfg.kickRedirectUri);
            }
        });

        // Cleanup function to remove event listeners
        return () => {
            window.electronAPI.removeAllListeners("kick:authenticated");
            window.electronAPI.removeAllListeners("kick:chatConnected");
            window.electronAPI.removeAllListeners("kick:chatDisconnected");
            window.electronAPI.removeAllListeners("kick:authenticationFailed");
        };
    }, []);

    const handleSecretsSubmit = async () => {
        if (!kickClientId || !kickClientSecret) {
            alert("Please fill in both fields.");
            return;
        }

        try {
            window.electronAPI.send("kick:setSecrets", {
                kickClientId: kickClientId,
                kickClientSecret: kickClientSecret,
            });
            setHasSecrets(true);
            setKickClientId("");
            setKickClientSecret("");
            setShowSetup(false);
        } catch (error) {
            logError(error, "Error setting Kick secrets");
            alert("Failed to save Kick secrets. Please try again.");
        }
    };

    const handleLogin = () => {
        if (!hasSecrets) {
            alert("Please set Kick secrets first.");
            return;
        }

        if (authInProgress) {
            logDebug("Authentication already in progress, ignoring click");
            return;
        }

        setAuthInProgress(true);
        window.electronAPI.send("kick:auth");

        // Reset auth in progress after timeout to handle edge cases
        setTimeout(() => {
            setAuthInProgress(false);
        }, 30000); // 30 second timeout
    };

    const handleLogout = () => {
        window.electronAPI.send("kick:logout");
        // Don't manually set state here - let the IPC events handle it
        // The backend will send kick:chatDisconnected and kick:authenticationFailed events

        // Also refresh the listening state to ensure UI is in sync
        setTimeout(() => {
            window.electronAPI
                .invoke("kick:isListeningToChat")
                .then((isListening) => {
                    setListeningToChat(isListening);
                })
                .catch((error) => {
                    logError(
                        error,
                        "Error checking Kick chat listening status after logout"
                    );
                });
        }, 100); // Small delay to allow backend to process logout
    };

    return (
        <div className="w-full h-full flex flex-col bg-zinc-800/20 backdrop-blur-sm relative">
            {/* Elegant Header */}
            <div className="p-5 pb-3">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-kick-green to-green-400 rounded-xl flex items-center justify-center shadow-lg">
                        <KickIcon className="w-6 h-6 text-black" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                            Kick
                        </h2>
                        {kickUsername && (
                            <p className="text-xs text-zinc-400 mt-0.5">
                                @{kickUsername}
                            </p>
                        )}
                    </div>
                </div>

                {/* Status Banner */}
                <div
                    className={`px-3 py-1.5 rounded-full text-xs font-medium text-center ${
                        authenticated && listeningToChat
                            ? "bg-green-500/20 text-green-300 border border-green-500/30"
                            : authenticated
                              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                              : hasSecrets
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}
                >
                    {authenticated && listeningToChat
                        ? "✓ Listening to chat messages"
                        : authenticated
                          ? "⚠ Connect to chat stream"
                          : hasSecrets
                            ? "🔗 Ready to connect"
                            : "⚙ Setup required"}
                </div>
            </div>

            {/* Clean Status Grid */}
            <div className="flex-1 px-5 pb-3">
                <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-zinc-700/20 rounded-lg p-2 border border-zinc-600/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                                API
                            </span>
                            <div
                                className={`w-2 h-2 rounded-full ${hasSecrets ? "bg-green-400" : "bg-red-400"}`}
                            ></div>
                        </div>
                        <p className="text-xs text-zinc-300 mt-0.5">
                            {hasSecrets === null
                                ? "Checking..."
                                : hasSecrets
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
                                className={`w-2 h-2 rounded-full ${authenticated ? "bg-green-400" : "bg-red-400"}`}
                            ></div>
                        </div>
                        <p className="text-xs text-zinc-300 mt-0.5">
                            {authenticated === null
                                ? "Checking..."
                                : authenticated
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
                                className={`w-2 h-2 rounded-full ${listeningToChat ? "bg-green-400" : "bg-red-400"}`}
                            ></div>
                        </div>
                        <p className="text-xs text-zinc-300 mt-0.5">
                            {listeningToChat === null
                                ? "Checking..."
                                : listeningToChat
                                  ? "Active listening"
                                  : "Not connected"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Minimal Action Area */}
            <div className="p-5 pt-2">
                {hasSecrets === false ? (
                    <button
                        onClick={() => setShowSetup(true)}
                        className="w-full bg-gradient-to-r from-kick-green to-green-400 hover:from-green-400 hover:to-kick-green text-black font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        Configure API Credentials
                    </button>
                ) : authenticated ? (
                    <button
                        onClick={handleLogout}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        Disconnect Account
                    </button>
                ) : (
                    <button
                        onClick={() => handleLogin()}
                        disabled={authInProgress}
                        className={`w-full font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                            authInProgress
                                ? "bg-gray-500 cursor-not-allowed"
                                : "bg-gradient-to-r from-kick-green to-green-400 hover:from-green-400 hover:to-kick-green hover:shadow-xl transform hover:scale-105"
                        } text-black`}
                    >
                        {authInProgress ? (
                            <>
                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                Connecting...
                            </>
                        ) : (
                            <>
                                <KickIcon className="w-4 h-4" />
                                Connect to Kick
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Setup Overlay */}
            {showSetup && (
                <div className="absolute inset-0 bg-zinc-900/95 backdrop-blur-sm flex flex-col overflow-hidden z-10">
                    <div className="p-5 pb-3 flex-shrink-0">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-kick-green to-green-400 rounded-xl flex items-center justify-center shadow-lg">
                                <KickIcon className="w-6 h-6 text-black" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                                    Configure Kick API
                                </h2>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 px-5 pb-5 overflow-y-auto">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">
                                    Client ID
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter your Kick Client ID"
                                    value={kickClientId}
                                    onChange={(e) =>
                                        setKickClientId(e.target.value)
                                    }
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
                                    value={kickClientSecret}
                                    onChange={(e) =>
                                        setKickClientSecret(e.target.value)
                                    }
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
                                        onClick={(e) => {
                                            e.preventDefault();
                                            window.electronAPI.openExternal(
                                                "https://kick.com/settings/developer"
                                            );
                                        }}
                                    >
                                        kick.com/settings/developer
                                    </a>{" "}
                                    and set redirect URI to: {kickRedirectUri}
                                </p>
                                <p className="text-xs text-blue-300 mt-1">
                                    ℹ️ After saving your app, edit it again and
                                    create a bot for that app.
                                </p>
                                <p className="text-xs text-blue-300 mt-1">
                                    ✅ Required permissions: "Write to chat
                                    feed" and "Read channel information"
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 pt-2 flex-shrink-0">
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSetup(false)}
                                className="flex-1 bg-zinc-600 hover:bg-zinc-500 text-white py-2 px-4 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSecretsSubmit}
                                className="flex-1 bg-kick-green hover:bg-green-400 text-black font-semibold py-2 px-4 rounded-lg transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
