import SpotifyWebApi from "spotify-web-api-node";
import Config from "../../../core/config";
import { logError, logInfo, logWarn, logDebug } from "../../../core/logging";
import { redactSecrets } from "../../../core/logging/utils";
import fs from "fs";
import path from "path";

let spotifyApi: SpotifyWebApi | null = null;
let refreshSpotifyTokenInterval: NodeJS.Timeout | null = null;
let saveSongInterval: NodeJS.Timeout | null = null;
let currentSongInfo: { title: string; artist: string } | null = null;
let nextSaveTimeout: NodeJS.Timeout | null = null;
let songFileSavingEnabled = true;
let lastSavedSong: { title: string; artist: string } | null = null;
let songFileSavingInterval: NodeJS.Timeout | null = null;

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
        redirectUri:
            Config.get("spotifyRedirectUri") ||
            "http://127.0.0.1:8888/callback",
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
): Promise<{ title: string; artist: string } | null> {
    logDebug("playSong called", redactSecrets({ songQuery, username }));
    const spotifyApi = getSpotifyApi();
    if (!spotifyApi) {
        logError("Spotify API not configured", "spotify:playSong");
        return null;
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
            logWarn(
                "No tracks found for query: " + songQuery,
                "spotify:playSong"
            );
            return null;
        }
        track = tracks.body.tracks.items[0];
        trackUri = track.uri;
    }
    if (trackUri && track) {
        logDebug("Adding to queue", redactSecrets({ trackUri, track }));
        await spotifyApi.addToQueue(trackUri).catch((err) => {
            logError(err, "spotify:playSong:addToQueue");
        });

        return {
            title: track.name,
            artist: track.artists.map((a: any) => a.name).join(", "),
        };
    }

    return null;
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
                logWarn(
                    "Failed to refresh Spotify access token",
                    "spotify:startSpotifyTokenRefreshInterval"
                );
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

// Function to save current song to file
async function saveCurrentSongToFile() {
    if (!songFileSavingEnabled) {
        return;
    }

    try {
        const spotifyApi = getSpotifyApi();
        if (!spotifyApi) {
            return;
        }

        const playbackState = await spotifyApi.getMyCurrentPlaybackState();
        logDebug("Playback state retrieved", "saveCurrentSongToFile");

        if (!playbackState.body.is_playing || !playbackState.body.item) {
            return;
        }

        const item = playbackState.body.item;
        if (item.type !== "track") {
            return; // Only handle tracks, not episodes
        }

        const currentSong = {
            title: item.name,
            artist: item.artists[0]?.name || "Unknown Artist",
        };

        // Check if song has changed
        if (
            lastSavedSong &&
            lastSavedSong.title === currentSong.title &&
            lastSavedSong.artist === currentSong.artist
        ) {
            return; // Song hasn't changed, don't save
        }

        // Song has changed, save it
        await saveSongToFile(currentSong);
        lastSavedSong = currentSong;

        // Schedule next check based on song duration
        const songDuration = item.duration_ms;
        const nextCheckDelay = Math.min(songDuration + 5000, 300000); // Max 5 minutes
        logDebug(
            `Song changed, next check in ${Math.round(nextCheckDelay / 1000)}s`,
            "saveCurrentSongToFile"
        );

        if (songFileSavingInterval) {
            clearTimeout(songFileSavingInterval);
        }
        songFileSavingInterval = setTimeout(
            saveCurrentSongToFile,
            nextCheckDelay
        );
    } catch (error) {
        logError(error, "saveCurrentSongToFile");
    }
}

// Helper function to save song to file
async function saveSongToFile(songInfo: { title: string; artist: string }) {
    try {
        logDebug("saveSongToFile called", { songInfo });
        const saveToFile = Config.get("saveCurrentSongToFile");
        const filePath = Config.get("currentSongFilePath");

        logDebug("Song file saving config", { saveToFile, filePath });

        if (!saveToFile || !filePath) {
            logDebug("Song file saving disabled or no file path configured");
            return;
        }

        // Handle empty song info (no song playing)
        let songText = "";
        if (songInfo.title && songInfo.artist) {
            const currentSongFormat =
                Config.get("currentSongFormat") || "{title} - {artist}";
            songText = currentSongFormat
                .replace("{title}", songInfo.title)
                .replace("{artist}", songInfo.artist);
        }

        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filePath, songText, "utf-8");
        logDebug(`Current song saved to file: ${filePath}`, {
            songText: songText || "No song playing",
        });
    } catch (error) {
        logError(error, "spotify:saveSongToFile");
    }
}

// Start/stop song file saving
export function startSongFileSaving() {
    // Clear any existing intervals and timeouts
    if (saveSongInterval) {
        clearInterval(saveSongInterval);
    }
    if (nextSaveTimeout) {
        clearTimeout(nextSaveTimeout);
    }

    // Reset current song info
    currentSongInfo = null;

    // Start the first check immediately
    saveCurrentSongToFile();
    logInfo("Started saving current song to file");

    // Also set up a periodic check every 30 seconds as a fallback
    saveSongInterval = setInterval(() => {
        saveCurrentSongToFile();
    }, 30000);
}

export function stopSongFileSaving() {
    if (saveSongInterval) {
        clearInterval(saveSongInterval);
        saveSongInterval = null;
    }
    if (nextSaveTimeout) {
        clearTimeout(nextSaveTimeout);
        nextSaveTimeout = null;
    }

    // Clear current song info
    currentSongInfo = null;
    logInfo("Stopped saving current song to file");
}
