import { useEffect, useState } from "react";
import SpotifySecrets from "./SpotifySecrets";

export default function SpotifyAuth() {
    const [spotifyUsername, setSpotifyUsername] = useState("");
    const [spotifyRunning, setSpotifyRunning] = useState<boolean | null>(null);
    const [spotifyAuthenticated, setSpotifyAuthenticated] = useState(false);
    const [hasSecrets, setHasSecrets] = useState(false);
    const [editSecrets, setEditSecrets] = useState(false);

    useEffect(() => {
        const checkSecrets = async () => {
            const secrets = await window.electronAPI.invoke("spotify:hasSecrets");
            setHasSecrets(secrets);
        };
        checkSecrets();
    }, []);

    useEffect(() => {
        const handleAuthenticated = async () => {
            setSpotifyAuthenticated(true);
            const userData = await window.electronAPI.invoke("spotify:getUserData");
            setSpotifyUsername(userData.display_name);
        };
        window.electronAPI.on("spotify:authenticated", handleAuthenticated);
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            const result = await window.electronAPI.invoke("spotify:checkAuth");
            if (result.authenticated) {
                console.log("Spotify is authenticated");
                setSpotifyAuthenticated(true);
                setSpotifyUsername(result.user.display_name);
            }
        };
        checkAuth();
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

    const handleSpotifyLogin = () => {
        if (!hasSecrets) {
            alert("Please set your Spotify API secrets first.");
            return;
        }
        window.electronAPI.send("spotify:auth")
    };
    const handleSpotifyLogout = () => {
        window.electronAPI.send("spotify:logout");
        setSpotifyAuthenticated(false);
        setSpotifyUsername(null);
    };

    return (
        <section className="bg-zinc-800 p-6 rounded-lg text-center space-y-6 relative">
            {!spotifyAuthenticated ? (
                <>
                    <h2 className="text-3xl font-bold text-zinc-100">Spotify Authentication</h2>
                    <button
                        onClick={handleSpotifyLogin}
                        className="bg-spotify-green hover:bg-spotify-green-dark active:bg-spotify-green-darker px-6 py-3 rounded-lg text-xl font-semibold transition"
                    >
                        Authenticate with Spotify
                    </button>
                </>
            ) : (
                <>
                    <h2 className="text-3xl font-bold text-green-400">Spotify Logged In</h2>
                    <p className="text-lg text-zinc-200">Welcome, {spotifyUsername}!</p>
                    <button
                        onClick={handleSpotifyLogout}
                        className="bg-red-500 hover:bg-red-600 active:bg-red-700 px-6 py-2 rounded-lg font-medium text-lg transition"
                    >
                        Log out Spotify
                    </button>
                </>
            )}

            <div className="flex flex-col justify-center items-center mt-4">
                {!hasSecrets && (
                    <button
                        onClick={() => setEditSecrets(true)}
                        className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded text-sm font-semibold"
                    >
                        Configure Spotify
                    </button>
                )}
                {editSecrets && (
                    <SpotifySecrets onClose={() => setEditSecrets(false)} setHasSecrets={(hasSecrets) => setHasSecrets(hasSecrets)} />
                )}
            </div>
            {spotifyRunning !== null && (
                <p className={`text-sm ${spotifyRunning ? "text-green-400" : "text-red-400"}`}>
                    Spotify is {spotifyRunning ? "running" : "not running"} on your computer.
                </p>
            )}
        </section>
    );
}
