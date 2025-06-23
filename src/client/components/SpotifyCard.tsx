import { useEffect, useState } from "react";
import ExternalLink from "./ExternalLink";
import StatusMessage from "./StatusMessage";
import InfoIcon from "./icons/InfoIcon";

export default function SpotifyCard() {
    const [hasSecrets, setHasSecrets] = useState(null);
    const [spotifyClientId, setSpotifyClientId] = useState("");
    const [spotifyClientSecret, setSpotifyClientSecret] = useState("");
    const [spotifyUsername, setSpotifyUsername] = useState<string | null>(null);
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);
    const [spotifyRunning, setSpotifyRunning] = useState<boolean | null>(null);
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
    }, [])

    useEffect(() => {
        window.electronAPI.on("spotify:authenticated", (event, data) => {
            setAuthenticated(true);
            setSpotifyUsername(data.username);
        });
    }, [])

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
        <div className="w-[50vw] border-r flex flex-col justify-center items-center gap-3 h-full">
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
                {openConfigure && (
                    <div className="fixed z-50 top-0 left-0 grid place-items-center h-screen w-screen bg-black/20 text-white">
                        <div className="relative bg-black w-full h-full p-2 px-4">
                            <div className="absolute top-2 right-2 cursor-pointer" onClick={() => setOpenConfigure(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <div className="text-xl font-bold">
                                Setup <span className="text-spotify-green">Spotify</span>
                            </div>
                            <div>
                                <div className="text-sm text-gray-400 mt-4">
                                    - Go to <ExternalLink
                                        href="https://developer.spotify.com/dashboard"
                                        className="text-spotify-green hover:text-spotify-green-dark group"
                                    >
                                        Spotify Developer Dashboard
                                        <span className="inline-flex w-min ml-1 relative" style={{ top: "2px" }}>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4 text-spotify-green group-hover:text-spotify-green-dark inline"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </span>
                                    </ExternalLink>
                                    {" "}
                                    and create an app.
                                    <br />
                                    - Add{" "}
                                    <span
                                        className="bg-zinc-500 text-white text-xs p-1 py-[2px] rounded-lg"
                                    >
                                        http://127.0.0.1:8888/callback
                                    </span>{" "}
                                    as a Redirect URL and save your app.
                                    <br />
                                    - Copy the Client ID and Client Secret from the created app and paste them below.
                                    <br />
                                    <span className="text-blue-400 flex items-center gap-1 text-xs">
                                        <InfoIcon className="size-5" /> You can change this values later in the app settings.
                                    </span>
                                </div>
                                <div className="mt-4 space-y-2">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Spotify Client ID</label>
                                        <input
                                            type="text"
                                            name="spotifyClientId"
                                            placeholder="Enter your Spotify Client ID"
                                            value={spotifyClientId}
                                            onChange={(e) => setSpotifyClientId(e.target.value)}
                                            className="w-full p-2 rounded text-sm bg-neutral-700 outline-0 focus:outline-1 focus-visible:border-none focus-visible:outline-none outline-offset-0 border-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Spotify Client Secret</label>
                                        <input
                                            type="password"
                                            name="spotifyClientSecret"
                                            placeholder="Enter your Spotify Client Secret"
                                            value={spotifyClientSecret}
                                            onChange={(e) => setSpotifyClientSecret(e.target.value)}
                                            className="w-full p-2 rounded text-sm bg-neutral-700 outline-0 focus:outline-1 focus-visible:border-none focus-visible:outline-none outline-offset-0 border-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <div
                                        onClick={() => handleSecretsSubmit()}
                                        className="bg-spotify-green hover:bg-spotify-green-dark active:bg-spotify-green-darker px-4 py-2 rounded text-sm font-semibold w-min cursor-pointer"
                                    >
                                        Save
                                    </div>
                                    {hasSecrets && (
                                        <div className="text-xs text-green-500 mt-2">
                                            Secrets are set, you can close this window.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
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
                                Login with Spotify
                            </div>
                            {hasSecrets === false && (
                                <span className="absolute text-center inset-0 flex items-center justify-center text-xs text-white font-semibold pointer-events-none">
                                    Setup Spotify first
                                    <br />
                                    to login.
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
