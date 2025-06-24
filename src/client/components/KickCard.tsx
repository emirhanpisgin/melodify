/**
 * Card component for Kick integration. Handles authentication, secrets, and chat status.
 */

import { useEffect, useState } from "react";
import StatusMessage from "./StatusMessage";
import InfoIcon from "./icons/InfoIcon";
import SecretsSetupModal from "./SecretsSetupModal";
import { KICK_REDIRECT_URI } from "../../lib/constants";

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
                    <SecretsSetupModal
                        service="Kick"
                        redirectUri={KICK_REDIRECT_URI}
                        dashboardUrl="https://kick.com/settings/developer?action=create"
                        clientId={kickClientId}
                        clientSecret={kickClientSecret}
                        setClientId={setKickClientId}
                        setClientSecret={setKickClientSecret}
                        onSave={handleSecretsSubmit}
                        onClose={() => setOpenConfigure(false)}
                        hasSecrets={hasSecrets}
                        info={<span className="text-blue-400 flex items-center gap-1 text-xs"><InfoIcon className="size-5" /> After you save your app, you need to edit it again and create a bot for that app.</span>}
                    />
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
