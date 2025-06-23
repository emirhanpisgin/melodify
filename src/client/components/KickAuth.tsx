import { useEffect, useState } from "react";
import KickSecrets from "./KickSecrets";

export default function KickAuth() {
    const [kickUsername, setKickUsername] = useState("");
    const [kickChatroomId, setKickChatroomId] = useState("");
    const [kickAuthenticated, setKickAuthenticated] = useState(false);
    const [hasSecrets, setHasSecrets] = useState(false);
    const [editSecrets, setEditSecrets] = useState(false);
    const [kickMessage, setKickMessage] = useState("");

    useEffect(() => {
        const checkSecrets = async () => {
            const secrets = await window.electronAPI.invoke("kick:hasSecrets");
            setHasSecrets(secrets);
        };
        checkSecrets();
    }, []);

    useEffect(() => {
        const getUserData = async () => {
            const userData = await window.electronAPI.invoke("kick:getUserData");
            setKickUsername(userData.username || "");
            setKickChatroomId(userData.chatroomId || "");
        };
        getUserData();
    }, [kickAuthenticated]);

    useEffect(() => {
        const handleKickAuthenticated = async () => {
            setKickAuthenticated(true);
        };
        window.electronAPI.on("kick:authenticated", handleKickAuthenticated);
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            const result = await window.electronAPI.invoke("kick:checkAuth");
            if (result.authenticated) {
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

    const handleUsernameSubmit = async () => {
        if (!kickUsername) {
            alert("Please enter your Kick username.");
            return;
        }
        const chatroomId = await window.electronAPI.invoke("kick:findChatroom", {
            username: kickUsername,
        });
        if (chatroomId) {
            setKickChatroomId(chatroomId);
        } else {
            setKickChatroomId("");
            alert("No chatroom found for this username. Please check your username and try again.");
        }
    };

    const sendKickMessage = async (message: string) => {
        if (!kickChatroomId) {
            alert("Please find your chatroom first.");
            return;
        }

        if (!kickAuthenticated) {
            alert("You must be authenticated to send messages.");
            return;
        }

        if (!message) {
            alert("Please enter a message to send.");
            return;
        }
        window.electronAPI.send("kick:sendMessage", message);
        setKickMessage("");
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
            <div>
                <label className="block text-sm font-medium mb-1">Kick Username</label>
                <div className="flex flex-col gap-3">
                    <input
                        type="text"
                        name="kickUsername"
                        value={kickUsername}
                        onChange={(e) => setKickUsername(e.target.value)}
                        className="w-full p-2 rounded-lg bg-neutral-700"
                        placeholder="Enter your Kick username"
                        required
                    />
                    <div onClick={() => handleUsernameSubmit()} className="p-2 text-sm justify-center bg-kick-green hover:bg-kick-green-dark active:bg-kick-green-darker transition cursor-pointer text-black flex items-center rounded-lg">
                        Save & Find Chatroom
                    </div>
                </div>
                <div className="">
                    {kickChatroomId ? (
                        <div className="mt-2 text-sm text-zinc-200">
                            <span className="font-semibold">Chatroom found:</span> {kickChatroomId}
                        </div>
                    ) : (
                        <div className="mt-2 text-sm text-red-400">
                            No chatroom found.
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-3 mt-3">
                    <input
                        type="text"
                        name="kickMessage"
                        value={kickMessage}
                        onChange={(e) => setKickMessage(e.target.value)}
                        className="w-full p-2 rounded-lg bg-neutral-700"
                        placeholder="Enter message"
                        required
                    />
                    <div onClick={() => sendKickMessage(kickMessage)} className="p-2 text-sm justify-center bg-kick-green hover:bg-kick-green-dark active:bg-kick-green-darker transition cursor-pointer text-black flex items-center rounded-lg">
                        Send Message
                    </div>
                </div>
            </div>
        </section>
    );
}
