import { useEffect, useState } from "react";
import TwitchIcon from "./TwitchIcon";
import { useTranslation } from "react-i18next";
import { TWITCH_REDIRECT_URI } from "@/shared/constants";
import { logDebug, logError } from "@/renderer/rendererLogger";
import { RefreshCw } from "lucide-react";

export default function TwitchCard() {
    const { t } = useTranslation();
    const [hasSecrets, setHasSecrets] = useState<boolean | null>(null);
    const [twitchClientId, setTwitchClientId] = useState("");
    const [twitchClientSecret, setTwitchClientSecret] = useState("");
    const [twitchUsername, setTwitchUsername] = useState<string | null>(null);
    const [authenticated, setAuthenticated] = useState(false);
    const [listeningToChat, setListeningToChat] = useState(false);
    const [showSetup, setShowSetup] = useState(false);
    const [twitchRedirectUri, setTwitchRedirectUri] =
        useState<string>(TWITCH_REDIRECT_URI);
    const [authInProgress, setAuthInProgress] = useState(false);
    const [refreshInProgress, setRefreshInProgress] = useState(false);

    useEffect(() => {
        window.electronAPI
            .invoke("twitch:hasSecrets")
            .then((result) => {
                setHasSecrets(result);
            })
            .catch((error) => {
                logError(error, "Error checking Twitch secrets");
                setHasSecrets(false);
            });

        window.electronAPI.on("twitch:authenticated", (data) => {
            setAuthenticated(true);
            setTwitchUsername(data.twitchUsername);
        });

        window.electronAPI.on("twitch:chatConnected", () => {
            setListeningToChat(true);
        });

        window.electronAPI.on("twitch:chatDisconnected", () => {
            setListeningToChat(false);
        });

        window.electronAPI.on("twitch:authenticationFailed", () => {
            setAuthenticated(false);
            setTwitchUsername(null);
            setListeningToChat(false);
            setAuthInProgress(false);
        });

        window.electronAPI
            .invoke("twitch:isListeningToChat")
            .then((isListening) => {
                setListeningToChat(isListening);
            })
            .catch((error) => {
                logError(error, "Error checking Twitch chat listening status");
            });

        window.electronAPI
            .invoke("twitch:checkAuth")
            .then((result) => {
                setAuthenticated(result.authenticated);
                if (result.authenticated) {
                    setTwitchUsername(result.twitchUsername);
                } else {
                    setTwitchUsername(null);
                }
            })
            .catch((error) => {
                logError(error, "Error checking Twitch authentication");
                setAuthenticated(false);
                setTwitchUsername(null);
            });

        window.electronAPI.invoke("config:get").then((cfg) => {
            if (cfg && cfg.twitchRedirectUri) {
                setTwitchRedirectUri(cfg.twitchRedirectUri);
            }
        });

        // Cleanup function to remove event listeners
        return () => {
            window.electronAPI.removeAllListeners("twitch:authenticated");
            window.electronAPI.removeAllListeners("twitch:chatConnected");
            window.electronAPI.removeAllListeners("twitch:chatDisconnected");
            window.electronAPI.removeAllListeners("twitch:authenticationFailed");
        };
    }, []);

    const handleSecretsSubmit = async () => {
        if (!twitchClientId || !twitchClientSecret) {
            alert(t("common.pleaseCompleteFields"));
            return;
        }

        try {
            window.electronAPI.send("twitch:setSecrets", {
                twitchClientId,
                twitchClientSecret,
            });
            setHasSecrets(true);
            setTwitchClientId("");
            setTwitchClientSecret("");
            setShowSetup(false);
        } catch (error) {
            logError(error as Error, "Error saving Twitch secrets");
            alert(t("common.errorSavingSecrets"));
        }
    }

    const handleLogin = () => {
        if (!hasSecrets) {
            alert(t("common.secretsRequired"));
            return;
        }

        if (authInProgress) {
            logDebug("Login already in progress, ignoring additional login attempt");
            return;
        }

        setAuthInProgress(true);
        window.electronAPI.send("twitch:auth");

        // Reset auth in progress after timeout to handle edge cases
        setTimeout(() => {
            setAuthInProgress(false);
        }, 30000); // 30 seconds timeout
    }

    const handleLogout = () => {
        window.electronAPI.send("twitch:logout");
        // Don't manually set state here - let the IPC events handle it
        // The backend will send kick:chatDisconnected and kick:authenticationFailed events

        // Also refresh the listening state to ensure UI is in sync
        setTimeout(() => {
            window.electronAPI
                .invoke("twitch:isListeningToChat")
                .then((isListening) => {
                    setListeningToChat(isListening);
                })
                .catch((error) => {
                    logError(
                        error,
                        "Error checking Twitch chat listening status after logout"
                    );
                });
        }, 100); // Small delay to allow backend to process logout
    };

    const handleRefreshStatus = async () => {
        if (refreshInProgress) return;
        setRefreshInProgress(true);
        try {
            const [authResult, isListening] = await Promise.all([
                window.electronAPI.invoke("twitch:checkAuth"),
                window.electronAPI.invoke("twitch:isListeningToChat"),
            ]);
            setAuthenticated(authResult.authenticated);
            setTwitchUsername(authResult.authenticated ? authResult.twitchUsername : null);
            setListeningToChat(isListening);
        } catch (error) {
            logError(error as Error, "Error refreshing Twitch status");
        } finally {
            setRefreshInProgress(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-zinc-800/20 backdrop-blur-sm relative">
            <div className="p-5 pb-3">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-twitch-purple rounded-xl flex items-center justify-center shadow-lg">
                        <TwitchIcon className="w-7 h-7 mt-1" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                            Twitch
                        </h2>
                        {twitchUsername && (
                            <p className="text-xs text-zinc-400 mt-0.5">
                                @{twitchUsername}
                            </p>
                        )}
                    </div>
                </div>

                <div
                    className={`px-3 py-1.5 rounded-full text-xs font-medium text-center ${authenticated && listeningToChat
                        ? "bg-green-500/20 text-green-300 border border-green-500/30"
                        : authenticated
                            ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                            : hasSecrets
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : "bg-red-500/20 text-red-300 border border-red-500/30"
                        }`}
                >
                    {authenticated && listeningToChat
                        ? `✓ ${t("common.listeningToChat")}`
                        : authenticated
                            ? `⚠ ${t("common.connectToChat")}`
                            : hasSecrets
                                ? `🔗 ${t("common.readyToConnect")}`
                                : `⚙ ${t("common.setupRequired")}`}
                </div>
            </div>

            <div className="flex-1 px-5 pb-3">
                <div className="grid gap-2.5">
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
                                ? t("common.checking")
                                : hasSecrets
                                    ? t("common.configured")
                                    : t("common.notSet")}
                        </p>
                    </div>
                    <div className="bg-zinc-700/20 rounded-lg p-2 border border-zinc-600/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                                {t("statusCards.auth")}
                            </span>
                            <div
                                className={`w-2 h-2 rounded-full ${authenticated ? "bg-green-400" : "bg-red-400"}`}
                            ></div>
                        </div>
                        <p className="text-xs text-zinc-300 mt-0.5">
                            {authenticated === null
                                ? t("common.checking")
                                : authenticated
                                    ? t("authentication.authenticated")
                                    : t("authentication.notAuthenticated")}
                        </p>
                    </div>
                    <div className="bg-zinc-700/20 rounded-lg p-2 border border-zinc-600/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                                {t("statusCards.chatConnection")}
                            </span>
                            <div
                                className={`w-2 h-2 rounded-full ${listeningToChat ? "bg-green-400" : "bg-red-400"}`}
                            ></div>
                        </div>
                        <p className="text-xs text-zinc-300 mt-0.5">
                            {listeningToChat === null
                                ? t("common.checking")
                                : listeningToChat
                                    ? t("common.activeListening")
                                    : t("common.notConnected")}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-5 pt-2">
                {hasSecrets === false ? (
                    <button
                        onClick={() => setShowSetup(true)}
                        className="w-full bg-gradient-to-r from-twitch-purple to-twitch-purple-dark hover:from-twitch-purple-dark hover:to-twitch-purple text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        {t("common.configureCredentials")}
                    </button>
                ) : authenticated ? (
                    <div className="flex gap-3 items-center">
                        <button
                            onClick={handleLogout}
                            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            {t("authentication.disconnect")}
                        </button>
                        <button
                            onClick={handleRefreshStatus}
                            disabled={refreshInProgress}
                            aria-label={t("common.refresh")}
                            className={`w-11 h-11 flex items-center justify-center text-white rounded-lg transition-all duration-200 ${refreshInProgress
                                ? "bg-white/10 cursor-not-allowed"
                                : "bg-transparent hover:bg-white/10"
                                }`}
                        >
                            <RefreshCw
                                className={`w-5 h-5 ${refreshInProgress ? "animate-spin" : ""}`}
                            />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => handleLogin()}
                        disabled={authInProgress}
                        className={`w-full font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${authInProgress
                            ? "bg-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-twitch-purple to-twitch-purple-dark hover:from-twitch-purple-dark hover:to-twitch-purple text-white hover:shadow-xl transform hover:scale-105"
                            }`}
                    >
                        {authInProgress ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                {t("common.connecting")}
                            </>
                        ) : (
                            <>
                                <TwitchIcon className="w-4 h-4" />
                                {t("authentication.connect")}
                            </>
                        )}
                    </button>
                )}
            </div>

            {showSetup && (
                <div className="absolute inset-0 bg-zinc-900/95 backdrop-blur-sm flex flex-col overflow-hidden z-10">
                    <div className="p-5 pb-3 flex-shrink-0">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-twitch-purple to-twitch-purple-dark rounded-xl flex items-center justify-center shadow-lg">
                                <TwitchIcon className="w-6 h-6 text-black" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                                    {t("setup.configureTwitchAPI")}
                                </h2>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 px-5 pb-5 overflow-y-auto">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">
                                    {t("setup.clientId")}
                                </label>
                                <input
                                    type="text"
                                    placeholder={t("setup.enterTwitchClientId")}
                                    value={twitchClientId}
                                    onChange={(e) =>
                                        setTwitchClientId(e.target.value)
                                    }
                                    className="w-full bg-zinc-700 text-white rounded px-3 py-2 border border-zinc-600 focus:border-twitch-purple focus:ring-1 focus:ring-twitch-purple"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">
                                    {t("setup.clientSecret")}
                                </label>
                                <input
                                    type="password"
                                    placeholder={t(
                                        "setup.enterTwitchClientSecret"
                                    )}
                                    value={twitchClientSecret}
                                    onChange={(e) =>
                                        setTwitchClientSecret(e.target.value)
                                    }
                                    className="w-full bg-zinc-700 text-white rounded px-3 py-2 border border-zinc-600 focus:border-twitch-purple focus:ring-1 focus:ring-twitch-purple"
                                />
                            </div>
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                                <p className="text-xs text-blue-300">
                                    {t("setup.twitchInstructions")}{" "}
                                    <a
                                        href="https://dev.twitch.tv/console"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 underline hover:text-blue-300 cursor-pointer"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            window.electronAPI.openExternal(
                                                "https://dev.twitch.tv/console"
                                            );
                                        }}
                                    >
                                        dev.twitch.tv/console
                                    </a>{" "}
                                    {t("setup.twitchInstructionsEnd")}{" "}
                                    {twitchRedirectUri}
                                </p>
                                <p className="text-xs text-blue-300 mt-1">
                                    {t("setup.twitchAdditionalInfo1")}
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
                                {t("common.cancel")}
                            </button>
                            <button
                                onClick={handleSecretsSubmit}
                                className="flex-1 bg-twitch-purple hover:bg-purple-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                            >
                                {t("common.save")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
