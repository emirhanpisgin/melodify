import { useState } from "react";
import TwitchIcon from "./TwitchIcon";
import { useTranslation } from "react-i18next";

export default function TwitchCard() {
    const { t } = useTranslation();
    const [hasSecrets, setHasSecrets] = useState<boolean | null>(null);
    const [twitchClientId, setTwitchClientId] = useState("");
    const [twitchClientSecret, setTwitchClientSecret] = useState("");
    const [twitchUsername, setTwitchUsername] = useState<string | null>(null);
    const [authenticated, setAuthenticated] = useState(false);
    const [listeningToChat, setListeningToChat] = useState(false);
    const [showSetup, setShowSetup] = useState(false);
    const [twitchRedirectUri, setTwitchRedirectUri] = 
        useState<string>(TWITCH_REDIRECT_URI);


    return (
        <div className="w-full h-full flex flex-col bg-zinc-800/20 backdrop-blur-sm relative">
            <div className="p-5 pb-3">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-twitch-purple rounded-xl flex items-center justify-center shadow-lg">
                        <TwitchIcon className="w-7 h-7 mt-1" />
                    </div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                        Twitch
                    </h2>
                    {twitchUsername && (
                        <p className="text-xs text-zinc-400 mt-0.5">
                            @{twitchUsername}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
