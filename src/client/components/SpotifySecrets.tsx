import { useEffect, useState } from "react";
import ExternalLink from "./ExternalLink";

export default function SpotifySecrets({ onClose, setHasSecrets }: { onClose: () => void, setHasSecrets: (hasSecrets: boolean) => void }) {
    const [secrets, setSecrets] = useState({
        spotifyClientId: "",
        spotifyClientSecret: "",
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetchSecrets = async () => {
            try {
                const data = await window.electronAPI.invoke("spotify:getSecrets");
                setSecrets({
                    spotifyClientId: data?.spotifyClientId || "",
                    spotifyClientSecret: data?.spotifyClientSecret || "",
                });
            } catch (err) {
                setError("Failed to fetch Spotify secrets.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSecrets();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSecrets((prev) => ({
            ...prev,
            [name]: value,
        }));
        setSaved(false);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        window.electronAPI.send("spotify:setSecrets", secrets);
        setHasSecrets(true);
        setSaved(true);
    };

    if (loading) return <div className="text-white p-4">Loading Spotify secrets...</div>;
    if (error) return <div className="text-red-500 p-4">{error}</div>;

    return (
        <div className="fixed z-50 top-0 left-0 grid place-items-center backdrop-blur-md h-screen w-screen bg-black/20 text-white">
            <div className="bg-zinc-900 max-w-xl p-6 rounded-lg shadow-lg space-y-6">

                <h2 className="text-2xl font-bold">Spotify API Secrets</h2>
                <p className="text-sm text-gray-400">
                    To get your Spotify API Secrets, go to{" "}
                    <ExternalLink
                        href="https://developer.spotify.com/dashboard"
                        className="text-blue-600 hover:text-blue-700"
                    >
                        Spotify Developer Dashboard
                    </ExternalLink>{" "}
                    and create an app.
                    Add{" "}
                    <span
                        className="bg-zinc-500 text-white text-xs p-1 rounded-lg"
                    >
                        http://localhost:8889/callback
                    </span>{" "}
                    as a Redirect URL in your app settings and save it.
                    The name and description can be anything you like.
                    Copy the Client ID and Client Secret from the created app and paste them below.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Spotify Client ID</label>
                        <input
                            type="text"
                            name="spotifyClientId"
                            value={secrets.spotifyClientId}
                            onChange={handleChange}
                            className="w-full p-2 rounded bg-neutral-700"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Spotify Client Secret</label>
                        <input
                            type="password"
                            name="spotifyClientSecret"
                            value={secrets.spotifyClientSecret}
                            onChange={handleChange}
                            className="w-full p-2 rounded bg-neutral-700"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold"
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded font-semibold ml-2"
                    >
                        Close
                    </button>
                    {saved && <p className="text-green-400 text-sm mt-2">Secrets saved ✅</p>}
                </form>
            </div>
        </div>
    );
}
