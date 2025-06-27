import SpotifyWebApi from "spotify-web-api-node";
import Config from "./config";
import { sendKickMessage } from "./kick";
import { logError } from "./logger";

let spotifyApi: SpotifyWebApi | null = null;

/**
 * Get a configured SpotifyWebApi instance, or null if secrets are missing.
 */
export function getSpotifyApi(): SpotifyWebApi | null {
    if (spotifyApi) return spotifyApi;
    const spotifyClientId = Config.get("spotifyClientId");
    const spotifyClientSecret = Config.get("spotifyClientSecret");
    if (!spotifyClientId || !spotifyClientSecret) {
        return null;
    }
    spotifyApi = new SpotifyWebApi({
        clientId: spotifyClientId,
        clientSecret: spotifyClientSecret,
        redirectUri: "http://127.0.0.1:8888/callback",
    });
    // Load tokens if any
    const accessToken = Config.get("spotifyAccessToken");
    const refreshToken = Config.get("spotifyRefreshToken");
    if (accessToken) spotifyApi.setAccessToken(accessToken);
    if (refreshToken) spotifyApi.setRefreshToken(refreshToken);
    return spotifyApi;
}

/**
 * Load Spotify tokens from config and set them on the API instance.
 */
export function loadTokens() {
    const accessToken = Config.get("spotifyAccessToken");
    const expiresAt = Config.get("spotifyExpiresAt");
    const refreshToken = Config.get("spotifyRefreshToken");
    if (accessToken && refreshToken && expiresAt) {
        const api = getSpotifyApi();
        if (api) {
            api.setAccessToken(accessToken);
            api.setRefreshToken(refreshToken);
        }
        return { accessToken, refreshToken, expiresAt };
    }
    return null;
}

/**
 * Save Spotify tokens to config and update the API instance.
 */
export function saveTokens({
    accessToken,
    refreshToken,
    expiresIn,
}: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}) {
    const expiresAt = Date.now() + expiresIn * 1000;
    Config.set({ spotifyAccessToken: accessToken, spotifyRefreshToken: refreshToken, spotifyExpiresAt: expiresAt });
    const api = getSpotifyApi();
    if (api) {
        api.setAccessToken(accessToken);
        api.setRefreshToken(refreshToken);
    }
}

/**
 * Clear Spotify tokens from config and API instance.
 */
export function clearTokens() {
    Config.set({ spotifyAccessToken: undefined, spotifyRefreshToken: undefined, spotifyExpiresAt: undefined });
    const api = getSpotifyApi();
    if (api) {
        api.setAccessToken("");
        api.setRefreshToken("");
    }
}

/**
 * Refresh the Spotify access token if expired.
 */
export async function refreshAccessTokenIfNeeded(window?: Electron.BrowserWindow): Promise<boolean> {
    const tokens = loadTokens();
    if (!tokens) return false;
    if (Date.now() >= tokens.expiresAt) {
        try {
            const api = getSpotifyApi();
            if (!api) return false;
            const data = await api.refreshAccessToken();
            const { access_token, expires_in } = data.body;
            api.setAccessToken(access_token);
            saveTokens({
                accessToken: access_token,
                refreshToken: tokens.refreshToken,
                expiresIn: expires_in,
            });
            console.log("Spotify access token refreshed");
            return true;
        } catch (error) {
            console.error("Failed to refresh Spotify access token", error);
            return false;
        }
    }
    return true;
}

/**
 * Add a song to the Spotify queue and send a reply message to Kick chat.
 */
export async function playSong(songQuery: string, username: string): Promise<void> {
    const spotifyApi = getSpotifyApi();
    if (!spotifyApi) return;
    let trackUri: string | null = null;
    let track: any = null;
    // Check if songQuery is a Spotify track URL
    const match = songQuery.match(/(?:https?:\/\/open\.spotify\.com\/track\/|spotify:track:)([a-zA-Z0-9]+)/);
    if (match && match[1]) {
        trackUri = `spotify:track:${match[1]}`;
        // Fetch track details for reply message
        try {
            const trackData = await spotifyApi.getTrack(match[1]);
            track = trackData.body;
        } catch {}
    } else {
        // Otherwise, search for the track
        const tracks = await spotifyApi.searchTracks(songQuery, { limit: 1, market: "TR" });
        if (!tracks.body.tracks.total) return;
        track = tracks.body.tracks.items[0];
        trackUri = track.uri;
    }
    if (trackUri) {
        await spotifyApi.addToQueue(trackUri).catch((err) => {
            logError(err, "playSong");
            console.error("Failed to add song to queue:", err);
        });
        // Send reply message if track info is available
        if (track) {
            const template = Config.get("songReplyMessage") || "Now playing: {title} by {artist} (requested by {user})";
            const reply = template
                .replace("{title}", track.name)
                .replace("{artist}", track.artists.map((a: any) => a.name).join(", "))
                .replace("{user}", username || "user");

            sendKickMessage(reply).catch((err) => {
                logError(err, "sendKickMessage");
                console.error("Failed to send Kick message:", err);
            });
        }
    }
}
