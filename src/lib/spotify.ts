import SpotifyWebApi from "spotify-web-api-node";
import Config from "./config";

let spotifyApi: SpotifyWebApi | null = null;

export function getSpotifyApi(): SpotifyWebApi {
    if (spotifyApi) return spotifyApi;

    const { spotifyClientId, spotifyClientSecret } = Config.getSecrets();

    if (!spotifyClientId || !spotifyClientSecret) {
        return null;
    }

    spotifyApi = new SpotifyWebApi({
        clientId: spotifyClientId,
        clientSecret: spotifyClientSecret,
        redirectUri: "http://127.0.0.1:8888/callback",
    });

    // Load tokens if any
    const tokens = Config.getSpotify();
    if (tokens?.accessToken) spotifyApi.setAccessToken(tokens.accessToken);
    if (tokens?.refreshToken) spotifyApi.setRefreshToken(tokens.refreshToken);

    return spotifyApi;
}

// Then update your token functions to call getSpotifyApi() instead of using spotifyApi directly:

export function loadTokens() {
    const { accessToken, expiresAt, refreshToken } = Config.getSpotify();
    if (accessToken && refreshToken && expiresAt) {
        getSpotifyApi().setAccessToken(accessToken);
        getSpotifyApi().setRefreshToken(refreshToken);
        return { accessToken, refreshToken, expiresAt };
    }
    return null;
}

// similarly for saveTokens, clearTokens, refreshAccessTokenIfNeeded, call getSpotifyApi() inside.

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
    Config.setSpotify({
        accessToken,
        refreshToken,
        expiresAt,
    });
    const api = getSpotifyApi();
    api.setAccessToken(accessToken);
    api.setRefreshToken(refreshToken);
}

export function clearTokens() {
    Config.clearSpotify();
    const api = getSpotifyApi();
    api.setAccessToken("");
    api.setRefreshToken("");
}

export async function refreshAccessTokenIfNeeded(window?: Electron.BrowserWindow): Promise<boolean> {
    const tokens = loadTokens();
    if (!tokens) return false;

    if (Date.now() >= tokens.expiresAt) {
        try {
            const api = getSpotifyApi();
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
