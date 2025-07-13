export {};

// JSON module declarations for i18n
declare module "*.json" {
    const value: any;
    export default value;
}

declare global {
    interface Window {
        electronAPI: {
            send: (channel: string, data?: any) => void;
            on: (channel: string, func: (...args: any[]) => void) => void;
            invoke: (channel: string, ...args: any[]) => Promise<any>;
            removeListener: (
                channel: string,
                func: (...args: any[]) => void
            ) => void;
            removeAllListeners: (channel: string) => void;
            openExternal: (url: string) => void;
            getSpotifySecrets: () => Promise<Record<string, string>>;
            setSpotifySecrets: (secrets: Record<string, string>) => void;
            getKickSecrets: () => Promise<Record<string, string>>;
            setKickSecrets: (secrets: Record<string, string>) => void;
            minimize: () => void;
            close: () => void;
            openUITestWindow: () => Promise<void>;
            restart: () => void;
            onUpdateStatus: (callback: (event: any, data: any) => void) => void;
            checkForUpdates: () => void;
            getAppVersion: () => Promise<string>;
            selectSongFilePath: () => Promise<string | null>;
            updateTranslatedDefaults: () => Promise<{
                success: boolean;
                error?: string;
            }>;
            getStartupStatus: () => Promise<boolean>;
            setStartupStatus: (enabled: boolean) => void;
            getAutoUpdate: () => Promise<boolean>;
            setAutoUpdate: (enabled: boolean) => void;
            downloadUpdate: (manifest: any) => void;
            installUpdate: () => void;
        };
    }
}
