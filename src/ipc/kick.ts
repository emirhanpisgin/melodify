import { ipcMain, BrowserWindow } from "electron";
import Config from "../lib/config";
import { startKickAuthServer, openKickAuthUrl } from "../lib/kickAuthServer";
import {
    isListening,
    listenToChat,
    sendKickMessage,
    startKickTokenAutoRefresh,
    stopKickTokenAutoRefresh,
    checkKickAccessToken,
} from "../lib/kick";
import { logInfo, logError, logWarn, logDebug } from "../lib/logger";
import { redactSecrets } from "../lib/logger-utils";

ipcMain.on("kick:auth", async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    logDebug("IPC kick:auth called", redactSecrets({ sender: !!event.sender }));
    if (!window) return;

    startKickAuthServer(window);

    openKickAuthUrl();
});

ipcMain.handle("kick:getUserData", async (event) => {
    logDebug("IPC kick:getUserData called");
    return {
        username: Config.get("username") || "",
        chatroomId: Config.get("chatroomId") || "",
    };
});

ipcMain.handle("kick:findChatroom", async (event, data) => {
    logDebug("IPC kick:findChatroom called", redactSecrets(data));
    const { username } = data;

    const response = await fetch(
        `https://kick.com/api/v1/${username}/chatroom`
    );
    const body = await response.json();
    logDebug("kick:findChatroom response", { status: response.status });

    if (!response.ok || !body.chatroom.id) {
        return null;
    }

    const chatroomId = body.chatroom.id;
    const userId = body.id;
    Config.set({ username, chatroomId, userId });
    logInfo("kick:findChatroom set config", redactSecrets({ username, chatroomId, userId }));

    return chatroomId;
});

ipcMain.on("kick:sendMessage", async (event, message) => {
    logDebug("IPC kick:sendMessage called", redactSecrets({ message }));
    await sendKickMessage(message);
});

ipcMain.handle("kick:checkAuth", async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    let accessToken = Config.get("kickAccessToken");
    const refreshToken = Config.get("kickRefreshToken");
    logDebug("kick:checkAuth called", redactSecrets({ hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken }));
    if (!accessToken || !refreshToken) {
        stopKickTokenAutoRefresh();
        return { authenticated: false };
    }
    const refreshed = await checkKickAccessToken(window);
    if (!refreshed) {
        stopKickTokenAutoRefresh();
        return { authenticated: false };
    }
    if (refreshed) {
        accessToken = Config.get("kickAccessToken");
    }
    listenToChat(window);
    startKickTokenAutoRefresh(window);
    const channelRequest = await fetch(
        "https://api.kick.com/public/v1/channels",
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );
    logDebug("kick:checkAuth channel request", { status: channelRequest.status });
    if (!channelRequest.ok) {
        throw new Error(
            `Failed to fetch channels: ${channelRequest.statusText}`
        );
    }
    const { data } = await channelRequest.json();
    const username = data[0]?.slug;
    return { authenticated: true, username: username || "" };
});

ipcMain.on("kick:logout", (event) => {
    logInfo("IPC kick:logout called");
    stopKickTokenAutoRefresh();
    Config.set({
        kickAccessToken: undefined,
        kickRefreshToken: undefined,
        kickExpiresAt: undefined,
    });
});

ipcMain.handle("kick:hasSecrets", async () => {
    const kickClientId = Config.get("kickClientId");
    const kickClientSecret = Config.get("kickClientSecret");
    logDebug("kick:hasSecrets called", redactSecrets({ hasClientId: !!kickClientId, hasClientSecret: !!kickClientSecret }));
    return !!kickClientId && !!kickClientSecret;
});

ipcMain.handle("kick:getSecrets", async () => {
    logDebug("kick:getSecrets called");
    return {
        kickClientId: Config.get("kickClientId"),
        kickClientSecret: Config.get("kickClientSecret"),
    };
});

ipcMain.on("kick:setSecrets", async (event, secrets) => {
    logInfo("kick:setSecrets called", redactSecrets(secrets));
    Config.set(secrets);
});

ipcMain.handle("kick:isListeningToChat", async () => {
    logDebug("kick:isListeningToChat called");
    return isListening;
});
