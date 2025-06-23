import { useEffect, useState } from "react";
import StatusMessage from "./StatusMessage";
import ExternalLink from "./ExternalLink";
import InfoIcon from "./icons/InfoIcon";

export default function KickCard() {
    const [hasSecrets, setHasSecrets] = useState(null);
    const [kickClientId, setKickClientId] = useState("");
    const [kickClientSecret, setKickClientSecret] = useState("");
    const [kickUsername, setKickUsername] = useState("");
    const [authenticated, setAuthenticated] = useState(false);
    const [listeningToChat, setListeningToChat] = useState(false);
    const [openConfigure, setOpenConfigure] = useState(false);

    useEffect(() => {
        window.electronAPI.invoke("kick:hasSecrets")
            .then((secrets) => {
                setHasSecrets(secrets);
            }).catch((error) => {
                console.error("Error checking Kick secrets:", error);
            });

        window.electronAPI.on("kick:authenticated", (event, data) => {
            setAuthenticated(true);
            setKickUsername(data.username);
        });

        window.electronAPI.on("kick:chatConnected", () => {
            setListeningToChat(true);
        });

        window.electronAPI.invoke("kick:checkAuth")
            .then((result) => {
                setAuthenticated(result.authenticated);
            }).catch((error) => {
                console.error("Error checking Kick authentication:", error);
            });
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
        } catch (error) {
            console.error("Error setting Kick secrets:", error);
            alert("Failed to save Kick secrets. Please try again.");
        }
    };

    const handleLogin = () => {
        if (!hasSecrets) {
            alert("Please set Kick secrets first.");
            return;
        }
        window.electronAPI.send("kick:auth");
    };

    const handleLogout = () => {
        window.electronAPI.send("kick:logout");
        setAuthenticated(false);
    };

    return (
        <div className="w-[50vw] flex flex-col justify-center items-center gap-3 h-full">
            <div className="flex-1 flex flex-col justify-center items-center gap-3 w-full">
                <div className="text-2xl font-bold text-kick-green">
                    Kick
                </div>
                <StatusMessage
                    loading={hasSecrets === null}
                    completed={hasSecrets}
                    completedMessage="Secrets are set."
                    notCompletedMessage="Secrets are not set."
                    loadingMessage="Checking for Kick secrets..."
                />
                {hasSecrets === false && (
                    <div className="text-xs">
                        Click "Setup Kick" to setup.
                    </div>
                )}
                <StatusMessage
                    loading={authenticated === null}
                    completed={authenticated}
                    completedMessage={`You are logged in, Welcome ${kickUsername}.`}
                    notCompletedMessage="You are not logged in."
                    loadingMessage="Checking if you are logged in..."
                />
                <StatusMessage
                    loading={listeningToChat === null}
                    completed={listeningToChat}
                    completedMessage={"Listening to chat."}
                    notCompletedMessage="Not listening to chat."
                />
                {openConfigure && (
                    <div className="fixed z-50 top-0 left-0 grid place-items-center h-screen w-screen bg-black/20 text-white">
                        <div className="relative bg-black w-full h-full p-2 px-4">
                            <div className="absolute top-2 right-2 cursor-pointer" onClick={() => setOpenConfigure(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <div className="text-xl font-bold">
                                Setup <span className="text-kick-green">Kick</span>
                            </div>
                            <div>
                                <div className="text-sm text-gray-400 mt-4">
                                    - Go to <ExternalLink
                                        href="https://kick.com/settings/developer?action=create"
                                        className="text-kick-green hover:text-kick-green-dark group"
                                    >
                                        Kick Developer Dashboard
                                        <span className="inline-flex w-min ml-1 relative" style={{ top: "2px" }}>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4 text-kick-green group-hover:text-kick-green-dark inline"
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
                                        http://localhost:8889/callback
                                    </span>{" "}
                                    as a Redirect URL.
                                    <br />
                                    - Check{" "}
                                    <span className="bg-zinc-500 text-white rounded-lg text-xs p-1 py-[2px]">
                                        Write to Chat feed
                                    </span>{" "}
                                    and{" "}
                                    <span className="bg-zinc-500 text-white rounded-lg text-xs p-1 py-[2px]">
                                        Read channel information
                                    </span>{" "}
                                    from "Scopes Requested" and save your app.
                                    <br />
                                    - Copy the Client ID and Client Secret from the created app and paste them below.
                                    <br />
                                    <span className="text-blue-400 flex items-center gap-1 text-xs">
                                        <InfoIcon className="size-5" /> After you save your app, you need it to edit it again and create a bot for that app.
                                    </span>
                                </div>
                                <div className="mt-4 space-y-2">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Kick Client ID</label>
                                        <input
                                            type="text"
                                            name="kickClientId"
                                            placeholder="Enter your Kick Client ID"
                                            value={kickClientId}
                                            onChange={(e) => setKickClientId(e.target.value)}
                                            className="w-full p-2 rounded text-sm bg-neutral-700 outline-0 focus:outline-1 focus-visible:border-none focus-visible:outline-none outline-offset-0 border-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Kick Client Secret</label>
                                        <input
                                            type="password"
                                            name="kickClientSecret"
                                            placeholder="Enter your Kick Client Secret"
                                            value={kickClientSecret}
                                            onChange={(e) => setKickClientSecret(e.target.value)}
                                            className="w-full p-2 rounded text-sm bg-neutral-700 outline-0 focus:outline-1 focus-visible:border-none focus-visible:outline-none outline-offset-0 border-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <div
                                        onClick={() => handleSecretsSubmit()}
                                        className="bg-kick-green hover:bg-kick-green-dark active:bg-kick-green-darker text-black px-4 py-2 rounded text-sm font-semibold w-min cursor-pointer"
                                    >
                                        Save
                                    </div>
                                    {hasSecrets ? (
                                        <div className="text-xs text-green-500 mt-2">
                                            Secrets are set, you can close this window.
                                        </div>
                                    ) : (
                                        <span className="text-blue-400 flex items-center gap-1 text-xs">
                                            <InfoIcon className="size-5" /> You can change this values later in the app settings.
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex flex-col gap-2 w-full items-center mb-4 text-black">
                <div className="flex gap-2">
                    {(hasSecrets === false) && (
                        <div
                            onClick={() => setOpenConfigure(true)}
                            className="bg-kick-green hover:bg-kick-green-dark active:bg-kick-green-darker transition-colors cursor-pointer px-4 py-2 rounded text-sm font-semibold"
                        >
                            Setup Kick
                        </div>
                    )}
                    {authenticated ? (
                        <div
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 active:bg-red-800 px-4 py-2 rounded text-sm font-semibold transition-all cursor-pointer"
                        >
                            Logout from Kick
                        </div>
                    ) : (
                        <div className="relative">
                            <div
                                onClick={() => handleLogin()}
                                className={`bg-kick-green cursor-pointer hover:bg-kick-green-dark active:bg-kick-green-darker px-4 py-2 rounded text-sm font-semibold transition-all ${hasSecrets === false ? "opacity-50 cursor-not-allowed blur-sm" : ""}`}
                            >
                                Login with Kick
                            </div>
                            {hasSecrets === false && (
                                <span className="absolute text-center cursor-not-allowed inset-0 flex items-center justify-center text-xs font-semibold pointer-events-none">
                                    Setup Kick first
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
