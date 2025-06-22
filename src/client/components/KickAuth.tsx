import { useEffect, useState } from "react";
import KickSecrets from "./KickSecrets";

export default function KickAuth() {
    const [kickAuthenticated, setKickAuthenticated] = useState(false);
    const [hasSecrets, setHasSecrets] = useState(false);
    const [editSecrets, setEditSecrets] = useState(false);

    useEffect(() => {
        const checkSecrets = async () => {
            const secrets = await window.electronAPI.invoke("kick:hasSecrets");
            setHasSecrets(secrets);
        };
        checkSecrets();
    }, []);

    useEffect(() => {
        const handleKickAuthenticated = async () => {
            console.log("first")
            setKickAuthenticated(true);
        };
        window.electronAPI.on("kick:authenticated", handleKickAuthenticated);
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            const result = await window.electronAPI.invoke("kick:checkAuth");
            if (result.authenticated) {
                console.log(result.authenticated);
                setKickAuthenticated(true);
            }
        };
        checkAuth();
    }, []);

    const handleKickLogin = () => {
        if (!hasSecrets) {
            alert("Please set your Kick API secrets first.");
            return;
        }
        window.electronAPI.send("kick:auth");
    };

    const handleKickLogout = () => {
        window.electronAPI.send("kick:logout");
        setKickAuthenticated(false);
    };

    return (
        <section className="bg-zinc-800 p-6 rounded-lg text-center space-y-6 relative">
            {!kickAuthenticated ? (
                <>
                    <h2 className="text-3xl font-bold text-zinc-100">Kick Authentication</h2>
                    <button
                        onClick={handleKickLogin}
                        className="bg-kick-green hover:bg-kick-green-dark active:bg-kick-green-darker text-black px-6 py-3 rounded-lg text-xl font-semibold transition"
                    >
                        Authenticate with Kick
                    </button>
                </>
            ) : (
                <>
                    <h2 className="text-3xl font-bold text-purple-400">Kick Logged In</h2>
                    <button
                        onClick={handleKickLogout}
                        className="bg-red-500 hover:bg-red-600 active:bg-red-700 px-6 py-2 rounded-lg font-medium text-lg transition"
                    >
                        Log out Kick
                    </button>
                </>
            )}

            <div className="flex flex-col justify-center items-center mt-4">
                {!hasSecrets && (
                    <button
                        onClick={() => setEditSecrets(true)}
                        className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded text-sm font-semibold"
                    >
                        Configure Kick
                    </button>
                )}
                {editSecrets && (
                    <KickSecrets
                        onClose={() => setEditSecrets(false)}
                        setHasSecrets={(has) => setHasSecrets(has)}
                    />
                )}
            </div>
        </section>
    );
}
