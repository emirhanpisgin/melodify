import { ReactNode } from "react";
import InfoIcon from "./icons/InfoIcon";
import ExternalLink from "./ExternalLink";

interface SecretsSetupModalProps {
    service: "Kick" | "Spotify";
    redirectUri: string;
    dashboardUrl: string;
    clientId: string;
    clientSecret: string;
    setClientId: (id: string) => void;
    setClientSecret: (secret: string) => void;
    onSave: () => void;
    onClose: () => void;
    hasSecrets: boolean | null;
    info?: ReactNode;
}

/**
 * Reusable modal for setting up API secrets for Kick or Spotify.
 */
export default function SecretsSetupModal({
    service,
    redirectUri,
    dashboardUrl,
    clientId,
    clientSecret,
    setClientId,
    setClientSecret,
    onSave,
    onClose,
    hasSecrets,
    info,
}: SecretsSetupModalProps) {
    return (
        <div className="fixed z-50 top-0 left-0 grid place-items-center h-screen w-screen bg-black/20 text-white">
            <div className="relative bg-black w-full flex flex-col h-full p-4 pt-2">
                <div className="absolute top-2 right-2 cursor-pointer" onClick={onClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <div className="text-xl font-bold">
                    Setup <span className={service === "Kick" ? "text-kick-green" : "text-spotify-green"}>{service}</span>
                </div>
                <div className="flex flex-col flex-1 justify-evenly">
                    <div className="text-sm text-gray-400 mt-4">
                        - Go to <ExternalLink href={dashboardUrl} target="_blank" rel="noopener noreferrer" className={service === "Kick" ? "text-kick-green hover:text-kick-green-dark group" : "text-spotify-green hover:text-spotify-green-dark group"}>{service} Developer Dashboard</ExternalLink> and create an app.<br />
                        - Add <span className="bg-zinc-500 text-white text-xs p-1 py-[2px] rounded-lg">{redirectUri}</span> as a Redirect URL.<br />
                        {service === "Kick" && <>
                            - Check <span className="bg-zinc-500 text-white rounded-lg text-xs p-1 py-[2px]">Write to Chat feed</span> and <span className="bg-zinc-500 text-white rounded-lg text-xs p-1 py-[2px]">Read channel information</span> from "Scopes Requested" and save your app.<br />
                        </>}
                        - Copy the Client ID and Client Secret from the created app and paste them below.<br />
                        {info}
                    </div>
                    <div className="mt-4 space-y-2">
                        <div>
                            <label className="block text-sm font-medium mb-1">{service} Client ID</label>
                            <input type="text" name="clientId" placeholder={`Enter your ${service} Client ID`} value={clientId} onChange={e => setClientId(e.target.value)} className="w-full p-2 rounded text-sm bg-neutral-700 outline-0 focus:outline-1 focus-visible:border-none focus-visible:outline-none outline-offset-0 border-none" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{service} Client Secret</label>
                            <input type="password" name="clientSecret" placeholder={`Enter your ${service} Client Secret`} value={clientSecret} onChange={e => setClientSecret(e.target.value)} className="w-full p-2 rounded text-sm bg-neutral-700 outline-0 focus:outline-1 focus-visible:border-none focus-visible:outline-none outline-offset-0 border-none" required />
                        </div>
                    </div>
                    <div className="flex-1" />
                    <div className="mt-4 flex gap-3">
                        <div onClick={onSave} className={service === "Kick" ? "bg-kick-green hover:bg-kick-green-dark active:bg-kick-green-darker text-black px-4 py-2 rounded text-sm font-semibold w-min cursor-pointer" : "bg-spotify-green hover:bg-spotify-green-dark active:bg-spotify-green-darker px-4 py-2 rounded text-sm font-semibold w-min cursor-pointer"}>Save</div>
                        {hasSecrets ? (
                            <div className="text-xs text-green-500 mt-2">Secrets are set, you can close this window.</div>
                        ) : (
                            <span className="text-blue-400 flex items-center gap-1 text-xs"><InfoIcon className="size-5 " /> You can change these values later in the app settings.</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
