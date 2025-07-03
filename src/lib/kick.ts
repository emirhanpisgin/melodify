import fetch from "node-fetch";
import Config from "./config";
import Pusher from "pusher-js";
import { playSong } from "./spotify";
import { logInfo, logError, logWarn, logDebug } from "./logger";
import { redactSecrets } from "./logger-utils";

const redirectUri = "http://localhost:8889/callback";
export let isListening = false;
let refreshKickTokenInterval: NodeJS.Timeout | null = null;

export async function refreshKickAccessToken(
    window?: Electron.BrowserWindow
): Promise<boolean> {
    logDebug(
        "refreshKickAccessToken called",
        redactSecrets({ window: !!window })
    );
    const kickRefreshToken = Config.get("kickRefreshToken");
    if (!kickRefreshToken) return false;
    try {
        const kickClientId = Config.get("kickClientId");
        const kickClientSecret = Config.get("kickClientSecret");
        logDebug(
            "Kick credentials fetched",
            redactSecrets({ kickClientId, kickClientSecret })
        );
        if (!kickClientId || !kickClientSecret) {
            window?.webContents.send("toast", {
                type: "error",
                message:
                    "Kick client ID or secret is not set. Please configure in settings.",
            });
            return false;
        }
        const params = new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: `${kickRefreshToken}`,
            client_id: kickClientId,
            client_secret: kickClientSecret,
        });
        logDebug(
            "Refreshing Kick token with params",
            redactSecrets(Object.fromEntries(params))
        );
        const res = await fetch("https://id.kick.com/oauth/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });
        logDebug("Kick token refresh response", { status: res.status });
        if (!res.ok) {
            throw new Error(`Failed to refresh token: ${res.statusText}`);
        }
        const data = await res.json();
        const { access_token, refresh_token, expires_in } = data as any;
        Config.set({
            kickAccessToken: access_token,
            kickRefreshToken: refresh_token ?? kickRefreshToken,
            kickExpiresAt: Date.now() + expires_in * 1000,
        });
        logInfo("Kick access token refreshed");
        return true;
    } catch (error) {
        logError(error, "kick:refreshKickAccessToken");
        return false;
    }
}

export async function checkKickAccessToken(
    window?: Electron.BrowserWindow
): Promise<boolean> {
    logDebug(
        "checkKickAccessToken called",
        redactSecrets({ window: !!window })
    );
    const kickAccessToken = Config.get("kickAccessToken");
    const kickRefreshToken = Config.get("kickRefreshToken");
    const kickExpiresAt = Config.get("kickExpiresAt");
    logDebug(
        "Kick token state",
        redactSecrets({
            kickAccessToken: !!kickAccessToken,
            kickRefreshToken: !!kickRefreshToken,
            kickExpiresAt,
        })
    );
    if (!kickAccessToken || !kickRefreshToken || !kickExpiresAt) return false;
    if (Date.now() >= kickExpiresAt) {
        return await refreshKickAccessToken(window);
    }
    return true;
}

export async function sendKickMessage(message: string): Promise<void> {
    logDebug("sendKickMessage called", redactSecrets({ message }));
    const { kickAccessToken, userId } = Config.getMany([
        "kickAccessToken",
        "userId",
    ]);
    logDebug(
        "Kick message config",
        redactSecrets({ hasToken: !!kickAccessToken, userId })
    );
    if (!kickAccessToken || !userId) {
        logError("Missing Kick access token or userId", "kick:sendKickMessage");
        throw new Error("Missing Kick access token or userId");
    }
    const response = await fetch(`https://api.kick.com/public/v1/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${kickAccessToken}`,
        },
        body: JSON.stringify({
            broadcaster_user_id: userId,
            content: message,
            type: "bot",
        }),
    });
    logDebug("Kick message response", { status: response.status });
    if (!response.ok) {
        logError(
            `Failed to send message: ${response.statusText}`,
            "kick:sendKickMessage"
        );
        throw new Error(`Failed to send message: ${response.statusText}`);
    }
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

    messageChannel.bind("App\\Events\\ChatMessageEvent", (raw: any) => {
        const data = typeof raw === "string" ? JSON.parse(raw) : raw;

        const username = data?.sender?.username;
        const message = data?.content;

        if (!username || !message) return;

        const prefix = Config.get("prefix");

        if (!message.startsWith(prefix)) return;

        const badges = data?.sender?.identity?.badges.map(
            (badge: { type: string; text: string; count?: number }) =>
                badge.type
        );

        const canPlay = canPlaySongs(badges);
        if (!canPlay) return;

        const songQuery = message.slice(prefix.length);

        playSong(songQuery, username);
        logInfo(`Playing song: ${songQuery}`);
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

function canPlaySongs(badges: string[]): boolean {
    const canAnyonePlaySong = Config.get("canAnyonePlaySong");

    if (canAnyonePlaySong) return true;

    if (
        badges.includes("og") ||
        badges.includes("vip") ||
        badges.includes("subscriber") ||
        badges.includes("broadcaster")
    ) {
        return true;
    }
    return false;
}

export async function startKickTokenAutoRefresh(
    window?: Electron.BrowserWindow
) {
    if (refreshKickTokenInterval) clearInterval(refreshKickTokenInterval);

    refreshKickTokenInterval = setInterval(async () => {
        const kickExpiresAt = Config.get("kickExpiresAt");
        if (!kickExpiresAt) return;
        if (Date.now() >= kickExpiresAt - 2 * 60 * 1000) {
            await refreshKickAccessToken(window);
        }
    }, 60 * 1000);
}

export function stopKickTokenAutoRefresh() {
    if (refreshKickTokenInterval) clearInterval(refreshKickTokenInterval);
    refreshKickTokenInterval = null;
}

export default {
    redirectUri,
};
