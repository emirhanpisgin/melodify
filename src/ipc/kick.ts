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
    return {
        username: Config.get("username") || "",
        chatroomId: Config.get("chatroomId") || "",
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
    Config.set({ username, chatroomId, userId });

    return chatroomId;
});

ipcMain.on("kick:sendMessage", async (event, message) => {
    await sendKickMessage(message);
});

ipcMain.handle("kick:checkAuth", async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const accessToken = Config.get("kickAccessToken");
    const refreshToken = Config.get("kickRefreshToken");
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
    Config.set({ kickAccessToken: undefined, kickRefreshToken: undefined, kickExpiresAt: undefined });
});

ipcMain.handle("kick:hasSecrets", async () => {
    const kickClientId = Config.get("kickClientId");
    const kickClientSecret = Config.get("kickClientSecret");
    return !!kickClientId && !!kickClientSecret;
});

ipcMain.handle("kick:getSecrets", async () => {
    return {
        kickClientId: Config.get("kickClientId"),
        kickClientSecret: Config.get("kickClientSecret"),
    };
});

ipcMain.on("kick:setSecrets", async (event, secrets) => {
    Config.set(secrets);
});
