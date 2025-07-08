import { useEffect, useState } from "react";
import { logDebug, logError } from "../../../renderer/rendererLogger";
import StatusMessage from "../../../ui/components/StatusMessage";
import SecretsSetupModal from "../../settings/components/modals/SecretsSetupModal";
import { KICK_REDIRECT_URI } from "../../../shared/constants";
import KickIcon from "./KickIcon";
import { InfoIcon } from "lucide-react";

export default function KickCard() {
    const [hasSecrets, setHasSecrets] = useState(null);
    const [kickClientId, setKickClientId] = useState("");
    const [kickClientSecret, setKickClientSecret] = useState("");
    const [kickUsername, setKickUsername] = useState("");
    const [authenticated, setAuthenticated] = useState(false);
    const [listeningToChat, setListeningToChat] = useState(false);
    const [openConfigure, setOpenConfigure] = useState(false);
    const [kickRedirectUri, setKickRedirectUri] = useState<string>(KICK_REDIRECT_URI);

    useEffect(() => {
        window.electronAPI.invoke("kick:hasSecrets")
            .then((secrets) => {
                setHasSecrets(secrets);
            }).catch((error) => {
                logError(error, "Error checking Kick secrets");
            });

        window.electronAPI.on("kick:authenticated", (event, data) => {
            setAuthenticated(true);
            logDebug(`Kick authenticated: ${data?.username}`);
            setKickUsername(data.username);
        });

        window.electronAPI.on("kick:chatConnected", () => {
            setListeningToChat(true);
        });

        window.electronAPI.invoke("kick:isListeningToChat")
            .then((isListening) => {
                setListeningToChat(isListening);
            }).catch((error) => {
                logError(error, "Error checking Kick chat listening status");
            });

        window.electronAPI.invoke("kick:checkAuth")
            .then((result) => {
                setAuthenticated(result.authenticated);
                if (result.authenticated) {
                    setKickUsername(result.username);
                }
            }).catch((error) => {
                logError(error, "Error checking Kick authentication");
            });

        window.electronAPI.invoke("config:get").then((cfg) => {
            if (cfg && cfg.kickRedirectUri) {
                setKickRedirectUri(cfg.kickRedirectUri);
            }
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
            logError(error, "Error setting Kick secrets");
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
                    completedMessage="API credentials configured"
                    notCompletedMessage="API credentials needed"
                    loadingMessage="Checking API credentials..."
                />
                {hasSecrets === false && (
                    <div className="text-xs text-zinc-400 text-center max-w-[80%]">
                        Configure your Kick API credentials to enable chat integration
                    </div>
                )}
                <StatusMessage
                    loading={authenticated === null}
                    completed={authenticated}
                    completedMessage={`Connected as ${kickUsername}`}
                    notCompletedMessage="Not connected to Kick"
                    loadingMessage="Checking connection..."
                />
                <StatusMessage
                    loading={listeningToChat === null}
                    completed={listeningToChat}
                    completedMessage="Chat connection active"
                    notCompletedMessage="Chat connection inactive"
                />
                {openConfigure && (
                    <SecretsSetupModal
                        service="Kick"
                        redirectUri={kickRedirectUri}
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
            <div className="flex flex-col gap-2 w-full items-center mb-4">
                <div className="flex gap-2">
                    {(hasSecrets === false) && (
                        <div
                            onClick={() => setOpenConfigure(true)}
                            className="bg-kick-green hover:bg-kick-green-dark active:bg-kick-green-darker transition-colors cursor-pointer px-4 py-2 rounded text-sm font-semibold text-black"
                        >
                            Setup Kick
                        </div>
                    )}
                    {authenticated ? (
                        <div
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 active:bg-red-800 px-4 py-2 rounded text-sm font-semibold transition-all cursor-pointer text-white"
                        >
                            Logout from Kick
                        </div>
                    ) : (
                        <div className="relative">
                            <div
                                onClick={() => handleLogin()}
                                className={`bg-kick-green cursor-pointer hover:bg-kick-green-dark active:bg-kick-green-darker px-4 py-2 rounded text-sm font-semibold transition-all text-black ${hasSecrets === false ? "opacity-50 cursor-not-allowed blur-sm" : ""}`}
                            >
                                <span className="flex items-center gap-2 justify-center">
                                    <KickIcon className="size-5" />
                                    Login with Kick
                                </span>
                            </div>
                            {hasSecrets === false && (
                                <span className="absolute text-center cursor-not-allowed inset-0 flex items-center justify-center text-xs font-semibold pointer-events-none text-black">
                                    Configure API credentials<br />to connect
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
