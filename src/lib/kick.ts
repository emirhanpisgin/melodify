import fetch from "node-fetch";
import Config from "./config";
import Pusher from "pusher-js";
import { playSong } from "./spotify";

const redirectUri = "http://localhost:8889/callback";
export let isListening = false;
let refreshKickTokenInterval: NodeJS.Timeout | null = null;

async function refreshAccessTokenIfNeeded(
    window?: Electron.BrowserWindow
): Promise<boolean> {
    const kickAccessToken = Config.get("kickAccessToken");
    const kickRefreshToken = Config.get("kickRefreshToken");
    const kickExpiresAt = Config.get("kickExpiresAt");
    if (!kickAccessToken || !kickRefreshToken || !kickExpiresAt) return false;

    if (Date.now() >= kickExpiresAt) {
        try {
            const kickClientId = Config.get("kickClientId");
            const kickClientSecret = Config.get("kickClientSecret");
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

            const res = await fetch("https://id.kick.com/oauth/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
            });

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

            console.log("Kick access token refreshed");
            return true;
        } catch (error) {
            console.error("Failed to refresh Kick access token", error);
            return false;
        }
    }

    return true;
}

export async function sendKickMessage(message: string): Promise<void> {
    const { kickAccessToken, userId } = Config.getMany([
        "kickAccessToken",
        "userId",
    ]);
    if (!kickAccessToken || !userId)
        throw new Error("Missing Kick access token or userId");

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

    if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
    }
}

/**
 * Listen to Kick chat and handle song requests via chat commands.
 * @param window Optional Electron window for sending events.
 */
export async function listenToChat(window?: Electron.BrowserWindow) {
    if (isListening) {
        console.log("Already listening to Kick chat");
        return;
    }
    const pusher = new Pusher("32cbd69e4b950bf97679", {
        cluster: "us2",
    });

    const chatroomId = Config.get("chatroomId");
    if (!chatroomId) return;

    const channel = pusher.subscribe(`chatrooms.${chatroomId}.v2`);

    console.log(`📡 Listening to Kick chat for chatroom ID: ${chatroomId}`);
    isListening = true;
    window?.webContents.send("kick:chatConnected");

    channel.bind("App\\Events\\ChatMessageEvent", (raw: any) => {
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
        console.log("🎵 Playing song:", songQuery);
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
    // Clear any existing interval
    if (refreshKickTokenInterval) clearInterval(refreshKickTokenInterval);
    // Check every 60 seconds
    refreshKickTokenInterval = setInterval(async () => {
        const kickExpiresAt = Config.get("kickExpiresAt");
        if (!kickExpiresAt) return;
        // Refresh 2 minutes before expiry
        if (Date.now() >= kickExpiresAt - 2 * 60 * 1000) {
            await refreshAccessTokenIfNeeded(window);
        }
    }, 60 * 1000);
}

export function stopKickTokenAutoRefresh() {
    if (refreshKickTokenInterval) clearInterval(refreshKickTokenInterval);
    refreshKickTokenInterval = null;
}

export { refreshAccessTokenIfNeeded };

export default {
    redirectUri,
};
