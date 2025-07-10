import Config from "../../../core/config";
import Pusher from "pusher-js";
import { playSong } from "../../spotify/playback/player";
import { logInfo, logError, logWarn, logDebug } from "../../../core/logging";
import { redactSecrets } from "../../../core/logging/utils";
import { CommandContext } from "../../../core/commands/manager";
import { commandManager } from "../../../core/ipc/handlers";
import { kickClient } from "../api/client";

export let isListening = false;
let refreshKickTokenInterval: NodeJS.Timeout | null = null;
let pusherInstance: Pusher | null = null;
let messageChannelInstance: any = null;
let rewardsChannelInstance: any = null;

export async function refreshKickAccessToken(): Promise<boolean> {
    return await kickClient.refreshAccessToken();
}

export async function sendKickMessage(message: string): Promise<void> {
    logDebug("sendKickMessage called", redactSecrets({ message }));

    const userId = Config.get("userId");
    if (!userId) {
        logError("Missing Kick userId", "kick:sendKickMessage");
        throw new Error("Missing Kick userId");
    }

    await kickClient.sendMessage(message, Number(userId));
}

export async function listenToChat(window?: Electron.BrowserWindow) {
    if (isListening) {
        logWarn("Already listening to Kick chat", "kick:listenToChat");
        return;
    }

    const pusher = new Pusher("32cbd69e4b950bf97679", {
        cluster: "us2",
    });
    pusherInstance = pusher;

    const chatroomId = Config.get("chatroomId");
    if (!chatroomId) return;

    const messageChannel = pusher.subscribe(`chatrooms.${chatroomId}.v2`);
    const rewardsChannel = pusher.subscribe(`chatroom_${chatroomId}`);
    messageChannelInstance = messageChannel;
    rewardsChannelInstance = rewardsChannel;

    logInfo(`Listening to Kick chat for chatroom ID: ${chatroomId}`);
    isListening = true;
    window?.webContents.send("kick:chatConnected");

    // Handle Pusher connection errors
    pusher.connection.bind("error", (error: any) => {
        logError(error, "kick:pusherConnectionError");
        if (error?.error?.data?.code === 4004) {
            // Authentication error - stop listening
            logError(
                "Pusher authentication failed, stopping chat listener",
                "kick:pusherAuth"
            );
            stopListeningToChat(window);
            window?.webContents.send("kick:authenticationFailed");
        }
    });

    pusher.connection.bind("disconnected", () => {
        logWarn("Pusher connection disconnected", "kick:pusherDisconnected");
        if (isListening) {
            window?.webContents.send("kick:chatDisconnected");
        }
    });

    messageChannel.bind("App\\Events\\ChatMessageEvent", async (raw: any) => {
        try {
            const data = typeof raw === "string" ? JSON.parse(raw) : raw;
            const username = data?.sender?.username;
            const message = data?.content;
            if (!username || !message) return;
            const badges =
                data?.sender?.identity?.badges.map(
                    (badge: { type: string; text: string; count?: number }) =>
                        badge.type
                ) || [];
            // Command context
            const ctx: CommandContext = {
                username,
                message,
                badges,
                raw: data,
            };
            await commandManager.handle(ctx);
        } catch (error) {
            logError(error, "kick:messageProcessing");
        }
    });

    type RewardRedeemedEvent = {
        reward_title: string;
        user_id: number;
        channel_id: number;
        username: string;
        user_input: string;
        reward_background_color: string;
    };

    rewardsChannel.bind("RewardRedeemedEvent", (raw: any) => {
        try {
            const data: RewardRedeemedEvent =
                typeof raw === "string" ? JSON.parse(raw) : raw;

            const username = data.username;
            const rewardTitle = data.reward_title;
            const configuredRewardTitle =
                Config.get("rewardTitle") || "Song Request";

            if (
                !username ||
                !rewardTitle ||
                configuredRewardTitle !== rewardTitle
            )
                return;

            const songQuery = data.user_input.trim();
            if (!songQuery) return;

            playSong(songQuery, username);
            console.log("🎵 Playing song from reward:", songQuery);
        } catch (error) {
            logError(error, "kick:rewardProcessing");
        }
    });

    pusherInstance = pusher;
    messageChannelInstance = messageChannel;
    rewardsChannelInstance = rewardsChannel;
}

export function stopListeningToChat(window?: Electron.BrowserWindow) {
    if (!isListening) {
        logDebug(
            "Not currently listening to Kick chat",
            "kick:stopListeningToChat"
        );
        return;
    }

    try {
        // Disconnect from Pusher channels
        if (messageChannelInstance) {
            messageChannelInstance.unbind_all();
            messageChannelInstance = null;
        }

        if (rewardsChannelInstance) {
            rewardsChannelInstance.unbind_all();
            rewardsChannelInstance = null;
        }

        // Disconnect from Pusher entirely
        if (pusherInstance) {
            pusherInstance.disconnect();
            pusherInstance = null;
        }

        isListening = false;
        logInfo("Stopped listening to Kick chat", "kick:stopListeningToChat");
        window?.webContents.send("kick:chatDisconnected");
    } catch (error) {
        logError(error, "kick:stopListeningToChat");
        // Force reset state even if cleanup failed
        isListening = false;
        pusherInstance = null;
        messageChannelInstance = null;
        rewardsChannelInstance = null;
    }
}

export async function startKickTokenAutoRefresh(
    window?: Electron.BrowserWindow
) {
    if (refreshKickTokenInterval) clearInterval(refreshKickTokenInterval);

    refreshKickTokenInterval = setInterval(async () => {
        const kickExpiresAt = Config.get("kickExpiresAt");
        if (!kickExpiresAt) return;

        // Check if token is about to expire (within 2 minutes)
        if (Date.now() >= kickExpiresAt - 2 * 60 * 1000) {
            const refreshSuccess = await refreshKickAccessToken();

            if (!refreshSuccess) {
                logError(
                    "Failed to refresh Kick token, stopping chat listener",
                    "kick:tokenRefresh"
                );
                stopListeningToChat(window);
                stopKickTokenAutoRefresh();

                // Notify the UI that authentication failed
                window?.webContents.send("kick:authenticationFailed");
            }
        }
    }, 60 * 1000);
}

export function stopKickTokenAutoRefresh() {
    if (refreshKickTokenInterval) clearInterval(refreshKickTokenInterval);
    refreshKickTokenInterval = null;
}
