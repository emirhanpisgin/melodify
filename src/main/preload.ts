import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
    send: (channel: string, data?: any) => ipcRenderer.send(channel, data),
    on: (channel: string, func: (...args: any[]) => void) => {
        if (typeof func !== 'function') {
            console.error('Invalid function provided to electronAPI.on for channel:', channel);
            return;
        }
        return ipcRenderer.on(channel, (_event, ...args) => {
            try {
                func(...args);
            } catch (error) {
                console.error('Error in event listener for channel:', channel, error);
            }
        });
    },
    invoke: (channel: string, ...args: any[]) =>
        ipcRenderer.invoke(channel, ...args),
    removeListener: (channel: string, func: (...args: any[]) => void) =>
        ipcRenderer.removeListener(channel, func),
    removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
    openExternal: (url: string) => ipcRenderer.send("open-external", url),
    getSpotifySecrets: () => ipcRenderer.invoke("spotify:getSecrets"),
    setSpotifySecrets: (secrets: Record<string, string>) =>
        ipcRenderer.send("spotify:setSecrets", secrets),
    getKickSecrets: () => ipcRenderer.invoke("kick:getSecrets"),
    setKickSecrets: (secrets: Record<string, string>) =>
        ipcRenderer.send("kick:setSecrets", secrets),
    minimize: () => ipcRenderer.send("window:minimize"),
    close: () => ipcRenderer.send("window:close"),
    restart: () => ipcRenderer.send("app:restart"),
    onUpdateStatus: (callback: (event: any, data: any) => void) =>
        ipcRenderer.on("update:status", callback),
    checkForUpdates: () => ipcRenderer.send("update:check"),
    setAutoUpdate: (enabled: boolean) =>
        ipcRenderer.send("update:setAuto", enabled),
    getAutoUpdate: () => ipcRenderer.invoke("update:getAuto"),
    getAppVersion: () => ipcRenderer.invoke("app:getVersion"),
    selectSongFilePath: () => ipcRenderer.invoke("file:selectSongFilePath"),
    getStartupStatus: () => ipcRenderer.invoke("startup:getStatus"),
    setStartupStatus: (enabled: boolean) =>
        ipcRenderer.send("startup:setStatus", enabled),
});
