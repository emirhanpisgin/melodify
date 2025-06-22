export {};

declare global {
    interface Window {
        electronAPI: {
            send: (channel: string, data?: any) => void;
            on: (channel: string, func: (event: any, ...args: any[]) => void) => void;
            invoke: (channel: string, data?: any) => Promise<any>;
            removeListener: (channel: string, func: (event: any, ...args: any[]) => void) => void;
            openExternal: (url: string) => void;
            getSpotifySecrets: () => Promise<Record<string, string>>;
            setSpotifySecrets: (secrets: Record<string, string>) => void;
            getKickSecrets: () => Promise<Record<string, string>>;
            setKickSecrets: (secrets: Record<string, string>) => void;
        };
    }
}
