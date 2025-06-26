import { ipcMain, BrowserWindow } from "electron";
import Config from "../lib/config";
import { startKickAuthServer, openKickAuthUrl } from "../lib/kickAuthServer";
import { listenToChat, refreshAccessTokenIfNeeded, sendKickMessage, startKickTokenAutoRefresh, stopKickTokenAutoRefresh } from "../lib/kick";

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
    let accessToken = Config.get("kickAccessToken");
    const refreshToken = Config.get("kickRefreshToken");
    if (!accessToken || !refreshToken) {
        stopKickTokenAutoRefresh();
        return { authenticated: false };
    }

    const refreshed = await refreshAccessTokenIfNeeded(window);
    if (!refreshed) {
        stopKickTokenAutoRefresh();
        return { authenticated: false };
    }

    if (refreshed) {
        accessToken = Config.get("kickAccessToken");
    }

    listenToChat(window);
    startKickTokenAutoRefresh(window);

    const channelRequest = await fetch("https://api.kick.com/public/v1/channels", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!channelRequest.ok) {
        throw new Error(`Failed to fetch channels: ${channelRequest.statusText}`);
    }

    const { data } = await channelRequest.json();

    const username = data[0]?.slug;

    return { authenticated: true, username: username || "" };
});

ipcMain.on("kick:logout", (event) => {
    stopKickTokenAutoRefresh();
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
