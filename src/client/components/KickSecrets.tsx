import { useEffect, useState } from "react";
import ExternalLink from "./ExternalLink";

export default function KickSecrets({
    onClose,
    setHasSecrets,
}: {
    onClose: () => void;
    setHasSecrets: (hasSecrets: boolean) => void;
}) {
    const [secrets, setSecrets] = useState({
        kickClientId: "",
        kickClientSecret: "",
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetchSecrets = async () => {
            try {
                const data = await window.electronAPI.invoke("kick:getSecrets");
                setSecrets({
                    kickClientId: data?.kickClientId || "",
                    kickClientSecret: data?.kickClientSecret || "",
                });
            } catch (err) {
                setError("Failed to fetch Kick secrets.");
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
        window.electronAPI.send("kick:setSecrets", secrets);
        setHasSecrets(true);
        setSaved(true);
    };

    if (loading) return <div className="text-white p-4">Loading Kick secrets...</div>;
    if (error) return <div className="text-red-500 p-4">{error}</div>;

    return (
        <div className="fixed z-50 top-0 left-0 grid place-items-center backdrop-blur-md h-screen w-screen bg-black/20 text-white">
            <div className="bg-zinc-900 max-w-xl p-6 rounded-lg shadow-lg space-y-6">
                <h2 className="text-2xl font-bold">Kick API Secrets</h2>
                <p className="text-sm text-gray-400">
                    To get your Kick API secrets, go to{" "}
                    <ExternalLink
                        href="https://kick.com/settings/developer?action=create"
                        className="text-green-400 hover:text-green-500"
                    >
                        Kick Developer Settings
                    </ExternalLink>{" "}
                    and create an application.
                    Add{" "}
                    <span
                        className="bg-zinc-500 text-white text-xs p-1 rounded-lg"
                    >
                        http://127.0.0.1:8889/callback
                    </span>{" "}
                    as your redirect URI and check{" "}
                    <span className="bg-zinc-500 text-white rounded-lg text-xs p-1">
                        Write to Chat feed
                    </span> from "Scopes Requested" and click to Create App button.{" "}
                    The name and description can be anything you like.{" "}
                    Copy the Client ID and Client Secret from the created app and paste them below.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Kick Client ID</label>
                        <input
                            type="text"
                            name="kickClientId"
                            value={secrets.kickClientId}
                            onChange={handleChange}
                            className="w-full p-2 rounded bg-neutral-700"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Kick Client Secret</label>
                        <input
                            type="password"
                            name="kickClientSecret"
                            value={secrets.kickClientSecret}
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
