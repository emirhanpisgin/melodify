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

    const chatroomId = Config.get("chatroomId");
    if (!chatroomId) return;

    const messageChannel = pusher.subscribe(`chatrooms.${chatroomId}.v2`);
    const rewardsChannel = pusher.subscribe(`chatroom_${chatroomId}`);

    logInfo(`Listening to Kick chat for chatroom ID: ${chatroomId}`);
    isListening = true;
    window?.webContents.send("kick:chatConnected");

    messageChannel.bind("App\\Events\\ChatMessageEvent", async (raw: any) => {
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
        const data: RewardRedeemedEvent =
            typeof raw === "string" ? JSON.parse(raw) : raw;

        const username = data.username;
        const rewardTitle = data.reward_title;
        const configuredRewardTitle =
            Config.get("rewardTitle") || "Song Request";

        if (!username || !rewardTitle || configuredRewardTitle !== rewardTitle)
            return;

        const songQuery = data.user_input.trim();
        if (!songQuery) return;

        playSong(songQuery, username);
        console.log("🎵 Playing song from reward:", songQuery);
    });
}

export async function startKickTokenAutoRefresh(
    window?: Electron.BrowserWindow
) {
    if (refreshKickTokenInterval) clearInterval(refreshKickTokenInterval);

    refreshKickTokenInterval = setInterval(async () => {
        const kickExpiresAt = Config.get("kickExpiresAt");
        if (!kickExpiresAt) return;
        if (Date.now() >= kickExpiresAt - 2 * 60 * 1000) {
            await refreshKickAccessToken();
        }
    }, 60 * 1000);
}

export function stopKickTokenAutoRefresh() {
    if (refreshKickTokenInterval) clearInterval(refreshKickTokenInterval);
    refreshKickTokenInterval = null;
}
