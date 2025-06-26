import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
    send: (channel: string, data: any) => ipcRenderer.send(channel, data),
    on: (channel: string, func: (event: any, ...args: any[]) => void) => {
        ipcRenderer.on(channel, func);
    },
    invoke: (channel: string, data: any) => ipcRenderer.invoke(channel, data),
    removeListener: (channel: string, func: (event: any, ...args: any[]) => void) => {
        ipcRenderer.removeListener(channel, func);
    },
    openExternal: (url: string) => ipcRenderer.send("open-external", url),
    getSpotifySecrets: () => ipcRenderer.invoke("spotify:getSecrets"),
    setSpotifySecrets: (secrets: Record<string, string>) => ipcRenderer.send("spotify:setSecrets", secrets),
    getKickSecrets: () => ipcRenderer.invoke("kick:getSecrets"),
    setKickSecrets: (secrets: Record<string, string>) => ipcRenderer.send("kick:setSecrets", secrets),
    minimize: () => ipcRenderer.send("window:minimize"),
    close: () => ipcRenderer.send("window:close"),
});
