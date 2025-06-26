import SpotifyWebApi from "spotify-web-api-node";
import Config from "./config";

let spotifyApi: SpotifyWebApi | null = null;

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
    Config.set({ spotifyAccessToken: accessToken, spotifyRefreshToken: refreshToken, spotifyExpiresAt: expiresAt });
    const api = getSpotifyApi();
    if (api) {
        api.setAccessToken(accessToken);
        api.setRefreshToken(refreshToken);
    }
}

export function clearTokens() {
    Config.set({ spotifyAccessToken: undefined, spotifyRefreshToken: undefined, spotifyExpiresAt: undefined });
    const api = getSpotifyApi();
    if (api) {
        api.setAccessToken("");
        api.setRefreshToken("");
    }
}

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

export async function playSong(songQuery: string) {
    const spotifyApi = getSpotifyApi();
    if (!spotifyApi) return;
    let trackUri: string | null = null;
    // Check if songQuery is a Spotify track URL
    const match = songQuery.match(/(?:https?:\/\/open\.spotify\.com\/track\/|spotify:track:)([a-zA-Z0-9]+)/);
    if (match && match[1]) {
        trackUri = `spotify:track:${match[1]}`;
    } else {
        // Otherwise, search for the track
        const tracks = await spotifyApi.searchTracks(songQuery, { limit: 1, market: "TR" });
        if (!tracks.body.tracks.total) return;
        trackUri = tracks.body.tracks.items[0].uri;
    }
    if (trackUri) {
        spotifyApi.addToQueue(trackUri).catch(() => {});
    }
}
