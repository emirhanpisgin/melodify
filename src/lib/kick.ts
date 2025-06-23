import fetch from "node-fetch";
import Config from "./config";
import Pusher from "pusher-js";
import { playSong } from "./spotify";

const redirectUri = "http://localhost:8889/callback";

async function refreshAccessTokenIfNeeded(window?: Electron.BrowserWindow): Promise<boolean> {
    const tokens = Config.getKick();
    if (!tokens) return false;

    if (Date.now() >= (tokens.expiresAt as number)) {
        try {
            const { kickClientId, kickClientSecret } = Config.getSecrets();
            if (!kickClientId || !kickClientSecret) {
                window.webContents.send("toast", {
                    type: "error",
                    message: "Kick client ID or secret is not set. Please configure in settings.",
                });
                return false;
            }
            const params = new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: `${tokens.refreshToken}`,
                client_id: kickClientId,
                client_secret: kickClientSecret,
            });

            const res = await fetch("https://id.kick.com/oauth/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: params.toString(),
            });

            if (!res.ok) {
                throw new Error(`Failed to refresh token: ${res.statusText}`);
            }

            const data = await res.json();
            const { access_token, refresh_token, expires_in } = data as any;

            Config.setKick({
                accessToken: access_token,
                refreshToken: refresh_token ?? tokens.refreshToken,
                expiresAt: expires_in,
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
    const { accessToken, userId } = Config.getKick();

    const response = await fetch(`https://api.kick.com/public/v1/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
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

export async function listenToChat(window?: Electron.BrowserWindow) {
    const pusher = new Pusher("32cbd69e4b950bf97679", {
        cluster: "us2",
    });

    const { chatroomId } = Config.getKick();

    const channel = pusher.subscribe(`chatrooms.${chatroomId}.v2`);

    console.log(`📡 Listening to Kick chat for chatroom ID: ${chatroomId}`);
    window.webContents.send("kick:chatConnected");

    channel.bind("App\\Events\\ChatMessageEvent", (raw: any) => {
        const data = typeof raw === "string" ? JSON.parse(raw) : raw;

        const username = data?.sender?.username;
        const message = data?.content;

        if (!username || !message) return;

        if (!message.startsWith(Config.getKick().prefix)) return;

        const badges = data?.sender?.identity?.badges.map(
            (badge: { type: string; text: string; count?: number }) => badge.type
        );

        const canPlay = canPlaySongs(badges);

        if (!canPlay) return;

        const songQuery = message.replace(Config.getKick().prefix, "").trim();

        playSong(songQuery);

        console.log(`📥 New message from ${badges} ${username}: ${message}`);
    });
}

function canPlaySongs(badges: string[]): boolean {
    const { canUsersPlaySong } = Config.getKick();

    if (canUsersPlaySong) return true;

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

export { refreshAccessTokenIfNeeded };

export default {
    redirectUri,
};
