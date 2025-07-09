import { ipcMain, BrowserWindow } from "electron";
import Config from "../../../core/config";
import { startKickAuthServer, openKickAuthUrl } from "../auth/server";
import {
    isListening,
    listenToChat,
    sendKickMessage,
    startKickTokenAutoRefresh,
    stopKickTokenAutoRefresh,
} from "../chat/listener";
import { logInfo, logError, logWarn, logDebug } from "../../../core/logging";
import { redactSecrets } from "../../../core/logging/utils";
import { kickClient } from "../api/client";

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

    const result = await kickClient.findChatroom(username);
    if (!result) {
        return null;
    }

    const { chatroomId, userId } = result;
    Config.set({ username, chatroomId, userId: userId.toString() });
    logInfo(
        "kick:findChatroom set config",
        redactSecrets({ username, chatroomId, userId })
    );

    return chatroomId;
});

ipcMain.on("kick:sendMessage", async (event, message) => {
    logDebug("IPC kick:sendMessage called", redactSecrets({ message }));
    await sendKickMessage(message);
});

ipcMain.handle("kick:checkAuth", async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);

    if (!kickClient.hasTokens()) {
        stopKickTokenAutoRefresh();
        return { authenticated: false };
    }

    const refreshed = await kickClient.getValidAccessToken();
    if (!refreshed) {
        stopKickTokenAutoRefresh();
        return { authenticated: false };
    }

    listenToChat(window);
    startKickTokenAutoRefresh(window);

    try {
        const channels = await kickClient.getChannels();
        const username = channels[0]?.slug || "";
        return { authenticated: true, username };
    } catch (error) {
        logError(error, "kick:checkAuth");
        return { authenticated: false };
    }
});

ipcMain.on("kick:logout", (event) => {
    logInfo("IPC kick:logout called");
    stopKickTokenAutoRefresh();
    kickClient.clearTokens();
});

ipcMain.handle("kick:hasSecrets", async () => {
    const kickClientId = Config.get("kickClientId");
    const kickClientSecret = Config.get("kickClientSecret");
    logDebug(
        "kick:hasSecrets called",
        redactSecrets({
            hasClientId: !!kickClientId,
            hasClientSecret: !!kickClientSecret,
        })
    );
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
