import SpotifyWebApi from "spotify-web-api-node";
import Config from "./config";
import { sendKickMessage } from "./kick";
import { logError, logInfo, logWarn, logDebug } from "./logger";
import { redactSecrets } from "./logger-utils";

let spotifyApi: SpotifyWebApi | null = null;
let refreshSpotifyTokenInterval: NodeJS.Timeout | null = null;

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
    const accessToken = Config.get("spotifyAccessToken");
    const refreshToken = Config.get("spotifyRefreshToken");
    if (accessToken) spotifyApi.setAccessToken(accessToken);
    if (refreshToken) spotifyApi.setRefreshToken(refreshToken);
    return spotifyApi;
}

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
    Config.set({
        spotifyAccessToken: accessToken,
        spotifyRefreshToken: refreshToken,
        spotifyExpiresAt: expiresAt,
    });
    const api = getSpotifyApi();
    if (api) {
        api.setAccessToken(accessToken);
        api.setRefreshToken(refreshToken);
    }
    logInfo("Spotify tokens saved", { expiresAt });
}

export function clearTokens() {
    Config.set({
        spotifyAccessToken: undefined,
        spotifyRefreshToken: undefined,
        spotifyExpiresAt: undefined,
    });
    const api = getSpotifyApi();
    if (api) {
        api.setAccessToken("");
        api.setRefreshToken("");
    }
    logInfo("Spotify tokens cleared");
}

export async function refreshSpotifyAccessToken(
    window?: Electron.BrowserWindow
): Promise<boolean> {
    const tokens = loadTokens();
    if (!tokens) return false;
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
        logInfo("Spotify access token refreshed");
        return true;
    } catch (error) {
        logError(error, "spotify:refreshSpotifyAccessToken");
        return false;
    }
}

export async function checkSpotifyAccessToken(
    window?: Electron.BrowserWindow
): Promise<boolean> {
    const tokens = loadTokens();
    if (!tokens) return false;
    if (Date.now() >= tokens.expiresAt) {
        return await refreshSpotifyAccessToken(window);
    }
    return true;
}

export async function playSong(
    songQuery: string,
    username: string
): Promise<void> {
    logDebug("playSong called", redactSecrets({ songQuery, username }));
    const spotifyApi = getSpotifyApi();
    if (!spotifyApi) {
        logError("Spotify API not configured", "spotify:playSong");
        return;
    }
    let trackUri: string | null = null;
    let track: any = null;
    // Updated regex to handle /intl-xx/ in the URL path and optional query params
    const match = songQuery.match(
        /(?:https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2,3}\/)?track\/|spotify:track:)([a-zA-Z0-9]+)/
    );
    if (match && match[1]) {
        trackUri = `spotify:track:${match[1]}`;
        try {
            const trackData = await spotifyApi.getTrack(match[1]);
            track = trackData.body;
        } catch (err) {
            logError(err, "spotify:playSong:getTrack");
        }
    } else {
        const tracks = await spotifyApi.searchTracks(songQuery, {
            limit: 1,
        });
        if (!tracks.body.tracks.total) {
            logWarn("No tracks found for query: " + songQuery, "spotify:playSong");
            return;
        }
        track = tracks.body.tracks.items[0];
        trackUri = track.uri;
    }
    if (trackUri) {
        logDebug("Adding to queue", redactSecrets({ trackUri, track }));
        await spotifyApi.addToQueue(trackUri).catch((err) => {
            logError(err, "spotify:playSong:addToQueue");
        });
        if (track) {
            const template =
                Config.get("songReplyMessage") ||
                "Now playing: {title} by {artist} (requested by {user})";
            const reply = template
                .replace("{title}", track.name)
                .replace(
                    "{artist}",
                    track.artists.map((a: any) => a.name).join(", ")
                )
                .replace("{user}", username || "user");

            logDebug("Sending Kick message", redactSecrets({ reply }));
            sendKickMessage(reply).catch((err) => {
                logError(err, "spotify:playSong:sendKickMessage");
            });
        }
    }
}

export async function startSpotifyTokenRefreshInterval(
    window: Electron.BrowserWindow
): Promise<void> {
    if (refreshSpotifyTokenInterval) {
        clearInterval(refreshSpotifyTokenInterval);
    }
    refreshSpotifyTokenInterval = setInterval(async () => {
        try {
            const valid = await checkSpotifyAccessToken(window);
            if (!valid) {
                logWarn("Failed to refresh Spotify access token", "spotify:startSpotifyTokenRefreshInterval");
                clearInterval(refreshSpotifyTokenInterval!);
                refreshSpotifyTokenInterval = null;
            }
        } catch (err) {
            logError(err, "spotify:startSpotifyTokenRefreshInterval");
        }
    }, 60 * 1000);
}

export function stopSpotifyTokenAutoRefresh() {
    if (refreshSpotifyTokenInterval) {
        clearInterval(refreshSpotifyTokenInterval);
        refreshSpotifyTokenInterval = null;
    }
}
