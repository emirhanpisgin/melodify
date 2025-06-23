import { ipcMain, BrowserWindow } from "electron";
import Config from "../lib/config";
import { startKickAuthServer, openKickAuthUrl } from "../lib/kickAuthServer";
import { listenToChat, refreshAccessTokenIfNeeded, sendKickMessage } from "../lib/kick";

ipcMain.on("kick:auth", async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;

    startKickAuthServer(window);

    openKickAuthUrl();
});

ipcMain.handle("kick:getUserData", async (event) => {
    const { username, chatroomId } = Config.getKick();
    return {
        username: username || "",
        chatroomId: chatroomId || "",
    };
});

ipcMain.handle("kick:findChatroom", async (event, data) => {
    const { username } = data;

    const response = await fetch(`https://kick.com/api/v1/${username}/chatroom`);
    const body = await response.json();

    if (!response.ok || !body.chatroom.id) {
        return null;
    }

    const chatroomId = body.chatroom.id;
    const userId = body.id;
    Config.setKick({ username, chatroomId, userId });

    return chatroomId;
});

ipcMain.on("kick:sendMessage", async (event, message) => {
    await sendKickMessage(message);
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

    listenToChat(window);

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

ipcMain.on("kick:setSecrets", async (event, secrets) => {
    Config.setSecrets(secrets);
});
