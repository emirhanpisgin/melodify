import { ipcMain, BrowserWindow } from "electron";
import Config from "../lib/config";
import { startKickAuthServer, openKickAuthUrl } from "../lib/kickAuthServer";
import { refreshAccessTokenIfNeeded } from "../lib/kick";

ipcMain.on("kick:auth", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;

    startKickAuthServer(window);

    openKickAuthUrl();
});

ipcMain.handle("kick:checkAuth", async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const { accessToken, refreshToken } = Config.getKick();
    if (!accessToken || !refreshToken) {
        return { authenticated: false };
    }

    const refreshed = await refreshAccessTokenIfNeeded(window);
    if (!refreshed) {
        return { authenticated: false };
    }

    return { authenticated: true };
});

ipcMain.on("kick:logout", (event) => {
    Config.clearKick();
});

ipcMain.handle("kick:hasSecrets", async () => {
    const { kickClientId, kickClientSecret } = Config.getSecrets();
    return !!kickClientId && !!kickClientSecret;
});

ipcMain.handle("kick:getSecrets", async () => {
    const { kickClientId, kickClientSecret } = Config.getSecrets();
    return { kickClientId, kickClientSecret };
});

ipcMain.handle("kick:setSecrets", async (event, secrets) => {
    Config.setKick(secrets);
    return true;
});
