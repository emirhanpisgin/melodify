/**
 * Card component for Spotify integration. Handles authentication, secrets, and device/session status.
 */

import { useEffect, useState } from "react";
import StatusMessage from "./StatusMessage";
import SecretsSetupModal from "./SecretsSetupModal";
import { SPOTIFY_REDIRECT_URI } from "../../lib/constants";
import SpotifyIcon from "./icons/SpotifyIcon";

export default function SpotifyCard() {
    const [hasSecrets, setHasSecrets] = useState(null);
    const [spotifyClientId, setSpotifyClientId] = useState("");
    const [spotifyClientSecret, setSpotifyClientSecret] = useState("");
    const [spotifyUsername, setSpotifyUsername] = useState<string | null>(null);
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);
    const [spotifyRunning, setSpotifyRunning] = useState<boolean | null>(null);
    const [spotifyHasSession, setSpotifyHasSession] = useState<boolean | null>(false);
    const [openConfigure, setOpenConfigure] = useState(false);

    useEffect(() => {
        window.electronAPI.invoke("spotify:hasSecrets")
            .then((secrets) => {
                console.log("Spotify secrets fetched:", secrets);
                setHasSecrets(secrets);
            })
            .catch((error) => {
                console.error("Failed to fetch Spotify secrets:", error);
            });
    }, []);

    useEffect(() => {
        const checkSpotifyProcess = async () => {
            const isRunning = await window.electronAPI.invoke("spotify:isRunning");
            setSpotifyRunning(isRunning);
        };
        checkSpotifyProcess();
        const interval = setInterval(checkSpotifyProcess, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        window.electronAPI.invoke("spotify:checkAuth")
            .then((result) => {
                setAuthenticated(result.authenticated);
                if (result.authenticated) {
                    setSpotifyUsername(result.username);
                }
            })
            .catch((error) => {
                setAuthenticated(false);
                console.error("Failed to check Spotify authentication:", error);
            });
    }, []);

    useEffect(() => {
        window.electronAPI.on("spotify:authenticated", (event, data) => {
            setAuthenticated(true);
            setSpotifyUsername(data.username);
        });
    }, []);

    useEffect(() => {
        if (!authenticated) return;
        let interval: NodeJS.Timeout | null = null;

        function checkSpotifySession() {
            window.electronAPI.invoke("spotify:hasSession")
                .then((hasSession) => {
                    console.log("Spotify session check result:", hasSession);
                    setSpotifyHasSession(hasSession);
                    if (hasSession && interval) {
                        clearInterval(interval);
                        interval = null;
                    }
                })
                .catch((error) => {
                    console.error("Failed to check Spotify session:", error);
                });
        }

        checkSpotifySession();
        interval = setInterval(checkSpotifySession, 5000);

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [authenticated]);

    const handleSecretsSubmit = async () => {
        if (!spotifyClientId || !spotifyClientSecret) {
            alert("Please fill in both fields.");
            return;
        }

        const result = await window.electronAPI.invoke("spotify:setSecrets", {
            spotifyClientId,
            spotifyClientSecret,
        });

        if (result.success) {
            setHasSecrets(true);
            setSpotifyClientId("");
            setSpotifyClientSecret("");
        } else {
            alert(result.message);
        }
    };

    const handleLogin = () => {
        if (!hasSecrets) {
            alert("Please set your Spotify API secrets first.");
            return;
        }
        window.electronAPI.send("spotify:auth");
    };

    const handleLogout = () => {
        window.electronAPI.send("spotify:logout");
        setAuthenticated(false);
        setSpotifyUsername(null);
    };

    return (
        <div className="w-[50vw] border-r border-zinc-700 flex flex-col justify-center items-center gap-3 h-full">
            <div className="flex-1 flex flex-col justify-center items-center gap-3 w-full">
                <div className="text-2xl font-bold text-spotify-green">
                    Spotify
                </div>
                <StatusMessage
                    loading={hasSecrets === null}
                    completed={hasSecrets}
                    completedMessage="Secrets are set."
                    notCompletedMessage="Secrets are not set."
                    loadingMessage="Checking for Spotify secrets..."
                />
                {hasSecrets === false && (
                    <div className="text-xs">
                        Click "Setup Spotify" to setup.
                    </div>
                )}
                <StatusMessage
                    loading={spotifyRunning === null}
                    completed={spotifyRunning}
                    completedMessage={spotifyRunning ? "Spotify is running." : "Spotify is not running."}
                    notCompletedMessage="Spotify is not running."
                    loadingMessage="Checking if Spotify is running..."
                />
                <StatusMessage
                    loading={authenticated === null}
                    completed={authenticated}
                    completedMessage={`You are logged in, Welcome ${spotifyUsername}.`}
                    notCompletedMessage="You are not logged in."
                    loadingMessage="Checking if you are logged in..."
                />
                <StatusMessage
                    loading={spotifyHasSession === null}
                    completed={spotifyHasSession}
                    completedMessage={`Spotify device found.`}
                    notCompletedMessage="No Spotify devices."
                />
                {spotifyHasSession === false && (
                    <div className="text-xs text-balance text-center max-w-[75%]">
                        Please open Spotify and start playing music to create a session.
                    </div>
                )}
                {openConfigure && (
                    <SecretsSetupModal
                        service="Spotify"
                        redirectUri={SPOTIFY_REDIRECT_URI}
                        dashboardUrl="https://developer.spotify.com/dashboard"
                        clientId={spotifyClientId}
                        clientSecret={spotifyClientSecret}
                        setClientId={setSpotifyClientId}
                        setClientSecret={setSpotifyClientSecret}
                        onSave={handleSecretsSubmit}
                        onClose={() => setOpenConfigure(false)}
                        hasSecrets={hasSecrets}
                    />
                )}
            </div>
            <div className="flex flex-col gap-2 w-full items-center mb-4">
                <div className="flex gap-2">
                    {(hasSecrets === false) && (
                        <div
                            onClick={() => setOpenConfigure(true)}
                            className="bg-spotify-green hover:bg-spotify-green-dark active:bg-spotify-green-darker cursor-pointer px-4 py-2 rounded text-sm font-semibold"
                        >
                            Setup Spotify
                        </div>
                    )}
                    {authenticated ? (
                        <div
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 active:bg-red-800 px-4 py-2 rounded text-sm font-semibold transition-all cursor-pointer"
                        >
                            Logout from Spotify
                        </div>
                    ) : (
                        <div className="relative">
                            <div
                                onClick={() => handleLogin()}
                                className={`bg-spotify-green cursor-pointer hover:bg-spotify-green-dark active:bg-spotify-green-darker px-4 py-2 rounded text-sm font-semibold transition-all ${hasSecrets === false ? "opacity-50 cursor-not-allowed blur-sm" : ""}`}
                            >
                                <span className="flex items-center gap-2 justify-center">
                                    <SpotifyIcon className="size-5" />
                                    Login with Spotify
                                </span>
                            </div>
                            {hasSecrets === false && (
                                <span className="absolute text-center inset-0 flex items-center justify-center text-xs text-white font-semibold pointer-events-none">
                                    Setup Spotify first<br />to login.
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
